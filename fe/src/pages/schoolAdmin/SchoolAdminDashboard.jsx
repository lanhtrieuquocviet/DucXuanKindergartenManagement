import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../../components/RoleLayout';

function SchoolAdminDashboard() {
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

    // Nếu không phải SchoolAdmin thì đá ra trang chủ
    if (!roles.includes('SchoolAdmin')) {
      navigate('/', { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/school-admin/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || 'Không tải được dữ liệu school admin');
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

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const menuItems = [
    { key: 'overview', label: 'Tổng quan trường' },
    { key: 'classes', label: 'Lớp học' },
    { key: 'teachers', label: 'Giáo viên' },
    { key: 'students', label: 'Học sinh & phụ huynh' },
    { key: 'assets', label: 'Quản lý tài sản' },
    { key: 'reports', label: 'Báo cáo của trường' },
  ];

  return (
    <RoleLayout
      title="Bảng điều khiển của Ban giám hiệu"
      description="Quản lý trường, lớp học, giáo viên và phụ huynh trong phạm vi trường."
      menuItems={menuItems}
      activeKey="overview"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onEditProfile={handleViewProfile}
      userName={JSON.parse(localStorage.getItem('user') || '{}').fullName || JSON.parse(localStorage.getItem('user') || '{}').username || 'School Admin'}
    >
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4">
          <h2 className="text-sm font-semibold text-amber-900 mb-1">Số lớp đang hoạt động</h2>
          <p className="mt-2 text-2xl font-bold text-amber-800">8</p>
          <p className="mt-1 text-xs text-amber-700">Ví dụ thống kê số lớp trong trường.</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
          <h2 className="text-sm font-semibold text-emerald-900 mb-1">Số giáo viên</h2>
          <p className="mt-2 text-2xl font-bold text-emerald-800">15</p>
          <p className="mt-1 text-xs text-emerald-700">Tổng số giáo viên thuộc trường.</p>
        </div>
        <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
          <h2 className="text-sm font-semibold text-sky-900 mb-1">Học sinh</h2>
          <p className="mt-2 text-2xl font-bold text-sky-800">120</p>
          <p className="mt-1 text-xs text-sky-700">Tổng số học sinh trong các lớp22.</p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
        <h3 className="text-sm font-semibold text-amber-900 mb-2">Dữ liệu trả về từ API</h3>
        <pre className="text-xs text-amber-800 overflow-auto max-h-80">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </RoleLayout>
  );
}

export default SchoolAdminDashboard;

