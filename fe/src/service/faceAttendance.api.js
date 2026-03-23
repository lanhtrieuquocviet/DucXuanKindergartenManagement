/**
 * faceAttendance.api.js
 * Các hàm gọi API cho hệ thống điểm danh nhận diện khuôn mặt
 */

import { get, post } from './api';

/**
 * Đăng ký embedding khuôn mặt cho học sinh
 * @param {string} studentId
 * @param {number[]} embedding - mảng 128 số float từ face-api.js
 */
export const registerFaceEmbedding = (studentId, embedding) =>
  post('/face/register', { studentId, embedding });

/**
 * Nhận diện khuôn mặt + tự động check-in (chế độ ONLINE)
 * @param {number[]} embedding - mảng 128 số float từ camera realtime
 * @param {string} classId
 * @param {string} [date] - YYYY-MM-DD, mặc định hôm nay
 */
export const matchFaceEmbedding = (embedding, classId, date) =>
  post('/face/match', { embedding, classId, date });

/**
 * Tải toàn bộ embeddings của lớp về thiết bị (cho chế độ OFFLINE)
 * @param {string} classId
 */
export const getClassEmbeddings = (classId) =>
  get(`/face/embeddings?classId=${classId}`);

/**
 * Đẩy dữ liệu điểm danh offline lên server khi có mạng
 * @param {Array<{studentId, classId, date, checkInTime, checkInTimeString}>} records
 */
export const syncOfflineAttendance = (records) =>
  post('/face/sync', { records });
