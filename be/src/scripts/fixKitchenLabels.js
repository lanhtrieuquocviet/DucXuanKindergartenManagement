const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');

async function fixKitchenLabels() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Permission.findOneAndUpdate({ code: 'MANAGE_INGREDIENTS' }, { description: 'Nguyên liệu' });
    await Permission.findOneAndUpdate({ code: 'KITCHEN_DISTRICT_NUTRITION' }, { description: 'Quy định dinh dưỡng sở' });
    await Permission.findOneAndUpdate({ code: 'SCHOOL_ADMIN_DISTRICT_NUTRITION' }, { description: 'Quy định dinh dưỡng của sở' });

    console.log('Kitchen labels updated');

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixKitchenLabels();
