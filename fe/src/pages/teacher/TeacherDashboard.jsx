import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../../components/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { useTeacher } from '../../context/TeacherContext';

function TeacherDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const { user, hasRole, logout } = useAuth();
  const { getDashboard, loading, error } = useTeacher();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (!hasRole('Teacher')) {
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
  }, [navigate, user, hasRole, getDashboard]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const menuItems = [
    { key: 'classes', label: 'Lớp phụ trách' },
    { key: 'students', label: 'Danh sách học sinh' },
    { key: 'schedule', label: 'Lịch dạy & hoạt động' },
    { key: 'messages', label: 'Thông báo cho phụ huynh' },
  ];

  return (
    <RoleLayout
      title="Bảng điều khiển Giáo viên (Teacher)"
      description="Xem nhanh lớp phụ trách, danh sách học sinh và lịch dạy."
      menuItems={menuItems}
      activeKey="classes"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onEditProfile={handleViewProfile}
      userName={user?.fullName || user?.username || 'Teacher'}
    >
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
          <h2 className="text-sm font-semibold text-emerald-900 mb-1">Lớp hôm nay</h2>
          <p className="mt-2 text-2xl font-bold text-emerald-800">2</p>
          <p className="mt-1 text-xs text-emerald-700">
            Ví dụ: Lớp Mầm 1, Lớp Chồi 2 (dữ liệu mock).
          </p>
        </div>
        <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
          <h2 className="text-sm font-semibold text-sky-900 mb-1">Sĩ số học sinh</h2>
          <p className="mt-2 text-2xl font-bold text-sky-800">35</p>
          <p className="mt-1 text-xs text-sky-700">Tổng số bé trong các lớp phụ trách.</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
          <h2 className="text-sm font-semibold text-amber-900 mb-1">Hoạt động hôm nay</h2>
          <p className="mt-2 text-xs text-amber-800">
            Ví dụ: Vẽ tranh, kể chuyện, vận động ngoài trời...
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
        <h3 className="text-sm font-semibold text-emerald-900 mb-2">Dữ liệu trả về từ API</h3>
        <pre className="text-xs text-emerald-800 overflow-auto max-h-80">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </RoleLayout>
  );
}

export default TeacherDashboard;

