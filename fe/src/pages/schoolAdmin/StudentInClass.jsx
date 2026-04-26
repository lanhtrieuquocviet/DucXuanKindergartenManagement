import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, post, del, ENDPOINTS } from '../../service/api';
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
  CircularProgress,
  Tabs,
  Tab,
  Avatar,
  Divider,
  Grid,
} from '@mui/material';
import {
  WbSunny as WbSunnyIcon,
  AcUnit as AcUnitIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  CalendarToday as CalendarTodayIcon,
  CheckCircle as CheckCircleIcon,
  MeetingRoom as MeetingRoomIcon,
  Schedule as ScheduleIcon,
  Book as BookIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

// Sub-components
import StatCard from './ClassManagement/StudentInClass/StatCard';
import StudentCard from './ClassManagement/StudentInClass/StudentCard';
import StudentDetailDialog from './ClassManagement/StudentInClass/StudentDetailDialog';
import AddStudentsToClassDialog from './ClassManagement/StudentInClass/AddStudentsToClassDialog';
import TabDanhGia from './ClassManagement/StudentInClass/TabDanhGia';
import { calcAge, attendanceColor } from './ClassManagement/StudentInClass/helpers';

export default function StudentInClass() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user, hasRole, isInitializing } = useAuth();
  const menuItems = useSchoolAdminMenu();

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
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState(null);

  // Nhật ký: mùa từ năm học và trạng thái hoàn thành từng tiết
  const [activeSeason, setActiveSeason] = useState('summer');
  const [completedItems, setCompletedItems] = useState(new Set());
  const toggleCompleted = (id) =>
    setCompletedItems((prev) => {
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
    fetchAll();
  }, [navigate, user, hasRole, classId, isInitializing]);

  // ── data fetching ────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [detailRes, studentsRes, attRes, timetableRes, yearRes] = await Promise.allSettled([
        get(ENDPOINTS.CLASSES.DETAIL(classId)),
        get(ENDPOINTS.CLASSES.STUDENTS(classId)),
        get(ENDPOINTS.SCHOOL_ADMIN.CLASS_ATTENDANCE_DETAIL(classId)),
        get(ENDPOINTS.SCHOOL_ADMIN.TIMETABLE.LIST()),
        get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT),
      ]);

      if (detailRes.status === 'fulfilled') {
        setClassDetail(detailRes.value.data || null);
      }
      if (studentsRes.status === 'fulfilled') {
        setStudents(studentsRes.value.data || []);
        if (detailRes.status !== 'fulfilled' && studentsRes.value.classInfo) {
          setClassDetail(studentsRes.value.classInfo);
        }
      }
      if (attRes.status === 'fulfilled') {
        const attStudents = attRes.value.data?.students || [];
        const map = {};
        attStudents.forEach((s) => {
          map[s._id] = s.attendance?.status || null;
        });
        setAttendanceMap(map);
      }
      if (timetableRes.status === 'fulfilled') {
        setTimetable(timetableRes.value.data || []);
      }
      if (yearRes.status === 'fulfilled') {
        const year = yearRes.value.data || null;
        const s = year?.activeTimetableSeason;
        const month = new Date().getMonth() + 1;
        const calSeason = month >= 4 && month <= 9 ? 'summer' : 'winter';
        setActiveSeason(s === 'summer' || s === 'winter' ? s : calSeason);
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

  const toggleAddStudent = (id) => {
    setAddSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ── computed ─────────────────────────────────────────────────────────────────
  const presentCount = useMemo(
    () => Object.values(attendanceMap).filter((s) => s === 'present').length,
    [attendanceMap]
  );
  const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  const ageRange = useMemo(() => {
    const ages = students.map((s) => calcAge(s.dateOfBirth)).filter((a) => a !== null);
    if (!ages.length) return 'N/A';
    const min = Math.min(...ages);
    const max = Math.max(...ages);
    return min === max ? `${min} tuổi` : `${min}–${max} tuổi`;
  }, [students]);

  const filteredStudents = useMemo(
    () => students.filter((s) => s.fullName?.toLowerCase().includes(searchTerm.toLowerCase())),
    [students, searchTerm]
  );

  const handleGoBack = () => {
    const gradeId = classDetail?.gradeId?._id || classDetail?.gradeId;
    const base = hasRole('SystemAdmin') ? '/system-admin/classes' : '/school-admin/classes';
    navigate(gradeId ? `${base}?gradeId=${gradeId}` : base);
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={36} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Đang tải thông tin lớp học...
        </Typography>
      </Box>
    );
  }

  const teachers = classDetail?.teacherIds || [];
  const className = classDetail?.className || 'Lớp học';
  const gradeName = classDetail?.gradeId?.gradeName || '';
  const yearName = classDetail?.academicYearId?.yearName || '';
  const maxStudents = classDetail?.maxStudents || 0;

  return (
    <Box>
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
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 160,
            height: 160,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -20,
            right: 100,
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }}
        />

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ md: 'flex-start' }}
          spacing={2}
        >
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
                <Chip
                  label={`Khối ${gradeName}`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, fontSize: '0.7rem' }}
                />
              )}
              {yearName && (
                <Chip
                  label={yearName}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}
                />
              )}
              <Chip
                label={`${students.length} học sinh`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}
              />
            </Stack>
          </Box>

          {teachers.length > 0 && (
            <Box sx={{ textAlign: { md: 'right' } }}>
              <Typography variant="caption" sx={{ opacity: 0.75, fontWeight: 600, letterSpacing: 0.5 }}>
                GIÁO VIÊN PHỤ TRÁCH
              </Typography>
              <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                {teachers.map((t, i) => {
                  const name = t.userId?.fullName || t.fullName || '';
                  return (
                    <Stack
                      key={t._id || i}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      justifyContent={{ md: 'flex-end' }}
                    >
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: 'rgba(255,255,255,0.25)',
                          color: '#fff',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
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
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap">
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
          <Tab label="Thông tin lớp" icon={<MeetingRoomIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Danh sách trẻ em" icon={<PeopleIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Nhật ký lớp" icon={<BookIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Đánh giá định kỳ" icon={<AssessmentIcon fontSize="small" />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {activeTab === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <PersonIcon sx={{ color: '#7c3aed' }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Giáo viên phụ trách
                    </Typography>
                  </Stack>
                  {teachers.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Chưa phân công giáo viên
                    </Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {teachers.map((t, i) => {
                        const name = t.userId?.fullName || t.fullName || '';
                        const email = t.userId?.email || t.email || '';
                        return (
                          <Stack key={t._id || i} direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              sx={{ width: 40, height: 40, bgcolor: '#ede9fe', color: '#7c3aed', fontWeight: 700 }}
                            >
                              {name.charAt(0)?.toUpperCase() || 'T'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {name}
                              </Typography>
                              {email && (
                                <Typography variant="caption" color="text.secondary">
                                  {email}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        );
                      })}
                    </Stack>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <MeetingRoomIcon sx={{ color: '#2563eb' }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Phòng học & cơ sở vật chất
                    </Typography>
                  </Stack>
                  {classDetail?.roomId ? (
                    <Stack spacing={1.5}>
                      {[
                        { label: 'Phòng học', value: classDetail.roomId.roomName },
                        { label: 'Tầng', value: classDetail.roomId.floor ? `Tầng ${classDetail.roomId.floor}` : 'N/A' },
                        {
                          label: 'Sức chứa tối đa',
                          value: classDetail.roomId.capacity > 0 ? `${classDetail.roomId.capacity} học sinh` : 'N/A',
                        },
                        {
                          label: 'Tình trạng',
                          value:
                            classDetail.roomId.status === 'available'
                              ? 'Tốt'
                              : classDetail.roomId.status === 'in_use'
                              ? 'Đang sử dụng'
                              : classDetail.roomId.status === 'maintenance'
                              ? 'Bảo trì'
                              : 'N/A',
                        },
                      ].map(({ label, value }) => (
                        <Box key={label}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {label}
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {value}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Chưa phân phòng học
                    </Typography>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <ScheduleIcon sx={{ color: '#d97706' }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Thời khóa biểu
                    </Typography>
                  </Stack>
                  {timetable.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Chưa có thời khóa biểu
                    </Typography>
                  ) : (
                    <Stack divider={<Divider />}>
                      {timetable.map((item) => (
                        <Stack key={item._id} direction="row" spacing={2} alignItems="flex-start" sx={{ py: 1.25 }}>
                          <Typography
                            variant="body2"
                            sx={{ minWidth: 110, color: '#7c3aed', fontWeight: 600, flexShrink: 0 }}
                          >
                            {item.startLabel} – {item.endLabel}
                          </Typography>
                          <Box>
                            <Typography variant="body2">{item.content}</Typography>
                            {item.appliesToSeason !== 'both' && (
                              <Typography
                                variant="caption"
                                sx={{ color: item.appliesToSeason === 'summer' ? '#d97706' : '#2563eb' }}
                              >
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

          {activeTab === 1 && (
            <Box>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ sm: 'center' }}
                spacing={1.5}
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                  {filteredStudents.length} / {students.length} học sinh
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    placeholder="Tìm kiếm theo tên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                  {filteredStudents.map((student) => (
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

          {activeTab === 2 && (
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
                flexWrap="wrap"
                gap={1}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  Nhật ký ngày {new Date().toLocaleDateString('vi-VN')}
                </Typography>
                <Chip
                  icon={
                    activeSeason === 'summer' ? (
                      <WbSunnyIcon sx={{ fontSize: '16px !important', color: '#d97706 !important' }} />
                    ) : (
                      <AcUnitIcon sx={{ fontSize: '16px !important', color: '#2563eb !important' }} />
                    )
                  }
                  label={activeSeason === 'summer' ? 'Đang áp dụng: Mùa hè' : 'Đang áp dụng: Mùa đông'}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    bgcolor: activeSeason === 'summer' ? '#fef3c7' : '#dbeafe',
                    color: activeSeason === 'summer' ? '#92400e' : '#1e40af',
                    border: '1px solid',
                    borderColor: activeSeason === 'summer' ? '#fde68a' : '#bfdbfe',
                  }}
                />
              </Stack>

              {timetable.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Chưa có thời khóa biểu
                </Typography>
              ) : (() => {
                const filtered = timetable.filter(
                  (item) => item.appliesToSeason === 'both' || item.appliesToSeason === activeSeason
                );
                if (filtered.length === 0) {
                  return (
                    <Typography variant="body2" color="text.secondary">
                      Không có hoạt động nào cho {activeSeason === 'summer' ? 'mùa hè' : 'mùa đông'}.
                    </Typography>
                  );
                }
                return (
                  <Stack spacing={1.5}>
                    {filtered.map((item, idx) => {
                      const ICONS = [
                        <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 24 }} />,
                        <FavoriteIcon sx={{ color: '#d97706', fontSize: 24 }} />,
                        <SchoolIcon sx={{ color: '#2563eb', fontSize: 24 }} />,
                        <ScheduleIcon sx={{ color: '#7c3aed', fontSize: 24 }} />,
                        <BookIcon sx={{ color: '#0284c7', fontSize: 24 }} />,
                      ];
                      const done = completedItems.has(item._id);
                      return (
                        <Paper
                          key={item._id}
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            borderColor: done ? '#16a34a' : 'grey.200',
                            bgcolor: done ? '#f0fdf4' : '#fff',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                          }}
                          onClick={() => toggleCompleted(item._id)}
                        >
                          <Box sx={{ width: 56, textAlign: 'center', flexShrink: 0 }}>
                            <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 700 }}>
                              {item.startLabel}
                            </Typography>
                          </Box>
                          <Divider orientation="vertical" flexItem />
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              sx={{
                                textDecoration: done ? 'line-through' : 'none',
                                color: done ? 'text.secondary' : 'text.primary',
                              }}
                            >
                              {item.content}
                            </Typography>
                            {done && (
                              <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>
                                Đã hoạt động
                              </Typography>
                            )}
                          </Box>
                          {ICONS[idx % ICONS.length]}
                        </Paper>
                      );
                    })}
                  </Stack>
                );
              })()}
            </Box>
          )}
          
          {activeTab === 3 && (
            <Box sx={{ maxWidth: 800, mx: 'auto', py: 2 }}>
              <TabDanhGia studentId={null} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center', fontStyle: 'italic' }}>
                * Lưu ý: Đây là bảng tổng hợp các nhận xét đánh giá của học sinh trong lớp {classDetail?.className}.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Dialogs */}
      <StudentDetailDialog
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent}
        classDetail={classDetail}
        attendanceMap={attendanceMap}
      />

      <AddStudentsToClassDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        className={className}
        maxStudents={maxStudents}
        currentStudentCount={students.length}
        loadingAll={loadingAll}
        allStudents={allStudents}
        addSearch={addSearch}
        setAddSearch={setAddSearch}
        addSelected={addSelected}
        toggleAddStudent={toggleAddStudent}
        addSubmitting={addSubmitting}
        addError={addError}
        setAddError={setAddError}
        onSubmit={handleAddSubmit}
        currentClassStudentIds={new Set(students.map((s) => String(s._id)))}
      />

      {/* Confirm remove student dialog */}
      <Dialog
        open={!!removeConfirm}
        onClose={() => !removeLoading && setRemoveConfirm(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Xóa học sinh khỏi lớp</DialogTitle>
        <DialogContent dividers>
          {removeError && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {removeError}
            </Alert>
          )}
          <Typography variant="body2">
            Bạn có chắc muốn xóa <strong>{removeConfirm?.fullName}</strong> khỏi lớp này? Học sinh sẽ không còn thuộc
            lớp nào.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setRemoveConfirm(null)} color="inherit" disabled={removeLoading}>
            Hủy
          </Button>
          <Button variant="contained" color="error" onClick={handleRemoveStudent} disabled={removeLoading}>
            {removeLoading ? <CircularProgress size={18} color="inherit" /> : 'Xóa khỏi lớp'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
