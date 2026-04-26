const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Student = require('../models/Student');

async function migrateStudents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Find students where academicYearId is not an array
    const students = await Student.find({ academicYearId: { $not: { $type: 'array' } } });
    console.log(`Found ${students.length} students with non-array academicYearId`);

    for (const student of students) {
        const oldVal = student.academicYearId;
        if (oldVal && !Array.isArray(oldVal)) {
            // Convert to array
            await Student.updateOne({ _id: student._id }, { $set: { academicYearId: [oldVal] } });
        } else if (!oldVal) {
            await Student.updateOne({ _id: student._id }, { $set: { academicYearId: [] } });
        }
    }
    console.log('Migration completed');

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

migrateStudents();
