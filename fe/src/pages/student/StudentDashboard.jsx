import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, put, ENDPOINTS } from '../../service/api';

function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChildInfo, setShowChildInfo] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [pendingOtp, setPendingOtp] = useState(null); // { code, expiresAt, timeLeft }
  const [otpTimeLeft, setOtpTimeLeft] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTotalTime, setOtpTotalTime] = useState(60);
  const [attendanceToday, setAttendanceToday] = useState(null);
  const pollRef = useRef(null);
  const lastOtpCodeRef = useRef(null);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    const isParent =
      userRoles.includes('Parent') ||
      userRoles.includes('StudentParent') ||
      userRoles.includes('Student');
    if (!isParent) {
      navigate('/', { replace: true });
      return;
    }

    const fetchChildren = async () => {
      try {
        const response = await get(ENDPOINTS.AUTH.MY_CHILDREN);
        const list = response.data || [];
        setChildren(list);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load children info', e);
        setChildren([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [navigate, user, isInitializing]);

  const handleEditClick = () => {
    if (studentInfo) {
      setEditFormData({
        fullName: studentInfo.fullName || '',
        dateOfBirth: studentInfo.dateOfBirth
          ? studentInfo.dateOfBirth.split('T')[0]
          : '',
        address: studentInfo.address || '',
        parentPhone: studentInfo.parentPhone || studentInfo.phone || '',
      });
      setIsEditMode(true);
      setSaveMessage(null);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = async () => {
    if (!studentInfo?._id) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const updateData = {
        fullName: editFormData.fullName,
        dateOfBirth: editFormData.dateOfBirth,
        address: editFormData.address,
        // send as both phone and parentPhone for compatibility
        phone: editFormData.parentPhone,
        parentPhone: editFormData.parentPhone,
      };
      const res = await put(ENDPOINTS.STUDENTS.UPDATE(studentInfo._id), updateData);

      // Sử dụng object trả về từ server để cập nhật ngay trong UI
      const updatedStudent = res.data || res;

      setChildren((prev) =>
        prev.map((child) => (child._id === (updatedStudent._id || updatedStudent.id)
          ? ({ ...child, ...updatedStudent })
          : child
        ))
      );

      setSaveMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });

      // Đóng chế độ chỉnh sửa và modal ngay (hiển thị update trên dashboard)
      setIsEditMode(false);
      setShowChildInfo(false);
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: error.message || 'Cập nhật thông tin thất bại. Vui lòng thử lại.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSaveMessage(null);
  };

  const studentInfo = children[0] || null;

  // Lấy điểm danh hôm nay cho trẻ (nếu có)
  useEffect(() => {
    const fetchTodayAttendance = async () => {
      if (!studentInfo?._id) {
        setAttendanceToday(null);
        return;
      }

      const today = new Date();
      const todayQuery = `${today.getFullYear()}-${(today.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

      try {
        const res = await get(
          `${ENDPOINTS.STUDENTS.ATTENDANCE_LIST}?studentId=${studentInfo._id}&date=${todayQuery}`
        );
        const list = res.data || [];
        setAttendanceToday(list[0] || null);
      } catch (err) {
        // ignore
        setAttendanceToday(null);
      }
    };

    fetchTodayAttendance();
  }, [studentInfo?._id]);

  // Poll OTP đang chờ mỗi 3 giây
  useEffect(() => {
    if (!studentInfo?._id) return;
    const fetchPending = async () => {
      try {
        const res = await get(ENDPOINTS.OTP.PENDING(studentInfo._id));
        const data = res.data;
        if (data) {
          // Nếu là OTP mới (code khác), tự động mở modal
          if (data.code !== lastOtpCodeRef.current) {
            lastOtpCodeRef.current = data.code;
            setOtpTotalTime(data.timeLeft || 60);
            setShowOtpModal(true);
          }
          setPendingOtp(data);
          setOtpTimeLeft(data.timeLeft);
        } else {
          lastOtpCodeRef.current = null;
          setPendingOtp(null);
          setOtpTimeLeft(0);
          setShowOtpModal(false);
        }
      } catch {
        // ignore lỗi polling
      }
    };
    fetchPending();
    pollRef.current = setInterval(fetchPending, 3000);
    return () => clearInterval(pollRef.current);
  }, [studentInfo?._id]);

  // Countdown timer cho OTP
  useEffect(() => {
    if (!pendingOtp || otpTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setOtpTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPendingOtp(null);
          setShowOtpModal(false);
          lastOtpCodeRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pendingOtp?.code]);
  const studentName = studentInfo?.fullName || 'Học sinh';
  const className = studentInfo?.classId?.className || 'Chưa xếp lớp';
  const parentName = studentInfo?.parent?.name || '';
  const parentPhone = studentInfo?.parentPhone || studentInfo?.phone || '';
  const parentDisplayName =
    parentName || user?.fullName || user?.username || 'Phụ huynh';
  const arrivalInfo = '07:25 – Bố đưa'; // dữ liệu mẫu
  const leaveInfo = 'Chưa đón'; // dữ liệu mẫu

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const actionButtons = [
    {
      icon: "👶",
      label: "Thông tin của trẻ",
      onClick: () => {
        if (studentInfo) {
          setShowChildInfo(true);
        }
      },
    },
    {
      icon: "📋",
      label: "Điểm danh hôm nay",
      onClick: () => navigate("/student/attendance/today"),
    },
    {
      icon: "📈",
      label: "Báo cáo điểm danh",
      onClick: () => navigate("/student/attendance/report"),
    },
    {
      icon: "👤",
      label: "Người đón trẻ",
      onClick: () => navigate("/student/pickup"),
    },
    {
      icon: "🔔",
      label: "Thông báo",
      onClick: () => navigate("/notifications-news"),
    },
    { icon: "📝", label: "Đơn xin nghỉ học", onClick: () => {} },
    { icon: "📄", label: "Chuyển lớp", onClick: () => {} },
    {
      icon: "📄",
      label: "Thực đơn",
      onClick: () => navigate("/student/menus"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Green banner */}
      <div className="bg-emerald-600 text-white px-4 py-4 md:px-6 md:py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-bold">
            👋 Xin chào, {parentDisplayName}
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
              {(parentName || parentPhone) && (
                <p>
                  👨‍👩‍👧 Số điện thoại phụ huynh:{' '}
                  <span className="font-semibold">
                    {parentName || ''}
                  </span>
                  {parentPhone && (
                    <span className="text-gray-600">  {parentPhone}</span>
                  )}
                </p>
              )}
              <p>
                <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: attendanceToday ? (attendanceToday.time?.checkOut ? '#3b82f6' : attendanceToday.status === 'absent' ? '#ef4444' : '#10b981') : '#9ca3af' }} />
                Trạng thái: {' '}
                <strong>
                  {(() => {
                    if (!attendanceToday) return 'Chưa điểm danh';
                    if (attendanceToday.status === 'absent') return 'Vắng mặt';
                    if (attendanceToday.time?.checkOut) return 'Đã về';
                    if (attendanceToday.time?.checkIn || attendanceToday.status === 'present') return 'Đã đến';
                    return 'Chưa điểm danh';
                  })()}
                </strong>
              </p>
             
            </div>
          )}
        </div>

        {/* Action buttons grid */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {actionButtons.map((btn, idx) => (
            <button
              key={btn.label}
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

        {/* Modal OTP từ tài khoản trường */}
        {showOtpModal && pendingOtp && (() => {
          const radius = 48;
          const circumference = 2 * Math.PI * radius;
          const progress = otpTotalTime > 0 ? otpTimeLeft / otpTotalTime : 0;
          const strokeDashoffset = circumference * (1 - progress);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <h2 className="text-base font-bold text-gray-800">Mã OTP của bạn</h2>
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none"
                  >
                    ×
                  </button>
                </div>

                {/* OTP code */}
                <div className="flex justify-center pb-2">
                  <span className="text-4xl font-bold tracking-[0.3em] text-gray-900">
                    {pendingOtp.code}
                  </span>
                </div>

                {/* Circular countdown */}
                <div className="flex flex-col items-center py-4 gap-2">
                  <p className="text-xs text-gray-500 font-medium">Còn lại:</p>
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112">
                      {/* Track */}
                      <circle
                        cx="56" cy="56" r={radius}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      {/* Progress */}
                      <circle
                        cx="56" cy="56" r={radius}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-emerald-600">{otpTimeLeft}s</span>
                    </div>
                  </div>
                </div>

                {/* Footer note */}
                <div className="px-5 pb-5 text-center">
                  <p className="text-xs text-gray-500">
                    Mã này dùng để giáo viên nhập hoặc nhấn xác nhận trong vòng{' '}
                    <span className="font-semibold text-gray-700">{otpTotalTime} giây</span>.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Toast OTP nhỏ góc dưới phải (luôn hiển thị khi có OTP, kể cả khi đóng modal) */}
        {pendingOtp && !showOtpModal && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold">
            <span>🔑</span>
            <span>Mã OTP: <strong className="text-lg tracking-widest">{pendingOtp.code}</strong></span>
            <span className="text-emerald-200">còn {otpTimeLeft}s</span>
            <button
              type="button"
              onClick={() => setShowOtpModal(true)}
              className="ml-1 text-emerald-200 hover:text-white text-xs underline"
            >
              Xem
            </button>
          </div>
        )}

        {/* Modal hiển thị thông tin chi tiết của trẻ */}
        {showChildInfo && studentInfo && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-800">
                  Thông tin của trẻ
                </h2>
                <button
                  type="button"
                  onClick={() => setShowChildInfo(false)}
                  className="text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              </div>

              {isEditMode ? (
                // Chế độ chỉnh sửa
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={editFormData.fullName}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={editFormData.dateOfBirth}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={editFormData.address}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại phụ huynh
                    </label>
                    <input
                      type="tel"
                      name="parentPhone"
                      value={editFormData.parentPhone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 11) {
                          handleEditFormChange({
                            target: { name: 'parentPhone', value },
                          });
                        }
                      }}
                      maxLength="11"
                      placeholder="Nhập tối đa 11 số"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tối đa 11 ký tự số
                    </p>
                  </div>

                  {saveMessage && (
                    <div
                      className={`p-3 rounded-lg text-sm font-medium ${
                        saveMessage.type === 'success'
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {saveMessage.text}
                    </div>
                  )}

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {isSaving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </div>
                </div>
              ) : (
                // Chế độ xem thông tin
                <>
                  <div className="space-y-2 text-sm text-gray-800">
                    <p>
                      <span className="font-medium">Họ và tên:&nbsp;</span>
                      {studentInfo.fullName}
                    </p>
                    <p>
                      <span className="font-medium">Ngày sinh:&nbsp;</span>
                      {studentInfo.dateOfBirth
                        ? new Date(studentInfo.dateOfBirth).toLocaleDateString(
                            'vi-VN',
                          )
                        : '—'}
                    </p>
                    <p>
                      <span className="font-medium">
                        Số điện thoại phụ huynh:&nbsp;
                      </span>
                      {parentPhone || '—'}
                    </p>
                    <p>
                      <span className="font-medium">Địa chỉ:&nbsp;</span>
                      {studentInfo.address || '—'}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={handleEditClick}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowChildInfo(false)}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
                    >
                      Đóng
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;

