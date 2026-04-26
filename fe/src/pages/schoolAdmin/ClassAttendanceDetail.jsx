import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import { get, ENDPOINTS } from '../../service/api';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
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
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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

const isLate = (value) => {
  if (!value) return false;
  try {
    let h; let m;
    if (typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)) {
      [h, m] = value.split(':').map(Number);
    } else {
      const d = new Date(value);
      if (isNaN(d.getTime())) return false;
      h = d.getHours();
      m = d.getMinutes();
    }
    return h > 8 || (h === 8 && m > 0);
  } catch {
    return false;
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
    if (attendance.arrivalStatus === 'late' || isLate(attendance.timeString?.checkIn || attendance.time?.checkIn)) {
      return { text: 'Đi học muộn', color: 'warning' };
    }
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
  const { user, isInitializing } = useAuth();
  const { getClassAttendanceDetail, loading, error } = useSchoolAdmin();

  const [selectedDate, setSelectedDate] = useState(
    searchParams.get('date') || getLocalISODate()
  );
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState('');

  const currentClassId = classId || classInfo?._id;

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }

    const fetchYears = async () => {
      try {
        const res = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.LIST);
        if (res.data) setAcademicYears(res.data);
      } catch (err) {
        console.error('Error fetching years:', err);
      }
    };
    fetchYears();
  }, [isInitializing, user, navigate]);

  useEffect(() => {
    if (isInitializing || !user) return;
    if (classId) {
      fetchData();
    }
  }, [classId, selectedDate]);

  const fetchData = async () => {
    try {
      const response = await getClassAttendanceDetail(classId, {
        date: selectedDate,
      });
      if (response?.data) {
        setClassInfo(response.data.classInfo);
        setStudents(response.data.students || []);
        setClasses(response.data.classes || []);
        if (response.data.classInfo?.academicYearId && !selectedYearId) {
          setSelectedYearId(response.data.classInfo.academicYearId);
        }
      }
    } catch (err) {
      console.error('Error fetching class attendance detail:', err);
    }
  };

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

  const filteredStudents = useMemo(() => {
    let filtered = students;
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
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} md={2}>
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

          <Grid item xs={12} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Năm học</InputLabel>
              <Select
                value={selectedYearId}
                label="Năm học"
                onChange={async (e) => {
                  const yId = e.target.value;
                  setSelectedYearId(yId);
                  // Khi đổi năm học, ta cần lấy danh sách lớp của năm đó để người dùng chọn lớp mới
                  try {
                    const res = await get(`${ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CLASSES(yId)}`);
                    if (res.data) {
                      setClasses(res.data);
                      // Nếu lớp hiện tại không thuộc năm mới, có thể reset hoặc để yên (nhưng dropdown sẽ không highlight được)
                    }
                  } catch (err) {
                    console.error('Error fetching classes for year:', err);
                  }
                }}
              >
                {academicYears.map((y) => (
                  <MenuItem key={y._id} value={y._id}>
                    {y.yearName} {y.status === 'active' && <Chip label="Hiện tại" size="small" color="primary" sx={{ ml: 1, height: 20 }} />}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2.5}>
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

          <Grid item xs={12} md={2.5}>
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
    </Box>
  );
}

export default ClassAttendanceDetail;
