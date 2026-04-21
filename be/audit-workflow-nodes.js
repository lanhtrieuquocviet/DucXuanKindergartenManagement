const mongoose = require('mongoose');
const BPMWorkflow = require('./src/models/BPMWorkflow');
const BPMNodeDefinition = require('./src/models/BPMNodeDefinition');
require('dotenv').config();

async function auditWorkflowNodes() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/DucXuanKindergarten';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected\n');

  // Lấy tất cả node định nghĩa trong hệ thống
  const systemNodes = await BPMNodeDefinition.find({}).select('type label category').lean();
  const systemTypes = new Set(systemNodes.map(n => n.type));

  console.log('📦 Node types hiện có trong hệ thống:');
  systemNodes.forEach(n => console.log(`  • [${n.category.padEnd(7)}] ${n.type}`));

  // Kiểm tra workflow checkout
  const checkoutWf = await BPMWorkflow.findOne({ module: 'attendance', type: 'checkout', status: 'active' }).lean();
  const checkinWf  = await BPMWorkflow.findOne({ module: 'attendance', type: 'checkin',  status: 'active' }).lean();

  for (const [label, wf] of [['CHECKOUT (Trả trẻ)', checkoutWf], ['CHECKIN (Đón trẻ)', checkinWf]]) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`🔍 Kiểm tra workflow: ${label}`);
    if (!wf) { console.log('  ⚠️  Không tìm thấy workflow!'); continue; }

    let allOk = true;
    wf.nodes.forEach(node => {
      const match = systemTypes.has(node.type);
      const icon = match ? '✅' : '❌';
      const defId = node.nodeDefinitionId ? ` → defId: ${node.nodeDefinitionId}` : ' → defId: NULL ⚠️';
      console.log(`  ${icon} [${node.id.padEnd(18)}] type: "${node.type}"${defId}`);
      if (!match) allOk = false;
    });

    if (allOk) console.log('\n  ✨ Tất cả node khớp với hệ thống!');
    else        console.log('\n  ❌ CÓ NODE KHÔNG KHỚP — cần re-seed workflow!');
  }

  process.exit(0);
}

auditWorkflowNodes().catch(e => { console.error('❌', e.message); process.exit(1); });
