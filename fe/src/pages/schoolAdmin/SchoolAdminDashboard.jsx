import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';

function SchoolAdminDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const { getDashboard, loading, error } = useSchoolAdmin();

  useEffect(() => {
    // Chờ quá trình khởi tạo (verify token) hoàn thành
    if (isInitializing) {
      return;
    }

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('SchoolAdmin')) {
      navigate('/', { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        const response = await getDashboard();
        setData(response);
      } catch (err) {
        // Error được xử lý trong context
      }
    };

    fetchData();
  }, [navigate, user, getDashboard, isInitializing]);

  const menuItems = [
    { key: 'overview', label: 'Tổng quan trường' },
    { key: 'classes', label: 'Lớp học' },
    { key: 'teachers', label: 'Giáo viên' },
    { key: 'students', label: 'Học sinh & phụ huynh' },
    { key: 'assets', label: 'Quản lý tài sản' },
    { key: 'reports', label: 'Báo cáo của trường' },
  ];

  const userName = user?.fullName || user?.username || 'School Admin';

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const handleMenuSelect = (key) => {
    if (key === 'overview') return;
    if (key === 'classes') {
      navigate('/school-admin/classes');
      return;
    }
    // Các mục khác có thể mapping route sau
  };

  return (
    <RoleLayout
      title="Bảng điều khiển của Ban giám hiệu"
      description="Quản lý trường, lớp học, giáo viên và phụ huynh trong phạm vi trường."
      menuItems={menuItems}
      activeKey="overview"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
    >
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Số lớp đang hoạt động</h2>
          <p className="mt-2 text-2xl font-bold text-gray-800">8</p>
          <p className="mt-1 text-xs text-gray-500">Ví dụ thống kê số lớp trong trường.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Số giáo viên</h2>
          <p className="mt-2 text-2xl font-bold text-gray-800">15</p>
          <p className="mt-1 text-xs text-gray-500">Tổng số giáo viên thuộc trường.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Học sinh</h2>
          <p className="mt-2 text-2xl font-bold text-gray-800">120</p>
          <p className="mt-1 text-xs text-gray-500">Tổng số học sinh trong các lớp.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Dữ liệu trả về từ API</h3>
        {loading && (
          <p className="text-sm text-gray-500">Đang tải...</p>
        )}
        {!loading && (
          <pre className="text-xs text-gray-700 overflow-auto max-h-80 bg-gray-50 p-4 rounded">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </RoleLayout>
  );
}

export default SchoolAdminDashboard;
