// ========================
// Utility functions & constants cho TeacherAttendance
// ========================

export const getLocalISODate = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
};

export const isValidHHmm = (value) => !value || /^\d{2}:\d{2}$/.test(value);

export const nowHHmm = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

export const makeStorageKey = (classId) => `teacherAttendance:${classId}`;

export const readAttendanceStorage = (classId) => {
  try {
    if (!classId) return {};
    const raw = localStorage.getItem(makeStorageKey(classId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const writeAttendanceStorage = (classId, allDatesObject) => {
  try {
    if (!classId) return;
    localStorage.setItem(makeStorageKey(classId), JSON.stringify(allDatesObject || {}));
  } catch {
    // ignore
  }
};

export const defaultRecord = () => ({
  status: 'empty', // empty | checked_in | checked_out | absent
  timeIn: '',
  timeOut: '',
  checkinImageName: '',
  delivererType: '',
  delivererPickupPersonId: '',
  delivererOtherInfo: '',
  delivererName: '',
  delivererPhone: '',
  delivererOtherImageName: '',
  hasBelongings: false,
  belongingsNote: '',
  note: '',
  absentReason: '',
  checkoutImageName: '',
  receiverType: '',
  receiverPickupPersonId: '',
  receiverOtherInfo: '',
  receiverName: '',
  receiverPhone: '',
  receiverOtherImageName: '',
  checkoutNote: '',
  hasCheckoutBelongings: false,
  checkoutBelongingsNote: '',
  sendOtpSchoolAccount: false,
  sendOtpViaSms: false,
  selectedParentForOtp: '',
  otpCode: '',
  otpSent: false,
  otpVerified: false,
});

export const ABSENT_REASONS = ['Ốm', 'Nghỉ phép', 'Gia đình có việc', 'Khác'];
export const MAX_PERSON_NAME_LEN = 50;
export const MAX_PERSON_PHONE_LEN = 15;
export const MAX_BELONGINGS_NOTE_LEN = 100;
export const MAX_NOTE_LEN = 100;
export const PHONE_REGEX = /^[0-9+\-\s()]{7,15}$/;

export const parsePersonOtherInfo = (info) => {
  if (!info) return { name: '', phone: '' };
  const idx = info.lastIndexOf(' - ');
  if (idx !== -1) return { name: info.slice(0, idx).trim(), phone: info.slice(idx + 3).trim() };
  return { name: info.trim(), phone: '' };
};

export const buildPersonOtherInfo = (name, phone) => {
  const n = name?.trim() || '';
  const p = phone?.trim() || '';
  if (n && p) return `${n} - ${p}`;
  return n || p || '';
};

export const sanitizeSingleLineText = (value = '', maxLen = 100) =>
  value
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, maxLen);

export const sanitizeMultiLineText = (value = '', maxLen = 300) =>
  value
    .replace(/[<>]/g, '')
    .slice(0, maxLen);

export const getStatusBadge = (status) => {
  switch (status) {
    case 'checked_in':
      return { text: 'Có mặt (đã checkin)', cls: 'bg-green-50 text-green-700' };
    case 'checked_out':
      return { text: 'Đã về', cls: 'bg-purple-50 text-purple-700' };
    case 'absent':
      return { text: 'Vắng mặt', cls: 'bg-red-50 text-red-700' };
    case 'empty':
    default:
      return { text: 'Rỗng (chưa điểm danh)', cls: 'bg-gray-100 text-gray-700' };
  }
};

// Chuyển số điện thoại VN sang định dạng E.164 cho Firebase
export const formatPhoneForFirebase = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('0')) return '+84' + cleaned.slice(1);
  return '+84' + cleaned;
};

export const buildDateTimeISO = (dateStr, hhmm) => {
  const [hh, mm] = (hhmm || '').split(':');
  if (!dateStr || !hh || !mm) return null;
  const d = new Date(dateStr);
  d.setHours(Number(hh), Number(mm), 0, 0);
  return d.toISOString();
};
