const express = require('express');
const multer = require('multer');
const { getMediaLibrarySignature, uploadAvatar, uploadBlogImage, uploadBlogFile, uploadKitchenImage, uploadPurchaseImage, uploadNoteImage } = require('../controller/cloudinaryController');
const { uploadAttendanceImageLocal, uploadAttendanceFileLocal } = require('../controller/localUploadController');
const { authenticate, authorizeRoles, authorizePermissions } = require('../middleware/auth');

const router = express.Router();

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype);
    if (allowed) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP).'));
  },
});

const blogFileUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file PDF hoặc Word (.doc, .docx).'));
  },
});

/**
 * @openapi
 * /api/cloudinary/media-library-signature:
 *   get:
 *     summary: Lấy chữ ký cho Cloudinary Media Library widget
 *     tags:
 *       - Cloudinary
 *     responses:
 *       200:
 *         description: Chữ ký Cloudinary
 */
router.get('/media-library-signature', getMediaLibrarySignature);

/**
 * @openapi
 * /api/cloudinary/upload-avatar:
 *   post:
 *     summary: Upload ảnh đại diện người dùng
 *     tags:
 *       - Cloudinary
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh (JPEG, PNG, GIF, WebP, tối đa 5MB)
 *     responses:
 *       200:
 *         description: Upload thành công, trả về URL ảnh
 *       400:
 *         description: File không hợp lệ hoặc quá lớn
 */
router.post('/upload-avatar', authenticate, uploadMiddleware.single('avatar'), uploadAvatar, handleUploadError);

/**
 * @openapi
 * /api/cloudinary/upload-blog-image:
 *   post:
 *     summary: Upload ảnh cho bài viết blog (SchoolAdmin)
 *     tags:
 *       - Cloudinary
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh (tối đa 5MB)
 *     responses:
 *       200:
 *         description: Upload thành công
 *       403:
 *         description: Không có quyền SchoolAdmin
 */
router.post('/upload-blog-image', authenticate, authorizePermissions('MANAGE_BLOG'), uploadMiddleware.single('image'), uploadBlogImage, handleUploadError);

/**
 * @openapi
 * /api/cloudinary/upload-blog-file:
 *   post:
 *     summary: Upload file PDF/Word cho bài viết blog (SchoolAdmin)
 *     tags:
 *       - Cloudinary
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File PDF hoặc Word (tối đa 10MB)
 *     responses:
 *       200:
 *         description: Upload thành công
 *       400:
 *         description: File không hợp lệ
 *       403:
 *         description: Không có quyền SchoolAdmin
 */
router.post('/upload-blog-file', authenticate, authorizePermissions('MANAGE_BLOG'), blogFileUploadMiddleware.single('file'), uploadBlogFile, handleUploadError);

/**
 * @openapi
 * /api/cloudinary/upload-kitchen-image:
 *   post:
 *     summary: Upload ảnh bếp (ảnh món ăn / mẫu thực phẩm) - KitchenStaff
 *     tags:
 *       - Cloudinary
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh (tối đa 5MB)
 *     responses:
 *       200:
 *         description: Upload thành công
 *       403:
 *         description: Không có quyền KitchenStaff
 */
router.post('/upload-kitchen-image', authenticate, authorizePermissions('MANAGE_MEAL_PHOTO'), uploadMiddleware.single('image'), uploadKitchenImage, handleUploadError);

// Upload ảnh điểm danh AI (base64 JSON) → lưu server local, không đẩy lên cloud
router.post('/upload-attendance-image', authenticate, authorizePermissions('MANAGE_ATTENDANCE'), uploadAttendanceImageLocal);

// Upload ảnh điểm danh thủ công (file/camera) → lưu server local
router.post('/upload-attendance-file', authenticate, authorizePermissions('MANAGE_ATTENDANCE'), uploadMiddleware.single('image'), uploadAttendanceFileLocal, handleUploadError);

// Upload ảnh bằng chứng yêu cầu mua sắm (Teacher)
router.post('/upload-purchase-image', authenticate, authorizePermissions('MANAGE_PURCHASE_REQUEST'), uploadMiddleware.single('image'), uploadPurchaseImage, handleUploadError);

// Upload ảnh ghi chú giáo viên
router.post('/upload-note-image', authenticate, authorizeRoles('Teacher'), uploadMiddleware.single('image'), uploadNoteImage, handleUploadError);

function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ status: 'error', message: 'File quá lớn (tối đa 5MB)' });
    }
    return res.status(400).json({ status: 'error', message: err.message || 'Lỗi upload file' });
  }
  if (err) {
    return res.status(400).json({ status: 'error', message: err.message || 'Lỗi xử lý file' });
  }
  next();
}

module.exports = router;
