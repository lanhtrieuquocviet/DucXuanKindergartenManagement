const cloudinary = require('cloudinary').v2;

// Sử dụng CLOUDINARY_URL trong .env (hoặc các biến CLOUDINARY_* nếu có)
cloudinary.config();

const MEDIA_FOLDER = process.env.CLOUDINARY_MEDIA_FOLDER || 'avatars';
const BLOG_FOLDER = process.env.CLOUDINARY_BLOG_FOLDER || 'blogs';

/**
 * POST /api/cloudinary/upload-avatar
 * Upload ảnh từ máy lên Cloudinary, trả về URL (cần đăng nhập)
 */
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng chọn một file ảnh.',
      });
    }

    const config = cloudinary.config();
    if (!config.api_key || !config.api_secret || !config.cloud_name) {
      return res.status(500).json({
        status: 'error',
        message: 'Cloudinary chưa được cấu hình.',
      });
    }

    const dataUri = `data:${req.file.mimetype || 'image/jpeg'};base64,${req.file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: MEDIA_FOLDER,
      resource_type: 'image',
    });

    return res.status(200).json({
      status: 'success',
      data: { url: result.secure_url },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Upload avatar error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không tải lên được ảnh',
    });
  }
};

/**
 * POST /api/cloudinary/upload-blog-image
 * Upload ảnh blog từ máy lên Cloudinary, trả về URL (cần đăng nhập + SchoolAdmin)
 */
const uploadBlogImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng chọn một file ảnh.',
      });
    }

    const config = cloudinary.config();
    if (!config.api_key || !config.api_secret || !config.cloud_name) {
      console.error('Cloudinary config missing:', { api_key: !!config.api_key, api_secret: !!config.api_secret, cloud_name: !!config.cloud_name });
      return res.status(500).json({
        status: 'error',
        message: 'Cloudinary chưa được cấu hình trong server.',
      });
    }

    const dataUri = `data:${req.file.mimetype || 'image/jpeg'};base64,${req.file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: BLOG_FOLDER,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
    });

    return res.status(200).json({
      status: 'success',
      data: { url: result.secure_url },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Upload blog image error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không tải lên được ảnh',
    });
  }
};

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
  uploadAvatar,
  uploadBlogImage,
};

