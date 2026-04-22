const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const BPMExecutionService = require('../services/bpmExecution.service');
const Attendances = require('../models/Attendances');
const User = require('../models/User');

async function debug() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) throw new Error('MONGODB_URI not found');

    await mongoose.connect(MONGODB_URI);
    console.log('--- ĐÃ KẾT NỐI MONGODB ---');

    // 1. Lấy 1 tài khoản Admin
    const admin = await User.findOne({ username: /admin/i });
    if (!admin) {
        console.log('Không tìm thấy User Admin nào.');
        process.exit(0);
    }

    const req = {
      user: admin,
      ip: '127.0.0.1',
      headers: { 'user-agent': 'BPM-Debug-Script' },
      method: 'POST',
      originalUrl: '/api/debug/bpm'
    };

    // 2. Tìm bản ghi điểm danh
    let record = await Attendances.findOne().sort({createdAt: -1}).populate('studentId');
    
    if (!record) {
      console.log('Không tìm thấy bản ghi nào.');
      process.exit(0);
    }

    console.log(`Đang thử ghi log cho HS: ${record.studentId?.fullName}`);

    // 3. Thực thi log giả
    const { createSystemLog } = require('../utils/systemLog');
    await createSystemLog({
        req,
        action: 'DEBUG_BPM_LOG',
        detail: `Script debug đang ghi log thủ công lúc ${new Date().toISOString()}`
    });

    console.log('--- ĐÃ GHI LOG THỬ NGHIỆM THÀNH CÔNG ---');
    console.log('--- VUI LÒNG F5 LẠI TRANG NHẬT KÝ HỆ THỐNG ---');

    process.exit(0);
  } catch (err) {
    console.error('LỖI DEBUG:', err);
    process.exit(1);
  }
}

debug();
