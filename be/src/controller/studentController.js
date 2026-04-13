const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const User = require('../models/User');
const ParentProfile = require('../models/ParentProfile');
const Role = require('../models/Role');
const AcademicYear = require('../models/AcademicYear');
const ExcelJS = require('exceljs');
const { generateRandomPassword, sendParentAccountEmail } = require('../utils/email');

const normalizePhone = (value = '') => String(value).replace(/\D/g, '').trim();

const normalizeGender = (value = '') => {
  const text = String(value || '').trim().toLowerCase();
  if (['nam', 'male', 'm'].includes(text)) return 'male';
  if (['nữ', 'nu', 'female', 'f'].includes(text)) return 'female';
  return 'other';
};

const normalizeHeaderKey = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const generateStudentCode = async (date = new Date()) => {
  const year = date.getFullYear() % 100;
  const prefix = String(year).padStart(2, '0');
  const latest = await Student.findOne({
    studentCode: { $regex: `^${prefix}\\d{4}$` },
  })
    .sort({ studentCode: -1 })
    .select('studentCode')
    .lean();
  const next = latest?.studentCode ? Number(latest.studentCode.slice(2)) + 1 : 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
};

const upsertParentProfileFromUser = async (userDoc) => {
  if (!userDoc?._id) return null;
  const payload = {
    userId: userDoc._id,
    fullName: userDoc.fullName || '',
    email: (userDoc.email || '').toLowerCase(),
    phone: normalizePhone(userDoc.phone || ''),
    address: userDoc.address || '',
    status: userDoc.status || 'active',
  };
  return ParentProfile.findOneAndUpdate(
    { userId: userDoc._id },
    payload,
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

const createStudentWithParentCore = async ({ parent, studentData }) => {
  const normalizedParentPhone = normalizePhone(parent.phone);
  if (!normalizedParentPhone) {
    throw new Error('Số điện thoại phụ huynh không hợp lệ');
  }

  const normalizedParentEmail = parent.email.trim().toLowerCase();
  const parentRole = await Role.findOne({
    roleName: { $in: ['Parent', 'parent', 'Student', 'student', 'Phụ huynh'] },
  });
  if (!parentRole) {
    const allRoles = await Role.find().select('roleName').lean();
    const roleNames = allRoles.map((r) => r.roleName).join(', ') || 'không có vai trò nào';
    throw new Error(`Chưa có vai trò phụ huynh trong hệ thống. Các vai trò hiện có: ${roleNames}`);
  }

  let parentUser = await User.findOne({ phone: normalizedParentPhone });
  let isNewParent = false;
  let generatedPassword = null;

  // Dữ liệu cũ có thể lưu username = phone nhưng phone đã bị xóa/rỗng.
  // Trường hợp này cho phép "re-claim" lại đúng số điện thoại, tránh báo trùng sai.
  if (!parentUser) {
    const legacyByUsername = await User.findOne({ username: normalizedParentPhone });
    if (legacyByUsername && !normalizePhone(legacyByUsername.phone || '')) {
      parentUser = legacyByUsername;
      parentUser.phone = normalizedParentPhone;
      await parentUser.save();
    }
  }

  if (!parentUser) {
    const existingEmailUser = await User.findOne({ email: normalizedParentEmail }).lean();
    if (existingEmailUser) {
      throw new Error('Email phụ huynh đã tồn tại trong hệ thống');
    }

    generatedPassword = generateRandomPassword(10);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(generatedPassword, salt);

    parentUser = new User({
      username: normalizedParentPhone,
      passwordHash,
      fullName: parent.fullName.trim(),
      email: normalizedParentEmail,
      phone: normalizedParentPhone,
      address: (parent.address || '').trim(),
      roles: [parentRole._id],
      status: 'active',
      isChangePassword: false,
    });
    await parentUser.save();
    isNewParent = true;
  } else {
    // Khi đã có tài khoản theo số điện thoại, email phải trùng email đã đăng ký.
    if (normalizedParentEmail !== (parentUser.email || '').toLowerCase()) {
      throw new Error('Số điện thoại đã tồn tại, email phải trùng với email đã đăng ký theo số điện thoại này');
    }
    parentUser.fullName = parent.fullName.trim() || parentUser.fullName;
    parentUser.phone = normalizedParentPhone;
    parentUser.username = normalizedParentPhone;
    parentUser.address = (parent.address || '').trim() || parentUser.address || '';
    if (!Array.isArray(parentUser.roles) || !parentUser.roles.some((roleId) => String(roleId) === String(parentRole._id))) {
      parentUser.roles = [...(parentUser.roles || []), parentRole._id];
    }
    await parentUser.save();
  }

  const activeYear = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1 }).lean();
  const parentProfile = await upsertParentProfileFromUser(parentUser);
  const studentCode = await generateStudentCode();
  const newStudent = new Student({
    studentCode,
    fullName: studentData.fullName.trim(),
    dateOfBirth: studentData.dateOfBirth,
    gender: studentData.gender,
    phone: normalizePhone(studentData.phone || normalizedParentPhone),
    parentPhone: normalizePhone(studentData.parentPhone || normalizedParentPhone),
    address: (studentData.address || '').trim(),
    classId: studentData.classId || null,
    parentId: parentUser._id,
    parentProfileId: parentProfile?._id || null,
    avatar: (studentData.avatar || '').trim(),
    academicYearId: activeYear?._id || null,
    status: 'active',
  });
  await newStudent.save();

  if (isNewParent) {
    await sendParentAccountEmail(parentUser.email, parentUser.fullName, parentUser.username, generatedPassword);
  }

  return { newStudent, parentUser, isNewParent };
};

