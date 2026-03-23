/**
 * FaceRegisterModal.jsx
 *
 * Modal đăng ký khuôn mặt cho 1 học sinh.
 * Hỗ trợ 2 cách lấy ảnh:
 *  1. Upload ảnh từ máy
 *  2. Chụp từ camera trực tiếp
 *
 * Luồng:
 *  Ảnh → detect khuôn mặt → tạo embedding 128D → gửi POST /api/face/register
 */

import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import * as faceapi from '@vladmandic/face-api';
import { useFaceApi, detectAndEmbed } from '../../hooks/useFaceApi';
import { registerFaceEmbedding } from '../../service/faceAttendance.api';

export default function FaceRegisterModal({ open, onClose, student, onSuccess }) {
  const { isReady, loadingProgress } = useFaceApi();

  const [mode, setMode] = useState('upload'); // 'upload' | 'camera'
  const [previewSrc, setPreviewSrc] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null); // null | 'ok' | 'no_face' | 'multi'
  const [pendingEmbedding, setPendingEmbedding] = useState(null);

  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

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
    setMode('upload'); // Hiển thị preview
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setPreviewSrc(null);
    setDetectionResult(null);
    setPendingEmbedding(null);
    if (newMode === 'camera') startCamera();
    else stopCamera();
  };

  // ── Xử lý upload file ─────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewSrc(ev.target.result);
      setDetectionResult(null);
      setPendingEmbedding(null);
    };
    reader.readAsDataURL(file);
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
  const handleSave = async () => {
    if (!pendingEmbedding || !student?._id) return;
    setSaving(true);
    try {
      await registerFaceEmbedding(student._id, pendingEmbedding);
      toast.success(`Đã đăng ký khuôn mặt cho ${student.fullName}`);
      onSuccess?.();
      handleClose();
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
    setMode('upload');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-indigo-600 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-white">Đăng ký khuôn mặt</h2>
            <p className="text-indigo-200 text-sm">{student?.fullName}</p>
          </div>
          <button onClick={handleClose} className="text-white text-2xl font-bold leading-none hover:text-indigo-200">×</button>
        </div>

        <div className="p-6">
          {/* Models chưa sẵn sàng */}
          {!isReady && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
              <div className="animate-spin h-4 w-4 border-b-2 border-yellow-600 rounded-full" />
              {loadingProgress}
            </div>
          )}

          {/* Tab chọn chế độ */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleModeChange('upload')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg border ${
                mode === 'upload' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              📁 Upload ảnh
            </button>
            <button
              onClick={() => handleModeChange('camera')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg border ${
                mode === 'camera' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              📷 Chụp camera
            </button>
          </div>

          {/* Upload mode */}
          {mode === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {!previewSrc ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition"
                >
                  <span className="text-4xl mb-2">🖼️</span>
                  <p className="text-gray-500 text-sm">Nhấn để chọn ảnh</p>
                  <p className="text-gray-400 text-xs mt-1">JPG, PNG – ảnh rõ mặt, 1 người</p>
                </div>
              ) : (
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
                    onClick={() => { setPreviewSrc(null); setDetectionResult(null); setPendingEmbedding(null); }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >×</button>
                </div>
              )}
            </div>
          )}

          {/* Camera mode */}
          {mode === 'camera' && (
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
          {detectionResult && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${
              detectionResult === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' :
              detectionResult === 'no_face' ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-orange-50 text-orange-700 border border-orange-200'
            }`}>
              {detectionResult === 'ok' && '✓ Phát hiện đúng 1 khuôn mặt — sẵn sàng lưu'}
              {detectionResult === 'no_face' && '✗ Không phát hiện khuôn mặt — thử ảnh khác'}
              {detectionResult === 'multi' && '⚠ Phát hiện nhiều khuôn mặt — dùng ảnh chỉ có 1 người'}
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
            {previewSrc && mode === 'upload' && !pendingEmbedding && (
              <button
                onClick={handleDetect}
                disabled={detecting || !isReady}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 disabled:opacity-50"
              >
                {detecting ? 'Đang phân tích...' : '🔍 Phân tích khuôn mặt'}
              </button>
            )}
            {detectionResult === 'ok' && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : '💾 Lưu khuôn mặt'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
