import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTeacher } from '../../context/TeacherContext';
import RoleLayout from '../../layouts/RoleLayout';

function TeacherDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isInitializing } = useAuth();
  const { getDashboard, loading, error } = useTeacher();

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
    if (!userRoles.includes('Teacher')) {
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

  const menuItems = useMemo(
    () => [
      { key: 'classes', label: 'Lớp phụ trách' },
      { key: 'students', label: 'Danh sách học sinh' },
      { key: 'attendance', label: 'Điểm danh' },
      { key: 'schedule', label: 'Lịch dạy & hoạt động' },
      { key: 'messages', label: 'Thông báo cho phụ huynh' },
    ],
    []
  );

  const activeKey = useMemo(() => {
    const path = location.pathname || '';
    if (path.startsWith('/teacher/attendance')) return 'attendance';
    return 'classes';
  }, [location.pathname]);

  const userName = user?.fullName || user?.username || 'Teacher';

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const handleMenuSelect = (key) => {
    if (key === 'classes') {
      // Sau này có thể điều hướng tới trang lớp cụ thể
      return;
    }
    if (key === 'attendance') {
      navigate('/teacher/attendance');
      return;
    }
    // Các mục khác sẽ mapping route sau
  };

  return (
    <RoleLayout
      title="Bảng điều khiển Giáo viên"
      description="Xem nhanh lớp phụ trách, danh sách học sinh và lịch dạy."
      menuItems={menuItems}
      activeKey={activeKey}
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
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Lớp hôm nay</h2>
          <p className="mt-2 text-2xl font-bold text-gray-800">2</p>
          <p className="mt-1 text-xs text-gray-500">
            Ví dụ: Lớp Mầm 1, Lớp Chồi 2 (dữ liệu mock).
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Sĩ số học sinh</h2>
          <p className="mt-2 text-2xl font-bold text-gray-800">35</p>
          <p className="mt-1 text-xs text-gray-500">Tổng số bé trong các lớp phụ trách.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Hoạt động hôm nay</h2>
          <p className="mt-2 text-xs text-gray-600">
            Ví dụ: Vẽ tranh, kể chuyện, vận động ngoài trời...
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

export default TeacherDashboard;
