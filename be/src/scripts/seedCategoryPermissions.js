const mongoose = require('mongoose');
const Permission = require('../models/Permission');
require('dotenv').config({ path: './be/.env' });

const permissions = [
  { code: 'MANAGE_FACILITY_CATEGORY', description: 'Quản lý danh mục cơ sở vật chất', group: 'Cơ sở vật chất' },
  { code: 'MANAGE_ASSET_CATEGORY', description: 'Quản lý nhóm tài sản', group: 'Tài sản' },
  { code: 'MANAGE_INGREDIENT_CATEGORY', description: 'Quản lý nhóm nguyên liệu', group: 'Dinh dưỡng' },
  { code: 'MANAGE_STAFF_POSITION', description: 'Quản lý chức vụ nhân sự', group: 'Nhân sự' },
];

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/DucXuanKindergarten';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    for (const p of permissions) {
      await Permission.findOneAndUpdate(
        { code: p.code },
        p,
        { upsert: true, new: true }
      );
      console.log(`Permission ${p.code} seeded`);
    }

    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
