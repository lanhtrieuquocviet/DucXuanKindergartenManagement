import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSystemAdmin } from '../../context/SystemAdminContext';
import RoleLayout from '../../layouts/RoleLayout';

function SystemAdminDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const { getDashboard, loading, error } = useSystemAdmin();

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
    if (!userRoles.includes('SystemAdmin')) {
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
    { key: 'overview', label: 'Tổng quan hệ thống' },
    { key: 'schools', label: 'Quản lý trường' },
    { key: 'accounts', label: 'Quản lý tài khoản' },
    { key: 'roles', label: 'Quản lý vai trò' },
    { key: 'permissions', label: 'Quản lý phân quyền' },
    { key: 'reports', label: 'Báo cáo tổng hợp' },
  ];

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      return;
    }
    if (key === 'accounts') {
      navigate('/system-admin/manage-accounts');
      return;
    }
    if (key === 'roles') {
      navigate('/system-admin/manage-roles');
      return;
    }
    if (key === 'permissions') {
      navigate('/system-admin/manage-permissions');
      return;
    }
  };

  const userName = user?.fullName || user?.username || 'System Admin';

  const handleViewProfile = () => {
    navigate('/profile');
  };

  return (
    <RoleLayout
      title="Bảng điều khiển System Admin"
      description="Quản lý toàn bộ hệ thống trường, tài khoản và phân quyền."
      menuItems={menuItems}
      activeKey="overview"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      userAvatar={user?.avatar}
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
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Tổng số trường</h2>
          <p className="mt-2 text-2xl font-bold text-gray-800">3</p>
          <p className="mt-1 text-xs text-gray-500">Ví dụ dữ liệu thống kê (mock).</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Tài khoản hoạt động</h2>
          <p className="mt-2 text-2xl font-bold text-gray-800">25</p>
          <p className="mt-1 text-xs text-gray-500">SystemAdmin / SchoolAdmin / Teacher.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Thông báo gần đây</h2>
          <p className="mt-2 text-xs text-gray-600">
            Hệ thống hoạt động ổn định. Không có cảnh báo mới.
          </p>
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

export default SystemAdminDashboard;
