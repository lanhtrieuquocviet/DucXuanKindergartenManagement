import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Stack } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

function HeadTeacherAssetIncidents() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const roles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!roles.includes('HeadTeacher')) { navigate('/', { replace: true }); return; }
  }, [isInitializing, user, navigate]);

  const handleMenuSelect = (key) => {
    const routes = {
      classes:                    '/teacher',
      students:                   '/teacher/students',
      attendance:                 '/teacher/attendance',
      'pickup-approval':          '/teacher/pickup-approval',
      'leave-requests':           '/teacher/leave-requests',
      'asset-incidents-teacher':  '/teacher/asset-incidents',
      'class-assets':             '/teacher/class-assets',
      'manage-asset-incidents': '/teacher/manage-asset-incidents',
    };
    navigate(routes[key] || '/teacher');
  };

  const userName = user?.fullName || user?.username || 'HeadTeacher';

  const menuItems = [
    { key: 'classes',                    label: 'Lớp phụ trách' },
    { key: 'students',                   label: 'Danh sách học sinh' },
    { key: 'attendance',                 label: 'Điểm danh' },
    { key: 'pickup-approval',            label: 'Đơn đưa đón' },
    { key: 'leave-requests',             label: 'Danh sách đơn xin nghỉ' },
    { key: 'asset-incidents-teacher',    label: 'Báo cáo sự cố CSVC' },
    { key: 'class-assets',               label: 'Tài sản lớp' },
    { key: 'manage-asset-incidents',     label: 'Điều phối xử lý sự cố' },
  ];

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          mb: 3, p: 3,
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          borderRadius: 2,
          display: 'flex', alignItems: 'center', gap: 2,
        }}
      >
        <ShoppingCartIcon sx={{ color: 'white', fontSize: 36 }} />
        <Box>
          <Typography variant="h5" fontWeight={700} color="white">
            Điều phối xử lý sự cố
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
            Theo dõi báo cáo sự cố và điều phối xử lý trước khi chuyển lên ban giám hiệu
          </Typography>
        </Box>
      </Paper>

      {/* TODO: Implement danh sách báo cáo sự cố từ giáo viên */}
      <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }} spacing={2}>
        <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
        <Typography variant="h6" color="text.secondary" fontWeight={600}>
          Chức năng đang phát triển
        </Typography>
        <Typography variant="body2" color="text.disabled" textAlign="center">
          Tại đây tổ trưởng sẽ theo dõi báo cáo sự cố từ các giáo viên,
          điều phối xử lý và chuyển lên ban giám hiệu.
        </Typography>
      </Stack>
    </Box>
  );
}

export default HeadTeacherAssetIncidents;
