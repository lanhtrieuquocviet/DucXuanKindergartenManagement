const mongoose = require('mongoose');
const BPMNodeDefinition = require('./src/models/BPMNodeDefinition');
require('dotenv').config();

/**
 * Danh sách node chuẩn của hệ thống BPM.
 * QUAN TRỌNG: category phải khớp chính xác với enum trong BPMNodeDefinition model:
 *   'system' | 'ai' | 'logic' | 'audit' | 'action' | 'Other'
 */
const nodes = [
  // ── Nhóm Hệ thống (System / Flow) ────────────────────────────────────────
  { type: 'input',  label: 'Bắt đầu (Start)', color: '#e3f2fd', category: 'system', description: 'Node bắt đầu của quy trình BPM' },
  { type: 'output', label: 'Kết thúc (End)',  color: '#ffebee', category: 'system', description: 'Node kết thúc của quy trình BPM' },

  // ── Nhóm AI ────────────────────────────────────────────────────────────────
  { type: 'ai_student', label: 'AI: Nhận diện Học sinh',   color: '#f3e5f5', category: 'ai', description: 'Quét và nhận diện khuôn mặt học sinh bằng AI' },
  { type: 'ai_parent',  label: 'AI: Nhận diện Phụ huynh', color: '#f3e5f5', category: 'ai', description: 'Quét và nhận diện khuôn mặt phụ huynh bằng AI' },

  // ── Nhóm Logic & Điều kiện ────────────────────────────────────────────────
  { type: 'condition_time',       label: 'Logic: Kiểm tra Giờ',       color: '#fff3e0', category: 'logic', description: 'Kiểm tra điều kiện thời gian (VD: sau 8h sáng)' },
  { type: 'condition_deliverer',  label: 'Logic: Kiểm tra Người đón', color: '#fff3e0', category: 'logic', description: 'Kiểm tra thông tin người đón học sinh' },
  { type: 'condition_absence',    label: 'Logic: Kiểm tra Phép',      color: '#fff3e0', category: 'logic', description: 'Kiểm tra học sinh có phép nghỉ hợp lệ không' },

  // ── Nhóm Kiểm soát Tuân thủ (Audit) ──────────────────────────────────────
  { type: 'audit_full_class',     label: 'Audit: Kiểm tra đủ sĩ số',             color: '#fff9c4', category: 'audit', description: 'Kiểm tra sĩ số lớp học đủ chưa' },
  { type: 'audit_photo_proof',    label: 'Audit: Kiểm tra Ảnh minh chứng',       color: '#fff9c4', category: 'audit', description: 'Kiểm tra ảnh chụp minh chứng điểm danh' },
  { type: 'audit_medication',     label: 'Audit: Kiểm tra cấp phát thuốc',       color: '#fff9c4', category: 'audit', description: 'Kiểm tra quy trình cấp phát thuốc cho học sinh' },
  { type: 'audit_parent_auth',    label: 'Audit: Xác thực Phụ huynh',            color: '#fff9c4', category: 'audit', description: 'Xác thực danh tính phụ huynh khi đón/đưa' },
  { type: 'audit_anomaly',        label: 'Audit: Cảnh báo sai lệch AI',          color: '#ffccbc', category: 'audit', description: 'Cảnh báo khi AI không nhận diện được hoặc có sai lệch' },
  { type: 'audit_service_status', label: 'Audit: Kiểm tra trạng thái Server AI', color: '#b3e5fc', category: 'audit', description: 'Kiểm tra trạng thái dịch vụ AI có sẵn sàng không' },

  // ── Nhóm Hành động (Action) ───────────────────────────────────────────────
  { type: 'notify_checkin',  label: 'Gửi TB: Học sinh đã đến trường', color: '#e8f5e9', category: 'action', description: 'Gửi thông báo đến phụ huynh: học sinh đã điểm danh vào' },
  { type: 'notify_checkout', label: 'Gửi TB: Học sinh đã ra về',      color: '#e8f5e9', category: 'action', description: 'Gửi thông báo đến phụ huynh: học sinh đã được đón về' },
  { type: 'notify_absence',  label: 'Gửi TB: Xác nhận Nghỉ phép',    color: '#e8f5e9', category: 'action', description: 'Gửi thông báo xác nhận học sinh nghỉ học hợp lệ' },
  { type: 'save_record',     label: 'Lưu: Chốt dữ liệu điểm danh',   color: '#f1f8e9', category: 'action', description: 'Lưu chốt toàn bộ dữ liệu điểm danh vào cơ sở dữ liệu' },
  { type: 'teacher_verify',  label: 'Chờ: Giáo viên xác nhận',        color: '#e0f2f1', category: 'action', description: 'Dừng luồng, chờ giáo viên xác nhận thao tác thủ công' },
];

async function seedNodes() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/DucXuanKindergarten';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    await BPMNodeDefinition.deleteMany({});
    console.log('🗑️  Đã xóa toàn bộ node cũ');

    const result = await BPMNodeDefinition.insertMany(nodes);
    console.log(`🎉 Đã nạp ${result.length} node định nghĩa BPM thành công!`);
    console.log('\nCác node đã nạp:');
    result.forEach(n => console.log(`  • [${n.category.padEnd(7)}] ${n.type} — ${n.label}`));

    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi khi nạp dữ liệu node:', err.message);
    process.exit(1);
  }
}

seedNodes();
