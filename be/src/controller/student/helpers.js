const Student = require('../../models/Student');
const User = require('../../models/User');
const ParentProfile = require('../../models/ParentProfile');
const Role = require('../../models/Role');
const RefreshToken = require('../../models/RefreshToken');

const normalizePhone = (value = '') => {
  let phone = String(value).replace(/\D/g, '').trim();
  // Xử lý lỗi Excel tự động cắt số 0 ở đầu (Số điện thoại VN có 10 số bắt đầu bằng 0)
  if (phone.length === 9 && !phone.startsWith('0')) {
    phone = '0' + phone;
  }
  return phone;
};

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

const excelDateSerialToDate = (serial) => {
  const number = Number(serial);
  if (!Number.isFinite(number)) return null;
  const utcDays = Math.floor(number - 25569);
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);
  if (Number.isNaN(dateInfo.getTime())) return null;
  return dateInfo;
};

const extractCellText = (cellValue) => {
  if (cellValue === null || cellValue === undefined) return '';
  if (typeof cellValue === 'string') return cellValue.trim();
  if (typeof cellValue === 'number' || typeof cellValue === 'boolean') return String(cellValue).trim();
  if (cellValue instanceof Date) return cellValue.toISOString().slice(0, 10);
  if (typeof cellValue === 'object') {
    if (typeof cellValue.text === 'string') return cellValue.text.trim();
    if (typeof cellValue.result === 'string') return cellValue.result.trim();
    if (typeof cellValue.result === 'number') return String(cellValue.result).trim();
    if (Array.isArray(cellValue.richText)) {
      return cellValue.richText.map((entry) => entry?.text || '').join('').trim();
    }
    if (typeof cellValue.hyperlink === 'string' && typeof cellValue.text === 'string') return cellValue.text.trim();
  }
  return String(cellValue || '').trim();
};

const parseExcelDateValue = (cellValue) => {
  if (!cellValue && cellValue !== 0) return null;
  if (cellValue instanceof Date) {
    return Number.isNaN(cellValue.getTime()) ? null : cellValue;
  }
  if (typeof cellValue === 'number') {
    return excelDateSerialToDate(cellValue);
  }
  if (typeof cellValue === 'object' && cellValue !== null) {
    if (cellValue.result instanceof Date) {
      return Number.isNaN(cellValue.result.getTime()) ? null : cellValue.result;
    }
    if (typeof cellValue.result === 'number') {
      return excelDateSerialToDate(cellValue.result);
    }
    if (typeof cellValue.text === 'string') {
      const date = new Date(cellValue.text.trim());
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  const parsed = new Date(String(cellValue).trim());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

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

const countLinkedStudentsByUserId = async (userId) => {
  if (!userId) return 0;
  return Student.countDocuments({
    $or: [
      { parentId: userId },
      { ParentId: userId },
      { userId },
      { UserId: userId },
    ],
  });
};

const isParentOnlyAccount = async (userDoc) => {
  if (!userDoc?._id) return false;
  const parentRoles = await Role.find({
    roleName: { $in: ['Parent', 'parent', 'StudentParent', 'studentparent', 'Phụ huynh'] },
  }).select('_id').lean();
  const parentRoleIds = new Set(parentRoles.map((r) => String(r._id)));
  if (parentRoleIds.size === 0) return false;
  const userRoleIds = (userDoc.roles || []).map((r) => String(r));
  if (userRoleIds.length === 0) return false;
  return userRoleIds.every((roleId) => parentRoleIds.has(roleId));
};

const purgeOrphanParentAccount = async (userDoc) => {
  if (!userDoc?._id) return false;
  const isParentOnly = await isParentOnlyAccount(userDoc);
  if (!isParentOnly) return false;
  const linkedStudents = await countLinkedStudentsByUserId(userDoc._id);
  if (linkedStudents > 0) return false;

  await ParentProfile.findOneAndUpdate({ userId: userDoc._id }, { status: 'inactive' });
  await User.findByIdAndUpdate(userDoc._id, { status: 'inactive' });
  await RefreshToken.updateMany({ userId: userDoc._id }, { isRevoked: true });
  return true;
};

module.exports = {
  normalizePhone,
  normalizeGender,
  normalizeHeaderKey,
  excelDateSerialToDate,
  extractCellText,
  parseExcelDateValue,
  generateStudentCode,
  upsertParentProfileFromUser,
  countLinkedStudentsByUserId,
  isParentOnlyAccount,
  purgeOrphanParentAccount,
};
