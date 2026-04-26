const Student = require('../../models/Student');
const User = require('../../models/User');
const Role = require('../../models/Role');
const AcademicYear = require('../../models/AcademicYear');
const Classes = require('../../models/Classes');
const bcrypt = require('bcryptjs');
const { 
  normalizePhone, 
  normalizeGender, 
  generateStudentCode,
  upsertParentProfileFromUser
} = require('../../controller/student/helpers');
const { generateRandomPassword, sendAccountCredentialsEmail } = require('../../utils/email');

/**
 * Service: Xử lý logic lõi tạo tài khoản PH và HS
 */
const createStudentWithParentCore = async ({ parent, studentData }) => {
  const normalizedParentPhone = normalizePhone(parent.phone);
  if (!normalizedParentPhone) {
    throw new Error('Số điện thoại phụ huynh không hợp lệ');
  }

  const { forceUpdate = false } = studentData;

  // 1. Phụ huynh
  let parentUser = await User.findOne({
    $or: [{ username: normalizedParentPhone }, { phone: normalizedParentPhone }],
  });

  let isNewParent = false;
  let generatedPassword = null;

  if (!parentUser) {
    const parentRole = await Role.findOne({ roleName: { $in: ['Parent', 'Phụ huynh'] } });
    if (!parentRole) throw new Error('Không tìm thấy Role Phụ huynh');

    generatedPassword = generateRandomPassword(10);
    
    let emailToUse = (parent.email || '').toLowerCase().trim();
    if (!emailToUse) {
      emailToUse = `parent_${normalizedParentPhone}@dxmn.local`;
    } else {
      const existingEmail = await User.findOne({ email: emailToUse });
      if (existingEmail) throw new Error(`Email ${emailToUse} đã được sử dụng.`);
    }

    const hashed = await bcrypt.hash(generatedPassword, 10);

    parentUser = new User({
      username: normalizedParentPhone,
      passwordHash: hashed,
      fullName: (parent.fullName || '').trim(),
      email: emailToUse,
      phone: normalizedParentPhone,
      roles: [parentRole._id],
      status: 'active',
      isChangePassword: false,
      tempPasswordExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });
    await parentUser.save();
    isNewParent = true;
  } else {
    let needsSave = false;
    
    // 1. Kiểm tra và bổ sung quyền Phụ huynh nếu tài khoản (giáo viên/nhân viên) chưa có
    const parentRole = await Role.findOne({ roleName: { $in: ['Parent', 'Phụ huynh'] } });
    if (parentRole) {
      const hasParentRole = parentUser.roles && parentUser.roles.some(id => id.toString() === parentRole._id.toString());
      if (!hasParentRole) {
        if (!parentUser.roles) parentUser.roles = [];
        parentUser.roles.push(parentRole._id);
        needsSave = true;
      }
    }

    // 2. Cập nhật thông tin nếu có cờ forceUpdate
    if (forceUpdate) {
      let emailToUse = (parent.email || '').toLowerCase().trim();
      if (emailToUse && emailToUse !== parentUser.email) {
        const existingEmail = await User.findOne({ email: emailToUse });
        if (!existingEmail) {
          parentUser.email = emailToUse;
        } else {
          throw new Error(`Email ${emailToUse} đã được sử dụng.`);
        }
      }
      parentUser.fullName = (parent.fullName || '').trim() || parentUser.fullName;
      needsSave = true;
    }

    if (needsSave) {
      await parentUser.save();
    }
  }

  const parentProfile = await upsertParentProfileFromUser(parentUser);

  // 2. Học sinh
  const studentDob = new Date(studentData.dateOfBirth);
  const studentFullName = (studentData.fullName || '').trim();

  let student = await Student.findOne({
    fullName: { $regex: new RegExp(`^${studentFullName}$`, 'i') },
    dateOfBirth: studentDob,
    parentId: parentUser._id,
  });

  let isNewStudent = false;
  const activeYear = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1 }).lean();

  if (student) {
    if (!forceUpdate) return { duplicateDetected: true, student, parentUser };
    student.gender = studentData.gender || student.gender;
    student.address = (studentData.address || '').trim() || student.address;
    student.classId = studentData.classId || student.classId;
    student.parentProfileId = parentProfile?._id || student.parentProfileId;
    student.academicYearId = activeYear?._id || student.academicYearId;
    await student.save();
  } else {
    const studentCode = await generateStudentCode();
    student = new Student({
      studentCode,
      fullName: studentFullName,
      dateOfBirth: studentDob,
      gender: studentData.gender,
      phone: normalizePhone(studentData.phone || normalizedParentPhone),
      parentPhone: normalizedParentPhone,
      address: (studentData.address || '').trim(),
      classId: studentData.classId || null,
      parentId: parentUser._id,
      parentProfileId: parentProfile?._id || null,
      academicYearId: activeYear?._id || null,
      status: 'active',
    });
    await student.save();
    isNewStudent = true;
  }

  if (isNewParent) {
    await sendAccountCredentialsEmail(parentUser.email, parentUser.fullName, parentUser.username, generatedPassword, 'Phụ huynh');
  }

  return { student, parentUser, isNewParent, isNewStudent, generatedPassword: isNewParent ? generatedPassword : null };
};

/**
 * Service: Tìm lớp học phù hợp (ưu tiên năm học active)
 */
const findTargetClass = async (className, allowUnassignedClass = false) => {
  if (!className) return null;
  const activeYear = await AcademicYear.findOne({ status: 'active' }).lean();
  if (!activeYear) {
    throw new Error('Chưa có năm học nào đang hoạt động (Active) để import');
  }
  
  const found = await Classes.findOne({ 
    className: className.trim(), 
    academicYearId: activeYear._id 
  }).lean();

  if (!found) {
    if (allowUnassignedClass) {
      return null; // Bỏ qua lỗi và trả về null để đưa vào dạng Chưa xếp lớp
    }
    throw new Error(`Lớp "${className.trim()}" chưa được tạo trong năm học này. Vui lòng tạo lớp trước!`);
  }
  
  return found._id;
};

module.exports = {
  createStudentWithParentCore,
  findTargetClass
};
