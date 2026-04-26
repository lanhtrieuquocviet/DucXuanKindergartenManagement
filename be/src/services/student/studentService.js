const Student = require('../../models/Student');
const User = require('../../models/User');
const Enrollment = require('../../models/Enrollment');
const AcademicYear = require('../../models/AcademicYear');
const { generateStudentCode, upsertParentProfileFromUser, purgeOrphanParentAccount } = require('../../controller/student/helpers');

/**
 * Lấy danh sách học sinh kèm thông tin đánh giá
 */
const getAllStudents = async (filter = {}) => {
  const students = await Student.find(filter)
    .populate('classId', 'className gradeId academicYearId')
    .populate({ 
      path: 'parentId', 
      select: 'fullName email username avatar phone roles', 
      populate: { path: 'roles', select: 'roleName' } 
    })
    .populate('parentProfileId', 'fullName email phone')
    .populate('academicYearId', 'yearName');

  const studentIds = students.map(s => s._id);
  const enrollments = await Enrollment.find({
    studentId: { $in: studentIds }
  }).select('studentId academicEvaluation evaluationNote').lean();

  const enrollmentMap = {};
  enrollments.forEach(e => {
    enrollmentMap[e.studentId.toString()] = e;
  });

  return students.map((student) => {
    const enrollment = enrollmentMap[student._id.toString()];
    const obj = student.toObject();
    obj.hasFaceEmbedding = Array.isArray(obj.faceEmbedding) && obj.faceEmbedding.length > 0;
    obj.faceImageUrls = Array.isArray(obj.faceImageUrls) ? obj.faceImageUrls.filter(Boolean) : [];
    obj.angleCount = Array.isArray(obj.faceEmbeddings) ? obj.faceEmbeddings.length : (obj.hasFaceEmbedding ? 1 : 0);
    delete obj.faceEmbedding;
    delete obj.faceEmbeddings;

    obj.evaluation = enrollment ? {
      academicEvaluation: enrollment.academicEvaluation,
      evaluationNote: enrollment.evaluationNote
    } : null;

    return obj;
  });
};

/**
 * Tạo học sinh mới thủ công
 */
const createStudent = async (studentData) => {
  const { parentId, userId } = studentData;
  const activeYear = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1 }).lean();
  
  let parentProfileId = null;
  if (parentId || userId) {
    const parentUser = await User.findById(parentId || userId);
    if (parentUser) {
      const parentProfile = await upsertParentProfileFromUser(parentUser);
      parentProfileId = parentProfile?._id || null;
    }
  }

  const studentCode = await generateStudentCode();
  const newStudent = new Student({
    ...studentData,
    studentCode,
    parentId: parentId || userId,
    parentProfileId,
    academicYearId: activeYear?._id || null,
    status: 'active',
  });

  await newStudent.save();
  return Student.findById(newStudent._id)
    .populate('classId', 'className')
    .populate('parentId', 'fullName email username avatar phone')
    .populate('parentProfileId', 'fullName email phone')
    .populate('academicYearId', 'yearName');
};

/**
 * Xóa học sinh và dọn dẹp tài khoản phụ huynh mồ côi
 */
const deleteStudent = async (studentId) => {
  const studentDoc = await Student.findById(studentId).lean();
  if (!studentDoc) return false;

  const parentId = studentDoc.parentId;
  await Student.findByIdAndDelete(studentId);

  if (parentId) {
    const parentDoc = await User.findById(parentId).select('_id roles');
    if (parentDoc) {
      await purgeOrphanParentAccount(parentDoc);
    }
  }
  return true;
};

module.exports = {
  getAllStudents,
  createStudent,
  deleteStudent
};
