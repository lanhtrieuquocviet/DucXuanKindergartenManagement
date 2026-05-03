const studentService = require('../../services/student/studentService');
const Student = require('../../models/Student');
const Enrollment = require('../../models/Enrollment');
const AcademicYear = require('../../models/AcademicYear');

/**
 * Lấy danh sách tất cả học sinh (lọc theo classId, academicYearId, gender)
 */
const getStudents = async (req, res) => {
  try {
    const { classId, academicYearId, gender, status, enrolledIn } = req.query;
    const filter = {};
    if (classId) filter.classId = classId;
    if (academicYearId) filter.academicYearId = academicYearId;
    if (gender) filter.gender = gender;
    if (status) filter.status = status;
    if (enrolledIn) filter.enrolledIn = enrolledIn;

    const data = await studentService.getAllStudents(filter);

    return res.status(200).json({
      status: 'success',
      data,
      total: data.length,
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Tạo học sinh mới (thủ công)
 */
const createStudent = async (req, res) => {
  try {
    if (!req.body.fullName || !req.body.dateOfBirth || !req.body.gender) {
      return res.status(400).json({ status: 'error', message: 'Thiếu thông tin bắt buộc' });
    }

    const data = await studentService.createStudent(req.body);

    return res.status(201).json({ status: 'success', data });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const getStudentDetail = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId)
      .populate('classId', 'className gradeId academicYearId')
      .populate('parentId', 'fullName email username avatar phone')
      .populate('parentProfileId', 'fullName email phone')
      .populate('academicYearId', 'yearName');

    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy học sinh' });
    }

    const enrollment = await Enrollment.findOne({ studentId }).lean();
    const obj = student.toObject();
    obj.evaluation = enrollment ? {
      academicEvaluation: enrollment.academicEvaluation,
      evaluationNote: enrollment.evaluationNote
    } : null;

    return res.status(200).json({ status: 'success', data: obj });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findByIdAndUpdate(studentId, req.body, { new: true })
      .populate('classId', 'className')
      .populate('parentId', 'fullName email username avatar phone');

    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy học sinh' });
    }

    // Đồng bộ classId sang Enrollment của năm học hiện tại
    const activeYear = await AcademicYear.findOne({ status: 'active' }).select('_id').lean();
    if (activeYear && req.body.classId !== undefined) {
      await Enrollment.findOneAndUpdate(
        { studentId: student._id, academicYearId: activeYear._id },
        { classId: req.body.classId || null },
        { upsert: true }
      );
    }

    return res.status(200).json({ status: 'success', data: student });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const success = await studentService.deleteStudent(req.params.studentId);
    if (!success) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy học sinh' });
    }
    return res.status(200).json({ status: 'success', message: 'Xóa học sinh thành công' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const getStudentEvaluations = async (req, res) => {
  try {
    const { studentId } = req.params;
    // Chỉ lấy các năm học mà học sinh thực sự có enrollment gắn academicYearId
    const evaluations = await Enrollment.find({
      studentId,
      academicYearId: { $ne: null },
      classId: { $ne: null },
    })
      .populate('academicYearId', 'yearName')
      .populate('gradeId', 'gradeName')
      .populate('classId', 'className')
      .sort({ enrollmentDate: -1 })
      .lean();

    return res.status(200).json({ status: 'success', data: evaluations });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getStudents,
  createStudent,
  getStudentDetail,
  getStudentEvaluations,
  updateStudent,
  deleteStudent,
};
