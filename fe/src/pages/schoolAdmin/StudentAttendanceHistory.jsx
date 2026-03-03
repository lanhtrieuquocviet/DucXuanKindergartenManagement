import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';

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
  // Nếu là format HH:mm thì trả về luôn
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  // Nếu là Date object hoặc ISO string thì format
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

// Hàm kiểm tra đi trễ (sau 7:30 sáng)
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
    // Đi trễ nếu sau 7:30
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

function StudentAttendanceHistory() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, logout, isInitializing } = useAuth();
  const { getStudentAttendanceHistory, loading, error } = useSchoolAdmin();

  const [studentInfo, setStudentInfo] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statsFromApi, setStatsFromApi] = useState(null);

  useEffect(() => {
    if (isInitializing) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('SchoolAdmin')) {
      navigate('/', { replace: true });
      return;
    }

    if (studentId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, user, isInitializing, studentId, selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      // Tính toán từ ngày và đến ngày dựa trên tháng và năm
      const fromDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const toDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      
      const params = { from: fromDate, to: toDate };
      const response = await getStudentAttendanceHistory(studentId, params);
      if (response?.data) {
        setStudentInfo(response.data.studentInfo);
        setAttendances(response.data.attendances || []);
        setStatsFromApi(response.data.stats || null);
      }
    } catch (err) {
      console.error('Error fetching student attendance history:', err);
    }
  };

  const menuItems = [
    { key: 'overview', label: 'Tổng quan trường' },
    { key: 'classes', label: 'Lớp học' },
    { key: 'teachers', label: 'Giáo viên' },
    { key: 'students', label: 'Học sinh & phụ huynh' },
    { key: 'assets', label: 'Quản lý tài sản' },
    { key: 'reports', label: 'Báo cáo của trường' },
    { key: 'contacts', label: 'Liên hệ' },
    { key: 'qa', label: 'Câu hỏi' },
    { key: 'blogs', label: 'Quản lý blog' },
    { key: 'documents', label: 'Quản lý tài liệu' },
    { key: 'attendance', label: 'Quản lý điểm danh' },
  ];

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      navigate('/school-admin');
      return;
    }
    if (key === 'classes') {
      navigate('/school-admin/classes');
      return;
    }
    if (key === 'contacts') {
      navigate('/school-admin/contacts');
      return;
    }
    if (key === 'qa') {
      navigate('/school-admin/qa');
      return;
    }
    if (key === 'blogs') {
      navigate('/school-admin/blogs');
      return;
    }
    if (key === 'documents') {
      navigate('/school-admin/documents');
      return;
    }
    if (key === 'attendance') {
      navigate('/school-admin/attendance/overview');
      return;
    }
  };

  const userName = user?.fullName || user?.username || 'School Admin';

  // Tính toán thống kê
  const stats = useMemo(() => {
    if (statsFromApi) {
      return statsFromApi;
    }
    const totalDays = attendances.length;
    const present = attendances.filter((att) => att.status === 'present').length;
    const absent = attendances.filter((att) => att.status === 'absent').length;
    const late = attendances.filter((att) => {
      if (att.status !== 'present') return false;
      const checkInTime = att?.timeString?.checkIn || att?.time?.checkIn;
      return isLate(checkInTime);
    }).length;

    return {
      totalDays,
      present,
      absent,
      late,
    };
  }, [attendances, statsFromApi]);

  // Tạo danh sách tháng và năm
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <RoleLayout
      title="Màn hình lịch sử thông tin điểm danh của học sinh"
      description="Từ màn hình chi tiết điểm danh của 1 học sinh, chọn Lịch sử điểm danh → Hiển thị màn hình Lịch sử điểm danh"
      menuItems={menuItems}
      activeKey="attendance"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Card báo cáo điểm danh */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Tiêu đề báo cáo */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <h2 className="text-lg font-semibold text-gray-800">Báo cáo điểm danh</h2>
            </div>
          </div>

          {/* Thông tin học sinh */}
          <div className="bg-green-50 px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">😊</span>
                <span className="text-sm font-semibold text-gray-700">
                  Trẻ: {studentInfo?.fullName || '—'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🏠</span>
                <span className="text-sm font-semibold text-gray-700">
                  Lớp: {studentInfo?.className || '—'}
                </span>
              </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                <div className="h-6 w-6 border-3 border-indigo-500 border-t-transparent rounded-full" />
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
                    const attendanceDate = formatDate(attendance?.date, false);

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
        </div>

        {/* Nút quay lại */}
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => {
              const date = searchParams.get('date');
              const classId = searchParams.get('classId');
              if (date && classId) {
                navigate(`/school-admin/classes/${classId}/attendance?date=${date}`);
              } else if (date) {
                navigate(`/school-admin/students/${studentId}/attendance?date=${date}`);
              } else {
                navigate('/school-admin/attendance/overview');
              }
            }}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <span>←</span>
            <span>Quay lại Dashboard</span>
          </button>
        </div>
      </div>
    </RoleLayout>
  );
}

export default StudentAttendanceHistory;
