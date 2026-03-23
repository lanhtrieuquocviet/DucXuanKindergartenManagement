/**
 * useFaceApi.js
 *
 * Hook quản lý việc tải models của face-api.js.
 * Models chỉ được tải 1 lần duy nhất (lazy loading).
 *
 * Cách hoạt động:
 *  1. Lần đầu render → tải 3 model files từ /public/models/
 *  2. Sau khi tải xong → isReady = true
 *  3. Component dùng hook này mới được phép chạy detection
 *
 * Models cần tải:
 *  - TinyFaceDetector: phát hiện khuôn mặt (nhẹ, nhanh ~1MB)
 *  - FaceLandmark68TinyNet: xác định 68 điểm trên khuôn mặt
 *  - FaceRecognitionNet: tạo embedding 128 chiều
 */

import { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

// Singleton: tránh tải model nhiều lần khi re-render
let modelsLoaded = false;
let loadingPromise = null;

const MODEL_URL = '/models'; // Trỏ vào /public/models/

export function useFaceApi() {
  const [isReady, setIsReady] = useState(modelsLoaded);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(
    modelsLoaded ? 'Đã tải xong' : 'Chưa tải'
  );

  useEffect(() => {
    if (modelsLoaded) {
      setIsReady(true);
      setLoadingProgress('Đã tải xong');
      return;
    }

    // Nếu đang tải ở component khác → chờ promise đó
    if (loadingPromise) {
      loadingPromise.then(() => {
        setIsReady(true);
        setLoadingProgress('Đã tải xong');
      });
      return;
    }

    // Bắt đầu tải
    setLoadingProgress('Đang tải model AI...');

    loadingPromise = (async () => {
      try {
        setLoadingProgress('Tải model phát hiện khuôn mặt...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

        setLoadingProgress('Tải model landmark khuôn mặt...');
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);

        setLoadingProgress('Tải model nhận diện khuôn mặt...');
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

        modelsLoaded = true;
        setIsReady(true);
        setLoadingProgress('Đã tải xong');
      } catch (err) {
        console.error('Lỗi tải model face-api:', err);
        setError('Không thể tải model AI. Kiểm tra /public/models/');
        setLoadingProgress('Tải thất bại');
        loadingPromise = null; // Reset để có thể thử lại
      }
    })();
  }, []);

  return { isReady, error, loadingProgress };
}

/**
 * Detect khuôn mặt và tạo embedding từ 1 ảnh/video frame
 * @param {HTMLVideoElement | HTMLImageElement | HTMLCanvasElement} source
 * @returns {number[] | null} embedding 128 chiều, hoặc null nếu không detect được
 */
export async function detectAndEmbed(source) {
  if (!modelsLoaded) {
    throw new Error('Models chưa được tải. Gọi useFaceApi() trước.');
  }

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,    // Nhỏ hơn → nhanh hơn (160, 224, 320, 416, 512, 608)
    scoreThreshold: 0.5, // Ngưỡng confidence để coi là có khuôn mặt
  });

  // Detect khuôn mặt + 68 landmarks + embedding trong 1 lần
  const detection = await faceapi
    .detectSingleFace(source, options)
    .withFaceLandmarks(true) // true = dùng tiny model (nhanh hơn)
    .withFaceDescriptor();   // descriptor = embedding 128 chiều

  if (!detection) return null;

  // Chuyển Float32Array → Array thường để gửi qua JSON
  return Array.from(detection.descriptor);
}
