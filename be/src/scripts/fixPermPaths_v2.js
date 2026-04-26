const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');

async function fixPermPaths() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Set MANAGE_ASSET to /school-admin/assets
    // Set ACCESS_INVENTORY to /school-admin/facilities
    // Both now render ManageAssets in App.jsx, but they have different URL strings
    // so they are "clickable".
    
    await Permission.updateOne(
      { code: 'MANAGE_ASSET' },
      { $set: { path: '/school-admin/assets' } }
    );
    console.log('Set MANAGE_ASSET path to /school-admin/assets');

    await Permission.updateOne(
      { code: 'ACCESS_INVENTORY' },
      { $set: { path: '/school-admin/facilities' } }
    );
    console.log('Set ACCESS_INVENTORY path to /school-admin/facilities');

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

fixPermPaths();
