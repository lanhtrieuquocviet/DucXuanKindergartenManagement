const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const User = require('../models/User');
const Role = require('../models/Role');
const AcademicYear = require('../models/AcademicYear');

/**
 * Lấy danh sách tất cả học sinh (có thể lọc theo classId)
 * GET /api/students?classId=...
 */
const getStudents = async (req, res) => {
  try {
    const { classId } = req.query;
    const filter = {};
    if (classId) filter.classId = classId;

    const students = await Student.find(filter)
      .populate('classId', 'className gradeId')
      .populate('parentId', 'fullName email username avatar phone')
      .populate('academicYearId', 'yearName');

    // Không gửi mảng embedding 128 số về client (tốn bandwidth)
    // Thay bằng flag hasFaceEmbedding và faceRegisteredAt
    const data = students.map((s) => {
      const obj = s.toObject();
      obj.hasFaceEmbedding = Array.isArray(obj.faceEmbedding) && obj.faceEmbedding.length > 0;
      delete obj.faceEmbedding;
      return obj;
    });

    return res.status(200).json({
      status: 'success',
      message: 'Lấy danh sách học sinh thành công',
      data,
      total: data.length,
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

    const activeYear = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1 }).lean();

    const newStudent = new Student({
      fullName,
      dateOfBirth,
      gender,
      phone,
      address,
      classId,
      parentId: parentId || userId,
      academicYearId: activeYear?._id || null,
      status: 'active',
    });

    await newStudent.save();

    const populatedStudent = await Student.findById(newStudent._id)
      .populate('classId', 'className')
      .populate('parentId', 'fullName email username avatar phone')
      .populate('academicYearId', 'yearName');

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
 * Tạo tài khoản phụ huynh (User) + học sinh (Student), parentId = User._id
 * POST /api/students/with-parent
 * body: { parent: { username, password, fullName, email, phone? }, student: { fullName, dateOfBirth, gender, classId?, address?, phone? } }
 */
const createStudentWithParent = async (req, res) => {
  try {
    const { parent, student: studentData } = req.body;

    if (!parent || !parent.username || !parent.password || !parent.fullName || !parent.email) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập đầy đủ thông tin phụ huynh: tài khoản, mật khẩu, họ tên, email',
      });
    }

    if (!studentData || !studentData.fullName || !studentData.dateOfBirth || !studentData.gender) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập đầy đủ thông tin học sinh: họ tên, ngày sinh, giới tính',
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { username: parent.username.trim() },
        { email: parent.email.trim().toLowerCase() },
      ],
    });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Tài khoản hoặc email phụ huynh đã tồn tại trong hệ thống',
      });
    }

    // Tìm role cho phụ huynh — thử lần lượt các tên có thể có, không phân biệt hoa thường
    const parentRole = await Role.findOne({
      roleName: { $in: ['Parent', 'parent', 'Student', 'student', 'Phụ huynh'] },
    });
    if (!parentRole) {
      // Lấy tên tất cả role hiện có để thông báo rõ hơn
      const allRoles = await Role.find().select('roleName').lean();
      const roleNames = allRoles.map(r => r.roleName).join(', ') || 'không có vai trò nào';
      return res.status(400).json({
        status: 'error',
        message: `Chưa có vai trò phụ huynh trong hệ thống. Các vai trò hiện có: ${roleNames}`,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(parent.password, salt);

    const newUser = new User({
      username: parent.username.trim(),
      passwordHash,
      fullName: parent.fullName.trim(),
      email: parent.email.trim().toLowerCase(),
      phone: (parent.phone || '').trim(),
      address: (parent.address || '').trim(),
      roles: [parentRole._id],
      status: 'active',
    });
    await newUser.save();

    const activeYear = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1 }).lean();

    const newStudent = new Student({
      fullName: studentData.fullName.trim(),
      dateOfBirth: studentData.dateOfBirth,
      gender: studentData.gender,
      phone: (studentData.phone || parent.phone || '').trim(),
      parentPhone: (studentData.parentPhone || parent.phone || '').trim(),
      address: (studentData.address || '').trim(),
      classId: studentData.classId || null,
      parentId: newUser._id,
      avatar: (studentData.avatar || '').trim(),
      academicYearId: activeYear?._id || null,
      status: 'active',
    });
    await newStudent.save();

    const populatedStudent = await Student.findById(newStudent._id)
      .populate('classId', 'className')
      .populate('parentId', 'fullName email username avatar phone')
      .populate('academicYearId', 'yearName');

    return res.status(201).json({
      status: 'success',
      message: 'Tạo tài khoản phụ huynh và học sinh thành công',
      data: populatedStudent,
    });
  } catch (error) {
    console.error('Error in createStudentWithParent:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi khi tạo phụ huynh và học sinh',
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

    // Không trả embedding (biometric) về client — chỉ trả flag + thời điểm đăng ký
    const obj = student.toObject();
    obj.hasFaceEmbedding = Array.isArray(obj.faceEmbedding) && obj.faceEmbedding.length > 0;
    delete obj.faceEmbedding;

    return res.status(200).json({
      status: 'success',
      message: 'Lấy thông tin học sinh thành công',
      data: obj,
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
      parentFullName,
      parentEmail,
      parentPhone: parentPhoneField,
      needsSpecialAttention,
      specialNote,
    } = req.body;

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy học sinh',
        data: null,
      });
    }

    const isSchoolAdmin = Array.isArray(req.user?.roles) && req.user.roles.includes('SchoolAdmin');
    const isParent = student.parentId && req.user?.id === student.parentId.toString();

    if (!isSchoolAdmin && !isParent) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền cập nhật thông tin học sinh này',
      });
    }

    const phoneValue = parentPhone !== undefined ? parentPhone : phone;

    let updateData = {
      fullName,
      dateOfBirth,
      gender,
      phone: phoneValue,
      parentPhone: phoneValue,
      address,
      classId,
      status,
      ...(needsSpecialAttention !== undefined && { needsSpecialAttention: !!needsSpecialAttention }),
      ...(specialNote !== undefined && { specialNote: String(specialNote).trim() }),
    };

    if (isParent && !isSchoolAdmin) {
      updateData = {
        fullName,
        dateOfBirth,
        phone: phoneValue,
        parentPhone: phoneValue,
        address,
      };
    }

    if (isSchoolAdmin && student.parentId && (parentFullName !== undefined || parentEmail !== undefined || parentPhoneField !== undefined)) {
      const parentUpdate = {};
      if (parentFullName !== undefined) parentUpdate.fullName = parentFullName.trim();
      if (parentEmail !== undefined) parentUpdate.email = parentEmail.trim().toLowerCase();
      if (parentPhoneField !== undefined) parentUpdate.phone = parentPhoneField.trim();
      if (Object.keys(parentUpdate).length > 0) {
        await User.findByIdAndUpdate(student.parentId, parentUpdate, { new: true, runValidators: true });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      updateData,
      { new: true, runValidators: true },
    )
      .populate('classId', 'className')
      .populate('parentId', 'fullName email username avatar phone');

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

/**
 * Kiểm tra username đã tồn tại chưa
 * GET /api/students/check-username?username=...
 */
const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username || !username.trim()) {
      return res.status(400).json({ status: 'error', message: 'Thiếu tham số username' });
    }
    const existing = await User.findOne({ username: username.trim() }).lean();
    return res.status(200).json({
      status: 'success',
      available: !existing,
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getStudents,
  createStudent,
  createStudentWithParent,
  getStudentDetail,
  updateStudent,
  deleteStudent,
  checkUsernameAvailability,
};

