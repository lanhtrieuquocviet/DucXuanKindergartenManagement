const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');

async function fixDescriptions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const updates = [
      { code: 'MANAGE_HEALTH', description: 'Quản lý sức khỏe học sinh' },
      { code: 'MANAGE_HEALTH_INCIDENTS', description: 'Ghi nhận bất thường' },
      { code: 'MANAGE_ACADEMIC_PLAN', description: 'Thiết lập kế hoạch' },
      { code: 'MANAGE_ACADEMIC_EVENTS', description: 'Thiết lập sự kiện' },
      { code: 'MANAGE_VIDEOS', description: 'Quản lý Video-clip' },
      { code: 'MANAGE_DOCUMENTS', description: 'Quản lý tài liệu' }
    ];

    for (const u of updates) {
      await Permission.findOneAndUpdate({ code: u.code }, { description: u.description });
      console.log(`Updated description for ${u.code}`);
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixDescriptions();
