const mongoose = require('mongoose');
const BPMWorkflow = require('./src/models/BPMWorkflow');
const BPMNodeDefinition = require('./src/models/BPMNodeDefinition');
const User = require('./src/models/User');
require('dotenv').config();

/**
 * Cấu trúc template workflow checkout (chưa có nodeDefinitionId).
 * id: dùng để đặt tên edge source/target
 * type: phải khớp với `type` trong BPMNodeDefinition
 */
const workflowTemplate = {
  name: 'Quy trình Trả trẻ An toàn (Chuẩn SOP)',
  description: 'Quy trình bao gồm kiểm tra về sớm, AI nhận diện người đón và xác thực phụ huynh 2 lớp',
  module: 'attendance',
  type: 'checkout',
  status: 'active',
  nodes: [
    { id: 'start',       type: 'input',            position: { x: 50,   y: 250 }, data: { label: '1. Mở màn trả trẻ' } },
    { id: 'ai_student',  type: 'ai_student',       position: { x: 250,  y: 250 }, data: { label: '2. Quét học sinh' } },
    { id: 'check_time',  type: 'condition_time',   position: { x: 450,  y: 250 }, data: { label: '3. Trước 17h? (Về sớm)' } },
    { id: 'check_photo', type: 'audit_photo_proof',position: { x: 700,  y: 250 }, data: { label: '4. Chụp ảnh điểm danh về' } },
    { id: 'ai_parent',   type: 'ai_parent',        position: { x: 950,  y: 250 }, data: { label: '5. AI nhận diện người đón' } },
    { id: 'check_trust', type: 'audit_anomaly',    position: { x: 1200, y: 250 }, data: { label: '6. Tin tưởng người đón?' } },
    { id: 'parent_auth', type: 'audit_parent_auth',position: { x: 1200, y: 400 }, data: { label: '6b. Yêu cầu Phụ huynh xác nhận qua App' } },
    { id: 'save',        type: 'save_record',      position: { x: 1450, y: 250 }, data: { label: '7. Lưu thông tin trả trẻ' } },
    { id: 'notify',      type: 'notify_checkout',  position: { x: 1700, y: 250 }, data: { label: '8. Gửi thông báo hoàn thành' } },
    { id: 'end',         type: 'output',           position: { x: 1950, y: 250 }, data: { label: '9. Kết thúc' } },
  ],
  edges: [
    { id: 'e1',         source: 'start',       target: 'ai_student',  animated: true },
    { id: 'e2',         source: 'ai_student',  target: 'check_time',  animated: true },
    { id: 'e3',         source: 'check_time',  target: 'check_photo', animated: true },
    { id: 'e4',         source: 'check_photo', target: 'ai_parent',   animated: true },
    { id: 'e5',         source: 'ai_parent',   target: 'check_trust', animated: true },
    { id: 'e6_trust',   source: 'check_trust', target: 'save',        sourceHandle: 'true',  animated: true },
    { id: 'e6_untrust', source: 'check_trust', target: 'parent_auth', sourceHandle: 'false', animated: true },
    { id: 'e6_auth_ok', source: 'parent_auth', target: 'save',        sourceHandle: 'true',  animated: true },
    { id: 'e7',         source: 'save',        target: 'notify',      animated: true },
    { id: 'e8',         source: 'notify',      target: 'end',         animated: true },
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

async function seedCheckoutWorkflow() {
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
      console.log(`  • [${n.id.padEnd(13)}] type: ${n.type.padEnd(20)} → nodeDefinitionId: ${n.nodeDefinitionId || 'NULL ❌'}`)
    );

    // Đặt workflow cũ cùng type về draft
    await BPMWorkflow.updateMany({ module: 'attendance', type: 'checkout' }, { status: 'draft' });

    // Tạo workflow mới
    await BPMWorkflow.create({
      ...workflowTemplate,
      nodes: resolvedNodes,
      createdBy: admin._id,
    });

    console.log('\n🎉 Đã nạp Quy trình Trả trẻ thành công!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
}

seedCheckoutWorkflow();
