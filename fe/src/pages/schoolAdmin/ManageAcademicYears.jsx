import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Archive as ArchiveIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

function ManageAcademicYears() {
  const [currentYear] = useState({
    name: 'Năm học 2025 – 2026',
    startDate: '01/09/2025',
    endDate: '31/05/2026',
    topics: 'Phát triển toàn diện & Kỹ năng sống',
    status: 'active',
  });

  const [archiveYear, setArchiveYear] = useState('2024-2025');

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { key: 'overview', label: 'Tổng quan trường' },
    {
      key: 'academic-years',
      label: 'Quản lý năm học',
      children: [
        { key: 'academic-plan', label: 'Thiết lập kế hoạch' },
        { key: 'academic-classes', label: 'Danh sách lớp học' },
        { key: 'academic-students', label: 'Danh sách trẻ' },
        { key: 'academic-curriculum', label: 'Chương trình giáo dục' },
        { key: 'academic-schedule', label: 'Thời khóa biểu' },
        { key: 'academic-report', label: 'Báo cáo & thống kê' },
      ],
    },
    { key: 'classes', label: 'Lớp học' },
    { key: 'menu', label: 'Quản lý thực đơn' },
    { key: 'teachers', label: 'Giáo viên' },
    { key: 'students', label: 'Học sinh & phụ huynh' },
    { key: 'assets', label: 'Quản lý tài sản' },
    { key: 'reports', label: 'Báo cáo của trường' },
    { key: 'contacts', label: 'Liên hệ' },
    { key: 'qa', label: 'Câu hỏi' },
    { key: 'blogs', label: 'Quản lý blog' },
    { key: 'documents', label: 'Quản lý tài liệu' },
    { key: 'public-info', label: 'Thông tin công khai' },
    { key: 'attendance', label: 'Quản lý điểm danh' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      navigate('/school-admin');
      return;
    }
    if (key === 'academic-years' || key === 'academic-plan') {
      navigate('/school-admin/academic-years');
      return;
    }
    if (key === 'academic-classes') {
      navigate('/school-admin/classes');
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
    if (key === 'menu') {
      navigate('/school-admin/menus');
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

  const userName = user?.fullName || user?.username || 'School Admin';

  return (
    <RoleLayout
      title="Quản lý Năm học"
      description="Tổng quan năm học đang hoạt động, và tra cứu lịch sử các năm học trước."
      menuItems={menuItems}
      activeKey="academic-plan"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
      <Stack spacing={3}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.8 }}>
                MamNon DX &gt; Ban Giám Hiệu &gt; Quản lý Năm học
              </Typography>
              <Typography variant="h6" fontWeight={700} mt={0.5}>
                Năm học 2025 – 2026
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }} mt={0.5}>
                Tổng quan năm học đang hoạt động. Bạn có thể thiết lập kế hoạch chi tiết ở các menu bên trái.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                bgcolor: 'white',
                color: '#4f46e5',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: '#e5e7ff',
                },
              }}
            >
              Tạo năm học mới
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={1}
          sx={{
            p: 3,
            borderRadius: 2,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <CalendarIcon />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Năm học hiện tại
              </Typography>
              <Typography variant="h6" fontWeight={700} color="text.primary" mt={0.5}>
                {currentYear.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Bắt đầu: {currentYear.startDate} – Kết thúc: {currentYear.endDate} | Chủ đề:{' '}
                {currentYear.topics}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label="Đang hoạt động"
              color="success"
              sx={{
                fontWeight: 600,
              }}
            />
            <Button
              variant="outlined"
              color="error"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Kết thúc năm học
            </Button>
          </Stack>
        </Paper>

        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
            <ArchiveIcon sx={{ color: '#6b7280' }} />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Lưu trữ &amp; Lịch sử năm học
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tra cứu dữ liệu cũ hoặc phân tích xu hướng phát triển qua các năm học.
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Năm học</InputLabel>
              <Select
                label="Năm học"
                value={archiveYear}
                onChange={(e) => setArchiveYear(e.target.value)}
              >
                <MenuItem value="2024-2025">Năm học 2024 – 2025 (đã kết thúc)</MenuItem>
                <MenuItem value="2023-2024">Năm học 2023 – 2024 (đã kết thúc)</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              sx={{
                bgcolor: '#6366f1',
                '&:hover': { bgcolor: '#4f46e5' },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
              }}
            >
              Tra cứu
            </Button>
            <Box sx={{ flexGrow: 1 }} />
          </Stack>
        </Paper>
      </Stack>
    </RoleLayout>
  );
}

export default ManageAcademicYears;

