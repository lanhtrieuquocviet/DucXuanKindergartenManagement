import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

const formatDate = (dateStr, showYear = false) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  if (showYear) {
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return `${day}/${month}`;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '—';
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return '—';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '—';
  }
};

const isLate = (checkInTime) => {
  if (!checkInTime) return false;
  try {
    let hours, minutes;
    if (typeof checkInTime === 'string' && /^\d{2}:\d{2}$/.test(checkInTime)) {
      [hours, minutes] = checkInTime.split(':').map(Number);
    } else {
      const d = new Date(checkInTime);
      if (isNaN(d.getTime())) return false;
      hours = d.getHours();
      minutes = d.getMinutes();
    }
    return hours > 7 || (hours === 7 && minutes > 30);
  } catch {
    return false;
  }
};

const getStatusText = (attendance) => {
  if (!attendance || attendance.status === 'absent') {
    return { text: 'Nghỉ học', color: 'text-red-600' };
  }
  if (attendance.status === 'present') {
    const checkInTime = attendance?.timeString?.checkIn || attendance?.time?.checkIn;
    if (isLate(checkInTime)) {
      return { text: 'Đi trễ', color: 'text-orange-600' };
    }
    return { text: 'Có mặt', color: 'text-green-600' };
  }
  return { text: '—', color: 'text-gray-600' };
};

const toYmd = (year, month, day) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

function AttendanceReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isInitializing } = useAuth();

  const initialDate = searchParams.get('date'); // YYYY-MM-DD (optional)
  const initial = useMemo(() => {
    const d = initialDate ? new Date(initialDate) : new Date();
    return {
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [children, setChildren] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(initial.month);
  const [selectedYear, setSelectedYear] = useState(initial.year);

  // expanded row
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    const isParent =
      userRoles.includes('Parent') ||
      userRoles.includes('StudentParent') ||
      userRoles.includes('Student');
    if (!isParent) {
      navigate('/', { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        setError('');
        setLoading(true);

        const childrenRes = await get(ENDPOINTS.AUTH.MY_CHILDREN);
        const list = childrenRes.data || [];
        setChildren(list);

        const student = list[0];
        const studentId = student?._id;
        if (!studentId) {
          setAttendances([]);
          setError('Chưa có thông tin trẻ để xem báo cáo điểm danh.');
          return;
        }

        const fromDate = toYmd(selectedYear, selectedMonth, 1);
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        const toDate = toYmd(selectedYear, selectedMonth, lastDay);
        const classId = student?.classId?._id || student?.classId || '';

        const endpoint =
          `${ENDPOINTS.STUDENTS.ATTENDANCE_LIST}?studentId=${studentId}` +
          `&from=${fromDate}&to=${toDate}` +
          (classId ? `&classId=${classId}` : '');

        const attendanceRes = await get(endpoint);
        const data = attendanceRes.data || [];
        setAttendances(data);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load attendance report', e);
        setError('Không tải được báo cáo điểm danh.');
        setAttendances([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, user, isInitializing, selectedMonth, selectedYear]);

  const student = children[0] || null;
  const studentName = student?.fullName || '—';
  const className = student?.classId?.className || 'Chưa xếp lớp';

  const stats = useMemo(() => {
    const totalDays = attendances.length;
    const present = attendances.filter((att) => att.status === 'present').length;
    const absent = attendances.filter((att) => att.status === 'absent').length;
    const late = attendances.filter((att) => {
      if (att.status !== 'present') return false;
      const checkInTime = att?.timeString?.checkIn || att?.time?.checkIn;
      return isLate(checkInTime);
    }).length;

    return { totalDays, present, absent, late };
  }, [attendances]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const getStatusBadgeClasses = (statusText) => {
    if (statusText === 'Có mặt') return 'bg-green-100 text-green-700 border border-green-200';
    if (statusText === 'Nghỉ học') return 'bg-red-100 text-red-700 border border-red-200';
    if (statusText === 'Đi trễ') return 'bg-orange-100 text-orange-700 border border-orange-200';
    return 'bg-gray-100 text-gray-600 border border-gray-200';
  };

  const getStatusDotClass = (statusText) => {
    if (statusText === 'Có mặt') return 'bg-green-500';
    if (statusText === 'Nghỉ học') return 'bg-red-500';
    if (statusText === 'Đi trễ') return 'bg-orange-500';
    return 'bg-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky green header */}
      <div className="sticky top-0 z-20 bg-emerald-600 shadow-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors text-white flex-shrink-0"
            aria-label="Quay lại"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-white font-bold text-lg leading-tight">Báo cáo điểm danh</h1>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Student info chip */}
      <div className="mx-4 mt-3 bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <span className="text-emerald-600 text-lg font-bold">
            {studentName !== '—' ? studentName.charAt(0).toUpperCase() : '?'}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{studentName}</p>
          <p className="text-xs text-gray-500 truncate">{className}</p>
        </div>
      </div>

      {/* Month / Year filter */}
      <div className="mx-4 mt-3 bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Lọc theo thời gian</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tháng</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  Tháng {String(month).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Năm</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats 2x2 grid */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
        {/* Ngày học */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-4 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày học</span>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-3xl font-extrabold text-gray-800">{stats.totalDays}</p>
          <p className="text-xs text-gray-400">ngày trong tháng</p>
        </div>

        {/* Có mặt */}
        <div className="bg-white rounded-xl shadow-sm border border-green-100 px-4 py-4 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Có mặt</span>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-3xl font-extrabold text-green-600">{stats.present}</p>
          <p className="text-xs text-green-400">ngày có mặt</p>
        </div>

        {/* Nghỉ học */}
        <div className="bg-white rounded-xl shadow-sm border border-red-100 px-4 py-4 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Nghỉ học</span>
            <span className="text-2xl">❌</span>
          </div>
          <p className="text-3xl font-extrabold text-red-600">{stats.absent}</p>
          <p className="text-xs text-red-400">ngày nghỉ</p>
        </div>

        {/* Đi trễ */}
        <div className="bg-white rounded-xl shadow-sm border border-orange-100 px-4 py-4 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Đi trễ</span>
            <span className="text-2xl">⏰</span>
          </div>
          <p className="text-3xl font-extrabold text-orange-600">{stats.late}</p>
          <p className="text-xs text-orange-400">ngày đi trễ</p>
        </div>
      </div>

      {/* Attendance list */}
      <div className="mx-4 mt-3 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
          Lịch sử điểm danh
        </p>

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gray-200" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-20 bg-gray-200 rounded" />
                      <div className="h-2.5 w-14 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : attendances.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-12 flex flex-col items-center gap-3">
            <span className="text-5xl">📭</span>
            <p className="text-gray-500 font-medium text-sm text-center">
              Không có dữ liệu điểm danh trong tháng này.
            </p>
          </div>
        ) : (
          /* Card list */
          <div className="space-y-3">
            {attendances.map((attendance, idx) => {
              const id = attendance._id || idx;
              const status = getStatusText(attendance);
              const checkInTime =
                attendance?.timeString?.checkIn ||
                formatTime(attendance?.time?.checkIn);
              const checkOutTime =
                attendance?.timeString?.checkOut ||
                formatTime(attendance?.time?.checkOut);
              const attendanceDate = formatDate(attendance?.date, true);
              const expanded = expandedId === id;

              return (
                <div
                  key={id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Card header row — tap to expand */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : id)}
                    className="w-full text-left px-4 py-4 flex items-center gap-3 focus:outline-none active:bg-gray-50"
                  >
                    {/* Status dot */}
                    <span
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusDotClass(status.text)}`}
                    />

                    {/* Date + status badge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{attendanceDate}</span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusBadgeClasses(status.text)}`}
                        >
                          {status.text}
                        </span>
                      </div>
                      {/* Check-in → check-out times */}
                      <p className="text-xs text-gray-500 mt-0.5">
                        Đến: <span className="font-medium text-gray-700">{checkInTime}</span>
                        <span className="mx-1.5 text-gray-300">→</span>
                        Về: <span className="font-medium text-gray-700">{checkOutTime}</span>
                      </p>
                    </div>

                    {/* Chevron */}
                    <span className="text-gray-400 flex-shrink-0">
                      {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>

                  {/* Expanded detail */}
                  {expanded && (
                    <div className="border-t border-gray-100 px-4 py-4 space-y-4 bg-gray-50">
                      {/* Check-in section */}
                      <div className="rounded-lg border border-green-200 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50">
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                          <span className="text-green-700 font-semibold text-sm">Điểm danh đến</span>
                          {checkInTime && checkInTime !== '—' ? (
                            <span className="ml-auto text-xs font-bold px-2 py-0.5 bg-green-600 text-white rounded-full">
                              {checkInTime}
                            </span>
                          ) : (
                            <span className="ml-auto text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                              Chưa điểm danh
                            </span>
                          )}
                        </div>
                        <div className="px-3 py-3 space-y-3">
                          <div className="space-y-1.5 text-sm">
                            <div className="flex gap-2">
                              <span className="text-gray-500 w-20 flex-shrink-0">Giờ đến:</span>
                              <span className="font-medium text-gray-800">{checkInTime || '—'}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-gray-500 w-20 flex-shrink-0">Người đưa:</span>
                              <span className="font-medium text-gray-800">{attendance.deliverer || '—'}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-gray-500 w-20 flex-shrink-0">Ghi chú:</span>
                              <span className="font-medium text-gray-800">{attendance.note || 'Không có ghi chú.'}</span>
                            </div>
                          </div>
                          {/* Check-in photo */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1.5">Ảnh check-in</p>
                            {attendance.checkinImageName ? (
                              <a href={attendance.checkinImageName} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={attendance.checkinImageName}
                                  alt="Ảnh check-in"
                                  className="w-full h-40 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/300x200?text=Ảnh+lỗi';
                                    e.target.alt = 'Không tải được ảnh';
                                  }}
                                />
                              </a>
                            ) : (
                              <div className="w-full h-32 border-2 border-dashed border-green-200 rounded-lg flex items-center justify-center text-green-300 text-xs">
                                Chưa có ảnh
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Check-out section */}
                      <div className="rounded-lg border border-blue-200 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                          <span className="text-blue-700 font-semibold text-sm">Điểm danh về</span>
                          {checkOutTime && checkOutTime !== '—' ? (
                            <span className="ml-auto text-xs font-bold px-2 py-0.5 bg-blue-600 text-white rounded-full">
                              {checkOutTime}
                            </span>
                          ) : (
                            <span className="ml-auto text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                              Chưa điểm danh
                            </span>
                          )}
                        </div>
                        <div className="px-3 py-3 space-y-3">
                          <div className="space-y-1.5 text-sm">
                            <div className="flex gap-2">
                              <span className="text-gray-500 w-20 flex-shrink-0">Giờ về:</span>
                              <span className="font-medium text-gray-800">{checkOutTime || '—'}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-gray-500 w-20 flex-shrink-0">Người nhận:</span>
                              <span className="font-medium text-gray-800">{attendance.receiver || '—'}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-gray-500 w-20 flex-shrink-0">Xác nhận:</span>
                              <span className="font-medium text-gray-800">{attendance.parentConfirm || 'Chưa xác nhận'}</span>
                            </div>
                          </div>
                          {/* Check-out photo */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1.5">Ảnh check-out</p>
                            {attendance.checkoutImageName ? (
                              <a href={attendance.checkoutImageName} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={attendance.checkoutImageName}
                                  alt="Ảnh check-out"
                                  className="w-full h-40 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/300x200?text=Ảnh+lỗi';
                                    e.target.alt = 'Không tải được ảnh';
                                  }}
                                />
                              </a>
                            ) : (
                              <div className="w-full h-32 border-2 border-dashed border-blue-200 rounded-lg flex items-center justify-center text-blue-300 text-xs">
                                Chưa có ảnh
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendanceReport;
