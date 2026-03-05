import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Stack,
  Chip,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Class as ClassIcon,
} from '@mui/icons-material';

function ClassList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { user, hasRole, logout, isInitializing } = useAuth();

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (!hasRole('SchoolAdmin') && !hasRole('SystemAdmin')) {
      navigate('/', { replace: true });
      return;
    }

    fetchClasses();
  }, [navigate, user, hasRole, isInitializing]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.CLASSES.LIST);
      console.log('=== FRONTEND DEBUG: fetchClasses ===');
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      console.log('Data length:', response.data ? response.data.length : 'null');
      console.log('=== END DEBUG ===');
      setClasses(response.data || []);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách lớp học');
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const handleViewStudents = (classId) => {
    navigate(`/school-admin/classes/${classId}/students`);
  };

  const handleMenuSelect = (key) => {
    if (key === 'classes') {
      // Đang ở đây rồi
      return;
    }
    if (key === 'contacts') {
      navigate('/school-admin/contacts');
      return;
    }
    if (key === 'overview') {
      navigate('/school-admin');
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

  // Render menu khác nhau tùy theo role
  const getMenuItems = () => {
    if (hasRole('SystemAdmin')) {
      return [
        { key: 'overview', label: 'Tổng quan hệ thống' },
        { key: 'schools', label: 'Quản lý trường' },
        { key: 'accounts', label: 'Quản lý tài khoản' },
        { key: 'classes', label: 'Lớp học (toàn hệ thống)' },
        { key: 'roles', label: 'Phân quyền & vai trò' },
        { key: 'reports', label: 'Báo cáo tổng hợp' },
      ];
    }
    // Default menu cho SchoolAdmin
    return [
      { key: 'overview', label: 'Tổng quan trường' },
      { key: 'classes', label: 'Lớp học' },
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
  };

  // Lọc danh sách lớp theo từ khóa tìm kiếm
  const filteredClasses = classes.filter((cls) =>
    cls.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClasses = classes.length;
  const activeClasses = classes.filter((c) => c.className).length;
  const totalCapacity = classes.reduce((sum, c) => sum + (c.maxStudents || 0), 0);

  return (
    <RoleLayout
      title="Quản lý Lớp Học"
      description="Xem danh sách tất cả lớp học, quản lý thông tin chi tiết và học sinh."
      menuItems={getMenuItems()}
      activeKey="classes"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
      userName={user?.fullName || user?.username || 'Admin'}
      userAvatar={user?.avatar}
    >
      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <ClassIcon sx={{ color: 'white', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight={700} color="white">
              Danh sách lớp học
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.8)" mt={0.25}>
              Xem danh sách tất cả lớp học, quản lý thông tin chi tiết và học sinh.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Main card */}
      <Paper elevation={1} sx={{ borderRadius: 2, p: 3 }}>
        {/* Header: summary + controls */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          mb={3}
        >
          {/* Summary text */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
              Danh sách lớp học
            </Typography>
            <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap">
              <Typography variant="caption" color="text.secondary">
                Tổng lớp:
              </Typography>
              <Typography variant="caption" fontWeight={700} color="text.primary">
                {totalClasses}
              </Typography>
              <Typography variant="caption" color="text.disabled">•</Typography>
              <Typography variant="caption" color="text.secondary">
                Lớp hoạt động:
              </Typography>
              <Typography variant="caption" fontWeight={700} color="text.primary">
                {activeClasses}
              </Typography>
              <Typography variant="caption" color="text.disabled">•</Typography>
              <Typography variant="caption" color="text.secondary">
                Sức chứa tổng:
              </Typography>
              <Typography variant="caption" fontWeight={700} color="text.primary">
                {totalCapacity}
              </Typography>
            </Stack>
          </Box>

          {/* Controls */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <TextField
              size="small"
              placeholder="Tìm kiếm tên lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 220 }}
            />
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RefreshIcon />}
              onClick={fetchClasses}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              Tải lại
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                bgcolor: '#6366f1',
                '&:hover': { bgcolor: '#4f46e5' },
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Thêm lớp
            </Button>
          </Stack>
        </Stack>

        {/* Table section */}
        {loading ? (
          <Stack alignItems="center" justifyContent="center" spacing={1.5} py={6}>
            <CircularProgress size={32} thickness={4} sx={{ color: '#6366f1' }} />
            <Typography variant="body2" color="text.secondary">
              Đang tải danh sách...
            </Typography>
          </Stack>
        ) : filteredClasses.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" py={6}>
            <Typography variant="body2" color="text.secondary">
              Không tìm thấy lớp học nào
            </Typography>
          </Stack>
        ) : (
          <TableContainer
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
              overflow: 'hidden',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>
                    Tên lớp
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>
                    Khối lớp
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>
                    Năm học
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>
                    Sức chứa
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>
                    Giáo viên
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClasses.map((cls, index) => (
                  <TableRow
                    key={cls._id || index}
                    hover
                    sx={{
                      '&:last-child td': { borderBottom: 0 },
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {cls.className}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {cls.gradeId?.gradeName || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {cls.academicYearId?.yearName || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={cls.maxStudents || 0}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          borderColor: 'grey.400',
                          color: 'text.primary',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {cls.teacherIds?.length || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<VisibilityIcon sx={{ fontSize: '0.875rem !important' }} />}
                          onClick={() => handleViewStudents(cls._id)}
                          sx={{
                            bgcolor: 'rgba(99,102,241,0.1)',
                            color: '#6366f1',
                            boxShadow: 'none',
                            '&:hover': {
                              bgcolor: 'rgba(99,102,241,0.2)',
                              boxShadow: 'none',
                            },
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            py: 0.5,
                          }}
                        >
                          Xem học sinh
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<EditIcon sx={{ fontSize: '0.875rem !important' }} />}
                          sx={{
                            bgcolor: 'grey.100',
                            color: 'text.secondary',
                            boxShadow: 'none',
                            '&:hover': {
                              bgcolor: 'grey.200',
                              boxShadow: 'none',
                            },
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            py: 0.5,
                          }}
                        >
                          Sửa
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </RoleLayout>
  );
}

export default ClassList;
