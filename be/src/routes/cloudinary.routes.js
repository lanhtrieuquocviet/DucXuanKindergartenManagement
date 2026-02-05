const express = require('express');
const multer = require('multer');
const { getMediaLibrarySignature, uploadAvatar } = require('../controller/cloudinaryController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
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
router.post('/upload-avatar', authenticate, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ status: 'error', message: err.message || 'File không hợp lệ.' });
    }
    next();
  });
}, uploadAvatar);

module.exports = router;

