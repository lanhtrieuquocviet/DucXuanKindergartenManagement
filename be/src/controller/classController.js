const Classes = require('../models/Classes');
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const AcademicYear = require('../models/AcademicYear');

/**
 * Lấy danh sách tất cả các lớp học
 * GET /api/classes
 */
const getClassList = async (req, res) => {
  try {
    console.log('\n=== CLASSLIST DEBUG ===');
    console.log('Step 1: Starting getClassList');
    
    // Step 1: Find all classes without populate
    const rawClasses = await Classes.find();
    console.log(`Step 2: Found ${rawClasses.length} raw classes`);
    
    // Step 2: Check if references exist
    if (rawClasses.length > 0) {
      const firstClass = rawClasses[0];
      console.log('Step 3: First class raw data - gradeId:', firstClass.gradeId, 'academicYearId:', firstClass.academicYearId);
    }
    
    // Step 3: Try to populate
    const classes = await Classes.find()
      .populate('gradeId', 'gradeName description')
      .populate('academicYearId', 'yearName startDate endDate')
      .populate('teacherIds', 'fullName email');

    console.log(`Step 4: Found ${classes.length} populated classes`);
    if (classes.length > 0) {
      const firstClass = classes[0];
      console.log('Step 5: First class after populate - gradeId:', firstClass.gradeId, 'academicYearId:', firstClass.academicYearId);
    }
    console.log('=== END DEBUG ===\n');

    // Return 200 (success) whether data exists or not
    return res.status(200).json({
      status: 'success',
      message: classes.length === 0 
        ? 'Không có lớp học nào' 
        : 'Lấy danh sách lớp học thành công',
      data: classes || [],
      total: classes.length
    });
  } catch (error) {
    console.error('Error in getClassList:', error);
    console.error('Error details:', error.stack);
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
      .populate('parentId', 'username email fullName avatar phone')
      .lean();

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
 * Lấy danh sách khối lớp (grades)
 * GET /api/classes/grades
 */
const getGradeList = async (req, res) => {
  try {
    const grades = await Grade.find().sort({ gradeName: 1 }).lean();
    return res.status(200).json({
      status: 'success',
      data: grades || [],
    });
  } catch (error) {
    console.error('Error in getGradeList:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy danh sách khối lớp',
    });
  }
};

/**
 * Tạo lớp học mới — tự động gắn năm học đang hoạt động
 * POST /api/classes
 */
const createClass = async (req, res) => {
  try {
    const { className, capacity, gradeId, teacherIds, maxStudents } = req.body;

    // Validate required fields
    if (!className || !gradeId) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp đầy đủ thông tin: className, gradeId',
      });
    }

    // Tìm năm học đang hoạt động
    const activeYear = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1 });
    if (!activeYear) {
      return res.status(400).json({
        status: 'error',
        code: 'NO_ACTIVE_ACADEMIC_YEAR',
        message: 'Chưa có năm học đang hoạt động. Vui lòng tạo năm học mới trước khi tạo lớp.',
      });
    }

    // Kiểm tra tên lớp đã tồn tại trong năm học này
    const existingClass = await Classes.findOne({ className, academicYearId: activeYear._id });
    if (existingClass) {
      return res.status(400).json({
        status: 'error',
        message: 'Tên lớp đã tồn tại trong năm học này',
      });
    }

    const newClass = new Classes({
      className,
      capacity: capacity || 0,
      gradeId,
      academicYearId: activeYear._id,
      teacherIds: teacherIds || [],
      maxStudents: maxStudents || 0,
    });

    await newClass.save();

    const populatedClass = await Classes.findById(newClass._id)
      .populate('gradeId', 'gradeName')
      .populate('academicYearId', 'yearName')
      .populate('teacherIds', 'fullName email');

    return res.status(201).json({
      status: 'success',
      message: 'Tạo lớp học thành công',
      data: populatedClass,
    });
  } catch (error) {
    console.error('Error in createClass:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi tạo lớp học',
      error: error.message,
    });
  }
};

module.exports = {
  getClassList,
  getStudentInClass,
  getClassDetail,
  getGradeList,
  createClass,
};
