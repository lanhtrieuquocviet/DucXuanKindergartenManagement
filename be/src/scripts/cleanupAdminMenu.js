const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const PermissionSchema = new mongoose.Schema({
  code: String,
  description: String,
  group: String,
  path: String,
  menuKey: String,
  order: Number
}, { collection: 'Permission' });

const RoleSchema = new mongoose.Schema({
  roleName: String,
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }]
}, { collection: 'Roles' });

const Permission = mongoose.model('Permission', PermissionSchema);
const Role = mongoose.model('Roles', RoleSchema);

async function cleanupAdminMenu() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Delete ALL permissions that link to /system-admin paths
    // This removes duplicates and old codes like VIEW_ADMIN_DASHBOARD, etc.
    const deleteResult = await Permission.deleteMany({
      $or: [
        { path: { $regex: /^\/system-admin/ } },
        { group: 'Quản trị hệ thống' },
        { group: 'Hệ thống', path: { $exists: true } }
      ]
    });
    console.log(`Deleted ${deleteResult.deletedCount} old admin permissions`);

    // 2. Define the CLEAN set of permissions
    const permsData = [
      {
        code: 'SYSTEM_DASHBOARD',
        description: 'Bảng điều khiển hệ thống',
        group: 'Hệ thống',
        path: '/system-admin',
        menuKey: 'dashboard',
        order: 10
      },
      {
        code: 'MANAGE_ACCOUNTS',
        description: 'Quản lý tài khoản',
        group: 'Hệ thống',
        path: '/system-admin/manage-accounts',
        menuKey: 'accounts',
        order: 20
      },
      {
        code: 'MANAGE_ROLES',
        description: 'Quản trị Vai trò',
        group: 'Hệ thống',
        path: '/system-admin/manage-roles',
        menuKey: 'roles',
        order: 30
      },
      {
        code: 'MANAGE_PERMISSIONS',
        description: 'Quản trị Phân quyền',
        group: 'Hệ thống',
        path: '/system-admin/manage-permissions',
        menuKey: 'permissions',
        order: 40
      },
      {
        code: 'MANAGE_JOB_POSITIONS',
        description: 'Quản lý Chức danh & Vị trí',
        group: 'Hệ thống',
        path: '/system-admin/job-positions',
        menuKey: 'job-positions',
        order: 50
      },
      {
        code: 'SYSTEM_LOGS',
        description: 'Nhật ký hệ thống',
        group: 'Hệ thống',
        path: '/system-admin/system-logs',
        menuKey: 'logs',
        order: 60
      },
      {
        code: 'BPM_MANAGEMENT',
        description: 'Quy trình vận hành (BPM)',
        group: 'Hệ thống',
        path: '/system-admin/bpm',
        menuKey: 'bpm',
        order: 70
      }
    ];

    const seededPermIds = [];
    for (const pData of permsData) {
      const p = new Permission(pData);
      await p.save();
      seededPermIds.push(p._id);
      console.log(`Seeded permission: ${pData.code}`);
    }

    // 3. Update the SystemAdmin role to use ONLY these permissions (plus any non-system ones if needed)
    // But usually SystemAdmin should only have these. 
    // Wait, let's just REPLACE the system ones in the role.
    const adminRole = await Role.findOne({ roleName: 'SystemAdmin' });
    if (adminRole) {
      // Filter out deleted IDs and add new ones
      const existingIds = adminRole.permissions || [];
      const validIds = [];
      
      for (const id of existingIds) {
        const stillExists = await Permission.exists({ _id: id });
        if (stillExists) validIds.push(id);
      }

      adminRole.permissions = [...new Set([...validIds, ...seededPermIds])];
      await adminRole.save();
      console.log('Updated SystemAdmin role permissions');
    }

    console.log('Cleanup and re-seed completed');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

cleanupAdminMenu();
