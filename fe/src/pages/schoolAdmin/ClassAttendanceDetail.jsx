import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';

const getLocalISODate = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
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

const getStatusText = (attendance) => {
  if (!attendance || attendance.status === 'absent') {
    return { text: 'Nghỉ học', color: 'text-red-600' };
  }
  if (attendance.status === 'present') {
    if (attendance.time?.checkIn && !attendance.time?.checkOut) {
      return { text: 'Chưa check-out', color: 'text-orange-600' };
    }
    if (attendance.time?.checkIn && attendance.time?.checkOut) {
      return { text: 'Hoàn thành điểm danh', color: 'text-blue-600' };
    }
    return { text: 'Có mặt', color: 'text-green-600' };
  }
  return { text: '—', color: 'text-gray-600' };
};

function ClassAttendanceDetail() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, logout, isInitializing } = useAuth();
  const { getClassAttendanceDetail, loading, error } = useSchoolAdmin();

  const [selectedDate, setSelectedDate] = useState(
    searchParams.get('date') || getLocalISODate()
  );
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  const currentClassId = classId || classInfo?._id;

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

    if (classId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, user, isInitializing, classId, selectedDate]);

  const fetchData = async () => {
    try {
      const response = await getClassAttendanceDetail(classId, {
        date: selectedDate,
      });
      if (response?.data) {
        setClassInfo(response.data.classInfo);
        setStudents(response.data.students || []);
        setClasses(response.data.classes || []);
      }
    } catch (err) {
      console.error('Error fetching class attendance detail:', err);
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
    const totalStudents = students.length;
    const present = students.filter(
      (s) => s.attendance && s.attendance.status === 'present'
    ).length;
    // Nghỉ học bao gồm: có status = 'absent' HOẶC không có attendance record
    const absent = students.filter(
      (s) => !s.attendance || s.attendance.status === 'absent'
    ).length;
    const notCheckedOut = students.filter(
      (s) =>
        s.attendance &&
        s.attendance.status === 'present' &&
        s.attendance.time?.checkIn &&
        !s.attendance.time?.checkOut
    ).length;

    return {
      totalStudents,
      present,
      absent,
      notCheckedOut,
    };
  }, [students]);

  // Lọc học sinh
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Lọc theo trạng thái
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((s) => {
        if (selectedStatus === 'present') {
          return s.attendance && s.attendance.status === 'present';
        }
        if (selectedStatus === 'absent') {
          return s.attendance && s.attendance.status === 'absent';
        }
        if (selectedStatus === 'notCheckedOut') {
          return (
            s.attendance &&
            s.attendance.status === 'present' &&
            s.attendance.time?.checkIn &&
            !s.attendance.time?.checkOut
          );
        }
        return true;
      });
    }

    // Tìm kiếm theo tên
    if (searchTerm) {
      filtered = filtered.filter((s) =>
        s.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [students, selectedStatus, searchTerm]);

  const handleClassChange = (newClassId) => {
    if (newClassId && newClassId !== classId) {
      navigate(`/school-admin/classes/${newClassId}/attendance?date=${selectedDate}`);
    }
  };

  return (
    <RoleLayout
      title={`Điểm danh lớp ${classInfo?.className || ''}`}
      description="Xem chi tiết điểm danh của từng học sinh trong lớp."
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

      {/* Bộ lọc và tìm kiếm */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Ngày
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Lớp
            </label>
            <select
              value={classId || ''}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.className}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="present">Có mặt</option>
              <option value="absent">Nghỉ học</option>
              <option value="notCheckedOut">Chưa check-out</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tìm theo tên học sinh
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên học sinh..."
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-100">
          <div className="text-sm font-semibold text-gray-700 mb-1">Sĩ số</div>
          <div className="text-2xl font-bold text-green-700">
            {stats.totalStudents}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-100">
          <div className="text-sm font-semibold text-gray-700 mb-1">Có mặt</div>
          <div className="text-2xl font-bold text-green-700">
            {stats.present}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-100">
          <div className="text-sm font-semibold text-gray-700 mb-1">
            Nghỉ học
          </div>
          <div className="text-2xl font-bold text-green-700">
            {stats.absent}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-100">
          <div className="text-sm font-semibold text-gray-700 mb-1">
            Chưa check-out
          </div>
          <div className="text-2xl font-bold text-green-700">
            {stats.notCheckedOut}
          </div>
        </div>
      </div>

      {/* Bảng điểm danh */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin">
              <div className="h-6 w-6 border-3 border-indigo-500 border-t-transparent rounded-full" />
            </div>
            <p className="mt-2 text-sm text-gray-500">Đang tải dữ liệu...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Không có dữ liệu điểm danh.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800 w-[70px]">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">
                    Học sinh
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">
                    Đến
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">
                    Về
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">
                    Người đưa
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">
                    Người đón
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, idx) => {
                  const attendance = student.attendance;
                  const status = getStatusText(attendance);
                  const checkInTime = attendance?.timeString?.checkIn || 
                                     formatTime(attendance?.time?.checkIn);
                  const checkOutTime = attendance?.timeString?.checkOut || 
                                      formatTime(attendance?.time?.checkOut);
                  
                  // Lấy thông tin người đưa/đón từ attendance
                  const deliverer = attendance?.delivererType || '—';
                  const receiver = attendance?.receiverType || '—';

                  return (
                    <tr
                      key={student._id || idx}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-700">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {student.fullName || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {checkInTime}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {checkOutTime}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{deliverer}</td>
                      <td className="px-4 py-3 text-gray-700">{receiver}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            navigate(`/school-admin/students/${student._id}/attendance?date=${selectedDate}&classId=${currentClassId}`);
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Xem
                        </button>
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
            navigate('/school-admin/attendance/overview');
          }}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <span>←</span>
          <span>Quay lại Dashboard</span>
        </button>
      </div>
    </RoleLayout>
  );
}

export default ClassAttendanceDetail;
