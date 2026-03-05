import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';

function StudentInClass() {
  const { classId } = useParams();
  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
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

    if (!classId) {
      navigate('/school-admin/classes', { replace: true });
      return;
    }

    fetchStudents();
  }, [navigate, user, hasRole, classId, isInitializing]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.CLASSES.STUDENTS(classId));
      setStudents(response.data || []);
      if (response.classInfo) {
        setClassInfo(response.classInfo);
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách học sinh');
      console.error('Error fetching students:', err);
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

  const handleGoBack = () => {
    if (hasRole('SystemAdmin')) {
      navigate('/system-admin/classes');
    } else {
      navigate('/school-admin/classes');
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

  const handleMenuSelect = (key) => {
    if (key === 'classes') {
      if (hasRole('SystemAdmin')) {
        navigate('/system-admin/classes');
      } else {
        navigate('/school-admin/classes');
      }
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

  // Lọc danh sách học sinh theo từ khóa tìm kiếm
  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RoleLayout
      title="Quản lý Học Sinh"
      description="Xem danh sách học sinh trong lớp, quản lý thông tin chi tiết."
      menuItems={getMenuItems()}
      activeKey="classes"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
      userName={user?.fullName || user?.username || 'Admin'}
      userAvatar={user?.avatar}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        {/* Header + Filter */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { md: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              variant="outlined"
              size="small"
              sx={{
                mb: 1.5,
                borderRadius: 5,
                fontSize: '0.75rem',
                fontWeight: 500,
                borderColor: 'grey.300',
                color: 'text.secondary',
                bgcolor: 'grey.50',
                '&:hover': { bgcolor: 'grey.100', borderColor: 'grey.400' },
              }}
            >
              Quay lại danh sách lớp
            </Button>

            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {classInfo ? `Lớp ${classInfo.className}` : 'Danh sách học sinh'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
              {classInfo && (
                <>
                  Khối:{' '}
                  <Box component="span" sx={{ fontWeight: 700 }}>
                    {classInfo.gradeId?.gradeName || 'N/A'}
                  </Box>
                  {' '}•{' '}Năm học:{' '}
                  <Box component="span" sx={{ fontWeight: 700 }}>
                    {classInfo.academicYearId?.yearName || 'N/A'}
                  </Box>
                  {' '}•{' '}
                </>
              )}
              Tổng học sinh:{' '}
              <Box component="span" sx={{ fontWeight: 700 }}>
                {students.length}
              </Box>
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <TextField
              size="small"
              placeholder="Tìm kiếm tên học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 220 }}
            />
            <Button
              type="button"
              onClick={fetchStudents}
              variant="outlined"
              startIcon={<RefreshIcon />}
              sx={{
                fontWeight: 500,
                bgcolor: 'grey.100',
                borderColor: 'grey.300',
                color: 'text.primary',
                '&:hover': { bgcolor: 'grey.200' },
              }}
            >
              Tải lại
            </Button>
            <Button
              type="button"
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                fontWeight: 600,
                bgcolor: 'indigo.600',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' },
              }}
            >
              Thêm học sinh
            </Button>
          </Stack>
        </Box>

        {/* Stats Section */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            gap: 2,
            mb: 3,
          }}
        >
          {[
            { label: 'Tổng học sinh', value: students.length },
            { label: 'Nam', value: students.filter((s) => s.gender === 'male').length },
            { label: 'Nữ', value: students.filter((s) => s.gender === 'female').length },
          ].map(({ label, value }) => (
            <Paper
              key={label}
              variant="outlined"
              sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}
              >
                {label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
                {value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Table Section */}
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Đang tải danh sách học sinh...
            </Typography>
          </Box>
        ) : filteredStudents.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Không tìm thấy học sinh nào
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Tên học sinh</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Giới tính</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Ngày sinh</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Điện thoại</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Địa chỉ</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: 'text.primary' }}>Trạng thái</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: 'text.primary' }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((student, index) => (
                  <TableRow
                    key={student._id || index}
                    hover
                    sx={{ '&:last-child td': { border: 0 } }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {student.fullName}
                      </Typography>
                      {(student.parentId?.email || student.userId?.email) && (
                        <Typography variant="caption" color="text.secondary">
                          {student.parentId?.email || student.userId?.email}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={
                          student.gender === 'male'
                            ? 'Nam'
                            : student.gender === 'female'
                            ? 'Nữ'
                            : 'Khác'
                        }
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          ...(student.gender === 'male'
                            ? { bgcolor: '#eff6ff', color: '#1d4ed8' }
                            : student.gender === 'female'
                            ? { bgcolor: '#fdf2f8', color: '#be185d' }
                            : { bgcolor: 'grey.100', color: 'text.secondary' }),
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.primary">
                        {student.dateOfBirth
                          ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.primary">
                        {student.phone || 'N/A'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        title={student.address || 'N/A'}
                        sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {student.address || 'N/A'}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={student.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          ...(student.status === 'active'
                            ? { bgcolor: '#f0fdf4', color: '#15803d' }
                            : { bgcolor: 'grey.100', color: 'text.secondary' }),
                        }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          type="button"
                          size="small"
                          startIcon={<VisibilityIcon fontSize="inherit" />}
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            bgcolor: '#eef2ff',
                            color: '#4338ca',
                            '&:hover': { bgcolor: '#e0e7ff' },
                            borderRadius: 1.5,
                            px: 1.5,
                            py: 0.5,
                            minWidth: 'unset',
                          }}
                        >
                          Xem
                        </Button>
                        <Button
                          type="button"
                          size="small"
                          startIcon={<EditIcon fontSize="inherit" />}
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            bgcolor: 'grey.100',
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'grey.200' },
                            borderRadius: 1.5,
                            px: 1.5,
                            py: 0.5,
                            minWidth: 'unset',
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

export default StudentInClass;
