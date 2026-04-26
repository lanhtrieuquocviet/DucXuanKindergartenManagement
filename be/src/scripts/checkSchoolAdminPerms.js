const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');
const Roles = require('../models/Role');

async function checkPerms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const schoolAdmin = await Roles.findOne({ roleName: 'SchoolAdmin' });
    if (!schoolAdmin) {
      console.log('SchoolAdmin role not found');
      return;
    }

    const perms = await Permission.find({ _id: { $in: schoolAdmin.permissions } });
    console.log('SchoolAdmin Permissions:');
    perms.forEach(p => {
      console.log(`- ${p.code}: ${p.name} (${p.group})`);
    });

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPerms();
