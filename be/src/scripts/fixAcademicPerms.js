const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');
const Role = require('../models/Role');

async function fixAcademicPerms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Đảm bảo các permission cần thiết tồn tại
    const perms = [
      { code: 'MANAGE_ACADEMIC_YEAR', description: 'Quản lý năm học', group: 'Học vụ' },
      { code: 'MANAGE_CURRICULUM', description: 'Quản lý chương trình học', group: 'Học vụ' },
      { code: 'MANAGE_ACADEMIC_PLAN', description: 'Thiết lập kế hoạch', group: 'Học vụ' },
      { code: 'MANAGE_ACADEMIC_EVENTS', description: 'Thiết lập sự kiện', group: 'Học vụ' },
    ];

    for (const p of perms) {
      await Permission.findOneAndUpdate(
        { code: p.code },
        { $set: p },
        { upsert: true, new: true }
      );
      console.log(`Permission ${p.code} synchronized`);
    }

    // 2. Gán các permission này cho SchoolAdmin
    const schoolAdmin = await Role.findOne({ roleName: 'SchoolAdmin' });
    if (schoolAdmin) {
      const permDocs = await Permission.find({ code: { $in: perms.map(p => p.code) } });
      const permIds = permDocs.map(p => p._id);

      for (const id of permIds) {
        if (!schoolAdmin.permissions.includes(id)) {
          schoolAdmin.permissions.push(id);
        }
      }

      await schoolAdmin.save();
      console.log('SchoolAdmin role permissions updated');
    }

    console.log('Done!');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixAcademicPerms();
