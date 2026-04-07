/**
 * FaceAttendanceModal.jsx
 *
 * Modal điểm danh bằng nhận diện khuôn mặt cho giáo viên.
 *
 * Chế độ hoạt động:
 *  - ONLINE: gửi embedding lên server → server match → tự động check-in
 *  - OFFLINE: so sánh embedding locally với data đã tải → lưu IndexedDB → sync sau
 *
 * Luồng UI:
 *  1. Mở modal → tải model AI + tải embeddings lớp về local
 *  2. Bật camera → phát hiện khuôn mặt liên tục
 *  3. Khi detect được → gọi match (online hoặc offline)
 *  4. Hiển thị kết quả: tên học sinh + avatar + thông báo
 *  5. Cooldown 3 giây trước khi detect lại (tránh điểm danh 2 lần liên tiếp)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import FaceCamera from './FaceCamera';
import { matchFaceEmbedding, getClassEmbeddings, uploadAttendanceImage, updateAttendanceDeliverer, getApprovedPickupPersons } from '../../service/faceAttendance.api';
import { useOfflineSync } from '../../hooks/useOfflineSync';

// Cosine similarity (dùng khi offline - giống backend)
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return -1;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const MATCH_THRESHOLD = 0.87; // Phải khớp với backend - tăng lên để giảm false positive
const MIN_MARGIN = 0.04;      // Margin tối thiểu giữa kết quả 1 và 2 để tránh nhầm
const COOLDOWN_MS = 3000;     // Chờ 3 giây sau mỗi lần nhận diện

export default function FaceAttendanceModal({ open, onClose, classId, className, onCheckinSuccess }) {
  const { isOnline, pendingCount, isSyncing, saveOfflineRecord, syncNow } = useOfflineSync();

  // Trạng thái nhận diện
  const [matchResult, setMatchResult] = useState(null); // kết quả nhận diện gần nhất
  const [isProcessing, setIsProcessing] = useState(false); // đang gọi API
  const [checkedInToday, setCheckedInToday] = useState([]); // ds đã điểm danh trong session

  // Embeddings local (cho offline)
  const [localEmbeddings, setLocalEmbeddings] = useState([]);
  const [loadingEmbeddings, setLoadingEmbeddings] = useState(false);

  // Cooldown: ngừng detect tạm thời sau khi nhận diện
  const cooldownRef = useRef(false);

  // Tạm dừng detect khi đang chờ người dùng chọn người đưa
  const waitingForDelivererRef = useRef(false);
  const delivererTimeoutRef = useRef(null);

  // Ref tới FaceCamera để gọi captureFrame()
  const cameraRef = useRef(null);

  // Người đưa
  const [pickupPersons, setPickupPersons] = useState([]); // ds người đón đã duyệt
  const [delivererSaved, setDelivererSaved] = useState(false); // đã lưu người đưa chưa

  // ── Tải embeddings về local khi modal mở ─────────────────────────────────
  useEffect(() => {
    if (!open || !classId) return;

    setLoadingEmbeddings(true);
    getClassEmbeddings(classId)
      .then((res) => {
        setLocalEmbeddings(res.data || []);
        if ((res.data || []).length === 0) {
          toast.warn('Lớp này chưa có học sinh nào đăng ký khuôn mặt');
        }
      })
      .catch(() => {
        toast.error('Không thể tải dữ liệu khuôn mặt. Kiểm tra kết nối.');
      })
      .finally(() => setLoadingEmbeddings(false));
  }, [open, classId]);

  // Reset khi đóng modal
  useEffect(() => {
    if (!open) {
      setMatchResult(null);
      setCheckedInToday([]);
      setPickupPersons([]);
      setDelivererSaved(false);
      cooldownRef.current = false;
      waitingForDelivererRef.current = false;
      if (delivererTimeoutRef.current) clearTimeout(delivererTimeoutRef.current);
    }
  }, [open]);

  // ── Xử lý offline match ────────────────────────────────────────────────────
  const matchOffline = useCallback(
    async (embedding) => {
      if (localEmbeddings.length === 0) return null;

      let bestMatch = null;
      let bestSim = -1;
      let secondBestSim = -1;

      for (const student of localEmbeddings) {
        // Xét tất cả góc mặt (multi-angle), lấy similarity cao nhất
        const embs = Array.isArray(student.embeddings) && student.embeddings.length > 0
          ? student.embeddings
          : [student.embedding];
        const sim = Math.max(...embs.map((e) => cosineSimilarity(embedding, e)));
        if (sim > bestSim) {
          secondBestSim = bestSim;
          bestSim = sim;
          bestMatch = student;
        } else if (sim > secondBestSim) {
          secondBestSim = sim;
        }
      }

      if (bestSim < MATCH_THRESHOLD) return null;
      if (secondBestSim > 0.78 && (bestSim - secondBestSim) < MIN_MARGIN) return null;

      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Chuẩn hóa: dùng _id thống nhất với kết quả online
      const studentId = bestMatch.studentId || bestMatch._id;

      // Kiểm tra đã điểm danh trong session này chưa
      if (checkedInToday.includes(studentId)) {
        return {
          status: 'already_checked_in',
          student: { ...bestMatch, _id: studentId },
        };
      }

      // Lưu vào IndexedDB
      await saveOfflineRecord({
        studentId,
        classId: bestMatch.classId,
        date: today,
        checkInTime: now.toISOString(),
        checkInTimeString: timeStr,
      });

      setCheckedInToday((prev) => [...prev, studentId]);
      return {
        status: 'success',
        student: { ...bestMatch, _id: studentId },
        similarity: bestSim.toFixed(4),
      };
    },
    [localEmbeddings, checkedInToday, saveOfflineRecord]
  );

  // ── Callback nhận embedding từ FaceCamera ─────────────────────────────────
  const handleDetected = useCallback(
    async (embedding) => {
      // Bỏ qua nếu đang trong cooldown, chờ chọn người đưa, đang xử lý, hoặc thiếu classId
      if (waitingForDelivererRef.current || cooldownRef.current || isProcessing || !classId) return;

      cooldownRef.current = true;
      setIsProcessing(true);

      // Chụp frame ngay tại thời điểm nhận diện
      const capturedFrame = cameraRef.current?.captureFrame() || null;

      try {
        let result;

        if (isOnline) {
          // ── ONLINE: upload ảnh trước, rồi gửi embedding + URL lên server ──
          const today = new Date().toISOString().split('T')[0];
          let checkinImageUrl = '';
          if (capturedFrame) {
            try {
              checkinImageUrl = await uploadAttendanceImage(capturedFrame);
            } catch {
              // Không chặn điểm danh nếu upload ảnh lỗi
            }
          }
          result = await matchFaceEmbedding(embedding, classId, today, checkinImageUrl);
        } else {
          // ── OFFLINE: so sánh local ─────────────────────────────────────────
          result = await matchOffline(embedding);
          if (!result) {
            result = { status: 'no_match', matched: false };
          }
        }

        setMatchResult({ ...result, isOnline, timestamp: new Date(), capturedFrame });

        // Cập nhật ds đã điểm danh (cho online)
        if (result.status === 'success' && result.student?._id) {
          setCheckedInToday((prev) =>
            prev.includes(result.student._id) ? prev : [...prev, result.student._id]
          );
          setDelivererSaved(false);
          // Tải danh sách người đón đã duyệt cho học sinh này
          if (result.attendance?._id) {
            // Tạm dừng camera cho đến khi chọn xong người đưa (tối đa 30s)
            waitingForDelivererRef.current = true;
            if (delivererTimeoutRef.current) clearTimeout(delivererTimeoutRef.current);
            delivererTimeoutRef.current = setTimeout(() => {
              waitingForDelivererRef.current = false;
            }, 30000);
          }
          getApprovedPickupPersons(result.student._id)
            .then((res) => {
              const persons = res?.data || [];
              setPickupPersons(persons);
              // Nếu không có người đón nào được duyệt thì không cần chờ
              if (persons.length === 0) {
                waitingForDelivererRef.current = false;
                if (delivererTimeoutRef.current) clearTimeout(delivererTimeoutRef.current);
              }
            })
            .catch(() => {
              setPickupPersons([]);
              waitingForDelivererRef.current = false;
              if (delivererTimeoutRef.current) clearTimeout(delivererTimeoutRef.current);
            });
          toast.success(`Điểm danh: ${result.student.fullName}`);
          onCheckinSuccess?.();
        } else if (result.status === 'already_checked_in') {
          toast.info(`${result.student?.fullName || 'Học sinh'} đã điểm danh rồi`);
        } else if (result.status === 'no_match') {
          toast.warn('Không nhận diện được khuôn mặt');
        } else if (result.status === 'ambiguous') {
          toast.warn('Khuôn mặt không rõ ràng — hãy đăng ký thêm góc mặt để tăng độ chính xác');
        }
      } catch (err) {
        console.error('Match error:', err);
        toast.error('Lỗi khi nhận diện. Thử lại sau.');
      } finally {
        setIsProcessing(false);
        // Cooldown 3 giây trước khi detect lại
        setTimeout(() => {
          cooldownRef.current = false;
        }, COOLDOWN_MS);
      }
    },
    [isProcessing, isOnline, classId, matchOffline]
  );

  if (!open) return null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-600">
          <div>
            <h2 className="text-xl font-bold text-white">Điểm danh khuôn mặt</h2>
            <p className="text-blue-100 text-sm">{className}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Chỉ báo online/offline */}
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                isOnline ? 'bg-green-400 text-white' : 'bg-orange-400 text-white'
              }`}
            >
              {isOnline ? '● Online' : '● Offline'}
            </span>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 text-2xl font-bold leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cột trái: Camera */}
          <div>
            {loadingEmbeddings ? (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl">
                <div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full mr-2" />
                <span className="text-gray-500 text-sm">Đang tải dữ liệu lớp...</span>
              </div>
            ) : (
              <FaceCamera
                ref={cameraRef}
                onDetected={handleDetected}
                isActive={open && !loadingEmbeddings}
              />
            )}

            {/* Đang xử lý indicator */}
            {isProcessing && (
              <div className="mt-2 flex items-center gap-2 text-blue-600 text-sm">
                <div className="animate-spin h-4 w-4 border-b-2 border-blue-600 rounded-full" />
                <span>Đang nhận diện...</span>
              </div>
            )}
          </div>

          {/* Cột phải: Kết quả + Thống kê */}
          <div className="flex flex-col gap-4">
            {/* Kết quả nhận diện gần nhất */}
            <div className="border rounded-xl p-4 min-h-36">
              <h3 className="font-semibold text-gray-700 mb-3">Kết quả nhận diện</h3>

              {!matchResult && (
                <div className="text-center text-gray-400 py-6">
                  <span className="text-4xl">👤</span>
                  <p className="text-sm mt-2">Đưa khuôn mặt vào camera</p>
                </div>
              )}

              {matchResult?.status === 'success' && (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    {/* Hai ảnh đối chiếu */}
                    <div className="flex gap-3">
                      {/* Ảnh hồ sơ / đại diện */}
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-200 border-2 border-green-300">
                          {matchResult.student?.avatar ? (
                            <img
                              src={matchResult.student.avatar}
                              alt="Ảnh hồ sơ"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">👦</div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Hồ sơ</p>
                      </div>
                      {/* Ảnh vừa chụp */}
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-200 border-2 border-blue-300">
                          {matchResult.capturedFrame ? (
                            <img
                              src={matchResult.capturedFrame}
                              alt="Ảnh vừa chụp"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">📷</div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Vừa chụp</p>
                      </div>
                    </div>
                    {/* Tên + trạng thái */}
                    <div>
                      <p className="font-bold text-green-700">
                        {matchResult.student?.fullName}
                      </p>
                      <p className="text-xs text-green-600">
                        ✓ Điểm danh thành công{' '}
                        {!matchResult.isOnline && '(offline)'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {matchResult.timestamp?.toLocaleTimeString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  {/* Chọn người đưa */}
                  {matchResult.attendance?._id && (
                    <div className="border border-blue-100 rounded-lg p-2.5 bg-blue-50">
                      <p className="text-xs font-semibold text-blue-700 mb-1.5">👤 Người đưa hôm nay</p>
                      {delivererSaved ? (
                        <p className="text-xs text-green-600 font-medium">✓ Đã lưu</p>
                      ) : pickupPersons.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {pickupPersons.map((p) => (
                            <button
                              key={p._id}
                              onClick={async () => {
                                try {
                                  await updateAttendanceDeliverer(
                                    matchResult.attendance._id,
                                    `${p.fullName} (${p.relation})`,
                                    p.phone
                                  );
                                  setDelivererSaved(true);
                                  waitingForDelivererRef.current = false;
                                  if (delivererTimeoutRef.current) clearTimeout(delivererTimeoutRef.current);
                                  toast.success(`Đã ghi nhận: ${p.fullName}`);
                                } catch {
                                  toast.error('Không lưu được người đưa.');
                                }
                              }}
                              className="px-2 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              {p.fullName} · {p.relation}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Chưa có người đón đã duyệt</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {matchResult?.status === 'already_checked_in' && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="font-medium text-yellow-700">
                    {matchResult.student?.fullName || 'Học sinh'}
                  </p>
                  <p className="text-xs text-yellow-600">Đã điểm danh rồi</p>
                </div>
              )}

              {matchResult?.status === 'no_match' && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-center">
                  <p className="text-red-600 font-medium">Không nhận diện được</p>
                  <p className="text-xs text-red-400 mt-1">
                    Hãy chắc chắn khuôn mặt đã đăng ký
                  </p>
                </div>
              )}

              {matchResult?.status === 'ambiguous' && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-center">
                  <p className="text-2xl mb-1">⚠️</p>
                  <p className="text-orange-700 font-medium text-sm">Khuôn mặt không rõ ràng</p>
                  <p className="text-xs text-orange-500 mt-1">
                    Giống nhiều học sinh, không thể xác định chính xác.
                    Hãy đăng ký thêm góc mặt.
                  </p>
                </div>
              )}

              {matchResult?.status === 'no_data' && (
                <div className="p-3 bg-gray-50 rounded-lg border text-center">
                  <p className="text-gray-600 text-sm">
                    Lớp chưa có học sinh đăng ký khuôn mặt
                  </p>
                </div>
              )}
            </div>

            {/* Thống kê session */}
            <div className="border rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Phiên điểm danh này</h3>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {checkedInToday.length}
                  </div>
                  <div className="text-xs text-gray-500">Đã điểm danh</div>
                </div>
                {!isOnline && pendingCount > 0 && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-500">
                      {pendingCount}
                    </div>
                    <div className="text-xs text-gray-500">Chờ sync</div>
                  </div>
                )}
              </div>
            </div>

            {/* Nút sync thủ công: hiện khi có mạng VÀ còn dữ liệu chờ */}
            {isOnline && pendingCount > 0 && (
              <button
                onClick={syncNow}
                disabled={isSyncing}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {isSyncing ? 'Đang sync...' : `Sync ${pendingCount} bản ghi offline`}
              </button>
            )}

            {/* Thông báo offline */}
            {!isOnline && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700">
                <strong>Chế độ offline:</strong> Dữ liệu được lưu trên thiết bị và sẽ tự động
                đồng bộ khi có mạng.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-gray-50 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            Đã tải {localEmbeddings.length} khuôn mặt
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
