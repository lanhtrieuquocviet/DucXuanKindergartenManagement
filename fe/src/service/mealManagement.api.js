import { get, post, del, postFormData, ENDPOINTS } from './api';

/**
 * Lấy ảnh món ăn & mẫu thực phẩm theo ngày
 * @param {string} date - "YYYY-MM-DD"
 */
export const getMealPhoto = (date) =>
  get(`${ENDPOINTS.MEAL_PHOTOS.GET}?date=${date}`);

/**
 * Tạo / cập nhật ảnh cho một ngày
 * @param {{ date: string, mealImages?: string[], sampleImages?: string[] }} data
 */
export const upsertMealPhoto = (data) =>
  post(ENDPOINTS.MEAL_PHOTOS.UPSERT, data);

/**
 * Lấy tổng hợp sĩ số và suất cơm từ điểm danh
 * @param {string} date - "YYYY-MM-DD"
 */
export const getAttendanceSummary = (date) =>
  get(`${ENDPOINTS.MEAL_PHOTOS.ATTENDANCE_SUMMARY}?date=${date}`);

/**
 * Thêm / cập nhật ảnh cho một bữa ăn cụ thể
 * @param {{ date: string, mealType: 'sang'|'trua'|'chieu'|'xe', description?: string, images: string[] }} data
 */
export const upsertMealEntry = (data) =>
  post(ENDPOINTS.MEAL_PHOTOS.UPSERT_MEAL_ENTRY, data);

/**
 * Xóa một bữa ăn khỏi ngày
 * @param {{ date: string, mealType: string }} data
 */
export const deleteMealEntry = ({ date, mealType }) =>
  del(`${ENDPOINTS.MEAL_PHOTOS.UPSERT_MEAL_ENTRY}?date=${date}&mealType=${mealType}`);

/**
 * Upload ảnh lên Cloudinary qua backend
 * @param {File} file - File ảnh
 * @returns {Promise<string>} URL ảnh trên Cloudinary
 */
export const uploadKitchenImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_KITCHEN_IMAGE, formData);
  return res.data.url;
};
