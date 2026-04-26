const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

async function checkUserPerms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ fullName: /Lanh Trieu Quoc Viet/i });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log(`Checking permissions for user: ${user.fullName}`);
    const roles = await Role.find({ _id: { $in: user.roles } }).populate('permissions');
    
    const allPerms = [];
    roles.forEach(role => {
      console.log(`Role: ${role.roleName}`);
      role.permissions.forEach(p => {
        allPerms.push({ code: p.code, desc: p.description, group: p.group });
      });
    });
    
    console.log('ALL PERMISSIONS:');
    allPerms.sort((a,b) => a.code.localeCompare(b.code)).forEach(p => {
      console.log(`[${p.code}] ${p.desc} (${p.group})`);
    });
    
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkUserPerms();
