const Classes = require('../models/Classes');
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const AcademicYear = require('../models/AcademicYear');
const User = require('../models/User');

/**
 * Validate teacher assignment rules:
 * 1. Tối đa 2 giáo viên / lớp
 * 2. 1 giáo viên chỉ phụ trách 1 lớp / năm học
 * 3. 1 giáo viên phụ trách tối đa 2 năm / cùng tên lớp
 * @param {string[]} teacherIds
 * @param {string}   academicYearId
 * @param {string}   className
 * @param {string|null} excludeClassId - lớp đang được cập nhật (bỏ qua khi kiểm tra)
 * @returns {string|null} error message hoặc null nếu hợp lệ
 */
async function validateTeacherAssignment(teacherIds, academicYearId, className, excludeClassId = null) {
  if (!teacherIds || teacherIds.length === 0) return null;

  if (teacherIds.length > 2) {
    return 'Một lớp tối đa 2 giáo viên phụ trách';
  }

  for (const tid of teacherIds) {
    // Rule 2: giáo viên chỉ phụ trách 1 lớp trong 1 năm học
    const yearQuery = { academicYearId, teacherIds: tid };
    if (excludeClassId) yearQuery._id = { $ne: excludeClassId };
    const classInYear = await Classes.findOne(yearQuery).lean();
    if (classInYear) {
      const teacher = await User.findById(tid).select('fullName').lean();
      return `Giáo viên "${teacher?.fullName || tid}" đã phụ trách lớp "${classInYear.className}" trong năm học này`;
    }

    // Rule 3: tối đa 2 năm / cùng tên lớp
    const nameQuery = { className, teacherIds: tid };
    if (excludeClassId) nameQuery._id = { $ne: excludeClassId };
    const yearCount = await Classes.countDocuments(nameQuery);
    if (yearCount >= 2) {
      const teacher = await User.findById(tid).select('fullName').lean();
      return `Giáo viên "${teacher?.fullName || tid}" đã phụ trách lớp "${className}" trong 2 năm, không thể phân công thêm`;
    }
  }

  return null;
}

/**
 * Lấy danh sách tất cả các lớp học
 * GET /api/classes
 */
const getClassList = async (req, res) => {
  try {
    const activeYear = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1 }).lean();

    const filter = activeYear ? { academicYearId: activeYear._id } : {};

    const classes = await Classes.find(filter)
      .populate('gradeId', 'gradeName description')
      .populate('academicYearId', 'yearName startDate endDate')
      .populate('teacherIds', 'fullName email');

    return res.status(200).json({
      status: 'success',
      message: classes.length === 0
        ? 'Không có lớp học nào trong năm học hiện tại'
        : 'Lấy danh sách lớp học thành công',
      data: classes || [],
      total: classes.length,
      academicYear: activeYear || null,
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

    if (!className || !gradeId) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp đầy đủ thông tin: className, gradeId',
      });
    }

    const activeYear = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1 });
    if (!activeYear) {
      return res.status(400).json({
        status: 'error',
        code: 'NO_ACTIVE_ACADEMIC_YEAR',
        message: 'Chưa có năm học đang hoạt động. Vui lòng tạo năm học mới trước khi tạo lớp.',
      });
    }

    const existingClass = await Classes.findOne({ className, academicYearId: activeYear._id });
    if (existingClass) {
      return res.status(400).json({
        status: 'error',
        message: 'Tên lớp đã tồn tại trong năm học này',
      });
    }

    // Validate số lớp tối đa trong khối
    const grade = await Grade.findById(gradeId);
    if (!grade) {
      return res.status(400).json({ status: 'error', message: 'Không tìm thấy khối lớp' });
    }
    const currentClassCount = await Classes.countDocuments({ gradeId });
    const maxAllowed = grade.maxClasses ?? 10;
    if (currentClassCount >= maxAllowed) {
      return res.status(400).json({
        status: 'error',
        message: `Khối ${grade.gradeName} đã đạt tối đa ${maxAllowed} lớp học`,
      });
    }

    // Validate giáo viên — bắt buộc đúng 2 giáo viên
    const tIds = Array.isArray(teacherIds) ? teacherIds.filter(Boolean) : [];
    if (tIds.length !== 2) {
      return res.status(400).json({ status: 'error', message: 'Mỗi lớp bắt buộc phải có đúng 2 giáo viên phụ trách' });
    }
    const teacherError = await validateTeacherAssignment(tIds, activeYear._id, className, null);
    if (teacherError) {
      return res.status(400).json({ status: 'error', message: teacherError });
    }

    const newClass = new Classes({
      className,
      capacity: capacity || 0,
      gradeId,
      academicYearId: activeYear._id,
      teacherIds: tIds,
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

/**
 * Cập nhật lớp học
 * PUT /api/classes/:classId
 */
const updateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { className, gradeId, teacherIds, maxStudents } = req.body;

    const cls = await Classes.findById(classId);
    if (!cls) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy lớp học' });
    }

    const newClassName = className ? String(className).trim() : cls.className;

    if (newClassName !== cls.className) {
      const existingClass = await Classes.findOne({ className: newClassName, academicYearId: cls.academicYearId, _id: { $ne: classId } });
      if (existingClass) {
        return res.status(400).json({ status: 'error', message: 'Tên lớp đã tồn tại trong năm học này' });
      }
    }

    const tIds = Array.isArray(teacherIds) ? teacherIds.filter(Boolean) : cls.teacherIds.map(String);
    const teacherError = await validateTeacherAssignment(tIds, cls.academicYearId, newClassName, classId);
    if (teacherError) {
      return res.status(400).json({ status: 'error', message: teacherError });
    }

    cls.className = newClassName;
    if (gradeId) cls.gradeId = gradeId;
    cls.teacherIds = tIds;
    if (maxStudents !== undefined) cls.maxStudents = Number(maxStudents) || 0;
    await cls.save();

    const populated = await Classes.findById(classId)
      .populate('gradeId', 'gradeName')
      .populate('academicYearId', 'yearName')
      .populate('teacherIds', 'fullName email');

    return res.status(200).json({ status: 'success', message: 'Cập nhật lớp học thành công', data: populated });
  } catch (error) {
    console.error('Error in updateClass:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật lớp học', error: error.message });
  }
};

