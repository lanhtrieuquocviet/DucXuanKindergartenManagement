const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');
const Role = require('../models/Role');

async function masterSync() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Sync SchoolAdmin
    const schoolAdmin = await Role.findOne({ roleName: 'SchoolAdmin' });
    if (schoolAdmin) {
      const permsToSet = [
        'MANAGE_ACADEMIC_YEAR', 'MANAGE_CURRICULUM', 'MANAGE_STUDENT', 'MANAGE_CLASS', 
        'MANAGE_GRADE', 'MANAGE_TEACHER', 'VIEW_ATTENDANCE', 'REGISTER_FACE', 
        'MANAGE_HEALTH', 'APPROVE_MENU', 'MANAGE_ASSET', 'MANAGE_PURCHASE_REQUEST', 
        'MANAGE_INSPECTION', 'VIEW_REPORT', 'MANAGE_STATIC_BLOCK', 'ACCESS_INVENTORY', 
        'MANAGE_HANDOVER', 'MANAGE_ASSET_ISSUES', 'MANAGE_ROOM_ASSETS', 'MANAGE_STAFF_POSITION', 
        'MANAGE_ACADEMIC_PLAN', 'MANAGE_ACADEMIC_EVENTS', 'MANAGE_VIDEOS', 'MANAGE_DOCUMENTS',
        'MANAGE_HEALTH_INCIDENTS', 'MANAGE_CONTACT', 'MANAGE_BANNER', 'MANAGE_BLOG',
        'MANAGE_BLOG_CATEGORY', 'MANAGE_DOCUMENT', 'MANAGE_PUBLIC_INFO', 'MANAGE_IMAGE_LIBRARY',
        'SCHOOL_ADMIN_DISTRICT_NUTRITION'
      ];

      const permDocs = await Permission.find({ code: { $in: permsToSet } });
      schoolAdmin.permissions = permDocs.map(p => p._id);
      
      // Explicitly remove MANAGE_QA if it exists in the docs (it shouldn't be in our list anyway)
      const qaPerm = await Permission.findOne({ code: 'MANAGE_QA' });
      if (qaPerm) {
          schoolAdmin.permissions = schoolAdmin.permissions.filter(pId => !pId.equals(qaPerm._id));
      }

      await schoolAdmin.save();
      console.log('SchoolAdmin role synced successfully');
    }

    // 2. Sync KitchenStaff (ensure they have what they need)
    const kitchenStaff = await Role.findOne({ roleName: 'KitchenStaff' });
    if (kitchenStaff) {
        const kitchenPerms = ['MANAGE_INGREDIENTS', 'KITCHEN_DISTRICT_NUTRITION', 'APPROVE_MENU'];
        const kPermDocs = await Permission.find({ code: { $in: kitchenPerms } });
        // Merge with existing if needed, but here we'll just ensure these are present
        kPermDocs.forEach(p => {
            if (!kitchenStaff.permissions.some(pId => pId.equals(p._id))) {
                kitchenStaff.permissions.push(p._id);
            }
        });
        await kitchenStaff.save();
        console.log('KitchenStaff role synced successfully');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

masterSync();
