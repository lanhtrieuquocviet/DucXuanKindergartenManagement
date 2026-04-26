  const nodemailer = require('nodemailer');

// ============================================
// Cấu hình Email
// ============================================

/**
 * Tạo transporter để gửi email
 */
const createTransporter = () => {
  // Cấu hình email từ biến môi trường
  const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true', // true cho 465, false cho các port khác
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  };

  // Kiểm tra nếu thiếu thông tin đăng nhập
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  Email configuration missing. Email sending will be disabled.');
    return null;
  }

  return nodemailer.createTransport(emailConfig);
};

/**
 * Tạo mật khẩu ngẫu nhiên
 * @param {number} length - Độ dài mật khẩu (mặc định 12)
 * @returns {string} - Mật khẩu ngẫu nhiên
 */
const generateRandomPassword = (length = 12) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';
  // Đảm bảo có ít nhất một ký tự từ mỗi loại
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Thêm các ký tự ngẫu nhiên còn lại
  for (let i = password.length; i < length; i += 1) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Xáo trộn mật khẩu
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

/**
 * Gửi email với mật khẩu mới
 * @param {string} to - Email người nhận
 * @param {string} username - Tên tài khoản
 * @param {string} newPassword - Mật khẩu mới
 * @returns {Promise<Object>} - Kết quả gửi email
 */
