import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';

function ClassList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { user, hasRole, logout, isInitializing } = useAuth();

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (!hasRole('SchoolAdmin') && !hasRole('SystemAdmin')) {
      navigate('/', { replace: true });
      return;
    }

    fetchClasses();
  }, [navigate, user, hasRole, isInitializing]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.CLASSES.LIST);
      console.log('=== FRONTEND DEBUG: fetchClasses ===');
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      console.log('Data length:', response.data ? response.data.length : 'null');
      console.log('=== END DEBUG ===');
      setClasses(response.data || []);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách lớp học');
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const handleViewStudents = (classId) => {
    navigate(`/school-admin/classes/${classId}/students`);
  };

  const handleMenuSelect = (key) => {
    if (key === 'classes') {
      // Đang ở đây rồi
      return;
    }
    if (key === 'contacts') {
      navigate('/school-admin/contacts');
      return;
    }
    if (key === 'overview') {
      navigate('/school-admin');
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
    if (key === 'public-info') {
      navigate('/school-admin/public-info');
      return;
    }
    if (key === 'attendance') {
      navigate('/school-admin/attendance/overview');
      return;
    }
  };

  // Render menu khác nhau tùy theo role
  const getMenuItems = () => {
    if (hasRole('SystemAdmin')) {
      return [
        { key: 'overview', label: 'Tổng quan hệ thống' },
        { key: 'schools', label: 'Quản lý trường' },
        { key: 'accounts', label: 'Quản lý tài khoản' },
        { key: 'classes', label: 'Lớp học (toàn hệ thống)' },
        { key: 'roles', label: 'Phân quyền & vai trò' },
        { key: 'reports', label: 'Báo cáo tổng hợp' },
      ];
    }
    // Default menu cho SchoolAdmin
    return [
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
    { key: 'public-info', label: 'Thông tin công khai' },
      { key: 'attendance', label: 'Quản lý điểm danh' },
    ];
  };

  // Lọc danh sách lớp theo từ khóa tìm kiếm
  const filteredClasses = classes.filter(cls =>
    cls.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClasses = classes.length;
  const activeClasses = classes.filter((c) => c.className).length;
  const totalCapacity = classes.reduce((sum, c) => sum + (c.maxStudents || 0), 0);

  return (
    <RoleLayout
      title="Quản lý Lớp Học"
      description="Xem danh sách tất cả lớp học, quản lý thông tin chi tiết và học sinh."
      menuItems={getMenuItems()}
      activeKey="classes"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
      userName={user?.fullName || user?.username || 'Admin'}
      userAvatar={user?.avatar}
    >
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-4 py-3">
          {error}
        </div>
      )}

      {/* Card chính: danh sách lớp học */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Header + bộ lọc */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Danh sách lớp học</h3>
            <p className="text-xs text-gray-500 mt-1">
              Tổng lớp: <span className="font-semibold">{totalClasses}</span> • Lớp hoạt động:{' '}
              <span className="font-semibold">{activeClasses}</span> • Sức chứa tổng:{' '}
              <span className="font-semibold">{totalCapacity}</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Tìm kiếm tên lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={fetchClasses}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
            >
              Tải lại
            </button>
            <button
              type="button"
              className="px-3 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors"
            >
              + Thêm lớp
            </button>
          </div>
        </div>

        {/* Table Section */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin">
              <div className="h-6 w-6 border-3 border-indigo-500 border-t-transparent rounded-full" />
            </div>
            <p className="mt-2 text-sm text-gray-500">Đang tải danh sách...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">Không tìm thấy lớp học nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Tên lớp</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Khối lớp</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Năm học</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">Sức chứa</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">Giáo viên</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((cls, index) => (
                  <tr
                    key={cls._id || index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{cls.className}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">
                        {cls.gradeId?.gradeName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">
                        {cls.academicYearId?.yearName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                        {cls.maxStudents || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-800 font-medium">
                        {cls.teacherIds?.length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        onClick={() => handleViewStudents(cls._id)}
                        className="inline-flex items-center rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        Xem học sinh
                      </button>
                      <button className="inline-flex items-center rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleLayout>
  );
}

export default ClassList;
