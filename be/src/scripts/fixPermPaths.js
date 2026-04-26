const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');

async function fixPermPaths() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Fix MANAGE_ASSET to point to /school-admin/assets
    await Permission.updateOne(
      { code: 'MANAGE_ASSET' },
      { $set: { path: '/school-admin/assets' } }
    );
    console.log('Fixed MANAGE_ASSET path to /school-admin/assets');

    // Fix ACCESS_INVENTORY to point to /school-admin/assets if it's currently /school-admin/facilities
    // Because the data is in Assets, not Facilities.
    await Permission.updateOne(
      { code: 'ACCESS_INVENTORY' },
      { $set: { path: '/school-admin/assets' } }
    );
    console.log('Fixed ACCESS_INVENTORY path to /school-admin/assets');

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

fixPermPaths();
