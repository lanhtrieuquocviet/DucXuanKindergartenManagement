/**
 * PickupFaceAttendanceModal.jsx
 *
 * Modal điểm danh về bằng nhận diện khuôn mặt học sinh.
 *
 * Luồng:
 *  1. Camera phát hiện khuôn mặt học sinh liên tục
 *  2. Khi detect được → chụp frame → upload ảnh → gửi embedding + classId lên server
 *  3. Server match → tự động ghi checkout cho học sinh đó
 *  4. Hiển thị ảnh hồ sơ + ảnh vừa chụp để đối chiếu
 *  5. Cho phép nhập ghi chú, tích đồ mang về, chọn người đón (tối đa 2 phút)
 *  6. Cooldown 4 giây trước khi detect lại
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import FaceCamera from './FaceCamera';
import {
  matchStudentFaceForCheckout,
  uploadAttendanceImage,
  updateAttendanceReceiver,
  getApprovedPickupPersons,
} from '../../service/faceAttendance.api';

const COOLDOWN_MS = 4000;
const WAIT_MS = 120000; // 2 phút

const CHECKOUT_ITEMS = ['Ba lô', 'Hộp cơm', 'Bình nước', 'Thuốc', 'Áo đổi'];

export default function PickupFaceAttendanceModal({ open, onClose, classId, className, onCheckoutSuccess }) {
  const [matchResult, setMatchResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkedOutToday, setCheckedOutToday] = useState([]);

  const [pickupPersons, setPickupPersons] = useState([]);
  const [selectedReceiver, setSelectedReceiver] = useState(null);
  const [delivererSaved, setDelivererSaved] = useState(false);

  // Ghi chú & đồ mang về
  const [note, setNote] = useState('');
  const [checkoutBelongings, setCheckoutBelongings] = useState([]);
  const [checkoutOtherChecked, setCheckoutOtherChecked] = useState(false);
  const [checkoutOtherText, setCheckoutOtherText] = useState('');

  // Đếm ngược
  const [delivererCountdown, setDelivererCountdown] = useState(0);

  const cooldownRef = useRef(false);
  const waitingForDelivererRef = useRef(false);
  const delivererTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const cameraRef = useRef(null);

  // Reset khi đóng modal
  useEffect(() => {
    if (!open) {
      setMatchResult(null);
      setCheckedOutToday([]);
      setPickupPersons([]);
      setSelectedReceiver(null);
      setDelivererSaved(false);
      setNote('');
      setCheckoutBelongings([]);
      setCheckoutOtherChecked(false);
      setCheckoutOtherText('');
      setDelivererCountdown(0);
      cooldownRef.current = false;
      waitingForDelivererRef.current = false;
      if (delivererTimeoutRef.current) clearTimeout(delivererTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
  }, [open]);

  // ── Bắt đầu đếm ngược 2 phút ─────────────────────────────────────────────
  const startWait = useCallback(() => {
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
    }, WAIT_MS);
  }, []);

  // ── Lưu toàn bộ thông tin và tiếp tục quét ───────────────────────────────
  const handleSaveAll = useCallback(async () => {
    if (matchResult?.attendance?._id) {
      const finalCheckoutBelongings = [
        ...checkoutBelongings,
        ...(checkoutOtherChecked && checkoutOtherText.trim() ? [checkoutOtherText.trim()] : []),
      ];
      try {
        // receiverType = "Tên (Quan hệ)" — giống delivererType bên check-in
        const receiverType = selectedReceiver
          ? `${selectedReceiver.fullName} (${selectedReceiver.relation})`
          : '';
        // receiverOtherInfo = SĐT — giống delivererOtherInfo bên check-in
        const receiverOtherInfo = selectedReceiver?.phone || '';
        await updateAttendanceReceiver(
          matchResult.attendance._id,
          receiverType,
          receiverOtherInfo,
          note,
          finalCheckoutBelongings,
        );
        setDelivererSaved(true);
        toast.success('Đã lưu thông tin điểm danh về');
      } catch {
        toast.error('Không lưu được thông tin');
      }
    }
    waitingForDelivererRef.current = false;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (delivererTimeoutRef.current) clearTimeout(delivererTimeoutRef.current);
    setDelivererCountdown(0);
  }, [matchResult, selectedReceiver, note, checkoutBelongings, checkoutOtherChecked, checkoutOtherText]);

  // ── Callback nhận embedding từ FaceCamera ─────────────────────────────────
  const handleDetected = useCallback(
    async (embedding) => {
      if (waitingForDelivererRef.current || cooldownRef.current || isProcessing || !classId) return;

      cooldownRef.current = true;
      setIsProcessing(true);

      const capturedFrame = cameraRef.current?.captureFrame() || null;

      try {
        const today = new Date().toISOString().split('T')[0];

        let checkoutImageUrl = '';
        if (capturedFrame) {
          try { checkoutImageUrl = await uploadAttendanceImage(capturedFrame); } catch { /* không chặn */ }
        }

        const result = await matchStudentFaceForCheckout(embedding, classId, today, checkoutImageUrl);

        setMatchResult({ ...result, capturedFrame, timestamp: new Date() });

        if (result.status === 'success') {
          const studentId = result.student?._id;
          if (studentId && !checkedOutToday.includes(studentId)) {
            setCheckedOutToday((prev) => [...prev, studentId]);
            setDelivererSaved(false);
            setSelectedReceiver(null);
            setNote('');
            setCheckoutBelongings([]);
            setCheckoutOtherChecked(false);
            setCheckoutOtherText('');

            if (result.attendance?._id) {
              startWait();
            }

            getApprovedPickupPersons(studentId)
              .then((res) => {
                const persons = res?.data || [];
                setPickupPersons(persons);
                if (persons.length === 0) {
                  // Không có người đón duyệt → không cần đợi chọn người
                  // vẫn cho nhập note/đồ mang về
                }
              })
              .catch(() => {
                setPickupPersons([]);
              });

            toast.success(`Điểm danh về: ${result.student.fullName}`);
            onCheckoutSuccess?.();
          }
        } else if (result.status === 'already_checked_out') {
          toast.info(result.message);
        } else if (result.status === 'not_checked_in') {
          toast.warn(result.message);
        } else if (result.status === 'no_match') {
          toast.warn('Không nhận diện được khuôn mặt học sinh');
        } else if (result.status === 'ambiguous') {
          toast.warn('Khuôn mặt không rõ ràng — hãy đăng ký thêm góc mặt');
        } else if (result.status === 'no_data') {
          toast.info(result.message);
        }
      } catch (err) {
        console.error('Student checkout error:', err);
        toast.error('Lỗi khi nhận diện. Thử lại sau.');
      } finally {
        setIsProcessing(false);
        setTimeout(() => { cooldownRef.current = false; }, COOLDOWN_MS);
      }
    },
    [isProcessing, classId, checkedOutToday, startWait, onCheckoutSuccess]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1400] flex items-start sm:items-center justify-center bg-black/60 p-2 sm:p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 1rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-emerald-600 flex-shrink-0">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white">Điểm danh về — Nhận diện học sinh</h2>
            <p className="text-emerald-100 text-xs sm:text-sm">{className}</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-emerald-200 text-2xl font-bold leading-none">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

            {/* Cột trái: Camera */}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Hướng camera vào mặt học sinh</p>
              <div className="max-h-56 sm:max-h-none overflow-hidden rounded-xl">
                <FaceCamera
                  ref={cameraRef}
                  onDetected={handleDetected}
                  isActive={open}
                />
              </div>
              {isProcessing && (
                <div className="mt-2 flex items-center gap-2 text-emerald-600 text-sm">
                  <div className="animate-spin h-4 w-4 border-b-2 border-emerald-600 rounded-full" />
                  <span>Đang xác minh...</span>
                </div>
              )}

              {/* Thống kê – hiện dưới camera trên mobile */}
              <div className="mt-3 border rounded-xl p-3 bg-gray-50 md:hidden">
                <p className="text-xs text-gray-500 font-semibold mb-0.5">Phiên điểm danh về này</p>
                <p className="text-2xl font-bold text-emerald-600">{checkedOutToday.length}</p>
                <p className="text-xs text-gray-400">Học sinh đã điểm danh về</p>
              </div>
            </div>

            {/* Cột phải: Kết quả */}
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="border rounded-xl p-3 sm:p-4">
                <h3 className="font-semibold text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Kết quả xác minh</h3>

                {!matchResult && (
                  <div className="text-center text-gray-400 py-4 sm:py-6">
                    <span className="text-3xl sm:text-4xl">🧒</span>
                    <p className="text-sm mt-2">Đưa khuôn mặt học sinh vào camera</p>
                  </div>
                )}

                {matchResult?.status === 'success' && (
                  <div className="flex flex-col gap-2">
                    {/* Ảnh đối chiếu + tên */}
                    <div className="flex flex-col gap-2 p-2.5 sm:p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex gap-2 sm:gap-3">
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-full h-16 sm:h-24 rounded-lg overflow-hidden bg-gray-200 border-2 border-emerald-300">
                            {matchResult.student?.avatar ? (
                              <img src={matchResult.student.avatar} alt="Ảnh hồ sơ" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl">🧒</div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">Hồ sơ</p>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-full h-16 sm:h-24 rounded-lg overflow-hidden bg-gray-200 border-2 border-blue-300">
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
                        <p className="font-bold text-emerald-700 text-sm sm:text-base">{matchResult.student?.fullName}</p>
                        <p className="text-xs text-emerald-600">✓ Đã ghi điểm danh về</p>
                        <p className="text-xs text-gray-400">{matchResult.attendance?.timeString?.checkOut}</p>
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
                        className="w-full text-sm border border-gray-200 rounded p-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-300"
                      />
                    </div>

                    {/* Đồ mang về */}
                    <div className="border border-gray-200 rounded-lg p-2.5">
                      <p className="text-xs font-semibold text-gray-600 mb-1.5">Đồ mang về</p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                        {CHECKOUT_ITEMS.map((item) => (
                          <label key={item} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checkoutBelongings.includes(item)}
                              onChange={(e) =>
                                setCheckoutBelongings((prev) =>
                                  e.target.checked ? [...prev, item] : prev.filter((i) => i !== item)
                                )
                              }
                              className="w-4 h-4 accent-emerald-600 flex-shrink-0"
                            />
                            <span className="text-xs text-gray-600 leading-tight">{item}</span>
                          </label>
                        ))}
                        <label className="flex items-center gap-1.5 cursor-pointer col-span-2">
                          <input
                            type="checkbox"
                            checked={checkoutOtherChecked}
                            onChange={(e) => {
                              setCheckoutOtherChecked(e.target.checked);
                              if (!e.target.checked) setCheckoutOtherText('');
                            }}
                            className="w-4 h-4 accent-emerald-600 flex-shrink-0"
                          />
                          <span className="text-xs text-gray-600 leading-tight">Khác</span>
                        </label>
                        {checkoutOtherChecked && (
                          <input
                            type="text"
                            value={checkoutOtherText}
                            onChange={(e) => setCheckoutOtherText(e.target.value)}
                            placeholder="Nhập đồ mang về..."
                            className="col-span-2 text-xs border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-300"
                          />
                        )}
                      </div>
                    </div>

                    {/* Người đón */}
                    {matchResult.attendance?._id && (
                      <div className="border border-emerald-100 rounded-lg p-2.5 bg-emerald-50">
                        <p className="text-xs font-semibold text-emerald-700 mb-1.5">👤 Người đón hôm nay</p>
                        {delivererSaved ? (
                          <p className="text-xs text-green-600 font-medium">✓ Đã lưu</p>
                        ) : pickupPersons.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {pickupPersons.map((p) => (
                              <button
                                key={p._id}
                                onClick={() =>
                                  setSelectedReceiver(selectedReceiver?._id === p._id ? null : p)
                                }
                                className={`px-2.5 py-1.5 border rounded-full text-xs transition-colors ${
                                  selectedReceiver?._id === p._id
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white border-emerald-200 text-emerald-700 active:bg-emerald-100'
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
                          className="flex-1 py-2 bg-emerald-600 active:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Lưu &amp; Tiếp tục
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {matchResult?.status === 'already_checked_out' && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="font-medium text-yellow-700">{matchResult.student?.fullName}</p>
                    <p className="text-xs text-yellow-600">{matchResult.message}</p>
                  </div>
                )}

                {matchResult?.status === 'not_checked_in' && (
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm font-semibold text-orange-700">⚠ {matchResult.student?.fullName}</p>
                    <p className="text-xs text-orange-600 mt-1">{matchResult.message}</p>
                  </div>
                )}

                {matchResult?.status === 'no_match' && (
                  <div className="text-center py-4">
                    <span className="text-3xl">❌</span>
                    <p className="text-sm text-red-600 font-medium mt-2">Không nhận diện được khuôn mặt</p>
                    <p className="text-xs text-gray-400 mt-1">Học sinh chưa đăng ký khuôn mặt hoặc ảnh không rõ</p>
                  </div>
                )}

                {matchResult?.status === 'ambiguous' && (
                  <div className="text-center py-4">
                    <span className="text-3xl">⚠️</span>
                    <p className="text-sm text-orange-600 font-medium mt-2">Khuôn mặt không rõ ràng</p>
                    {matchResult.candidates?.length > 0 ? (
                      <div className="mt-2 text-left">
                        <p className="text-xs text-gray-500 mb-1 text-center">
                          Giống các học sinh sau:
                        </p>
                        <ul className="text-xs text-orange-700 space-y-0.5">
                          {matchResult.candidates.map((c, i) => (
                            <li key={i} className="flex justify-between px-2 py-0.5 bg-orange-50 rounded">
                              <span className="font-medium">{c.fullName}</span>
                              <span className="text-orange-400">({(parseFloat(c.similarity) * 100).toFixed(1)}%)</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-gray-400 mt-1 text-center">
                          Hãy đăng ký thêm góc mặt để phân biệt.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">
                        Khuôn mặt giống nhiều học sinh — không thể xác định chính xác.
                        Hãy đăng ký thêm góc mặt khác nhau.
                      </p>
                    )}
                  </div>
                )}

                {matchResult?.status === 'no_data' && (
                  <div className="text-center py-4 text-gray-400">
                    <span className="text-3xl">📋</span>
                    <p className="text-sm mt-2">{matchResult.message}</p>
                  </div>
                )}
              </div>

              {/* Thống kê – chỉ hiện trên desktop */}
              <div className="border rounded-xl p-3 sm:p-4 bg-gray-50 hidden md:block">
                <h3 className="font-semibold text-gray-600 mb-1 text-sm">Phiên điểm danh về này</h3>
                <p className="text-2xl font-bold text-emerald-600">{checkedOutToday.length}</p>
                <p className="text-xs text-gray-500">Học sinh đã điểm danh về</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t bg-gray-50 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 active:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
