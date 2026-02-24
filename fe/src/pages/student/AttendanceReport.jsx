import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';

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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Tiêu đề giống màn SchoolAdmin */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <h2 className="text-lg font-semibold text-gray-800">Báo cáo điểm danh</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/student')}
                className="hidden md:inline-flex px-4 py-2 text-sm font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                ← Quay lại Dashboard
              </button>
            </div>
          </div>

          {/* Thông tin học sinh */}
          <div className="bg-green-50 px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center text-sm md:text-base text-gray-800">
              <p>
                👶 Trẻ: <span className="font-semibold">{studentName}</span>
              </p>
              <p>
                🏫 Lớp: <span className="font-semibold">{className}</span>
              </p>
            </div>
          </div>

          {/* Bộ lọc tháng/năm */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tháng
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {months.map((month) => (
                    <option key={month} value={month}>
                      Tháng {String(month).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Năm
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

          {/* Thẻ thống kê */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="text-sm font-semibold text-gray-700 mb-1">Ngày học</div>
                <div className="text-2xl font-bold text-green-700">{stats.totalDays}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="text-sm font-semibold text-gray-700 mb-1">Có mặt</div>
                <div className="text-2xl font-bold text-green-700">{stats.present}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="text-sm font-semibold text-gray-700 mb-1">Nghỉ học</div>
                <div className="text-2xl font-bold text-green-700">{stats.absent}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="text-sm font-semibold text-gray-700 mb-1">Đi trễ</div>
                <div className="text-2xl font-bold text-green-700">{stats.late}</div>
              </div>
            </div>
          </div>

          {/* Bảng lịch sử */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin">
                <div className="h-6 w-6 border-3 border-emerald-500 border-t-transparent rounded-full" />
              </div>
              <p className="mt-2 text-sm text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : attendances.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Không có dữ liệu điểm danh.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">
                      Ngày
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-800">
                      Đến
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-800">
                      Về
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((attendance, idx) => {
                    const status = getStatusText(attendance);
                    const checkInTime =
                      attendance?.timeString?.checkIn ||
                      formatTime(attendance?.time?.checkIn);
                    const checkOutTime =
                      attendance?.timeString?.checkOut ||
                      formatTime(attendance?.time?.checkOut);
                    const attendanceDate = formatDate(attendance?.date, true);

                    return (
                      <tr
                        key={attendance._id || idx}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {attendanceDate}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {checkInTime}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {checkOutTime}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${status.color}`}>
                            {status.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Nút quay lại Dashboard (giống bố cục SchoolAdmin) */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-center md:hidden">
            <button
              type="button"
              onClick={() => navigate('/student')}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
            >
              <span>←</span>
              <span>Quay lại Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceReport;






