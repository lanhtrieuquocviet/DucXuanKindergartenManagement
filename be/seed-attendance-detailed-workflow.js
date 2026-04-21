const mongoose = require('mongoose');
const BPMWorkflow = require('./src/models/BPMWorkflow');
const BPMNodeDefinition = require('./src/models/BPMNodeDefinition');
const User = require('./src/models/User');
require('dotenv').config();

/**
 * Cấu trúc template workflow (chưa có nodeDefinitionId).
 * id: dùng để đặt tên edge source/target
 * type: phải khớp với `type` trong BPMNodeDefinition
 */
const workflowTemplate = {
  name: 'Quy trình Điểm danh Đến trường (Chuẩn SOP)',
  description: 'Quy trình chi tiết bao gồm AI nhận diện, kiểm tra đi muộn, ảnh minh chứng và đồ dùng mang theo',
  module: 'attendance',
  type: 'checkin',
  status: 'active',
  nodes: [
    { id: 'start',            type: 'input',            position: { x: 50,   y: 250 }, data: { label: '1. Mở màn điểm danh' } },
    { id: 'ai_scan',          type: 'ai_student',       position: { x: 250,  y: 250 }, data: { label: '2. Quét khuôn mặt học sinh' } },
    { id: 'check_ai',         type: 'audit_anomaly',    position: { x: 450,  y: 250 }, data: { label: '3. Nhận diện được?' } },
    { id: 'manual_select',    type: 'teacher_verify',   position: { x: 450,  y: 400 }, data: { label: '3b. Chọn học sinh thủ công' } },
    { id: 'check_time',       type: 'condition_time',   position: { x: 700,  y: 250 }, data: { label: '4. Kiểm tra giờ (>8h?)' } },
    { id: 'check_photo',      type: 'audit_photo_proof',position: { x: 950,  y: 250 }, data: { label: '5. Có ảnh điểm danh?' } },
    { id: 'check_deliverer',  type: 'audit_parent_auth',position: { x: 1200, y: 250 }, data: { label: '6. Xác thực người đưa' } },
    { id: 'check_belongings', type: 'teacher_verify',   position: { x: 1450, y: 250 }, data: { label: '7. Nhập đồ mang theo & Ghi chú' } },
    { id: 'save',             type: 'save_record',      position: { x: 1700, y: 250 }, data: { label: '8. Lưu thông tin điểm danh' } },
    { id: 'notify',           type: 'notify_checkin',   position: { x: 1950, y: 250 }, data: { label: '9. Gửi thông báo phụ huynh' } },
    { id: 'end',              type: 'output',           position: { x: 2200, y: 250 }, data: { label: '10. Kết thúc' } },
  ],
  edges: [
    { id: 'e1',       source: 'start',           target: 'ai_scan',          animated: true },
    { id: 'e2',       source: 'ai_scan',         target: 'check_ai',         animated: true },
    { id: 'e3_fail',  source: 'check_ai',        target: 'manual_select',    sourceHandle: 'false', animated: true },
    { id: 'e3_ok',    source: 'manual_select',   target: 'check_time',       animated: true },
    { id: 'e3_pass',  source: 'check_ai',        target: 'check_time',       sourceHandle: 'true', animated: true },
    { id: 'e4',       source: 'check_time',      target: 'check_photo',      animated: true },
    { id: 'e5',       source: 'check_photo',     target: 'check_deliverer',  animated: true },
    { id: 'e6',       source: 'check_deliverer', target: 'check_belongings', animated: true },
    { id: 'e7',       source: 'check_belongings',target: 'save',             animated: true },
    { id: 'e8',       source: 'save',            target: 'notify',           animated: true },
    { id: 'e9',       source: 'notify',          target: 'end',              animated: true },
  ],
  version: 2,
};

/**
 * Tra cứu nodeDefinitionId từ BPMNodeDefinition theo type,
 * gắn vào top-level node VÀ nhúng vào bên trong node.data
 * để React Flow node component có thể truy cập trực tiếp.
 */
async function resolveNodeDefinitionIds(nodes) {
  const types = [...new Set(nodes.map(n => n.type))];
  const definitions = await BPMNodeDefinition.find({ type: { $in: types } })
    .select('_id type label category color')
    .lean();

  // Map: type → định nghĩa đầy đủ
  const typeTodef = {};
  definitions.forEach(def => { typeTodef[def.type] = def; });

  return nodes.map(node => {
    const def = typeTodef[node.type];
    if (!def) {
      console.warn(`  ⚠️  Không tìm thấy BPMNodeDefinition cho type: "${node.type}"`);
    }
    return {
      ...node,
      // Top-level: dùng cho BPM Engine tra cứu
      nodeDefinitionId: def?._id || null,
      // Nhúng vào data: dùng cho React Flow node renderer
      data: {
        ...node.data,
        // Ghi đè label bằng tên chuẩn từ BPMNodeDefinition
        label:            def?.label || node.data?.label,
        nodeDefinitionId: def?._id || null,
        nodeType:         node.type,
        nodeCategory:     def?.category || null,
        nodeColor:        def?.color || null,
      },
    };
  });
}

async function seedCheckinWorkflow() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/DucXuanKindergarten';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const admin = await User.findOne().lean();
    if (!admin) throw new Error('Cần tạo tài khoản trong hệ thống trước');

    // Resolve nodeDefinitionId từ DB
    console.log('🔍 Đang tra cứu nodeDefinitionId từ BPMNodeDefinition...');
    const resolvedNodes = await resolveNodeDefinitionIds(workflowTemplate.nodes);

    // Log để kiểm tra
    console.log('\nNodes đã resolve:');
    resolvedNodes.forEach(n =>
      console.log(`  • [${n.id.padEnd(18)}] type: ${n.type.padEnd(20)} → nodeDefinitionId: ${n.nodeDefinitionId || 'NULL ❌'}`)
    );

    // Đặt workflow cũ cùng type về draft
    await BPMWorkflow.updateMany({ module: 'attendance', type: 'checkin' }, { status: 'draft' });

    // Tạo workflow mới
    await BPMWorkflow.create({
      ...workflowTemplate,
      nodes: resolvedNodes,
      createdBy: admin._id,
    });

    console.log('\n🎉 Đã nạp Quy trình Điểm danh Đến trường thành công!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
}

seedCheckinWorkflow();
