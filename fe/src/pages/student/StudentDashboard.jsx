import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, put, ENDPOINTS } from '../../service/api';
import { getNotifications, getUnreadCount, markAllAsRead, markAsRead } from '../../service/notification.api';
import { Bell, User, LogOut, X, ChevronRight } from 'lucide-react';

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
  const [pendingOtp, setPendingOtp] = useState(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTotalTime, setOtpTotalTime] = useState(60);
  const [attendanceToday, setAttendanceToday] = useState(null);
  const pollRef = useRef(null);
  const lastOtpCodeRef = useRef(null);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    const isParent = userRoles.includes('Parent') || userRoles.includes('StudentParent') || userRoles.includes('Student');
    if (!isParent) { navigate('/', { replace: true }); return; }
    const fetchChildren = async () => {
      try {
        const response = await get(ENDPOINTS.AUTH.MY_CHILDREN);
        setChildren(response.data || []);
      } catch { setChildren([]); } finally { setLoading(false); }
    };
    fetchChildren();
  }, [navigate, user, isInitializing]);

  const handleEditClick = () => {
    if (studentInfo) {
      setEditFormData({
        fullName: studentInfo.fullName || '',
        dateOfBirth: studentInfo.dateOfBirth ? studentInfo.dateOfBirth.split('T')[0] : '',
        address: studentInfo.address || '',
        parentPhone: studentInfo.parentPhone || studentInfo.phone || '',
      });
      setIsEditMode(true);
      setSaveMessage(null);
    }
  };
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSaveChanges = async () => {
    if (!studentInfo?._id) return;
    setIsSaving(true); setSaveMessage(null);
    try {
      const updateData = {
        fullName: editFormData.fullName,
        dateOfBirth: editFormData.dateOfBirth,
        address: editFormData.address,
        phone: editFormData.parentPhone,
        parentPhone: editFormData.parentPhone,
      };
      const res = await put(ENDPOINTS.STUDENTS.UPDATE(studentInfo._id), updateData);
      const updatedStudent = res.data || res;
      setChildren((prev) => prev.map((child) => (child._id === (updatedStudent._id || updatedStudent.id) ? ({ ...child, ...updatedStudent }) : child)));
      setSaveMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      setIsEditMode(false);
      setShowChildInfo(false);
    } catch (error) {
      setSaveMessage({ type: 'error', text: error.message || 'Cập nhật thất bại. Vui lòng thử lại.' });
    } finally { setIsSaving(false); }
  };
  const handleCancelEdit = () => { setIsEditMode(false); setSaveMessage(null); };

  const studentInfo = children[0] || null;

  useEffect(() => {
    const fetchTodayAttendance = async () => {
      if (!studentInfo?._id) { setAttendanceToday(null); return; }
      const today = new Date();
      const todayQuery = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2,'0')}-${today.getDate().toString().padStart(2,'0')}`;
      try {
        const res = await get(`${ENDPOINTS.STUDENTS.ATTENDANCE_LIST}?studentId=${studentInfo._id}&date=${todayQuery}`);
        setAttendanceToday((res.data || [])[0] || null);
      } catch { setAttendanceToday(null); }
    };
    fetchTodayAttendance();
  }, [studentInfo?._id]);

  useEffect(() => {
    if (!studentInfo?._id) return;
    const fetchPending = async () => {
      try {
        const res = await get(ENDPOINTS.OTP.PENDING(studentInfo._id));
        const data = res.data;
        if (data) {
          if (data.code !== lastOtpCodeRef.current) { lastOtpCodeRef.current = data.code; setOtpTotalTime(data.timeLeft || 60); setShowOtpModal(true); }
          setPendingOtp(data); setOtpTimeLeft(data.timeLeft);
        } else { lastOtpCodeRef.current = null; setPendingOtp(null); setOtpTimeLeft(0); setShowOtpModal(false); }
      } catch { /* ignore */ }
    };
    fetchPending();
    pollRef.current = setInterval(fetchPending, 3000);
    return () => clearInterval(pollRef.current);
  }, [studentInfo?._id]);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => { try { const res = await getUnreadCount(); setUnreadCount(res.count || 0); } catch { /* ignore */ } };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!pendingOtp || otpTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setOtpTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); setPendingOtp(null); setShowOtpModal(false); lastOtpCodeRef.current = null; return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pendingOtp?.code]);

  const studentName = studentInfo?.fullName || 'Học sinh';
  const className = studentInfo?.classId?.className || 'Chưa xếp lớp';
  const parentName = studentInfo?.parent?.name || '';
  const parentPhone = studentInfo?.parentPhone || studentInfo?.phone || '';
  const parentDisplayName = parentName || user?.fullName || user?.username || 'Phụ huynh';

  const attendanceStatus = (() => {
    if (!attendanceToday) return { label: 'Chưa điểm danh', color: '#9ca3af', bg: '#f3f4f6' };
    if (attendanceToday.status === 'absent') return { label: 'Vắng mặt', color: '#ef4444', bg: '#fef2f2' };
    if (attendanceToday.time?.checkOut) return { label: 'Đã về', color: '#3b82f6', bg: '#eff6ff' };
    if (attendanceToday.time?.checkIn || attendanceToday.status === 'present') return { label: 'Đã đến trường', color: '#10b981', bg: '#ecfdf5' };
    return { label: 'Chưa điểm danh', color: '#9ca3af', bg: '#f3f4f6' };
  })();

  const loadNotifications = async () => {
    setNotifLoading(true);
    try { const res = await getNotifications(1, 20); setNotifications(res.data || []); setUnreadCount(res.unreadCount || 0); }
    catch { /* ignore */ } finally { setNotifLoading(false); }
  };
  const handleOpenNotifModal = async () => { setNotifModalOpen(true); await loadNotifications(); };
  const handleMarkAllRead = async () => {
    try { await markAllAsRead(); setNotifications((prev) => prev.map((n) => ({ ...n, isReadByMe: true }))); setUnreadCount(0); }
    catch { /* ignore */ }
  };
  const handleMarkOneRead = async (id) => {
    try { await markAsRead(id); setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isReadByMe: true } : n))); setUnreadCount((c) => Math.max(0, c - 1)); }
    catch { /* ignore */ }
  };
  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const actionButtons = [
    { icon: '👶', label: 'Thông tin của trẻ', onClick: () => { if (studentInfo) setShowChildInfo(true); }, color: '#ecfdf5', border: '#6ee7b7' },
    { icon: '📋', label: 'Điểm danh hôm nay', onClick: () => navigate('/student/attendance/today'), color: '#eff6ff', border: '#93c5fd' },
    { icon: '📈', label: 'Báo cáo điểm danh', onClick: () => navigate('/student/attendance/report'), color: '#f5f3ff', border: '#c4b5fd' },
    { icon: '👤', label: 'Người đón trẻ', onClick: () => navigate('/student/pickup'), color: '#fff7ed', border: '#fed7aa' },
    { icon: '🔔', label: 'Thông báo', onClick: handleOpenNotifModal, color: '#fefce8', border: '#fde047', badge: unreadCount },
    { icon: '📝', label: 'Đơn xin nghỉ học', onClick: () => {}, color: '#f8fafc', border: '#cbd5e1' },
    { icon: '📄', label: 'Chuyển lớp', onClick: () => {}, color: '#f8fafc', border: '#cbd5e1' },
    { icon: '🍽️', label: 'Thực đơn', onClick: () => navigate('/student/menus'), color: '#ecfdf5', border: '#6ee7b7' },
    { icon: '🍱', label: 'Hình ảnh bữa ăn', onClick: () => navigate('/student/meal-photos'), color: '#fff7ed', border: '#fed7aa' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-emerald-600 text-white">
        <div className="max-w-lg mx-auto px-4 pt-5 pb-6">
          <div className="flex items-center justify-between mb-1">
            <p className="text-emerald-200 text-xs font-medium">Trường mầm non Đức Xuân</p>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/profile')} className="p-2 rounded-full bg-white/15 active:bg-white/25 transition">
                <User size={17} />
              </button>
              <button onClick={handleLogout} className="p-2 rounded-full bg-white/15 active:bg-white/25 transition">
                <LogOut size={17} />
              </button>
            </div>
          </div>
          <h1 className="text-xl font-bold">👋 Xin chào, {parentDisplayName}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-3">
        {/* ── Student card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5">
          {loading ? (
            <div className="space-y-2.5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl flex-shrink-0">
                👶
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-base leading-tight">{studentName}</p>
                <p className="text-gray-500 text-sm mt-0.5">🏫 {className}</p>
                {parentPhone && <p className="text-gray-500 text-sm">📞 {parentPhone}</p>}
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: attendanceStatus.bg, color: attendanceStatus.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: attendanceStatus.color }} />
                    {attendanceStatus.label}
                  </span>
                </div>
              </div>
              {/* Notification bell */}
              <button
                onClick={handleOpenNotifModal}
                className="relative p-2 rounded-xl flex-shrink-0"
                style={{ background: unreadCount > 0 ? '#fefce8' : '#f8fafc', border: `1.5px solid ${unreadCount > 0 ? '#fde047' : '#e2e8f0'}` }}
              >
                <Bell size={20} className={unreadCount > 0 ? 'text-amber-500' : 'text-gray-400'} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center leading-none px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Action grid ── */}
        <div className="grid grid-cols-2 gap-3 pb-8">
          {actionButtons.map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.onClick}
              className="relative flex items-center gap-3 bg-white rounded-2xl shadow-sm p-4 text-left active:scale-95 transition-transform"
              style={{ border: `1.5px solid ${btn.border}` }}
            >
              <span className="text-2xl flex-shrink-0">{btn.icon}</span>
              <span className="text-sm font-semibold text-gray-800 leading-tight">{btn.label}</span>
              {btn.badge > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {btn.badge > 9 ? '9+' : btn.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Notification modal (bottom sheet) ── */}
      {notifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setNotifModalOpen(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <h2 className="text-base font-bold text-gray-800">Thông báo</h2>
                {unreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{unreadCount}</span>}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button type="button" onClick={handleMarkAllRead} className="text-xs text-indigo-600 font-semibold hover:underline">Đọc tất cả</button>
                )}
                <button type="button" onClick={() => setNotifModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {notifLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="text-3xl mb-3 animate-pulse">⏳</div>
                  <p className="text-sm">Đang tải thông báo...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="text-4xl mb-3">🔕</div>
                  <p className="text-sm font-medium text-gray-500">Chưa có thông báo nào</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => !n.isReadByMe && handleMarkOneRead(n._id)}
                      className={`px-5 py-4 transition-colors ${n.isReadByMe ? 'bg-white' : 'bg-amber-50 cursor-pointer active:bg-amber-100'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base ${n.isReadByMe ? 'bg-gray-100' : 'bg-amber-100'}`}>⚠️</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${n.isReadByMe ? 'font-normal text-gray-700' : 'font-semibold text-gray-900'}`}>{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                        {!n.isReadByMe && <div className="flex-shrink-0 mt-1.5 w-2.5 h-2.5 rounded-full bg-amber-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              <button type="button" onClick={() => setNotifModalOpen(false)} className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold active:bg-emerald-700 transition">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ── OTP modal ── */}
      {showOtpModal && pendingOtp && (() => {
        const radius = 48;
        const circumference = 2 * Math.PI * radius;
        const progress = otpTotalTime > 0 ? otpTimeLeft / otpTotalTime : 0;
        const strokeDashoffset = circumference * (1 - progress);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="text-base font-bold text-gray-800">🔑 Mã OTP của bạn</h2>
                <button type="button" onClick={() => setShowOtpModal(false)} className="p-1 text-gray-400 hover:text-gray-700"><X size={20} /></button>
              </div>
              <div className="flex justify-center pb-2">
                <span className="text-4xl font-bold tracking-[0.3em] text-gray-900">{pendingOtp.code}</span>
              </div>
              <div className="flex flex-col items-center py-4 gap-2">
                <p className="text-xs text-gray-500 font-medium">Còn lại:</p>
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle cx="56" cy="56" r={radius} fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ transition: 'stroke-dashoffset 1s linear' }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-emerald-600">{otpTimeLeft}s</span>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5 text-center">
                <p className="text-xs text-gray-500">Mã này dùng để giáo viên nhập xác nhận trong vòng <span className="font-semibold text-gray-700">{otpTotalTime} giây</span>.</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── OTP toast (when modal closed) ── */}
      {pendingOtp && !showOtpModal && (
        <div className="fixed bottom-6 right-4 z-50 flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold">
          <span>🔑</span>
          <span>OTP: <strong className="text-lg tracking-widest">{pendingOtp.code}</strong></span>
          <span className="text-emerald-200">còn {otpTimeLeft}s</span>
          <button type="button" onClick={() => setShowOtpModal(true)} className="ml-1 text-emerald-200 hover:text-white text-xs underline">Xem</button>
        </div>
      )}

      {/* ── Child info modal ── */}
      {showChildInfo && studentInfo && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/30 px-0 sm:px-4" onClick={() => setShowChildInfo(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800">Thông tin của trẻ</h2>
              <button type="button" onClick={() => setShowChildInfo(false)} className="p-1 text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>

            {isEditMode ? (
              <div className="space-y-4">
                {[
                  { label: 'Họ và tên', name: 'fullName', type: 'text' },
                  { label: 'Ngày sinh', name: 'dateOfBirth', type: 'date' },
                  { label: 'Địa chỉ', name: 'address', type: 'text' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                    <input type={f.type} name={f.name} value={editFormData[f.name] || ''} onChange={handleEditFormChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại phụ huynh</label>
                  <input type="tel" name="parentPhone" value={editFormData.parentPhone || ''} maxLength="10" placeholder="Nhập 10 số"
                    onChange={(e) => { const v = e.target.value.replace(/\D/g,''); if(v.length<=10) handleEditFormChange({target:{name:'parentPhone',value:v}}); }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                </div>
                {saveMessage && (
                  <div className={`p-3 rounded-xl text-sm font-medium ${saveMessage.type==='success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {saveMessage.text}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={handleCancelEdit} disabled={isSaving} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 active:bg-gray-50 transition disabled:opacity-50">Hủy</button>
                  <button type="button" onClick={handleSaveChanges} disabled={isSaving} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold active:bg-emerald-700 transition disabled:opacity-50">
                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {[
                    { label: 'Họ và tên', value: studentInfo.fullName },
                    { label: 'Ngày sinh', value: studentInfo.dateOfBirth ? new Date(studentInfo.dateOfBirth).toLocaleDateString('vi-VN') : '—' },
                    { label: 'Địa chỉ', value: studentInfo.address || '—' },
                    { label: 'SĐT phụ huynh', value: parentPhone || '—' },
                  ].map(row => (
                    <div key={row.label} className="flex items-start gap-2">
                      <span className="text-gray-500 text-sm w-32 flex-shrink-0">{row.label}</span>
                      <span className="text-gray-900 text-sm font-medium flex-1">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-5">
                  <button type="button" onClick={handleEditClick} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 active:bg-gray-50 transition">Chỉnh sửa</button>
                  <button type="button" onClick={() => setShowChildInfo(false)} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold active:bg-emerald-700 transition">Đóng</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
