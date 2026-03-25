/**
 * PickupFaceAttendanceModal.jsx
 *
 * Modal điểm danh về bằng nhận diện khuôn mặt người đến đón.
 *
 * Luồng:
 *  1. Camera phát hiện khuôn mặt người đến đón liên tục
 *  2. Khi detect được → chụp frame → upload ảnh → gửi embedding + classId lên server
 *  3. Server match với danh sách người đưa/đón đã duyệt của cả lớp
 *  4. Nếu khớp → server tự động ghi checkout cho học sinh tương ứng
 *  5. Hiển thị: tên người đón + tên học sinh được đón
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import FaceCamera from './FaceCamera';
import { matchPickupFaceForCheckout, uploadAttendanceImage } from '../../service/faceAttendance.api';

const COOLDOWN_MS = 4000;

export default function PickupFaceAttendanceModal({ open, onClose, classId, className, onCheckoutSuccess }) {
  const [matchResult, setMatchResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkedOutToday, setCheckedOutToday] = useState([]);

  const cooldownRef = useRef(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setMatchResult(null);
      setCheckedOutToday([]);
      cooldownRef.current = false;
    }
  }, [open]);

  const handleDetected = useCallback(
    async (embedding) => {
      if (cooldownRef.current || isProcessing || !classId) return;

      cooldownRef.current = true;
      setIsProcessing(true);

      // Chụp frame ngay lúc nhận diện
      const capturedFrame = cameraRef.current?.captureFrame() || null;

      try {
        const today = new Date().toISOString().split('T')[0];

        // Upload ảnh trước
        let checkoutImageUrl = '';
        if (capturedFrame) {
          try { checkoutImageUrl = await uploadAttendanceImage(capturedFrame); } catch { /* không chặn */ }
        }

        const result = await matchPickupFaceForCheckout(embedding, classId, today, checkoutImageUrl);

        setMatchResult({ ...result, capturedFrame, timestamp: new Date() });

        if (result.status === 'success') {
          const studentId = result.student?._id;
          if (studentId && !checkedOutToday.includes(studentId)) {
            setCheckedOutToday((prev) => [...prev, studentId]);
            toast.success(`Điểm danh về: ${result.student.fullName}`);
            onCheckoutSuccess?.();
          }
        } else if (result.status === 'too_early') {
          toast.error('Chưa đến 17:00 — chưa được điểm danh về');
          onClose();
        } else if (result.status === 'not_checked_in') {
          toast.warn(result.message);
        } else if (result.status === 'no_match') {
          toast.warn('Không nhận diện được — không có trong danh sách đưa đón');
        } else if (result.status === 'no_data') {
          toast.info(result.message);
        }
      } catch (err) {
        console.error('Pickup checkout error:', err);
        toast.error('Lỗi khi nhận diện. Thử lại sau.');
      } finally {
        setIsProcessing(false);
        setTimeout(() => { cooldownRef.current = false; }, COOLDOWN_MS);
      }
    },
    [isProcessing, classId, checkedOutToday, onCheckoutSuccess]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-emerald-600">
          <div>
            <h2 className="text-xl font-bold text-white">Điểm danh về — Nhận diện người đón</h2>
            <p className="text-emerald-100 text-sm">{className}</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-emerald-200 text-2xl font-bold leading-none">×</button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cột trái: Camera */}
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Hướng camera vào mặt người đến đón</p>
            <FaceCamera
              ref={cameraRef}
              onDetected={handleDetected}
              isActive={open}
            />
            {isProcessing && (
              <div className="mt-2 flex items-center gap-2 text-emerald-600 text-sm">
                <div className="animate-spin h-4 w-4 border-b-2 border-emerald-600 rounded-full" />
                <span>Đang xác minh...</span>
              </div>
            )}
          </div>

          {/* Cột phải: Kết quả */}
          <div className="flex flex-col gap-4">
            {/* Kết quả nhận diện */}
            <div className="border rounded-xl p-4 min-h-40">
              <h3 className="font-semibold text-gray-700 mb-3">Kết quả xác minh</h3>

              {!matchResult && (
                <div className="text-center text-gray-400 py-6">
                  <span className="text-4xl">🚶</span>
                  <p className="text-sm mt-2">Đưa khuôn mặt người đến đón vào camera</p>
                </div>
              )}

              {matchResult?.status === 'success' && (
                <div className="space-y-3">
                  {/* Người đón */}
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-emerald-300">
                      {matchResult.capturedFrame ? (
                        <img src={matchResult.capturedFrame} alt="Ảnh người đón" className="w-full h-full object-cover" />
                      ) : matchResult.person?.imageUrl ? (
                        <img src={matchResult.person.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600 font-medium">Người đón</p>
                      <p className="font-bold text-emerald-700">{matchResult.person?.fullName}</p>
                      <p className="text-xs text-emerald-600">{matchResult.person?.relation} · {matchResult.person?.phone}</p>
                    </div>
                  </div>

                  {/* Học sinh được đón */}
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {matchResult.student?.avatar ? (
                        <img src={matchResult.student.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🧒</div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-blue-500 font-medium">Học sinh được đón về</p>
                      <p className="font-bold text-blue-700">{matchResult.student?.fullName}</p>
                      <p className="text-xs text-blue-500">✓ Đã ghi điểm danh về · {matchResult.attendance?.timeString?.checkOut}</p>
                    </div>
                  </div>
                </div>
              )}

              {matchResult?.status === 'not_checked_in' && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-semibold text-yellow-700">⚠ {matchResult.person?.fullName}</p>
                  <p className="text-xs text-yellow-600 mt-1">{matchResult.message}</p>
                </div>
              )}

              {matchResult?.status === 'no_match' && (
                <div className="text-center py-4">
                  <span className="text-3xl">❌</span>
                  <p className="text-sm text-red-600 font-medium mt-2">Không tìm thấy trong danh sách</p>
                  <p className="text-xs text-gray-400 mt-1">Người này chưa được đăng ký hoặc chưa duyệt</p>
                </div>
              )}

              {matchResult?.status === 'no_data' && (
                <div className="text-center py-4 text-gray-400">
                  <span className="text-3xl">📋</span>
                  <p className="text-sm mt-2">{matchResult.message}</p>
                </div>
              )}
            </div>

            {/* Thống kê session */}
            <div className="border rounded-xl p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-600 mb-1 text-sm">Phiên điểm danh về này</h3>
              <p className="text-2xl font-bold text-emerald-600">{checkedOutToday.length}</p>
              <p className="text-xs text-gray-500">Học sinh đã điểm danh về</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
