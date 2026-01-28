import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../../components/RoleLayout';

function SystemAdminDashboard() {
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

    // Nếu không phải SystemAdmin thì đá ra trang chủ
    if (!roles.includes('SystemAdmin')) {
      navigate('/', { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/system-admin/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || 'Không tải được dữ liệu admin');
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
    { key: 'overview', label: 'Tổng quan hệ thống' },
    { key: 'schools', label: 'Quản lý trường' },
    { key: 'accounts', label: 'Quản lý tài khoản' },
    { key: 'roles', label: 'Phân quyền & vai trò' },
    { key: 'reports', label: 'Báo cáo tổng hợp' },
  ];

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      // đang ở đây rồi
      return;
    }
    if (key === 'roles') {
      navigate('/system-admin/managepermitsion');
      return;
    }
    // các mục khác sau này có thể tách route riêng
  };

  const handleViewProfile = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // Hiển thị nhanh thông tin hồ sơ; sau này có thể tách sang trang riêng
    // eslint-disable-next-line no-alert
    alert(`Hồ sơ SystemAdmin:\n\nHọ tên: ${user.fullName || ''}\nTài khoản: ${user.username || ''}\nEmail: ${user.email || ''}`);
  };

  return (
    <RoleLayout
      title="Bảng điều khiển System Admin"
      description="Quản lý toàn bộ hệ thống trường, tài khoản và phân quyền."
      menuItems={menuItems}
      activeKey="overview"
      onLogout={handleLogout}
      onMenuSelect={handleMenuSelect}
      onViewProfile={handleViewProfile}
      userName={JSON.parse(localStorage.getItem('user') || '{}').fullName || JSON.parse(localStorage.getItem('user') || '{}').username || 'System Admin'}
    >
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
          <h2 className="text-sm font-semibold text-sky-900 mb-1">Tổng số trường</h2>
          <p className="mt-2 text-2xl font-bold text-sky-800">3</p>
          <p className="mt-1 text-xs text-sky-600">Ví dụ dữ liệu thống kê (mock).</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
          <h2 className="text-sm font-semibold text-emerald-900 mb-1">Tài khoản hoạt động</h2>
          <p className="mt-2 text-2xl font-bold text-emerald-800">25</p>
          <p className="mt-1 text-xs text-emerald-700">SystemAdmin / SchoolAdmin / Teacher.</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
          <h2 className="text-sm font-semibold text-amber-900 mb-1">Thông báo gần đây</h2>
          <p className="mt-2 text-xs text-amber-800">
            Hệ thống hoạt động ổn định. Không có cảnh báo mới.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-4">
        <h3 className="text-sm font-semibold text-sky-900 mb-2">Dữ liệu trả về từ API</h3>
        <pre className="text-xs text-sky-800 overflow-auto max-h-80">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </RoleLayout>
  );
}

export default SystemAdminDashboard;

