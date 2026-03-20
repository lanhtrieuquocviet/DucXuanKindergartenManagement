const express = require('express');
const multer = require('multer');
const { getMediaLibrarySignature, uploadAvatar, uploadBlogImage, uploadBlogFile, uploadKitchenImage } = require('../controller/cloudinaryController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

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

/**
 * @openapi
 * /api/cloudinary/media-library-signature:
 *   get:
 *     summary: Tạo chữ ký cho Media Library widget
 *     tags:
 *       - Media
 *     responses:
 *       200:
 *         description: Trả về signature và các thông số cần thiết
 */
router.get('/media-library-signature', getMediaLibrarySignature);

/**
 * @openapi
 * /api/cloudinary/upload-avatar:
 *   post:
 *     summary: Upload ảnh đại diện từ máy
 *     tags:
 *       - Media
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
 *     responses:
 *       200:
 *         description: Upload thành công
 */
router.post(
  '/upload-avatar',
  authenticate,
  uploadMiddleware.single('avatar'),
  uploadAvatar,
  handleUploadError
);

/**
 * @openapi
 * /api/cloudinary/upload-blog-image:
 *   post:
 *     summary: Upload ảnh blog từ máy
 *     tags:
 *       - Media
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
 *     responses:
 *       200:
 *         description: Upload thành công
 */
router.post(
  '/upload-blog-image',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  uploadMiddleware.single('image'),
  uploadBlogImage,
  handleUploadError
);

const blogFileUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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
 * /api/cloudinary/upload-blog-file:
 *   post:
 *     summary: Upload file PDF/Word cho blog
 *     tags:
 *       - Media
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
 *     responses:
 *       200:
 *         description: Upload thành công
 */
router.post(
  '/upload-blog-file',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  blogFileUploadMiddleware.single('file'),
  uploadBlogFile,
  handleUploadError
);

/**
 * @openapi
 * /api/cloudinary/upload-kitchen-image:
 *   post:
 *     summary: Upload ảnh bếp (ảnh món ăn / mẫu thực phẩm)
 *     tags:
 *       - Media
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
 *     responses:
 *       200:
 *         description: Upload thành công
 */
router.post(
  '/upload-kitchen-image',
  authenticate,
  authorizeRoles('KitchenStaff'),
  uploadMiddleware.single('image'),
  uploadKitchenImage,
  handleUploadError
);

// Middleware xử lý lỗi upload
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        status: 'error',
        message: 'File quá lớn (tối đa 5MB)',
      });
    }
    return res.status(400).json({
      status: 'error',
      message: err.message || 'Lỗi upload file',
    });
  }
  if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message || 'Lỗi xử lý file',
    });
  }
  next();
}

module.exports = router;

