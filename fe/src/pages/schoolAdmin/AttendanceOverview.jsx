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
import { get, ENDPOINTS } from '../../service/api';
import { SCHOOL_ADMIN_MENU_ITEMS, createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';

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

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

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
    { label: 'Tổng số lớp', value: stats.totalClasses, bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
    { label: 'Tổng sĩ số', value: stats.totalStudents, bg: '#faf5ff', border: '#e9d5ff', color: '#7c3aed' },
    { label: 'Có mặt', value: stats.present, bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a' },
    { label: 'Chưa check-out', value: stats.notCheckedOut, bg: '#fff7ed', border: '#fed7aa', color: '#ea580c' },
  ];

  return (
    <RoleLayout
      title="Điểm danh các lớp (Hôm nay)"
      description="Xem tổng quan điểm danh của tất cả các lớp trong trường."
      menuItems={SCHOOL_ADMIN_MENU_ITEMS}
      activeKey="attendance-overview"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {/* Page header */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: 3,
          px: 4,
          py: 3,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} color="white">
            Điểm danh các lớp
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
            Xem tổng quan điểm danh của tất cả các lớp trong trường.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AssessmentIcon />}
          onClick={() => navigate('/school-admin/attendance/export')}
          sx={{ bgcolor: 'white', color: 'success.dark', '&:hover': { bgcolor: 'grey.100' }, fontWeight: 600 }}
        >
          Xuất báo cáo điểm danh
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
              p: 2.5,
              bgcolor: card.bg,
              border: '1px solid',
              borderColor: card.border,
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" fontWeight={600} color="text.secondary" gutterBottom>
              {card.label}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color: card.color }}>
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
                <TableRow sx={{ bgcolor: '#dcfce7' }}>
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
                        <Chip
                          label={status.text}
                          size="small"
                          color={
                            status.text === 'Đầy đủ' ? 'success' :
                            status.text === 'Thiếu sĩ số' ? 'error' :
                            status.text === 'Cần theo dõi' ? 'warning' : 'default'
                          }
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
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
