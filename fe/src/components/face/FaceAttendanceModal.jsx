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
import { matchFaceEmbedding, getClassEmbeddings, uploadAttendanceImage } from '../../service/faceAttendance.api';
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

const MATCH_THRESHOLD = 0.82; // Phải khớp với backend - tăng lên để giảm false positive
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

  // Ref tới FaceCamera để gọi captureFrame()
  const cameraRef = useRef(null);

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
      cooldownRef.current = false;
    }
  }, [open]);

  // ── Xử lý offline match ────────────────────────────────────────────────────
  const matchOffline = useCallback(
    async (embedding) => {
      if (localEmbeddings.length === 0) return null;

      let bestMatch = null;
      let bestSim = -1;

      for (const student of localEmbeddings) {
        const sim = cosineSimilarity(embedding, student.embedding);
        if (sim > bestSim) {
          bestSim = sim;
          bestMatch = student;
        }
      }

      if (bestSim < MATCH_THRESHOLD) return null;

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
      // Bỏ qua nếu đang trong cooldown, đang xử lý, hoặc thiếu classId
      if (cooldownRef.current || isProcessing || !classId) return;

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
          toast.success(`Điểm danh: ${result.student.fullName}`);
          onCheckinSuccess?.();
        } else if (result.status === 'already_checked_in') {
          toast.info(`${result.student?.fullName || 'Học sinh'} đã điểm danh rồi`);
        } else if (result.status === 'no_match') {
          toast.warn('Không nhận diện được khuôn mặt');
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
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-green-300">
                    {matchResult.capturedFrame ? (
                      <img
                        src={matchResult.capturedFrame}
                        alt="Ảnh điểm danh"
                        className="w-full h-full object-cover"
                      />
                    ) : matchResult.student?.avatar ? (
                      <img
                        src={matchResult.student.avatar}
                        alt={matchResult.student.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        👦
                      </div>
                    )}
                  </div>
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
