const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const BPMNodeDefinition = require('../models/BPMNodeDefinition');

const nodes = [
  {
    type: 'audit_belongings',
    label: 'Audit: Kiểm tra đồ mang theo',
    color: '#fffbeb', // Light amber
    category: 'audit',
    description: 'Kiểm tra xem học sinh có thông tin đồ dùng cá nhân mang theo hay không.'
  }
];

async function seed() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error('MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const node of nodes) {
      await BPMNodeDefinition.findOneAndUpdate(
        { type: node.type },
        node,
        { upsert: true, new: true }
      );
      console.log(`Seeded node: ${node.label}`);
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
