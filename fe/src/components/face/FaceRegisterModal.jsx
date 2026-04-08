/**
 * FaceRegisterModal.jsx
 *
 * Modal đăng ký khuôn mặt cho 1 học sinh.
 * Chỉ hỗ trợ chụp từ camera trực tiếp.
 *
 * Luồng:
 *  Ảnh → detect khuôn mặt → tạo embedding 128D → gửi POST /api/face/register
 */

import { useRef, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import * as faceapi from '@vladmandic/face-api';
import { useFaceApi } from '../../hooks/useFaceApi';
import { registerFaceEmbedding, uploadAttendanceImage } from '../../service/faceAttendance.api';

export default function FaceRegisterModal({ open, onClose, student, onSuccess }) {
  const { isReady, loadingProgress } = useFaceApi();

  const [previewSrc, setPreviewSrc] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null); // null | 'ok' | 'no_face' | 'multi'
  const [pendingEmbedding, setPendingEmbedding] = useState(null);
  const [savedAngles, setSavedAngles] = useState(0); // số góc đã lưu trong phiên này
  const [conflictInfo, setConflictInfo] = useState(null);
  const MAX_ANGLES = 3; // đề nghị tối đa 3 góc

  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // ── Camera helpers ─────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      toast.error('Không thể bật camera. Kiểm tra quyền truy cập.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setPreviewSrc(dataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setPreviewSrc(null);
    setDetectionResult(null);
    setPendingEmbedding(null);
    setConflictInfo(null);
    startCamera();
  };

  // ── Detect khuôn mặt từ ảnh preview ────────────────────────────────────────
  const handleDetect = async () => {
    if (!imgRef.current || !isReady) return;
    setDetecting(true);
    setDetectionResult(null);
    setPendingEmbedding(null);

    try {
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });

      // Detect tất cả khuôn mặt (kiểm tra có nhiều hơn 1 không)
      const allDetections = await faceapi
        .detectAllFaces(imgRef.current, options)
        .withFaceLandmarks(true)
        .withFaceDescriptors();

      if (allDetections.length === 0) {
        setDetectionResult('no_face');
        return;
      }

      if (allDetections.length > 1) {
        setDetectionResult('multi');
        // Vẫn vẽ tất cả bounding box để user thấy
        const canvas = canvasRef.current;
        const dims = faceapi.matchDimensions(canvas, imgRef.current, true);
        faceapi.draw.drawDetections(canvas, faceapi.resizeResults(allDetections, dims));
        return;
      }

      // Đúng 1 khuôn mặt
      const embedding = Array.from(allDetections[0].descriptor);
      setPendingEmbedding(embedding);
      setDetectionResult('ok');

      // Vẽ bounding box
      const canvas = canvasRef.current;
      const dims = faceapi.matchDimensions(canvas, imgRef.current, true);
      faceapi.draw.drawDetections(canvas, faceapi.resizeResults(allDetections, dims));
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi phân tích ảnh');
    } finally {
      setDetecting(false);
    }
  };

  // ── Lưu embedding lên server ───────────────────────────────────────────────
  const handleSave = async (addMore = false) => {
    if (!pendingEmbedding || !student?._id) return;
    setSaving(true);
    try {
      // Upload ảnh cho TẤT CẢ các góc (không chỉ góc đầu)
      let faceImageUrl = '';
      if (previewSrc) {
        try {
          faceImageUrl = await uploadAttendanceImage(previewSrc);
          if (!faceImageUrl) toast.warn('Không lưu được ảnh nhưng embedding vẫn được lưu.');
        } catch {
          toast.warn('Lỗi upload ảnh — embedding vẫn được lưu bình thường.');
        }
      }
      // Nếu học sinh đã có dữ liệu khuôn mặt từ trước, luôn dùng append=true để không mất góc cũ
      const hasExistingData = student?.hasFaceEmbedding || (student?.angleCount || 0) > 0;
      await registerFaceEmbedding(student._id, pendingEmbedding, faceImageUrl, savedAngles > 0 || hasExistingData);
      const newCount = savedAngles + 1;
      setSavedAngles(newCount);

      if (addMore && newCount < MAX_ANGLES) {
        toast.success(`Đã lưu góc ${newCount}/${MAX_ANGLES}. Tiếp tục chụp góc tiếp theo.`);
        setPreviewSrc(null);
        setDetectionResult(null);
        setPendingEmbedding(null);
        startCamera();
      } else {
        toast.success(`Đã đăng ký ${newCount} góc mặt cho ${student.fullName}`);
        onSuccess?.();
        handleClose();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu khuôn mặt');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setPreviewSrc(null);
    setDetectionResult(null);
    setPendingEmbedding(null);
    setConflictInfo(null);
    setSavedAngles(0);
    onClose();
  };

  useEffect(() => {
    if (open && !previewSrc) {
      startCamera();
    }
    if (!open) {
      stopCamera();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-indigo-600 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-white">Đăng ký khuôn mặt</h2>
            <p className="text-indigo-200 text-sm">
              {student?.fullName}
              {savedAngles > 0 && (
                <span className="ml-2 bg-indigo-400 text-white text-xs px-2 py-0.5 rounded-full">
                  Góc {savedAngles}/{MAX_ANGLES}
                </span>
              )}
            </p>
          </div>
          <button onClick={handleClose} className="text-white text-2xl font-bold leading-none hover:text-indigo-200">×</button>
        </div>

        <div className="p-6">
          {/* Hướng dẫn góc mặt */}
          {savedAngles === 0 && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              Để tăng độ chính xác, hãy chụp <strong>2–3 góc mặt</strong>: nhìn thẳng, hơi nghiêng trái, hơi nghiêng phải.
            </div>
          )}
          {savedAngles > 0 && savedAngles < MAX_ANGLES && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
              Đã lưu {savedAngles} góc. Hãy xoay mặt nhẹ sang {savedAngles === 1 ? 'bên trái hoặc phải' : 'hướng khác'} rồi chụp tiếp.
            </div>
          )}

          {/* Models chưa sẵn sàng */}
          {!isReady && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
              <div className="animate-spin h-4 w-4 border-b-2 border-yellow-600 rounded-full" />
              {loadingProgress}
            </div>
          )}

          {/* Preview ảnh đã chụp */}
          {previewSrc ? (
            <div className="relative">
              <img
                ref={imgRef}
                src={previewSrc}
                alt="preview"
                className="w-full rounded-xl max-h-64 object-contain bg-gray-50"
                crossOrigin="anonymous"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
                style={{ pointerEvents: 'none' }}
              />
              <button
                onClick={retakePhoto}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              >×</button>
            </div>
          ) : (
            /* Camera view */
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full rounded-xl bg-black max-h-64 object-cover"
              />
              <button
                onClick={captureFrame}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 px-6 py-2 bg-white text-gray-800 rounded-full font-medium text-sm shadow-lg hover:bg-gray-100"
              >
                📸 Chụp ảnh
              </button>
            </div>
          )}

          {/* Kết quả detection */}
          {detectionResult && !conflictInfo && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${
              detectionResult === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' :
              detectionResult === 'no_face' ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-orange-50 text-orange-700 border border-orange-200'
            }`}>
              {detectionResult === 'ok' && '✓ Phát hiện đúng 1 khuôn mặt — sẵn sàng lưu'}
              {detectionResult === 'no_face' && '✗ Không phát hiện khuôn mặt — thử chụp lại'}
              {detectionResult === 'multi' && '⚠ Phát hiện nhiều khuôn mặt — thử chụp lại'}
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex justify-between gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
          >
            Hủy
          </button>
          <div className="flex gap-2">
            {previewSrc && !pendingEmbedding && (
              <button
                onClick={handleDetect}
                disabled={detecting || !isReady}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 disabled:opacity-50"
              >
                {detecting ? 'Đang phân tích...' : '🔍 Phân tích khuôn mặt'}
              </button>
            )}
            {detectionResult === 'ok' && (
              <>
                {savedAngles < MAX_ANGLES - 1 && (
                  <button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 disabled:opacity-50"
                  >
                    {saving ? 'Đang lưu...' : `➕ Thêm góc (${savedAngles + 1}/${MAX_ANGLES})`}
                  </button>
                )}
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : savedAngles === 0 ? '💾 Lưu khuôn mặt' : '✅ Hoàn tất'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
