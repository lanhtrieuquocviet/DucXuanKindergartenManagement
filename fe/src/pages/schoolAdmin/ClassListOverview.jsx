import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, ENDPOINTS } from '../../service/api';

const menuItems = [
  { key: 'overview', label: 'Tổng quan trường' },
  {
    key: 'academic-years',
    label: 'Quản lý năm học',
    children: [
      { key: 'academic-year-setup', label: 'Thiết lập năm học' },
      { key: 'academic-plan', label: 'Thiết lập kế hoạch' },
      { key: 'academic-students', label: 'Danh sách lớp học' },
      { key: 'academic-curriculum', label: 'Chương trình giáo dục' },
      { key: 'academic-schedule', label: 'Thời gian biểu' },
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

/** Tách giáo viên chủ nhiệm (đầu tiên) và giáo viên phụ (còn lại) từ chuỗi "Cô A, Cô B" */
function parseTeachers(teacherNames) {
  if (!teacherNames || teacherNames === '-') return { homeroom: '—', assistant: '—' };
  const parts = String(teacherNames).split(',').map((s) => s.trim()).filter(Boolean);
  const homeroom = parts[0] || '—';
  const assistant = parts.length > 1 ? parts.slice(1).join(', ') : '—';
  return { homeroom, assistant };
}

function ClassListOverview() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [academicYear, setAcademicYear] = useState(null);
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleMenuSelect = (key) => {
    if (key === 'overview') navigate('/school-admin');
    if (key === 'academic-years' || key === 'academic-year-setup') navigate('/school-admin/academic-years');
    if (key === 'academic-students') return;
    if (key === 'academic-curriculum') navigate('/school-admin/curriculum');
    if (key === 'academic-schedule') navigate('/school-admin/timetable');
    if (key === 'academic-plan') navigate('/school-admin/academic-plan');
    if (key === 'classes') navigate('/school-admin/classes');
    if (key === 'menu') navigate('/school-admin/menus');
    if (key === 'students') navigate('/school-admin/students');
    if (key === 'contacts') navigate('/school-admin/contacts');
    if (key === 'qa') navigate('/school-admin/qa');
    if (key === 'blogs') navigate('/school-admin/blogs');
    if (key === 'documents') navigate('/school-admin/documents');
    if (key === 'public-info') navigate('/school-admin/public-info');
    if (key === 'attendance') navigate('/school-admin/attendance/overview');
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [yearRes, gradesRes] = await Promise.all([
          get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT),
          get(ENDPOINTS.GRADES.LIST),
        ]);
        if (yearRes?.status === 'success' && yearRes.data) {
          setAcademicYear(yearRes.data);
        } else {
          setAcademicYear(null);
        }
        if (gradesRes?.status === 'success' && Array.isArray(gradesRes.data)) {
          setGrades(gradesRes.data);
        } else {
          setGrades([]);
        }
      } catch (err) {
        setAcademicYear(null);
        setGrades([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!academicYear?._id) {
      setClasses([]);
      return;
    }
    const fetchClasses = async () => {
      try {
        const res = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CLASSES(academicYear._id));
        if (res?.status === 'success' && Array.isArray(res.data)) {
          setClasses(res.data);
        } else {
          setClasses([]);
        }
      } catch (err) {
        setClasses([]);
      }
    };
    fetchClasses();
  }, [academicYear?._id]);

  const totalClasses = classes.length;
  const totalStudents = useMemo(() => classes.reduce((sum, c) => sum + (c.studentCount || 0), 0), [classes]);
  const uniqueTeachers = useMemo(() => {
    const set = new Set();
    classes.forEach((c) => {
      const names = (c.teacherNames || '-').split(',').map((s) => s.trim()).filter(Boolean);
      names.forEach((n) => set.add(n));
    });
    return set.size;
  }, [classes]);

  const filteredClasses = useMemo(() => {
    let list = classes;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          (c.className && c.className.toLowerCase().includes(q)) ||
          (c.teacherNames && c.teacherNames.toLowerCase().includes(q)) ||
          (String(c.studentCount || '').includes(q))
      );
    }
    if (gradeFilter) {
      list = list.filter((c) => c.gradeName && c.gradeName.toLowerCase().includes(gradeFilter.toLowerCase()));
    }
    return list;
  }, [classes, searchQuery, gradeFilter]);

  const yearName = academicYear?.yearName || 'Năm học';
  const breadcrumb = `MamNon DX → Ban Giám hiệu → Quản lý Năm học → Danh sách lớp học ${yearName}`;

  const userName = user?.fullName || user?.username || 'School Admin';

  return (
    <RoleLayout
      title={`Danh sách lớp học - ${yearName}`}
      description="Xem thông tin tổng quan các lớp học đang hoạt động trong năm học hiện tại."
      menuItems={menuItems}
      activeKey="academic-students"
      onLogout={handleLogout}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
      <Stack spacing={3}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
          {breadcrumb}
        </Typography>

        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#7c3aed' }} gutterBottom>
            Danh sách lớp học - {yearName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Xem thông tin tổng quan các lớp học đang hoạt động trong năm học hiện tại.
          </Typography>
        </Box>

        {/* 3 thẻ thống kê */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              <Typography variant="h4" fontWeight={700} sx={{ color: '#7c3aed' }}>
                {loading ? '—' : totalClasses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng số lớp
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              <Typography variant="h4" fontWeight={700} sx={{ color: '#7c3aed' }}>
                {loading ? '—' : totalStudents}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng số trẻ
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              <Typography variant="h4" fontWeight={700} sx={{ color: '#7c3aed' }}>
                {loading ? '—' : uniqueTeachers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Giáo viên chủ nhiệm
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tìm kiếm + Lọc khối lớp */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            placeholder="Tìm theo tên lớp, giáo viên, số trẻ..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              flex: 1,
              maxWidth: 400,
              '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: 'white' },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="grade-filter-label">Khối lớp</InputLabel>
            <Select
              labelId="grade-filter-label"
              label="Khối lớp"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
            >
              <MenuItem value="">Tất cả khối lớp</MenuItem>
              {grades.map((g) => (
                <MenuItem key={g._id} value={g.gradeName || ''}>
                  {g.gradeName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Danh sách thẻ lớp */}
        {loading ? (
          <Stack alignItems="center" py={6}>
            <CircularProgress sx={{ color: '#7c3aed' }} />
            <Typography variant="body2" color="text.secondary" mt={2}>
              Đang tải...
            </Typography>
          </Stack>
        ) : !academicYear ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
            <Typography color="text.secondary">
              Chưa có năm học đang hoạt động. Vui lòng tạo năm học trước.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {filteredClasses.map((cls) => {
              const { homeroom, assistant } = parseTeachers(cls.teacherNames);
              return (
                <Grid item xs={12} sm={6} md={4} key={cls._id}>
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }}
                  >
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        color: 'white',
                        px: 2,
                        py: 1.5,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight={700}>
                        {cls.className}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.95, mt: 0.25 }}>
                        Giáo viên chủ nhiệm: {homeroom}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2, backgroundColor: 'white' }}>
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            Số trẻ: {cls.studentCount ?? 0} trẻ
                          </Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <PeopleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            Giáo viên phụ: {assistant}
                          </Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <LocationOnIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            Phòng học: —
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}

        {!loading && academicYear && filteredClasses.length === 0 && (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
            <Typography color="text.secondary">
              Không có lớp nào phù hợp với bộ lọc.
            </Typography>
          </Paper>
        )}
      </Stack>
    </RoleLayout>
  );
}

export default ClassListOverview;
