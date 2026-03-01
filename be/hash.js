const bcrypt = require('bcryptjs');

// Mật khẩu gốc bạn muốn dùng cho admin01
const PASSWORD = '123';

(async () => {
  try {
    const hash = await bcrypt.hash(PASSWORD, 10);
    console.log('Plain password :', PASSWORD);
    console.log('BCrypt hash    :', hash);
    console.log('\n👉 Hãy copy chuỗi hash này và dán vào field "passwordHash" của user admin01 trong MongoDB Atlas.');
  } catch (err) {
    console.error('Error generating hash:', err.message);
  }
})();

