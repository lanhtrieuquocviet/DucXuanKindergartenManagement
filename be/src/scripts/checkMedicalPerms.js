const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');
const Role = require('../models/Role');

async function checkMedicalPerms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const medicalStaff = await Role.findOne({ roleName: 'MedicalStaff' });
    if (!medicalStaff) {
      console.log('MedicalStaff role not found');
      return;
    }

    const perms = await Permission.find({ _id: { $in: medicalStaff.permissions } });
    console.log('MedicalStaff Permissions:');
    perms.forEach(p => {
      console.log(`- ${p.code}: ${p.name} (${p.group})`);
    });

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMedicalPerms();
