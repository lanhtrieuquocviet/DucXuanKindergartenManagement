import { useCallback, useEffect, useMemo, useRef, useState, Component } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Snackbar, Alert, Box, Typography, Avatar, Paper, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { EventBusy as EventBusyIcon, ViewList as DayViewIcon, CalendarViewWeek as WeekViewIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, post, ENDPOINTS } from '../../service/api';
import FaceAttendanceModal from '../../components/face/FaceAttendanceModal';
import PickupFaceAttendanceModal from '../../components/face/PickupFaceAttendanceModal';
import FaceRegisterClassModal from '../../components/face/FaceRegisterClassModal';

class FaceModalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('FaceAttendanceModal error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, maxWidth: 400, textAlign: 'center' }}>
            <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: 8 }}>Không thể mở điểm danh khuôn mặt</p>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>{this.state.error?.message || 'Lỗi không xác định. Kiểm tra console để biết chi tiết.'}</p>
            <Button variant="contained" onClick={() => { this.setState({ hasError: false, error: null }); this.props.onClose?.(); }}>
              Đóng
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import {
  getLocalISODate,
  isValidHHmm,
  nowHHmm,
  readAttendanceStorage,
  writeAttendanceStorage,
  defaultRecord,
  parsePersonOtherInfo,
  buildPersonOtherInfo,
  buildDateTimeISO,
  PHONE_REGEX,
  MAX_PERSON_NAME_LEN,
  MAX_BELONGINGS_NOTE_LEN,
  MAX_NOTE_LEN,
} from './attendance/attendanceUtils';
import AttendanceTable from './attendance/AttendanceTable';
import AttendanceDetailModal from './attendance/AttendanceDetailModal';
import AbsentModal from './attendance/AbsentModal';
import WeeklyAttendanceView from './attendance/WeeklyAttendanceView';

const isWeekendDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day === 0 || day === 6;
};
const isLateByTime = (value) => {
  if (!value) return false;
  try {
    let h; let m;
    if (typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)) {
      [h, m] = value.split(':').map(Number);
    } else {
      const d = new Date(value);
      if (isNaN(d.getTime())) return false;
      h = d.getHours();
      m = d.getMinutes();
    }
    return h > 8 || (h === 8 && m > 0);
  } catch {
    return false;
  }
};

