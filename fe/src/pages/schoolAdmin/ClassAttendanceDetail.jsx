import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';
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
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';

const isWeekendDate = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  return d.getDay() === 0 || d.getDay() === 6;
};

const getLocalISODate = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
};

const formatTime = (timeStr) => {
  if (!timeStr) return '—';
  // Nếu là format HH:mm thì trả về luôn
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  // Nếu là Date object hoặc ISO string thì format
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

const getStatusInfo = (attendance) => {
  if (!attendance) {
    return { text: 'Chưa điểm danh', color: 'default' };
  }
  if (attendance.status === 'absent') {
    return { text: 'Nghỉ học', color: 'error' };
  }
  if (attendance.status === 'present') {
    if (attendance.time?.checkIn && !attendance.time?.checkOut) {
      return { text: 'Chưa check-out', color: 'warning' };
    }
    if (attendance.time?.checkIn && attendance.time?.checkOut) {
      return { text: 'Hoàn thành điểm danh', color: 'primary' };
    }
    return { text: 'Có mặt', color: 'success' };
  }
  return { text: '—', color: 'default' };
};

function ClassAttendanceDetail() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, logout, isInitializing } = useAuth();
  const { getClassAttendanceDetail, loading, error } = useSchoolAdmin();
  const menuItems = useSchoolAdminMenu();

  const [selectedDate, setSelectedDate] = useState(
    searchParams.get('date') || getLocalISODate()
  );
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  const currentClassId = classId || classInfo?._id;

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

    if (classId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, user, isInitializing, classId, selectedDate]);

  const fetchData = async () => {
    try {
      const response = await getClassAttendanceDetail(classId, {
        date: selectedDate,
      });
      if (response?.data) {
        setClassInfo(response.data.classInfo);
        setStudents(response.data.students || []);
        setClasses(response.data.classes || []);
      }
    } catch (err) {
      console.error('Error fetching class attendance detail:', err);
    }
  };

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  const userName = user?.fullName || user?.username || 'School Admin';

  // Tính toán thống kê
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const present = students.filter(
      (s) => s.attendance && s.attendance.status === 'present'
    ).length;
    const absent = students.filter(
      (s) => s.attendance && s.attendance.status === 'absent'
    ).length;
    const noRecord = students.filter((s) => !s.attendance).length;
    const notCheckedOut = students.filter(
      (s) =>
        s.attendance &&
        s.attendance.status === 'present' &&
        s.attendance.time?.checkIn &&
        !s.attendance.time?.checkOut
    ).length;

    return {
      totalStudents,
      present,
      absent,
      noRecord,
      notCheckedOut,
    };
  }, [students]);

  // Lọc học sinh
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Lọc theo trạng thái
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((s) => {
        if (selectedStatus === 'present') {
          return s.attendance && s.attendance.status === 'present';
        }
        if (selectedStatus === 'absent') {
          return s.attendance && s.attendance.status === 'absent';
        }
        if (selectedStatus === 'noRecord') {
          return !s.attendance;
        }
        if (selectedStatus === 'notCheckedOut') {
          return (
            s.attendance &&
            s.attendance.status === 'present' &&
            s.attendance.time?.checkIn &&
            !s.attendance.time?.checkOut
          );
        }
        return true;
      });
    }

    // Tìm kiếm theo tên
    if (searchTerm) {
      filtered = filtered.filter((s) =>
        s.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [students, selectedStatus, searchTerm]);

  const handleClassChange = (newClassId) => {
    if (newClassId && newClassId !== classId) {
      navigate(`/school-admin/classes/${newClassId}/attendance?date=${selectedDate}`);
    }
  };

  return (
    <RoleLayout
      title={`Điểm danh lớp ${classInfo?.className || ''}`}
      description="Xem chi tiết điểm danh của từng học sinh trong lớp."
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

      {/* Bộ lọc và tìm kiếm */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} md={3}>
            <TextField
              label="Ngày"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Lớp</InputLabel>
              <Select
                value={classId || ''}
                label="Lớp"
                onChange={(e) => handleClassChange(e.target.value)}
              >
                {classes.map((cls) => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.className}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={selectedStatus}
                label="Trạng thái"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="all">Tất cả trạng thái</MenuItem>
                <MenuItem value="present">Có mặt</MenuItem>
                <MenuItem value="absent">Nghỉ học</MenuItem>
                <MenuItem value="noRecord">Chưa điểm danh</MenuItem>
                <MenuItem value="notCheckedOut">Chưa check-out</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Tìm theo tên học sinh"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên học sinh..."
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Thống kê */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: 'Sĩ số', value: stats.totalStudents },
          { label: 'Có mặt', value: stats.present },
          { label: 'Nghỉ học', value: stats.absent },
          { label: 'Chưa điểm danh', value: stats.noRecord },
          { label: 'Chưa check-out', value: stats.notCheckedOut },
        ].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.label}>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'success.50',
                border: '1px solid',
                borderColor: 'success.100',
              }}
            >
              <Typography variant="body2" fontWeight={600} color="text.secondary" mb={0.5}>
                {item.label}
              </Typography>
              <Typography variant="h5" fontWeight={700} color="success.700">
                {item.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {isWeekendDate(selectedDate) && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          Ngày <strong>{selectedDate}</strong> là thứ 7 hoặc chủ nhật — học sinh không đi học, sẽ không có dữ liệu điểm danh.
        </Alert>
      )}

      {/* Bảng điểm danh */}
      <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary" mt={1}>
              Đang tải dữ liệu...
            </Typography>
          </Box>
        ) : filteredStudents.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Không có dữ liệu điểm danh.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, width: 70 }}>STT</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Học sinh</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Đến</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Về</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Người đưa</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Người đón</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Chi tiết</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((student, idx) => {
                  const attendance = student.attendance;
                  const statusInfo = getStatusInfo(attendance);
                  const checkInTime = attendance?.timeString?.checkIn ||
                                     formatTime(attendance?.time?.checkIn);
                  const checkOutTime = attendance?.timeString?.checkOut ||
                                      formatTime(attendance?.time?.checkOut);

                  // Lấy thông tin người đưa/đón từ attendance
                  const deliverer = attendance?.delivererType || '—';
                  const receiver = attendance?.receiverType || '—';

                  return (
                    <TableRow
                      key={student._id || idx}
                      hover
                      sx={{ borderBottom: '1px solid', borderColor: 'grey.100' }}
                    >
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {student.fullName || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>{checkInTime}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>{checkOutTime}</TableCell>
                      <TableCell>{deliverer}</TableCell>
                      <TableCell>{receiver}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusInfo.text}
                          color={statusInfo.color}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => {
                            navigate(`/school-admin/students/${student._id}/attendance?date=${selectedDate}&classId=${currentClassId}`);
                          }}
                        >
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* Nút quay lại */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="success"
          size="large"
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            navigate('/school-admin/attendance/overview');
          }}
        >
          Quay lại Dashboard
        </Button>
      </Box>
    </RoleLayout>
  );
}

export default ClassAttendanceDetail;
