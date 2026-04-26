const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Class = require('../models/Classes');
const AcademicYear = require('../models/AcademicYear');

async function migrateClasses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const activeYear = await AcademicYear.findOne({ status: 'active' });
    if (!activeYear) {
      console.log('No active academic year found');
      return;
    }
    console.log(`Active Year: ${activeYear.yearName} (${activeYear._id})`);

    // Assign classes to the active year if they don't have one
    const result = await Class.updateMany(
      { academicYearId: { $ne: activeYear._id } },
      { $set: { academicYearId: activeYear._id } }
    );

    console.log(`Updated ${result.modifiedCount} classes.`);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

migrateClasses();
