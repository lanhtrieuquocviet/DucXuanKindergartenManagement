const Student = require('../models/Student');

/**
 * Lấy danh sách tất cả học sinh
 * GET /api/students
 */
const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('classId', 'className')
      .populate('parentId', 'fullName email username avatar');

    if (!students || students.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'Không tìm thấy học sinh nào',
        data: [],
        total: 0,
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Lấy danh sách học sinh thành công',
      data: students,
      total: students.length,
    });
  } catch (error) {
    console.error('Error in getStudents:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy danh sách học sinh',
      error: error.message,
    });
  }
};

/**
 * Tạo học sinh mới
 * POST /api/students
 */
const createStudent = async (req, res) => {
  try {
    const { fullName, dateOfBirth, gender, phone, address, classId, parentId, userId } =
      req.body;

    if (!fullName || !dateOfBirth || !gender) {
      return res.status(400).json({
        status: 'error',
        message:
          'Vui lòng cung cấp đầy đủ thông tin: fullName, dateOfBirth, gender',
      });
    }

    const newStudent = new Student({
      fullName,
      dateOfBirth,
      gender,
      phone,
      address,
      classId,
      // Ưu tiên parentId, fallback sang userId để tương thích dữ liệu cũ
      parentId: parentId || userId,
      status: 'active',
    });

    await newStudent.save();

    const populatedStudent = await Student.findById(newStudent._id)
      .populate('classId', 'className')
      .populate('parentId', 'fullName email username avatar');

    return res.status(201).json({
      status: 'success',
      message: 'Tạo học sinh thành công',
      data: populatedStudent,
    });
  } catch (error) {
    console.error('Error in createStudent:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi tạo học sinh',
      error: error.message,
    });
  }
};

/**
 * Lấy thông tin chi tiết một học sinh
 * GET /api/students/:studentId
 */
const getStudentDetail = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId)
      .populate('classId', 'className')
      .populate('parentId', 'fullName email username avatar');

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy học sinh',
        data: null,
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Lấy thông tin học sinh thành công',
      data: student,
    });
  } catch (error) {
    console.error('Error in getStudentDetail:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy thông tin học sinh',
      error: error.message,
    });
  }
};

/**
 * Cập nhật thông tin học sinh
 * PUT /api/students/:studentId
 */
const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const {
      fullName,
      dateOfBirth,
      gender,
      phone,
      parentPhone,
      address,
      classId,
      status,
    } = req.body;

    // Kiểm tra quyền trước khi cập nhật
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy học sinh',
        data: null,
      });
    }

    // Kiểm tra: chỉ SchoolAdmin hoặc parent của học sinh mới được phép cập nhật
    const isSchoolAdmin = req.user?.roles?.includes('SchoolAdmin');
    const isParent = student.parentId && req.user?.id === student.parentId.toString();

    if (!isSchoolAdmin && !isParent) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền cập nhật thông tin học sinh này',
      });
    }

    // Prepare phone value, prefer parentPhone if provided
    const phoneValue = parentPhone !== undefined ? parentPhone : phone;

    // Nếu là parent, chỉ cho phép cập nhật một số trường
    let updateData = {
      fullName,
      dateOfBirth,
      gender,
      phone: phoneValue,
      parentPhone: phoneValue,
      address,
      classId,
      status,
    };

    if (isParent && !isSchoolAdmin) {
      // Parents chỉ có thể cập nhật: fullName, dateOfBirth, phone, address
      // Không được cập nhật classId, status
      updateData = {
        fullName,
        dateOfBirth,
        phone: phoneValue,
        parentPhone: phoneValue,
        address,
      };
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      updateData,
      { new: true, runValidators: true },
    )
      .populate('classId', 'className')
      .populate('parentId', 'fullName email username avatar');

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật thông tin học sinh thành công',
      data: updatedStudent,
    });
  } catch (error) {
    console.error('Error in updateStudent:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi cập nhật thông tin học sinh',
      error: error.message,
    });
  }
};

/**
 * Xóa học sinh
 * DELETE /api/students/:studentId
 */
const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const deletedStudent = await Student.findByIdAndDelete(studentId);

    if (!deletedStudent) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy học sinh',
        data: null,
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Xóa học sinh thành công',
      data: deletedStudent,
    });
  } catch (error) {
    console.error('Error in deleteStudent:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi xóa học sinh',
      error: error.message,
    });
  }
};

module.exports = {
  getStudents,
  createStudent,
  getStudentDetail,
  updateStudent,
  deleteStudent,
};

