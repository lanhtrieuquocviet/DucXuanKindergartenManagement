const express = require('express');
const { getMediaLibrarySignature } = require('../controller/cloudinaryController');

const router = express.Router();

// Tạo chữ ký cho Media Library widget
router.get('/media-library-signature', getMediaLibrarySignature);

module.exports = router;

