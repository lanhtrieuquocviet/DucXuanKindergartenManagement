import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, post, ENDPOINTS } from '../../service/api';

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
  // Thông tin check-out chi tiết
  checkoutImageName: '',
  receiverType: '', // '', 'Bố', 'Mẹ', 'Ông', 'Bà', 'Khác'
  receiverOtherInfo: '',
  receiverOtherImageName: '',
});

const DELIVERER_OPTIONS = ['Bố', 'Mẹ', 'Ông', 'Bà', 'Khác'];
const ABSENT_REASONS = ['Ốm', 'Nghỉ phép', 'Gia đình có việc', 'Khác'];

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

  const menuItems = useMemo(
    () => [
      { key: 'classes', label: 'Lớp phụ trách' },
      { key: 'students', label: 'Danh sách học sinh' },
      { key: 'attendance', label: 'Điểm danh' },
      { key: 'schedule', label: 'Lịch dạy & hoạt động' },
      { key: 'messages', label: 'Thông báo cho phụ huynh' },
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
      checkoutImageName: rec.checkoutImageName || '',
      receiverType: rec.receiverType || '',
      receiverOtherInfo: rec.receiverOtherInfo || '',
      receiverOtherImageName: rec.receiverOtherImageName || '',
    });
    setDetailMode(mode);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSubmitError(null);
  };

  const validateDetail = () => {
    if (!detailStudentId) return 'Không xác định học sinh.';
    if (!isValidHHmm(detailForm.timeIn) || !isValidHHmm(detailForm.timeOut))
      return 'Giờ đến/giờ về phải theo định dạng HH:mm.';
    return null;
  };

  const buildDateTimeISO = (dateStr, hhmm) => {
    const [hh, mm] = (hhmm || '').split(':');
    if (!dateStr || !hh || !mm) return null;
    const d = new Date(dateStr);
    d.setHours(Number(hh), Number(mm), 0, 0);
    return d.toISOString();
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
      } else if (detailMode === 'checkin') {
        const timeInHHmm = detailForm.timeIn || nowHHmm();
        const isoIn = buildDateTimeISO(selectedDate, timeInHHmm);

        await post(ENDPOINTS.STUDENTS.ATTENDANCE_CHECKIN, {
          ...basePayload,
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

  const handleSaveAbsent = async (e) => {
    e.preventDefault();
    if (!absentStudentId) {
      setAbsentError('Không xác định học sinh.');
      return;
    }
    if (!absentForm.reason) {
      setAbsentError('Vui lòng chọn lý do vắng mặt.');
      return;
    }
    setAbsentError(null);

    try {
      // Lưu local trạng thái "absent"
      updateRecord(absentStudentId, {
        ...(attendanceByStudent?.[absentStudentId] || defaultRecord()),
        status: 'absent',
        timeIn: '',
        timeOut: '',
        note: absentForm.note?.trim() || '',
        absentReason: absentForm.reason,
      });

      // TODO: Nếu cần gọi API lưu lên server, có thể thêm ở đây
      // await post(ENDPOINTS.STUDENTS.ATTENDANCE_ABSENT, {
      //   studentId: absentStudentId,
      //   classId,
      //   date: selectedDate,
      //   reason: absentForm.reason,
      //   note: absentForm.note?.trim() || '',
      // });

      setIsAbsentOpen(false);
      setAbsentStudentId(null);
      setAbsentForm({ reason: '', note: '' });
    } catch (err) {
      setAbsentError(err.message || 'Lỗi khi lưu thông tin vắng mặt');
    }
  };

  const closeAbsent = () => {
    setIsAbsentOpen(false);
    setAbsentError(null);
  };

  // Điều kiện enable/disable button theo spec checkout
  const isCheckoutMode = detailMode === 'checkout';
  const isReceiverOther = detailForm.receiverType === 'Khác';
  const canSaveCheckout =
    isCheckoutMode &&
    !!detailForm.receiverType &&
    !isReceiverOther; // chỉ cho Lưu khi không phải \"Khác\"
  const canSendToParent =
    isCheckoutMode &&
    isReceiverOther &&
    !!detailForm.receiverOtherInfo?.trim() &&
    !!detailForm.receiverOtherImageName;

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
                  onChange={(e) => setSelectedDate(e.target.value)}
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
                          onChange={(e) =>
                            setDetailForm((prev) => ({
                              ...prev,
                              timeIn: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 pl-10"
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">🕐</span>
                      </div>
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
                                delivererOtherInfo: e.target.value,
                              }))
                            }
                            placeholder="Tên + SĐT"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh người đưa</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              setDetailForm((prev) => ({
                                ...prev,
                                delivererOtherImageName: e.target.files && e.target.files[0] ? e.target.files[0].name : '',
                              }))
                            }
                            className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                          />
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
                          onChange={(e) =>
                            setDetailForm((prev) => ({
                              ...prev,
                              checkinImageName: e.target.files && e.target.files[0] ? e.target.files[0].name : '',
                            }))
                          }
                          className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Đồ mang theo</label>
                      <input
                        type="text"
                        value={detailForm.belongingsNote}
                        onChange={(e) =>
                          setDetailForm((prev) => ({
                            ...prev,
                            belongingsNote: e.target.value,
                          }))
                        }
                        placeholder="Bình nước, balo..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú</label>
                      <textarea
                        rows={3}
                        value={detailForm.note}
                        onChange={(e) => setDetailForm((prev) => ({ ...prev, note: e.target.value }))}
                        placeholder="Trẻ hơi mệt..."
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
                          onChange={(e) =>
                            setDetailForm((prev) => ({
                              ...prev,
                              timeOut: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">🕐</span>
                      </div>
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
                                receiverOtherInfo: e.target.value,
                              }))
                            }
                            placeholder="Tên + SĐT"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh người đón</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              setDetailForm((prev) => ({
                                ...prev,
                                receiverOtherImageName: e.target.files && e.target.files[0] ? e.target.files[0].name : '',
                              }))
                            }
                            className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                          />
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
                          onChange={(e) =>
                            setDetailForm((prev) => ({
                              ...prev,
                              checkoutImageName: e.target.files && e.target.files[0] ? e.target.files[0].name : '',
                            }))
                          }
                          className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                        />
                      </div>
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
                            onChange={(e) =>
                              setDetailForm((prev) => ({
                                ...prev,
                                timeOut: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                          />
                          <span className="absolute right-3 top-2.5 text-gray-400">🕐</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh đón trẻ</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setDetailForm((prev) => ({
                              ...prev,
                              checkoutImageName: e.target.files && e.target.files[0] ? e.target.files[0].name : '',
                            }))
                          }
                          className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                        />
                        {detailForm.checkoutImageName && (
                          <p className="mt-1 text-xs text-gray-500">Đã chọn: {detailForm.checkoutImageName}</p>
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
                                  receiverOtherInfo: e.target.value,
                                }))
                              }
                              placeholder="Tên + SĐT"
                              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh người đón</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                setDetailForm((prev) => ({
                                  ...prev,
                                  receiverOtherImageName: e.target.files && e.target.files[0] ? e.target.files[0].name : '',
                                }))
                              }
                              className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                            />
                            {detailForm.receiverOtherImageName && (
                              <p className="mt-1 text-xs text-gray-500">Đã chọn: {detailForm.receiverOtherImageName}</p>
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
                          onChange={(e) =>
                            setDetailForm((prev) => ({
                              ...prev,
                              timeIn: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Ảnh điểm danh / người đưa</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Ảnh điểm danh (Check-in)</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                setDetailForm((prev) => ({
                                  ...prev,
                                  checkinImageName: e.target.files && e.target.files[0] ? e.target.files[0].name : '',
                                }))
                              }
                              className="block w-full text-xs text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-xs file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                            />
                            {detailForm.checkinImageName && (
                              <p className="mt-1 text-[11px] text-gray-500">Đã chọn: {detailForm.checkinImageName}</p>
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
                                    delivererOtherInfo: e.target.value,
                                  }))
                                }
                                placeholder="VD: Nguyễn A - 09xx..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Ảnh người đưa</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  setDetailForm((prev) => ({
                                    ...prev,
                                    delivererOtherImageName: e.target.files && e.target.files[0] ? e.target.files[0].name : '',
                                  }))
                                }
                                className="block w-full text-xs text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-xs file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                              />
                              {detailForm.delivererOtherImageName && (
                                <p className="mt-1 text-[11px] text-gray-500">Đã chọn: {detailForm.delivererOtherImageName}</p>
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
                                belongingsNote: e.target.value,
                              }))
                            }
                            placeholder="Ghi chú đồ dùng (VD: mang theo balo, thú bông...)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                          />
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Note chung</label>
                        <textarea
                          rows={3}
                          value={detailForm.note}
                          onChange={(e) => setDetailForm((prev) => ({ ...prev, note: e.target.value }))}
                          placeholder="Ví dụ: Bé đến muộn 10 phút..."
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
                        className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
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
                  onChange={(e) => setAbsentForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Nhập ghi chú nếu có"
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
    </RoleLayout>
  );
}

export default TeacherAttendance;
