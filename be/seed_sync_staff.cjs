const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Simple Schemas matching the DB
const UserSchema = new mongoose.Schema({
  username: String,
  passwordHash: String,
  fullName: String,
  email: String,
  phone: String,
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
  status: { type: String, default: 'active' },
  avatar: String
}, { timestamps: true, collection: 'User' });

const StaffSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fullName: String,
  email: String,
  phone: String,
  employeeId: String,
  position: String,
  status: { type: String, default: 'active' },
  notes: String
}, { timestamps: true, collection: 'Staff' });

const RoleSchema = new mongoose.Schema({
  roleName: String,
  description: String
}, { collection: 'Roles' });

const User = mongoose.model('User', UserSchema);
const Staff = mongoose.model('Staff', StaffSchema);
const Role = mongoose.model('Role', RoleSchema);

async function syncPersonnel() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dxmn';
    console.log(`Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to Database');

    // 1. Identify staff-related roles
    const staffRoleNames = [
      'SystemAdmin', 
      'SchoolAdmin', 
      'HeadTeacher', 
      'Teacher', 
      'KitchenStaff', 
      'InventoryStaff', 
      'MedicalStaff'
    ];

    const roles = await Role.find({ roleName: { $in: staffRoleNames } }).lean();
    const staffRoleIds = roles.map(r => r._id.toString());
    const roleIdToName = {};
    roles.forEach(r => { roleIdToName[r._id.toString()] = r.roleName; });

    console.log(`🔍 Found ${roles.length} staff roles: ${roles.map(r => r.roleName).join(', ')}`);

    // 2. Find all users who have at least one staff role
    const users = await User.find({
      roles: { $in: roles.map(r => r._id) }
    }).populate('roles').lean();

    console.log(`👥 Found ${users.length} users with staff roles.`);

    let syncedCount = 0;
    let createdCount = 0;

    for (const user of users) {
      // Find position based on roles (taking the first matching staff role)
      const userStaffRoles = user.roles.filter(r => staffRoleNames.includes(r.roleName));
      const primaryRole = userStaffRoles[0]?.roleName || 'Staff';
      
      let position = 'Nhân viên';
      if (primaryRole === 'SchoolAdmin' || primaryRole === 'SystemAdmin') position = 'Ban Giám Hiệu';
      else if (primaryRole.includes('Teacher')) position = 'Giáo viên';
      else if (primaryRole === 'KitchenStaff') position = 'Nhân viên nhà bếp';
      else if (primaryRole === 'MedicalStaff') position = 'Nhân viên y tế';
      else if (primaryRole === 'InventoryStaff') position = 'Nhân viên kho/vật tư';

      // Check if Staff record exists
      let staff = await Staff.findOne({ userId: user._id });

      if (staff) {
        // Update existing staff info from User record if they differ
        let changed = false;
        if (staff.fullName !== user.fullName) { staff.fullName = user.fullName; changed = true; }
        if (staff.email !== user.email) { staff.email = user.email; changed = true; }
        if (staff.phone !== user.phone) { staff.phone = user.phone; changed = true; }
        
        if (changed) {
          await staff.save();
          syncedCount++;
        }
      } else {
        // Create new staff record
        await Staff.create({
          userId: user._id,
          fullName: user.fullName || user.username,
          email: user.email,
          phone: user.phone,
          employeeId: user.username.toUpperCase(),
          position: position,
          status: user.status || 'active',
          notes: 'Tự động đồng bộ từ tài khoản hệ thống'
        });
        createdCount++;
        console.log(`  + Created Staff record for: ${user.username} (${position})`);
      }
    }

    console.log('\n✨ Sync Report:');
    console.log(`   - New Staff records created: ${createdCount}`);
    console.log(`   - Existing Staff records updated: ${syncedCount}`);
    console.log(`   - Total Staff in DB: ${await Staff.countDocuments()}`);

    console.log('\n✅ Personnel synchronization completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Sync error:', err);
    process.exit(1);
  }
}

syncPersonnel();
