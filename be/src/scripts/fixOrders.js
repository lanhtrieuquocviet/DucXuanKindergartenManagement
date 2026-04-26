const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');

async function fixOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Permission.findOneAndUpdate({ code: 'MANAGE_HEALTH' }, { order: 101, name: 'Quản lý sức khỏe học sinh' });
    await Permission.findOneAndUpdate({ code: 'MANAGE_HEALTH_INCIDENTS' }, { order: 102, name: 'Ghi nhận bất thường sức khỏe' });
    
    // Also fix academic plan/events order
    await Permission.findOneAndUpdate({ code: 'MANAGE_ACADEMIC_PLAN' }, { order: 201, name: 'Thiết lập kế hoạch học tập' });
    await Permission.findOneAndUpdate({ code: 'MANAGE_ACADEMIC_EVENTS' }, { order: 202, name: 'Thiết lập sự kiện học vụ' });

    console.log('Orders and names updated');

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixOrders();
