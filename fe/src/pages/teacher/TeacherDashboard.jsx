import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTeacher } from '../../context/TeacherContext';
import RoleLayout from '../../layouts/RoleLayout';
import {
  Box, Grid, Paper, Typography, Chip, Skeleton, Alert,
  List, ListItem, ListItemText, Divider, Button, Avatar,
  ListItemAvatar,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  EventNote as EventNoteIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as ClockIcon,
  ArrowForward as ArrowIcon,
  HowToReg as AttendIcon,
  DirectionsCar as PickupIcon,
} from '@mui/icons-material';

const STAT_CARDS = [
  {
    key: 'classes',
    label: 'Lớp hôm nay',
    value: '2',
    sub: 'Lớp Mầm 1 · Lớp Chồi 2',
    icon: <SchoolIcon sx={{ fontSize: 26, color: 'white' }} />,
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    accentColor: '#6366f1',
  },
  {
    key: 'students',
    label: 'Sĩ số học sinh',
    value: '35',
    sub: 'Tổng số bé đang phụ trách',
    icon: <PeopleIcon sx={{ fontSize: 26, color: 'white' }} />,
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
    accentColor: '#0ea5e9',
  },
  {
    key: 'activities',
    label: 'Hoạt động hôm nay',
    value: '3',
    sub: 'Vẽ tranh · Kể chuyện · Ngoài trời',
    icon: <EventNoteIcon sx={{ fontSize: 26, color: 'white' }} />,
    gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
    accentColor: '#10b981',
  },
];

const RECENT_ACTIVITIES = [
  { text: 'Điểm danh lớp Mầm 1 – 28/30 học sinh có mặt', time: '7:45', color: '#10b981', bgColor: '#d1fae5' },
  { text: 'Đơn đưa đón mới từ phụ huynh chờ phê duyệt', time: '8:10', color: '#f59e0b', bgColor: '#fef3c7' },
  { text: 'Điểm danh lớp Chồi 2 – 25/25 học sinh có mặt', time: '8:30', color: '#10b981', bgColor: '#d1fae5' },
];

