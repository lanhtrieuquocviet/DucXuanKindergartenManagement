const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');
const Role = require('../models/Role');

async function fixKitchenAndNutritionPerms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Define permissions
    const permsToUpdate = [
      {
        code: 'MANAGE_INGREDIENTS',
        name: 'Quản lý nguyên liệu',
        description: 'Quản lý kho nguyên liệu và thực phẩm',
        path: '/kitchen/ingredients',
        group: 'Bếp & Thực phẩm',
        order: 301
      },
      {
        code: 'KITCHEN_DISTRICT_NUTRITION',
        name: 'Quy định dinh dưỡng sở (Bếp)',
        description: 'Xem quy định dinh dưỡng từ sở GD&ĐT',
        path: '/kitchen/district-nutrition',
        group: 'Bếp & Thực phẩm',
        order: 302
      },
      {
        code: 'SCHOOL_ADMIN_DISTRICT_NUTRITION',
        name: 'Quy định dinh dưỡng sở (Quản lý)',
        description: 'Quản lý và xem quy định dinh dưỡng từ sở GD&ĐT',
        path: '/school-admin/district-nutrition-plan',
        group: 'Bếp & Thực phẩm',
        order: 303
      }
    ];

    const permIds = {};
    for (const p of permsToUpdate) {
      const doc = await Permission.findOneAndUpdate(
        { code: p.code },
        p,
        { upsert: true, new: true }
      );
      permIds[p.code] = doc._id;
      console.log(`Updated/Created permission: ${p.code}`);
    }

    // 2. Assign to KitchenStaff
    const kitchenStaff = await Role.findOne({ roleName: 'KitchenStaff' });
    if (kitchenStaff) {
      const kitchenPerms = [permIds.MANAGE_INGREDIENTS, permIds.KITCHEN_DISTRICT_NUTRITION];
      kitchenPerms.forEach(id => {
        if (!kitchenStaff.permissions.some(pId => pId.equals(id))) {
          kitchenStaff.permissions.push(id);
        }
      });
      await kitchenStaff.save();
      console.log('Updated KitchenStaff permissions');
    }

    // 3. Assign to SchoolAdmin
    const schoolAdmin = await Role.findOne({ roleName: 'SchoolAdmin' });
    if (schoolAdmin) {
      const adminPerms = [permIds.SCHOOL_ADMIN_DISTRICT_NUTRITION];
      adminPerms.forEach(id => {
        if (!schoolAdmin.permissions.some(pId => pId.equals(id))) {
          schoolAdmin.permissions.push(id);
        }
      });
      await schoolAdmin.save();
      console.log('Updated SchoolAdmin permissions');
    }

    // 4. Assign to SystemAdmin
    const systemAdmin = await Role.findOne({ roleName: 'SystemAdmin' });
    if (systemAdmin) {
        Object.values(permIds).forEach(id => {
            if (!systemAdmin.permissions.some(pId => pId.equals(id))) {
                systemAdmin.permissions.push(id);
            }
        });
        await systemAdmin.save();
        console.log('Updated SystemAdmin permissions');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixKitchenAndNutritionPerms();
