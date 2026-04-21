const mongoose = require('mongoose');
const BPMWorkflow = require('./src/models/BPMWorkflow');
require('dotenv').config();

async function run() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/DucXuanKindergarten';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected');

  // Xóa workflow attendance cũ có type = 'general' hoặc status = 'draft'
  // mà không phải checkin/checkout (đã được seed mới với nodeDefinitionId)
  const before = await BPMWorkflow.find({}).select('_id name module type status').lean();
  console.log('\n📋 Trước khi xóa:');
  before.forEach(w => console.log(`  [${w.status}] ${w.module}/${w.type} — ${w.name} (${w._id})`));

  const r = await BPMWorkflow.deleteMany({
    module: 'attendance',
    type: { $in: ['general', null, undefined] },
  });
  console.log(`\n🗑️  Đã xóa ${r.deletedCount} workflow attendance/general (legacy).`);

  const after = await BPMWorkflow.find({}).select('_id name module type status').lean();
  console.log('\n📌 Sau khi xóa:');
  after.forEach(w => console.log(`  ✅ [${w.status}] ${w.module}/${w.type} — ${w.name}`));

  process.exit(0);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