function TeacherAttendance() {
  const navigate = useNavigate();
  const location = useLocation();
  const { classId } = useParams();
  const { user, logout, isInitializing, hasPermission, hasRole } = useAuth();
  const todayISO = getLocalISODate();

  // ── State: chế độ xem ──
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week'

  // ── State: lớp & học sinh ──
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // ── State: bản ghi điểm danh ──
  const [selectedDate, setSelectedDate] = useState(getLocalISODate);
  const [attendanceByStudent, setAttendanceByStudent] = useState({});

  // ── State: modal chi tiết ──
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailStudentId, setDetailStudentId] = useState(null);
  const [detailMode, setDetailMode] = useState('view'); // 'view' | 'checkin' | 'checkout'
  const [detailOpenedDate, setDetailOpenedDate] = useState(null);
  const [detailForm, setDetailForm] = useState(() => ({
    status: 'empty',
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
  }));

  // ── State: draft form per student (key = `${studentId}__${mode}__${date}`) ──
  const [draftForms, setDraftForms] = useState({});

  // ── State: modal vắng mặt ──
  const [isAbsentOpen, setIsAbsentOpen] = useState(false);
  const [absentStudentId, setAbsentStudentId] = useState(null);
  const [absentForm, setAbsentForm] = useState({ reason: '', note: '' });
  const [absentError, setAbsentError] = useState(null);
  const [isConfirmAbsentOpen, setIsConfirmAbsentOpen] = useState(false);

  // ── State: danh sách người đưa/đón đã duyệt ──
  const [approvedPickupPersons, setApprovedPickupPersons] = useState([]);

  // ── State: modal điểm danh khuôn mặt ──
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [isPickupFaceModalOpen, setIsPickupFaceModalOpen] = useState(false);
  const [isFaceRegisterClassOpen, setIsFaceRegisterClassOpen] = useState(false);

  // ── State: Toast thành công ──
  const [successToast, setSuccessToast] = useState({ visible: false, message: '' });
  const [warningToast] = useState({ visible: false, message: '' });

  const showSuccessToast = (message) => {
    setSuccessToast({ visible: true, message });
    setTimeout(() => setSuccessToast({ visible: false, message: '' }), 3000);
  };


  // ── Effects ──

  // Guard: redirect nếu chưa đăng nhập hoặc không có role Teacher
  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('Teacher') && !userRoles.includes('HeadTeacher')) {
      navigate('/', { replace: true });
    }
  }, [navigate, user, isInitializing]);

  // Load danh sách lớp khi user sẵn sàng
  useEffect(() => {
    if (isInitializing) return;
    if (!user?._id) return;
    fetchMyClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitializing, user?._id]);

  // Reset khi đổi classId
  useEffect(() => {
    setStudents([]);
    setStudentsError(null);
    setAttendanceByStudent({});
    setSubmitError(null);
    setIsDetailOpen(false);
    setDetailStudentId(null);
    setDraftForms({});
    if (!classId) return;
    fetchStudentsByClass(classId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // Fetch danh sách người đưa/đón đã duyệt khi mở modal checkin/checkout
  useEffect(() => {
    if (!detailStudentId || (detailMode !== 'checkin' && detailMode !== 'checkout')) {
      setApprovedPickupPersons([]);
      return;
    }
    get(ENDPOINTS.PICKUP.APPROVED_BY_STUDENT(detailStudentId))
      .then((res) => setApprovedPickupPersons(res.data || []))
      .catch(() => setApprovedPickupPersons([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailStudentId, detailMode]);

  // Chuyển đổi bản ghi điểm danh từ server sang định dạng frontend
  const mapServerRecord = (serverRec, localRec) => {
    const base = localRec || defaultRecord();
    let status;
    if (serverRec.status === 'absent') {
      status = 'absent';
    } else if (serverRec.status === 'present') {
      const isLate = serverRec.arrivalStatus === 'late'
        || (serverRec.arrivalStatus !== 'on_time' && isLateByTime(serverRec.timeString?.checkIn || serverRec.time?.checkIn));
      if (serverRec.timeString?.checkOut) {
        status = isLate ? 'late_checked_out' : 'checked_out';
      } else {
        status = isLate ? 'late_checked_in' : 'checked_in';
      }
    } else if (serverRec.status === 'leave') {
      status = 'absent';
    } else {
      status = 'checked_in';
    }
    return {
      ...base,
      status,
      timeIn: serverRec.timeString?.checkIn || '',
      timeOut: serverRec.timeString?.checkOut || '',
      checkinImageName: serverRec.checkinImageName || '',
      checkoutImageName: serverRec.checkoutImageName || '',
      delivererType: serverRec.delivererType || '',
      delivererOtherInfo: serverRec.delivererOtherInfo || '',
      delivererOtherImageName: serverRec.delivererOtherImageName || '',
      receiverType: serverRec.receiverType || '',
      receiverOtherInfo: serverRec.receiverOtherInfo || '',
      receiverOtherImageName: serverRec.receiverOtherImageName || '',
      belongingsNote: serverRec.checkinBelongings?.length > 0
        ? serverRec.checkinBelongings.join(', ')
        : (base.belongingsNote || ''),
      hasBelongings: !!(serverRec.checkinBelongings?.length || base.hasBelongings),
      checkoutBelongingsNote: serverRec.checkoutBelongings?.length > 0
        ? serverRec.checkoutBelongings.join(', ')
        : (serverRec.checkoutBelongingsNote || ''),
      hasCheckoutBelongings: !!(serverRec.checkoutBelongings?.length || serverRec.checkoutBelongingsNote),
      note: serverRec.note || '',
      absentReason: serverRec.absentReason || '',
      arrivalStatus: serverRec.arrivalStatus || '',
      checkedInByAI: serverRec.checkedInByAI || false,
      checkedOutByAI: serverRec.checkedOutByAI || false,
    };
  };

  // Load attendance: ưu tiên server, fallback localStorage khi mất mạng
  const loadAttendance = useCallback(async () => {
    if (!classId) return;
    try {
      const res = await get(
        `${ENDPOINTS.STUDENTS.ATTENDANCE_LIST}?classId=${classId}&date=${selectedDate}`
      );
      const serverRecords = res.data || [];
      const allLocal = readAttendanceStorage(classId);
      const localByDate = allLocal?.[selectedDate] || {};
      const merged = { ...localByDate };
      serverRecords.forEach((rec) => {
        const sid = rec.studentId?._id?.toString() || rec.studentId?.toString();
        if (sid) merged[sid] = mapServerRecord(rec, localByDate[sid]);
      });
      allLocal[selectedDate] = merged;
      writeAttendanceStorage(classId, allLocal);
      setAttendanceByStudent(merged);
    } catch {
      // Mất mạng hoặc lỗi server → dùng localStorage
      const all = readAttendanceStorage(classId);
      setAttendanceByStudent(all?.[selectedDate] || {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, selectedDate]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Khởi tạo bản ghi mặc định cho học sinh chưa có
  useEffect(() => {
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


  // ── Menu layout ──
  const menuItems = useMemo(
    () => [
      { key: 'classes', label: 'Lớp phụ trách' },
      { key: 'students', label: 'Danh sách học sinh' },
      { key: 'attendance', label: 'Điểm danh' },
      { key: 'pickup-approval', label: 'Đơn đăng ký đưa đón' },
      { key: 'leave-requests', label: 'Danh sách đơn xin nghỉ' },
      { key: 'contact-book', label: 'Sổ liên lạc' },
      { key: 'asset-incidents-teacher', label: 'Báo cáo sự cố CSVC' },
      { key: 'class-assets', label: 'Tài sản lớp' },
      ...(hasRole('InventoryStaff') ? [{ key: 'asset-inspection', label: 'Kiểm kê tài sản' }] : []),
    ],
    [hasPermission, hasRole]
  );

  const activeKey = useMemo(() => {
    const path = location.pathname || '';
    if (path.startsWith('/teacher/contact-book'))    return 'contact-book';
    if (path.startsWith('/teacher/attendance'))      return 'attendance';
    if (path.startsWith('/teacher/pickup-approval')) return 'pickup-approval';
    if (path.startsWith('/teacher/asset-incidents')) return 'asset-incidents-teacher';
    if (path.startsWith('/teacher/class-assets'))    return 'class-assets';
    if (path.startsWith('/teacher/asset-inspection')) return 'asset-inspection';
    return 'classes';
  }, [location.pathname]);

  const userName = user?.fullName || user?.username || 'Teacher';

  const handleMenuSelect = (key) => {
    const MAP = {
      classes: '/teacher',
      students: '/teacher/students',
      'contact-book': '/teacher/contact-book',
      attendance: '/teacher/attendance',
      'pickup-approval': '/teacher/pickup-approval',
      'leave-requests': '/teacher/leave-requests',
      'asset-incidents-teacher': '/teacher/asset-incidents',
      'class-assets': '/teacher/class-assets',
      'asset-inspection': '/teacher/asset-inspection',
    };
    if (MAP[key]) navigate(MAP[key]);
  };

  // ── API calls ──
  const fetchMyClasses = async () => {
    try {
      const res = await get(ENDPOINTS.CLASSES.LIST);
      const all = res.data || [];
      const myUserId = user?._id;
      const mine = all.filter((c) => (c.teacherIds || []).some((t) => {
        const uid = t?.userId?._id || t?.userId || t?._id || t;
        return uid?.toString() === myUserId?.toString();
      }));
      setClasses(mine);
      if (mine.length >= 1 && !classId) {
        navigate(`/teacher/attendance/${mine[0]._id || mine[0].id}`, { replace: true });
      }
    } catch {
      // ignore
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

  // ── Attendance helpers ──
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

  const handleSelectedDateChange = useCallback((value) => {
    if (!value) return;
    if (value > todayISO) { setSelectedDate(todayISO); return; }
    setSelectedDate(value);
  }, [todayISO]);


  // ── Detail modal ──
  // overrides: dữ liệu từ AI scan (checkinImageName, checkoutImageName, timeIn, timeOut, checkedInByAI, checkedOutByAI)
  const openDetail = useCallback((studentId, mode = 'view', overrides = {}) => {
    setSubmitError(null);
    setDetailStudentId(studentId);
    setDetailOpenedDate(selectedDate);

    const draftKey = `${studentId}__${mode}__${selectedDate}`;
    const draft = draftForms[draftKey];
    const hasOverrides = Object.keys(overrides).length > 0;

    if (draft && !hasOverrides) {
      setDetailForm({
        ...draft,
        parentConfirmSent: draft.parentConfirmed ? true : false,
      });
    } else {
      // Không có draft hoặc có override từ AI: khởi tạo form (override được ưu tiên)
      const rec = attendanceByStudent?.[studentId] || defaultRecord();
      setDetailForm({
        status:
          mode === 'checkin' && (rec.status === 'empty' || rec.status === 'absent')
            ? 'checked_in'
            : mode === 'checkout'
            ? 'checked_out'
            : rec.status || 'empty',
        timeIn:
          overrides.timeIn ||
          (mode === 'checkin' && (!rec.timeIn || rec.status === 'empty' || rec.status === 'absent')
            ? nowHHmm()
            : rec.timeIn || ''),
        timeOut:
          overrides.timeOut ||
          (mode === 'checkout' && !rec.timeOut ? nowHHmm() : rec.timeOut || ''),
        checkinImageName: overrides.checkinImageName || rec.checkinImageName || '',
        delivererType: rec.delivererType || '',
        delivererPickupPersonId: rec.delivererPickupPersonId || '',
        delivererOtherInfo: rec.delivererOtherInfo || '',
        delivererName: parsePersonOtherInfo(rec.delivererOtherInfo).name,
        delivererPhone: parsePersonOtherInfo(rec.delivererOtherInfo).phone,
        delivererOtherImageName: rec.delivererOtherImageName || '',
        hasBelongings: !!rec.hasBelongings,
        belongingsNote: rec.belongingsNote || '',
        note: rec.note || '',
        absentReason: rec.absentReason || '',
        checkedInByAI: overrides.checkedInByAI !== undefined ? overrides.checkedInByAI : rec.checkedInByAI || false,
        checkedOutByAI: overrides.checkedOutByAI !== undefined ? overrides.checkedOutByAI : rec.checkedOutByAI || false,
        checkoutImageName: overrides.checkoutImageName || rec.checkoutImageName || '',
        receiverType: rec.receiverType || '',
        receiverPickupPersonId: rec.receiverPickupPersonId || '',
        receiverOtherInfo: rec.receiverOtherInfo || '',
        receiverName: parsePersonOtherInfo(rec.receiverOtherInfo).name,
        receiverPhone: parsePersonOtherInfo(rec.receiverOtherInfo).phone,
        receiverOtherImageName: rec.receiverOtherImageName || '',
        checkoutNote: rec.checkoutNote || '',
        checkoutBelongingsNote: rec.checkoutBelongingsNote || '',
        hasCheckoutBelongings: !!(rec.checkoutBelongingsNote),
        parentConfirmSent: false,
        parentConfirmed: false,
      });
    }

    setDetailMode(mode);
    setIsDetailOpen(true);
  }, [selectedDate, draftForms, attendanceByStudent]);

  const closeDetail = () => {
    if (detailStudentId) {
      const draftKey = `${detailStudentId}__${detailMode}__${detailOpenedDate}`;
      const { parentConfirmSent, ...formWithoutConfirmSent } = detailForm;
      setDraftForms((prev) => ({ ...prev, [draftKey]: formWithoutConfirmSent }));
    }
    setIsDetailOpen(false);
    setSubmitError(null);
  };

  // ── Stable callbacks cho AttendanceTable (tránh re-render khi gõ form) ──
  const handleCheckin = useCallback((id) => openDetail(id, 'checkin'), [openDetail]);
  const handleCheckout = useCallback((id) => openDetail(id, 'checkout'), [openDetail]);
  const handleViewDetail = useCallback((id) => openDetail(id), [openDetail]);
  const handleAbsent = useCallback((id) => {
    setAbsentStudentId(id);
    setAbsentForm({ reason: '', note: '' });
    setAbsentError(null);
    setIsAbsentOpen(true);
  }, []);

  // Callbacks từ AI scan: đóng modal quét và mở form chi tiết với ảnh đã chụp
  const handleAICheckinRecognized = useCallback(({ studentId, checkinImageUrl, timeStr }) => {
    setIsFaceModalOpen(false);
    openDetail(studentId, 'checkin', {
      checkinImageName: checkinImageUrl,
      timeIn: timeStr,
      checkedInByAI: true,
    });
  }, [openDetail]);

  const handleAICheckoutRecognized = useCallback(({ studentId, checkoutImageUrl, timeStr }) => {
    setIsPickupFaceModalOpen(false);
    openDetail(studentId, 'checkout', {
      checkoutImageName: checkoutImageUrl,
      timeOut: timeStr,
      checkedOutByAI: true,
    });
  }, [openDetail]);

  // Đóng modal sau khi lưu thành công — xóa draft thay vì lưu
  const closeDetailAndClearDraft = () => {
    if (detailStudentId) {
      const draftKey = `${detailStudentId}__${detailMode}__${detailOpenedDate}`;
      setDraftForms((prev) => {
        const next = { ...prev };
        delete next[draftKey];
        return next;
      });
    }
    setIsDetailOpen(false);
    setSubmitError(null);
  };

  const validateDetail = () => {
    if (!detailStudentId) return 'Không xác định học sinh.';
    if (!isValidHHmm(detailForm.timeIn) || !isValidHHmm(detailForm.timeOut))
      return 'Giờ đến/giờ về phải theo định dạng HH:mm.';

    const belongingsNote = detailForm.belongingsNote?.trim() || '';
    const note = detailForm.note?.trim() || '';

    if (detailForm.delivererType === 'Khác') {
      const dName = detailForm.delivererName?.trim() || '';
      const dPhone = detailForm.delivererPhone?.trim() || '';
      if (!dName) return 'Vui lòng nhập tên người đưa.';
      if (dName.length > MAX_PERSON_NAME_LEN) return `Tên người đưa tối đa ${MAX_PERSON_NAME_LEN} ký tự.`;
      if (!dPhone) return 'Vui lòng nhập số điện thoại người đưa.';
      if (!PHONE_REGEX.test(dPhone)) return 'Số điện thoại người đưa không hợp lệ (10–11 chữ số).';
    }

    if (detailForm.receiverType === 'Khác') {
      const rName = detailForm.receiverName?.trim() || '';
      const rPhone = detailForm.receiverPhone?.trim() || '';
      if (!rName) return 'Vui lòng nhập tên người đón.';
      if (rName.length > MAX_PERSON_NAME_LEN) return `Tên người đón tối đa ${MAX_PERSON_NAME_LEN} ký tự.`;
      if (!rPhone) return 'Vui lòng nhập số điện thoại người đón.';
      if (!PHONE_REGEX.test(rPhone)) return 'Số điện thoại người đón không hợp lệ (10–11 chữ số).';
    }

    if (detailForm.hasBelongings && !belongingsNote) return 'Vui lòng nhập ghi chú đồ mang theo.';
    if (belongingsNote.length > MAX_BELONGINGS_NOTE_LEN) return `Ghi chú đồ mang theo tối đa ${MAX_BELONGINGS_NOTE_LEN} ký tự.`;
    if (note.length > MAX_NOTE_LEN) return `Ghi chú tối đa ${MAX_NOTE_LEN} ký tự.`;
    return null;
  };

  const handleSaveDetail = async (e) => {
    e.preventDefault();
    const error = validateDetail();
    if (error) { setSubmitError(error); return; }
    setSubmitError(null);

    try {
      if (!detailStudentId) throw new Error('Không xác định học sinh.');


      const basePayload = {
        studentId: detailStudentId,
        classId,
        date: selectedDate,
        note: detailForm.note?.trim() || '',
      };

      if (detailMode === 'checkout') {
        const timeOutHHmm = detailForm.timeOut || nowHHmm();
        const isoOut = buildDateTimeISO(selectedDate, timeOutHHmm);
        const receiverOtherInfoFinal = detailForm.receiverType === 'Khác'
          ? buildPersonOtherInfo(detailForm.receiverName, detailForm.receiverPhone)
          : detailForm.receiverOtherInfo || '';

        await post(ENDPOINTS.STUDENTS.ATTENDANCE_CHECKOUT, {
          ...basePayload,
          note: detailForm.checkoutNote?.trim() || '',
          checkoutImageName: detailForm.checkoutImageName || '',
          receiverType: detailForm.receiverType || '',
          receiverOtherInfo: receiverOtherInfoFinal,
          receiverOtherImageName: detailForm.receiverOtherImageName || '',
          checkoutBelongingsNote: detailForm.checkoutBelongingsNote?.trim() || '',
          time: isoOut ? { checkOut: isoOut } : undefined,
          timeString: { checkOut: timeOutHHmm },
          status: 'present',
          isTakeOff: false,
          checkedOutByAI: detailForm.checkedOutByAI || false,
          teacherConfirmedCheckout: detailForm.teacherConfirmedCheckout || false,
          checkoutConfirmMethod:
            detailForm.teacherConfirmedCheckout ? 'teacher'
            : detailForm.parentConfirmed ? 'parent_confirm'
            : '',
        });

        updateRecord(detailStudentId, {
          ...(attendanceByStudent?.[detailStudentId] || defaultRecord()),
          status: (attendanceByStudent?.[detailStudentId]?.status === 'late_checked_in')
            ? 'late_checked_out'
            : 'checked_out',
          timeOut: timeOutHHmm,
          timeIn: detailForm.timeIn || '',
          checkoutNote: detailForm.checkoutNote?.trim() || '',
          checkoutBelongingsNote: detailForm.checkoutBelongingsNote?.trim() || '',
          checkoutImageName: detailForm.checkoutImageName,
          receiverType: detailForm.receiverType,
          receiverOtherInfo: receiverOtherInfoFinal,
          receiverOtherImageName: detailForm.receiverOtherImageName,
          checkedOutByAI: detailForm.checkedOutByAI || false,
        });

        const studentNameOut = students.find((s) => s._id === detailStudentId)?.fullName || 'Học sinh';
        showSuccessToast(`Điểm danh về thành công cho ${studentNameOut}!`);
        closeDetailAndClearDraft();
      } else if (detailMode === 'checkin') {
        const timeInHHmm = detailForm.timeIn || nowHHmm();
        const isLateArrival = (() => {
          if (!/^\d{2}:\d{2}$/.test(timeInHHmm)) return false;
          const [h, m] = timeInHHmm.split(':').map(Number);
          return h > 8 || (h === 8 && m > 0);
        })();
        const isoIn = buildDateTimeISO(selectedDate, timeInHHmm);
        const delivererOtherInfoFinal = detailForm.delivererType === 'Khác'
          ? buildPersonOtherInfo(detailForm.delivererName, detailForm.delivererPhone)
          : detailForm.delivererOtherInfo || '';

        const checkinBelongingsArray =
          detailForm.hasBelongings && detailForm.belongingsNote?.trim()
            ? detailForm.belongingsNote.split(',').map((s) => s.trim()).filter(Boolean)
            : [];

        await post(ENDPOINTS.STUDENTS.ATTENDANCE_CHECKIN, {
          ...basePayload,
          checkinImageName: detailForm.checkinImageName || '',
          delivererType: detailForm.delivererType || '',
          delivererOtherInfo: delivererOtherInfoFinal,
          delivererOtherImageName: detailForm.delivererOtherImageName || '',
          time: isoIn ? { checkIn: isoIn } : undefined,
          timeString: { checkIn: timeInHHmm },
          status: 'present',
          isTakeOff: false,
          checkedInByAI: detailForm.checkedInByAI || false,
          checkinBelongings: checkinBelongingsArray,
        });

        updateRecord(detailStudentId, {
          ...(attendanceByStudent?.[detailStudentId] || defaultRecord()),
          status: isLateArrival ? 'late_checked_in' : 'checked_in',
          timeIn: timeInHHmm,
          note: basePayload.note,
          delivererType: detailForm.delivererType,
          delivererOtherInfo: delivererOtherInfoFinal,
          delivererOtherImageName: detailForm.delivererOtherImageName,
          checkinImageName: detailForm.checkinImageName,
          hasBelongings: detailForm.hasBelongings,
          belongingsNote: detailForm.belongingsNote,
          checkedInByAI: detailForm.checkedInByAI || false,
        });

        const studentName = students.find((s) => s._id === detailStudentId)?.fullName || 'Học sinh';
        showSuccessToast(`Điểm danh thành công cho ${studentName}!`);
        closeDetailAndClearDraft();
      } else {
        // view mode: lưu ghi chú lên server nếu học sinh đã có bản ghi điểm danh
        const currentRec = attendanceByStudent?.[detailStudentId];
        if (currentRec && currentRec.status !== 'empty') {
          const serverStatus =
            currentRec.status === 'checked_in'
              || currentRec.status === 'checked_out'
              || currentRec.status === 'late_checked_in'
              || currentRec.status === 'late_checked_out'
              ? 'present'
              : currentRec.status;
          await post(ENDPOINTS.STUDENTS.ATTENDANCE_CHECKIN, {
            studentId: detailStudentId,
            classId,
            date: selectedDate,
            status: serverStatus,
            note: basePayload.note,
          });
        }
        updateRecord(detailStudentId, {
          ...(attendanceByStudent?.[detailStudentId] || defaultRecord()),
          ...detailForm,
          note: basePayload.note,
        });
        closeDetailAndClearDraft();
      }
    } catch (err) {
      setSubmitError(err.message || 'Lỗi khi lưu điểm danh');
    }
  };


  // ── Absent modal ──
  const saveAbsentRecord = async () => {
    if (!absentStudentId) return;
    setAbsentError(null);

    const currentRec = attendanceByStudent?.[absentStudentId];
    if (currentRec && currentRec.status && currentRec.status !== 'empty') {
      setAbsentError('Học sinh đã có bản ghi điểm danh, không thể đánh vắng mặt.');
      setIsConfirmAbsentOpen(false);
      return;
    }

    try {
      await post(ENDPOINTS.STUDENTS.ATTENDANCE_CHECKIN, {
        studentId: absentStudentId,
        classId,
        date: selectedDate,
        status: 'absent',
        note: absentForm.note?.trim() || '',
        absentReason: absentForm.reason,
        isTakeOff: false,
      });

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
    if (!absentStudentId) { setAbsentError('Không xác định học sinh.'); return; }

    const currentRec = attendanceByStudent?.[absentStudentId];
    if (currentRec && currentRec.status && currentRec.status !== 'empty') {
      setAbsentError('Học sinh đã có bản ghi điểm danh , không thể đánh vắng mặt.');
      return;
    }

    if (!absentForm.reason) { setAbsentError('Vui lòng chọn lý do vắng mặt.'); return; }
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

  // ── Computed ──
  const detailStudent = useMemo(
    () => students.find((s) => s._id === detailStudentId) || null,
    [students, detailStudentId]
  );
  const selectedClass = useMemo(
    () => classes.find((c) => (c._id || c.id) === classId) || null,
    [classes, classId]
  );
  const selectedClassName = useMemo(
    () =>
      selectedClass?.className ||
      selectedClass?.name ||
      (selectedClass?.gradeId?.gradeName ? `${selectedClass.gradeId.gradeName} - ${selectedClass?._id || ''}` : '') ||
      '',
    [selectedClass]
  );

  return (
    <RoleLayout
      title="Điểm danh"
      description="Danh sách điểm danh theo lớp."
      menuItems={menuItems}
      activeKey={activeKey}
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {!classId && !isInitializing && classes.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
          <Paper elevation={0} sx={{ textAlign: 'center', p: 5, borderRadius: 3, border: '1px solid', borderColor: 'divider', maxWidth: 420 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'grey.100', mx: 'auto', mb: 2 }}>
              <EventBusyIcon sx={{ fontSize: 34, color: 'grey.400' }} />
            </Avatar>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Chưa được phân công lớp
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Giáo viên này chưa được phân công vào lớp nào. Vui lòng liên hệ quản trị viên để được phân công.
            </Typography>
          </Paper>
        </Box>
      )}

      {classId && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => v && setViewMode(v)}
            size="small"
            sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, fontSize: 13, px: 2 } }}
          >
            <ToggleButton value="day">
              <DayViewIcon sx={{ fontSize: 16, mr: 0.75 }} /> Theo ngày
            </ToggleButton>
            <ToggleButton value="week">
              <WeekViewIcon sx={{ fontSize: 16, mr: 0.75 }} /> Thống kê tuần
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {classId && viewMode === 'week' && (
        <WeeklyAttendanceView classId={classId} students={students} />
      )}

      {classId && viewMode === 'day' && !isWeekendDate(selectedDate) && (
        <div className="mb-4 flex flex-wrap justify-end gap-2">
          {/* Nút Điểm danh đến */}
          <button
            onClick={() => setIsFaceModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.25s ease',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.55)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
            }}
            className="relative flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 text-white text-xs sm:text-sm font-semibold rounded-xl overflow-hidden"
          >
            {/* Hiệu ứng shimmer */}
            <span
              style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2.5s infinite',
              }}
            />
            {/* Icon camera AI */}
            <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
              <span
                style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: '0.05em',
                  background: 'rgba(255,255,255,0.25)', borderRadius: 4,
                  padding: '1px 4px', lineHeight: '13px',
                }}
              >AI</span>
            </span>
            <span style={{ position: 'relative' }} className="hidden sm:inline">Điểm danh đến</span>
            <span style={{ position: 'relative' }} className="sm:hidden">Đến</span>
          </button>

          {/* Nút Điểm danh về */}
          <button
            onClick={() => {
              setIsPickupFaceModalOpen(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.25s ease',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.55)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.4)';
            }}
            className="relative flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 text-white text-xs sm:text-sm font-semibold rounded-xl overflow-hidden"
          >
            {/* Hiệu ứng shimmer */}
            <span
              style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2.5s infinite 0.5s',
              }}
            />
            {/* Icon checkout AI */}
            <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                <path d="M18 14l2 2 4-4" strokeWidth="2.5"/>
              </svg>
              <span
                style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: '0.05em',
                  background: 'rgba(255,255,255,0.25)', borderRadius: 4,
                  padding: '1px 4px', lineHeight: '13px',
                }}
              >AI</span>
            </span>
            <span style={{ position: 'relative' }} className="hidden sm:inline">Điểm danh về</span>
            <span style={{ position: 'relative' }} className="sm:hidden">Về</span>
          </button>

          {/* Nút Đăng ký khuôn mặt AI */}
          <button
            onClick={() => setIsFaceRegisterClassOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
              transition: 'all 0.25s ease',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(124, 58, 237, 0.55)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(124, 58, 237, 0.4)';
            }}
            className="relative flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 text-white text-xs sm:text-sm font-semibold rounded-xl overflow-hidden"
          >
            <span
              style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2.5s infinite 1s',
              }}
            />
            <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
              </svg>
              <span
                style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: '0.05em',
                  background: 'rgba(255,255,255,0.25)', borderRadius: 4,
                  padding: '1px 4px', lineHeight: '13px',
                }}
              >AI</span>
            </span>
            <span style={{ position: 'relative' }} className="hidden sm:inline">Đăng ký khuôn mặt</span>
            <span style={{ position: 'relative' }} className="sm:hidden">Đăng ký</span>
            {/* Badge số học sinh đã đăng ký */}
            {students.length > 0 && (
              <span
                style={{
                  position: 'relative',
                  background: students.filter(s => s.hasFaceEmbedding).length === students.length
                    ? 'rgba(16,185,129,0.9)'
                    : 'rgba(255,255,255,0.25)',
                  borderRadius: 99,
                  padding: '1px 7px',
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: '16px',
                  letterSpacing: '0.02em',
                }}
                className="hidden sm:inline"
              >
                {students.filter(s => s.hasFaceEmbedding).length}/{students.length}
              </span>
            )}
          </button>

          <style>{`
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
          `}</style>
        </div>
      )}

      {classId && viewMode === 'day' && (
        <AttendanceTable
          students={students}
          attendanceByStudent={attendanceByStudent}
          loadingStudents={loadingStudents}
          studentsError={studentsError}
          todayISO={todayISO}
          selectedDate={selectedDate}
          onDateChange={handleSelectedDateChange}
          onCheckin={handleCheckin}
          onCheckout={handleCheckout}
          onViewDetail={handleViewDetail}
          onAbsent={handleAbsent}
          selectedClassName={selectedClassName}
          classId={classId}
          isWeekend={isWeekendDate(selectedDate)}
        />
      )}

      <AttendanceDetailModal
        isOpen={isDetailOpen}
        mode={detailMode}
        student={detailStudent}
        studentId={detailStudentId}
        selectedDate={selectedDate}
        todayISO={todayISO}
        detailForm={detailForm}
        setDetailForm={setDetailForm}
        submitError={submitError}
        setSubmitError={setSubmitError}
        studentsError={studentsError}
        approvedPickupPersons={approvedPickupPersons}
        attendanceByStudent={attendanceByStudent}
        onClose={closeDetail}
        onSave={handleSaveDetail}
      />

      <AbsentModal
        isOpen={isAbsentOpen}
        studentId={absentStudentId}
        students={students}
        absentForm={absentForm}
        setAbsentForm={setAbsentForm}
        absentError={absentError}
        onSubmit={handleSaveAbsent}
        onClose={closeAbsent}
        isConfirmOpen={isConfirmAbsentOpen}
        selectedDate={selectedDate}
        onConfirm={saveAbsentRecord}
        onCancelConfirm={() => setIsConfirmAbsentOpen(false)}
      />

      {/* Toast thông báo thành công */}
      <Snackbar
        open={successToast.visible}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ zIndex: 1500 }}
      >
        <Alert severity="success" variant="filled" sx={{ fontWeight: 700, boxShadow: 8 }}>
          {successToast.message}
        </Alert>
      </Snackbar>

      {/* Toast thông báo cảnh báo */}
      <Snackbar
        open={warningToast.visible}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 1500 }}
      >
        <Alert severity="warning" variant="filled" sx={{ fontWeight: 600, boxShadow: 8 }}>
          {warningToast.message}
        </Alert>
      </Snackbar>

      <FaceModalErrorBoundary onClose={() => setIsFaceModalOpen(false)}>
        <FaceAttendanceModal
          open={isFaceModalOpen}
          onClose={() => {
            setIsFaceModalOpen(false);
            loadAttendance();
          }}
          onStudentRecognized={handleAICheckinRecognized}
          classId={classId}
          className={selectedClassName}
        />
      </FaceModalErrorBoundary>

      <FaceRegisterClassModal
        open={isFaceRegisterClassOpen}
        onClose={() => setIsFaceRegisterClassOpen(false)}
        classId={classId}
        className={selectedClassName}
      />

      <PickupFaceAttendanceModal
        open={isPickupFaceModalOpen}
        onClose={() => {
          setIsPickupFaceModalOpen(false);
          loadAttendance();
        }}
        classId={classId}
        className={selectedClassName}
        onStudentRecognized={handleAICheckoutRecognized}
      />
    </RoleLayout>
  );
}

export default TeacherAttendance;
