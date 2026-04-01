const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const BPMWorkflow = require('./src/models/BPMWorkflow');
const User = require('./src/models/User');

async function seedAdvancedBPM() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    // Tìm một tài khoản Admin để gán làm người tạo
    const admin = await User.findOne();
    if (!admin) {
      throw new Error('Không tìm thấy tài khoản người dùng nào để gán createdBy');
    }
    const adminId = admin._id;

    // Xóa các mẫu cũ để nạp mẫu mới chuẩn chỉnh
    await BPMWorkflow.deleteMany({ module: { $in: ['attendance', 'leave'] } });

    // --- 1. QUY TRÌNH CHECK-IN (ĐIỂM DANH ĐẾN) ---
    await BPMWorkflow.create({
      name: 'Quy trình Check-in Học sinh (AI + Thông báo)',
      module: 'attendance',
      status: 'active',
      createdBy: adminId,
      nodes: [
        { id: 'start', type: 'input', data: { label: 'START' }, position: { x: 250, y: 0 } },
        { id: 'notify-late', data: { label: 'Tự động gửi thông báo (Nếu sau 8h)' }, position: { x: 250, y: 80 }, style: { background: '#fff9c4' } },
        { id: 'ai-student', data: { label: 'AI nhận diện Học sinh' }, position: { x: 250, y: 160 } },
        { id: 'verify-info', data: { label: 'Hiển thị & Xác nhận thông tin' }, position: { x: 250, y: 240 } },
        { id: 'check-time', data: { label: 'Kiểm tra thời gian (Đến muộn?)' }, position: { x: 250, y: 320 } },
        { id: 'ai-parent', data: { label: 'AI nhận diện Phụ huynh' }, position: { x: 250, y: 400 } },
        { id: 'auth-parent', data: { label: 'Xác nhận Phụ huynh (Nhanh/OTP)' }, position: { x: 250, y: 480 } },
        { id: 'item-check', data: { label: 'Nhập thông tin đồ mang theo' }, position: { x: 250, y: 560 } },
        { id: 'note', data: { label: 'Nhập ghi chú (Optional)' }, position: { x: 250, y: 640 } },
        { id: 'save', data: { label: 'Lưu thông tin & Bắn thông báo về App' }, position: { x: 250, y: 720 }, style: { background: '#c8e6c9' } },
        { id: 'end', type: 'output', data: { label: 'COMPLETE' }, position: { x: 250, y: 800 } }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'notify-late', animated: true },
        { id: 'e2', source: 'notify-late', target: 'ai-student' },
        { id: 'e3', source: 'ai-student', target: 'verify-info' },
        { id: 'e4', source: 'verify-info', target: 'check-time' },
        { id: 'e5', source: 'check-time', target: 'ai-parent' },
        { id: 'e6', source: 'ai-parent', target: 'auth-parent' },
        { id: 'e7', source: 'auth-parent', target: 'item-check' },
        { id: 'e8', source: 'item-check', target: 'note' },
        { id: 'e9', source: 'note', target: 'save' },
        { id: 'e10', source: 'save', target: 'end', animated: true }
      ]
    });

    // --- 2. QUY TRÌNH CHECK-OUT (ĐIỂM DANH VỀ) ---
    await BPMWorkflow.create({
      name: 'Quy trình Check-out (Đón về)',
      module: 'attendance',
      status: 'archived', // Tạm thời để archived để test việc phân loại
      createdBy: adminId,
      nodes: [
        { id: 'start', type: 'input', data: { label: 'START' }, position: { x: 500, y: 0 } },
        { id: 'notify-late', data: { label: 'Sau 15h chưa checkout -> Gửi thông báo' }, position: { x: 500, y: 80 }, style: { background: '#fff9c4' } },
        { id: 'parent-arrive', data: { label: 'Phụ huynh đến đón' }, position: { x: 500, y: 160 } },
        { id: 'ai-student', data: { label: 'AI nhận diện Học sinh' }, position: { x: 500, y: 240 } },
        { id: 'ai-parent', data: { label: 'AI nhận diện Phụ huynh' }, position: { x: 500, y: 320 } },
        { id: 'auth', data: { label: 'Xác nhận Phụ huynh (Nhanh/OTP)' }, position: { x: 500, y: 400 } },
        { id: 'save', data: { label: 'Lưu & Gửi thông báo hoàn tất' }, position: { x: 500, y: 480 }, style: { background: '#c8e6c9' } },
        { id: 'end', type: 'output', data: { label: 'COMPLETE' }, position: { x: 500, y: 560 } }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'notify-late', animated: true },
        { id: 'e2', source: 'notify-late', target: 'parent-arrive' },
        { id: 'e3', source: 'parent-arrive', target: 'ai-student' },
        { id: 'e4', source: 'ai-student', target: 'ai-parent' },
        { id: 'e5', source: 'ai-parent', target: 'auth' },
        { id: 'e6', source: 'auth', target: 'save' },
        { id: 'e7', source: 'save', target: 'end', animated: true }
      ]
    });

    // --- 3. QUY TRÌNH VẮNG MẶT ---
    await BPMWorkflow.create({
      name: 'Quy trình Xác nhận Vắng mặt',
      module: 'leave',
      status: 'active',
      createdBy: adminId,
      nodes: [
        { id: 'start', type: 'input', data: { label: 'START' }, position: { x: 750, y: 0 } },
        { id: 'select', data: { label: 'Chọn học sinh vắng mặt' }, position: { x: 750, y: 80 } },
        { id: 'reason', data: { label: 'Chọn lý do & Nhập ghi chú' }, position: { x: 750, y: 160 } },
        { id: 'save', data: { label: 'Lưu & Thông báo cho Phụ huynh' }, position: { x: 750, y: 240 }, style: { background: '#c8e6c9' } },
        { id: 'end', type: 'output', data: { label: 'COMPLETE' }, position: { x: 750, y: 320 } }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'select', animated: true },
        { id: 'e2', source: 'select', target: 'reason' },
        { id: 'e3', source: 'reason', target: 'save' },
        { id: 'e4', source: 'save', target: 'end', animated: true }
      ]
    });

    console.log('✅ Đã nạp thành công 3 quy trình BPM chuyên sâu!');
    process.exit(0);
  } catch (err) {
    console.error('Lỗi Seeding:', err);
    process.exit(1);
  }
}

seedAdvancedBPM();
