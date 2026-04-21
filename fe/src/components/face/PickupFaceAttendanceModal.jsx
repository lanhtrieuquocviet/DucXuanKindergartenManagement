/**
 * PickupFaceAttendanceModal.jsx
 *
 * Modal quét khuôn mặt điểm danh về cho giáo viên.
 *
 * Khi nhận diện được học sinh, gọi onStudentRecognized() để mở form
 * checkout chi tiết — không nhập thông tin tại đây.
 * Ảnh checkout được chụp tự động từ thời điểm AI quét và truyền sang form.
 *
 * Luồng:
 *  1. Camera phát hiện khuôn mặt học sinh liên tục
 *  2. Khi detect được → chụp frame → upload ảnh → gửi embedding + classId lên server
 *  3. Server match → gọi onStudentRecognized với ảnh và thời gian
 *  4. Cooldown 4 giây trước khi detect lại
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { User, Camera, Check, AlertTriangle, XCircle, ClipboardList } from 'lucide-react';
import FaceCamera from './FaceCamera';
import {
  matchStudentFaceForCheckout,
  uploadAttendanceImage,
} from '../../service/faceAttendance.api';

const COOLDOWN_MS = 4000;

export default function PickupFaceAttendanceModal({ open, onClose, classId, className, onStudentRecognized }) {
  const [matchResult, setMatchResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkedOutToday, setCheckedOutToday] = useState([]);

  const cooldownRef = useRef(false);
  const cameraRef = useRef(null);

  // Reset khi đóng modal
  useEffect(() => {
    if (!open) {
      setMatchResult(null);
      setCheckedOutToday([]);
      setIsProcessing(false);
      cooldownRef.current = false;
    }
  }, [open]);

  // Callback nhận embedding từ FaceCamera
  const handleDetected = useCallback(
    async (embedding) => {
      if (cooldownRef.current || isProcessing || !classId) return;

      cooldownRef.current = true;
      setIsProcessing(true);

      const capturedFrame = cameraRef.current?.captureFrame() || null;
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      try {
        const tzOffset = now.getTimezoneOffset() * 60000;
        const today = new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);

        let checkoutImageUrl = '';
        if (capturedFrame) {
          try { checkoutImageUrl = await uploadAttendanceImage(capturedFrame); } catch { /* không chặn */ }
        }

        const result = await matchStudentFaceForCheckout(embedding, classId, today, checkoutImageUrl);

        setMatchResult({ ...result, capturedFrame, checkoutImageUrl, timestamp: now });

        if (result.status === 'success') {
          const studentId = result.student?._id;
          if (studentId && !checkedOutToday.includes(studentId)) {
            setCheckedOutToday((prev) => [...prev, studentId]);
            toast.success(`Nhận diện: ${result.student.fullName} — đang mở form điểm danh về`);
            // Chuyển sang form checkout chi tiết với ảnh đã chụp
            onStudentRecognized?.({ studentId, checkoutImageUrl, timeStr, student: result.student });
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
    [isProcessing, classId, checkedOutToday, onStudentRecognized]
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

              {/* Thống kê — mobile */}
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
                    <User size={40} className="mx-auto text-gray-300" />
                    <p className="text-sm mt-2">Đưa khuôn mặt học sinh vào camera</p>
                  </div>
                )}

                {matchResult?.status === 'success' && (
                  <div className="p-2.5 sm:p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex gap-2 sm:gap-3 mb-2">
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="w-full h-16 sm:h-24 rounded-lg overflow-hidden bg-gray-200 border-2 border-emerald-300">
                          {matchResult.student?.avatar ? (
                            <img src={matchResult.student.avatar} alt="Ảnh hồ sơ" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User size={32} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Hồ sơ</p>
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="w-full h-16 sm:h-24 rounded-lg overflow-hidden bg-gray-200 border-2 border-blue-300">
                          {matchResult.capturedFrame ? (
                            <img src={matchResult.capturedFrame} alt="Ảnh vừa chụp" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Camera size={32} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Vừa chụp</p>
                      </div>
                    </div>
                    <p className="font-bold text-emerald-700 text-sm sm:text-base">{matchResult.student?.fullName}</p>
                    <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                      <Check size={12} />
                      Nhận diện thành công — đang mở form điểm danh về...
                    </p>
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
                    <p className="text-sm font-semibold text-orange-700 flex items-center gap-1"><AlertTriangle size={14} /> {matchResult.student?.fullName}</p>
                    <p className="text-xs text-orange-600 mt-1">{matchResult.message}</p>
                  </div>
                )}

                {matchResult?.status === 'no_match' && (
                  <div className="text-center py-4">
                    <XCircle size={32} className="mx-auto text-red-400" />
                    <p className="text-sm text-red-600 font-medium mt-2">Không nhận diện được khuôn mặt</p>
                    <p className="text-xs text-gray-400 mt-1">Học sinh chưa đăng ký khuôn mặt hoặc ảnh không rõ</p>
                  </div>
                )}

                {matchResult?.status === 'ambiguous' && (
                  <div className="text-center py-4">
                    <AlertTriangle size={32} className="mx-auto text-orange-400" />
                    <p className="text-sm text-orange-600 font-medium mt-2">Khuôn mặt không rõ ràng</p>
                    {matchResult.candidates?.length > 0 ? (
                      <div className="mt-2 text-left">
                        <p className="text-xs text-gray-500 mb-1 text-center">Giống các học sinh sau:</p>
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
                        Khuôn mặt giống nhiều học sinh. Hãy đăng ký thêm góc mặt.
                      </p>
                    )}
                  </div>
                )}

                {matchResult?.status === 'no_data' && (
                  <div className="text-center py-4 text-gray-400">
                    <ClipboardList size={32} className="mx-auto text-gray-300" />
                    <p className="text-sm mt-2">{matchResult.message}</p>
                  </div>
                )}
              </div>

              {/* Thống kê — desktop */}
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
