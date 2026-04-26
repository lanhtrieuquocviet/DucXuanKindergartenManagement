const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');
const Role = require('../models/Role');

async function fixHealthIncidents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Create or update the permission
    const incidentPerm = await Permission.findOneAndUpdate(
      { code: 'MANAGE_HEALTH_INCIDENTS' },
      {
        name: 'Ghi nhận bất thường sức khỏe',
        description: 'Ghi nhận và theo dõi các bất thường sức khỏe hàng ngày',
        path: '/medical-staff/incidents',
        group: 'Y tế',
        order: 102
      },
      { upsert: true, new: true }
    );
    console.log('Permission MANAGE_HEALTH_INCIDENTS updated/created');

    // 2. Add to MedicalStaff and SchoolAdmin roles
    const rolesToUpdate = ['MedicalStaff', 'SchoolAdmin', 'SystemAdmin'];
    for (const roleName of rolesToUpdate) {
      const role = await Role.findOne({ roleName });
      if (role) {
        if (!role.permissions.includes(incidentPerm._id)) {
          role.permissions.push(incidentPerm._id);
          await role.save();
          console.log(`Added permission to role: ${roleName}`);
        } else {
          console.log(`Role ${roleName} already has the permission`);
        }
      }
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixHealthIncidents();
