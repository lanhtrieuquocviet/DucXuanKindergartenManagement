const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

require('../models/Permission');
const Role = require('../models/Role');

async function checkSchoolAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const role = await Role.findOne({ roleName: 'SchoolAdmin' }).populate('permissions');
    console.log('SchoolAdmin Permissions:');
    role.permissions.forEach(p => {
      console.log(`- [${p.code}] ${p.description} (${p.group})`);
    });
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkSchoolAdmin();
