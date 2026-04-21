const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

async function findAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/DucXuanKindergarten';
    await mongoose.connect(mongoUri);
    const admin = await User.findOne({ username: 'admin' }) || await User.findOne();
    if (admin) {
      console.log('ADMIN_ID:' + admin._id);
    } else {
      console.log('NO_ADMIN_FOUND');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findAdmin();
