import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';

const getLocalISODate = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

function AttendanceOverview() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const { getAttendanceOverview, loading, error } = useSchoolAdmin();

  const [selectedDate, setSelectedDate] = useState(getLocalISODate);
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState(null);

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

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, user, isInitializing, selectedDate, selectedGrade, selectedClass, selectedStatus]);

  const fetchData = async () => {
    try {
      const params = {
        date: selectedDate,
        ...(selectedGrade !== 'all' && { gradeId: selectedGrade }),
        ...(selectedClass !== 'all' && { classId: selectedClass }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
      };
      const response = await getAttendanceOverview(params);
      setData(response);
    } catch (err) {
      console.error('Error fetching attendance overview:', err);
      // Nếu API lỗi, vẫn hiển thị trang với dữ liệu rỗng để không bị trắng
      setData({ data: { classes: [] } });
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
    if (key === 'attendance') {
      navigate('/school-admin/attendance/overview');
      return;
    }
  };

  const userName = user?.fullName || user?.username || 'School Admin';

  // Tính toán thống kê
  const stats = useMemo(() => {
    const currentData = data || { data: { classes: [] } };
    if (!currentData?.data) {
      return {
        totalClasses: 0,
        totalStudents: 0,
        present: 0,
        notCheckedOut: 0,
      };
    }

    const classes = currentData.data.classes || [];
    const totalClasses = classes.length;
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.totalStudents || 0), 0);
    const present = classes.reduce((sum, cls) => sum + (cls.present || 0), 0);
    const notCheckedOut = classes.reduce((sum, cls) => sum + (cls.notCheckedOut || 0), 0);

    return {
      totalClasses,
      totalStudents,
      present,
      notCheckedOut,
    };
  }, [data]);

  // Xác định trạng thái lớp
  const getClassStatus = (cls) => {
    const { present = 0, absent = 0, notCheckedOut = 0, totalStudents = 0 } = cls;

    if (notCheckedOut > 0) {
      return { text: 'Cần theo dõi', color: 'text-orange-600' };
    }
    if (present === totalStudents && absent === 0) {
      return { text: 'Đầy đủ', color: 'text-green-600' };
    }
    if (present < totalStudents) {
      return { text: 'Thiếu sĩ số', color: 'text-red-600' };
    }
    return { text: 'Bình thường', color: 'text-gray-600' };
  };

  // Lọc và tìm kiếm
  const filteredClasses = useMemo(() => {
    const currentData = data || { data: { classes: [] } };
    if (!currentData?.data?.classes) return [];

    let filtered = currentData.data.classes;

    // Lọc theo khối
    if (selectedGrade !== 'all') {
      filtered = filtered.filter((cls) => cls.gradeName === selectedGrade);
    }

    // Lọc theo lớp
    if (selectedClass !== 'all') {
      filtered = filtered.filter((cls) => cls._id === selectedClass);
    }

    // Lọc theo trạng thái
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((cls) => {
        const status = getClassStatus(cls);
        if (selectedStatus === 'complete') return status.text === 'Đầy đủ';
        if (selectedStatus === 'missing') return status.text === 'Thiếu sĩ số';
        if (selectedStatus === 'monitoring') return status.text === 'Cần theo dõi';
        return true;
      });
    }

    // Lọc theo tên lớp
    if (searchTerm) {
      filtered = filtered.filter((cls) =>
        cls.className?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [data, searchTerm, selectedGrade, selectedClass, selectedStatus]);

  // Lấy danh sách khối từ dữ liệu
  const grades = useMemo(() => {
    const currentData = data || { data: { classes: [] } };
    if (!currentData?.data?.classes) return [];
    const gradeSet = new Set();
    currentData.data.classes.forEach((cls) => {
      if (cls.gradeName) gradeSet.add(cls.gradeName);
    });
    return Array.from(gradeSet).sort();
  }, [data]);

  // Lấy danh sách lớp từ dữ liệu
  const classes = useMemo(() => {
    const currentData = data || { data: { classes: [] } };
    if (!currentData?.data?.classes) return [];
    return currentData.data.classes.map((cls) => ({
      _id: cls._id,
      className: cls.className,
    }));
  }, [data]);

  return (
    <RoleLayout
      title="Điểm danh các lớp (Hôm nay)"
      description="Xem tổng quan điểm danh của tất cả các lớp trong trường."
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

      {/* Nút điều hướng menu */}
      <div className="mb-4 bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Điều hướng:</span>
          {menuItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                if (item.key === 'overview') {
                  navigate('/school-admin');
                } else if (item.key === 'classes') {
                  navigate('/school-admin/classes');
                } else if (item.key === 'contacts') {
                  navigate('/school-admin/contacts');
                } else {
                  handleMenuSelect(item.key);
                }
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                item.key === 'attendance'
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Khối</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả khối</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Lớp</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả lớp</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.className}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Trạng thái</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="complete">Đầy đủ</option>
              <option value="missing">Thiếu sĩ số</option>
              <option value="monitoring">Cần theo dõi</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tìm theo tên lớp</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên lớp"
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-100">
          <div className="text-sm font-semibold text-gray-700 mb-1">Tổng số lớp</div>
          <div className="text-2xl font-bold text-blue-700">{stats.totalClasses}</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-100">
          <div className="text-sm font-semibold text-gray-700 mb-1">Tổng sĩ số</div>
          <div className="text-2xl font-bold text-blue-700">{stats.totalStudents}</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-100">
          <div className="text-sm font-semibold text-gray-700 mb-1">Có mặt</div>
          <div className="text-2xl font-bold text-blue-700">{stats.present}</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-100">
          <div className="text-sm font-semibold text-gray-700 mb-1">Chưa check-out</div>
          <div className="text-2xl font-bold text-blue-700">{stats.notCheckedOut}</div>
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
        ) : filteredClasses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Không có dữ liệu điểm danh.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800 w-[70px]">STT</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Lớp</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Khối</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">Sĩ số</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">Có mặt</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">Nghỉ</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">Chưa check-out</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Trạng thái</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((cls, idx) => {
                  const status = getClassStatus(cls);
                  return (
                    <tr key={cls._id || idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{cls.className || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{cls.gradeName || '—'}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{cls.totalStudents || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{cls.present || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{cls.absent || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{cls.notCheckedOut || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${status.color}`}>{status.text}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/school-admin/classes/${cls._id}/attendance?date=${selectedDate}`)}
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
    </RoleLayout>
  );
}

export default AttendanceOverview;