/**
 * Thêm học sinh vào lớp (bulk)
 * POST /api/classes/:classId/students
 * body: { studentIds: string[] }
 */
const addStudentsToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng chọn ít nhất 1 học sinh' });
    }

    const cls = await Classes.findById(classId).lean();
    if (!cls) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy lớp học' });
    }

    // Kiểm tra sĩ số tối đa
    const currentCount = await Student.countDocuments({ classId });
    if (cls.maxStudents > 0 && currentCount + studentIds.length > cls.maxStudents) {
      return res.status(400).json({
        status: 'error',
        message: `Vượt quá sĩ số tối đa (${cls.maxStudents}). Hiện có ${currentCount} học sinh, không thể thêm ${studentIds.length} học sinh nữa.`,
      });
    }

    // Kiểm tra học sinh đã có lớp khác chưa
    const alreadyAssigned = await Student.find({
      _id: { $in: studentIds },
      classId: { $ne: null, $exists: true },
    }).select('fullName classId').lean();

    if (alreadyAssigned.length > 0) {
      const names = alreadyAssigned.map(s => s.fullName).join(', ');
      return res.status(400).json({
        status: 'error',
        message: `Các học sinh sau đã thuộc lớp khác: ${names}`,
      });
    }

    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: { classId } }
    );

    const updatedCount = await Student.countDocuments({ classId });

    return res.status(200).json({
      status: 'success',
      message: `Đã thêm ${studentIds.length} học sinh vào lớp thành công`,
      data: { added: studentIds.length, total: updatedCount },
    });
  } catch (error) {
    console.error('Error in addStudentsToClass:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi thêm học sinh vào lớp', error: error.message });
  }
};

/**
 * Xóa lớp học
 * DELETE /api/classes/:classId
 */
const deleteClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const cls = await Classes.findById(classId);
    if (!cls) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy lớp học' });
    }

    const studentCount = await Student.countDocuments({ classId });
    if (studentCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Không thể xóa: lớp đang có ${studentCount} học sinh`,
      });
    }

    await Classes.findByIdAndDelete(classId);
    return res.status(200).json({ status: 'success', message: 'Xóa lớp học thành công' });
  } catch (error) {
    console.error('Error in deleteClass:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi xóa lớp học', error: error.message });
  }
};

module.exports = {
  getClassList,
  getStudentInClass,
  getClassDetail,
  getGradeList,
  createClass,
  updateClass,
  addStudentsToClass,
  deleteClass,
};