const sendPasswordResetEmail = async (to, username, newPassword) => {
  const transporter = createTransporter();

  if (!transporter) {
    throw new Error('Email service is not configured. Please check your environment variables.');
  }

  const mailOptions = {
    from: `"DucXuan Kindergarten" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Đặt lại mật khẩu - DucXuan Kindergarten',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            border: 1px solid #e0e0e0;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
            margin: -30px -30px 30px -30px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background-color: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .password-box {
            background-color: #f0f0f0;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            margin: 20px 0;
            font-size: 18px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 2px;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Đặt lại mật khẩu</h1>
          </div>
          
          <div class="content">
            <p>Xin chào <strong>${username}</strong>,</p>
            
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình trong hệ thống quản lý <strong>DucXuan Kindergarten</strong>.</p>
            
            <p>Mật khẩu mới của bạn là:</p>
            
            <div class="password-box">
              ${newPassword}
            </div>
            
            <div class="warning">
              <strong>⚠️ Lưu ý quan trọng:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Vui lòng đăng nhập ngay và đổi mật khẩu này thành mật khẩu mới của riêng bạn</li>
                <li>Không chia sẻ mật khẩu này với bất kỳ ai</li>
                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ với nhà trường ngay lập tức</li>
              </ul>
            </div>
            
            <p>Bạn có thể đăng nhập bằng:</p>
            <ul>
              <li><strong>Tài khoản:</strong> ${username}</li>
              <li><strong>Mật khẩu:</strong> (sử dụng mật khẩu mới ở trên)</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Đăng nhập ngay</a>
            </p>
          </div>
          
          <div class="footer">
            <p>Email này được gửi tự động từ hệ thống quản lý DucXuan Kindergarten.</p>
            <p>Vui lòng không trả lời email này.</p>
            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với nhà trường.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Đặt lại mật khẩu - DucXuan Kindergarten

Xin chào ${username},

Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình trong hệ thống quản lý DucXuan Kindergarten.

Mật khẩu mới của bạn là: ${newPassword}

⚠️ Lưu ý quan trọng:
- Vui lòng đăng nhập ngay và đổi mật khẩu này thành mật khẩu mới của riêng bạn
- Không chia sẻ mật khẩu này với bất kỳ ai
- Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ với nhà trường ngay lập tức

Bạn có thể đăng nhập bằng:
- Tài khoản: ${username}
- Mật khẩu: ${newPassword}

Email này được gửi tự động từ hệ thống quản lý DucXuan Kindergarten.
Vui lòng không trả lời email này.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    // eslint-disable-next-line no-console
    console.log('✅ Email sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

/**
 * Gửi email với mã OTP
 * @param {string} to - Email người nhận
 * @param {string} username - Tên tài khoản
 * @param {string} otpCode - Mã OTP
 * @returns {Promise<Object>} - Kết quả gửi email
 */
const sendOTPEmail = async (to, username, otpCode) => {
  const transporter = createTransporter();

  if (!transporter) {
    throw new Error('Email service is not configured. Please check your environment variables.');
  }

  const mailOptions = {
    from: `"DucXuan Kindergarten" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Mã OTP đặt lại mật khẩu - DucXuan Kindergarten',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            border: 1px solid #e0e0e0;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
            margin: -30px -30px 30px -30px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background-color: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .otp-box {
            background-color: #f0f0f0;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Mã OTP đặt lại mật khẩu</h1>
          </div>
          
          <div class="content">
            <p>Xin chào <strong>${username}</strong>,</p>
            
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình trong hệ thống quản lý <strong>DucXuan Kindergarten</strong>.</p>
            
            <p>Mã OTP của bạn là:</p>
            
            <div class="otp-box">
              ${otpCode}
            </div>
            
            <div class="warning">
              <strong>⚠️ Lưu ý quan trọng:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Mã OTP này có hiệu lực trong <strong>10 phút</strong></li>
                <li>Không chia sẻ mã OTP này với bất kỳ ai</li>
                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ với nhà trường ngay lập tức</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>Email này được gửi tự động từ hệ thống quản lý DucXuan Kindergarten.</p>
            <p>Vui lòng không trả lời email này.</p>
            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với nhà trường.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Mã OTP đặt lại mật khẩu - DucXuan Kindergarten

Xin chào ${username},

Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình trong hệ thống quản lý DucXuan Kindergarten.

Mã OTP của bạn là: ${otpCode}

⚠️ Lưu ý quan trọng:
- Mã OTP này có hiệu lực trong 10 phút
- Không chia sẻ mã OTP này với bất kỳ ai
- Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ với nhà trường ngay lập tức

Email này được gửi tự động từ hệ thống quản lý DucXuan Kindergarten.
Vui lòng không trả lời email này.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    // eslint-disable-next-line no-console
    console.log('✅ OTP Email sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Error sending OTP email:', error);
    throw error;
  }
};

/**
 * Gửi email tạo tài khoản phụ huynh mới
 * @param {string} to
 * @param {string} fullName
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object>}
 */
const sendParentAccountEmail = async (to, fullName, username, password) => {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Email service is not configured. Please check your environment variables.');
  }

  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
  const mailOptions = {
    from: `"DucXuan Kindergarten" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Tài khoản phụ huynh - DucXuan Kindergarten',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color:#0f766e;">Tạo tài khoản phụ huynh thành công</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Nhà trường đã tạo tài khoản cho phụ huynh trên hệ thống DucXuan Kindergarten.</p>
        <p><strong>Tài khoản:</strong> ${username}</p>
        <p><strong>Mật khẩu tạm:</strong> ${password}</p>
        <p>Vui lòng đăng nhập và đổi mật khẩu ngay sau lần đăng nhập đầu tiên để bảo mật.</p>
        <p>
          <a href="${loginUrl}" style="display:inline-block;padding:10px 18px;background:#0f766e;color:#fff;text-decoration:none;border-radius:6px;">
            Đăng nhập hệ thống
          </a>
        </p>
      </div>
    `,
    text: `
Tạo tài khoản phụ huynh thành công

Xin chào ${fullName},
Nhà trường đã tạo tài khoản cho phụ huynh trên hệ thống DucXuan Kindergarten.

Tài khoản: ${username}
Mật khẩu tạm: ${password}

Vui lòng đăng nhập và đổi mật khẩu ngay sau lần đăng nhập đầu tiên để bảo mật.

Đăng nhập: ${loginUrl}
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};

/**
 * Gửi email thông báo tài khoản mới (dùng chung cho Staff/Teacher/Parent)
 */
const sendAccountCredentialsEmail = async (to, fullName, username, password, roleName = 'người dùng') => {
  const transporter = createTransporter();
  if (!transporter) return null;

  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
  const mailOptions = {
    from: `"DucXuan Kindergarten" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Thông tin tài khoản ${roleName} - DucXuan Kindergarten`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Chào mừng bạn đến với DucXuan!</h2>
        </div>
        <div style="padding: 25px; background: #fff;">
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Nhà trường đã khởi tạo tài khoản <strong>${roleName}</strong> cho bạn trên hệ thống quản lý mầm non.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Tên đăng nhập:</strong> ${username}</p>
            <p style="margin: 5px 0;"><strong>Mật khẩu tạm thời:</strong> <span style="color: #0f766e; font-weight: bold; font-family: monospace;">${password}</span></p>
          </div>
          <p style="color: #b91c1c; font-weight: bold; font-size: 0.9rem;">
            ⚠️ Lưu ý: Vì lý do bảo mật, bạn bắt buộc phải đổi mật khẩu ngay sau lần đăng nhập đầu tiên.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${loginUrl}" style="display:inline-block;padding:12px 24px;background:#0f766e;color:#fff;text-decoration:none;border-radius:6px;font-weight: bold;">
              Đăng nhập ngay
            </a>
          </div>
        </div>
        <div style="background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          Email này được gửi tự động từ hệ thống DucXuan Kindergarten. Vui lòng không trả lời.
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};

/**
 * Gửi email thông báo phản hồi liên hệ tới người đã gửi liên hệ
 * @param {string} to - Email người nhận (người đã gửi liên hệ)
 * @param {string} fullName - Họ tên người nhận
 * @param {string} replyContent - Nội dung phản hồi từ trường
 * @param {string} [originalContent] - Nội dung liên hệ gốc (tùy chọn)
 * @returns {Promise<Object|null>} - Kết quả gửi email hoặc null nếu không cấu hình
 */
const sendContactReplyEmail = async (to, fullName, replyContent, originalContent = '') => {
  const transporter = createTransporter();

  if (!transporter) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  Email not sent (no config). Contact reply saved.');
    return null;
  }

  const mailOptions = {
    from: `"Trường Mầm non Đức Xuân" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Phản hồi liên hệ - Trường Mầm non Đức Xuân',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background-color: #f9f9f9; border-radius: 10px; padding: 30px; border: 1px solid #e0e0e0; }
          .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; margin: -30px -30px 30px -30px; }
          .content { background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; }
          .reply-box { background-color: #ecfdf5; border-left: 4px solid #059669; padding: 15px; margin: 15px 0; border-radius: 4px; white-space: pre-wrap; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;font-size:22px;">Phản hồi liên hệ</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${fullName}</strong>,</p>
            <p>Trường Mầm non Đức Xuân đã phản hồi nội dung liên hệ của bạn:</p>
            <div class="reply-box">${replyContent.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>
            <p>Nếu bạn cần trao đổi thêm, vui lòng liên hệ trực tiếp với nhà trường.</p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động từ hệ thống Trường Mầm non Đức Xuân.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Phản hồi liên hệ - Trường Mầm non Đức Xuân

Xin chào ${fullName},

Trường Mầm non Đức Xuân đã phản hồi nội dung liên hệ của bạn:

${replyContent}

Nếu bạn cần trao đổi thêm, vui lòng liên hệ trực tiếp với nhà trường.

---
Email này được gửi tự động từ hệ thống Trường Mầm non Đức Xuân.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    // eslint-disable-next-line no-console
    console.log('✅ Contact reply email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Error sending contact reply email:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendOTPEmail,
  sendParentAccountEmail,
  sendAccountCredentialsEmail,
  generateRandomPassword,
  createTransporter,
  sendContactReplyEmail,
};
