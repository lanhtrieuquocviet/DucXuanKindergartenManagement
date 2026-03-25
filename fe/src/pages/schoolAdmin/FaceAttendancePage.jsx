/**
 * FaceAttendancePage.jsx
 *
 * Trang quản lý đăng ký khuôn mặt:
 *  Tab 1 — Học sinh: chọn lớp → danh sách học sinh → đăng ký
 *  Tab 2 — Người đưa/đón: chọn lớp → chọn học sinh → danh sách người đón đã duyệt → đăng ký
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get } from '../../service/api';
import FaceRegisterModal from '../../components/face/FaceRegisterModal';
import PickupFaceRegisterModal from '../../components/face/PickupFaceRegisterModal';

function getMenuItems() {
  return [
    { key: 'dashboard', label: 'Dashboard', path: '/school-admin' },
    { key: 'students', label: 'Học sinh', path: '/school-admin/students' },
    { key: 'face', label: 'Đăng ký khuôn mặt', path: '/school-admin/face-attendance' },
    { key: 'attendance', label: 'Điểm danh', path: '/school-admin/attendance/overview' },
  ];
}

const CLASS_COLORS = [
  { bg: 'from-indigo-500 to-purple-600', light: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  { bg: 'from-orange-500 to-red-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  { bg: 'from-sky-500 to-blue-600', light: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700' },
  { bg: 'from-pink-500 to-rose-600', light: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
  { bg: 'from-violet-500 to-indigo-600', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
];

// ── Shared: Grid chọn lớp ─────────────────────────────────────────────────────
function ClassGrid({ classes, loadingClasses, onSelect }) {
  if (loadingClasses) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }
  if (classes.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <span className="text-5xl block mb-3">🏫</span>
        <p className="font-medium">Chưa có lớp nào</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {classes.map((cls, idx) => {
        const color = CLASS_COLORS[idx % CLASS_COLORS.length];
        return (
          <button
            key={cls._id}
            onClick={() => onSelect(cls)}
            className={`group relative overflow-hidden rounded-2xl border-2 ${color.border} ${color.light} p-5 text-left transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95`}
          >
            <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${color.bg} opacity-10 group-hover:opacity-20 transition-opacity`} />
            <div className="relative">
              <div className={`text-3xl font-black ${color.text} mb-1`}>{cls.className || cls._id}</div>
              <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-2">
                <span>📷</span><span>Nhấn để chọn</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Tab 1: Học sinh ────────────────────────────────────────────────────────────
function StudentTab({ classes, loadingClasses }) {
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [registerModal, setRegisterModal] = useState({ open: false, student: null });

  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    setSearchTerm('');
    setStudents([]);
    setLoadingStudents(true);
    get(`/students?classId=${cls._id}`)
      .then((res) => setStudents(res.data || []))
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  };

  const reloadStudents = () => {
    if (!selectedClass) return;
    get(`/students?classId=${selectedClass._id}`)
      .then((res) => setStudents(res.data || []))
      .catch(() => {});
  };

  const filteredStudents = students.filter((s) =>
    s.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const registeredCount = students.filter((s) => s.hasFaceEmbedding).length;

  if (!selectedClass) {
    return <ClassGrid classes={classes} loadingClasses={loadingClasses} onSelect={handleSelectClass} />;
  }

  return (
    <>
      {/* Header lớp */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 mb-5 text-white">
        <button
          onClick={() => { setSelectedClass(null); setStudents([]); setSearchTerm(''); }}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors mb-3"
        >
          ← Chọn lớp khác
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">🧠</span>
          <div>
            <h2 className="text-lg font-bold">Lớp {selectedClass.className} — Học sinh</h2>
            <p className="text-indigo-200 text-sm">Đăng ký khuôn mặt từng học sinh</p>
          </div>
        </div>
        {!loadingStudents && (
          <div className="mt-3 flex gap-5 text-sm">
            <div><div className="text-indigo-200 text-xs">Đã đăng ký</div><div className="text-xl font-bold">{registeredCount}</div></div>
            <div><div className="text-indigo-200 text-xs">Chưa đăng ký</div><div className="text-xl font-bold text-yellow-300">{students.length - registeredCount}</div></div>
            <div><div className="text-indigo-200 text-xs">Tổng</div><div className="text-xl font-bold">{students.length}</div></div>
          </div>
        )}
      </div>

      {/* Tìm kiếm */}
      <div className="bg-white rounded-xl border p-4 mb-4">
        <input
          type="text"
          placeholder="Tìm học sinh..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Bảng */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loadingStudents ? (
          <div className="flex items-center justify-center py-14">
            <div className="animate-spin h-7 w-7 border-b-2 border-indigo-600 rounded-full mr-3" />
            <span className="text-gray-500">Đang tải...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <span className="text-4xl block mb-2">👥</span>
            <p>{searchTerm ? 'Không tìm thấy học sinh' : 'Lớp này chưa có học sinh'}</p>
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
                const has = student.hasFaceEmbedding;
                return (
                  <tr key={student._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 overflow-hidden flex-shrink-0">
                          {student.avatar
                            ? <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-sm">{student.fullName?.[0] || '?'}</div>
                          }
                        </div>
                        <span className="font-medium text-gray-800">{student.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${has ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {has ? '✓ Đã đăng ký' : '○ Chưa đăng ký'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">
                      {student.faceRegisteredAt ? new Date(student.faceRegisteredAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setRegisterModal({ open: true, student })}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg ${has ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                      >
                        {has ? '🔄 Cập nhật' : '📷 Đăng ký'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <FaceRegisterModal
        open={registerModal.open}
        student={registerModal.student}
        onClose={() => setRegisterModal({ open: false, student: null })}
        onSuccess={reloadStudents}
      />
    </>
  );
}

// ── Tab 2: Người đưa/đón ──────────────────────────────────────────────────────
function PickupTab({ classes, loadingClasses }) {
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pickupPersons, setPickupPersons] = useState([]);
  const [loadingPickup, setLoadingPickup] = useState(false);

  const [registerModal, setRegisterModal] = useState({ open: false, person: null });
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    setSelectedStudent(null);
    setPickupPersons([]);
    setSearchTerm('');
    setLoadingStudents(true);
    get(`/students?classId=${cls._id}`)
      .then((res) => setStudents(res.data || []))
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setPickupPersons([]);
    setLoadingPickup(true);
    get(`/pickup/requests/student/${student._id}`)
      .then((res) => setPickupPersons(res.data || []))
      .catch(() => setPickupPersons([]))
      .finally(() => setLoadingPickup(false));
  };

  const reloadPickup = () => {
    if (!selectedStudent) return;
    get(`/pickup/requests/student/${selectedStudent._id}`)
      .then((res) => setPickupPersons(res.data || []))
      .catch(() => {});
  };

  const filteredStudents = students.filter((s) =>
    s.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Step 1: Chọn lớp
  if (!selectedClass) {
    return <ClassGrid classes={classes} loadingClasses={loadingClasses} onSelect={handleSelectClass} />;
  }

  // Step 2: Chọn học sinh
  if (!selectedStudent) {
    return (
      <>
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 mb-5 text-white">
          <button
            onClick={() => { setSelectedClass(null); setStudents([]); }}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors mb-3"
          >
            ← Chọn lớp khác
          </button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">👨‍👩‍👧</span>
            <div>
              <h2 className="text-lg font-bold">Lớp {selectedClass.className} — Người đưa/đón</h2>
              <p className="text-emerald-100 text-sm">Chọn học sinh để xem danh sách người đưa/đón</p>
            </div>
          </div>
        </div>

        {/* Tìm kiếm */}
        <div className="bg-white rounded-xl border p-4 mb-4">
          <input
            type="text"
            placeholder="Tìm học sinh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        {loadingStudents ? (
          <div className="flex items-center justify-center py-14">
            <div className="animate-spin h-7 w-7 border-b-2 border-emerald-600 rounded-full mr-3" />
            <span className="text-gray-500">Đang tải...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredStudents.map((student) => (
              <button
                key={student._id}
                onClick={() => handleSelectStudent(student)}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3.5 text-left hover:border-emerald-400 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 overflow-hidden flex-shrink-0">
                  {student.avatar
                    ? <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-emerald-600 font-bold">{student.fullName?.[0] || '?'}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-sm truncate">{student.fullName}</div>
                  <div className="text-xs text-gray-400">Nhấn để xem người đưa/đón</div>
                </div>
                <span className="text-gray-300 group-hover:text-emerald-500 text-lg">›</span>
              </button>
            ))}
            {filteredStudents.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                <span className="text-4xl block mb-2">👥</span>
                <p>{searchTerm ? 'Không tìm thấy học sinh' : 'Lớp này chưa có học sinh'}</p>
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  // Step 3: Danh sách người đón đã duyệt
  const faceRegisteredCount = pickupPersons.filter((p) => p.faceEmbedding?.length > 0).length;

  return (
    <>
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 mb-5 text-white">
        <button
          onClick={() => { setSelectedStudent(null); setPickupPersons([]); }}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors mb-3"
        >
          ← Chọn học sinh khác
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-lg">
            {selectedStudent.avatar
              ? <img src={selectedStudent.avatar} alt="" className="w-full h-full object-cover" />
              : selectedStudent.fullName?.[0]
            }
          </div>
          <div>
            <h2 className="text-lg font-bold">{selectedStudent.fullName}</h2>
            <p className="text-emerald-100 text-sm">Người đưa/đón đã được duyệt</p>
          </div>
        </div>
        {!loadingPickup && (
          <div className="mt-3 flex gap-5 text-sm">
            <div><div className="text-emerald-100 text-xs">Đã đăng ký khuôn mặt</div><div className="text-xl font-bold">{faceRegisteredCount}</div></div>
            <div><div className="text-emerald-100 text-xs">Chưa đăng ký</div><div className="text-xl font-bold text-yellow-300">{pickupPersons.length - faceRegisteredCount}</div></div>
            <div><div className="text-emerald-100 text-xs">Tổng người đón</div><div className="text-xl font-bold">{pickupPersons.length}</div></div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loadingPickup ? (
          <div className="flex items-center justify-center py-14">
            <div className="animate-spin h-7 w-7 border-b-2 border-emerald-600 rounded-full mr-3" />
            <span className="text-gray-500">Đang tải...</span>
          </div>
        ) : pickupPersons.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <span className="text-4xl block mb-2">🚶</span>
            <p className="font-medium">Chưa có người đưa/đón nào được duyệt</p>
            <p className="text-xs mt-1">Phụ huynh cần đăng ký và giáo viên duyệt trước</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Họ tên</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Quan hệ</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Số điện thoại</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Khuôn mặt</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pickupPersons.map((person) => {
                const hasFace = person.faceEmbedding?.length > 0;
                return (
                  <tr key={person._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {person.imageUrl ? (
                          <img src={person.imageUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm flex-shrink-0">
                            {person.fullName?.[0] || '?'}
                          </div>
                        )}
                        <span className="font-medium text-gray-800">{person.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{person.relation || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{person.phone || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${hasFace ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {hasFace ? '✓ Đã đăng ký' : '○ Chưa đăng ký'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setRegisterModal({ open: true, person })}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg ${hasFace ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                      >
                        {hasFace ? '🔄 Cập nhật' : '📷 Đăng ký'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <PickupFaceRegisterModal
        open={registerModal.open}
        pickupPerson={registerModal.person}
        onClose={() => setRegisterModal({ open: false, person: null })}
        onSuccess={reloadPickup}
      />
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FaceAttendancePage() {
  const navigate = useNavigate();
  const { user, logout, hasRole, isInitializing } = useAuth();

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    if (!hasRole('SchoolAdmin') && !hasRole('SystemAdmin')) navigate('/', { replace: true });
  }, [navigate, user, hasRole, isInitializing]);

  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [activeTab, setActiveTab] = useState('student');

  useEffect(() => {
    get('/classes')
      .then((res) => setClasses(res.data || res.classes || []))
      .catch(() => {})
      .finally(() => setLoadingClasses(false));
  }, []);

  return (
    <RoleLayout
      title="Đăng ký khuôn mặt"
      description="Đăng ký và quản lý khuôn mặt cho hệ thống điểm danh AI."
      menuItems={getMenuItems()}
      activeKey="face"
      onLogout={() => { logout(); navigate('/login'); }}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={(item) => navigate(item.path)}
      userName={user?.fullName || user?.username || 'Admin'}
      userAvatar={user?.avatar}
    >
      {/* Header tổng */}
      {activeTab === 'student' && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🧠</span>
            <div>
              <h1 className="text-xl font-bold">Đăng ký khuôn mặt học sinh</h1>
              <p className="text-indigo-200 text-sm mt-0.5">Chọn lớp để xem và đăng ký khuôn mặt cho từng học sinh</p>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'pickup' && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3">
            <span className="text-4xl">👨‍👩‍👧</span>
            <div>
              <h1 className="text-xl font-bold">Đăng ký khuôn mặt người đưa/đón</h1>
              <p className="text-emerald-100 text-sm mt-0.5">Đăng ký để xác minh nhanh khi đến đón trẻ</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 w-fit">
        <button
          onClick={() => setActiveTab('student')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'student'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🧒 Học sinh
        </button>
        <button
          onClick={() => setActiveTab('pickup')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'pickup'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👨‍👩‍👧 Người đưa/đón
        </button>
      </div>

      {/* Nội dung tab */}
      {activeTab === 'student' && (
        <StudentTab classes={classes} loadingClasses={loadingClasses} />
      )}
      {activeTab === 'pickup' && (
        <PickupTab classes={classes} loadingClasses={loadingClasses} />
      )}
    </RoleLayout>
  );
}
