const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');

async function cleanupOldKitchenPerms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const oldCodes = ['INGREDIENT_MANAGEMENT', 'DISTRICT_NUTRITION'];
    const result = await Permission.deleteMany({ code: { $in: oldCodes } });
    console.log(`Deleted ${result.deletedCount} old permissions`);

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

cleanupOldKitchenPerms();
