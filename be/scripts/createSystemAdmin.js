require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const Role = require('../src/models/Role');
  const User = require('../src/models/User');

  const role = await Role.findOne({ roleName: 'SystemAdmin' });
  if (!role) {
    console.log('❌ Roles chưa được seed. Hãy khởi động server trước (Bước 2).');
    process.exit(1);
  }

  const existing = await User.findOne({ username: 'SystemAdmin' });
  if (existing) {
    console.log('⚠️  SystemAdmin đã tồn tại, không tạo lại.');
    process.exit(0);
  }

  const hashed = await bcrypt.hash('Admin@123456', 10);
  const user = await User.create({
    username: 'SystemAdmin',
    passwordHash: hashed,
    fullName: 'System Administrator',
    email: 'admin@ducxuan.edu.vn',
    roles: [role._id],
    status: 'active',
  });

  console.log('✅ SystemAdmin tạo thành công!');
  console.log('   Username: SystemAdmin');
  console.log('   Password: Admin@123456');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
