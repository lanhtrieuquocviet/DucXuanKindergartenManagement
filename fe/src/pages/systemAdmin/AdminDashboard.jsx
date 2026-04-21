import ArticleIcon from '@mui/icons-material/Article';
import BarChartIcon from '@mui/icons-material/BarChart';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import ShieldIcon from '@mui/icons-material/Shield';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSystemAdmin } from '../../context/SystemAdminContext';
import RoleLayout from '../../layouts/RoleLayout';

function SystemAdminDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const { getDashboard, loading, error } = useSystemAdmin();

  useEffect(() => {
    // Chờ quá trình khởi tạo (verify token) hoàn thành
    if (isInitializing) {
      return;
    }

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('SystemAdmin')) {
      navigate('/', { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        const response = await getDashboard();
        setData(response);
      } catch (err) {
        // Error được xử lý trong context
      }
    };

    fetchData();
  }, [navigate, user, getDashboard, isInitializing]);

  const menuItems = [
    { key: 'overview', label: 'Tổng quan hệ thống' },
    { key: 'accounts', label: 'Quản lý người dùng' },
    { key: 'roles', label: 'Quản lý vai trò' },
    { key: 'permissions', label: 'Quản lý phân quyền' },
    { key: 'bpm', label: 'Quản lý quy trình (BPM)' },
    { key: 'system-logs', label: 'Nhật ký hệ thống' },
    // { key: 'reports', label: 'Báo cáo tổng hợp' },
  ];

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      return;
    }
    if (key === 'accounts') {
      navigate('/system-admin/manage-accounts');
      return;
    }
    if (key === 'roles') {
      navigate('/system-admin/manage-roles');
      return;
    }
    if (key === 'permissions') {
      navigate('/system-admin/manage-permissions');
      return;
    }
    if (key === 'bpm') {
      navigate('/system-admin/bpm');
      return;
    }
    if (key === 'system-logs') {
      navigate('/system-admin/system-logs');
      return;
    }
  };

  const userName = user?.fullName || user?.username || 'System Admin';

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const statCards = [
    {
      label: 'Tổng số trường',
      value: '3',
      sub: 'Ví dụ dữ liệu thống kê (mock).',
      icon: <SecurityIcon sx={{ fontSize: 26, color: 'white' }} />,
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      barGradient: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
      shadow: '0 4px 12px rgba(99,102,241,0.40)',
      valueColor: '#6366f1',
    },
    {
      label: 'Tài khoản hoạt động',
      value: '25',
      sub: 'SystemAdmin / SchoolAdmin / Teacher.',
      icon: <PeopleIcon sx={{ fontSize: 26, color: 'white' }} />,
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
      barGradient: 'linear-gradient(90deg, #0ea5e9, #06b6d4)',
      shadow: '0 4px 12px rgba(14,165,233,0.40)',
      valueColor: '#0ea5e9',
    },
    {
      label: 'Thông báo gần đây',
      value: null,
      sub: 'Hệ thống hoạt động ổn định. Không có cảnh báo mới.',
      icon: <NotificationsIcon sx={{ fontSize: 26, color: 'white' }} />,
      gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
      barGradient: 'linear-gradient(90deg, #10b981, #14b8a6)',
      shadow: '0 4px 12px rgba(16,185,129,0.40)',
      valueColor: '#10b981',
    },
  ];

  return (
    <RoleLayout
      title="Bảng điều khiển System Admin"
      description="Quản lý toàn bộ hệ thống trường, tài khoản và phân quyền."
      menuItems={menuItems}
      activeKey="overview"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
    >
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Dashboard Banner */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          mb: 3,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%)',
          position: 'relative',
          p: { xs: 3, md: 4 },
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            top: -32,
            right: -32,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -48,
            right: 80,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 160,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <ShieldIcon sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 28 }} />
            <Chip
              label="System Admin"
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.18)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.72rem',
                letterSpacing: 0.5,
              }}
            />
          </Box>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{ color: 'white', mb: 0.5, lineHeight: 1.3 }}
          >
            Xin chào, {userName}!
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.80)', mb: 2.5, maxWidth: 480 }}
          >
            Quản lý toàn bộ hệ thống trường, tài khoản và phân quyền từ một nơi duy nhất.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<ManageAccountsIcon />}
              onClick={() => navigate('/system-admin/manage-accounts')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.22)',
                color: 'white',
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: 'none',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.32)', boxShadow: 'none' },
              }}
            >
              Quản lý tài khoản
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<ArticleIcon />}
              onClick={() => navigate('/system-admin/system-logs')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.22)',
                color: 'white',
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: 'none',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.32)', boxShadow: 'none' },
              }}
            >
              Nhật ký hệ thống
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<BarChartIcon />}
              onClick={() => navigate('/system-admin/manage-roles')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.22)',
                color: 'white',
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: 'none',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.32)', boxShadow: 'none' },
              }}
            >
              Quản lý vai trò
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid item xs={12} md={4} key={card.label}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ height: 4, background: card.barGradient }} />
              <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2.5,
                    background: card.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: card.shadow,
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {card.label}
                  </Typography>
                  {card.value !== null ? (
                    <Typography
                      variant="h4"
                      fontWeight={800}
                      sx={{ color: card.valueColor, lineHeight: 1.1 }}
                    >
                      {card.value}
                    </Typography>
                  ) : null}
                  <Typography variant="caption" color="text.disabled" display="block">
                    {card.sub}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* API Data Section */}
      {/* <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <BarChartIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">
            Dữ liệu trả về từ API
          </Typography>
        </Box>
        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Skeleton variant="rectangular" height={20} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" height={20} width="80%" sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" height={20} width="60%" sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" height={20} width="70%" sx={{ borderRadius: 1 }} />
            </Box>
          ) : (
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                color: 'text.primary',
                overflowX: 'auto',
                maxHeight: 320,
                overflowY: 'auto',
                lineHeight: 1.6,
              }}
            >
              {JSON.stringify(data, null, 2)}
            </Box>
          )}
        </Box>
      </Paper> */}
    </RoleLayout>
  );
}

export default SystemAdminDashboard;
