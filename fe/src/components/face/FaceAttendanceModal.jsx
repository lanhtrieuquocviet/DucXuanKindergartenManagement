/**
 * FaceAttendanceModal.jsx
 *
 * Modal quét khuôn mặt điểm danh đến cho giáo viên.
 *
 * Khi nhận diện được học sinh, gọi onStudentRecognized() để mở form
 * checkin chi tiết — không nhập thông tin tại đây.
 * Ảnh checkin được chụp tự động từ thời điểm AI quét và truyền sang form.
 *
 * Chế độ hoạt động:
 *  - ONLINE: gửi embedding lên server → server match
 *  - OFFLINE: so sánh embedding locally với data đã tải
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { User, Camera, Check, AlertTriangle, Circle } from 'lucide-react';
import FaceCamera from './FaceCamera';
import { matchFaceEmbedding, getClassEmbeddings, uploadAttendanceImage } from '../../service/faceAttendance.api';
import { useOfflineSync } from '../../hooks/useOfflineSync';

// Cosine similarity (dùng khi offline — giống backend)
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

export default function FaceAttendanceModal({ open, onClose, classId, className, onStudentRecognized }) {
  const { isOnline } = useOfflineSync();

  const [matchResult, setMatchResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState([]);

  // Embeddings local (cho offline)
  const [localEmbeddings, setLocalEmbeddings] = useState([]);
  const [loadingEmbeddings, setLoadingEmbeddings] = useState(false);

  const cooldownRef = useRef(false);
  const cameraRef = useRef(null);

  // Reset checkedInToday khi classId thay đổi
  useEffect(() => {
    setCheckedInToday([]);
  }, [classId]);

  // Tải embeddings về local khi modal mở
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
      setIsProcessing(false);
      cooldownRef.current = false;
    }
  }, [open]);

  // Offline match — chỉ nhận diện, không lưu
  const matchOffline = useCallback(
    (embedding) => {
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
      if (secondBestSim > 0.83 && (bestSim - secondBestSim) < MIN_MARGIN) return null;

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const studentId = bestMatch.studentId || bestMatch._id;

      if (checkedInToday.includes(studentId)) {
        return { status: 'already_checked_in', student: { ...bestMatch, _id: studentId } };
      }

      return {
        status: 'success',
        student: { ...bestMatch, _id: studentId },
        similarity: bestSim.toFixed(4),
        previewTime: { checkIn: timeStr },
      };
    },
    [localEmbeddings, checkedInToday]
  );

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
        let result;
        let checkinImageUrl = '';

        if (isOnline) {
          const tzOffset = now.getTimezoneOffset() * 60000;
          const today = new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
          if (capturedFrame) {
            try {
              checkinImageUrl = await uploadAttendanceImage(capturedFrame);
            } catch {
              // Không chặn điểm danh nếu upload ảnh lỗi
            }
          }
          result = await matchFaceEmbedding(embedding, classId, today, checkinImageUrl);
        } else {
          result = matchOffline(embedding);
          if (!result) result = { status: 'no_match', matched: false };
        }

        setMatchResult({ ...result, capturedFrame, checkinImageUrl, timestamp: now });

        if (result.status === 'success' && result.student?._id) {
          const studentId = result.student._id;
          // Đánh dấu đã xử lý để tránh quét trùng trong cùng phiên
          setCheckedInToday((prev) => [...prev, studentId]);
          toast.success(`Nhận diện: ${result.student.fullName} — đang mở form điểm danh`);
          // Chuyển sang form checkin chi tiết với ảnh đã chụp
          onStudentRecognized?.({ studentId, checkinImageUrl, timeStr, student: result.student });
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
    [isProcessing, isOnline, classId, matchOffline, onStudentRecognized]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1400] flex items-start sm:items-center justify-center bg-black/60 p-2 sm:p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 1rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-blue-600 flex-shrink-0">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white">Điểm danh khuôn mặt</h2>
            <p className="text-blue-100 text-xs sm:text-sm">{className}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isOnline ? 'bg-green-400 text-white' : 'bg-orange-400 text-white'
              }`}
            >
              <Circle size={8} className="fill-current" />
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 text-2xl font-bold leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
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

              {/* Thống kê session — mobile */}
              <div className="mt-3 border rounded-xl p-3 md:hidden">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{checkedInToday.length}</div>
                  <div className="text-xs text-gray-500">Đã nhận diện</div>
                </div>
              </div>
            </div>

            {/* Cột phải: Kết quả nhận diện */}
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="border rounded-xl p-3 sm:p-4">
                <h3 className="font-semibold text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">
                  Kết quả nhận diện
                </h3>

                {!matchResult && (
                  <div className="text-center text-gray-400 py-4 sm:py-6">
                    <User size={40} className="mx-auto text-gray-300" />
                    <p className="text-sm mt-2">Đưa khuôn mặt vào camera</p>
                  </div>
                )}

                {matchResult?.status === 'success' && (
                  <div className="p-2.5 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex gap-2 sm:gap-3 mb-2">
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gray-200 border-2 border-green-300">
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
                        <div className="w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gray-200 border-2 border-blue-300">
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
                    <p className="font-bold text-green-700 text-sm sm:text-base">{matchResult.student?.fullName}</p>
                    <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                      <Check size={12} />
                      Nhận diện thành công — đang mở form điểm danh...
                    </p>
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
                    <AlertTriangle size={22} className="mx-auto mb-1 text-orange-500" />
                    <p className="text-orange-700 font-medium text-sm">Khuôn mặt không rõ ràng</p>
                    {matchResult.candidates?.length > 0 ? (
                      <div className="mt-1 text-left">
                        <p className="text-xs text-orange-500 mb-1 text-center">
                          Giống các học sinh sau, không thể xác định chính xác:
                        </p>
                        <ul className="text-xs text-orange-700 space-y-0.5">
                          {matchResult.candidates.map((c, i) => (
                            <li key={i} className="flex justify-between px-2 py-0.5 bg-orange-100 rounded">
                              <span className="font-medium">{c.fullName}</span>
                              <span className="text-orange-500">({(parseFloat(c.similarity) * 100).toFixed(1)}%)</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-orange-500 mt-1 text-center">
                          Hãy đăng ký thêm góc mặt để phân biệt.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-orange-500 mt-1">
                        Giống nhiều học sinh. Hãy đăng ký thêm góc mặt.
                      </p>
                    )}
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

              {/* Thống kê session — desktop */}
              <div className="border rounded-xl p-3 sm:p-4 hidden md:block">
                <h3 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">Phiên điểm danh này</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{checkedInToday.length}</div>
                  <div className="text-xs text-gray-500">Đã nhận diện</div>
                </div>
              </div>

              {!isOnline && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700">
                  <strong>Chế độ offline:</strong> Nhận diện cục bộ. Lưu điểm danh sẽ yêu cầu kết nối mạng.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
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