/**
 * Lấy danh sách tất cả học sinh (lọc theo classId, academicYearId)
 * GET /api/students?classId=...&academicYearId=...
 */
const getStudents = async (req, res) => {
  try {
    const { classId, academicYearId } = req.query;
    const filter = {};
    if (classId) filter.classId = classId;
    if (academicYearId) filter.academicYearId = academicYearId;

    const students = await Student.find(filter)
      .populate('classId', 'className gradeId')
      .populate('parentId', 'fullName email username avatar phone')
      .populate('parentProfileId', 'fullName email phone')
      .populate('academicYearId', 'yearName');

    // Không gửi mảng embedding 128 số về client (tốn bandwidth)
    // Thay bằng flag hasFaceEmbedding và faceRegisteredAt
    const data = students.map((s) => {
      const obj = s.toObject();
      obj.hasFaceEmbedding = Array.isArray(obj.faceEmbedding) && obj.faceEmbedding.length > 0;
      obj.faceImageUrls = Array.isArray(obj.faceImageUrls) ? obj.faceImageUrls.filter(Boolean) : [];
      obj.angleCount = Array.isArray(obj.faceEmbeddings) ? obj.faceEmbeddings.length : (obj.hasFaceEmbedding ? 1 : 0);
      delete obj.faceEmbedding;
      delete obj.faceEmbeddings;
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
      studentCode,
      fullName,
      dateOfBirth,
      gender,
      phone,
      address,
      classId,
      parentId: parentId || userId,
      parentProfileId,
      academicYearId: activeYear?._id || null,
      status: 'active',
    });

    await newStudent.save();

    const populatedStudent = await Student.findById(newStudent._id)
      .populate('classId', 'className')
      .populate('parentId', 'fullName email username avatar phone')
      .populate('parentProfileId', 'fullName email phone')
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

    if (!parent || !parent.fullName || !parent.email || !parent.phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập đầy đủ thông tin phụ huynh: số điện thoại, họ tên, email',
      });
    }

    if (!studentData || !studentData.fullName || !studentData.dateOfBirth || !studentData.gender) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập đầy đủ thông tin học sinh: họ tên, ngày sinh, giới tính',
      });
    }

    const { newStudent, isNewParent } = await createStudentWithParentCore({ parent, studentData });

    const populatedStudent = await Student.findById(newStudent._id)
      .populate('classId', 'className')
      .populate('parentId', 'fullName email username avatar phone')
      .populate('parentProfileId', 'fullName email phone')
      .populate('academicYearId', 'yearName');

    return res.status(201).json({
      status: 'success',
      message: isNewParent
        ? 'Tạo tài khoản phụ huynh và học sinh thành công. Đã gửi tài khoản qua email phụ huynh.'
        : 'Tạo học sinh thành công và gán vào tài khoản phụ huynh hiện có theo số điện thoại.',
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

const importStudentsWithParents = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng chọn file Excel để import' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ status: 'error', message: 'File Excel không có dữ liệu' });
    }

    const requiredHeaders = [
      'Họ tên phụ huynh',
      'Email phụ huynh',
      'Số điện thoại phụ huynh',
      'Họ tên học sinh',
      'Ngày sinh',
      'Giới tính',
    ];
    const headers = {};
    let headerRowIndex = 1;
    const scanLimit = Math.min(worksheet.rowCount, 20);
    for (let i = 1; i <= scanLimit; i += 1) {
      const row = worksheet.getRow(i);
      const localHeaders = {};
      row.eachCell((cell, colNumber) => {
        localHeaders[normalizeHeaderKey(cell.value)] = colNumber;
      });
      const hasAllRequired = requiredHeaders.every((header) => !!localHeaders[normalizeHeaderKey(header)]);
      if (hasAllRequired) {
        Object.assign(headers, localHeaders);
        headerRowIndex = i;
        break;
      }
    }

    if (!Object.keys(headers).length) {
      return res.status(400).json({
        status: 'error',
        message: 'Không tìm thấy dòng tiêu đề hợp lệ. Vui lòng dùng đúng file mẫu Excel.',
      });
    }

    const getCellValue = (row, keys) => {
      for (const key of keys) {
        const idx = headers[normalizeHeaderKey(key)];
        if (idx) return String(row.getCell(idx).value || '').trim();
      }
      return '';
    };

    let createdStudents = 0;
    let linkedExistingParents = 0;
    let createdParents = 0;
    const errors = [];

    for (let rowIndex = headerRowIndex + 1; rowIndex <= worksheet.rowCount; rowIndex += 1) {
      const row = worksheet.getRow(rowIndex);
      const parentFullName = getCellValue(row, ['Họ tên phụ huynh']);
      const parentEmail = getCellValue(row, ['Email phụ huynh']);
      const parentPhone = getCellValue(row, ['Số điện thoại phụ huynh']);
      const studentFullName = getCellValue(row, ['Họ tên học sinh']);
      const dateOfBirth = getCellValue(row, ['Ngày sinh']);
      const genderRaw = getCellValue(row, ['Giới tính']);
      const address = getCellValue(row, ['Địa chỉ']);
      const avatar = getCellValue(row, ['Ảnh học sinh (URL)']);
      const className = getCellValue(row, ['Lớp']);

      if (!parentFullName && !parentEmail && !parentPhone && !studentFullName) {
        continue;
      }

      if (!parentFullName || !parentEmail || !parentPhone || !studentFullName || !dateOfBirth) {
        errors.push(`Dòng ${rowIndex}: thiếu thông tin bắt buộc`);
        continue;
      }

      try {
        let classId = null;
        if (className) {
          const Classes = require('../models/Classes');
          const foundClass = await Classes.findOne({ className: className.trim() }).lean();
          if (foundClass) classId = foundClass._id;
        }

        const beforeParent = await User.findOne({ $or: [{ username: normalizePhone(parentPhone) }, { phone: normalizePhone(parentPhone) }] }).lean();
        const { isNewParent } = await createStudentWithParentCore({
          parent: {
            fullName: parentFullName,
            email: parentEmail,
            phone: parentPhone,
            address,
          },
          studentData: {
            fullName: studentFullName,
            dateOfBirth: new Date(dateOfBirth),
            gender: normalizeGender(genderRaw || 'other'),
            address,
            avatar,
            classId,
            parentPhone,
          },
        });
        createdStudents += 1;
        if (isNewParent && !beforeParent) createdParents += 1;
        if (!isNewParent) linkedExistingParents += 1;
      } catch (rowError) {
        errors.push(`Dòng ${rowIndex}: ${rowError.message}`);
      }
    }

    return res.status(200).json({
      status: 'success',
      message: `Import hoàn tất: ${createdStudents} học sinh, ${createdParents} phụ huynh mới, ${linkedExistingParents} học sinh gán phụ huynh sẵn có`,
      data: { createdStudents, createdParents, linkedExistingParents, errors },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
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
      .populate('parentId', 'fullName email username avatar')
      .populate('parentProfileId', 'fullName email phone');

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
    obj.faceImageUrls = Array.isArray(obj.faceImageUrls) ? obj.faceImageUrls.filter(Boolean) : [];
    obj.angleCount = Array.isArray(obj.faceEmbeddings) ? obj.faceEmbeddings.length : (obj.hasFaceEmbedding ? 1 : 0);
    delete obj.faceEmbedding;
    delete obj.faceEmbeddings;

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
        const updatedParent = await User.findByIdAndUpdate(student.parentId, parentUpdate, { new: true, runValidators: true });
        if (updatedParent) {
          await upsertParentProfileFromUser(updatedParent);
        }
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      updateData,
      { new: true, runValidators: true },
    )
      .populate('classId', 'className')
      .populate('parentId', 'fullName email username avatar phone')
      .populate('parentProfileId', 'fullName email phone');

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

/**
 * Kiểm tra phụ huynh theo số điện thoại
 * GET /api/students/check-parent-phone?phone=...
 */
const checkParentByPhone = async (req, res) => {
  try {
    const phone = normalizePhone(req.query.phone || '');
    if (!phone) {
      return res.status(400).json({ status: 'error', message: 'Thiếu hoặc sai số điện thoại' });
    }

    const parent = await User.findOne({ phone })
      .select('_id fullName email phone username')
      .lean();

    if (parent?._id) {
      await upsertParentProfileFromUser(parent);
    }

    return res.status(200).json({
      status: 'success',
      exists: !!parent,
      data: parent || null,
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
  checkParentByPhone,
  importStudentsWithParents,
};

