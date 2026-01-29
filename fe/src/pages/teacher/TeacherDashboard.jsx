import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTeacher } from '../../context/TeacherContext';

function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
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

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const menuItems = [
    { key: 'classes', label: 'Lớp phụ trách' },
    { key: 'students', label: 'Danh sách học sinh' },
    { key: 'schedule', label: 'Lịch dạy & hoạt động' },
    { key: 'messages', label: 'Thông báo cho phụ huynh' },
  ];

  const userName = user?.fullName || user?.username || 'Teacher';

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="px-6 py-4 font-semibold text-lg border-b border-gray-800">
          Menu
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-800 transition"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-gray-800">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-800 transition text-red-400"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Bảng điều khiển Giáo viên</h1>
            <p className="text-sm text-gray-500 mt-1">
              Xem nhanh lớp phụ trách, danh sách học sinh và lịch dạy.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm hover:bg-gray-50 transition"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <span className="font-medium">{userName}</span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-10">
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleViewProfile();
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Xem hồ sơ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        navigate('/login', { replace: true });
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Click outside để đóng dropdown */}
        {showProfileMenu && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowProfileMenu(false)}
          />
        )}

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
      </main>
    </div>
  );
}

export default TeacherDashboard;
