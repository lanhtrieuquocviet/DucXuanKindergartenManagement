const cloudinary = require('cloudinary').v2;

// Sử dụng CLOUDINARY_URL trong .env (hoặc các biến CLOUDINARY_* nếu có)
cloudinary.config();

/**
 * GET /api/cloudinary/media-library-signature
 * Tạo chữ ký cho Cloudinary Media Library widget (chỉ dùng trên server)
 */
const getMediaLibrarySignature = (req, res) => {
  try {
    const config = cloudinary.config();

    if (!config.api_key || !config.api_secret || !config.cloud_name) {
      return res.status(500).json({
        status: 'error',
        message:
          'Cloudinary chưa được cấu hình đầy đủ. Vui lòng kiểm tra CLOUDINARY_URL hoặc CLOUDINARY_* trong file .env của backend.',
      });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);

    // Các tham số dùng để ký cho Media Library
    const paramsToSign = {
      timestamp,
      source: 'media_library',
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      config.api_secret,
    );

    return res.status(200).json({
      status: 'success',
      data: {
        timestamp,
        signature,
        cloudName: config.cloud_name,
        apiKey: config.api_key,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Cloudinary signature error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không tạo được chữ ký Cloudinary',
    });
  }
};

module.exports = {
  getMediaLibrarySignature,
};

