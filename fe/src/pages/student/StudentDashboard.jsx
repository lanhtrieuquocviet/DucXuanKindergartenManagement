import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, put, ENDPOINTS } from '../../service/api';
import { getNotifications, getUnreadCount, markAllAsRead, markAsRead } from '../../service/notification.api';
import {
  Box, Paper, Typography, Avatar, Chip, IconButton, Badge, Button,
  Grid, Stack, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider, Skeleton, Slide, useMediaQuery,
} from '@mui/material';
import {
  Notifications, Person, Logout, ChildCare, Assignment, BarChart,
  DirectionsCar, Restaurant, PhotoLibrary, School, Close, DoneAll,
  EditNote, SwapHoriz, CheckCircle, Home, CalendarMonth,
} from '@mui/icons-material';

const PRIMARY = '#059669';
const PRIMARY_DARK = '#047857';
const PRIMARY_LIGHT = '#d1fae5';
const BG = '#f0fdf4';

const NOTIF_CONFIG = {
  attendance_checkin:  { icon: '🏫', bg: '#dbeafe', label: 'Đến trường' },
  attendance_checkout: { icon: '🏠', bg: '#fce7f3', label: 'Về nhà' },
  attendance_absent:   { icon: '❌', bg: '#fee2e2', label: 'Vắng mặt' },
  timetable_realtime:  { icon: '⏰', bg: '#fef9c3', label: 'Lịch học' },
  timetable_daily:     { icon: '📅', bg: '#dcfce7', label: 'Lịch ngày' },
  meal_issue:          { icon: '🍽️', bg: '#fef3c7', label: 'Bữa ăn' },
  leave_request:       { icon: '📝', bg: '#ede9fe', label: 'Đơn xin nghỉ' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

const ACTION_CARDS = [
  { icon: <ChildCare />,    label: 'Thông tin trẻ',         color: '#059669', bg: '#ecfdf5', key: 'info' },
  { icon: <CheckCircle />,  label: 'Điểm danh hôm nay',     color: '#2563eb', bg: '#eff6ff', key: 'today' },
  { icon: <BarChart />,     label: 'Báo cáo điểm danh',     color: '#7c3aed', bg: '#f5f3ff', key: 'report' },
  { icon: <DirectionsCar />,label: 'Người đón trẻ',          color: '#d97706', bg: '#fffbeb', key: 'pickup' },
  { icon: <Restaurant />,   label: 'Thực đơn',               color: '#059669', bg: '#ecfdf5', key: 'menu' },
  { icon: <PhotoLibrary />, label: 'Hình ảnh bữa ăn',       color: '#0891b2', bg: '#ecfeff', key: 'photos' },
  { icon: <School />,       label: 'Sổ liên lạc điện tử',   color: '#7c3aed', bg: '#f5f3ff', key: 'contact-book' },
  { icon: <EditNote />,     label: 'Đơn xin nghỉ',          color: '#6b7280', bg: '#f9fafb', key: 'leave' },
  { icon: <SwapHoriz />,    label: 'Chuyển lớp',             color: '#6b7280', bg: '#f9fafb', key: 'transfer', disabled: true },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const isMobile = useMediaQuery('(max-width:600px)');

  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [showChildInfo, setShowChildInfo] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [pendingOtp, setPendingOtp] = useState(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTotalTime, setOtpTotalTime] = useState(60);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState(null);

  const pollRef = useRef(null);
  const lastOtpCodeRef = useRef(null);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const roles = user?.roles?.map(r => r.roleName || r) || [];
    if (!roles.includes('Parent') && !roles.includes('Student') && !roles.includes('StudentParent')) {
      navigate('/', { replace: true }); return;
    }
    get(ENDPOINTS.AUTH.MY_CHILDREN)
      .then(res => setChildren(res.data || []))
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  }, [navigate, user, isInitializing]);

  useEffect(() => {
    if (!children.length) {
      setSelectedChildId(null);
      return;
    }
    if (!selectedChildId || !children.some((c) => c._id === selectedChildId)) {
      setSelectedChildId(children[0]._id);
    }
  }, [children, selectedChildId]);

  const studentInfo = children.find((c) => c._id === selectedChildId) || children[0] || null;

  useEffect(() => {
    if (!studentInfo?._id) return;
    const today = new Date();
    const q = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    get(`${ENDPOINTS.STUDENTS.ATTENDANCE_LIST}?studentId=${studentInfo._id}&date=${q}`)
      .then(res => setAttendanceToday((res.data || [])[0] || null))
      .catch(() => setAttendanceToday(null));
  }, [studentInfo?._id]);

  useEffect(() => {
    if (!studentInfo?._id) return;
    const fetchPending = async () => {
      try {
        const res = await get(ENDPOINTS.OTP.PENDING(studentInfo._id));
        const data = res.data;
        if (data) {
          if (data.code !== lastOtpCodeRef.current) {
            lastOtpCodeRef.current = data.code;
            setOtpTotalTime(data.timeLeft || 60);
            setShowOtpModal(true);
          }
          setPendingOtp(data); setOtpTimeLeft(data.timeLeft);
        } else {
          lastOtpCodeRef.current = null; setPendingOtp(null); setOtpTimeLeft(0); setShowOtpModal(false);
        }
      } catch {}
    };
    fetchPending();
    pollRef.current = setInterval(fetchPending, 3000);
    return () => clearInterval(pollRef.current);
  }, [studentInfo?._id]);

  useEffect(() => {
    if (!pendingOtp || otpTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setOtpTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); setPendingOtp(null); setShowOtpModal(false); lastOtpCodeRef.current = null; return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pendingOtp?.code]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try { const res = await getUnreadCount(); setUnreadCount(res.count || 0); } catch {}
    };
    fetch();
    const iv = setInterval(fetch, 30000);
    return () => clearInterval(iv);
  }, [user]);

  const handleOpenNotif = async () => {
    setNotifOpen(true);
    setNotifLoading(true);
    try { const res = await getNotifications(1, 20); setNotifications(res.data || []); setUnreadCount(res.unreadCount || 0); }
    catch {} finally { setNotifLoading(false); }
  };

  const handleMarkAll = async () => {
    try { await markAllAsRead(); setNotifications(p => p.map(n => ({...n, isReadByMe: true}))); setUnreadCount(0); } catch {}
  };

  const handleMarkOne = async (id) => {
    try { await markAsRead(id); setNotifications(p => p.map(n => n._id === id ? {...n, isReadByMe: true} : n)); setUnreadCount(c => Math.max(0, c-1)); } catch {}
  };

  const handleEditClick = () => {
    if (studentInfo) {
      setEditFormData({
        fullName: studentInfo.fullName || '',
        dateOfBirth: studentInfo.dateOfBirth ? studentInfo.dateOfBirth.split('T')[0] : '',
        address: studentInfo.address || '',
        parentPhone: studentInfo.parentPhone || studentInfo.phone || '',
      });
      setIsEditMode(true); setSaveMessage(null);
    }
  };

  const handleSave = async () => {
    if (!studentInfo?._id) return;
    setIsSaving(true); setSaveMessage(null);
    try {
      const res = await put(ENDPOINTS.STUDENTS.UPDATE(studentInfo._id), {
        fullName: editFormData.fullName, dateOfBirth: editFormData.dateOfBirth,
        address: editFormData.address, phone: editFormData.parentPhone, parentPhone: editFormData.parentPhone,
      });
      const updated = res.data || res;
      setChildren(prev => prev.map(c => c._id === (updated._id || updated.id) ? {...c, ...updated} : c));
      setSaveMessage({ type: 'success', text: 'Cập nhật thành công!' });
      setIsEditMode(false);
    } catch (e) {
      setSaveMessage({ type: 'error', text: e.message || 'Cập nhật thất bại.' });
    } finally { setIsSaving(false); }
  };

  const handleCardAction = (key) => {
    const routes = {
      info: () => setShowChildInfo(true),
      today: () => navigate('/student/attendance/today'),
      report: () => navigate('/student/attendance/report'),
      pickup: () => navigate('/student/pickup'),
      menu: () => navigate('/student/menus'),
      photos: () => navigate('/student/meal-photos'),
      'contact-book': () => navigate('/student/contact-book'),
      leave: () => navigate('/student/leave-request'),
    };
    routes[key]?.();
  };

  const studentName = studentInfo?.fullName || 'Học sinh';
  const className = studentInfo?.classId?.className || 'Chưa xếp lớp';
  const parentDisplayName = user?.fullName || user?.username || 'Phụ huynh';

  const attendanceStatus = (() => {
    if (!attendanceToday) return { label: 'Chưa điểm danh', color: 'default' };
    if (attendanceToday.status === 'absent') return { label: 'Vắng mặt', color: 'error' };
    if (attendanceToday.time?.checkOut) return { label: 'Đã về nhà', color: 'info' };
    if (attendanceToday.time?.checkIn || attendanceToday.status === 'present') return { label: 'Đã đến trường', color: 'success' };
    return { label: 'Chưa điểm danh', color: 'default' };
  })();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: BG }}>
      {/* ── AppBar ── */}
      <Box sx={{
        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
        px: 2, pt: 2.5, pb: 3,
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(5,150,105,0.3)',
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
              <School sx={{ fontSize: 20, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem', fontWeight: 500 }}>
                Trường mầm non Đức Xuân
              </Typography>
              <Typography sx={{ color: 'white', fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.2 }}>
                👋 Xin chào, {parentDisplayName}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <IconButton onClick={handleOpenNotif} size="small" sx={{ color: 'white' }}>
              <Badge badgeContent={unreadCount > 9 ? '9+' : unreadCount} color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 16, height: 16 } }}>
                <Notifications />
              </Badge>
            </IconButton>
            <IconButton onClick={() => navigate('/profile')} size="small" sx={{ color: 'white' }}>
              <Person />
            </IconButton>
            <IconButton onClick={() => logout() || navigate('/login', { replace: true })} size="small" sx={{ color: 'white' }}>
              <Logout />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, pb: 4 }}>
        {/* ── Student Card ── */}
        <Paper elevation={0} sx={{
          mt: -1.5, mb: 2.5, p: 2.5, borderRadius: 4,
          border: '1px solid', borderColor: '#bbf7d0',
          background: 'white',
        }}>
          {loading ? (
            <Stack spacing={1}>
              <Skeleton variant="text" width="60%" height={28} />
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="rounded" width={120} height={28} />
            </Stack>
          ) : (
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Avatar sx={{ bgcolor: PRIMARY_LIGHT, color: PRIMARY, width: 56, height: 56, fontSize: '1.4rem', fontWeight: 700, flexShrink: 0 }}>
                {studentName.charAt(0)}
              </Avatar>
              <Box flex={1} minWidth={0}>
                <Typography fontWeight={800} fontSize="1.05rem" color="#111827" noWrap>{studentName}</Typography>
                <Typography fontSize="0.78rem" color="text.secondary" mt={0.2}>
                  Mã học sinh: {studentInfo?.studentCode || '—'}
                </Typography>
                <Stack direction="row" spacing={0.75} alignItems="center" mt={0.25} mb={1}>
                  <School sx={{ fontSize: 14, color: '#6b7280' }} />
                  <Typography fontSize="0.82rem" color="text.secondary">{className}</Typography>
                </Stack>
                <Chip
                  label={attendanceStatus.label}
                  color={attendanceStatus.color}
                  size="small"
                  sx={{ fontWeight: 700, fontSize: '0.72rem', height: 24 }}
                />
              </Box>
            </Stack>
          )}
        </Paper>

        {children.length > 1 && (
          <Paper elevation={0} sx={{ mb: 2.5, p: 2, borderRadius: 3, border: '1px solid', borderColor: '#bbf7d0' }}>
            <Typography fontWeight={700} fontSize="0.9rem" mb={1.25}>Chọn bé cần thao tác</Typography>
            <Grid container spacing={1.25}>
              {children.map((child) => (
                <Grid item xs={12} sm={6} key={child._id}>
                  <Paper
                    elevation={0}
                    onClick={() => setSelectedChildId(child._id)}
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      border: '1.5px solid',
                      borderColor: selectedChildId === child._id ? PRIMARY : '#d1fae5',
                      bgcolor: selectedChildId === child._id ? '#ecfdf5' : 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <Typography fontWeight={700} fontSize="0.86rem" noWrap>{child.fullName}</Typography>
                    <Typography fontSize="0.76rem" color="text.secondary">
                      Mã HS: {child.studentCode || '—'}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* ── Action Grid ── */}
        <Grid container spacing={1.5}>
          {ACTION_CARDS.map((card) => (
            <Grid item xs={6} sm={4} key={card.key}>
              <Paper
                elevation={0}
                onClick={() => !card.disabled && handleCardAction(card.key)}
                sx={{
                  p: 2, borderRadius: 3, cursor: card.disabled ? 'not-allowed' : 'pointer',
                  border: '1.5px solid', borderColor: card.disabled ? '#e5e7eb' : `${card.color}30`,
                  bgcolor: card.disabled ? '#f9fafb' : card.bg,
                  opacity: card.disabled ? 0.5 : 1,
                  transition: 'all 0.15s',
                  '&:hover': !card.disabled ? { transform: 'translateY(-2px)', boxShadow: `0 4px 16px ${card.color}25` } : {},
                  '&:active': !card.disabled ? { transform: 'scale(0.97)' } : {},
                }}
              >
                <Box sx={{ color: card.color, mb: 1, '& svg': { fontSize: 28 } }}>
                  {card.icon}
                </Box>
                <Typography fontSize="0.82rem" fontWeight={700} color={card.disabled ? '#9ca3af' : '#111827'} lineHeight={1.3}>
                  {card.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Notification Dialog ── */}
      <Dialog
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
        PaperProps={{ sx: { borderRadius: isMobile ? '20px 20px 0 0' : 3, mt: isMobile ? 'auto' : undefined, maxHeight: '85vh' } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography fontWeight={700} fontSize="1rem">Thông báo</Typography>
              {unreadCount > 0 && <Chip label={unreadCount} color="error" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />}
            </Stack>
            <Stack direction="row" spacing={0.5}>
              {unreadCount > 0 && (
                <Button size="small" startIcon={<DoneAll sx={{ fontSize: 14 }} />} onClick={handleMarkAll}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', color: PRIMARY }}>
                  Đọc tất cả
                </Button>
              )}
              <IconButton size="small" onClick={() => setNotifOpen(false)}><Close fontSize="small" /></IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
          {notifLoading ? (
            <Stack alignItems="center" py={6}><CircularProgress sx={{ color: PRIMARY }} /></Stack>
          ) : notifications.length === 0 ? (
            <Stack alignItems="center" py={6} spacing={1}>
              <Typography fontSize="2.5rem">🔕</Typography>
              <Typography color="text.secondary" fontSize="0.875rem">Chưa có thông báo nào</Typography>
            </Stack>
          ) : (
            notifications.map((n, idx) => {
              const cfg = NOTIF_CONFIG[n.type] || { icon: '🔔', bg: '#eff6ff' };
              return (
                <Box key={n._id}>
                  <Box
                    onClick={() => !n.isReadByMe && handleMarkOne(n._id)}
                    sx={{
                      px: 2.5, py: 1.75, display: 'flex', gap: 1.5, alignItems: 'flex-start',
                      bgcolor: n.isReadByMe ? 'transparent' : `${cfg.bg}`,
                      cursor: n.isReadByMe ? 'default' : 'pointer',
                      '&:hover': { bgcolor: '#f9fafb' },
                    }}
                  >
                    <Avatar sx={{ width: 36, height: 36, bgcolor: cfg.bg, fontSize: '1.1rem', flexShrink: 0 }}>
                      {cfg.icon}
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={n.isReadByMe ? 400 : 700} lineHeight={1.4}>
                        {n.title}
                      </Typography>
                      {n.body && <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>{n.body}</Typography>}
                      <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>{timeAgo(n.createdAt)}</Typography>
                    </Box>
                    {!n.isReadByMe && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PRIMARY, mt: 0.75, flexShrink: 0 }} />}
                  </Box>
                  {idx < notifications.length - 1 && <Divider />}
                </Box>
              );
            })
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button fullWidth variant="contained" onClick={() => setNotifOpen(false)}
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, bgcolor: PRIMARY, '&:hover': { bgcolor: PRIMARY_DARK } }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Child Info Dialog ── */}
      <Dialog open={showChildInfo} onClose={() => { setShowChildInfo(false); setIsEditMode(false); setSaveMessage(null); }}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, mx: 2 } }}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography fontWeight={700}>Thông tin của trẻ</Typography>
            <IconButton size="small" onClick={() => { setShowChildInfo(false); setIsEditMode(false); setSaveMessage(null); }}>
              <Close fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {isEditMode ? (
            <Stack spacing={2} mt={1}>
              {saveMessage && (
                <Paper sx={{ p: 1.5, bgcolor: saveMessage.type === 'success' ? '#ecfdf5' : '#fef2f2', borderRadius: 2 }}>
                  <Typography fontSize="0.85rem" color={saveMessage.type === 'success' ? PRIMARY : '#dc2626'}>{saveMessage.text}</Typography>
                </Paper>
              )}
              {[
                { label: 'Họ và tên', name: 'fullName', type: 'text' },
                { label: 'Ngày sinh', name: 'dateOfBirth', type: 'date' },
                { label: 'Địa chỉ', name: 'address', type: 'text' },
                { label: 'Số điện thoại', name: 'parentPhone', type: 'tel' },
              ].map(field => (
                <Box key={field.name}>
                  <Typography fontSize="0.78rem" fontWeight={600} color="text.secondary" mb={0.5}>{field.label}</Typography>
                  <Box
                    component="input"
                    type={field.type}
                    value={editFormData[field.name] || ''}
                    onChange={e => setEditFormData(p => ({ ...p, [field.name]: e.target.value }))}
                    sx={{
                      width: '100%', p: 1.25, borderRadius: 2, border: '1.5px solid #d1fae5',
                      fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                      '&:focus': { borderColor: PRIMARY },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          ) : (
            <Stack spacing={1.5} mt={1}>
              {[
                { label: 'Họ và tên', value: studentInfo?.fullName },
                { label: 'Ngày sinh', value: studentInfo?.dateOfBirth ? new Date(studentInfo.dateOfBirth).toLocaleDateString('vi-VN') : '—' },
                { label: 'Lớp', value: className },
                { label: 'Địa chỉ', value: studentInfo?.address || '—' },
                { label: 'Số điện thoại', value: studentInfo?.parentPhone || studentInfo?.phone || '—' },
              ].map(item => (
                <Stack key={item.label} direction="row" spacing={2}>
                  <Typography fontSize="0.82rem" color="text.secondary" width={100} flexShrink={0}>{item.label}</Typography>
                  <Typography fontSize="0.9rem" fontWeight={600} color="#111827">{item.value || '—'}</Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          {isEditMode ? (
            <>
              <Button onClick={() => { setIsEditMode(false); setSaveMessage(null); }} variant="outlined"
                sx={{ flex: 1, borderRadius: 2, textTransform: 'none', borderColor: '#d1d5db', color: '#6b7280' }}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={isSaving} variant="contained"
                sx={{ flex: 1, borderRadius: 2, textTransform: 'none', bgcolor: PRIMARY, '&:hover': { bgcolor: PRIMARY_DARK } }}>
                {isSaving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Lưu thay đổi'}
              </Button>
            </>
          ) : (
            <Button onClick={handleEditClick} variant="contained" fullWidth
              sx={{ borderRadius: 2, textTransform: 'none', bgcolor: PRIMARY, '&:hover': { bgcolor: PRIMARY_DARK } }}>
              Chỉnh sửa
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── OTP Dialog ── */}
      <Dialog open={showOtpModal && !!pendingOtp} onClose={() => setShowOtpModal(false)}
        maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, mx: 2 } }}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography fontWeight={700}>🔑 Mã OTP của bạn</Typography>
            <IconButton size="small" onClick={() => setShowOtpModal(false)}><Close fontSize="small" /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack alignItems="center" spacing={3}>
            <Typography fontSize="2.5rem" fontWeight={800} letterSpacing="0.3em" color="#111827">
              {pendingOtp?.code}
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={otpTotalTime > 0 ? (otpTimeLeft / otpTotalTime) * 100 : 0}
                size={80} thickness={4}
                sx={{ color: PRIMARY }}
              />
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography fontWeight={800} fontSize="1.1rem" color={PRIMARY}>{otpTimeLeft}s</Typography>
              </Box>
            </Box>
            <Typography fontSize="0.8rem" color="text.secondary" textAlign="center">
              Mã này dùng để giáo viên xác nhận đón trẻ trong vòng <strong>{otpTotalTime} giây</strong>.
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* ── OTP Toast (khi đóng modal) ── */}
      {pendingOtp && !showOtpModal && (
        <Paper
          onClick={() => setShowOtpModal(true)}
          elevation={6}
          sx={{
            position: 'fixed', bottom: 24, right: 16, zIndex: 200,
            px: 2.5, py: 1.5, borderRadius: 3, cursor: 'pointer',
            bgcolor: PRIMARY, display: 'flex', alignItems: 'center', gap: 1.5,
          }}
        >
          <Typography color="white" fontSize="0.85rem">🔑 OTP:</Typography>
          <Typography color="white" fontWeight={800} fontSize="1.1rem" letterSpacing="0.2em">
            {pendingOtp.code}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>còn {otpTimeLeft}s</Typography>
        </Paper>
      )}
    </Box>
  );
}
