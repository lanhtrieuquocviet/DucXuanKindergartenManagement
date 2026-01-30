import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RoleLayout from '../../components/RoleLayout';
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
  const { user, hasRole, logout } = useAuth();

  useEffect(() => {
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
  }, [navigate, user, hasRole, classId]);

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
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Header Section */}
      <div className="mb-6">
        <button
          onClick={handleGoBack}
          className="mb-4 text-sm text-sky-600 hover:text-sky-700 font-medium transition"
        >
          ← Quay lại danh sách lớp
        </button>

        {classInfo && (
          <div className="mb-4">
            <h2 className="text-lg font-bold text-sky-900">
              Lớp {classInfo.className}
            </h2>
            <p className="text-sm text-sky-600 mt-1">
              Khối: {classInfo.gradeId?.gradeName || 'N/A'} | Năm học: {classInfo.academicYearId?.yearName || 'N/A'}
            </p>
          </div>
        )}

        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="Tìm kiếm tên học sinh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-sky-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <button
            onClick={fetchStudents}
            className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition"
          >
            Tải lại
          </button>
          <button className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition">
            + Thêm học sinh
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-sky-100 bg-sky-50/80 p-4">
          <h3 className="text-sm font-semibold text-sky-900">Tổng học sinh</h3>
          <p className="mt-2 text-2xl font-bold text-sky-800">{students.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
          <h3 className="text-sm font-semibold text-emerald-900">Nam</h3>
          <p className="mt-2 text-2xl font-bold text-emerald-800">
            {students.filter(s => s.gender === 'male').length}
          </p>
        </div>
        <div className="rounded-xl border border-pink-100 bg-pink-50/80 p-4">
          <h3 className="text-sm font-semibold text-pink-900">Nữ</h3>
          <p className="mt-2 text-2xl font-bold text-pink-800">
            {students.filter(s => s.gender === 'female').length}
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
            <p className="mt-2 text-sm text-sky-600">Đang tải danh sách học sinh...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-sky-600">Không tìm thấy học sinh nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sky-50 border-b border-sky-100">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-sky-900">Tên học sinh</th>
                  <th className="px-6 py-3 text-left font-semibold text-sky-900">Giới tính</th>
                  <th className="px-6 py-3 text-left font-semibold text-sky-900">Ngày sinh</th>
                  <th className="px-6 py-3 text-left font-semibold text-sky-900">Điện thoại</th>
                  <th className="px-6 py-3 text-left font-semibold text-sky-900">Địa chỉ</th>
                  <th className="px-6 py-3 text-center font-semibold text-sky-900">Trạng thái</th>
                  <th className="px-6 py-3 text-center font-semibold text-sky-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student._id || index} className="border-b border-sky-50 hover:bg-sky-50/50 transition">
                    <td className="px-6 py-3">
                      <div className="font-medium text-sky-900">{student.fullName}</div>
                      {student.userId?.email && (
                        <div className="text-xs text-sky-600">{student.userId.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        student.gender === 'male' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-pink-100 text-pink-800'
                      }`}>
                        {student.gender === 'male' ? 'Nam' : student.gender === 'female' ? 'Nữ' : 'Khác'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-sky-700">
                        {student.dateOfBirth 
                          ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN')
                          : 'N/A'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-sky-700">{student.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-sky-700 truncate max-w-xs" title={student.address || 'N/A'}>
                        {student.address || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        student.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center space-x-2">
                      <button className="inline-block px-3 py-1 bg-sky-100 text-sky-700 text-xs font-medium rounded-lg hover:bg-sky-200 transition">
                        Xem
                      </button>
                      <button className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-200 transition">
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
