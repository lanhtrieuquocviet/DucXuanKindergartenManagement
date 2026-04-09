import { useCallback, useEffect, useMemo, useRef, useState, Component } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Snackbar, Alert, Box, Typography, Avatar, Paper, Button } from '@mui/material';
import { EventBusy as EventBusyIcon } from '@mui/icons-material';
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

function TeacherAttendance() {
  const navigate = useNavigate();
  const location = useLocation();
  const { classId } = useParams();
  const { user, logout, isInitializing, hasPermission } = useAuth();
  const todayISO = getLocalISODate();

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

  // ── State: Firebase OTP ──
  const [confirmationResult, setConfirmationResult] = useState(null);
  const recaptchaVerifierRef = useRef(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);

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
      status = serverRec.timeString?.checkOut ? 'checked_out' : 'checked_in';
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
      checkoutBelongingsNote: serverRec.checkoutBelongingsNote || '',
      hasCheckoutBelongings: !!(serverRec.checkoutBelongingsNote),
      note: serverRec.note || '',
      absentReason: serverRec.absentReason || '',
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

  // Đếm ngược OTP
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

  // Bắt đầu đếm ngược khi gửi OTP
  useEffect(() => {
    if (detailForm.otpSent && !otpExpired) {
      setOtpTimeLeft(60);
    }
  }, [detailForm.otpSent]);

  // ── Menu layout ──
  const menuItems = useMemo(
    () => [
      { key: 'classes', label: 'Lớp phụ trách' },
      { key: 'students', label: 'Danh sách học sinh' },
      { key: 'attendance', label: 'Điểm danh' },
      { key: 'pickup-approval', label: 'Đơn đăng ký đưa đón' },
      { key: 'schedule', label: 'Lịch dạy & hoạt động' },
      { key: 'contact-book', label: 'Sổ liên lạc điện tử' },
      { key: 'purchase-request', label: 'Cơ sở vật chất' },
      { key: 'class-assets', label: 'Tài sản lớp' },
      ...(hasPermission('MANAGE_INSPECTION') ? [{ key: 'asset-inspection', label: 'Kiểm kê tài sản' }] : []),
    ],
    [hasPermission]
  );

  const activeKey = useMemo(() => {
    const path = location.pathname || '';
    if (path.startsWith('/teacher/contact-book'))    return 'contact-book';
    if (path.startsWith('/teacher/attendance'))      return 'attendance';
    if (path.startsWith('/teacher/pickup-approval')) return 'pickup-approval';
    if (path.startsWith('/teacher/purchase-request')) return 'purchase-request';
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
      'purchase-request': '/teacher/purchase-request',
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

  const handleSelectedDateChange = (value) => {
    if (!value) return;
    if (value > todayISO) { setSelectedDate(todayISO); return; }
    setSelectedDate(value);
  };

  // ── Detail modal ──
  const openDetail = (studentId, mode = 'view') => {
    setSubmitError(null);
    setDetailStudentId(studentId);
    setDetailOpenedDate(selectedDate);

    const draftKey = `${studentId}__${mode}__${selectedDate}`;
    const draft = draftForms[draftKey];

    if (draft) {
      // Có draft: khôi phục form đã nhập, chỉ reset OTP vì OTP hết hạn
      setDetailForm({
        ...draft,
        otpSent: false,
        otpCode: '',
        sendOtpSchoolAccount: false,
        sendOtpViaSms: false,
        selectedParentForOtp: '',
      });
    } else {
      // Không có draft: khởi tạo form từ bản ghi hiện tại
      const rec = attendanceByStudent?.[studentId] || defaultRecord();
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
          mode === 'checkout' && !rec.timeOut ? nowHHmm() : rec.timeOut || '',
        checkinImageName: rec.checkinImageName || '',
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
        checkedInByAI: rec.checkedInByAI || false,
        checkedOutByAI: rec.checkedOutByAI || false,
        checkoutImageName: rec.checkoutImageName || '',
        receiverType: rec.receiverType || '',
        receiverPickupPersonId: rec.receiverPickupPersonId || '',
        receiverOtherInfo: rec.receiverOtherInfo || '',
        receiverName: parsePersonOtherInfo(rec.receiverOtherInfo).name,
        receiverPhone: parsePersonOtherInfo(rec.receiverOtherInfo).phone,
        receiverOtherImageName: rec.receiverOtherImageName || '',
        checkoutNote: rec.checkoutNote || '',
        checkoutBelongingsNote: rec.checkoutBelongingsNote || '',
        hasCheckoutBelongings: !!(rec.checkoutBelongingsNote),
        sendOtpSchoolAccount: false,
        sendOtpViaSms: false,
        selectedParentForOtp: '',
        otpCode: '',
        otpSent: false,
      });
    }

    setDetailMode(mode);
    setIsDetailOpen(true);
    resetOtpState();
  };

  const resetOtpState = () => {
    setConfirmationResult(null);
    setOtpExpired(false);
    setOtpTimeLeft(0);
    setDetailForm((prev) => ({ ...prev, otpSent: false, otpCode: '' }));
  };

  const closeDetail = () => {
    // Lưu draft khi đóng modal (không lưu OTP vì hết hạn)
    if (detailStudentId) {
      const draftKey = `${detailStudentId}__${detailMode}__${detailOpenedDate}`;
      const { otpSent, otpCode, sendOtpSchoolAccount, sendOtpViaSms, selectedParentForOtp, ...formWithoutOtp } = detailForm;
      setDraftForms((prev) => ({ ...prev, [draftKey]: formWithoutOtp }));
    }
    setIsDetailOpen(false);
    setSubmitError(null);
  };

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
      if (!PHONE_REGEX.test(dPhone)) return 'Số điện thoại người đưa không hợp lệ (7–15 chữ số).';
    }

    if (detailForm.receiverType === 'Khác') {
      const rName = detailForm.receiverName?.trim() || '';
      const rPhone = detailForm.receiverPhone?.trim() || '';
      if (!rName) return 'Vui lòng nhập tên người đón.';
      if (rName.length > MAX_PERSON_NAME_LEN) return `Tên người đón tối đa ${MAX_PERSON_NAME_LEN} ký tự.`;
      if (!rPhone) return 'Vui lòng nhập số điện thoại người đón.';
      if (!PHONE_REGEX.test(rPhone)) return 'Số điện thoại người đón không hợp lệ (7–15 chữ số).';
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

      // Kiểm tra & xác minh OTP cho checkin
      if (detailMode === 'checkin') {
        if (!detailForm.otpSent) throw new Error('Vui lòng gửi mã OTP trước khi lưu.');
        if (!detailForm.otpCode) throw new Error('Vui lòng nhập mã OTP.');
        const isSchoolOtp = detailForm.sendOtpSchoolAccount && !detailForm.sendOtpViaSms;
        if (isSchoolOtp) {
          try {
            const verifyRes = await post(ENDPOINTS.OTP.VERIFY, { studentId: detailStudentId, otpCode: detailForm.otpCode });
            if (!verifyRes.data?.verified) throw new Error('OTP không chính xác.');
          } catch (err) {
            throw new Error(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
          }
        } else {
          if (!confirmationResult) throw new Error('Vui lòng gửi mã OTP trước khi lưu.');
          try { await confirmationResult.confirm(detailForm.otpCode); }
          catch { throw new Error('Mã OTP không chính xác hoặc đã hết hạn.'); }
        }
      }

      const basePayload = {
        studentId: detailStudentId,
        classId,
        date: selectedDate,
        note: detailForm.note?.trim() || '',
      };

      if (detailMode === 'checkout') {
        // Kiểm tra & xác minh OTP cho checkout
        if (!detailForm.otpSent) throw new Error('Vui lòng gửi mã OTP trước khi lưu.');
        if (!detailForm.otpCode) throw new Error('Vui lòng nhập mã OTP.');
        const isSchoolOtpCO = detailForm.sendOtpSchoolAccount && !detailForm.sendOtpViaSms;
        if (isSchoolOtpCO) {
          try {
            const verifyRes = await post(ENDPOINTS.OTP.VERIFY, { studentId: detailStudentId, otpCode: detailForm.otpCode });
            if (!verifyRes.data?.verified) throw new Error('OTP không chính xác.');
          } catch (err) {
            throw new Error(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
          }
        } else {
          if (!confirmationResult) throw new Error('Vui lòng gửi mã OTP trước khi lưu.');
          try { await confirmationResult.confirm(detailForm.otpCode); }
          catch { throw new Error('Mã OTP không chính xác hoặc đã hết hạn.'); }
        }

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
        });

        updateRecord(detailStudentId, {
          ...(attendanceByStudent?.[detailStudentId] || defaultRecord()),
          status: 'checked_out',
          timeOut: timeOutHHmm,
          timeIn: detailForm.timeIn || '',
          checkoutNote: detailForm.checkoutNote?.trim() || '',
          checkoutBelongingsNote: detailForm.checkoutBelongingsNote?.trim() || '',
          checkoutImageName: detailForm.checkoutImageName,
          receiverType: detailForm.receiverType,
          receiverOtherInfo: receiverOtherInfoFinal,
          receiverOtherImageName: detailForm.receiverOtherImageName,
        });

        const studentNameOut = students.find((s) => s._id === detailStudentId)?.fullName || 'Học sinh';
        showSuccessToast(`Điểm danh về thành công cho ${studentNameOut}!`);
        closeDetailAndClearDraft();
      } else if (detailMode === 'checkin') {
        const timeInHHmm = detailForm.timeIn || nowHHmm();
        const isoIn = buildDateTimeISO(selectedDate, timeInHHmm);
        const delivererOtherInfoFinal = detailForm.delivererType === 'Khác'
          ? buildPersonOtherInfo(detailForm.delivererName, detailForm.delivererPhone)
          : detailForm.delivererOtherInfo || '';

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
        });

        updateRecord(detailStudentId, {
          ...(attendanceByStudent?.[detailStudentId] || defaultRecord()),
          status: 'checked_in',
          timeIn: timeInHHmm,
          note: basePayload.note,
          delivererType: detailForm.delivererType,
          delivererOtherInfo: delivererOtherInfoFinal,
          delivererOtherImageName: detailForm.delivererOtherImageName,
          checkinImageName: detailForm.checkinImageName,
          hasBelongings: detailForm.hasBelongings,
          belongingsNote: detailForm.belongingsNote,
        });

        const studentName = students.find((s) => s._id === detailStudentId)?.fullName || 'Học sinh';
        showSuccessToast(`Điểm danh thành công cho ${studentName}!`);
        closeDetailAndClearDraft();
      } else {
        // view mode: chỉ lưu local
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
        <div className="mb-4 flex flex-wrap justify-end gap-2">
          {/* Nút Điểm danh đến */}
          <button
            onClick={() => setIsFaceModalOpen(true)}
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

      {classId && (
        <AttendanceTable
          students={students}
          attendanceByStudent={attendanceByStudent}
          loadingStudents={loadingStudents}
          studentsError={studentsError}
          todayISO={todayISO}
          selectedDate={selectedDate}
          onDateChange={handleSelectedDateChange}
          onCheckin={(id) => openDetail(id, 'checkin')}
          onCheckout={(id) => openDetail(id, 'checkout')}
          onViewDetail={(id) => openDetail(id)}
          onAbsent={(id) => {
            setAbsentStudentId(id);
            setAbsentForm({ reason: '', note: '' });
            setAbsentError(null);
            setIsAbsentOpen(true);
          }}
          selectedClassName={selectedClassName}
          classId={classId}
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
        confirmationResult={confirmationResult}
        setConfirmationResult={setConfirmationResult}
        recaptchaVerifierRef={recaptchaVerifierRef}
        otpTimeLeft={otpTimeLeft}
        setOtpTimeLeft={setOtpTimeLeft}
        otpExpired={otpExpired}
        setOtpExpired={setOtpExpired}
        attendanceByStudent={attendanceByStudent}
        onClose={closeDetail}
        onSave={handleSaveDetail}
onResetOtp={resetOtpState}
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
          onCheckinSuccess={loadAttendance}
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
        onClose={() => setIsPickupFaceModalOpen(false)}
        classId={classId}
        className={selectedClassName}
        onCheckoutSuccess={loadAttendance}
      />
    </RoleLayout>
  );
}

export default TeacherAttendance;
