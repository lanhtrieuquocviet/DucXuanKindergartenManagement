const Classes = require('../models/Classes');
const Student = require('../models/Student');
const Grade = require('../models/Grade');

/**
 * Lấy danh sách tất cả các lớp học
 * GET /api/classes
 */
const getClassList = async (req, res) => {
  try {
    const classes = await Classes.find()
      .populate('gradeId', 'gradeName description')
      .populate('academicYearId', 'yearName startDate endDate')
      .populate('teacherIds', 'fullName email');

    if (!classes || classes.length === 0) {
      return res.status(404).json({
        status: 'success',
        message: 'Không tìm thấy lớp học nào',
        data: []
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Lấy danh sách lớp học thành công',
      data: classes,
      total: classes.length
    });
  } catch (error) {
    console.error('Error in getClassList:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy danh sách lớp học',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách học sinh trong một lớp cụ thể
 * GET /api/classes/:classId/students
 */
const getStudentInClass = async (req, res) => {
  try {
    const { classId } = req.params;

    // Kiểm tra lớp có tồn tại không
    const classInfo = await Classes.findById(classId)
      .populate('gradeId', 'gradeName')
      .populate('academicYearId', 'yearName');

    if (!classInfo) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy lớp học',
        data: null
      });
    }

    // Lấy danh sách học sinh trong lớp
    const students = await Student.find({ classId })
      .populate('userId', 'username email fullName avatar')
      .select('-__v');

    if (!students || students.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'Lớp học không có học sinh',
        data: [],
        classInfo: classInfo,
        total: 0
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Lấy danh sách học sinh thành công',
      data: students,
      classInfo: classInfo,
      total: students.length
    });
  } catch (error) {
    console.error('Error in getStudentInClass:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy danh sách học sinh',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin chi tiết một lớp học
 * GET /api/classes/:classId
 */
const getClassDetail = async (req, res) => {
  try {
    const { classId } = req.params;

    const classInfo = await Classes.findById(classId)
      .populate('gradeId', 'gradeName description')
      .populate('academicYearId', 'yearName startDate endDate')
      .populate('teacherIds', 'fullName email');

    if (!classInfo) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy lớp học',
        data: null
      });
    }

    // Đếm số lượng học sinh
    const studentCount = await Student.countDocuments({ classId });

    return res.status(200).json({
      status: 'success',
      message: 'Lấy thông tin lớp học thành công',
      data: classInfo,
      studentCount: studentCount
    });
  } catch (error) {
    console.error('Error in getClassDetail:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy thông tin lớp học',
      error: error.message
    });
  }
};

/**
 * Tạo lớp học mới
 * POST /api/classes
 */
const createClass = async (req, res) => {
  try {
    const { className, capacity, gradeId, academicYearId, teacherIds, maxStudents } = req.body;

    // Validate required fields
    if (!className || !gradeId || !academicYearId) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp đầy đủ thông tin: className, gradeId, academicYearId'
      });
    }

    // Kiểm tra lớp đã tồn tại
    const existingClass = await Classes.findOne({ className });
    if (existingClass) {
      return res.status(400).json({
        status: 'error',
        message: 'Tên lớp đã tồn tại'
      });
    }

    const newClass = new Classes({
      className,
      capacity: capacity || 0,
      gradeId,
      academicYearId,
      teacherIds: teacherIds || [],
      maxStudents: maxStudents || 0
    });

    await newClass.save();

    const populatedClass = await Classes.findById(newClass._id)
      .populate('gradeId', 'gradeName')
      .populate('academicYearId', 'yearName')
      .populate('teacherIds', 'fullName email');

    return res.status(201).json({
      status: 'success',
      message: 'Tạo lớp học thành công',
      data: populatedClass
    });
  } catch (error) {
    console.error('Error in createClass:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi tạo lớp học',
      error: error.message
    });
  }
};

module.exports = {
  getClassList,
  getStudentInClass,
  getClassDetail,
  createClass
};
