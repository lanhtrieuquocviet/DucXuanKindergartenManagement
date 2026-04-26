const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');
const Role = require('../models/Role');

async function removePurchaseRequest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 1. Find the permission
    const perm = await Permission.findOne({ code: 'MANAGE_PURCHASE_REQUEST' });
    if (perm) {
      // 2. Remove from all roles
      await Role.updateMany(
        {},
        { $pull: { permissions: perm._id } }
      );
      console.log('Removed MANAGE_PURCHASE_REQUEST from all roles');
      
      // 3. Delete the permission document
      await Permission.deleteOne({ _id: perm._id });
      console.log('Deleted MANAGE_PURCHASE_REQUEST permission document');
    } else {
      console.log('MANAGE_PURCHASE_REQUEST permission not found');
    }

    // 4. Also check for redundant MANAGE_ASSET menu
    // If the user says it's not clickable, maybe it's because it's duplicated.
    // Let's check if there are multiple permissions with same code or path.
    const allPerms = await Permission.find({ path: '/school-admin/assets' });
    console.log('Permissions pointing to /school-admin/assets:', allPerms.map(p => ({ code: p.code, desc: p.description })));

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

removePurchaseRequest();
