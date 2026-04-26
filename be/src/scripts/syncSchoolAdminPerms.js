const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');
const Role = require('../models/Role');

async function syncSchoolAdminPerms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const schoolAdmin = await Role.findOne({ roleName: 'SchoolAdmin' });
    if (!schoolAdmin) {
      console.log('SchoolAdmin role not found');
      return;
    }

    // 1. Remove MANAGE_QA
    const qaPerm = await Permission.findOne({ code: 'MANAGE_QA' });
    if (qaPerm) {
      schoolAdmin.permissions = schoolAdmin.permissions.filter(pId => !pId.equals(qaPerm._id));
      console.log('Removed MANAGE_QA from SchoolAdmin');
    }

    // 2. Add missing perms
    const codesToAdd = [
      'MANAGE_ACADEMIC_PLAN',
      'MANAGE_ACADEMIC_EVENTS',
      'MANAGE_VIDEOS',
      'MANAGE_DOCUMENTS',
      'MANAGE_HEALTH_INCIDENTS'
    ];

    for (const code of codesToAdd) {
      const p = await Permission.findOne({ code });
      if (p) {
        if (!schoolAdmin.permissions.some(pId => pId.equals(p._id))) {
          schoolAdmin.permissions.push(p._id);
          console.log(`Added ${code} to SchoolAdmin`);
        }
      } else {
        console.log(`Permission ${code} not found in DB`);
      }
    }

    await schoolAdmin.save();
    console.log('SchoolAdmin role saved successfully');

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

syncSchoolAdminPerms();
