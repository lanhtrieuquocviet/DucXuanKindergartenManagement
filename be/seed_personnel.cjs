const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Simple Schemas
const UserSchema = new mongoose.Schema({
  username: String,
  passwordHash: String,
  fullName: String,
  email: String,
  phone: String,
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
  status: { type: String, default: 'active' },
  avatar: String
}, { timestamps: true, collection: 'User' });

const StaffSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fullName: String,
  email: String,
  phone: String,
  employeeId: String,
  position: String,
  status: { type: String, default: 'active' },
  notes: String
}, { timestamps: true, collection: 'Staff' });

const RoleSchema = new mongoose.Schema({
  roleName: String,
  description: String
}, { collection: 'Roles' });

const User = mongoose.model('User', UserSchema);
const Staff = mongoose.model('Staff', StaffSchema);
const Role = mongoose.model('Role', RoleSchema);

async function seed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/dxmn');
    console.log('Connected to dxmn');

    const roles = await Role.find().lean();
    const roleMap = {};
    roles.forEach(r => { roleMap[r.roleName] = r._id; });

    const salt = await bcrypt.genSalt(10);
    const commonPassword = await bcrypt.hash('123456', salt);

    // 1. Sync existing SchoolAdmin
    const schoolAdmin = await User.findOne({ username: 'schooladmin' });
    if (schoolAdmin) {
      const existingStaff = await Staff.findOne({ userId: schoolAdmin._id });
      if (!existingStaff) {
        await Staff.create({
          userId: schoolAdmin._id,
          fullName: schoolAdmin.fullName,
          email: schoolAdmin.email,
          phone: schoolAdmin.phone,
          employeeId: 'SA001',
          position: 'Ban Giám Hiệu',
          notes: 'Tài khoản quản trị trường'
        });
        console.log('Synced SchoolAdmin to Staff');
      }
    }

    // 2. Add sample Teachers
    const sampleStaff = [
      { username: 'gv01', fullName: 'Nguyễn Thị Hoa', email: 'hoa.nt@example.com', phone: '0912345671', role: 'Teacher', pos: 'Giáo viên' },
      { username: 'gv02', fullName: 'Lê Văn Tám', email: 'tam.lv@example.com', phone: '0912345672', role: 'Teacher', pos: 'Giáo viên' },
      { username: 'nb01', fullName: 'Trần Thị Bếp', email: 'bep.tt@example.com', phone: '0912345673', role: 'KitchenStaff', pos: 'Nhân viên nhà bếp' },
      { username: 'yt01', fullName: 'Phạm Văn Y', email: 'y.pv@example.com', phone: '0912345674', role: 'MedicalStaff', pos: 'Nhân viên y tế' },
    ];

    for (const item of sampleStaff) {
      const exists = await User.findOne({ username: item.username });
      if (!exists) {
        const newUser = await User.create({
          username: item.username,
          passwordHash: commonPassword,
          fullName: item.fullName,
          email: item.email,
          phone: item.phone,
          roles: [roleMap[item.role]],
          status: 'active'
        });

        await Staff.create({
          userId: newUser._id,
          fullName: item.fullName,
          email: item.email,
          phone: item.phone,
          employeeId: `${item.username.toUpperCase()}001`,
          position: item.pos,
          notes: 'Dữ liệu mẫu'
        });
        console.log(`Created sample: ${item.fullName} (${item.pos})`);
      }
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
