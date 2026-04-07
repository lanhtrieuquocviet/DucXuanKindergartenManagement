import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Stack } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';

function HeadTeacherPurchaseRequests() {
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
      'contact-book':             '/teacher/contact-book',
      'purchase-request':         '/teacher/purchase-request',
      'class-assets':             '/teacher/class-assets',
      'manage-purchase-requests': '/teacher/manage-purchase-requests',
    };
    navigate(routes[key] || '/teacher');
  };

  const userName = user?.fullName || user?.username || 'HeadTeacher';

  const menuItems = [
    { key: 'classes',                    label: 'Lớp phụ trách' },
    { key: 'students',                   label: 'Danh sách học sinh' },
    { key: 'attendance',                 label: 'Điểm danh' },
    { key: 'pickup-approval',            label: 'Đơn đưa đón' },
    { key: 'contact-book',               label: 'Sổ liên lạc điện tử' },
    { key: 'purchase-request',           label: 'Cơ sở vật chất' },
    { key: 'class-assets',               label: 'Tài sản lớp' },
    { key: 'manage-purchase-requests',   label: 'Duyệt báo cáo giáo viên' },
  ];

  return (
    <RoleLayout
      title="Duyệt đề xuất mua sắm"
      description="Xem và duyệt đề xuất mua sắm từ các giáo viên trong tổ."
      menuItems={menuItems}
      activeKey="manage-purchase-requests"
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
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
            Duyệt đề xuất mua sắm
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
            Quản lý và duyệt đề xuất từ giáo viên trong tổ, chuyển lên ban giám hiệu
          </Typography>
        </Box>
      </Paper>

      {/* TODO: Implement danh sách đề xuất từ giáo viên */}
      <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }} spacing={2}>
        <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
        <Typography variant="h6" color="text.secondary" fontWeight={600}>
          Chức năng đang phát triển
        </Typography>
        <Typography variant="body2" color="text.disabled" textAlign="center">
          Tại đây tổ trưởng sẽ xem và duyệt đề xuất mua sắm từ các giáo viên,
          sau đó chuyển lên ban giám hiệu.
        </Typography>
      </Stack>
    </RoleLayout>
  );
}

export default HeadTeacherPurchaseRequests;
