import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';

function StudentInClass() {
  const { classId } = useParams();
  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
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

    if (!classId) {
      navigate('/school-admin/classes', { replace: true });
      return;
    }

    fetchStudents();
  }, [navigate, user, hasRole, classId, isInitializing]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.CLASSES.STUDENTS(classId));
      setStudents(response.data || []);
      if (response.classInfo) {
        setClassInfo(response.classInfo);
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách học sinh');
      console.error('Error fetching students:', err);
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

  const handleGoBack = () => {
    if (hasRole('SystemAdmin')) {
      navigate('/system-admin/classes');
    } else {
      navigate('/school-admin/classes');
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
    ];
  };

  const handleMenuSelect = (key) => {
    if (key === 'classes') {
      if (hasRole('SystemAdmin')) {
        navigate('/system-admin/classes');
      } else {
        navigate('/school-admin/classes');
      }
      return;
    }
    // Các mục khác có thể tách route riêng sau
  };

  // Lọc danh sách học sinh theo từ khóa tìm kiếm
  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RoleLayout
      title="Quản lý Học Sinh"
      description="Xem danh sách học sinh trong lớp, quản lý thông tin chi tiết."
      menuItems={getMenuItems()}
      activeKey="classes"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
      userName={user?.fullName || user?.username || 'Admin'}
    >
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        {/* Header + bộ lọc */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <button
              onClick={handleGoBack}
              className="mb-3 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <span className="text-sm">←</span>
              <span>Quay lại danh sách lớp</span>
            </button>

            <h3 className="text-sm font-semibold text-gray-800">
              {classInfo ? `Lớp ${classInfo.className}` : 'Danh sách học sinh'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {classInfo && (
                <>
                  Khối:{' '}
                  <span className="font-semibold">
                    {classInfo.gradeId?.gradeName || 'N/A'}
                  </span>{' '}
                  • Năm học:{' '}
                  <span className="font-semibold">
                    {classInfo.academicYearId?.yearName || 'N/A'}
                  </span>{' '}
                  •{' '}
                </>
              )}
              Tổng học sinh:{' '}
              <span className="font-semibold">{students.length}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Tìm kiếm tên học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={fetchStudents}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
            >
              Tải lại
            </button>
            <button
              type="button"
              className="px-3 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors"
            >
              + Thêm học sinh
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Tổng học sinh
            </h4>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {students.length}
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Nam
            </h4>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {students.filter((s) => s.gender === 'male').length}
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Nữ
            </h4>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {students.filter((s) => s.gender === 'female').length}
            </p>
          </div>
        </div>

        {/* Table Section */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin">
              <div className="h-6 w-6 border-3 border-indigo-500 border-t-transparent rounded-full" />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Đang tải danh sách học sinh...
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">
              Không tìm thấy học sinh nào
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">
                    Tên học sinh
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">
                    Giới tính
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">
                    Ngày sinh
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">
                    Điện thoại
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">
                    Địa chỉ
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr
                    key={student._id || index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {student.fullName}
                      </div>
                      {student.userId?.email && (
                        <div className="text-xs text-gray-500">
                          {student.userId.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          student.gender === 'male'
                            ? 'bg-blue-50 text-blue-700'
                            : student.gender === 'female'
                            ? 'bg-pink-50 text-pink-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {student.gender === 'male'
                          ? 'Nam'
                          : student.gender === 'female'
                          ? 'Nữ'
                          : 'Khác'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">
                        {student.dateOfBirth
                          ? new Date(
                              student.dateOfBirth,
                            ).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">
                        {student.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="text-gray-700 truncate max-w-xs"
                        title={student.address || 'N/A'}
                      >
                        {student.address || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          student.status === 'active'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {student.status === 'active'
                          ? 'Hoạt động'
                          : 'Không hoạt động'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        type="button"
                        className="inline-flex items-center rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        Xem
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                      >
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

export default StudentInClass;
