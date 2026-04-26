const mongoose = require('mongoose');
require('dotenv').config();

// Define Schemas inline for quick check
const UserSchema = new mongoose.Schema({}, { strict: false });
const StaffSchema = new mongoose.Schema({}, { strict: false });
const RoleSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', UserSchema, 'User');
const Staff = mongoose.model('Staff', StaffSchema, 'Staff');
const Role = mongoose.model('Role', RoleSchema, 'Roles');

async function checkData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/dxmn');
    console.log('Connected to DB: dxmn');

    const userCount = await User.countDocuments();
    const staffCount = await Staff.countDocuments();
    const roles = await Role.find({}, 'roleName').lean();

    console.log('--- Database Summary ---');
    console.log(`Total Users: ${userCount}`);
    console.log(`Total Staff Records: ${staffCount}`);
    console.log(`Available Roles: ${roles.map(r => r.roleName).join(', ')}`);

    if (staffCount === 0 && userCount > 0) {
      console.log('\nWarning: You have users but NO staff records. This is why the Personnel list is empty.');
      
      const teacherRole = roles.find(r => r.roleName === 'Teacher');
      if (teacherRole) {
        const teachers = await User.find({ roles: teacherRole._id }).lean();
        console.log(`Found ${teachers.length} users with "Teacher" role.`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
