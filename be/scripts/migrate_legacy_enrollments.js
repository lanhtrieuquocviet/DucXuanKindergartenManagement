const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Student = require('../src/models/Student');
const Enrollment = require('../src/models/Enrollment');
const Classes = require('../src/models/Classes');
const AcademicYear = require('../src/models/AcademicYear');

async function migrateLegacyEnrollments() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const students = await Student.find({ classId: { $ne: null } }).lean();
    console.log(`Found ${students.length} students with legacy classId.`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const student of students) {
      const cls = await Classes.findById(student.classId).lean();
      if (!cls) {
        console.warn(`[WARN] Student ${student.fullName} (${student._id}) has invalid classId ${student.classId}. Skipping.`);
        skippedCount++;
        continue;
      }

      const academicYear = await AcademicYear.findById(cls.academicYearId).lean();
      if (!academicYear) {
        console.warn(`[WARN] Class ${cls.className} has invalid academicYearId. Skipping student ${student.fullName}.`);
        skippedCount++;
        continue;
      }

      // Check if enrollment already exists
      const existing = await Enrollment.findOne({
        studentId: student._id,
        academicYearId: cls.academicYearId
      });

      if (!existing) {
        await Enrollment.create({
          studentId: student._id,
          classId: student.classId,
          academicYearId: cls.academicYearId,
          gradeId: cls.gradeId,
          status: academicYear.status === 'active' ? 'studying' : (academicYear.status === 'inactive' ? 'promoted' : 'draft'),
          enrollmentDate: new Date()
        });
        createdCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('-----------------------------------------');
    console.log(`Migration completed!`);
    console.log(`- Created: ${createdCount} enrollments`);
    console.log(`- Skipped: ${skippedCount} students (already have enrollment or invalid data)`);
    console.log('-----------------------------------------');

    // Create unique index if not exists (safeguard)
    console.log('Ensuring unique index on enrollments...');
    await Enrollment.collection.createIndex({ studentId: 1, academicYearId: 1 }, { unique: true });
    console.log('Index ensured.');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

migrateLegacyEnrollments();
