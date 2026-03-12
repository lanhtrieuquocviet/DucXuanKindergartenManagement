import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Visibility as VisibilityIcon,
  Public as PublicIcon,
} from '@mui/icons-material';

function SchoolAdminDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const { getDashboard, loading, error } = useSchoolAdmin();

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
    if (!userRoles.includes('SchoolAdmin')) {
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
    { key: "overview", label: "Tổng quan trường" },
    {
      key: "academic-years",
      label: "Quản lý năm học",
      children: [
        { key: "academic-year-setup", label: "Thiết lập năm học" },
        { key: "academic-plan", label: "Thiết lập kế hoạch" },
        { key: "academic-students", label: "Danh sách trẻ" },
        { key: 'academic-curriculum', label: 'Chương trình giáo dục' },
        { key: 'academic-schedule', label: 'Thời khóa biểu' },
        { key: 'academic-report', label: 'Báo cáo & thống kê' },
      ],
    },
    { key: "classes", label: "Lớp học" },
    { key: "menu", label: "Quản lý thực đơn" },
    { key: "meal-management", label: "Quản lý bữa ăn" },
    { key: "teachers", label: "Giáo viên" },
    { key: "students", label: "Học sinh & phụ huynh" },
    { key: "assets", label: "Quản lý tài sản" },
    { key: "reports", label: "Báo cáo của trường" },
    { key: "contacts", label: "Liên hệ" },
    { key: "qa", label: "Câu hỏi" },
    { key: "blogs", label: "Quản lý blog" },
    { key: "documents", label: "Quản lý tài liệu" },
    { key: "public-info", label: "Thông tin công khai" },
    { key: "attendance", label: "Quản lý điểm danh" },
  ];

  const userName = user?.fullName || user?.username || 'School Admin';

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const handleMenuSelect = (key) => {
    if (key === 'overview') return;
    if (key === 'academic-years' || key === 'academic-year-setup') {
      navigate('/school-admin/academic-years');
      return;
    }
    if (key === 'academic-curriculum') {
      navigate('/school-admin/curriculum');
      return;
    }
    if (key === 'academic-plan') {
      navigate('/school-admin/academic-plan');
      return;
    }
    if (key === 'academic-students') {
      navigate('/school-admin/students');
      return;
    }
    if (key === 'classes') {
      navigate('/school-admin/classes');
      return;
    }
    if (key === "menu") {
      navigate("/school-admin/menus");
      return;
    }
    if (key === "meal-management") {
      navigate("/school-admin/meal-management");
      return;
    }
    if (key === 'students') {
      navigate('/school-admin/students');
      return;
    }
    if (key === 'contacts') {
      navigate('/school-admin/contacts');
      return;
    }
    if (key === 'qa') {
      navigate('/school-admin/qa');
      return;
    }
    if (key === 'blogs') {
      navigate('/school-admin/blogs');
      return;
    }
    if (key === 'documents') {
      navigate('/school-admin/documents');
      return;
    }
    if (key === 'public-info') {
      navigate('/school-admin/public-info');
      return;
    }
    if (key === 'attendance') {
      navigate('/school-admin/attendance/overview');
      return;
    }
  };

  const statCards = [
    {
      label: 'Số lớp đang hoạt động',
      value: '8',
      note: 'Ví dụ thống kê số lớp trong trường.',
      icon: <SchoolIcon sx={{ fontSize: 32, color: '#6366f1' }} />,
      accent: '#6366f1',
    },
    {
      label: 'Số giáo viên',
      value: '15',
      note: 'Tổng số giáo viên thuộc trường.',
      icon: <PeopleIcon sx={{ fontSize: 32, color: '#0ea5e9' }} />,
      accent: '#0ea5e9',
    },
    {
      label: 'Học sinh',
      value: '120',
      note: 'Tổng số học sinh trong các lớp.',
      icon: <PeopleIcon sx={{ fontSize: 32, color: '#10b981' }} />,
      accent: '#10b981',
    },
  ];

  return (
    <RoleLayout
      title="Bảng điều khiển của Ban giám hiệu"
      description="Quản lý trường, lớp học, giáo viên và phụ huynh trong phạm vi trường."
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
      {/* Header gradient banner */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" fontWeight={700} color="white">
          Tổng quan trường học
        </Typography>
        <Typography variant="body2" color="rgba(255,255,255,0.8)" mt={0.5}>
          Quản lý trường, lớp học, giáo viên và phụ huynh trong phạm vi trường.
        </Typography>
      </Paper>

      {/* Stat cards row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {statCards.map((card) => (
          <Paper
            key={card.label}
            elevation={1}
            sx={{
              p: 3,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
              borderTop: `4px solid ${card.accent}`,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${card.accent}18`,
                flexShrink: 0,
              }}
            >
              {card.icon}
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                {card.label}
              </Typography>
              <Typography variant="h4" fontWeight={700} color="text.primary" mt={0.5}>
                {card.value}
              </Typography>
              <Typography variant="caption" color="text.disabled" mt={0.5} display="block">
                {card.note}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Action cards row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {/* Attendance card */}
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
            <CalendarIcon sx={{ color: '#6366f1' }} />
            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
              Thông tin điểm danh
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={2.5}>
            Xem tổng quan điểm danh của tất cả các lớp trong trường.
          </Typography>
          <Button
            variant="contained"
            startIcon={<VisibilityIcon />}
            onClick={() => navigate('/school-admin/attendance/overview')}
            sx={{
              bgcolor: '#6366f1',
              '&:hover': { bgcolor: '#4f46e5' },
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Xem điểm danh các lớp
          </Button>
        </Paper>

        {/* Public info card */}
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
            <PublicIcon sx={{ color: '#10b981' }} />
            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
              Thông tin công khai
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={2.5}>
            Quản lý các thông tin công khai theo 5 danh mục của trường.
          </Typography>
          <Button
            variant="contained"
            startIcon={<PublicIcon />}
            onClick={() => navigate('/school-admin/public-info')}
            sx={{
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669' },
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Quản lý thông tin công khai
          </Button>
        </Paper>
      </Box>

      {/* API data panel */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} color="text.primary" mb={1.5}>
          Dữ liệu trả về từ API
        </Typography>
        {loading && (
          <Stack direction="row" alignItems="center" spacing={1.5} py={2}>
            <CircularProgress size={18} thickness={4} />
            <Typography variant="body2" color="text.secondary">
              Đang tải...
            </Typography>
          </Stack>
        )}
        {!loading && (
          <Box
            component="pre"
            sx={{
              fontSize: '0.75rem',
              color: 'text.primary',
              overflowX: 'auto',
              maxHeight: 320,
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
              p: 2,
              m: 0,
              fontFamily: 'monospace',
            }}
          >
            {JSON.stringify(data, null, 2)}
          </Box>
        )}
      </Paper>
    </RoleLayout>
  );
}

export default SchoolAdminDashboard;
