import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../components/RoleLayout';

function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/login', { replace: true });
      return;
    }

    const user = JSON.parse(userStr);
    const roles = (user.roles || []).map((r) => r.roleName || r);

    // Nếu không phải Teacher thì đá ra trang chủ
    if (!roles.includes('Teacher')) {
      navigate('/', { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/teacher/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || 'Không tải được dữ liệu teacher');
        }
        setData(json);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
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
      userName={JSON.parse(localStorage.getItem('user') || '{}').fullName || JSON.parse(localStorage.getItem('user') || '{}').username || 'Teacher'}
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

