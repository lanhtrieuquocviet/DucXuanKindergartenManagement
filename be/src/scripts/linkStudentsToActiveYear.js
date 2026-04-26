const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Student = require('../models/Student');
const AcademicYear = require('../models/AcademicYear');

async function migrateStudents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const activeYear = await AcademicYear.findOne({ status: 'active' });
    if (!activeYear) {
      console.log('No active academic year found');
      return;
    }
    console.log(`Active Year: ${activeYear.yearName} (${activeYear._id})`);

    // Add activeYear._id to academicYearId array for all students
    const result = await Student.updateMany(
      { academicYearId: { $ne: activeYear._id } },
      { $addToSet: { academicYearId: activeYear._id } }
    );

    console.log(`Updated ${result.modifiedCount} students.`);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

migrateStudents();
