import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  // Nếu là format HH:mm thì trả về luôn
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  // Nếu là Date object hoặc ISO string thì format
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '';
  }
};

function StudentAttendanceDetail() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, logout, isInitializing } = useAuth();
  const { getStudentAttendanceDetail, loading, error } = useSchoolAdmin();

  const [studentInfo, setStudentInfo] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [classId, setClassId] = useState(null);
  const [date, setDate] = useState(searchParams.get('date') || '');

  useEffect(() => {
    if (isInitializing) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('SchoolAdmin')) {
      navigate('/', { replace: true });
      return;
    }

    if (studentId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, user, isInitializing, studentId, date]);

  const fetchData = async () => {
    try {
      const params = {};
      if (date) params.date = date;
      const response = await getStudentAttendanceDetail(studentId, params);
      if (response?.data) {
        setStudentInfo(response.data.studentInfo);
        setAttendance(response.data.attendance);
        setClassId(response.data.studentInfo?.classId);
      }
    } catch (err) {
      console.error('Error fetching student attendance detail:', err);
    }
  };

  const menuItems = [
    { key: 'overview', label: 'Tổng quan trường' },
    { key: 'classes', label: 'Lớp học' },
    { key: 'teachers', label: 'Giáo viên' },
    { key: 'students', label: 'Học sinh & phụ huynh' },
    { key: 'assets', label: 'Quản lý tài sản' },
    { key: 'reports', label: 'Báo cáo của trường' },
    { key: 'contacts', label: 'Liên hệ' },
    { key: 'attendance', label: 'Quản lý điểm danh' },
  ];

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      navigate('/school-admin');
      return;
    }
    if (key === 'classes') {
      navigate('/school-admin/classes');
      return;
    }
    if (key === 'contacts') {
      navigate('/school-admin/contacts');
      return;
    }
    if (key === 'attendance') {
      navigate('/school-admin/attendance/overview');
      return;
    }
  };

  const userName = user?.fullName || user?.username || 'School Admin';

  const checkInTime = attendance?.timeString?.checkIn || formatTime(attendance?.time?.checkIn) || '';
  const checkOutTime = attendance?.timeString?.checkOut || formatTime(attendance?.time?.checkOut) || '';
  const deliverer = attendance?.delivererType || '';
  const receiver = attendance?.receiverType || '';
  const note = attendance?.note || '';
  
  // Lấy URL ảnh từ image field hoặc từ cloudinary
  const getImageUrl = (imageName) => {
    if (!imageName) return null;
    // Nếu đã là URL đầy đủ thì trả về luôn
    if (imageName.startsWith('http')) return imageName;
    // Nếu là tên file, có thể cần thêm base URL
    // Tạm thời trả về null nếu không có URL đầy đủ
    return null;
  };

  const checkInImage = attendance?.checkinImageName || attendance?.image || null;
  const delivererImage = attendance?.delivererOtherImageName || null;
  const checkOutImage = attendance?.checkoutImageName || null;
  const receiverImage = attendance?.receiverOtherImageName || null;

  const attendanceDate = date || (attendance?.date ? formatDate(attendance.date) : formatDate(new Date()));

  return (
    <RoleLayout
      title="Chi tiết điểm danh"
      description="Xem chi tiết điểm danh của học sinh."
      menuItems={menuItems}
      activeKey="attendance"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Thông tin học sinh */}
        <div className="bg-green-50 rounded-lg shadow p-4 mb-4 border border-green-100">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👤</span>
              <span className="text-sm font-semibold text-gray-700">
                Trẻ: {studentInfo?.fullName || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏫</span>
              <span className="text-sm font-semibold text-gray-700">
                Lớp: {studentInfo?.className || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <span className="text-sm font-semibold text-gray-700">
                Ngày: {attendanceDate}
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin">
              <div className="h-6 w-6 border-3 border-indigo-500 border-t-transparent rounded-full" />
            </div>
            <p className="mt-2 text-sm text-gray-500">Đang tải dữ liệu...</p>
          </div>
        ) : !attendance ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <p>Không có dữ liệu điểm danh cho học sinh này.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Phần điểm danh đến */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Điểm danh đến
                </h3>
              </div>

              <div className="mb-3">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded">
                  Trạng thái: {attendance.status === 'present' ? 'Có mặt' : attendance.status === 'absent' ? 'Nghỉ học' : '—'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Giờ đến
                  </label>
                  <input
                    type="text"
                    value={checkInTime}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Người đưa
                  </label>
                  <input
                    type="text"
                    value={deliverer}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hình ảnh xác nhận
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Ảnh check-in
                    </label>
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
                      {checkInImage ? (
                        <img
                          src={getImageUrl(checkInImage) || '#'}
                          alt="Check-in"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <span className="text-xs text-gray-400" style={{ display: checkInImage ? 'none' : 'block' }}>
                        Chưa có ảnh
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Ảnh người đưa
                    </label>
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
                      {delivererImage ? (
                        <img
                          src={getImageUrl(delivererImage) || '#'}
                          alt="Deliverer"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <span className="text-xs text-gray-400" style={{ display: delivererImage ? 'none' : 'block' }}>
                        Chưa có ảnh
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={note}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                />
              </div>
            </div>

            {/* Phần điểm danh về */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Điểm danh về
                </h3>
              </div>

              <div className="mb-3">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded">
                  Trạng thái: {attendance.time?.checkOut ? 'Đã đón' : 'Chưa đón'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Giờ về
                  </label>
                  <input
                    type="text"
                    value={checkOutTime}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Người đón
                  </label>
                  <input
                    type="text"
                    value={receiver}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hình ảnh xác nhận
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Ảnh check-out
                    </label>
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
                      {checkOutImage ? (
                        <img
                          src={getImageUrl(checkOutImage) || '#'}
                          alt="Check-out"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <span className="text-xs text-gray-400" style={{ display: checkOutImage ? 'none' : 'block' }}>
                        Chưa có ảnh
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Ảnh người đón
                    </label>
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
                      {receiverImage ? (
                        <img
                          src={getImageUrl(receiverImage) || '#'}
                          alt="Receiver"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <span className="text-xs text-gray-400" style={{ display: receiverImage ? 'none' : 'block' }}>
                        Chưa có ảnh
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Xác nhận phụ huynh
                </label>
                <input
                  type="text"
                  value={attendance.time?.checkOut ? 'Đã xác nhận' : 'Chưa xác nhận'}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                />
              </div>
            </div>

            {/* Nút quay lại và Lịch sử */}
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  navigate(`/school-admin/students/${studentId}/attendance/history?classId=${classId}&date=${date}`);
                }}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <span>📅</span>
                <span>Lịch sử điểm danh</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (classId && date) {
                    navigate(`/school-admin/classes/${classId}/attendance?date=${date}`);
                  } else {
                    navigate('/school-admin/attendance/overview');
                  }
                }}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <span>←</span>
                <span>Quay lại Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </RoleLayout>
  );
}

export default StudentAttendanceDetail;
