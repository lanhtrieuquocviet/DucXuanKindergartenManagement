const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ATTENDANCE_UPLOAD_DIR = path.join(__dirname, '../../uploads/attendance');

/**
 * Tạo thư mục theo ngày: uploads/attendance/YYYY/MM/DD/
 * Trả về đường dẫn tuyệt đối và đường dẫn tương đối để build URL
 */
const getDateFolder = () => {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const folder = path.join(ATTENDANCE_UPLOAD_DIR, year, month, day);
  fs.mkdirSync(folder, { recursive: true });
  return { folder, relativePath: `attendance/${year}/${month}/${day}` };
};

const getBaseUrl = (req) =>
  process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;

/**
 * POST /api/cloudinary/upload-attendance-image
 * Nhận ảnh base64 từ camera AI → lưu vào uploads/attendance/YYYY/MM/DD/
 * Body: { imageBase64: "data:image/jpeg;base64,..." }
 */
const uploadAttendanceImageLocal = async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || !imageBase64.startsWith('data:image')) {
      return res.status(400).json({ status: 'error', message: 'Thiếu imageBase64 hợp lệ' });
    }

    const matches = imageBase64.match(/^data:(image\/[\w+]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ status: 'error', message: 'Định dạng base64 không hợp lệ' });
    }

    const mimeExt = matches[1].split('/')[1].replace('jpeg', 'jpg').replace('+xml', '');
    const ext = ['jpg', 'png', 'gif', 'webp'].includes(mimeExt) ? mimeExt : 'jpg';
    const buffer = Buffer.from(matches[2], 'base64');

    const filename = `${crypto.randomUUID()}.${ext}`;
    const { folder, relativePath } = getDateFolder();
    fs.writeFileSync(path.join(folder, filename), buffer);

    const url = `${getBaseUrl(req)}/uploads/${relativePath}/${filename}`;
    return res.status(200).json({ status: 'success', data: { url } });
  } catch (error) {
    console.error('uploadAttendanceImageLocal error:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Lỗi lưu ảnh điểm danh' });
  }
};

/**
 * POST /api/cloudinary/upload-attendance-file
 * Nhận ảnh từ file upload (chụp tay / chọn file) → lưu vào uploads/attendance/YYYY/MM/DD/
 * Body: multipart/form-data, field: "image"
 */
const uploadAttendanceFileLocal = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng chọn một file ảnh.' });
    }

    const mimeExt = req.file.mimetype.split('/')[1].replace('jpeg', 'jpg');
    const ext = ['jpg', 'png', 'gif', 'webp'].includes(mimeExt) ? mimeExt : 'jpg';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const { folder, relativePath } = getDateFolder();
    fs.writeFileSync(path.join(folder, filename), req.file.buffer);

    const url = `${getBaseUrl(req)}/uploads/${relativePath}/${filename}`;
    return res.status(200).json({ status: 'success', data: { url } });
  } catch (error) {
    console.error('uploadAttendanceFileLocal error:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Lỗi lưu ảnh điểm danh' });
  }
};

module.exports = { uploadAttendanceImageLocal, uploadAttendanceFileLocal };
