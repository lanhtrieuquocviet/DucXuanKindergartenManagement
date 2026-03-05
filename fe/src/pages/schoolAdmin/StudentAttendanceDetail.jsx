import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Stack,
  Chip,
  TextField,
  CircularProgress,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HistoryIcon from '@mui/icons-material/History';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  // Nếu là format HH:mm thì trả về luôn
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  // Nếu là Date object hoặc ISO string thì format
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '';
  }
};

function StudentAttendanceDetail() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, logout, isInitializing } = useAuth();
  const { getStudentAttendanceDetail, loading, error } = useSchoolAdmin();

  const [studentInfo, setStudentInfo] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [classId, setClassId] = useState(null);
  const [date, setDate] = useState(searchParams.get('date') || '');

  useEffect(() => {
    if (isInitializing) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('SchoolAdmin')) {
      navigate('/', { replace: true });
      return;
    }

    if (studentId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, user, isInitializing, studentId, date]);

  const fetchData = async () => {
    try {
      const params = {};
      if (date) params.date = date;
      const response = await getStudentAttendanceDetail(studentId, params);
      if (response?.data) {
        setStudentInfo(response.data.studentInfo);
        setAttendance(response.data.attendance);
        setClassId(response.data.studentInfo?.classId);
      }
    } catch (err) {
      console.error('Error fetching student attendance detail:', err);
    }
  };

  const menuItems = [
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

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      navigate('/school-admin');
      return;
    }
    if (key === 'classes') {
      navigate('/school-admin/classes');
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

  const checkInTime = attendance?.timeString?.checkIn || formatTime(attendance?.time?.checkIn) || '';
  const checkOutTime = attendance?.timeString?.checkOut || formatTime(attendance?.time?.checkOut) || '';
  const deliverer = attendance?.delivererType || '';
  const receiver = attendance?.receiverType || '';
  const note = attendance?.note || '';

  // Lấy URL ảnh từ image field hoặc từ cloudinary
  const getImageUrl = (imageName) => {
    if (!imageName) return null;
    // Nếu đã là URL đầy đủ thì trả về luôn
    if (imageName.startsWith('http')) return imageName;
    // Nếu là tên file, có thể cần thêm base URL
    // Tạm thời trả về null nếu không có URL đầy đủ
    return null;
  };

  const checkInImage = attendance?.checkinImageName || null;
  const delivererImage = attendance?.delivererOtherImageName || null;
  const checkOutImage = attendance?.checkoutImageName || null;
  const receiverImage = attendance?.receiverOtherImageName || null;

  const attendanceDate = date || (attendance?.date ? formatDate(attendance.date) : formatDate(new Date()));

  // Reusable image placeholder box
  const ImageBox = ({ imageName, alt, label }) => (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
        {label}
      </Typography>
      <Box
        sx={{
          width: '100%',
          height: 128,
          border: '2px dashed',
          borderColor: 'grey.300',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.50',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {imageName ? (
          <>
            <Box
              component="img"
              src={getImageUrl(imageName) || '#'}
              alt={alt}
              sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: 'none', position: 'absolute' }}
            >
              Chưa có ảnh
            </Typography>
          </>
        ) : (
          <Typography variant="caption" color="text.disabled">
            Chưa có ảnh
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <RoleLayout
      title="Chi tiết điểm danh"
      description="Xem chi tiết điểm danh của học sinh."
      menuItems={menuItems}
      activeKey="attendance"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ maxWidth: 896, mx: 'auto' }}>
        {/* Thông tin học sinh */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: '#f0fdf4',
            border: '1px solid',
            borderColor: '#bbf7d0',
            borderRadius: 2,
            p: 2,
            mb: 2,
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', md: 'center' }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <PersonIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight={600} color="text.primary">
                Trẻ: {studentInfo?.fullName || '\u2014'}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <SchoolIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight={600} color="text.primary">
                Lớp: {studentInfo?.className || '\u2014'}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CalendarTodayIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight={600} color="text.primary">
                Ngày: {attendanceDate}
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {loading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary" mt={1}>
              Đang tải dữ liệu...
            </Typography>
          </Box>
        ) : !attendance ? (
          <Paper elevation={1} sx={{ borderRadius: 2, p: 6, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Không có dữ liệu điểm danh cho học sinh này.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={3}>
            {/* Phần điểm danh đến */}
            <Paper elevation={1} sx={{ borderRadius: 2, p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#22c55e' }} />
                <Typography variant="h6" fontWeight={600} color="text.primary">
                  Điểm danh đến
                </Typography>
              </Stack>

              <Box mb={2}>
                <Chip
                  label={`Trạng thái: ${attendance.status === 'present' ? 'Có mặt' : attendance.status === 'absent' ? 'Nghỉ học' : '—'}`}
                  size="small"
                  sx={{
                    bgcolor: '#dcfce7',
                    color: '#15803d',
                    fontWeight: 500,
                    fontSize: '13px',
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.primary" mb={0.5}>
                    Giờ đến
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={checkInTime}
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiInputBase-root': { bgcolor: 'grey.50' } }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.primary" mb={0.5}>
                    Người đưa
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={deliverer}
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiInputBase-root': { bgcolor: 'grey.50' } }}
                  />
                </Box>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" fontWeight={600} color="text.primary" mb={1}>
                  Hình ảnh xác nhận
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <ImageBox imageName={checkInImage} alt="Check-in" label="Ảnh check-in" />
                  <ImageBox imageName={delivererImage} alt="Deliverer" label="Ảnh người đưa" />
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" fontWeight={600} color="text.primary" mb={0.5}>
                  Ghi chú
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={note}
                  InputProps={{ readOnly: true }}
                  sx={{ '& .MuiInputBase-root': { bgcolor: 'grey.50' } }}
                />
              </Box>
            </Paper>

            {/* Phần điểm danh về */}
            <Paper elevation={1} sx={{ borderRadius: 2, p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                <Typography variant="h6" fontWeight={600} color="text.primary">
                  Điểm danh về
                </Typography>
              </Stack>

              <Box mb={2}>
                <Chip
                  label={`Trạng thái: ${attendance.time?.checkOut ? 'Đã đón' : 'Chưa đón'}`}
                  size="small"
                  sx={{
                    bgcolor: '#dbeafe',
                    color: '#1d4ed8',
                    fontWeight: 500,
                    fontSize: '13px',
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.primary" mb={0.5}>
                    Giờ về
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={checkOutTime}
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiInputBase-root': { bgcolor: 'grey.50' } }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.primary" mb={0.5}>
                    Người đón
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={receiver}
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiInputBase-root': { bgcolor: 'grey.50' } }}
                  />
                </Box>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" fontWeight={600} color="text.primary" mb={1}>
                  Hình ảnh xác nhận
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <ImageBox imageName={checkOutImage} alt="Check-out" label="Ảnh check-out" />
                  <ImageBox imageName={receiverImage} alt="Receiver" label="Ảnh người đón" />
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" fontWeight={600} color="text.primary" mb={0.5}>
                  Xác nhận phụ huynh
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={attendance.time?.checkOut ? 'Đã xác nhận' : 'Chưa xác nhận'}
                  InputProps={{ readOnly: true }}
                  sx={{ '& .MuiInputBase-root': { bgcolor: 'grey.50' } }}
                />
              </Box>
            </Paper>

            {/* Nút quay lại và Lịch sử */}
            <Stack direction="row" justifyContent="center" spacing={2}>
              <Button
                variant="contained"
                startIcon={<HistoryIcon />}
                onClick={() => {
                  navigate(`/school-admin/students/${studentId}/attendance/history?classId=${classId}&date=${date}`);
                }}
                sx={{
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  bgcolor: '#2563eb',
                  '&:hover': { bgcolor: '#1d4ed8' },
                }}
              >
                Lịch sử điểm danh
              </Button>
              <Button
                variant="contained"
                startIcon={<ArrowBackIcon />}
                onClick={() => {
                  if (classId && date) {
                    navigate(`/school-admin/classes/${classId}/attendance?date=${date}`);
                  } else {
                    navigate('/school-admin/attendance/overview');
                  }
                }}
                sx={{
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  bgcolor: '#16a34a',
                  '&:hover': { bgcolor: '#15803d' },
                }}
              >
                Quay lại Dashboard
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>
    </RoleLayout>
  );
}

export default StudentAttendanceDetail;
