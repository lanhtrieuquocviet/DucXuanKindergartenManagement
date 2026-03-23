/**
 * FaceAttendancePage.jsx
 *
 * Trang quản lý đăng ký khuôn mặt học sinh cho SchoolAdmin.
 *
 * Chức năng:
 *  - Xem danh sách học sinh theo lớp
 *  - Xem trạng thái đăng ký khuôn mặt (đã/chưa đăng ký)
 *  - Mở modal đăng ký / cập nhật embedding từng học sinh
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get } from '../../service/api';
import FaceRegisterModal from '../../components/face/FaceRegisterModal';

// ── Helpers ────────────────────────────────────────────────────────────────────
function getMenuItems() {
  return [
    { key: 'dashboard', label: 'Dashboard', path: '/school-admin' },
    { key: 'students', label: 'Học sinh', path: '/school-admin/students' },
    { key: 'face', label: 'Đăng ký khuôn mặt', path: '/school-admin/face-attendance' },
    { key: 'attendance', label: 'Điểm danh', path: '/school-admin/attendance/overview' },
  ];
}

export default function FaceAttendancePage() {
  const navigate = useNavigate();
  const { user, logout, hasRole, isInitializing } = useAuth();

  // Guard: chỉ SchoolAdmin mới được vào trang này
  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    if (!hasRole('SchoolAdmin') && !hasRole('SystemAdmin')) {
      navigate('/', { replace: true });
    }
  }, [navigate, user, hasRole, isInitializing]);

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [registerModal, setRegisterModal] = useState({ open: false, student: null });
  const [searchTerm, setSearchTerm] = useState('');

  // ── Fetch danh sách lớp ────────────────────────────────────────────────────
  useEffect(() => {
    get('/classes')
      .then((res) => {
        const list = res.data || res.classes || [];
        setClasses(list);
        if (list.length > 0) setSelectedClassId(list[0]._id);
      })
      .catch(() => {})
      .finally(() => setLoadingClasses(false));
  }, []);

  // ── Fetch học sinh khi đổi lớp ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedClassId) return;
    setLoadingStudents(true);
    get(`/students?classId=${selectedClassId}`)
      .then((res) => setStudents(res.data || []))
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [selectedClassId]);

  const filteredStudents = students.filter((s) =>
    s.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const registeredCount = filteredStudents.filter(
    (s) => s.hasFaceEmbedding
  ).length;

  return (
    <RoleLayout
      title="Đăng ký khuôn mặt"
      description="Đăng ký và quản lý khuôn mặt học sinh cho hệ thống điểm danh AI."
      menuItems={getMenuItems()}
      activeKey="face"
      onLogout={() => { logout(); navigate('/login'); }}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={(item) => navigate(item.path)}
      userName={user?.fullName || user?.username || 'Admin'}
      userAvatar={user?.avatar}
    >
      {/* Header card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🧠</span>
          <div>
            <h1 className="text-xl font-bold">Đăng ký khuôn mặt học sinh</h1>
            <p className="text-indigo-200 text-sm mt-0.5">
              Mỗi học sinh cần được chụp ảnh để AI nhận diện khi điểm danh
            </p>
          </div>
        </div>
        {selectedClassId && !loadingStudents && (
          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <span className="text-indigo-200">Đã đăng ký</span>
              <div className="text-2xl font-bold">{registeredCount}</div>
            </div>
            <div>
              <span className="text-indigo-200">Chưa đăng ký</span>
              <div className="text-2xl font-bold text-yellow-300">
                {filteredStudents.length - registeredCount}
              </div>
            </div>
            <div>
              <span className="text-indigo-200">Tổng học sinh</span>
              <div className="text-2xl font-bold">{filteredStudents.length}</div>
            </div>
          </div>
        )}
      </div>

      {/* Bộ lọc */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4 flex flex-col sm:flex-row gap-3">
        {/* Chọn lớp */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Chọn lớp</label>
          {loadingClasses ? (
            <div className="h-9 bg-gray-100 rounded animate-pulse" />
          ) : (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.className || c._id}
                </option>
              ))}
            </select>
          )}
        </div>
        {/* Tìm kiếm */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Tìm học sinh</label>
          <input
            type="text"
            placeholder="Nhập tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Danh sách học sinh */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loadingStudents ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full mr-3" />
            <span className="text-gray-500">Đang tải danh sách...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <span className="text-4xl block mb-2">👥</span>
            <p>Không có học sinh nào</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Học sinh</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ngày sinh</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái khuôn mặt</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Đăng ký lúc</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const hasEmbedding = student.hasFaceEmbedding;
                return (
                  <tr key={student._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 overflow-hidden flex-shrink-0">
                          {student.avatar ? (
                            <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                              {student.fullName?.[0] || '?'}
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-gray-800">{student.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {student.dateOfBirth
                        ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          hasEmbedding
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {hasEmbedding ? '✓ Đã đăng ký' : '○ Chưa đăng ký'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">
                      {student.faceRegisteredAt
                        ? new Date(student.faceRegisteredAt).toLocaleDateString('vi-VN')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setRegisterModal({ open: true, student })}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                          hasEmbedding
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {hasEmbedding ? '🔄 Cập nhật' : '📷 Đăng ký'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* FaceRegisterModal */}
      <FaceRegisterModal
        open={registerModal.open}
        student={registerModal.student}
        onClose={() => setRegisterModal({ open: false, student: null })}
        onSuccess={() => {
          // Reload lại danh sách học sinh để cập nhật trạng thái
          get(`/students?classId=${selectedClassId}`)
            .then((res) => setStudents(res.data || []))
            .catch(() => {});
        }}
      />
    </RoleLayout>
  );
}
