import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AssessmentIcon from '@mui/icons-material/Assessment';

const getLocalISODate = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

function AttendanceOverview() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const { getAttendanceOverview, loading, error } = useSchoolAdmin();

  const [selectedDate, setSelectedDate] = useState(getLocalISODate);
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState(null);

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

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, user, isInitializing, selectedDate, selectedGrade, selectedClass, selectedStatus]);

  const fetchData = async () => {
    try {
      const params = {
        date: selectedDate,
        ...(selectedGrade !== 'all' && { gradeId: selectedGrade }),
        ...(selectedClass !== 'all' && { classId: selectedClass }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
      };
      const response = await getAttendanceOverview(params);
      setData(response);
    } catch (err) {
      console.error('Error fetching attendance overview:', err);
      setData({ data: { classes: [] } });
    }
  };

  const menuItems = [
    { key: "overview", label: "Tổng quan trường" },
    {
      key: "academic-years",
      label: "Quản lý năm học",
      children: [
        { key: "academic-year-setup", label: "Thiết lập năm học" },
        { key: "academic-plan", label: "Thiết lập kế hoạch" },
        { key: "academic-students", label: "Danh sách lớp học" },
        { key: 'academic-curriculum', label: 'Chương trình giáo dục' },
        { key: 'academic-schedule', label: 'Thời khóa biểu' },
        { key: 'academic-report', label: 'Báo cáo & thống kê' },
      ],
    },
    { key: "classes", label: "Lớp học" },
    { key: "menu", label: "Quản lý thực đơn" },
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

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      navigate('/school-admin');
      return;
    }
    if (key === 'academic-years' || key === 'academic-year-setup') {
      navigate('/school-admin/academic-years');
      return;
    }
    if (key === 'academic-curriculum') {
      navigate('/school-admin/curriculum');
      return;
    }
    if (key === 'academic-schedule') {
      navigate('/school-admin/timetable');
      return;
    }
    if (key === 'academic-plan') {
      navigate('/school-admin/academic-plan');
      return;
    }
    if (key === 'academic-students') {
      navigate('/school-admin/class-list');
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
    const currentData = data || { data: { classes: [] } };
    if (!currentData?.data) {
      return {
        totalClasses: 0,
        totalStudents: 0,
        present: 0,
        notCheckedOut: 0,
      };
    }

    const classes = currentData.data.classes || [];
    const totalClasses = classes.length;
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.totalStudents || 0), 0);
    const present = classes.reduce((sum, cls) => sum + (cls.present || 0), 0);
    const notCheckedOut = classes.reduce((sum, cls) => sum + (cls.notCheckedOut || 0), 0);

    return {
      totalClasses,
      totalStudents,
      present,
      notCheckedOut,
    };
  }, [data]);

  const getClassStatus = (cls) => {
    const { present = 0, absent = 0, notCheckedOut = 0, totalStudents = 0 } = cls;

    if (notCheckedOut > 0) {
      return { text: 'Cần theo dõi', color: 'warning.main' };
    }
    if (present === totalStudents && absent === 0) {
      return { text: 'Đầy đủ', color: 'success.main' };
    }
    if (present < totalStudents) {
      return { text: 'Thiếu sĩ số', color: 'error.main' };
    }
    return { text: 'Bình thường', color: 'text.secondary' };
  };

  const filteredClasses = useMemo(() => {
    const currentData = data || { data: { classes: [] } };
    if (!currentData?.data?.classes) return [];

    let filtered = currentData.data.classes;

    if (selectedGrade !== 'all') {
      filtered = filtered.filter((cls) => cls.gradeName === selectedGrade);
    }

    if (selectedClass !== 'all') {
      filtered = filtered.filter((cls) => cls._id === selectedClass);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((cls) => {
        const status = getClassStatus(cls);
        if (selectedStatus === 'complete') return status.text === 'Đầy đủ';
        if (selectedStatus === 'missing') return status.text === 'Thiếu sĩ số';
        if (selectedStatus === 'monitoring') return status.text === 'Cần theo dõi';
        return true;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter((cls) =>
        cls.className?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [data, searchTerm, selectedGrade, selectedClass, selectedStatus]);

  const grades = useMemo(() => {
    const currentData = data || { data: { classes: [] } };
    if (!currentData?.data?.classes) return [];
    const gradeSet = new Set();
    currentData.data.classes.forEach((cls) => {
      if (cls.gradeName) gradeSet.add(cls.gradeName);
    });
    return Array.from(gradeSet).sort();
  }, [data]);

  const classes = useMemo(() => {
    const currentData = data || { data: { classes: [] } };
    if (!currentData?.data?.classes) return [];
    return currentData.data.classes.map((cls) => ({
      _id: cls._id,
      className: cls.className,
    }));
  }, [data]);

  const statCards = [
    { label: 'Tổng số lớp', value: stats.totalClasses },
    { label: 'Tổng sĩ số', value: stats.totalStudents },
    { label: 'Có mặt', value: stats.present },
    { label: 'Chưa check-out', value: stats.notCheckedOut },
  ];

  return (
    <RoleLayout
      title="Điểm danh các lớp (Hôm nay)"
      description="Xem tổng quan điểm danh của tất cả các lớp trong trường."
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

      {/* Navigation buttons */}
      <Paper sx={{ mb: 2, p: 2 }}>
        <Stack direction="row" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap={1}>
          <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Điều hướng:
            </Typography>
            {menuItems.map((item) => (
              <Button
                key={item.key}
                size="small"
                variant={item.key === 'attendance' ? 'contained' : 'outlined'}
                color={item.key === 'attendance' ? 'primary' : 'inherit'}
                onClick={() => {
                  if (item.key === 'overview') {
                    navigate('/school-admin');
                  } else if (item.key === 'classes') {
                    navigate('/school-admin/classes');
                  } else if (item.key === 'contacts') {
                    navigate('/school-admin/contacts');
                  } else {
                    handleMenuSelect(item.key);
                  }
                }}
                sx={
                  item.key !== 'attendance'
                    ? { color: 'text.primary', borderColor: 'divider' }
                    : {}
                }
              >
                {item.label}
              </Button>
            ))}
          </Stack>
          <Button
            variant="contained"
            color="success"
            startIcon={<AssessmentIcon />}
            onClick={() => navigate('/school-admin/attendance/export')}
          >
            Xuất báo cáo điểm danh
          </Button>
        </Stack>
      </Paper>

      {/* Filters */}
      <Paper sx={{ mb: 2, p: 2 }}>
        <Stack direction="row" flexWrap="wrap" gap={2} alignItems="flex-end">
          <TextField
            label="Ngày"
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Khối</InputLabel>
            <Select
              value={selectedGrade}
              label="Khối"
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              <MenuItem value="all">Tất cả khối</MenuItem>
              {grades.map((grade) => (
                <MenuItem key={grade} value={grade}>
                  {grade}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Lớp</InputLabel>
            <Select
              value={selectedClass}
              label="Lớp"
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <MenuItem value="all">Tất cả lớp</MenuItem>
              {classes.map((cls) => (
                <MenuItem key={cls._id} value={cls._id}>
                  {cls.className}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={selectedStatus}
              label="Trạng thái"
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <MenuItem value="all">Tất cả trạng thái</MenuItem>
              <MenuItem value="complete">Đầy đủ</MenuItem>
              <MenuItem value="missing">Thiếu sĩ số</MenuItem>
              <MenuItem value="monitoring">Cần theo dõi</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Tìm theo tên lớp"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên lớp"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
        </Stack>
      </Paper>

      {/* Stats */}
      <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
        {statCards.map((card) => (
          <Paper
            key={card.label}
            sx={{
              flex: '1 1 160px',
              p: 2,
              bgcolor: 'primary.50',
              border: '1px solid',
              borderColor: 'primary.100',
            }}
          >
            <Typography variant="body2" fontWeight={600} color="text.secondary" gutterBottom>
              {card.label}
            </Typography>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {card.value}
            </Typography>
          </Paper>
        ))}
      </Stack>

      {/* Attendance Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Đang tải dữ liệu...
            </Typography>
          </Box>
        ) : filteredClasses.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">Không có dữ liệu điểm danh.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, width: 70 }}>STT</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Lớp</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Khối</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Sĩ số</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Có mặt</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Nghỉ</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Chưa check-out</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Chi tiết</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClasses.map((cls, idx) => {
                  const status = getClassStatus(cls);
                  return (
                    <TableRow
                      key={cls._id || idx}
                      hover
                      sx={{ '&:last-child td': { border: 0 } }}
                    >
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {cls.className || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>{cls.gradeName || '—'}</TableCell>
                      <TableCell align="center">{cls.totalStudents || 0}</TableCell>
                      <TableCell align="center">{cls.present || 0}</TableCell>
                      <TableCell align="center">{cls.absent || 0}</TableCell>
                      <TableCell align="center">{cls.notCheckedOut || 0}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color={status.color}>
                          {status.text}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() =>
                            navigate(
                              `/school-admin/classes/${cls._id}/attendance?date=${selectedDate}`
                            )
                          }
                        >
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </RoleLayout>
  );
}

export default AttendanceOverview;
