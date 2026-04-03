import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTeacher } from '../../context/TeacherContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, ENDPOINTS } from '../../service/api';
import {
  Box, Grid, Paper, Typography, Avatar, Chip,
  Skeleton, Alert, Stack,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  MenuBook as ContactIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';

const GRADE_COLORS = [
  { bg: '#dbeafe', icon: '#2563eb', border: '#bfdbfe' },
  { bg: '#dcfce7', icon: '#16a34a', border: '#bbf7d0' },
  { bg: '#fef9c3', icon: '#ca8a04', border: '#fde68a' },
  { bg: '#fce7f3', icon: '#be185d', border: '#fbcfe8' },
  { bg: '#ede9fe', icon: '#7c3aed', border: '#ddd6fe' },
];

function ClassCard({ cls, onClick, colorIdx }) {
  const color = GRADE_COLORS[colorIdx % GRADE_COLORS.length];
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        borderRadius: 3,
        border: '1.5px solid',
        borderColor: color.border,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
          transform: 'translateY(-3px)',
          borderColor: color.icon,
        },
      }}
    >
      {/* Top accent */}
      <Box sx={{ height: 5, bgcolor: color.icon }} />
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Avatar sx={{ width: 48, height: 48, bgcolor: color.bg, flexShrink: 0 }}>
            <SchoolIcon sx={{ fontSize: 24, color: color.icon }} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {cls.className}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {cls.gradeName || 'Chưa phân khối'}{cls.yearName ? ` · ${cls.yearName}` : ''}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="space-between" mt={2}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {cls.studentCount} học sinh
            </Typography>
          </Stack>
          <Chip
            label="Xem sổ liên lạc"
            size="small"
            icon={<ArrowIcon sx={{ fontSize: 13 }} />}
            sx={{
              bgcolor: color.bg, color: color.icon, fontWeight: 600,
              fontSize: '0.72rem', border: `1px solid ${color.border}`,
              '& .MuiChip-icon': { color: color.icon },
            }}
          />
        </Stack>
      </Box>
    </Paper>
  );
}

function getTeacherMenuItems(isCommitteeMember, hasPermission) {
  const ALL_TEACHER_MENU = [
    { key: 'classes', label: 'Lớp phụ trách' },
    { key: 'students', label: 'Danh sách học sinh' },
    { key: 'attendance', label: 'Điểm danh', permission: 'MANAGE_ATTENDANCE' },
    { key: 'pickup-approval', label: 'Đơn đưa đón', permission: 'MANAGE_PICKUP' },
    { key: 'schedule', label: 'Lịch dạy & hoạt động' },
    { key: 'contact-book', label: 'Sổ liên lạc điện tử' },
    { key: 'purchase-request', label: 'Cơ sở vật chất', permission: 'MANAGE_PURCHASE_REQUEST' },
    { key: 'class-assets', label: 'Tài sản lớp', permission: 'MANAGE_ASSET' },
  ];
  const items = ALL_TEACHER_MENU.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );
  if (isCommitteeMember && hasPermission('MANAGE_ASSET')) {
    items.push({ key: 'asset-inspection', label: 'Kiểm kê tài sản' });
  }
  return items;
}

export default function ContactBook() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isInitializing } = useAuth();
  const { isCommitteeMember } = useTeacher();
  const { hasPermission } = useAuth();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await get(ENDPOINTS.TEACHER.CONTACT_BOOK_CLASSES);
        setClasses(res.data || []);
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách lớp.');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [user, isInitializing, navigate]);

  const menuItems = useMemo(
    () => getTeacherMenuItems(isCommitteeMember, hasPermission),
    [isCommitteeMember, hasPermission]
  );

  const activeKey = useMemo(() => {
    const path = location.pathname || '';
    if (path.startsWith('/teacher/contact-book')) return 'contact-book';
    if (path.startsWith('/teacher/attendance')) return 'attendance';
    if (path.startsWith('/teacher/pickup-approval')) return 'pickup-approval';
    if (path.startsWith('/teacher/purchase-request')) return 'purchase-request';
    if (path.startsWith('/teacher/class-assets')) return 'class-assets';
    if (path.startsWith('/teacher/asset-inspection')) return 'asset-inspection';
    return 'classes';
  }, [location.pathname]);

  const handleMenuSelect = (key) => {
    if (key === 'classes') { navigate('/teacher'); return; }
    if (key === 'contact-book') { navigate('/teacher/contact-book'); return; }
    if (key === 'attendance') { navigate('/teacher/attendance'); return; }
    if (key === 'pickup-approval') { navigate('/teacher/pickup-approval'); return; }
    if (key === 'purchase-request') { navigate('/teacher/purchase-request'); return; }
    if (key === 'class-assets') { navigate('/teacher/class-assets'); return; }
    if (key === 'asset-inspection') { navigate('/teacher/asset-inspection'); return; }
  };

  const userName = user?.fullName || user?.username || 'Teacher';

  return (
    <RoleLayout
      title="Sổ liên lạc điện tử"
      description="Theo dõi thông tin học sinh và liên lạc với phụ huynh."
      menuItems={menuItems}
      activeKey={activeKey}
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {/* Header banner */}
      <Paper
        elevation={0}
        sx={{
          mb: 3, borderRadius: 3,
          background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
          color: 'white', overflow: 'hidden', position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 2.5, md: 3 }, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 46, height: 46, bgcolor: 'rgba(255,255,255,0.2)' }}>
            <ContactIcon sx={{ fontSize: 24 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>Sổ liên lạc điện tử</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Chọn lớp để xem thông tin và theo dõi học sinh
            </Typography>
          </Box>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3].map(i => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : classes.length === 0 ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 6, textAlign: 'center' }}>
          <SchoolIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
          <Typography color="text.secondary">Bạn chưa được phân công lớp nào.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {classes.map((cls, idx) => (
            <Grid key={cls._id} size={{ xs: 12, sm: 6, md: 4 }}>
              <ClassCard
                cls={cls}
                colorIdx={idx}
                onClick={() => navigate(`/teacher/contact-book/${cls._id}`)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </RoleLayout>
  );
}
