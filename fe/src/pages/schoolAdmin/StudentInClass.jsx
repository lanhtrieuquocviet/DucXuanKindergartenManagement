import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { get, post, del, ENDPOINTS } from '../../service/api';
import { SCHOOL_ADMIN_MENU_ITEMS, createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';

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
  Tabs,
  Tab,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid,
  IconButton,
  Checkbox,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  Tooltip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BookIcon from '@mui/icons-material/Book';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';

// ── helpers ────────────────────────────────────────────────────────────────────

function calcAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

function fmtDate(d) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('vi-VN');
}

function attendanceColor(status) {
  if (status === 'present') return { bg: '#f0fdf4', color: '#15803d', label: 'Có mặt' };
  if (status === 'absent') return { bg: '#fef2f2', color: '#dc2626', label: 'Vắng mặt' };
  if (status === 'leave') return { bg: '#fffbeb', color: '#d97706', label: 'Xin phép' };
  return { bg: '#f3f4f6', color: '#6b7280', label: 'Chưa điểm danh' };
}

// ── sub-components ─────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderColor: 'grey.200',
        bgcolor: '#fff',
        flex: 1,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          bgcolor: color + '1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box minWidth={0}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

function StudentCard({ student, attendanceStatus, onClick, onRemove }) {
  const att = attendanceColor(attendanceStatus);
  const age = calcAge(student.dateOfBirth);

  return (
    <Paper
      variant="outlined"
      onClick={() => onClick(student)}
      sx={{
        p: 2,
        borderRadius: 2,
        cursor: 'pointer',
        borderColor: 'grey.200',
        transition: 'all 0.15s',
        position: 'relative',
        '&:hover': { boxShadow: 3, borderColor: '#a78bfa', transform: 'translateY(-1px)' },
        '&:hover .remove-btn': { opacity: 1 },
      }}
    >
      <Tooltip title="Xóa khỏi lớp">
        <IconButton
          className="remove-btn"
          size="small"
          onClick={(e) => { e.stopPropagation(); onRemove(student); }}
          sx={{
            position: 'absolute', top: 6, right: 6,
            opacity: 0, transition: 'opacity 0.15s',
            color: 'error.main',
            bgcolor: 'rgba(255,255,255,0.85)',
            '&:hover': { bgcolor: '#fee2e2' },
            p: 0.5,
          }}
        >
          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Avatar
          sx={{
            width: 44,
            height: 44,
            bgcolor: student.gender === 'female' ? '#fbcfe8' : '#bfdbfe',
            color: student.gender === 'female' ? '#be185d' : '#1d4ed8',
            fontWeight: 700,
            fontSize: '1rem',
            flexShrink: 0,
          }}
        >
          {student.fullName?.charAt(0)?.toUpperCase() || <PersonIcon />}
        </Avatar>
        <Box flex={1} minWidth={0}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: 'text.primary', mb: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {student.fullName}
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
            <Chip
              label={att.label}
              size="small"
              sx={{ fontSize: '0.65rem', fontWeight: 600, bgcolor: att.bg, color: att.color, height: 20 }}
            />
            {age !== null && (
              <Chip
                label={`${age} tuổi`}
                size="small"
                sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#f3f4f6', color: '#4b5563' }}
              />
            )}
          </Stack>
          {student.needsSpecialAttention && (
            <Tooltip title={student.specialNote || 'Cần chú ý đặc biệt'} arrow>
              <Chip
                icon={<WarningAmberIcon sx={{ fontSize: '0.7rem !important' }} />}
                label={student.specialNote ? 'Chú ý' : 'Cần chú ý'}
                size="small"
                sx={{ fontSize: '0.65rem', height: 20, mt: 0.5, bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600, cursor: 'help' }}
              />
            </Tooltip>
          )}
          {student.parentId?.phone && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.4, display: 'block' }}>
              PH: {student.parentId.phone}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

function StudentInClass() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user, hasRole, logout, isInitializing } = useAuth();

  const [classDetail, setClassDetail] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Remove student from class
  const [removeConfirm, setRemoveConfirm] = useState(null); // student object
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState(null);

  // Nhật ký: trạng thái hoàn thành từng tiết
  const [completedItems, setCompletedItems] = useState(new Set());
  const toggleCompleted = (id) =>
    setCompletedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Add students to class dialog
  const [addOpen, setAddOpen] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [addSelected, setAddSelected] = useState([]);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState(null);

  // ── auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    if (!hasRole('SchoolAdmin') && !hasRole('SystemAdmin')) { navigate('/', { replace: true }); return; }
    if (!classId) { navigate('/school-admin/classes', { replace: true }); return; }
    fetchAll();
  }, [navigate, user, hasRole, classId, isInitializing]);

  // ── data fetching ────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [detailRes, studentsRes, attRes, timetableRes] = await Promise.allSettled([
        get(ENDPOINTS.CLASSES.DETAIL(classId)),
        get(ENDPOINTS.CLASSES.STUDENTS(classId)),
        get(ENDPOINTS.SCHOOL_ADMIN.CLASS_ATTENDANCE_DETAIL(classId)),
        get(ENDPOINTS.SCHOOL_ADMIN.TIMETABLE.LIST()),
      ]);

      if (detailRes.status === 'fulfilled') {
        setClassDetail(detailRes.value.data || null);
      }
      if (studentsRes.status === 'fulfilled') {
        setStudents(studentsRes.value.data || []);
        // Also pick up classInfo if detail failed
        if (detailRes.status !== 'fulfilled' && studentsRes.value.classInfo) {
          setClassDetail(studentsRes.value.classInfo);
        }
      }
      if (attRes.status === 'fulfilled') {
        const attStudents = attRes.value.data?.students || [];
        const map = {};
        attStudents.forEach(s => { map[s._id] = s.attendance?.status || null; });
        setAttendanceMap(map);
      }
      if (timetableRes.status === 'fulfilled') {
        setTimetable(timetableRes.value.data || []);
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // ── add students dialog ───────────────────────────────────────────────────────
  const openAddStudents = async () => {
    setAddOpen(true);
    setAddSelected([]);
    setAddSearch('');
    setAddError(null);
    setLoadingAll(true);
    try {
      const res = await get(ENDPOINTS.STUDENTS.LIST);
      setAllStudents(res.data || []);
    } catch (err) {
      setAddError(err.message || 'Lỗi khi tải danh sách học sinh');
    } finally {
      setLoadingAll(false);
    }
  };

  const handleAddSubmit = async () => {
    if (addSelected.length === 0) return;
    setAddSubmitting(true);
    setAddError(null);
    try {
      await post(ENDPOINTS.CLASSES.ADD_STUDENTS(classId), { studentIds: addSelected });
      setAddOpen(false);
      fetchAll();
    } catch (err) {
      setAddError(err.data?.message || err.message || 'Lỗi khi thêm học sinh');
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!removeConfirm) return;
    setRemoveLoading(true);
    setRemoveError(null);
    try {
      await del(ENDPOINTS.CLASSES.REMOVE_STUDENT(classId, removeConfirm._id));
      setRemoveConfirm(null);
      if (selectedStudent?._id === removeConfirm._id) setSelectedStudent(null);
      fetchAll();
    } catch (err) {
      setRemoveError(err.data?.message || err.message || 'Lỗi khi xóa học sinh khỏi lớp');
    } finally {
      setRemoveLoading(false);
    }
  };

  // Toggle a student in the add-dialog selection
  const toggleAddStudent = (id) => {
    setAddSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ── computed ─────────────────────────────────────────────────────────────────
  const presentCount = useMemo(
    () => Object.values(attendanceMap).filter(s => s === 'present').length,
    [attendanceMap]
  );
  const attendanceRate = students.length > 0
    ? Math.round((presentCount / students.length) * 100)
    : 0;

  const ageRange = useMemo(() => {
    const ages = students.map(s => calcAge(s.dateOfBirth)).filter(a => a !== null);
    if (!ages.length) return 'N/A';
    const min = Math.min(...ages);
    const max = Math.max(...ages);
    return min === max ? `${min} tuổi` : `${min}–${max} tuổi`;
  }, [students]);

  const filteredStudents = useMemo(
    () => students.filter(s => s.fullName?.toLowerCase().includes(searchTerm.toLowerCase())),
    [students, searchTerm]
  );

  // ── layout helpers ───────────────────────────────────────────────────────────
  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };
  const handleViewProfile = () => navigate('/profile');
  const handleGoBack = () => {
    const gradeId = classDetail?.gradeId?._id || classDetail?.gradeId;
    const base = hasRole('SystemAdmin') ? '/system-admin/classes' : '/school-admin/classes';
    navigate(gradeId ? `${base}?gradeId=${gradeId}` : base);
  };

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  // ── render ───────────────────────────────────────────────────────────────────

  // Loading skeleton
  if (loading) {
    return (
      <RoleLayout
        title="Chi tiết lớp học"
        description=""
        menuItems={SCHOOL_ADMIN_MENU_ITEMS}
        activeKey="classes"
        onLogout={handleLogout}
        onViewProfile={handleViewProfile}
        onMenuSelect={handleMenuSelect}
        userName={user?.fullName || user?.username || 'Admin'}
        userAvatar={user?.avatar}
      >
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={36} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Đang tải thông tin lớp học...
          </Typography>
        </Box>
      </RoleLayout>
    );
  }

  const teachers = classDetail?.teacherIds || [];
  const className = classDetail?.className || 'Lớp học';
  const gradeName = classDetail?.gradeId?.gradeName || '';
  const yearName = classDetail?.academicYearId?.yearName || '';
  const maxStudents = classDetail?.maxStudents || 0;

  return (
    <RoleLayout
      title={`Chi tiết lớp ${className}`}
      description="Xem thông tin, học sinh và nhật ký của lớp học."
      menuItems={SCHOOL_ADMIN_MENU_ITEMS}
      activeKey="classes"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
      userName={user?.fullName || user?.username || 'Admin'}
      userAvatar={user?.avatar}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Header Card ──────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #6366f1 100%)',
          p: { xs: 2.5, md: 3.5 },
          mb: 2,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* decorative circles */}
        <Box sx={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -20, right: 100, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'flex-start' }} spacing={2}>
          <Box>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              size="small"
              sx={{
                mb: 1.5,
                color: 'rgba(255,255,255,0.85)',
                borderColor: 'rgba(255,255,255,0.3)',
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: 5,
                fontSize: '0.75rem',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              }}
              variant="outlined"
            >
              Quay lại danh sách lớp
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Lớp {className}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
              {gradeName && (
                <Chip label={`Khối ${gradeName}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, fontSize: '0.7rem' }} />
              )}
              {yearName && (
                <Chip label={yearName} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }} />
              )}
              <Chip label={`${students.length} học sinh`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }} />
            </Stack>
          </Box>

          {/* Teachers on the right */}
          {teachers.length > 0 && (
            <Box sx={{ textAlign: { md: 'right' } }}>
              <Typography variant="caption" sx={{ opacity: 0.75, fontWeight: 600, letterSpacing: 0.5 }}>
                GIÁO VIÊN PHỤ TRÁCH
              </Typography>
              <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                {teachers.map((t, i) => {
                  const name = t.userId?.fullName || t.fullName || '';
                  return (
                    <Stack key={t._id || i} direction="row" alignItems="center" spacing={1} justifyContent={{ md: 'flex-end' }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                        {name.charAt(0)?.toUpperCase() || 'T'}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>
                        {name}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Stack>

        <Stack direction="row" sx={{ mt: 2, opacity: 0.8 }} spacing={0.5} alignItems="center">
          <Button
            size="small"
            startIcon={<RefreshIcon fontSize="small" />}
            onClick={fetchAll}
            sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', minWidth: 'unset', px: 1.5 }}
          >
            Tải lại
          </Button>
        </Stack>
      </Paper>

      {/* ── Stats Bar ───────────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mb: 2 }}
        flexWrap="wrap"
      >
        <StatCard
          icon={<CalendarTodayIcon sx={{ color: '#7c3aed', fontSize: 22 }} />}
          label="Độ tuổi"
          value={ageRange}
          color="#7c3aed"
        />
        <StatCard
          icon={<PeopleIcon sx={{ color: '#2563eb', fontSize: 22 }} />}
          label="Sĩ số hiện tại"
          value={students.length}
          sub={maxStudents > 0 ? `/ ${maxStudents} tối đa` : undefined}
          color="#2563eb"
        />
        <StatCard
          icon={<CheckCircleIcon sx={{ color: '#16a34a', fontSize: 22 }} />}
          label="Tỷ lệ có mặt hôm nay"
          value={`${attendanceRate}%`}
          sub={`${presentCount} / ${students.length} học sinh`}
          color="#16a34a"
        />
        <StatCard
          icon={<SchoolIcon sx={{ color: '#d97706', fontSize: 22 }} />}
          label="Trạng thái lớp"
          value={
            <Chip
              label="Đang hoạt động"
              size="small"
              sx={{ bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 700, fontSize: '0.75rem', mt: 0.3 }}
            />
          }
          color="#d97706"
        />
      </Stack>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'grey.200',
            bgcolor: 'grey.50',
            '& .MuiTab-root': { fontWeight: 600, fontSize: '0.85rem', minHeight: 48 },
            '& .Mui-selected': { color: '#7c3aed' },
            '& .MuiTabs-indicator': { bgcolor: '#7c3aed', height: 3 },
          }}
        >
          <Tab label="Thông tin lớp" icon={<SchoolIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Danh sách học sinh" icon={<PeopleIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Nhật ký lớp" icon={<BookIcon fontSize="small" />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {/* ── Tab 0: Thông tin lớp ──────────────────────────────────────── */}
          {activeTab === 0 && (
            <Grid container spacing={2}>
              {/* Card: Giáo viên */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <PersonIcon sx={{ color: '#7c3aed' }} />
                    <Typography variant="subtitle2" fontWeight={700}>Giáo viên phụ trách</Typography>
                  </Stack>
                  {teachers.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Chưa phân công giáo viên</Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {teachers.map((t, i) => {
                        const name = t.userId?.fullName || t.fullName || '';
                        const email = t.userId?.email || t.email || '';
                        return (
                          <Stack key={t._id || i} direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 40, height: 40, bgcolor: '#ede9fe', color: '#7c3aed', fontWeight: 700 }}>
                              {name.charAt(0)?.toUpperCase() || 'T'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{name}</Typography>
                              {email && (
                                <Typography variant="caption" color="text.secondary">{email}</Typography>
                              )}
                            </Box>
                          </Stack>
                        );
                      })}
                    </Stack>
                  )}
                </Paper>
              </Grid>

              {/* Card: Phòng học */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <MeetingRoomIcon sx={{ color: '#2563eb' }} />
                    <Typography variant="subtitle2" fontWeight={700}>Phòng học & cơ sở vật chất</Typography>
                  </Stack>
                  {classDetail?.roomId ? (
                    <Stack spacing={1.5}>
                      {[
                        { label: 'Phòng học', value: classDetail.roomId.roomName },
                        { label: 'Tầng', value: classDetail.roomId.floor ? `Tầng ${classDetail.roomId.floor}` : 'N/A' },
                        { label: 'Sức chứa tối đa', value: classDetail.roomId.capacity > 0 ? `${classDetail.roomId.capacity} học sinh` : 'N/A' },
                        {
                          label: 'Tình trạng',
                          value: classDetail.roomId.status === 'available' ? 'Tốt'
                               : classDetail.roomId.status === 'in_use' ? 'Đang sử dụng'
                               : classDetail.roomId.status === 'maintenance' ? 'Bảo trì'
                               : 'N/A',
                        },
                      ].map(({ label, value }) => (
                        <Box key={label}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                          <Typography variant="body2" fontWeight={500}>{value}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Chưa phân phòng học</Typography>
                  )}
                </Paper>
              </Grid>

              {/* Card: Thời khóa biểu — full width */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <ScheduleIcon sx={{ color: '#d97706' }} />
                    <Typography variant="subtitle2" fontWeight={700}>Thời khóa biểu</Typography>
                  </Stack>
                  {timetable.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Chưa có thời khóa biểu</Typography>
                  ) : (
                    <Stack divider={<Divider />}>
                      {timetable.map(item => (
                        <Stack key={item._id} direction="row" spacing={2} alignItems="flex-start" sx={{ py: 1.25 }}>
                          <Typography variant="body2" sx={{ minWidth: 110, color: '#7c3aed', fontWeight: 600, flexShrink: 0 }}>
                            {item.startLabel} – {item.endLabel}
                          </Typography>
                          <Box>
                            <Typography variant="body2">{item.content}</Typography>
                            {item.appliesToSeason !== 'both' && (
                              <Typography variant="caption" sx={{ color: item.appliesToSeason === 'summer' ? '#d97706' : '#2563eb' }}>
                                {item.appliesToSeason === 'summer' ? 'Mùa hè' : 'Mùa đông'}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* ── Tab 1: Danh sách học sinh ────────────────────────────────── */}
          {activeTab === 1 && (
            <Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                  {filteredStudents.length} / {students.length} học sinh
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    placeholder="Tìm kiếm theo tên..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    sx={{ minWidth: 200 }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={openAddStudents}
                    sx={{
                      bgcolor: '#7c3aed',
                      '&:hover': { bgcolor: '#6d28d9' },
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      textTransform: 'none',
                    }}
                  >
                    Thêm học sinh
                  </Button>
                </Stack>
              </Stack>

              {filteredStudents.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <PeopleIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm ? 'Không tìm thấy học sinh nào khớp' : 'Lớp chưa có học sinh'}
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: 'repeat(4, 1fr)' },
                    gap: 1.5,
                  }}
                >
                  {filteredStudents.map(student => (
                    <StudentCard
                      key={student._id}
                      student={student}
                      attendanceStatus={attendanceMap[student._id] || null}
                      onClick={setSelectedStudent}
                      onRemove={setRemoveConfirm}
                    />
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* ── Tab 2: Nhật ký lớp ──────────────────────────────────────── */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                Nhật ký ngày {new Date().toLocaleDateString('vi-VN')}
              </Typography>

              {timetable.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Chưa có thời khóa biểu</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {timetable.map((item, idx) => {
                    const ICONS = [
                      <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 24 }} />,
                      <FavoriteIcon    sx={{ color: '#d97706', fontSize: 24 }} />,
                      <SchoolIcon      sx={{ color: '#2563eb', fontSize: 24 }} />,
                      <ScheduleIcon    sx={{ color: '#7c3aed', fontSize: 24 }} />,
                      <BookIcon        sx={{ color: '#0284c7', fontSize: 24 }} />,
                    ];
                    const seasonNote = item.appliesToSeason !== 'both'
                      ? (item.appliesToSeason === 'summer' ? 'Mùa hè' : 'Mùa đông')
                      : null;
                    const done = completedItems.has(item._id);
                    return (
                      <Paper
                        key={item._id}
                        variant="outlined"
                        sx={{
                          p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2,
                          borderColor: done ? '#16a34a' : 'grey.200',
                          bgcolor: done ? '#f0fdf4' : '#fff',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Box sx={{ width: 56, textAlign: 'center', flexShrink: 0 }}>
                          <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 700 }}>
                            {item.startLabel}
                          </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={700} sx={{ textDecoration: done ? 'line-through' : 'none', color: done ? 'text.secondary' : 'text.primary' }}>
                            {item.content}
                          </Typography>
                          {seasonNote && !done && (
                            <Typography variant="caption" sx={{ color: item.appliesToSeason === 'summer' ? '#d97706' : '#2563eb' }}>
                              {seasonNote}
                            </Typography>
                          )}
                          {done && (
                            <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>Đã hoạt động</Typography>
                          )}
                        </Box>
                        <Tooltip title={done ? 'Bỏ đánh dấu' : 'Đánh dấu đã hoạt động'}>
                          <Checkbox
                            checked={done}
                            onChange={() => toggleCompleted(item._id)}
                            size="small"
                            sx={{ color: 'grey.400', '&.Mui-checked': { color: '#16a34a' }, p: 0.5 }}
                          />
                        </Tooltip>
                        {!done && ICONS[idx % ICONS.length]}
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* ── Student Detail Modal ─────────────────────────────────────────────── */}
      <Dialog
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedStudent && (
          <>
            <DialogTitle sx={{ pb: 1, pr: 6 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: selectedStudent.gender === 'female' ? '#fbcfe8' : '#bfdbfe',
                    color: selectedStudent.gender === 'female' ? '#be185d' : '#1d4ed8',
                    fontWeight: 700,
                    fontSize: '1.2rem',
                  }}
                >
                  {selectedStudent.fullName?.charAt(0)?.toUpperCase() || <PersonIcon />}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{selectedStudent.fullName}</Typography>
                  <Stack direction="row" spacing={0.75}>
                    <Chip
                      label={selectedStudent.gender === 'male' ? 'Nam' : selectedStudent.gender === 'female' ? 'Nữ' : 'Khác'}
                      size="small"
                      sx={{ fontSize: '0.65rem', height: 20, bgcolor: selectedStudent.gender === 'female' ? '#fdf2f8' : '#eff6ff', color: selectedStudent.gender === 'female' ? '#be185d' : '#1d4ed8', fontWeight: 600 }}
                    />
                    <Chip
                      label={(() => { const att = attendanceColor(attendanceMap[selectedStudent._id]); return att.label; })()}
                      size="small"
                      sx={{ fontSize: '0.65rem', height: 20, bgcolor: attendanceColor(attendanceMap[selectedStudent._id]).bg, color: attendanceColor(attendanceMap[selectedStudent._id]).color, fontWeight: 600 }}
                    />
                  </Stack>
                </Box>
              </Stack>
              <IconButton
                onClick={() => setSelectedStudent(null)}
                size="small"
                sx={{ position: 'absolute', top: 12, right: 12 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              <Stack spacing={2.5}>
                {/* Thông tin cá nhân */}
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 0.5, mb: 1, display: 'block' }}>
                    THÔNG TIN CÁ NHÂN
                  </Typography>
                  <Grid container spacing={1.5}>
                    {[
                      { label: 'Ngày sinh', value: fmtDate(selectedStudent.dateOfBirth) },
                      { label: 'Tuổi', value: calcAge(selectedStudent.dateOfBirth) !== null ? `${calcAge(selectedStudent.dateOfBirth)} tuổi` : 'N/A' },
                      { label: 'Lớp', value: classDetail?.className || 'N/A' },
                      { label: 'Trạng thái', value: selectedStudent.status === 'active' ? 'Đang học' : 'Nghỉ học' },
                    ].map(({ label, value }) => (
                      <Grid item xs={6} key={label}>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="body2" fontWeight={600}>{value}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Divider />

                {/* Thông tin phụ huynh */}
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 0.5, mb: 1, display: 'block' }}>
                    THÔNG TIN PHỤ HUYNH
                  </Typography>
                  {selectedStudent.parentId ? (
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 36, height: 36, bgcolor: '#ede9fe', color: '#7c3aed', fontWeight: 700, fontSize: '0.9rem' }}>
                          {selectedStudent.parentId.fullName?.charAt(0)?.toUpperCase() || 'P'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{selectedStudent.parentId.fullName || 'N/A'}</Typography>
                          {selectedStudent.parentId.email && (
                            <Typography variant="caption" color="text.secondary">{selectedStudent.parentId.email}</Typography>
                          )}
                        </Box>
                      </Stack>
                      {selectedStudent.parentId.phone && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{selectedStudent.parentId.phone}</Typography>
                        </Stack>
                      )}
                      {selectedStudent.address && (
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <HomeIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                          <Typography variant="body2" color="text.secondary">{selectedStudent.address}</Typography>
                        </Stack>
                      )}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Chưa có thông tin phụ huynh</Typography>
                  )}
                </Box>

                {/* SĐT phụ huynh (từ student trực tiếp) */}
                {selectedStudent.parentPhone && !selectedStudent.parentId?.phone && (
                  <>
                    <Divider />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">SĐT phụ huynh: {selectedStudent.parentPhone}</Typography>
                    </Stack>
                  </>
                )}

                <Divider />

                {/* Chú ý đặc biệt */}
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <WarningAmberIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 0.5 }}>
                      CHÚ Ý ĐẶC BIỆT
                    </Typography>
                  </Stack>
                  {selectedStudent.needsSpecialAttention ? (
                    <Box sx={{ bgcolor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 1.5, px: 1.5, py: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <WarningAmberIcon sx={{ fontSize: 16, color: '#d97706', mt: 0.2, flexShrink: 0 }} />
                        <Typography variant="body2" color="#92400e" sx={{ whiteSpace: 'pre-wrap' }}>
                          {selectedStudent.specialNote || 'Học sinh cần được chú ý đặc biệt'}
                        </Typography>
                      </Stack>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Không có</Typography>
                  )}
                </Box>
              </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button onClick={() => setSelectedStudent(null)} variant="outlined" size="small">
                Đóng
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Add Students to Class Dialog ─────────────────────────────────────── */}
      <Dialog
        open={addOpen}
        onClose={() => !addSubmitting && setAddOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, height: '80vh', display: 'flex', flexDirection: 'column' } }}
      >
        <DialogTitle sx={{ pb: 1, pr: 6 }}>
          <Typography variant="subtitle1" fontWeight={700}>Thêm học sinh vào lớp</Typography>
          <Typography variant="caption" color="text.secondary">
            Chọn học sinh chưa có lớp để thêm vào <strong>{className}</strong>
            {classDetail?.maxStudents > 0 && ` (còn trống ${Math.max(0, classDetail.maxStudents - students.length)} chỗ)`}
          </Typography>
          <IconButton
            onClick={() => setAddOpen(false)}
            size="small"
            disabled={addSubmitting}
            sx={{ position: 'absolute', top: 12, right: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Box sx={{ px: 3, pb: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm kiếm tên học sinh..."
            value={addSearch}
            onChange={e => setAddSearch(e.target.value)}
            autoComplete="off"
          />
        </Box>

        {addError && (
          <Alert severity="error" sx={{ mx: 3, mb: 1 }} onClose={() => setAddError(null)}>
            {addError}
          </Alert>
        )}

        <DialogContent dividers sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
          {loadingAll ? (
            <Stack alignItems="center" py={5}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary" mt={1.5}>Đang tải danh sách...</Typography>
            </Stack>
          ) : (() => {
            const currentClassStudentIds = new Set(students.map(s => String(s._id)));
            // Chỉ hiện học sinh chưa có lớp nào (classId null/undefined)
            const available = allStudents.filter(s => !s.classId);
            const filtered = available.filter(s =>
              s.fullName?.toLowerCase().includes(addSearch.toLowerCase())
            );
            if (filtered.length === 0) {
              return (
                <Stack alignItems="center" py={5}>
                  <PeopleIcon sx={{ fontSize: 40, color: 'grey.300' }} />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {addSearch ? 'Không tìm thấy học sinh' : 'Tất cả học sinh đã được xếp vào lớp'}
                  </Typography>
                </Stack>
              );
            }
            return (
              <List disablePadding>
                {filtered.map((s, idx) => {
                  const inThisClass = currentClassStudentIds.has(String(s._id));
                  const isDisabled = inThisClass;
                  const isSelected = addSelected.includes(s._id);
                  const age = calcAge(s.dateOfBirth);

                  return (
                    <ListItem
                      key={s._id}
                      divider={idx < filtered.length - 1}
                      disablePadding
                      sx={{
                        px: 2,
                        py: 0.75,
                        opacity: isDisabled ? 0.55 : 1,
                        bgcolor: isSelected ? '#f5f3ff' : 'transparent',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        '&:hover': !isDisabled ? { bgcolor: isSelected ? '#ede9fe' : 'grey.50' } : {},
                      }}
                      onClick={() => !isDisabled && toggleAddStudent(s._id)}
                    >
                      <ListItemAvatar sx={{ minWidth: 44 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: s.gender === 'female' ? '#fbcfe8' : '#bfdbfe',
                            color: s.gender === 'female' ? '#be185d' : '#1d4ed8',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                          }}
                        >
                          {s.fullName?.charAt(0)?.toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                            <Typography variant="body2" fontWeight={600}>{s.fullName}</Typography>
                            {age !== null && (
                              <Chip label={`${age} tuổi`} size="small" sx={{ height: 18, fontSize: '0.62rem', bgcolor: 'grey.100', color: 'grey.600' }} />
                            )}
                            {inThisClass && (
                              <Chip label="Đã trong lớp" size="small" sx={{ height: 18, fontSize: '0.62rem', bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 600 }} />
                            )}
                            {s.needsSpecialAttention && (
                              <Tooltip title={s.specialNote || 'Cần chú ý đặc biệt'} arrow>
                                <Chip
                                  icon={<WarningAmberIcon sx={{ fontSize: '0.65rem !important' }} />}
                                  label="Chú ý"
                                  size="small"
                                  sx={{ height: 18, fontSize: '0.62rem', bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600, cursor: 'help' }}
                                />
                              </Tooltip>
                            )}
                          </Stack>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {s.gender === 'male' ? 'Nam' : s.gender === 'female' ? 'Nữ' : 'Khác'}
                            {s.dateOfBirth && ` · ${new Date(s.dateOfBirth).toLocaleDateString('vi-VN')}`}
                            {s.parentId?.fullName && ` · PH: ${s.parentId.fullName}`}
                          </Typography>
                        }
                      />
                      <Checkbox
                        edge="end"
                        checked={inThisClass || isSelected}
                        disabled={isDisabled}
                        size="small"
                        sx={{ color: '#7c3aed', '&.Mui-checked': { color: '#7c3aed' } }}
                        onClick={e => e.stopPropagation()}
                        onChange={() => !isDisabled && toggleAddStudent(s._id)}
                      />
                    </ListItem>
                  );
                })}
              </List>
            );
          })()}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            {addSelected.length > 0 ? `Đã chọn ${addSelected.length} học sinh` : 'Chưa chọn học sinh nào'}
          </Typography>
          <Button onClick={() => setAddOpen(false)} color="inherit" disabled={addSubmitting}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleAddSubmit}
            disabled={addSelected.length === 0 || addSubmitting}
            sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, textTransform: 'none', fontWeight: 600 }}
          >
            {addSubmitting
              ? <CircularProgress size={18} color="inherit" />
              : `Thêm ${addSelected.length > 0 ? addSelected.length : ''} học sinh`}
          </Button>
        </DialogActions>
      </Dialog>
      {/* ── Confirm remove student dialog ───────────────────────────────── */}
      <Dialog open={!!removeConfirm} onClose={() => !removeLoading && setRemoveConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Xóa học sinh khỏi lớp</DialogTitle>
        <DialogContent>
          {removeError && <Alert severity="error" sx={{ mb: 1.5 }}>{removeError}</Alert>}
          <Typography variant="body2">
            Bạn có chắc muốn xóa <strong>{removeConfirm?.fullName}</strong> khỏi lớp này? Học sinh sẽ không còn thuộc lớp nào.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setRemoveConfirm(null)} color="inherit" disabled={removeLoading}>Hủy</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRemoveStudent}
            disabled={removeLoading}
          >
            {removeLoading ? <CircularProgress size={18} color="inherit" /> : 'Xóa khỏi lớp'}
          </Button>
        </DialogActions>
      </Dialog>

    </RoleLayout>
  );
}

export default StudentInClass;
