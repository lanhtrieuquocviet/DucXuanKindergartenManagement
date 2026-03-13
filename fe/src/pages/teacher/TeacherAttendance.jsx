import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Snackbar, Alert, Box, Typography, Avatar, Paper } from '@mui/material';
import { EventBusy as EventBusyIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, post, ENDPOINTS } from '../../service/api';
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
  const { user, logout, isInitializing } = useAuth();
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

  // ── State: Toast thành công ──
  const [successToast, setSuccessToast] = useState({ visible: false, message: '' });

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
    if (!userRoles.includes('Teacher')) {
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
      note: serverRec.note || '',
      absentReason: serverRec.absentReason || '',
    };
  };

  // Load attendance: ưu tiên server, fallback localStorage khi mất mạng
  useEffect(() => {
    if (!classId) return;
    const loadAttendance = async () => {
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
    };
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, selectedDate]);

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
      { key: 'pickup-approval', label: 'Đơn đưa đón' },
      { key: 'schedule', label: 'Lịch dạy & hoạt động' },
      { key: 'messages', label: 'Thông báo cho phụ huynh' },
    ],
    []
  );

  const activeKey = useMemo(() => {
    const path = location.pathname || '';
    if (path.startsWith('/teacher/attendance')) return 'attendance';
    if (path.startsWith('/teacher/pickup-approval')) return 'pickup-approval';
    return 'classes';
  }, [location.pathname]);

  const userName = user?.fullName || user?.username || 'Teacher';

  const handleMenuSelect = (key) => {
    if (key === 'classes') { navigate('/teacher'); return; }
    if (key === 'attendance') { navigate('/teacher/attendance'); return; }
    if (key === 'pickup-approval') { navigate('/teacher/pickup-approval'); return; }
  };

  // ── API calls ──
  const fetchMyClasses = async () => {
    try {
      const res = await get(ENDPOINTS.CLASSES.LIST);
      const all = res.data || [];
      const myUserId = user?._id;
      const mine = all.filter((c) => (c.teacherIds || []).some((t) => (t?._id || t) === myUserId));
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
        checkoutImageName: rec.checkoutImageName || '',
        receiverType: rec.receiverType || '',
        receiverPickupPersonId: rec.receiverPickupPersonId || '',
        receiverOtherInfo: rec.receiverOtherInfo || '',
        receiverName: parsePersonOtherInfo(rec.receiverOtherInfo).name,
        receiverPhone: parsePersonOtherInfo(rec.receiverOtherInfo).phone,
        receiverOtherImageName: rec.receiverOtherImageName || '',
        checkoutNote: rec.checkoutNote || '',
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

  const handleSendToParent = () => {
    if (!detailStudentId) { setSubmitError('Không xác định học sinh.'); return; }
    if (!detailForm.receiverType) { setSubmitError('Vui lòng chọn người đón.'); return; }
    if (detailForm.receiverType === 'Khác') {
      if (!detailForm.receiverName?.trim()) { setSubmitError('Vui lòng nhập tên người đón.'); return; }
      if (!detailForm.receiverPhone?.trim() || !PHONE_REGEX.test(detailForm.receiverPhone.trim())) {
        setSubmitError('Vui lòng nhập số điện thoại người đón hợp lệ.'); return;
      }
      if (!detailForm.receiverOtherImageName) { setSubmitError('Vui lòng chọn ảnh người đón.'); return; }
    }
    setSubmitError(null);

    const receiverOtherInfoForParent = detailForm.receiverType === 'Khác'
      ? buildPersonOtherInfo(detailForm.receiverName, detailForm.receiverPhone)
      : detailForm.receiverOtherInfo || '';

    updateRecord(detailStudentId, {
      ...(attendanceByStudent?.[detailStudentId] || defaultRecord()),
      status: 'waiting_parent',
      timeIn: detailForm.timeIn || '',
      timeOut: detailForm.timeOut || '',
      note: detailForm.note?.trim() || '',
      checkoutImageName: detailForm.checkoutImageName,
      receiverType: detailForm.receiverType,
      receiverOtherInfo: receiverOtherInfoForParent,
      receiverOtherImageName: detailForm.receiverOtherImageName,
    });
    closeDetailAndClearDraft();
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
        onSendToParent={handleSendToParent}
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
    </RoleLayout>
  );
}

export default TeacherAttendance;
