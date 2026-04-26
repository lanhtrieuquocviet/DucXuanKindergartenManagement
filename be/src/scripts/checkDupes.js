const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');

async function checkDupes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const perms = await Permission.find({ 
      $or: [
        { description: /dinh dưỡng/i }, 
        { description: /kế hoạch/i }, 
        { code: /NUTRITION/i },
        { code: /PLAN/i }
      ] 
    });
    console.log('Found permissions:');
    perms.forEach(p => {
      console.log(`[${p.code}] ${p.description} | Group: ${p.group} | Path: ${p.path}`);
    });
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkDupes();
