const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');

async function listAllPerms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const perms = await Permission.find({}).sort({ group: 1, order: 1 });
    console.log('All Permissions:');
    perms.forEach(p => {
      console.log(`- [${p.code}] ${p.name} | Path: ${p.path} | Group: ${p.group}`);
    });

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

listAllPerms();
