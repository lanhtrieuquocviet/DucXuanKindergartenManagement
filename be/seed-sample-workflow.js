const mongoose = require('mongoose');
const BPMWorkflow = require('./src/models/BPMWorkflow');
const User = require('./src/models/User'); // Import User model
require('dotenv').config();

const sampleWorkflow = {
  name: "Quy trình Điểm danh Thông minh (Mẫu)",
  description: "Quy trình tự động kiểm tra server và minh chứng ảnh khi đón trẻ",
  module: "attendance",
  status: "active",
  nodes: [
    { id: 'start', type: 'input', position: { x: 100, y: 150 }, data: { label: '1. Bắt đầu' } },
    { id: 'check_server', type: 'audit_service_status', position: { x: 300, y: 150 }, data: { label: '2. Kiểm tra Server AI' } },
    { id: 'ai_node', type: 'ai_student', position: { x: 550, y: 150 }, data: { label: '3. AI Nhận diện' } },
    { id: 'check_photo', type: 'audit_photo_proof', position: { x: 800, y: 150 }, data: { label: '4. Kiểm tra Ảnh minh chứng' } },
    { id: 'save', type: 'save_record', position: { x: 1050, y: 150 }, data: { label: '5. Lưu dữ liệu' } },
    { id: 'end', type: 'output', position: { x: 1300, y: 150 }, data: { label: '6. Kết thúc' } }
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'check_server', animated: true },
    { id: 'e2', source: 'check_server', target: 'ai_node', sourceHandle: 'true', animated: true },
    { id: 'e3', source: 'ai_node', target: 'check_photo', animated: true },
    { id: 'e4', source: 'check_photo', target: 'save', sourceHandle: 'true', animated: true },
    { id: 'e5', source: 'save', target: 'end', animated: true }
  ],
  version: 1
};

async function seedSampleWorkflow() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/DucXuanKindergarten';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Lấy một admin bất kỳ để gán createdBy
    const admin = await User.findOne();
    if (!admin) throw new Error('Cần tạo tài khoản trong hệ thống trước');
    
    sampleWorkflow.createdBy = admin._id;

    // Đặt các workflow cũ của module attendance về draft để workflow này là active duy nhất
    await BPMWorkflow.updateMany({ module: 'attendance' }, { status: 'draft' });
    
    // Nạp workflow mới
    await BPMWorkflow.create(sampleWorkflow);

    console.log('Successfully seeded Sample Attendance Workflow!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding workflow:', err);
    process.exit(1);
  }
}

seedSampleWorkflow();
