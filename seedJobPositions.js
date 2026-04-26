const mongoose = require('mongoose');
const JobPosition = require('./be/src/models/JobPosition');
require('dotenv').config();

const seedJobPositions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/DucXuanKindergarten');
    console.log('Connected to MongoDB');

    const defaultPositions = [
      { title: 'Ban Giám Hiệu', roleName: 'SchoolAdmin', isDefault: true },
      { title: 'Giáo viên', roleName: 'Teacher', isDefault: true },
      { title: 'Nhân viên nhà bếp', roleName: 'KitchenStaff', isDefault: true },
      { title: 'Nhân viên y tế', roleName: 'MedicalStaff', isDefault: true },
      { title: 'Tổ trưởng chuyên môn', roleName: 'HeadTeacher', isDefault: true },
      { title: 'Nhân viên văn phòng', roleName: null, isDefault: true },
      { title: 'Bảo vệ', roleName: null, isDefault: true },
      { title: 'Lao công', roleName: null, isDefault: true },
    ];

    for (const pos of defaultPositions) {
      await JobPosition.findOneAndUpdate(
        { title: pos.title },
        pos,
        { upsert: true, new: true }
      );
    }

    console.log('Seed job positions successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed job positions failed:', error);
    process.exit(1);
  }
};

seedJobPositions();
