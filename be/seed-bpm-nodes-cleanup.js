const mongoose = require('mongoose');
const BPMNodeDefinition = require('./src/models/BPMNodeDefinition');
require('dotenv').config();

const essentialNodes = [
  // Hệ thống
  { type: 'input', label: '1. Bắt đầu (Start)', color: '#f8fafc', category: 'system' },
  { type: 'output', label: 'X. Kết thúc (End)', color: '#fff1f2', category: 'system' },
  
  // AI
  { type: 'ai_student', label: 'AI: Nhận diện Học sinh', color: '#f0f9ff', category: 'ai' },
  { type: 'ai_parent', label: 'AI: Nhận diện Người đón', color: '#fdf4ff', category: 'ai' },
  
  // Logic & Audit
  { type: 'condition_time', label: 'Logic: Kiểm tra Giờ', color: '#fffbeb', category: 'logic' },
  { type: 'audit_photo_proof', label: 'Audit: Kiểm tra Ảnh', color: '#f0fdf4', category: 'audit' },
  { type: 'audit_parent_auth', label: 'Audit: Xác thực Phụ huynh', color: '#ecfdf5', category: 'audit' },
  { type: 'audit_anomaly', label: 'Audit: Kiểm tra Bất thường', color: '#fff7ed', category: 'audit' },
  
  // Hành động
  { type: 'save_record', label: 'Action: Lưu dữ liệu', color: '#f0fdf4', category: 'action' },
  { type: 'notify_checkin', label: 'Action: Báo tin Đón trẻ', color: '#f5f3ff', category: 'action' },
  { type: 'notify_checkout', label: 'Action: Báo tin Trả trẻ', color: '#f5f3ff', category: 'action' },
  { type: 'teacher_verify', label: 'Action: Giáo viên xác nhận', color: '#fafaf9', category: 'action' }
];

async function seedEssentialNodes() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/DucXuanKindergarten';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Xóa toàn bộ node cũ để làm sạch
    await BPMNodeDefinition.deleteMany({});
    
    // Nạp bộ node tinh gọn
    await BPMNodeDefinition.insertMany(essentialNodes);

    console.log('Successfully cleaned up and seeded Essential BPM Nodes!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding nodes:', err);
    process.exit(1);
  }
}

seedEssentialNodes();
