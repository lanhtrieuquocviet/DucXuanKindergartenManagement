const express = require('express');
const multer = require('multer');
const { getMediaLibrarySignature, uploadAvatar, uploadBlogImage } = require('../controller/cloudinaryController');
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

// Tạo chữ ký cho Media Library widget
router.get('/media-library-signature', getMediaLibrarySignature);

// Upload ảnh đại diện từ máy (cần đăng nhập)
router.post(
  '/upload-avatar',
  authenticate,
  uploadMiddleware.single('avatar'),
  uploadAvatar,
  handleUploadError
);

// Upload ảnh blog từ máy (cần đăng nhập + SchoolAdmin)
router.post(
  '/upload-blog-image',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  uploadMiddleware.single('image'),
  uploadBlogImage,
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

