import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';

function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('Student')) {
      navigate('/', { replace: true });
      return;
    }

    const fetchStudentInfo = async () => {
      try {
        const response = await get(ENDPOINTS.AUTH.ME_STUDENT);
        const data = response.data;
        setStudentInfo(data);
      } catch {
        setStudentInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentInfo();
  }, [navigate, user, isInitializing]);

  const studentName = studentInfo?.fullName || user?.fullName || user?.username || 'Học sinh';
  const className = studentInfo?.classId?.className || 'Chưa xếp lớp';
  const arrivalInfo = '07:25 – Bố đưa';
  const leaveInfo = 'Chưa đón';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const actionButtons = [
    { icon: '👶', label: 'Thông tin của tôi', onClick: () => {} },
    { icon: '📋', label: 'Điểm danh hôm nay', onClick: () => {} },
    { icon: '📈', label: 'Báo cáo điểm danh', onClick: () => {} },
    { icon: '👤', label: 'Người đón trẻ', onClick: () => {} },
    { icon: '🔔', label: 'Thông báo', onClick: () => navigate('/notifications-news') },
    { icon: '📝', label: 'Đơn xin nghỉ học', onClick: () => {} },
    { icon: '📄', label: 'Chuyển lớp', onClick: () => {} },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Green banner */}
      <div className="bg-emerald-600 text-white px-4 py-4 md:px-6 md:py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-bold">
            👋 Xin chào, {studentName}
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="text-sm px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition"
            >
              Hồ sơ
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* Info card */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-5 mb-6">
          {loading ? (
            <p className="text-sm text-gray-500">Đang tải thông tin...</p>
          ) : (
            <div className="space-y-2 text-sm md:text-base text-gray-800">
              <p>👶 Trẻ: {studentName}</p>
              <p>🏫 Lớp: {className}</p>
              <p><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" />Đến: {arrivalInfo}</p>
              <p><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2" />Về: {leaveInfo}</p>
            </div>
          )}
        </div>

        {/* Action buttons grid */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {actionButtons.map((btn, idx) => (
            <button
              key={idx}
              type="button"
              onClick={btn.onClick}
              className="flex flex-col items-center justify-center gap-2 bg-white rounded-xl shadow-sm p-4 md:p-5 hover:bg-gray-50 transition text-gray-800"
            >
              <span className="text-2xl md:text-3xl">{btn.icon}</span>
              <span className="text-xs md:text-sm font-medium text-center leading-tight">
                {btn.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
