/**
 * faceAttendance.api.js
 * Các hàm gọi API cho hệ thống điểm danh nhận diện khuôn mặt
 */

import { get, post, patch, del } from './api';

/**
 * Upload ảnh điểm danh (base64 từ camera) lên Cloudinary
 * @param {string} imageBase64 - dataURL "data:image/jpeg;base64,..."
 * @returns {Promise<string>} URL ảnh trên Cloudinary
 */
export const uploadAttendanceImage = async (imageBase64) => {
  const res = await post('/cloudinary/upload-attendance-image', { imageBase64 });
  return res.data?.url || '';
};

/**
 * Đăng ký embedding khuôn mặt cho học sinh
 * @param {string} studentId
 * @param {number[]} embedding - mảng 128 số float từ face-api.js
 */
export const registerFaceEmbedding = (studentId, embedding, faceImageUrl = '', append = false) =>
  post('/face/register', { studentId, embedding, faceImageUrl, append });

/**
 * Xóa toàn bộ dữ liệu khuôn mặt của học sinh
 * @param {string} studentId
 */
export const deleteFaceEmbedding = (studentId) =>
  del(`/face/register/${studentId}`);

export const deleteFaceAngle = (studentId, index) =>
  del(`/face/register/${studentId}/angle/${index}`);

/**
 * Nhận diện khuôn mặt + tự động check-in (chế độ ONLINE)
 * @param {number[]} embedding - mảng 128 số float từ camera realtime
 * @param {string} classId
 * @param {string} [date] - YYYY-MM-DD, mặc định hôm nay
 */
// autoCheckIn=false: chỉ nhận diện, KHÔNG tự ghi điểm danh — giáo viên phải ấn Lưu
export const matchFaceEmbedding = (embedding, classId, date, checkinImageUrl = '', autoCheckIn = false) =>
  post('/face/match', { embedding, classId, date, checkinImageUrl, autoCheckIn });

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

/**
 * Đăng ký embedding khuôn mặt cho người đưa/đón đã duyệt
 * @param {string} pickupRequestId
 * @param {number[]} embedding - mảng 128 số float
 */
export const registerPickupFaceEmbedding = (pickupRequestId, embedding) =>
  post('/face/pickup/register', { pickupRequestId, embedding });

/**
 * So sánh khuôn mặt với danh sách người đưa/đón của học sinh
 * @param {number[]} embedding
 * @param {string} studentId
 */
export const matchPickupFace = (embedding, studentId) =>
  post('/face/pickup/match', { embedding, studentId });

/**
 * Quét mặt người đến đón → tự động ghi điểm danh về cho học sinh trong lớp
 * @param {number[]} embedding
 * @param {string} classId
 * @param {string} [date]
 * @param {string} [checkoutImageUrl]
 */
export const matchPickupFaceForCheckout = (embedding, classId, date, checkoutImageUrl = '') =>
  post('/face/pickup/checkout', { embedding, classId, date, checkoutImageUrl });

/**
 * Quét khuôn mặt học sinh → tự động ghi điểm danh về
 * Luồng mới: giáo viên đăng ký khuôn mặt học sinh, dùng cho cả check-in lẫn check-out
 * @param {number[]} embedding
 * @param {string} classId
 * @param {string} [date]
 * @param {string} [checkoutImageUrl]
 */
// autoCheckOut=false: chỉ nhận diện, KHÔNG tự ghi checkout — giáo viên phải ấn Lưu
export const matchStudentFaceForCheckout = (embedding, classId, date, checkoutImageUrl = '', autoCheckOut = false) =>
  post('/face/student/checkout', { embedding, classId, date, checkoutImageUrl, autoCheckOut });

/**
 * Cập nhật thông tin người đưa/đón, ghi chú và đồ mang đến/về cho bản ghi điểm danh
 * @param {string} attendanceId
 * @param {string} delivererType - tên / quan hệ người đưa
 * @param {string} delivererOtherInfo - thông tin thêm (SĐT)
 * @param {string} note - ghi chú
 * @param {string[]} checkinBelongings - đồ mang đến
 * @param {string[]} checkoutBelongings - đồ mang về
 */
export const updateAttendanceDeliverer = (attendanceId, delivererType, delivererOtherInfo = '', note = '', checkinBelongings = [], checkoutBelongings = []) =>
  patch(`/face/attendance/${attendanceId}/deliverer`, { delivererType, delivererOtherInfo, note, checkinBelongings, checkoutBelongings });

/**
 * Cập nhật thông tin người đón (checkout) cho bản ghi điểm danh
 * @param {string} attendanceId
 * @param {string} receiverType - tên + quan hệ người đón (giống delivererType bên check-in)
 * @param {string} receiverOtherInfo - SĐT người đón (giống delivererOtherInfo bên check-in)
 * @param {string} checkoutBelongingsNote - ghi chú điểm danh về
 * @param {string[]} checkoutBelongings - đồ mang về
 */
export const updateAttendanceReceiver = (attendanceId, receiverType, receiverOtherInfo = '', checkoutBelongingsNote = '', checkoutBelongings = []) =>
  patch(`/face/attendance/${attendanceId}/deliverer`, { receiverType, receiverOtherInfo, checkoutBelongingsNote, checkoutBelongings });

/**
 * Lưu điểm danh đến (check-in) sau khi giáo viên xác nhận
 * Gọi sau khi matchFaceEmbedding trả về success và giáo viên ấn "Lưu"
 */
export const saveCheckinAttendance = (data) =>
  post('/students/attendance', data);

/**
 * Lưu điểm danh về (check-out) sau khi giáo viên xác nhận
 * Gọi sau khi matchStudentFaceForCheckout trả về success và giáo viên ấn "Lưu"
 */
export const saveCheckoutAttendance = (data) =>
  post('/students/attendance/checkout', data);

/**
 * Lấy danh sách người đón đã được duyệt của học sinh
 * @param {string} studentId
 */
export const getApprovedPickupPersons = (studentId) =>
  get(`/pickup/requests/student/${studentId}`);
