import { useEffect, useState, useMemo } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const formatDate = (dateStr, showYear = false) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  if (showYear) {
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return `${day}/${month}`;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '—';
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return '—';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '—';
  }
};

const isLate = (checkInTime) => {
  if (!checkInTime) return false;
  try {
    let hours, minutes;
    if (typeof checkInTime === 'string' && /^\d{2}:\d{2}$/.test(checkInTime)) {
      [hours, minutes] = checkInTime.split(':').map(Number);
    } else {
      const d = new Date(checkInTime);
      if (isNaN(d.getTime())) return false;
      hours = d.getHours();
      minutes = d.getMinutes();
    }
    return hours > 7 || (hours === 7 && minutes > 30);
  } catch {
    return false;
  }
};

const getStatusText = (attendance) => {
  if (!attendance || attendance.status === 'absent') {
    return { text: 'Nghỉ học', color: 'error.main' };
  }
  if (attendance.status === 'present') {
    const checkInTime = attendance?.timeString?.checkIn || attendance?.time?.checkIn;
    if (isLate(checkInTime)) {
      return { text: 'Đi trễ', color: 'warning.main' };
    }
    return { text: 'Có mặt', color: 'success.main' };
  }
  return { text: '—', color: 'text.secondary' };
};

function StudentAttendanceHistory() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, logout, isInitializing } = useAuth();
  const { getStudentAttendanceHistory, loading, error } = useSchoolAdmin();

  const [studentInfo, setStudentInfo] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statsFromApi, setStatsFromApi] = useState(null);

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
  }, [navigate, user, isInitializing, studentId, selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      const fromDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const toDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const params = { from: fromDate, to: toDate };
      const response = await getStudentAttendanceHistory(studentId, params);
      if (response?.data) {
        setStudentInfo(response.data.studentInfo);
        setAttendances(response.data.attendances || []);
        setStatsFromApi(response.data.stats || null);
      }
    } catch (err) {
      console.error('Error fetching student attendance history:', err);
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

  const stats = useMemo(() => {
    if (statsFromApi) {
      return statsFromApi;
    }
    const totalDays = attendances.length;
    const present = attendances.filter((att) => att.status === 'present').length;
    const absent = attendances.filter((att) => att.status === 'absent').length;
    const late = attendances.filter((att) => {
      if (att.status !== 'present') return false;
      const checkInTime = att?.timeString?.checkIn || att?.time?.checkIn;
      return isLate(checkInTime);
    }).length;

    return {
      totalDays,
      present,
      absent,
      late,
    };
  }, [attendances, statsFromApi]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const statCards = [
    { label: 'Ngày học', value: stats.totalDays },
    { label: 'Có mặt', value: stats.present },
    { label: 'Nghỉ học', value: stats.absent },
    { label: 'Đi trễ', value: stats.late },
  ];

  return (
    <RoleLayout
      title="Màn hình lịch sử thông tin điểm danh của học sinh"
      description="Từ màn hình chi tiết điểm danh của 1 học sinh, chọn Lịch sử điểm danh → Hiển thị màn hình Lịch sử điểm danh"
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

      <Box sx={{ maxWidth: 960, mx: 'auto' }}>
        <Paper sx={{ overflow: 'hidden' }}>
          {/* Report header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              px: 3,
              py: 2,
            }}
          >
            <Stack direction="row" alignItems="center" gap={1}>
              <AssessmentIcon sx={{ color: 'white' }} />
              <Typography variant="h6" fontWeight={600} color="white">
                Báo cáo điểm danh
              </Typography>
            </Stack>
          </Box>

          {/* Student info */}
          <Box sx={{ bgcolor: 'success.50', px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} gap={3} alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Stack direction="row" alignItems="center" gap={1}>
                <ChildCareIcon color="success" />
                <Typography variant="body2" fontWeight={600}>
                  Trẻ: {studentInfo?.fullName || '—'}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" gap={1}>
                <HomeIcon color="success" />
                <Typography variant="body2" fontWeight={600}>
                  Lớp: {studentInfo?.className || '—'}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {/* Month/Year filter */}
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} gap={2} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
              <FormControl size="small" sx={{ flex: 1, minWidth: 140 }}>
                <InputLabel>Tháng</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Tháng"
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {months.map((month) => (
                    <MenuItem key={month} value={month}>
                      Tháng {String(month).padStart(2, '0')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
                <InputLabel>Năm</InputLabel>
                <Select
                  value={selectedYear}
                  label="Năm"
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>

          {/* Stats cards */}
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" flexWrap="wrap" gap={2}>
              {statCards.map((card) => (
                <Paper
                  key={card.label}
                  variant="outlined"
                  sx={{
                    flex: '1 1 120px',
                    p: 2,
                    bgcolor: 'success.50',
                    borderColor: 'success.100',
                  }}
                >
                  <Typography variant="body2" fontWeight={600} color="text.secondary" gutterBottom>
                    {card.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {card.value}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </Box>

          {/* Attendance history table */}
          {loading ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Đang tải dữ liệu...
              </Typography>
            </Box>
          ) : attendances.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">Không có dữ liệu điểm danh.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Ngày</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Đến</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Về</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendances.map((attendance, idx) => {
                    const status = getStatusText(attendance);
                    const checkInTime =
                      attendance?.timeString?.checkIn ||
                      formatTime(attendance?.time?.checkIn);
                    const checkOutTime =
                      attendance?.timeString?.checkOut ||
                      formatTime(attendance?.time?.checkOut);
                    const attendanceDate = formatDate(attendance?.date, false);

                    return (
                      <TableRow
                        key={attendance._id || idx}
                        hover
                        sx={{ '&:last-child td': { border: 0 } }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {attendanceDate}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{checkInTime}</TableCell>
                        <TableCell align="center">{checkOutTime}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color={status.color}>
                            {status.text}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Back button */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<ArrowBackIcon />}
            onClick={() => {
              const date = searchParams.get('date');
              const classId = searchParams.get('classId');
              if (date && classId) {
                navigate(`/school-admin/classes/${classId}/attendance?date=${date}`);
              } else if (date) {
                navigate(`/school-admin/students/${studentId}/attendance?date=${date}`);
              } else {
                navigate('/school-admin/attendance/overview');
              }
            }}
          >
            Quay lại Dashboard
          </Button>
        </Box>
      </Box>
    </RoleLayout>
  );
}

export default StudentAttendanceHistory;
