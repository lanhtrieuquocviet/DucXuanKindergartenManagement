  const nodemailer = require('nodemailer');

// ============================================
// Email Configuration
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

module.exports = {
  sendPasswordResetEmail,
  generateRandomPassword,
  createTransporter,
};
