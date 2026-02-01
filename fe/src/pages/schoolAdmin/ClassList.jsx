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
    // Các mục khác có thể tách route riêng sau
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
    ];
  };

  // Lọc danh sách lớp theo từ khóa tìm kiếm
  const filteredClasses = classes.filter(cls =>
    cls.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    >
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Header Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-sky-900 mb-4">Danh sách lớp học</h2>

        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="Tìm kiếm tên lớp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-sky-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <button
            onClick={fetchClasses}
            className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition"
          >
            Tải lại
          </button>
          <button className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition">
            + Thêm lớp
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4">
          <h3 className="text-sm font-semibold text-amber-900">Tổng số lớp</h3>
          <p className="mt-2 text-2xl font-bold text-amber-800">{classes.length}</p>
        </div>
        <div className="rounded-xl border border-sky-100 bg-sky-50/80 p-4">
          <h3 className="text-sm font-semibold text-sky-900">Lớp hoạt động</h3>
          <p className="mt-2 text-2xl font-bold text-sky-800">
            {classes.filter(c => c.className).length}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
          <h3 className="text-sm font-semibold text-emerald-900">Sức chứa tổng</h3>
          <p className="mt-2 text-2xl font-bold text-emerald-800">
            {classes.reduce((sum, c) => sum + (c.maxStudents || 0), 0)}
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-sky-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin">
              <div className="h-6 w-6 border-3 border-sky-400 border-t-transparent rounded-full"></div>
            </div>
            <p className="mt-2 text-sm text-sky-600">Đang tải danh sách...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-sky-600">Không tìm thấy lớp học nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sky-50 border-b border-sky-100">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-sky-900">Tên lớp</th>
                  <th className="px-6 py-3 text-left font-semibold text-sky-900">Khối lớp</th>
                  <th className="px-6 py-3 text-left font-semibold text-sky-900">Năm học</th>
                  <th className="px-6 py-3 text-center font-semibold text-sky-900">Sức chứa</th>
                  <th className="px-6 py-3 text-center font-semibold text-sky-900">Giáo viên</th>
                  <th className="px-6 py-3 text-center font-semibold text-sky-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((cls, index) => (
                  <tr key={cls._id || index} className="border-b border-sky-50 hover:bg-sky-50/50 transition">
                    <td className="px-6 py-3">
                      <div className="font-medium text-sky-900">{cls.className}</div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-sky-700">
                        {cls.gradeId?.gradeName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-sky-700">
                        {cls.academicYearId?.yearName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                        {cls.maxStudents || 0}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="text-sky-700 font-medium">
                        {cls.teacherIds?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center space-x-2">
                      <button
                        onClick={() => handleViewStudents(cls._id)}
                        className="inline-block px-3 py-1 bg-sky-500 text-white text-xs font-medium rounded-lg hover:bg-sky-600 transition"
                      >
                        Xem học sinh
                      </button>
                      <button className="inline-block px-3 py-1 bg-sky-100 text-sky-700 text-xs font-medium rounded-lg hover:bg-sky-200 transition">
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
