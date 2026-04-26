const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');

async function fixDescriptions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Remove (legacy) from Quản lý tài liệu
    const docPerm = await Permission.findOne({ code: 'MANAGE_DOCUMENT' });
    if (docPerm) {
      docPerm.description = 'Quản lý tài liệu';
      await docPerm.save();
      console.log('Fixed MANAGE_DOCUMENT description');
    }

    // 2. Ensure Video-clip description is clean
    const videoPerm = await Permission.findOne({ code: 'MANAGE_VIDEOS' });
    if (videoPerm) {
      videoPerm.description = 'Quản lý Video-clip';
      await videoPerm.save();
      console.log('Fixed MANAGE_VIDEOS description');
    }

    // 3. Ensure Tài liệu nội bộ description
    const docsPerm = await Permission.findOne({ code: 'MANAGE_DOCUMENTS' });
    if (docsPerm) {
      docsPerm.description = 'Tài liệu nội bộ';
      await docsPerm.save();
      console.log('Fixed MANAGE_DOCUMENTS description');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixDescriptions();
