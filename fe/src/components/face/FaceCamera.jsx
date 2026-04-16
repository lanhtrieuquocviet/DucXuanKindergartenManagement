/**
 * FaceCamera.jsx
 *
 * Component camera realtime cho điểm danh khuôn mặt.
 *
 * Luồng hoạt động:
 *  1. Bật camera (webcam) qua WebRTC
 *  2. Mỗi 800ms → chụp 1 frame từ video
 *  3. Chạy face detection → tạo embedding
 *  4. Gọi callback onDetected(embedding) → parent xử lý (match hoặc lưu offline)
 *  5. Vẽ hình chữ nhật xanh quanh khuôn mặt lên canvas để feedback cho user
 */

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { CameraOff, RefreshCw, Check } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';
import { useFaceApi, detectAndEmbed } from '../../hooks/useFaceApi';

// Khoảng thời gian giữa 2 lần detection (ms)
// 800ms = ~1.25 lần/giây, đủ nhanh mà không quá tải CPU
const DETECTION_INTERVAL_MS = 800;

const FaceCamera = forwardRef(function FaceCamera({ onDetected, onError, isActive = true }, ref) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);

  const { isReady, error: modelError, loadingProgress } = useFaceApi();

  const [cameraStatus, setCameraStatus] = useState('idle'); // idle | loading | active | error
  const [faceStatus, setFaceStatus] = useState('waiting'); // waiting | detected | no_face
  const [cameraError, setCameraError] = useState(null);

  // ── Vẽ bounding box khuôn mặt lên canvas ─────────────────────────────────
  const drawDetection = useCallback((detection, videoEl, canvasEl) => {
    if (!canvasEl || !videoEl) return;

    const dims = faceapi.matchDimensions(canvasEl, videoEl, true);

    if (!detection) {
      // Xoá canvas khi không có khuôn mặt
      const ctx = canvasEl.getContext('2d');
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      return;
    }

    faceapi.draw.drawDetections(
      canvasEl,
      faceapi.resizeResults(detection, dims)
    );
  }, []);

  // ── Bắt đầu vòng lặp detection ────────────────────────────────────────────
  const startDetectionLoop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || video.readyState < 2 || !isActive) return;

      try {
        // Detect khuôn mặt + tạo embedding
        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5,
        });

        const detection = await faceapi
          .detectSingleFace(video, options)
          .withFaceLandmarks(true)
          .withFaceDescriptor();

        if (detection) {
          drawDetection(detection, video, canvas);

          // Lọc chất lượng khuôn mặt trước khi gửi embedding:
          // 1. score < 0.75 → detection không đủ tin cậy (khuôn mặt mờ/bị che)
          // 2. face box < 80px → khuôn mặt quá nhỏ/xa, embedding bị nhiễu
          const score = detection.detection.score;
          const boxWidth = detection.detection.box.width;
          if (score < 0.75 || boxWidth < 80) {
            setFaceStatus('no_face');
            return;
          }

          setFaceStatus('detected');

          // Gửi embedding về parent component để xử lý match/save
          const embedding = Array.from(detection.descriptor);
          if (onDetected) {
            onDetected(embedding);
          }
        } else {
          setFaceStatus('no_face');
          drawDetection(null, video, canvas);
        }
      } catch (err) {
        console.error('Detection error:', err);
      }
    }, DETECTION_INTERVAL_MS);
  }, [isActive, drawDetection, onDetected]);

  // ── Bật camera ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraStatus('loading');
    setCameraError(null);

    try {
      // Yêu cầu quyền truy cập camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user', // Camera trước
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraStatus('active');
    } catch (err) {
      console.error('Camera error:', err);
      let msg = 'Không thể bật camera';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
        msg = 'Trình duyệt chặn quyền camera — vào Settings > Privacy > Camera để cấp quyền';
      else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError')
        msg = 'Không tìm thấy camera trên thiết bị này';
      else if (err.name === 'NotReadableError' || err.name === 'TrackStartError')
        msg = 'Camera đang được dùng bởi ứng dụng khác — hãy đóng các tab/app đang dùng camera rồi thử lại';
      else if (err.name === 'OverconstrainedError')
        msg = 'Camera không hỗ trợ độ phân giải yêu cầu';
      setCameraError(msg);
      setCameraStatus('error');
      if (onError) onError(msg);
    }
  }, [onError]);

  // ── Tắt camera ────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStatus('idle');
    setFaceStatus('waiting');
  }, []);

  // ── Expose captureFrame() cho parent component qua ref ───────────────────
  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return null;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      canvas.getContext('2d').drawImage(video, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.8);
    },
  }));

  // ── Lifecycle: bật/tắt camera theo isActive ──────────────────────────────
  useEffect(() => {
    // Không bật camera nếu model lỗi
    if (isActive && isReady && !modelError) {
      startCamera().then(() => {
        startDetectionLoop();
      });
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isActive, isReady, modelError]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────────

  // Đang tải model
  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-xl">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3" />
        <p className="text-sm text-gray-600">{loadingProgress}</p>
        {modelError && <p className="text-red-500 text-xs mt-2">{modelError}</p>}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Trạng thái camera loading */}
      {cameraStatus === 'loading' && (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2" />
          <span className="text-gray-600">Đang bật camera...</span>
        </div>
      )}

      {/* Lỗi camera */}
      {cameraStatus === 'error' && (
        <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-xl border border-red-200 px-4 text-center gap-3">
          <CameraOff size={36} className="text-red-400" />
          <p className="text-red-600 font-medium text-sm">{cameraError}</p>
          <button
            onClick={() => startCamera().then(() => startDetectionLoop())}
            className="px-4 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 flex items-center gap-1.5"
          >
            <RefreshCw size={13} /> Thử lại
          </button>
        </div>
      )}

      {/* Video + canvas overlay — chỉ hiện khi active */}
      <div
        className="relative w-full rounded-xl overflow-hidden bg-black"
        style={{ display: cameraStatus === 'active' ? 'block' : 'none', aspectRatio: '4/3' }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />

        {/* Thanh trạng thái khuôn mặt */}
        <div
          className={`absolute bottom-3 left-3 right-3 text-center text-sm font-medium py-1 px-3 rounded-full ${
            faceStatus === 'detected'
              ? 'bg-green-500 text-white'
              : 'bg-black/50 text-white'
          }`}
        >
          {faceStatus === 'detected'
            ? <span className="flex items-center justify-center gap-1"><Check size={13} /> Phát hiện khuôn mặt</span>
            : 'Đưa khuôn mặt vào khung hình'
          }
        </div>
      </div>
    </div>
  );
});

export default FaceCamera;
