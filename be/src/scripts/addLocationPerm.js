const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');
const Role = require('../models/Role');

async function addLocationPerm() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 1. Create the permission
    const permCode = 'MANAGE_LOCATION';
    let perm = await Permission.findOne({ code: permCode });
    
    if (!perm) {
      perm = await Permission.create({
        code: permCode,
        description: 'Danh mục Vị trí & Khu vực',
        group: 'Tài sản & Mua sắm',
        path: '/school-admin/facilities/locations',
        order: 82
      });
      console.log('Created MANAGE_LOCATION permission');
    } else {
      perm.description = 'Danh mục Vị trí & Khu vực';
      perm.path = '/school-admin/facilities/locations';
      perm.group = 'Tài sản & Mua sắm';
      await perm.save();
      console.log('Updated MANAGE_LOCATION permission');
    }

    // 2. Add to SchoolAdmin role
    const schoolAdmin = await Role.findOne({ roleName: 'SchoolAdmin' });
    if (schoolAdmin) {
      if (!schoolAdmin.permissions.includes(perm._id)) {
        schoolAdmin.permissions.push(perm._id);
        await schoolAdmin.save();
        console.log('Added MANAGE_LOCATION to SchoolAdmin role');
      }
    }

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

addLocationPerm();
