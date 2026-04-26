import {
  Cancel as AbsentIcon,
  ArrowForward as ArrowIcon,
  HowToReg as AttendIcon,
  BarChart as ChartIcon,
  CheckCircle as CheckCircleIcon,
  EventBusy as LeaveIcon,
  People as PeopleIcon,
  DirectionsCar as PickupIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  Grid,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Tooltip,
  Typography
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTeacher } from '../../context/TeacherContext';
import { useAppMenu } from '../../hooks/useAppMenu';
import { ENDPOINTS, get } from '../../service/api';

function StatCard({ label, value, sub, icon, gradient, accentColor, loading }) {
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
          {loading
            ? <Skeleton width={60} height={36} />
            : (
              <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1, color: accentColor }}>
                {value}
              </Typography>
            )}
          <Typography variant="caption" color="text.disabled" noWrap sx={{ display: 'block', mt: 0.25 }}>
            {sub}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

const BAR_COLORS = {
  present: '#10b981',
  absent: '#ef4444',
  leave: '#f59e0b',
};

const toLocalISODate = (dateValue = new Date()) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

function WeeklyAttendanceChart({ data, loading }) {
  const maxVal = data ? Math.max(...data.map((d) => d.total), 1) : 1;

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <ChartIcon sx={{ fontSize: 18, color: 'primary.main' }} />
        <Typography variant="subtitle2" fontWeight={700}>Điểm danh trong tuần</Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1.5 }}>
          {[['present', 'Có mặt'], ['absent', 'Vắng'], ['leave', 'Nghỉ phép']].map(([key, label]) => (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: BAR_COLORS[key] }} />
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ p: 2.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="rounded" width="19%" height={120} />)}
          </Box>
        ) : !data || data.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
            Chưa có dữ liệu điểm danh tuần này
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 160 }}>
            {data.map((day) => {
              const isToday = toLocalISODate(day.date) === toLocalISODate();
              const segments = [
                { key: 'present', val: day.present },
                { key: 'absent', val: day.absent },
                { key: 'leave', val: day.leave },
              ].filter((s) => s.val > 0);

              return (
                <Tooltip
                  key={day.date}
                  title={
                    <Box>
                      <Typography variant="caption" fontWeight={700}>{day.dayName} ({day.date})</Typography>
                      <br /><Typography variant="caption">Có mặt: {day.present}</Typography>
                      <br /><Typography variant="caption">Vắng: {day.absent}</Typography>
                      <br /><Typography variant="caption">Nghỉ phép: {day.leave}</Typography>
                    </Box>
                  }
                  arrow
                >
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, cursor: 'default' }}>
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column-reverse', gap: '2px', height: 130 }}>
                      {segments.length === 0 ? (
                        <Box sx={{ width: '100%', height: '100%', bgcolor: 'grey.100', borderRadius: 1 }} />
                      ) : (
                        segments.map(({ key, val }) => (
                          <Box
                            key={key}
                            sx={{
                              width: '100%',
                              height: `${(val / maxVal) * 100}%`,
                              minHeight: 4,
                              bgcolor: BAR_COLORS[key],
                              borderRadius: 1,
                              opacity: 0.85,
                              transition: 'height 0.3s ease',
                            }}
                          />
                        ))
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      fontWeight={isToday ? 800 : 500}
                      color={isToday ? 'primary.main' : 'text.secondary'}
                    >
                      {day.dayName}
                    </Typography>
                    {isToday && (
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', mt: -0.5 }} />
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        )}
      </Box>
    </Paper>
  );
}

function TeacherDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission, isInitializing: isAuthInitializing } = useAuth();
  const { getDashboard, loading: isTeacherLoading, error } = useTeacher();
  const { menuItems, activeKey, handleMenuSelect } = useAppMenu();

  const [isInitializing, setIsInitializing] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState('');

  const isLoading = isInitializing || isTeacherLoading;

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.LIST);
        if (response.status === 'success') {
          setAcademicYears(response.data);
          const current = response.data.find(y => y.status === 'active');
          if (current) setSelectedYearId(current._id);
        }
      } catch (err) {
        console.error('Lỗi lấy danh sách năm học:', err);
      }
    };
    fetchYears();
  }, []);

  useEffect(() => {
    if (isAuthInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('Teacher') && !userRoles.includes('HeadTeacher')) { navigate('/', { replace: true }); return; }

    const fetchData = async () => {
      try { setData(await getDashboard(selectedYearId)); } catch (_) { }
      finally { setIsInitializing(false); }
    };
    fetchData();
  }, [navigate, user, getDashboard, isAuthInitializing, selectedYearId]);

  const userName = user?.fullName || user?.username || 'Teacher';

  const initials = userName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase();

  const dashData = data?.data ?? null;
  const classes = dashData?.classes ?? [];
  const totalStudents = dashData?.totalStudents ?? 0;
  const todayAtt = dashData?.todayAttendance ?? null;
  const weeklyAtt = dashData?.weeklyAttendance ?? [];

  const statCards = [
    {
      key: 'classes',
      label: 'Lớp phụ trách',
      value: classes.length,
      sub: classes.length > 0 
        ? `${classes.map((c) => c.className).join(' · ')} (${dashData?.yearName || '—'})` 
        : 'Chưa phân lớp',
      icon: <SchoolIcon sx={{ fontSize: 26, color: 'white' }} />,
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      accentColor: '#6366f1',
    },
    {
      key: 'students',
      label: 'Sĩ số học sinh',
      value: totalStudents,
      sub: `Sĩ số học sinh năm học ${dashData?.yearName || '—'}`,
      icon: <PeopleIcon sx={{ fontSize: 26, color: 'white' }} />,
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
      accentColor: '#0ea5e9',
    },
    {
      key: 'present',
      label: 'Có mặt hôm nay',
      value: todayAtt ? todayAtt.present : '—',
      sub: todayAtt
        ? `Vắng ${todayAtt.absent} · Nghỉ phép ${todayAtt.leave} / Tổng ${todayAtt.total}`
        : 'Chưa có dữ liệu hôm nay',
      icon: <CheckCircleIcon sx={{ fontSize: 26, color: 'white' }} />,
      gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
      accentColor: '#10b981',
    },
  ];

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Welcome banner */}
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
        <Box sx={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'absolute', right: 60, bottom: -40, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
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
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                displayEmpty
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.12)',
                  borderRadius: 2,
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.6)' },
                  '.MuiSelect-icon': { color: 'white' },
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
                renderValue={(selected) => {
                  if (!selected) return 'Chọn năm học';
                  const year = academicYears.find(y => String(y._id) === String(selected));
                  return year ? year.yearName : 'Chọn năm học';
                }}
              >
                {academicYears.map((year) => (
                  <MenuItem key={year._id} value={year._id}>
                    {year.yearName} {year.status === 'active' && <Chip label="Hiện tại" size="small" color="primary" sx={{ ml: 1, height: 20 }} />}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {hasPermission('MANAGE_ATTENDANCE') && (
              <Button
                variant="contained"
                startIcon={<AttendIcon />}
                onClick={() => navigate('/teacher/attendance')}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.18)', color: 'white',
                  fontWeight: 700, borderRadius: 2, textTransform: 'none',
                  border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.28)', boxShadow: 'none' },
                }}
              >
                Điểm danh
              </Button>
            )}
            {hasPermission('MANAGE_PICKUP') && (
              <Button
                variant="contained"
                startIcon={<PickupIcon />}
                onClick={() => navigate('/teacher/pickup-approval')}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.18)', color: 'white',
                  fontWeight: 700, borderRadius: 2, textTransform: 'none',
                  border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.28)', boxShadow: 'none' },
                }}
              >
                Đơn đưa đón
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Stat cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid key={card.key} size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard {...card} loading={isLoading} />
          </Grid>
        ))}
      </Grid>

      {/* Weekly chart + Today breakdown */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <WeeklyAttendanceChart data={weeklyAtt} loading={isLoading} />
        </Grid>

        {/* Today detail */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', height: '100%' }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttendIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="subtitle2" fontWeight={700}>Hôm nay</Typography>
              <Chip label={new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} size="small" color="primary" variant="outlined" sx={{ ml: 'auto', height: 22, fontSize: 11 }} />
            </Box>
            <Box sx={{ p: 2 }}>
              {isLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={44} />)}
                </Box>
              ) : todayAtt ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { label: 'Có mặt', value: todayAtt.present, color: '#10b981', bg: '#d1fae5', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
                    { label: 'Vắng mặt', value: todayAtt.absent, color: '#ef4444', bg: '#fee2e2', icon: <AbsentIcon sx={{ fontSize: 16 }} /> },
                    { label: 'Nghỉ phép', value: todayAtt.leave, color: '#f59e0b', bg: '#fef3c7', icon: <LeaveIcon sx={{ fontSize: 16 }} /> },
                  ].map((item) => (
                    <Box
                      key={item.label}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        p: 1.25, borderRadius: 2, bgcolor: item.bg,
                      }}
                    >
                      <Box sx={{ color: item.color }}>{item.icon}</Box>
                      <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>{item.label}</Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ color: item.color }}>{item.value}</Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 0.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Tổng đã điểm danh</Typography>
                    <Typography variant="caption" fontWeight={700}>{todayAtt.total} / {totalStudents}</Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  Chưa có dữ liệu hôm nay
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick links */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={700}>Truy cập nhanh</Typography>
        </Box>
        <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {[
            { label: 'Điểm danh hôm nay', desc: 'Quản lý check-in / check-out', color: '#6366f1', path: '/teacher/attendance', icon: <AttendIcon fontSize="small" />, permission: 'MANAGE_ATTENDANCE' },
            { label: 'Đơn đưa đón', desc: 'Phê duyệt người đưa đón', color: '#f59e0b', path: '/teacher/pickup-approval', icon: <PickupIcon fontSize="small" />, permission: 'MANAGE_PICKUP' },
          ].filter((item) => !item.permission || hasPermission(item.permission))
            .map((item) => (
              <Box
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 1.5, py: 1.25, borderRadius: 2,
                  cursor: 'pointer', flex: '1 1 200px',
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
    </Box>
  );
}

export default TeacherDashboard;
