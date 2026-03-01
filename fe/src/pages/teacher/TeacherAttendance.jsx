import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { get, post, postFormData, ENDPOINTS } from '../../service/api';

const getLocalISODate = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
};

const isValidHHmm = (value) => !value || /^\d{2}:\d{2}$/.test(value);

const nowHHmm = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const makeStorageKey = (classId) => `teacherAttendance:${classId}`;

const readAttendanceStorage = (classId) => {
  try {
    if (!classId) return {};
    const raw = localStorage.getItem(makeStorageKey(classId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeAttendanceStorage = (classId, allDatesObject) => {
  try {
    if (!classId) return;
    localStorage.setItem(makeStorageKey(classId), JSON.stringify(allDatesObject || {}));
  } catch {
    // ignore
  }
};

const defaultRecord = () => ({
  status: 'empty', // empty | checked_in | waiting_parent | parent_confirmed | checked_out | absent
  timeIn: '',
  timeOut: '',
  // Thông tin check-in chi tiết
  checkinImageName: '',
  delivererType: '', // '', 'Bố', 'Mẹ', 'Ông', 'Bà', 'Khác'
  delivererOtherInfo: '',
  delivererOtherImageName: '',
  hasBelongings: false,
  belongingsNote: '',
  note: '',
  absentReason: '',
  // Thông tin check-out chi tiết
  checkoutImageName: '',
  receiverType: '', // '', 'Bố', 'Mẹ', 'Ông', 'Bà', 'Khác'
  receiverOtherInfo: '',
  receiverOtherImageName: '',
  // Thông tin gửi OTP
  sendOtpSchoolAccount: false,
  sendOtpViaSms: false,
  selectedParentForOtp: '',
  otpCode: '',
  otpSent: false,
  otpVerified: false,
});

const DELIVERER_OPTIONS = ['Bố', 'Mẹ', 'Ông', 'Bà', 'Khác'];
const ABSENT_REASONS = ['Ốm', 'Nghỉ phép', 'Gia đình có việc', 'Khác'];
const MAX_PERSON_INFO_LEN = 100;
const MAX_BELONGINGS_NOTE_LEN = 100;
const MAX_NOTE_LEN = 100;
const PERSON_INFO_REGEX = /^[\p{L}\p{N}\s.,\-()+/]+$/u;

const sanitizeSingleLineText = (value = '', maxLen = 100) =>
  value
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, maxLen);

const sanitizeMultiLineText = (value = '', maxLen = 300) =>
  value
    .replace(/[<>]/g, '')
    .slice(0, maxLen);

const getStatusBadge = (status) => {
  switch (status) {
    case 'checked_in':
      return { text: 'Có mặt (đã checkin)', cls: 'bg-green-50 text-green-700' };
    case 'waiting_parent':
      return { text: 'Chờ PH xác nhận', cls: 'bg-amber-50 text-amber-700' };
    case 'parent_confirmed':
      return { text: 'PH đã xác nhận', cls: 'bg-blue-50 text-blue-700' };
    case 'checked_out':
      return { text: 'Đã về', cls: 'bg-purple-50 text-purple-700' };
    case 'absent':
      return { text: 'Vắng mặt', cls: 'bg-red-50 text-red-700' };
    case 'empty':
    default:
      return { text: 'Rỗng (chưa điểm danh)', cls: 'bg-gray-100 text-gray-700' };
  }
};

function TeacherAttendance() {
  const navigate = useNavigate();
  const location = useLocation();
  const { classId } = useParams();
  const { user, logout, isInitializing } = useAuth();
  const todayISO = getLocalISODate();

  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classesError, setClassesError] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(getLocalISODate);
  const [attendanceByStudent, setAttendanceByStudent] = useState({});

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailStudentId, setDetailStudentId] = useState(null);
  const [detailMode, setDetailMode] = useState('view'); // 'view' | 'checkin' | 'checkout'
  const [detailForm, setDetailForm] = useState(() => ({
    status: 'empty',
    timeIn: '',
    timeOut: '',
    checkinImageName: '',
    delivererType: '',
    delivererOtherInfo: '',
    delivererOtherImageName: '',
    hasBelongings: false,
    belongingsNote: '',
    note: '',
    absentReason: '',
    checkoutImageName: '',
    receiverType: '',
    receiverOtherInfo: '',
    receiverOtherImageName: '',
  }));

  const [isAbsentOpen, setIsAbsentOpen] = useState(false);
  const [absentStudentId, setAbsentStudentId] = useState(null);
  const [absentForm, setAbsentForm] = useState({
    reason: '',
    note: '',
  });
  const [absentError, setAbsentError] = useState(null);
  const [isConfirmAbsentOpen, setIsConfirmAbsentOpen] = useState(false);

  // Toast thông báo thành công
  const [successToast, setSuccessToast] = useState({ visible: false, message: '' });

  const showSuccessToast = (message) => {
    setSuccessToast({ visible: true, message });
    setTimeout(() => setSuccessToast({ visible: false, message: '' }), 3000);
  };

  // State cho Firebase OTP
  const [confirmationResult, setConfirmationResult] = useState(null);
  const recaptchaVerifierRef = useRef(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState(0); // Thời gian còn lại (giây)
  const [otpExpired, setOtpExpired] = useState(false); // OTP đã hết hạn

  // Khởi tạo RecaptchaVerifier MỘT LẦN khi component mount, clear khi unmount
  useEffect(() => {
    recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  // Chuyển số điện thoại VN sang định dạng E.164 cho Firebase
  const formatPhoneForFirebase = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.startsWith('0')) return '+84' + cleaned.slice(1);
    return '+84' + cleaned;
  };

  const handleSelectedDateChange = (value) => {
    if (!value) return;
    if (value > todayISO) {
      setSelectedDate(todayISO);
      return;
    }
    setSelectedDate(value);
  };

  useEffect(() => {
    if (isInitializing) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('Teacher')) {
      navigate('/', { replace: true });
    }
  }, [navigate, user, isInitializing]);

  useEffect(() => {
    // Luôn load danh sách lớp để:
    // - Nếu chưa chọn lớp: hiển thị màn hình chọn lớp
    // - Nếu đã chọn lớp: hiển thị tên lớp + validate quyền phụ trách (client-side)
    if (isInitializing) return;
    if (!user?._id) return;
    fetchMyClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitializing, user?._id]);

  useEffect(() => {
    // Khi đổi classId thì reset dữ liệu học sinh / bản ghi local để tránh lẫn lớp
    setStudents([]);
    setStudentsError(null);
    setAttendanceByStudent({});
    setSubmitError(null);
    setIsDetailOpen(false);
    setDetailStudentId(null);

    if (!classId) return;
    fetchStudentsByClass(classId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    // load attendance from localStorage by classId + date
    if (!classId) return;
    const all = readAttendanceStorage(classId);
    const byDate = all?.[selectedDate] || {};
    setAttendanceByStudent(byDate);
  }, [classId, selectedDate]);

  useEffect(() => {
    // Ensure every student has a record for current date (client-only)
    if (!classId) return;
    if (!Array.isArray(students) || students.length === 0) return;
    setAttendanceByStudent((prev) => {
      let changed = false;
      const next = { ...(prev || {}) };
      students.forEach((s) => {
        if (!s?._id) return;
        if (!next[s._id]) {
          next[s._id] = defaultRecord();
          changed = true;
        }
      });
      if (!changed) return prev;
      const all = readAttendanceStorage(classId);
      all[selectedDate] = next;
      writeAttendanceStorage(classId, all);
      return next;
    });
  }, [classId, selectedDate, students]);

  // Đếm ngược OTP - 120 giây (2 phút)
  useEffect(() => {
    if (!detailForm.otpSent || otpExpired) return;

    const interval = setInterval(() => {
      setOtpTimeLeft((prev) => {
        if (prev <= 1) {
          setOtpExpired(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [detailForm.otpSent, otpExpired]);

  // Khi gửi OTP, bắt đầu đếm ngược
  useEffect(() => {
    if (detailForm.otpSent && !otpExpired) {
      setOtpTimeLeft(120); // 2 phút
    }
  }, [detailForm.otpSent]);

  const menuItems = useMemo(
    () => [
      { key: "classes", label: "Lớp phụ trách" },
      { key: "students", label: "Danh sách học sinh" },
      { key: "attendance", label: "Điểm danh" },
      { key: "pickup-approval", label: "Phê duyệt đưa đón" },
      { key: "schedule", label: "Lịch dạy & hoạt động" },
      { key: "messages", label: "Thông báo cho phụ huynh" },
    ],
    []
  );

  const activeKey = useMemo(() => {
    const path = location.pathname || '';
    if (path.startsWith('/teacher/attendance')) return 'attendance';
    return 'classes';
  }, [location.pathname]);

  const userName = user?.fullName || user?.username || 'Teacher';

  const handleMenuSelect = (key) => {
    if (key === 'classes') {
      navigate('/teacher');
      return;
    }
    if (key === 'attendance') {
      return;
    }
    if (key === "pickup-approval") {
      navigate("/teacher/pickup-approval");
      return;
    }
  };

  const fetchMyClasses = async () => {
    try {
      setLoadingClasses(true);
      setClassesError(null);
      const res = await get(ENDPOINTS.CLASSES.LIST);
      const all = res.data || [];
      const myUserId = user?._id;
      const mine = all.filter((c) => (c.teacherIds || []).some((t) => (t?._id || t) === myUserId));
      setClasses(mine);
    } catch (err) {
      setClassesError(err.message || 'Không tải được danh sách lớp');
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudentsByClass = async (targetClassId) => {
    try {
      setLoadingStudents(true);
      setStudentsError(null);
      const res = await get(ENDPOINTS.CLASSES.STUDENTS(targetClassId));
      setStudents(res.data || []);
    } catch (err) {
      setStudentsError(err.message || 'Không tải được danh sách học sinh theo lớp');
    } finally {
      setLoadingStudents(false);
    }
  };

  const persistAttendanceByStudent = (next) => {
    setAttendanceByStudent(next);
    if (!classId) return;
    const all = readAttendanceStorage(classId);
    all[selectedDate] = next;
    writeAttendanceStorage(classId, all);
  };

  const updateRecord = (studentId, patch) => {
    persistAttendanceByStudent({
      ...(attendanceByStudent || {}),
      [studentId]: {
        ...(attendanceByStudent?.[studentId] || defaultRecord()),
        ...(patch || {}),
      },
    });
  };

  const openDetail = (studentId, mode = 'view') => {
    setSubmitError(null);
    setDetailStudentId(studentId);
    const rec = attendanceByStudent?.[studentId] || defaultRecord();
    const isSameStudentCheckin = mode === 'checkin' && studentId === detailStudentId;

    setDetailForm({
      status:
        mode === 'checkin' && (rec.status === 'empty' || rec.status === 'absent')
          ? 'checked_in'
          : mode === 'checkout'
          ? 'checked_out'
          : rec.status || 'empty',
      timeIn:
        mode === 'checkin' && (!rec.timeIn || rec.status === 'empty' || rec.status === 'absent')
          ? nowHHmm()
          : rec.timeIn || '',
      timeOut:
        mode === 'checkout' && !rec.timeOut
          ? nowHHmm()
          : rec.timeOut || '',
      checkinImageName: rec.checkinImageName || '',
      delivererType: rec.delivererType || '',
      delivererOtherInfo: rec.delivererOtherInfo || '',
      delivererOtherImageName: rec.delivererOtherImageName || '',
      hasBelongings: !!rec.hasBelongings,
      belongingsNote: rec.belongingsNote || '',
      note: rec.note || '',
      absentReason: rec.absentReason || '',
      checkoutImageName: rec.checkoutImageName || '',
      receiverType: rec.receiverType || '',
      receiverOtherInfo: rec.receiverOtherInfo || '',
      receiverOtherImageName: rec.receiverOtherImageName || '',
      // Giữ lại trạng thái OTP nếu mở lại cùng học sinh ở chế độ checkin
      sendOtpSchoolAccount: isSameStudentCheckin ? detailForm.sendOtpSchoolAccount : false,
      sendOtpViaSms: isSameStudentCheckin ? detailForm.sendOtpViaSms : false,
      selectedParentForOtp: isSameStudentCheckin ? detailForm.selectedParentForOtp : '',
      otpCode: isSameStudentCheckin ? detailForm.otpCode : '',
      otpSent: isSameStudentCheckin ? detailForm.otpSent : false,
    });
    setDetailMode(mode);
    setIsDetailOpen(true);

    // Chỉ reset OTP khi mở checkin cho học sinh khác hoặc chuyển sang mode khác
    if (!isSameStudentCheckin) {
      resetOtpState();
    }
  };

  // Reset trạng thái OTP (RecaptchaVerifier được giữ nguyên để tránh "already rendered")
  const resetOtpState = () => {
    setConfirmationResult(null);
    setOtpExpired(false);
    setOtpTimeLeft(0);
    setDetailForm((prev) => ({ ...prev, otpSent: false, otpCode: '' }));
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSubmitError(null);
    // Không reset OTP ở đây để teacher có thể mở lại cùng học sinh mà không cần gửi lại OTP
  };

  const validateDetail = () => {
    if (!detailStudentId) return 'Không xác định học sinh.';
    if (!isValidHHmm(detailForm.timeIn) || !isValidHHmm(detailForm.timeOut))
      return 'Giờ đến/giờ về phải theo định dạng HH:mm.';

    const delivererOtherInfo = detailForm.delivererOtherInfo?.trim() || '';
    const receiverOtherInfo = detailForm.receiverOtherInfo?.trim() || '';
    const belongingsNote = detailForm.belongingsNote?.trim() || '';
    const note = detailForm.note?.trim() || '';

    if (detailForm.delivererType === 'Khác') {
      if (!delivererOtherInfo) return 'Vui lòng nhập thông tin người đưa.';
      if (!PERSON_INFO_REGEX.test(delivererOtherInfo))
        return 'Thông tin người đưa chỉ chứa chữ, số và ký tự cơ bản (.,-()+).';
      if (delivererOtherInfo.length > MAX_PERSON_INFO_LEN)
        return `Thông tin người đưa tối đa ${MAX_PERSON_INFO_LEN} ký tự.`;
    }

    if (detailForm.receiverType === 'Khác') {
      if (!receiverOtherInfo) return 'Vui lòng nhập thông tin người đón.';
      if (!PERSON_INFO_REGEX.test(receiverOtherInfo))
        return 'Thông tin người đón chỉ chứa chữ, số và ký tự cơ bản (.,-()+).';
      if (receiverOtherInfo.length > MAX_PERSON_INFO_LEN)
        return `Thông tin người đón tối đa ${MAX_PERSON_INFO_LEN} ký tự.`;
    }

    if (detailForm.hasBelongings && !belongingsNote) {
      return 'Vui lòng nhập ghi chú đồ mang theo.';
    }
    if (belongingsNote.length > MAX_BELONGINGS_NOTE_LEN) {
      return `Ghi chú đồ mang theo tối đa ${MAX_BELONGINGS_NOTE_LEN} ký tự.`;
    }
    if (note.length > MAX_NOTE_LEN) {
      return `Ghi chú tối đa ${MAX_NOTE_LEN} ký tự.`;
    }
    return null;
  };

  const buildDateTimeISO = (dateStr, hhmm) => {
    const [hh, mm] = (hhmm || '').split(':');
    if (!dateStr || !hh || !mm) return null;
    const d = new Date(dateStr);
    d.setHours(Number(hh), Number(mm), 0, 0);
    return d.toISOString();
  };

  const uploadAttendanceImage = async (file, fieldName) => {
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.type)) {
      throw new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP).');
    }

    const formData = new FormData();
    formData.append('avatar', file);
    const response = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_AVATAR, formData);
    const url = response?.data?.url;

    if (!url) {
      throw new Error('Không nhận được đường dẫn ảnh từ server.');
    }

    setDetailForm((prev) => ({
      ...prev,
      [fieldName]: url,
    }));
  };

  const renderImagePreview = (imageValue, altText) => {
    if (!imageValue) return null;
    if (!/^https?:\/\//i.test(imageValue)) {
      return <p className="mt-1 text-xs text-gray-500">Đã chọn: {imageValue}</p>;
    }

    return (
      <a href={imageValue} target="_blank" rel="noreferrer" className="mt-2 inline-block">
        <img
          src={imageValue}
          alt={altText}
          className="h-20 w-20 rounded border border-gray-200 object-cover"
        />
      </a>
    );
  };

  const handleSaveDetail = async (e) => {
    e.preventDefault();
    const error = validateDetail();
    if (error) {
      setSubmitError(error);
      return;
    }
    setSubmitError(null);

    try {
      if (!detailStudentId) throw new Error('Không xác định học sinh.');

      // Kiểm tra OTP qua Firebase - bắt buộc phải gửi và xác minh thành công
      if (detailMode === 'checkin') {
        if (!detailForm.otpSent || !confirmationResult) {
          throw new Error('Vui lòng gửi mã OTP trước khi lưu.');
        }
        if (!detailForm.otpCode) {
          throw new Error('Vui lòng nhập mã OTP.');
        }
        try {
          await confirmationResult.confirm(detailForm.otpCode);
        } catch {
          throw new Error('Mã OTP không chính xác hoặc đã hết hạn.');
        }
      }

      const basePayload = {
        studentId: detailStudentId,
        classId,
        date: selectedDate,
        note: detailForm.note?.trim() || '',
      };

      if (detailMode === 'checkout') {
        const timeOutHHmm = detailForm.timeOut || nowHHmm();
        const isoOut = buildDateTimeISO(selectedDate, timeOutHHmm);

        // Trường hợp checkout với người đón đã đăng ký (không phải "Khác"):
        // -> giáo viên lưu luôn, trạng thái hoàn thành điểm danh.
        await post(ENDPOINTS.STUDENTS.ATTENDANCE_CHECKOUT, {
          ...basePayload,
          checkoutImageName: detailForm.checkoutImageName || '',
          receiverType: detailForm.receiverType || '',
          receiverOtherInfo: detailForm.receiverOtherInfo || '',
          receiverOtherImageName: detailForm.receiverOtherImageName || '',
          time: isoOut ? { checkOut: isoOut } : undefined,
          timeString: { checkOut: timeOutHHmm },
          status: 'present',
          isTakeOff: false,
        });

        updateRecord(detailStudentId, {
          ...(attendanceByStudent?.[detailStudentId] || defaultRecord()),
          status: 'checked_out',
          timeOut: timeOutHHmm,
          timeIn: detailForm.timeIn || '',
          note: basePayload.note,
          checkoutImageName: detailForm.checkoutImageName,
          receiverType: detailForm.receiverType,
          receiverOtherInfo: detailForm.receiverOtherInfo,
          receiverOtherImageName: detailForm.receiverOtherImageName,
        });

        const studentNameOut = students.find((s) => s._id === detailStudentId)?.fullName || 'Học sinh';
        showSuccessToast(`Check-out thành công cho ${studentNameOut}!`);
      } else if (detailMode === 'checkin') {
        const timeInHHmm = detailForm.timeIn || nowHHmm();
        const isoIn = buildDateTimeISO(selectedDate, timeInHHmm);

        await post(ENDPOINTS.STUDENTS.ATTENDANCE_CHECKIN, {
          ...basePayload,
          checkinImageName: detailForm.checkinImageName || '',
          delivererType: detailForm.delivererType || '',
          delivererOtherInfo: detailForm.delivererOtherInfo || '',
          delivererOtherImageName: detailForm.delivererOtherImageName || '',
          time: isoIn ? { checkIn: isoIn } : undefined,
          timeString: { checkIn: timeInHHmm },
          status: 'present',
          isTakeOff: false,
        });

        updateRecord(detailStudentId, {
          ...(attendanceByStudent?.[detailStudentId] || defaultRecord()),
          status: 'checked_in',
          timeIn: timeInHHmm,
          note: basePayload.note,
          delivererType: detailForm.delivererType,
          delivererOtherInfo: detailForm.delivererOtherInfo,
          delivererOtherImageName: detailForm.delivererOtherImageName,
          checkinImageName: detailForm.checkinImageName,
          hasBelongings: detailForm.hasBelongings,
          belongingsNote: detailForm.belongingsNote,
        });

        const studentName = students.find((s) => s._id === detailStudentId)?.fullName || 'Học sinh';
        showSuccessToast(`Điểm danh thành công cho ${studentName}!`);
      } else {
        // view mode: chỉ lưu local - lưu tất cả thông tin
        updateRecord(detailStudentId, {
          ...(attendanceByStudent?.[detailStudentId] || defaultRecord()),
          ...detailForm,
          note: basePayload.note,
        });
      }

      closeDetail();
    } catch (err) {
      setSubmitError(err.message || 'Lỗi khi lưu điểm danh');
    }
  };

  // Xử lý luồng "Gửi PH" khi người đón là \"Khác\":
  // - Không hoàn thành điểm danh ngay, chỉ lưu local trạng thái \"Chờ PH xác nhận\"
  const handleSendToParent = () => {
    if (!detailStudentId) {
      setSubmitError('Không xác định học sinh.');
      return;
    }

    // validate cơ bản cho trường hợp \"Khác\"
    if (!detailForm.receiverType) {
      setSubmitError('Vui lòng chọn người đón.');
      return;
    }
    if (detailForm.receiverType === 'Khác') {
      if (!detailForm.receiverOtherInfo?.trim()) {
        setSubmitError('Vui lòng nhập thông tin người đón (tên + SĐT).');
        return;
      }
      if (!detailForm.receiverOtherImageName) {
        setSubmitError('Vui lòng chọn ảnh người đón.');
        return;
      }
    }

    setSubmitError(null);

    // Lưu local trạng thái \"chờ PH xác nhận\"
    updateRecord(detailStudentId, {
      ...(attendanceByStudent?.[detailStudentId] || defaultRecord()),
      status: 'waiting_parent',
      timeIn: detailForm.timeIn || '',
      timeOut: detailForm.timeOut || '',
      note: detailForm.note?.trim() || '',
      checkoutImageName: detailForm.checkoutImageName,
      receiverType: detailForm.receiverType,
      receiverOtherInfo: detailForm.receiverOtherInfo,
      receiverOtherImageName: detailForm.receiverOtherImageName,
    });

    closeDetail();
  };

  const saveAbsentRecord = async () => {
    if (!absentStudentId) return;
    setAbsentError(null);

    // Không cho vắng mặt nếu học sinh đã có bản ghi điểm danh (checkin/checkout/vắng)
    const currentRec = attendanceByStudent?.[absentStudentId];
    if (currentRec && currentRec.status && currentRec.status !== 'empty') {
      setAbsentError('Học sinh đã có bản ghi điểm danh, không thể đánh vắng mặt.');
      setIsConfirmAbsentOpen(false);
      return;
    }

    try {
      // Lưu bản ghi vắng mặt lên server
      await post(ENDPOINTS.STUDENTS.ATTENDANCE_CHECKIN, {
        studentId: absentStudentId,
        classId,
        date: selectedDate,
        status: 'absent',
        note: absentForm.note?.trim() || '',
        absentReason: absentForm.reason,
        isTakeOff: false,
      });

      // Lưu local trạng thái "absent"
      updateRecord(absentStudentId, {
        ...(attendanceByStudent?.[absentStudentId] || defaultRecord()),
        status: 'absent',
        timeIn: '',
        timeOut: '',
        note: absentForm.note?.trim() || '',
        absentReason: absentForm.reason,
      });

      setIsConfirmAbsentOpen(false);
      setIsAbsentOpen(false);
      setAbsentStudentId(null);
      setAbsentForm({ reason: '', note: '' });
    } catch (err) {
      setAbsentError(err.message || 'Lỗi khi lưu thông tin vắng mặt');
    }
  };

  const handleSaveAbsent = async (e) => {
    e.preventDefault();
    if (!absentStudentId) {
      setAbsentError('Không xác định học sinh.');
      return;
    }

    // Chặn từ bước mở confirm: nếu đã checkin/checkout thì không cho vắng mặt nữa
    const currentRec = attendanceByStudent?.[absentStudentId];
    if (currentRec && currentRec.status && currentRec.status !== 'empty') {
      setAbsentError('Học sinh đã có bản ghi điểm danh , không thể đánh vắng mặt.');
      return;
    }

    if (!absentForm.reason) {
      setAbsentError('Vui lòng chọn lý do vắng mặt.');
      return;
    }
    if ((absentForm.note || '').trim().length > MAX_NOTE_LEN) {
      setAbsentError(`Ghi chú tối đa ${MAX_NOTE_LEN} ký tự.`);
      return;
    }

    setAbsentError(null);
    setIsConfirmAbsentOpen(true);
  };

  const closeAbsent = () => {
    setIsAbsentOpen(false);
    setIsConfirmAbsentOpen(false);
    setAbsentError(null);
  };

  // Trạng thái form checkout + điều kiện enable/disable nút theo spec
  const isCheckoutMode = detailMode === 'checkout';
  const isReceiverOther = detailForm.receiverType === 'Khác';
  const canSaveCheckout =
    isCheckoutMode &&
    !!detailForm.receiverType &&
    !!detailForm.checkoutImageName &&
    !isReceiverOther; // chỉ cho Lưu khi không phải "Khác"
  const canSendToParent =
    isCheckoutMode &&
    isReceiverOther &&
    !!detailForm.checkoutImageName &&
    !!detailForm.receiverOtherInfo?.trim() &&
    !!detailForm.receiverOtherImageName;

  const canSubmitCheckin = detailMode === 'checkin' ? !!detailForm.checkinImageName : true;

  const detailStudent = students.find((s) => s._id === detailStudentId) || null;
  const selectedClass = classes.find((c) => (c._id || c.id) === classId) || null;
  const selectedClassName =
    selectedClass?.className ||
    selectedClass?.name ||
    (selectedClass?.gradeId?.gradeName ? `${selectedClass.gradeId.gradeName} - ${selectedClass?._id || ''}` : '') ||
    '';

  return (
    <RoleLayout
      title="Điểm danh"
      description={classId ? 'Danh sách điểm danh theo lớp.' : 'Chọn lớp để bắt đầu điểm danh.'}
      menuItems={menuItems}
      activeKey={activeKey}
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {!classId ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Chọn lớp để điểm danh</h3>
              <p className="text-xs text-gray-500 mt-1">Chỉ hiển thị các lớp bạn phụ trách.</p>
            </div>
          </div>

          {classesError && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
              {classesError}
            </div>
          )}

          {loadingClasses ? (
            <p className="text-sm text-gray-500">Đang tải danh sách lớp...</p>
          ) : classes.length === 0 ? (
            <div className="p-6 border border-dashed border-gray-200 rounded-lg text-center">
              <p className="text-sm text-gray-600">Bạn chưa được phân công lớp nào.</p>
              <p className="text-xs text-gray-500 mt-1">Vui lòng liên hệ admin để phân công lớp cho giáo viên.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {classes.map((c) => (
                <button
                  key={c._id || c.id}
                  type="button"
                  onClick={() => navigate(`/teacher/attendance/${c._id || c.id}`)}
                  className="text-left p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{c.className}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {c.gradeId?.gradeName ? `Khối: ${c.gradeId.gradeName}` : '—'}
                        {c.academicYearId?.yearName ? ` · Năm: ${c.academicYearId.yearName}` : ''}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full">
                      Vào điểm danh →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Danh sách điểm danh – theo lớp</h3>
              <p className="text-xs text-gray-500 mt-1">
                {selectedClassName ? (
                  <>
                    Lớp: <span className="font-semibold text-gray-700">{selectedClassName}</span>
                  </>
                ) : (
                  <>Lớp ID: <span className="font-semibold text-gray-700">{classId}</span></>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/teacher/attendance')}
                className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-200 transition-colors"
              >
                ← Chọn lớp khác
              </button>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-700">Ngày</label>
                <input
                  type="date"
                  value={selectedDate}
                  max={todayISO}
                  onChange={(e) => handleSelectedDateChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {studentsError && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
              {studentsError}
            </div>
          )}

          {loadingStudents ? (
            <p className="text-sm text-gray-500">Đang tải danh sách học sinh...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800 w-[70px]">STT</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">Họ tên</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">Giờ đến</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">Giờ về</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">Ghi chú</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-800 min-w-[220px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {(students || []).map((s, idx) => {
                    const rec = attendanceByStudent?.[s._id] || defaultRecord();
                    const badge = getStatusBadge(rec.status);
                    // Cho phép check-in lại nếu trước đó đã đánh vắng mặt
                    const canCheckIn = rec.status === 'empty' || rec.status === 'absent';
                    const canCheckOut =
                      rec.status === 'checked_in' ||
                      rec.status === 'waiting_parent' ||
                      rec.status === 'parent_confirmed';
                    return (
                      <tr key={s._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{s.fullName || '—'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${badge.cls}`}>
                            {badge.text}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{rec.timeIn || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{rec.timeOut || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="max-w-xs truncate" title={rec.note || ''}>
                            {rec.note || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {canCheckIn && (
                              <button
                                type="button"
                                onClick={() => openDetail(s._id, 'checkin')}
                                className="px-3 py-2 text-xs font-semibold rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                              >
                                Check in
                              </button>
                            )}
                            {canCheckOut && (
                              <button
                                type="button"
                                onClick={() => openDetail(s._id, 'checkout')}
                                className="px-3 py-2 text-xs font-semibold rounded-md bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                              >
                                Check-out
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openDetail(s._id)}
                              className="px-3 py-2 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                            >
                              Xem chi tiết
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAbsentStudentId(s._id);
                                setAbsentForm({
                                  reason: '',
                                  note: '',
                                });
                                setAbsentError(null);
                                setIsAbsentOpen(true);
                              }}
                              className="px-3 py-2 text-xs font-semibold rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                              Vắng mặt
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {(students || []).length === 0 && (
                <div className="p-6 border border-dashed border-gray-200 rounded-lg text-center mt-4">
                  <p className="text-sm text-gray-600">Lớp chưa có học sinh.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Chi tiết điểm danh (lưu localStorage theo ngày + lớp) */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className={`bg-white rounded-xl shadow-2xl mx-4 ${detailMode === 'view' ? 'w-full max-w-4xl max-h-[90vh] overflow-y-auto' : 'w-full max-w-2xl'}`}>
            {detailMode === 'view' ? (
              <>
                <div className="border-b px-6 py-4 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Màn hình Chi tiết điểm danh</h2>
                  <p className="text-sm text-gray-600">Cho phép View và Edit trong màn này</p>
                </div>

                <form onSubmit={handleSaveDetail} className="p-6">
              {(submitError || studentsError) && (
                <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
                  {submitError || studentsError}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📄</span>
                  Chi tiết & chỉnh sửa điểm danh
                </h3>

                {detailForm.status === 'absent' && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm font-semibold text-red-700 mb-1">Trạng thái: Vắng mặt</p>
                    <p className="text-xs text-red-700">
                      Lý do:{' '}
                      <span className="font-medium">
                        {attendanceByStudent?.[detailStudentId]?.absentReason || 'Không rõ'}
                      </span>
                    </p>
                    {attendanceByStudent?.[detailStudentId]?.note && (
                      <p className="mt-1 text-xs text-gray-700">
                        Ghi chú: {attendanceByStudent[detailStudentId].note}
                      </p>
                    )}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Học sinh</label>
                  <input
                    type="text"
                    value={detailStudent?.fullName || ''}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                  />
                </div>

                {/* Check-in Section */}
                <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-green-50/30">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-semibold">
                      ✓
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">Check-in</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Giờ đến</label>
                      <div className="relative">
                        <input
                          type="time"
                          value={detailForm.timeIn}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed focus:outline-none pl-10"
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">🕐</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Giờ đến được hệ thống lưu lại theo lúc check-in, không chỉnh sửa tại đây.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Người đưa</label>
                      <select
                        value={detailForm.delivererType}
                        onChange={(e) =>
                          setDetailForm((prev) => ({
                            ...prev,
                            delivererType: e.target.value,
                            delivererOtherInfo: e.target.value === 'Khác' ? prev.delivererOtherInfo : '',
                            delivererOtherImageName: e.target.value === 'Khác' ? prev.delivererOtherImageName : '',
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">--Chọn--</option>
                        {DELIVERER_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {detailForm.delivererType === 'Khác' && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Thông tin người đưa (nếu khác)
                          </label>
                          <input
                            type="text"
                            value={detailForm.delivererOtherInfo}
                            onChange={(e) =>
                              setDetailForm((prev) => ({
                                ...prev,
                                delivererOtherInfo: sanitizeSingleLineText(e.target.value, MAX_PERSON_INFO_LEN),
                              }))
                            }
                            placeholder="Tên + SĐT"
                            maxLength={MAX_PERSON_INFO_LEN}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh người đưa</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              try {
                                setSubmitError(null);
                                const file = e.target.files?.[0];
                                await uploadAttendanceImage(file, 'delivererOtherImageName');
                              } catch (err) {
                                setSubmitError(err.message || 'Không tải lên được ảnh người đưa.');
                              } finally {
                                e.target.value = '';
                              }
                            }}
                            className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                          />
                          {renderImagePreview(detailForm.delivererOtherImageName, 'Ảnh người đưa')}
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh check-in</label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">🖼️</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            try {
                              setSubmitError(null);
                              const file = e.target.files?.[0];
                              await uploadAttendanceImage(file, 'checkinImageName');
                            } catch (err) {
                              setSubmitError(err.message || 'Không tải lên được ảnh check-in.');
                            } finally {
                              e.target.value = '';
                            }
                          }}
                          className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                        />
                      </div>
                      {renderImagePreview(detailForm.checkinImageName, 'Ảnh check-in')}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Đồ mang theo</label>
                      <input
                        type="text"
                        value={detailForm.belongingsNote}
                        onChange={(e) =>
                          setDetailForm((prev) => ({
                            ...prev,
                            belongingsNote: sanitizeSingleLineText(e.target.value, MAX_BELONGINGS_NOTE_LEN),
                          }))
                        }
                        placeholder="Bình nước, balo..."
                        maxLength={MAX_BELONGINGS_NOTE_LEN}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú</label>
                      <textarea
                        rows={3}
                        value={detailForm.note}
                        onChange={(e) =>
                          setDetailForm((prev) => ({
                            ...prev,
                            note: sanitizeMultiLineText(e.target.value, MAX_NOTE_LEN),
                          }))
                        }
                        placeholder="Trẻ hơi mệt..."
                        maxLength={MAX_NOTE_LEN}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Check-out Section */}
                <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-blue-50/30">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                      ✓
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">Check-out</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Giờ về</label>
                      <div className="relative">
                        <input
                          type="time"
                          value={detailForm.timeOut}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed focus:outline-none pl-10"
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">🕐</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Giờ về được hệ thống lưu lại theo lúc check-out, không chỉnh sửa tại đây.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Người đón</label>
                      <select
                        value={detailForm.receiverType}
                        onChange={(e) =>
                          setDetailForm((prev) => ({
                            ...prev,
                            receiverType: e.target.value,
                            receiverOtherInfo: e.target.value === 'Khác' ? prev.receiverOtherInfo : '',
                            receiverOtherImageName: e.target.value === 'Khác' ? prev.receiverOtherImageName : '',
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">--Chọn--</option>
                        {DELIVERER_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {detailForm.receiverType === 'Khác' && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Thông tin người đón (nếu khác)
                          </label>
                          <input
                            type="text"
                            value={detailForm.receiverOtherInfo}
                            onChange={(e) =>
                              setDetailForm((prev) => ({
                                ...prev,
                                receiverOtherInfo: sanitizeSingleLineText(e.target.value, MAX_PERSON_INFO_LEN),
                              }))
                            }
                            placeholder="Tên + SĐT"
                            maxLength={MAX_PERSON_INFO_LEN}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh người đón</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              try {
                                setSubmitError(null);
                                const file = e.target.files?.[0];
                                await uploadAttendanceImage(file, 'receiverOtherImageName');
                              } catch (err) {
                                setSubmitError(err.message || 'Không tải lên được ảnh người đón.');
                              } finally {
                                e.target.value = '';
                              }
                            }}
                            className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                          />
                          {renderImagePreview(detailForm.receiverOtherImageName, 'Ảnh người đón')}
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh check-out</label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">🖼️</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            try {
                              setSubmitError(null);
                              const file = e.target.files?.[0];
                              await uploadAttendanceImage(file, 'checkoutImageName');
                            } catch (err) {
                              setSubmitError(err.message || 'Không tải lên được ảnh check-out.');
                            } finally {
                              e.target.value = '';
                            }
                          }}
                          className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                        />
                      </div>
                      {renderImagePreview(detailForm.checkoutImageName, 'Ảnh check-out')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeDetail}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                {isCheckoutMode && (
                  <button
                    type="button"
                    onClick={handleSendToParent}
                    disabled={!canSendToParent}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                      canSendToParent
                        ? 'text-white bg-sky-600 hover:bg-sky-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    Gửi PH
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <span>💾</span>
                  Lưu chỉnh sửa
                </button>
              </div>
            </form>
              </>
            ) : (
              <>
                <div className="border-b px-5 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {detailMode === 'checkin'
                        ? 'Check-in'
                        : detailMode === 'checkout'
                        ? 'Check-out'
                        : 'Chi tiết điểm danh'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {detailStudent?.fullName ? (
                        <>
                          Học sinh: <span className="font-semibold text-gray-700">{detailStudent.fullName}</span>
                        </>
                      ) : (
                        <>Học sinh ID: <span className="font-semibold text-gray-700">{detailStudentId}</span></>
                      )}
                      {' · '}
                      Ngày: <span className="font-semibold text-gray-700">{selectedDate}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeDetail}
                    className="text-gray-500 hover:text-gray-900"
                    aria-label="Đóng"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveDetail} className="p-5">
                  {(submitError || studentsError) && (
                    <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
                      {submitError || studentsError}
                    </div>
                  )}

                  {isCheckoutMode ? (
                    // Checkout form - chỉ hiển thị các trường cần thiết
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Giờ về</label>
                        <div className="relative">
                          <input
                            type="time"
                            value={detailForm.timeOut}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed focus:outline-none pr-10"
                          />
                          <span className="absolute right-3 top-2.5 text-gray-400">🕐</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Giờ về được tự động lấy theo thời điểm check-out, không thể chỉnh sửa ở đây.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh đón trẻ</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            try {
                              setSubmitError(null);
                              const file = e.target.files?.[0];
                              await uploadAttendanceImage(file, 'checkoutImageName');
                            } catch (err) {
                              setSubmitError(err.message || 'Không tải lên được ảnh check-out.');
                            } finally {
                              e.target.value = '';
                            }
                          }}
                          className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                        />
                        {detailForm.checkoutImageName && (
                          renderImagePreview(detailForm.checkoutImageName, 'Ảnh check-out')
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Người đón</label>
                        <select
                          value={detailForm.receiverType}
                          onChange={(e) =>
                            setDetailForm((prev) => ({
                              ...prev,
                              receiverType: e.target.value,
                              receiverOtherInfo: e.target.value === 'Khác' ? prev.receiverOtherInfo : '',
                              receiverOtherImageName: e.target.value === 'Khác' ? prev.receiverOtherImageName : '',
                            }))
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">--Chọn--</option>
                          {DELIVERER_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      {detailForm.receiverType === 'Khác' && (
                        <>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Thông tin người đón</label>
                            <input
                              type="text"
                              value={detailForm.receiverOtherInfo}
                              onChange={(e) =>
                                setDetailForm((prev) => ({
                                  ...prev,
                                  receiverOtherInfo: sanitizeSingleLineText(e.target.value, MAX_PERSON_INFO_LEN),
                                }))
                              }
                              placeholder="Tên + SĐT"
                              maxLength={MAX_PERSON_INFO_LEN}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh người đón</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                try {
                                  setSubmitError(null);
                                  const file = e.target.files?.[0];
                                  await uploadAttendanceImage(file, 'receiverOtherImageName');
                                } catch (err) {
                                  setSubmitError(err.message || 'Không tải lên được ảnh người đón.');
                                } finally {
                                  e.target.value = '';
                                }
                              }}
                              className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                            />
                            {detailForm.receiverOtherImageName && (
                              renderImagePreview(detailForm.receiverOtherImageName, 'Ảnh người đón')
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    // Checkin form - hiển thị đầy đủ các trường
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Giờ đến</label>
                        <input
                          type="time"
                          value={detailForm.timeIn}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed focus:outline-none"
                        />
                        <p className="mt-1 text-[11px] text-gray-500">
                          Giờ đến được tự động lấy theo thời điểm check-in, không thể chỉnh sửa ở đây.
                        </p>
                      </div>

                      <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Ảnh điểm danh / người đưa</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Ảnh điểm danh (Check-in)</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                try {
                                  setSubmitError(null);
                                  const file = e.target.files?.[0];
                                  await uploadAttendanceImage(file, 'checkinImageName');
                                } catch (err) {
                                  setSubmitError(err.message || 'Không tải lên được ảnh check-in.');
                                } finally {
                                  e.target.value = '';
                                }
                              }}
                              className="block w-full text-xs text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-xs file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                            />
                            {detailForm.checkinImageName && (
                              renderImagePreview(detailForm.checkinImageName, 'Ảnh check-in')
                            )}
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Người đưa *</label>
                            <select
                              value={detailForm.delivererType}
                              onChange={(e) =>
                                setDetailForm((prev) => ({
                                  ...prev,
                                  delivererType: e.target.value,
                                  delivererOtherInfo: e.target.value === 'Khác' ? prev.delivererOtherInfo : '',
                                  delivererOtherImageName: e.target.value === 'Khác' ? prev.delivererOtherImageName : '',
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">--Chọn--</option>
                              {DELIVERER_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {detailForm.delivererType === 'Khác' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Tên + SĐT người đưa</label>
                              <input
                                type="text"
                                value={detailForm.delivererOtherInfo}
                                onChange={(e) =>
                                  setDetailForm((prev) => ({
                                    ...prev,
                                    delivererOtherInfo: sanitizeSingleLineText(e.target.value, MAX_PERSON_INFO_LEN),
                                  }))
                                }
                                placeholder="VD: Nguyễn A - 09xx..."
                                maxLength={MAX_PERSON_INFO_LEN}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Ảnh người đưa</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  try {
                                    setSubmitError(null);
                                    const file = e.target.files?.[0];
                                    await uploadAttendanceImage(file, 'delivererOtherImageName');
                                  } catch (err) {
                                    setSubmitError(err.message || 'Không tải lên được ảnh người đưa.');
                                  } finally {
                                    e.target.value = '';
                                  }
                                }}
                                className="block w-full text-xs text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-xs file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                              />
                              {detailForm.delivererOtherImageName && (
                                renderImagePreview(detailForm.delivererOtherImageName, 'Ảnh người đưa')
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                          <input
                            type="checkbox"
                            checked={detailForm.hasBelongings}
                            onChange={(e) =>
                              setDetailForm((prev) => ({
                                ...prev,
                                hasBelongings: e.target.checked,
                                belongingsNote: e.target.checked ? prev.belongingsNote : '',
                              }))
                            }
                          />
                          Có đồ mang theo
                        </label>
                        {detailForm.hasBelongings && (
                          <textarea
                            rows={2}
                            value={detailForm.belongingsNote}
                            onChange={(e) =>
                              setDetailForm((prev) => ({
                                ...prev,
                                belongingsNote: sanitizeMultiLineText(e.target.value, MAX_BELONGINGS_NOTE_LEN),
                              }))
                            }
                            placeholder="Ghi chú đồ dùng (VD: mang theo balo, thú bông...)"
                            maxLength={MAX_BELONGINGS_NOTE_LEN}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                          />
                        )}
                      </div>

                      {/* Phần Gửi mã OTP cho phụ huynh */}
                      <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                        <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <span>📱</span>
                          Phương thức gửi OTP
                        </p>
                        
                        <div className="space-y-3 mb-4">
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={detailForm.sendOtpSchoolAccount || false}
                              onChange={(e) =>
                                setDetailForm((prev) => ({
                                  ...prev,
                                  sendOtpSchoolAccount: e.target.checked,
                                }))
                              }
                            />
                            Tài khoản trường cấp
                          </label>
                          
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={detailForm.sendOtpViaSms || false}
                              onChange={(e) =>
                                setDetailForm((prev) => ({
                                  ...prev,
                                  sendOtpViaSms: e.target.checked,
                                }))
                              }
                            />
                            Gửi qua SMS
                          </label>
                        </div>

                        {(detailForm.sendOtpSchoolAccount || detailForm.sendOtpViaSms) && (
                          <>
                            <div className="mb-3">
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Chọn phụ huynh nhận SMS</label>
                              <select
                                value={detailForm.selectedParentForOtp || ''}
                                onChange={(e) =>
                                  setDetailForm((prev) => ({
                                    ...prev,
                                    selectedParentForOtp: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="">--Chọn--</option>
                                {detailStudent?.parentId?.phone && (
                                  <option value={detailStudent.parentId.phone}>
                                    {detailStudent.parentId.fullName || 'Phụ huynh'} - {detailStudent.parentId.phone}
                                  </option>
                                )}
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={async () => {
                                if (!detailForm.selectedParentForOtp) {
                                  setSubmitError('Vui lòng chọn phụ huynh nhận SMS.');
                                  return;
                                }
                                setSubmitError(null);
                                try {
                                  const phoneE164 = formatPhoneForFirebase(detailForm.selectedParentForOtp);
                                  const result = await signInWithPhoneNumber(auth, phoneE164, recaptchaVerifierRef.current);
                                  setConfirmationResult(result);
                                  setDetailForm((prev) => ({
                                    ...prev,
                                    otpSent: true,
                                    otpCode: '',
                                  }));
                                } catch (err) {
                                  setSubmitError(err.message || 'Lỗi khi gửi OTP qua Firebase');
                                }
                              }}
                              className="w-full px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors mb-3"
                            >
                              Gửi mã OTP
                            </button>

                            {detailForm.otpSent && (
                              <div className={`rounded-md p-3 ${otpExpired ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="block text-xs font-semibold text-gray-700">Nhập mã OTP</label>
                                  <span className={`text-xs font-semibold ${otpExpired ? 'text-red-600' : 'text-blue-600'}`}>
                                    {otpExpired ? '❌ Hết hạn' : `⏱️ ${Math.floor(otpTimeLeft / 60)}:${String(otpTimeLeft % 60).padStart(2, '0')}`}
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  value={detailForm.otpCode || ''}
                                  onChange={(e) =>
                                    setDetailForm((prev) => ({
                                      ...prev,
                                      otpCode: e.target.value.slice(0, 6),
                                    }))
                                  }
                                  placeholder="Mã 6 số"
                                  maxLength={6}
                                  disabled={otpExpired}
                                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none ${
                                    otpExpired
                                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500'
                                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                                  }`}
                                />
                                {otpExpired && (
                                  <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded text-xs text-red-700">
                                    <p className="font-semibold mb-2">⚠️ Mã OTP đã hết hạn</p>
                                    {detailStudent?.parentId?.phone && (
                                      <p className="text-red-600 font-semibold mb-2">
                                        📱 {detailStudent.parentId.fullName || 'Phụ huynh'}: {detailStudent.parentId.phone}
                                      </p>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => resetOtpState()}
                                      className="w-full mt-2 px-3 py-2 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                                    >
                                      Gửi lại mã OTP
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Note chung</label>
                        <textarea
                          rows={3}
                          value={detailForm.note}
                          onChange={(e) =>
                            setDetailForm((prev) => ({
                              ...prev,
                              note: sanitizeMultiLineText(e.target.value, MAX_NOTE_LEN),
                            }))
                          }
                          placeholder="Ví dụ: Bé đến muộn 10 phút..."
                          maxLength={MAX_NOTE_LEN}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeDetail}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Hủy
                    </button>
                    {isCheckoutMode ? (
                      <>
                        <button
                          type="submit"
                          disabled={!canSaveCheckout}
                          className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                            canSaveCheckout
                              ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                              : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                          }`}
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={handleSendToParent}
                          disabled={!canSendToParent}
                          className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                            canSendToParent
                              ? 'text-white bg-sky-600 hover:bg-sky-700'
                              : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                          }`}
                        >
                          Gửi PH
                        </button>
                      </>
                    ) : (
                      <button
                        type="submit"
                        disabled={!canSubmitCheckin}
                        title={canSubmitCheckin ? 'Lưu check-in' : 'Vui lòng chọn ảnh check-in'}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                          canSubmitCheckin
                            ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                            : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                        }`}
                      >
                        Lưu
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal: Học sinh vắng mặt */}
      {isAbsentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="border-b px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Học sinh vắng mặt</h3>
              <button
                type="button"
                onClick={closeAbsent}
                className="text-red-600 hover:text-red-800"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAbsent} className="p-5">
              {absentError && (
                <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
                  {absentError}
                </div>
              )}

              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-3">
                  Học sinh:{' '}
                  <span className="font-semibold text-gray-900">
                    {students.find((s) => s._id === absentStudentId)?.fullName || absentStudentId}
                  </span>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-2">Lý do</label>
                <select
                  value={absentForm.reason}
                  onChange={(e) => setAbsentForm((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">--Chọn--</option>
                  {ABSENT_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-2">Ghi chú</label>
                <textarea
                  rows={4}
                  value={absentForm.note}
                  onChange={(e) =>
                    setAbsentForm((prev) => ({
                      ...prev,
                      note: sanitizeMultiLineText(e.target.value, MAX_NOTE_LEN),
                    }))
                  }
                  placeholder="Nhập ghi chú nếu có"
                  maxLength={MAX_NOTE_LEN}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={closeAbsent}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={isConfirmAbsentOpen}
        title="Xác nhận lưu vắng mặt"
        message={`Bạn có chắc muốn lưu vắng mặt cho học sinh "${
          students.find((s) => s._id === absentStudentId)?.fullName || absentStudentId || ''
        }" vào ngày ${selectedDate}?`}
        confirmText="Lưu"
        cancelText="Hủy"
        onConfirm={saveAbsentRecord}
        onCancel={() => setIsConfirmAbsentOpen(false)}
      />
      {/* Firebase invisible reCAPTCHA container */}
      <div id="recaptcha-container" />

      {/* Toast thông báo thành công */}
      {successToast.visible && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-4 bg-green-600 text-white px-8 py-5 rounded-2xl shadow-2xl text-base font-bold">
          <span className="text-2xl">✅</span>
          <span>{successToast.message}</span>
        </div>
      )}
    </RoleLayout>
  );
}

export default TeacherAttendance;
