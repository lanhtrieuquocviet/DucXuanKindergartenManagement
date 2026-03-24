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

import { useCallback, useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { useFaceApi, detectAndEmbed } from '../../hooks/useFaceApi';

// Khoảng thời gian giữa 2 lần detection (ms)
// 800ms = ~1.25 lần/giây, đủ nhanh mà không quá tải CPU
const DETECTION_INTERVAL_MS = 800;

export default function FaceCamera({ onDetected, onError, isActive = true }) {
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
          setFaceStatus('detected');
          drawDetection(detection, video, canvas);

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
      if (err.name === 'NotAllowedError') msg = 'Vui lòng cho phép truy cập camera';
      if (err.name === 'NotFoundError') msg = 'Không tìm thấy camera trên thiết bị này';
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
    <div className="relative w-full" style={{ maxWidth: 640 }}>
      {/* Video stream */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full rounded-xl bg-black"
        style={{ display: cameraStatus === 'active' ? 'block' : 'none' }}
      />

      {/* Canvas overlay: vẽ bounding box lên video */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />

      {/* Trạng thái camera */}
      {cameraStatus === 'loading' && (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2" />
          <span className="text-gray-600">Đang bật camera...</span>
        </div>
      )}

      {cameraStatus === 'error' && (
        <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-xl border border-red-200">
          <span className="text-red-500 text-4xl mb-2">📷</span>
          <p className="text-red-600 font-medium">{cameraError}</p>
        </div>
      )}

      {/* Thanh trạng thái khuôn mặt (hiện khi camera active) */}
      {cameraStatus === 'active' && (
        <div
          className={`absolute bottom-3 left-3 right-3 text-center text-sm font-medium py-1 px-3 rounded-full ${
            faceStatus === 'detected'
              ? 'bg-green-500 text-white'
              : 'bg-black/50 text-white'
          }`}
        >
          {faceStatus === 'detected' ? '✓ Phát hiện khuôn mặt' : 'Đưa khuôn mặt vào khung hình'}
        </div>
      )}
    </div>
  );
}
