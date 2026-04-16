const cloudinary = require('cloudinary').v2;

// Sử dụng CLOUDINARY_URL trong .env (hoặc các biến CLOUDINARY_* nếu có)
cloudinary.config();

const MEDIA_FOLDER = process.env.CLOUDINARY_MEDIA_FOLDER || 'avatars';
const BLOG_FOLDER = process.env.CLOUDINARY_BLOG_FOLDER || 'blogs';
const KITCHEN_FOLDER = process.env.CLOUDINARY_KITCHEN_FOLDER || 'kitchen';
const ATTENDANCE_FOLDER = process.env.CLOUDINARY_ATTENDANCE_FOLDER || 'attendance';
const PURCHASE_FOLDER = process.env.CLOUDINARY_PURCHASE_FOLDER || 'purchase-requests';
const TEACHER_NOTE_FOLDER = process.env.CLOUDINARY_TEACHER_NOTE_FOLDER || 'teacher-notes';

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

/**
 * POST /api/cloudinary/upload-blog-file
 * Upload file PDF hoặc Word lên Cloudinary, trả về URL + loại file (cần đăng nhập + SchoolAdmin)
 */
const uploadBlogFile = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng chọn file PDF hoặc Word.',
      });
    }

    const config = cloudinary.config();
    if (!config.api_key || !config.api_secret || !config.cloud_name) {
      return res.status(500).json({
        status: 'error',
        message: 'Cloudinary chưa được cấu hình trong server.',
      });
    }

    let fileType = 'pdf';
    if (req.file.mimetype === 'application/pdf') {
      fileType = 'pdf';
    } else if (req.file.mimetype === 'application/msword') {
      fileType = 'word';
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      fileType = 'word';
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Định dạng file không được hỗ trợ.',
      });
    }

    const originalName = String(req.file.originalname || '').trim();
    const safeName = originalName
      .replace(/[^\w.\-]+/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '');

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: BLOG_FOLDER,
          use_filename: true,
          unique_filename: true,
          filename_override: safeName || undefined,
        },
        (error, uploadResult) => {
          if (error) return reject(error);
          resolve(uploadResult);
        }
      ).end(req.file.buffer);
    });

    return res.status(200).json({
      status: 'success',
      data: { url: result.secure_url, type: fileType },
    });
  } catch (error) {
    console.error('Upload blog file error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không tải lên được file',
    });
  }
};

/**
 * POST /api/cloudinary/upload-kitchen-image
 * Upload ảnh bếp (ảnh món ăn / mẫu thực phẩm) - KitchenStaff
 */
const uploadKitchenImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng chọn một file ảnh.' });
    }

    const config = cloudinary.config();
    if (!config.api_key || !config.api_secret || !config.cloud_name) {
      return res.status(500).json({ status: 'error', message: 'Cloudinary chưa được cấu hình.' });
    }

    const dataUri = `data:${req.file.mimetype || 'image/jpeg'};base64,${req.file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: KITCHEN_FOLDER,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
    });

    return res.status(200).json({ status: 'success', data: { url: result.secure_url } });
  } catch (error) {
    console.error('Upload kitchen image error:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Không tải lên được ảnh' });
  }
};

/**
 * POST /api/cloudinary/upload-attendance-image
 * Upload ảnh điểm danh từ base64 (chụp từ camera AI)
 * Body: { imageBase64: "data:image/jpeg;base64,..." }
 */
const uploadAttendanceImage = async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || !imageBase64.startsWith('data:image')) {
      return res.status(400).json({ status: 'error', message: 'Thiếu imageBase64 hợp lệ' });
    }

    const result = await cloudinary.uploader.upload(imageBase64, {
      folder: ATTENDANCE_FOLDER,
      resource_type: 'image',
      quality: 'auto:low', // Nén nhẹ để tiết kiệm dung lượng
    });

    return res.status(200).json({
      status: 'success',
      data: { url: result.secure_url },
    });
  } catch (error) {
    console.error('uploadAttendanceImage error:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Lỗi upload ảnh điểm danh' });
  }
};

/**
 * POST /api/cloudinary/upload-purchase-image
 * Upload ảnh bằng chứng yêu cầu mua sắm - Teacher
 */
const uploadPurchaseImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng chọn một file ảnh.' });
    }

    const config = cloudinary.config();
    if (!config.api_key || !config.api_secret || !config.cloud_name) {
      return res.status(500).json({ status: 'error', message: 'Cloudinary chưa được cấu hình.' });
    }

    const dataUri = `data:${req.file.mimetype || 'image/jpeg'};base64,${req.file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: PURCHASE_FOLDER,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
    });

    return res.status(200).json({ status: 'success', data: { url: result.secure_url } });
  } catch (error) {
    console.error('Upload purchase image error:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Không tải lên được ảnh' });
  }
};

const uploadNoteImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng chọn một file ảnh.' });
    }
    const config = cloudinary.config();
    if (!config.api_key || !config.api_secret || !config.cloud_name) {
      return res.status(500).json({ status: 'error', message: 'Cloudinary chưa được cấu hình.' });
    }
    const dataUri = `data:${req.file.mimetype || 'image/jpeg'};base64,${req.file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: TEACHER_NOTE_FOLDER,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
    });
    return res.status(200).json({ status: 'success', data: { url: result.secure_url } });
  } catch (error) {
    console.error('Upload note image error:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Không tải lên được ảnh' });
  }
};

module.exports = {
  getMediaLibrarySignature,
  uploadAvatar,
  uploadBlogImage,
  uploadBlogFile,
  uploadKitchenImage,
  uploadAttendanceImage,
  uploadPurchaseImage,
  uploadNoteImage,
};