function StatCard({ label, value, sub, icon, gradient, accentColor }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'all 0.2s',
        '&:hover': { boxShadow: '0 8px 25px rgba(0,0,0,0.10)', transform: 'translateY(-3px)' },
      }}
    >
      {/* Accent bar */}
      <Box sx={{ height: 4, background: gradient }} />
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 48, height: 48, borderRadius: 2.5,
            background: gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px ${accentColor}40`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap>
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1, color: accentColor }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.disabled" noWrap sx={{ display: 'block', mt: 0.25 }}>
            {sub}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

function TeacherDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isInitializing } = useAuth();
  const { getDashboard, loading, error } = useTeacher();

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('Teacher') && !userRoles.includes('HeadTeacher')) { navigate('/', { replace: true }); return; }
    const fetchData = async () => {
      try { setData(await getDashboard()); } catch (_) {}
    };
    fetchData();
  }, [navigate, user, getDashboard, isInitializing]);

  const { hasPermission, hasRole } = useAuth();

  const ALL_TEACHER_MENU = [
    { key: 'classes',          label: 'Lớp phụ trách' },
    { key: 'students',         label: 'Danh sách học sinh' },
    { key: 'attendance',       label: 'Điểm danh',              permission: 'MANAGE_ATTENDANCE' },
    { key: 'pickup-approval',  label: 'Đơn đăng ký đưa đón',    permission: 'MANAGE_PICKUP' },
    { key: 'leave-requests',   label: 'Danh sách đơn xin nghỉ', permission: 'MANAGE_ATTENDANCE' },
    { key: 'contact-book',     label: 'Sổ liên lạc' },
    { key: 'purchase-request', label: 'Cơ sở vật chất',         permission: 'MANAGE_PURCHASE_REQUEST' },
    { key: 'class-assets',     label: 'Tài sản lớp',            permission: 'MANAGE_ASSET' },
    // Chỉ hiện với thành viên Ban kiểm kê (role InventoryStaff được backend tự gán khi assign vào ban)
    { key: 'asset-inspection', label: 'Kiểm kê tài sản',        role: 'InventoryStaff' },
  ];

  const menuItems = useMemo(() => {
    const items = ALL_TEACHER_MENU.filter((item) => {
      if (item.permission) return hasPermission(item.permission);
      if (item.role) return hasRole(item.role);
      return true;
    });
    if (hasPermission('MANAGE_TEACHER_REPORT')) {
      items.push({ key: 'manage-purchase-requests', label: 'Duyệt báo cáo giáo viên' });
    }
    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission, hasRole]);

  const activeKey = useMemo(() => {
    const path = location.pathname || '';
    if (path.startsWith('/teacher/contact-book'))   return 'contact-book';
    if (path.startsWith('/teacher/attendance'))     return 'attendance';
    if (path.startsWith('/teacher/pickup-approval')) return 'pickup-approval';
    if (path.startsWith('/teacher/leave-requests')) return 'leave-requests';
    if (path.startsWith('/teacher/purchase-request')) return 'purchase-request';
    if (path.startsWith('/teacher/class-assets'))   return 'class-assets';
    if (path.startsWith('/teacher/asset-inspection')) return 'asset-inspection';
    if (path.startsWith('/teacher/manage-purchase-requests')) return 'manage-purchase-requests';
    return 'classes';
  }, [location.pathname]);

  const userName = user?.fullName || user?.username || 'Teacher';

  const handleMenuSelect = (key) => {
    const MAP = {
      classes: '/teacher',
      students: '/teacher/students',
      'contact-book': '/teacher/contact-book',
      attendance: '/teacher/attendance',
      'pickup-approval': '/teacher/pickup-approval',
      'leave-requests': '/teacher/leave-requests',
      'purchase-request': '/teacher/purchase-request',
      'class-assets': '/teacher/class-assets',
      'asset-inspection': '/teacher/asset-inspection',
    };
    if (MAP[key]) navigate(MAP[key]);
  };

  const initials = userName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase();

  return (
    <RoleLayout
      title="Bảng điều khiển"
      description="Xem nhanh lớp phụ trách, học sinh và hoạt động hôm nay."
      menuItems={menuItems}
      activeKey={activeKey}
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* ── Welcome banner ── */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: 'white',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Decorative circles */}
        <Box sx={{
          position: 'absolute', right: -30, top: -30,
          width: 140, height: 140, borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.06)',
        }} />
        <Box sx={{
          position: 'absolute', right: 60, bottom: -40,
          width: 100, height: 100, borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.05)',
        }} />

        <Box sx={{
          position: 'relative', zIndex: 1,
          p: { xs: 2.5, md: 3 },
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={user?.avatar}
              sx={{ width: 52, height: 52, bgcolor: 'rgba(255,255,255,0.25)', fontWeight: 700, fontSize: 18, border: '2px solid rgba(255,255,255,0.4)' }}
            >
              {initials}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.75, mb: 0.25 }}>Giáo viên</Typography>
              <Typography variant="h6" fontWeight={700}>
                Xin chào, {userName}! 👋
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<AttendIcon />}
              onClick={() => navigate('/teacher/attendance')}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.18)', color: 'white',
                fontWeight: 700, borderRadius: 2, textTransform: 'none',
                border: '1px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(8px)',
                boxShadow: 'none',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.28)', boxShadow: 'none' },
              }}
            >
              Điểm danh
            </Button>
            <Button
              variant="contained"
              startIcon={<PickupIcon />}
              onClick={() => navigate('/teacher/pickup-approval')}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.18)', color: 'white',
                fontWeight: 700, borderRadius: 2, textTransform: 'none',
                border: '1px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(8px)',
                boxShadow: 'none',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.28)', boxShadow: 'none' },
              }}
            >
              Đơn đưa đón
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* ── Stat cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {loading
          ? [1, 2, 3].map((i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
              </Grid>
            ))
          : STAT_CARDS.map((card) => (
              <Grid key={card.key} size={{ xs: 12, sm: 6, md: 4 }}>
                <StatCard {...card} />
              </Grid>
            ))
        }
      </Grid>

      {/* ── Bottom panels ── */}
      <Grid container spacing={2.5}>
        {/* Recent activity */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            elevation={0}
            sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
          >
            <Box sx={{
              px: 2.5, py: 2,
              borderBottom: '1px solid', borderColor: 'divider',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ClockIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="subtitle2" fontWeight={700}>Hoạt động gần đây</Typography>
              </Box>
              <Chip label="Hôm nay" size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
            </Box>

            {loading ? (
              <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={52} />)}
              </Box>
            ) : (
              <List disablePadding>
                {RECENT_ACTIVITIES.map((item, i) => (
                  <Box key={i}>
                    <ListItem sx={{ px: 2.5, py: 1.5 }}>
                      <ListItemAvatar sx={{ minWidth: 44 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: item.bgColor }}>
                          <CheckCircleIcon sx={{ fontSize: 16, color: item.color }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.text}
                        slotProps={{ primary: { style: { fontSize: 13, fontWeight: 500 } } }}
                      />
                      <Chip
                        label={item.time}
                        size="small"
                        sx={{
                          height: 22, fontSize: 11, fontWeight: 600,
                          bgcolor: item.bgColor, color: item.color, ml: 1, flexShrink: 0,
                        }}
                      />
                    </ListItem>
                    {i < RECENT_ACTIVITIES.length - 1 && <Divider component="li" sx={{ ml: 7 }} />}
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Quick links + API data */}
        <Grid size={{ xs: 12, md: 5 }}>
          {/* Quick links */}
          <Paper
            elevation={0}
            sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2.5 }}
          >
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={700}>Truy cập nhanh</Typography>
            </Box>
            <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {[
                { label: 'Điểm danh hôm nay', desc: 'Quản lý check-in / check-out', color: '#6366f1', path: '/teacher/attendance', icon: <AttendIcon fontSize="small" /> },
                { label: 'Đơn đưa đón', desc: 'Phê duyệt người đưa đón', color: '#f59e0b', path: '/teacher/pickup-approval', icon: <PickupIcon fontSize="small" /> },
              ].map((item) => (
                <Box
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    px: 1.5, py: 1.25, borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Avatar sx={{ width: 36, height: 36, bgcolor: `${item.color}18`, borderRadius: 1.5 }}>
                    <Box sx={{ color: item.color }}>{item.icon}</Box>
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{item.label}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{item.desc}</Typography>
                  </Box>
                  <ArrowIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                </Box>
              ))}
            </Box>
          </Paper>

          {/* API data */}
          {/* <Paper
            elevation={0}
            sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
          >
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={700}>Dữ liệu từ API</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              {loading ? (
                <Skeleton variant="rounded" height={100} />
              ) : (
                <Box
                  component="pre"
                  sx={{
                    m: 0, p: 2, borderRadius: 2,
                    bgcolor: 'grey.50',
                    fontSize: 11, color: 'text.secondary',
                    fontFamily: 'monospace',
                    overflow: 'auto', maxHeight: 160,
                  }}
                >
                  {JSON.stringify(data, null, 2) || 'Chưa có dữ liệu'}
                </Box>
              )}
            </Box>
          </Paper> */}
        </Grid>
      </Grid>
    </RoleLayout>
  );
}

export default TeacherDashboard;
