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
 *  5. Cho phép nhập ghi chú, tích đồ mang đến/về, chọn người đưa (tối đa 2 phút)
 *  6. Cooldown 3 giây trước khi detect lại (tránh điểm danh 2 lần liên tiếp)
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

const MATCH_THRESHOLD = 0.87;
const MIN_MARGIN = 0.04;
const COOLDOWN_MS = 3000;
const DELIVERER_WAIT_MS = 120000; // 2 phút

const CHECKIN_ITEMS = ['Ba lô', 'Hộp cơm', 'Bình nước', 'Thuốc', 'Áo đổi'];

export default function FaceAttendanceModal({ open, onClose, classId, className, onCheckinSuccess }) {
  const { isOnline, pendingCount, isSyncing, saveOfflineRecord, syncNow } = useOfflineSync();

  // Trạng thái nhận diện
  const [matchResult, setMatchResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState([]);

  // Embeddings local (cho offline)
  const [localEmbeddings, setLocalEmbeddings] = useState([]);
  const [loadingEmbeddings, setLoadingEmbeddings] = useState(false);

  // Cooldown: ngừng detect tạm thời sau khi nhận diện
  const cooldownRef = useRef(false);

  // Tạm dừng detect khi đang chờ người dùng nhập thông tin
  const waitingForDelivererRef = useRef(false);
  const delivererTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Ref tới FaceCamera để gọi captureFrame()
  const cameraRef = useRef(null);

  // Người đưa
  const [pickupPersons, setPickupPersons] = useState([]);
  const [selectedDeliverer, setSelectedDeliverer] = useState(null);
  const [delivererSaved, setDelivererSaved] = useState(false);

  // Ghi chú & đồ mang đến
  const [note, setNote] = useState('');
  const [checkinBelongings, setCheckinBelongings] = useState([]);
  const [checkinOtherChecked, setCheckinOtherChecked] = useState(false);
  const [checkinOtherText, setCheckinOtherText] = useState('');

  // Đếm ngược
  const [delivererCountdown, setDelivererCountdown] = useState(0);

  // Reset checkedInToday khi classId thay đổi (tránh nhầm lớp trong offline mode)
  useEffect(() => {
    setCheckedInToday([]);
  }, [classId]);

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
      setSelectedDeliverer(null);
      setDelivererSaved(false);
      setNote('');
      setCheckinBelongings([]);
      setCheckinOtherChecked(false);
      setCheckinOtherText('');
      setDelivererCountdown(0);
      cooldownRef.current = false;
      waitingForDelivererRef.current = false;
      if (delivererTimeoutRef.current) clearTimeout(delivererTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
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

      const studentId = bestMatch.studentId || bestMatch._id;

      if (checkedInToday.includes(studentId)) {
        return {
          status: 'already_checked_in',
          student: { ...bestMatch, _id: studentId },
        };
      }

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

  // ── Bắt đầu thời gian chờ 2 phút + đếm ngược ─────────────────────────────
  const startDelivererWait = useCallback(() => {
    waitingForDelivererRef.current = true;
    setDelivererCountdown(120);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setDelivererCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          waitingForDelivererRef.current = false;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    if (delivererTimeoutRef.current) clearTimeout(delivererTimeoutRef.current);
    delivererTimeoutRef.current = setTimeout(() => {
      waitingForDelivererRef.current = false;
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setDelivererCountdown(0);
    }, DELIVERER_WAIT_MS);
  }, []);

  // ── Lưu toàn bộ thông tin và tiếp tục quét ───────────────────────────────
  const handleSaveAll = useCallback(async () => {
    if (matchResult?.attendance?._id) {
      const delivererType = selectedDeliverer
        ? `${selectedDeliverer.fullName} (${selectedDeliverer.relation})`
        : '';
      const delivererOtherInfo = selectedDeliverer?.phone || '';
      const finalCheckinBelongings = [
        ...checkinBelongings,
        ...(checkinOtherChecked && checkinOtherText.trim() ? [checkinOtherText.trim()] : []),
      ];
      try {
        await updateAttendanceDeliverer(
          matchResult.attendance._id,
          delivererType,
          delivererOtherInfo,
          note,
          finalCheckinBelongings,
          [],
        );
        if (selectedDeliverer) setDelivererSaved(true);
        toast.success('Đã lưu thông tin điểm danh');
      } catch {
        toast.error('Không lưu được thông tin');
      }
    }
    waitingForDelivererRef.current = false;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (delivererTimeoutRef.current) clearTimeout(delivererTimeoutRef.current);
    setDelivererCountdown(0);
  }, [matchResult, selectedDeliverer, note, checkinBelongings, checkinOtherChecked, checkinOtherText]);

  // ── Callback nhận embedding từ FaceCamera ─────────────────────────────────
  const handleDetected = useCallback(
    async (embedding) => {
      if (waitingForDelivererRef.current || cooldownRef.current || isProcessing || !classId) return;

      cooldownRef.current = true;
      setIsProcessing(true);

      const capturedFrame = cameraRef.current?.captureFrame() || null;

      try {
        let result;

        if (isOnline) {
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
          result = await matchOffline(embedding);
          if (!result) {
            result = { status: 'no_match', matched: false };
          }
        }

        setMatchResult({ ...result, isOnline, timestamp: new Date(), capturedFrame });

        if (result.status === 'success' && result.student?._id) {
          setCheckedInToday((prev) =>
            prev.includes(result.student._id) ? prev : [...prev, result.student._id]
          );
          setDelivererSaved(false);
          setSelectedDeliverer(null);
          setNote('');
          setCheckinBelongings([]);
          setCheckinOtherChecked(false);
          setCheckinOtherText('');

          if (result.attendance?._id) {
            startDelivererWait();
          }

          getApprovedPickupPersons(result.student._id)
            .then((res) => {
              setPickupPersons(res?.data || []);
            })
            .catch(() => {
              setPickupPersons([]);
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
        setTimeout(() => {
          cooldownRef.current = false;
        }, COOLDOWN_MS);
      }
    },
    [isProcessing, isOnline, classId, matchOffline, startDelivererWait]
  );

  if (!open) return null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[1400] flex items-start sm:items-center justify-center bg-black/60 p-2 sm:p-4">
      {/* Modal: chiều cao tối đa 100dvh trừ margin, có scroll nội dung */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 1rem)' }}
      >
        {/* Header – cố định trên cùng */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-blue-600 flex-shrink-0">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white">Điểm danh khuôn mặt</h2>
            <p className="text-blue-100 text-xs sm:text-sm">{className}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
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

        {/* Body – cuộn được */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

            {/* Cột trái: Camera */}
            <div>
              {loadingEmbeddings ? (
                <div className="flex items-center justify-center h-48 sm:h-64 bg-gray-50 rounded-xl">
                  <div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full mr-2" />
                  <span className="text-gray-500 text-sm">Đang tải dữ liệu lớp...</span>
                </div>
              ) : (
                /* Giới hạn chiều cao camera trên mobile để còn chỗ cho form bên dưới */
                <div className="max-h-56 sm:max-h-none overflow-hidden rounded-xl">
                  <FaceCamera
                    ref={cameraRef}
                    onDetected={handleDetected}
                    isActive={open && !loadingEmbeddings}
                  />
                </div>
              )}

              {isProcessing && (
                <div className="mt-2 flex items-center gap-2 text-blue-600 text-sm">
                  <div className="animate-spin h-4 w-4 border-b-2 border-blue-600 rounded-full" />
                  <span>Đang nhận diện...</span>
                </div>
              )}

              {/* Thống kê session – đặt dưới camera trên mobile, ẩn ở desktop (hiện bên phải) */}
              <div className="mt-3 border rounded-xl p-3 md:hidden">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{checkedInToday.length}</div>
                    <div className="text-xs text-gray-500">Đã điểm danh</div>
                  </div>
                  {!isOnline && pendingCount > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-500">{pendingCount}</div>
                      <div className="text-xs text-gray-500">Chờ sync</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cột phải: Kết quả + Thống kê */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Kết quả nhận diện */}
              <div className="border rounded-xl p-3 sm:p-4">
                <h3 className="font-semibold text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">
                  Kết quả nhận diện
                </h3>

                {!matchResult && (
                  <div className="text-center text-gray-400 py-4 sm:py-6">
                    <span className="text-3xl sm:text-4xl">👤</span>
                    <p className="text-sm mt-2">Đưa khuôn mặt vào camera</p>
                  </div>
                )}

                {matchResult?.status === 'success' && (
                  <div className="flex flex-col gap-2">
                    {/* Ảnh đối chiếu + tên */}
                    <div className="flex flex-col gap-2 p-2.5 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex gap-2 sm:gap-3">
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gray-200 border-2 border-green-300">
                            {matchResult.student?.avatar ? (
                              <img src={matchResult.student.avatar} alt="Ảnh hồ sơ" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl">👦</div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">Hồ sơ</p>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gray-200 border-2 border-blue-300">
                            {matchResult.capturedFrame ? (
                              <img src={matchResult.capturedFrame} alt="Ảnh vừa chụp" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl">📷</div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">Vừa chụp</p>
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-green-700 text-sm sm:text-base">{matchResult.student?.fullName}</p>
                        <p className="text-xs text-green-600">
                          ✓ Điểm danh thành công{!matchResult.isOnline && ' (offline)'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {matchResult.timestamp?.toLocaleTimeString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    {/* Ghi chú */}
                    <div className="border border-gray-200 rounded-lg p-2.5">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Ghi chú</p>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Nhập ghi chú (nếu có)..."
                        rows={2}
                        className="w-full text-sm border border-gray-200 rounded p-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-300"
                      />
                    </div>

                    {/* Đồ mang đến */}
                    <div className="border border-gray-200 rounded-lg p-2.5">
                      <p className="text-xs font-semibold text-gray-600 mb-1.5">Đồ mang đến</p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                        {CHECKIN_ITEMS.map((item) => (
                          <label key={item} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checkinBelongings.includes(item)}
                              onChange={(e) =>
                                setCheckinBelongings((prev) =>
                                  e.target.checked ? [...prev, item] : prev.filter((i) => i !== item)
                                )
                              }
                              className="w-4 h-4 accent-blue-600 flex-shrink-0"
                            />
                            <span className="text-xs text-gray-600 leading-tight">{item}</span>
                          </label>
                        ))}
                        <label className="flex items-center gap-1.5 cursor-pointer col-span-2">
                          <input
                            type="checkbox"
                            checked={checkinOtherChecked}
                            onChange={(e) => {
                              setCheckinOtherChecked(e.target.checked);
                              if (!e.target.checked) setCheckinOtherText('');
                            }}
                            className="w-4 h-4 accent-blue-600 flex-shrink-0"
                          />
                          <span className="text-xs text-gray-600 leading-tight">Khác</span>
                        </label>
                        {checkinOtherChecked && (
                          <input
                            type="text"
                            value={checkinOtherText}
                            onChange={(e) => setCheckinOtherText(e.target.value)}
                            placeholder="Nhập đồ mang đến..."
                            className="col-span-2 text-xs border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300"
                          />
                        )}
                      </div>
                    </div>

                    {/* Người đưa */}
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
                                onClick={() =>
                                  setSelectedDeliverer(selectedDeliverer?._id === p._id ? null : p)
                                }
                                className={`px-2.5 py-1.5 border rounded-full text-xs transition-colors ${
                                  selectedDeliverer?._id === p._id
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white border-blue-200 text-blue-700 active:bg-blue-100'
                                }`}
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

                    {/* Đếm ngược + nút Lưu */}
                    {matchResult.attendance?._id && !delivererSaved && (
                      <div className="flex items-center gap-2 pt-1">
                        {delivererCountdown > 0 && (
                          <span className="text-xs text-orange-500 font-semibold tabular-nums whitespace-nowrap">
                            {Math.floor(delivererCountdown / 60)}:{String(delivererCountdown % 60).padStart(2, '0')}
                          </span>
                        )}
                        <button
                          onClick={handleSaveAll}
                          className="flex-1 py-2 bg-blue-600 active:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Lưu &amp; Tiếp tục
                        </button>
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

              {/* Thống kê session – chỉ hiện trên desktop (mobile đã hiện dưới camera) */}
              <div className="border rounded-xl p-3 sm:p-4 hidden md:block">
                <h3 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">Phiên điểm danh này</h3>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{checkedInToday.length}</div>
                    <div className="text-xs text-gray-500">Đã điểm danh</div>
                  </div>
                  {!isOnline && pendingCount > 0 && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-500">{pendingCount}</div>
                      <div className="text-xs text-gray-500">Chờ sync</div>
                    </div>
                  )}
                </div>
              </div>

              {isOnline && pendingCount > 0 && (
                <button
                  onClick={syncNow}
                  disabled={isSyncing}
                  className="w-full py-2 bg-orange-500 active:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {isSyncing ? 'Đang sync...' : `Sync ${pendingCount} bản ghi offline`}
                </button>
              )}

              {!isOnline && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700">
                  <strong>Chế độ offline:</strong> Dữ liệu được lưu trên thiết bị và sẽ tự động
                  đồng bộ khi có mạng.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer – cố định dưới cùng */}
        <div className="px-4 sm:px-6 py-3 border-t bg-gray-50 flex justify-between items-center flex-shrink-0">
          <span className="text-xs text-gray-400">
            Đã tải {localEmbeddings.length} khuôn mặt
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 active:bg-gray-300 text-gray-700 rounded-lg text-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
