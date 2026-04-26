const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');

async function checkPerms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const perms = await Permission.find({ code: { $in: ['ACCESS_INVENTORY', 'MANAGE_ASSET'] } });
    console.log(JSON.stringify(perms, null, 2));
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkPerms();
