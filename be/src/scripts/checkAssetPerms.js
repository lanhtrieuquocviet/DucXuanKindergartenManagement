const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');

async function checkAssetPerms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const perms = await Permission.find({ group: 'Tài sản & Mua sắm' });
    perms.forEach(p => {
      console.log(`CODE: ${p.code} | DESC: ${p.description} | MENU_KEY: ${p.menuKey}`);
    });
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkAssetPerms();
