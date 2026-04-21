const mongoose = require('mongoose');
const BPMWorkflow = require('./src/models/BPMWorkflow');
require('dotenv').config();

/**
 * Script xóa workflow thừa.
 * Chiến lược:
 *  - Với mỗi cặp (module + type), GIỮ LẠI duy nhất workflow `active` mới nhất.
 *  - Xóa toàn bộ workflow `draft` hoặc `archived`.
 *  - Nếu không có workflow nào là `active`, giữ lại workflow mới nhất (bất kể status).
 */

async function cleanupWorkflows() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/DucXuanKindergarten';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // 1. Lấy toàn bộ workflow
    const all = await BPMWorkflow.find({})
      .sort({ createdAt: -1 })
      .select('_id name module type status createdAt')
      .lean();

    console.log(`📋 Tổng số workflow hiện tại: ${all.length}`);
    all.forEach(w =>
      console.log(`   [${w.status.padEnd(8)}] ${w.module}/${w.type} — "${w.name}" (${w._id})`)
    );

    // 2. Nhóm theo module + type
    const groups = {};
    for (const w of all) {
      const key = `${w.module}::${w.type}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(w);
    }

    const toDelete = [];
    const toKeep   = [];

    for (const [key, workflows] of Object.entries(groups)) {
      // Ưu tiên giữ workflow active mới nhất
      const activeOnes = workflows.filter(w => w.status === 'active');
      const keeper = activeOnes.length > 0
        ? activeOnes[0]                // đã sort desc → [0] là mới nhất
        : workflows[0];                // không có active → giữ mới nhất

      toKeep.push(keeper);
      for (const w of workflows) {
        if (String(w._id) !== String(keeper._id)) {
          toDelete.push(w);
        }
      }
    }

    // 3. Thực hiện xóa
    if (toDelete.length === 0) {
      console.log('\n✨ Không có workflow thừa. DB đã sạch!');
    } else {
      console.log(`\n🗑️  Sẽ xóa ${toDelete.length} workflow thừa:`);
      toDelete.forEach(w =>
        console.log(`   ❌ [${w.status.padEnd(8)}] ${w.module}/${w.type} — "${w.name}" (${w._id})`)
      );

      const deleteIds = toDelete.map(w => w._id);
      const result = await BPMWorkflow.deleteMany({ _id: { $in: deleteIds } });
      console.log(`\n✅ Đã xóa ${result.deletedCount} workflow thừa.`);
    }

    console.log(`\n📌 Giữ lại ${toKeep.length} workflow:`);
    toKeep.forEach(w =>
      console.log(`   ✅ [${w.status.padEnd(8)}] ${w.module}/${w.type} — "${w.name}" (${w._id})`)
    );

    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
}

cleanupWorkflows();
