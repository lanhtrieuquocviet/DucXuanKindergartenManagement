import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTeacher } from '../../context/TeacherContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, ENDPOINTS } from '../../service/api';
import {
  Box, Paper, Typography, Avatar, Chip, Skeleton, Alert, Stack,
  List, ListItemButton, ListItemAvatar, ListItemText, Divider,
  Tabs, Tab, Grid, InputAdornment, TextField, CircularProgress,
  MenuItem, Select, LinearProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Cake as CakeIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  MenuBook as ContactIcon,
  MonitorHeart as HealthIcon,
  StickyNote2 as NoteIcon,
  Forum as ForumIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  EventBusy as LeaveIcon,
} from '@mui/icons-material';

// ── helpers ──────────────────────────────────────────────────
function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years === 0) return `${months} tháng`;
  if (months === 0) return `${years} tuổi`;
  return `${years} tuổi ${months} tháng`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

function genderLabel(g) {
  if (g === 'male') return 'Nam';
  if (g === 'female') return 'Nữ';
  return 'Khác';
}

function getTeacherMenuItems(isCommitteeMember, hasPermission) {
  const ALL_TEACHER_MENU = [
    { key: 'classes', label: 'Lớp phụ trách' },
    { key: 'students', label: 'Danh sách học sinh' },
    { key: 'attendance', label: 'Điểm danh', permission: 'MANAGE_ATTENDANCE' },
    { key: 'pickup-approval', label: 'Đơn đưa đón', permission: 'MANAGE_PICKUP' },
    { key: 'schedule', label: 'Lịch dạy & hoạt động' },
    { key: 'contact-book', label: 'Sổ liên lạc điện tử' },
    { key: 'purchase-request', label: 'Cơ sở vật chất', permission: 'MANAGE_PURCHASE_REQUEST' },
    { key: 'class-assets', label: 'Tài sản lớp', permission: 'MANAGE_ASSET' },
  ];
  const items = ALL_TEACHER_MENU.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );
  if (isCommitteeMember && hasPermission('MANAGE_ASSET')) {
    items.push({ key: 'asset-inspection', label: 'Kiểm kê tài sản' });
  }
  return items;
}

// ── InfoRow ──────────────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.75}>
        {icon && <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>}
        <Typography variant="body2" fontWeight={600}>{value || '—'}</Typography>
      </Stack>
    </Box>
  );
}

// ── Tab panels ───────────────────────────────────────────────
function TabHoSo({ student, health, healthLoading }) {
  return (
    <Box>
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
          <PersonIcon sx={{ fontSize: 18, color: '#e11d48' }} />
          <Typography variant="subtitle2" fontWeight={700}>Thông tin cơ bản</Typography>
        </Stack>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 6 }}>
            <InfoRow label="Họ và tên" value={student.fullName} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <InfoRow label="Ngày sinh" value={fmtDate(student.dateOfBirth)} icon={<CakeIcon sx={{ fontSize: 14 }} />} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <InfoRow label="Giới tính" value={genderLabel(student.gender)} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <InfoRow label="Địa chỉ" value={student.address} icon={<HomeIcon sx={{ fontSize: 14 }} />} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <InfoRow label="Phụ huynh" value={student.parentId?.fullName} icon={<PeopleIcon sx={{ fontSize: 14 }} />} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <InfoRow
              label="SĐT"
              value={student.parentId?.phone || student.parentPhone || student.phone}
              icon={<PhoneIcon sx={{ fontSize: 14 }} />}
            />
          </Grid>
          {student.specialNote && (
            <Grid size={{ xs: 12 }}>
              <InfoRow label="Ghi chú đặc biệt" value={student.specialNote} icon={<NoteIcon sx={{ fontSize: 14 }} />} />
            </Grid>
          )}
        </Grid>

        <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" fontStyle="italic">
            Giáo viên chỉ được chỉnh sửa sau khi Ban Giám hiệu duyệt
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

function TabSucKhoe({ health, healthLoading }) {
  if (healthLoading) {
    return <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />;
  }
  if (!health) {
    return (
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}>
        <HealthIcon sx={{ fontSize: 44, color: 'grey.300', mb: 1 }} />
        <Typography color="text.secondary">Chưa có dữ liệu sức khỏe.</Typography>
      </Paper>
    );
  }
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
        <HealthIcon sx={{ fontSize: 18, color: '#0891b2' }} />
        <Typography variant="subtitle2" fontWeight={700}>Hồ sơ sức khỏe</Typography>
        <Chip label={fmtDate(health.checkDate)} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
      </Stack>
      <Grid container spacing={2}>
        {health.height && (
          <Grid size={{ xs: 6, sm: 4 }}>
            <InfoRow label="Chiều cao" value={`${health.height} cm`} />
          </Grid>
        )}
        {health.weight && (
          <Grid size={{ xs: 6, sm: 4 }}>
            <InfoRow label="Cân nặng" value={`${health.weight} kg`} />
          </Grid>
        )}
        {health.temperature && (
          <Grid size={{ xs: 6, sm: 4 }}>
            <InfoRow label="Thân nhiệt" value={`${health.temperature}°C`} />
          </Grid>
        )}
        {health.heartRate && (
          <Grid size={{ xs: 6, sm: 4 }}>
            <InfoRow label="Nhịp tim" value={`${health.heartRate} bpm`} />
          </Grid>
        )}
        {health.generalStatus && (
          <Grid size={{ xs: 6, sm: 4 }}>
            <InfoRow
              label="Tình trạng chung"
              value={
                health.generalStatus === 'healthy' ? 'Bình thường' :
                health.generalStatus === 'monitor' ? 'Cần theo dõi' : 'Đáng lo ngại'
              }
            />
          </Grid>
        )}
        {health.allergies?.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Dị ứng</Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {health.allergies.map((a, i) => (
                <Chip key={i} label={a.allergen} size="small" color="warning" variant="outlined" />
              ))}
            </Stack>
          </Grid>
        )}
        {health.chronicDiseases?.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Bệnh mãn tính</Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {health.chronicDiseases.map((d, i) => (
                <Chip key={i} label={d} size="small" color="error" variant="outlined" />
              ))}
            </Stack>
          </Grid>
        )}
        {health.notes && (
          <Grid size={{ xs: 12 }}>
            <InfoRow label="Ghi chú bác sĩ" value={health.notes} icon={<NoteIcon sx={{ fontSize: 14 }} />} />
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}

function TabPlaceholder({ icon, label }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 6, textAlign: 'center' }}>
      <Box sx={{ fontSize: 44, color: 'grey.300', mb: 1 }}>{icon}</Box>
      <Typography color="text.secondary">{label}</Typography>
    </Paper>
  );
}

// ── TabDiemDanh ───────────────────────────────────────────────
function TabDiemDanh({ classId, studentId }) {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data,  setData]  = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    get(`${ENDPOINTS.TEACHER.CONTACT_BOOK_ATTENDANCE(classId, studentId)}?year=${year}&month=${month}`)
      .then(res => setData(res.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [classId, studentId, year, month]);

  const STATUS_CONFIG = {
    present: { label: 'Có mặt', color: '#16a34a', bg: '#dcfce7', icon: <PresentIcon sx={{ fontSize: 14 }} /> },
    absent:  { label: 'Vắng',   color: '#dc2626', bg: '#fee2e2', icon: <AbsentIcon  sx={{ fontSize: 14 }} /> },
    leave:   { label: 'Nghỉ phép', color: '#d97706', bg: '#fef3c7', icon: <LeaveIcon sx={{ fontSize: 14 }} /> },
  };

  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
  const YEARS  = [now.getFullYear() - 1, now.getFullYear()];

  return (
    <Box>
      {/* Filter */}
      <Stack direction="row" spacing={1.5} mb={2} alignItems="center">
        <CalendarIcon sx={{ fontSize: 18, color: '#0891b2' }} />
        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>Lịch sử điểm danh</Typography>
        <Select
          size="small" value={month}
          onChange={e => setMonth(e.target.value)}
          sx={{ minWidth: 110, fontSize: 13, borderRadius: 2 }}
        >
          {MONTHS.map(m => (
            <MenuItem key={m} value={m} sx={{ fontSize: 13 }}>Tháng {m}</MenuItem>
          ))}
        </Select>
        <Select
          size="small" value={year}
          onChange={e => setYear(e.target.value)}
          sx={{ minWidth: 80, fontSize: 13, borderRadius: 2 }}
        >
          {YEARS.map(y => (
            <MenuItem key={y} value={y} sx={{ fontSize: 13 }}>{y}</MenuItem>
          ))}
        </Select>
      </Stack>

      {loading ? (
        <Box>
          {[1,2,3].map(i => <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: 2, mb: 1 }} />)}
        </Box>
      ) : !data || data.records.length === 0 ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}>
          <CalendarIcon sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
          <Typography color="text.secondary" variant="body2">Không có dữ liệu điểm danh tháng {month}/{year}</Typography>
        </Paper>
      ) : (
        <>
          {/* Tỷ lệ + thống kê */}
          <Paper elevation={0} sx={{ borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', p: 2, mb: 2 }}>
            <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Typography variant="caption" color="text.secondary">Tỷ lệ đi học tháng {month}</Typography>
                <Stack direction="row" alignItems="baseline" spacing={0.5}>
                  <Typography variant="h5" fontWeight={800} color="#16a34a">{data.rate ?? '—'}%</Typography>
                  <Typography variant="caption" color="text.secondary">({data.present}/{data.total} ngày)</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={data.rate ?? 0}
                  sx={{ mt: 0.75, height: 6, borderRadius: 3, bgcolor: '#dcfce7', '& .MuiLinearProgress-bar': { bgcolor: '#16a34a', borderRadius: 3 } }}
                />
              </Box>
              <Stack direction="row" spacing={2}>
                {[
                  { key: 'present', label: 'Có mặt', val: data.present },
                  { key: 'absent',  label: 'Vắng',   val: data.absent  },
                  { key: 'leave',   label: 'Phép',   val: data.leave   },
                ].map(s => (
                  <Box key={s.key} sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={700} color={STATUS_CONFIG[s.key].color}>{s.val}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Paper>

          {/* Danh sách ngày */}
          <Stack spacing={0.5}>
            {data.records.map((r, idx) => {
              const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.present;
              const dateLabel = new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
              return (
                <Box key={r._id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', py: 1.25, px: 0.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{dateLabel}</Typography>
                      <Typography variant="caption" color={cfg.color}>
                        {cfg.label}
                        {r.timeString?.checkIn ? ` · ${r.timeString.checkIn}` : ''}
                        {r.absentReason ? ` · ${r.absentReason}` : ''}
                      </Typography>
                    </Box>
                    <Chip
                      label={cfg.label}
                      size="small"
                      icon={cfg.icon}
                      sx={{
                        bgcolor: cfg.bg, color: cfg.color, fontWeight: 700,
                        fontSize: '0.72rem', border: `1px solid ${cfg.bg}`,
                        '& .MuiChip-icon': { color: cfg.color },
                      }}
                    />
                  </Box>
                  {idx < data.records.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Stack>
        </>
      )}
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────
export default function ContactBookDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isInitializing } = useAuth();
  const { isCommitteeMember } = useTeacher();
  const { hasPermission } = useAuth();

  const [classInfo, setClassInfo]       = useState(null);
  const [students, setStudents]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [selected, setSelected]         = useState(null);
  const [search, setSearch]             = useState('');
  const [tab, setTab]                   = useState(0);
  const [health, setHealth]             = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Fetch class + students
  useEffect(() => {
    if (isInitializing || !user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await get(ENDPOINTS.TEACHER.CONTACT_BOOK_STUDENTS(classId));
        setClassInfo(res.data.class);
        const list = res.data.students || [];
        setStudents(list);
        if (list.length > 0) setSelected(list[0]);
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách học sinh.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [classId, user, isInitializing]);

  // Fetch health when student changes
  const fetchHealth = useCallback(async (student) => {
    if (!student?._id) return;
    setHealthLoading(true);
    setHealth(null);
    try {
      const res = await get(ENDPOINTS.TEACHER.CONTACT_BOOK_HEALTH(classId, student._id));
      setHealth(res.data || null);
    } catch (_) {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (selected) {
      setTab(0);
      fetchHealth(selected);
    }
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const menuItems = useMemo(
    () => getTeacherMenuItems(isCommitteeMember, hasPermission),
    [isCommitteeMember, hasPermission]
  );

  const activeKey = useMemo(() => {
    const path = location.pathname || '';
    if (path.startsWith('/teacher/contact-book')) return 'contact-book';
    return 'classes';
  }, [location.pathname]);

  const handleMenuSelect = (key) => {
    const MAP = {
      classes: '/teacher',
      'contact-book': '/teacher/contact-book',
      attendance: '/teacher/attendance',
      'pickup-approval': '/teacher/pickup-approval',
      'purchase-request': '/teacher/purchase-request',
      'class-assets': '/teacher/class-assets',
      'asset-inspection': '/teacher/asset-inspection',
    };
    if (MAP[key]) navigate(MAP[key]);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s => s.fullName.toLowerCase().includes(q));
  }, [students, search]);

  const userName = user?.fullName || user?.username || 'Teacher';
  const initials = (n) => n ? n.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() : '?';

  const TABS = [
    { label: 'Điểm danh', icon: <CalendarIcon fontSize="small" /> },
    { label: 'Hồ sơ',     icon: <PersonIcon fontSize="small" /> },
    { label: 'Sức khỏe',  icon: <HealthIcon fontSize="small" /> },
    { label: 'Trao đổi',  icon: <ForumIcon fontSize="small" /> },
  ];

  return (
    <RoleLayout
      title="Sổ liên lạc điện tử"
      description={classInfo ? `${classInfo.className}${classInfo.gradeName ? ' · ' + classInfo.gradeName : ''}` : ''}
      menuItems={menuItems}
      activeKey={activeKey}
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* Back + header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <Box
          onClick={() => navigate('/teacher/contact-book')}
          sx={{
            display: 'flex', alignItems: 'center', gap: 0.5,
            cursor: 'pointer', color: 'text.secondary',
            '&:hover': { color: '#0891b2' }, transition: 'color 0.15s',
          }}
        >
          <BackIcon sx={{ fontSize: 20 }} />
          <Typography variant="body2" fontWeight={500}>Quay lại</Typography>
        </Box>
        <Typography color="text.disabled">·</Typography>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <ContactIcon sx={{ fontSize: 16, color: '#0891b2' }} />
          <Typography variant="body2" fontWeight={700} color="#0891b2">Sổ liên lạc điện tử</Typography>
          {classInfo && (
            <>
              <Typography color="text.disabled">·</Typography>
              <Typography variant="body2" color="text.secondary">{classInfo.className}</Typography>
            </>
          )}
        </Stack>
      </Stack>

      {loading ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rounded" height={480} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton variant="rounded" height={480} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>

          {/* ── Left: student list ── */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              {/* Search */}
              <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <TextField
                  size="small" fullWidth
                  placeholder="Tìm học sinh..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>,
                    sx: { borderRadius: 2, fontSize: 13 },
                  }}
                />
              </Box>

              {/* Count */}
              <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  {filtered.length} học sinh
                </Typography>
              </Box>

              <List disablePadding sx={{ maxHeight: 520, overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Không tìm thấy học sinh</Typography>
                  </Box>
                ) : (
                  filtered.map((s, idx) => (
                    <Box key={s._id}>
                      <ListItemButton
                        selected={selected?._id === s._id}
                        onClick={() => setSelected(s)}
                        sx={{
                          px: 2, py: 1.25,
                          '&.Mui-selected': {
                            bgcolor: '#e0f2fe',
                            '&:hover': { bgcolor: '#bae6fd' },
                          },
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 44 }}>
                          <Avatar src={s.avatar} sx={{ width: 36, height: 36, bgcolor: '#0891b2', fontSize: 13, fontWeight: 700 }}>
                            {initials(s.fullName)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={selected?._id === s._id ? 700 : 500} noWrap>
                              {s.fullName}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {calcAge(s.dateOfBirth)} · {genderLabel(s.gender)}
                            </Typography>
                          }
                        />
                        {s.needsSpecialAttention && (
                          <Chip label="!" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem', minWidth: 18 }} />
                        )}
                      </ListItemButton>
                      {idx < filtered.length - 1 && <Divider component="li" sx={{ ml: 7 }} />}
                    </Box>
                  ))
                )}
              </List>
            </Paper>
          </Grid>

          {/* ── Right: student detail ── */}
          <Grid size={{ xs: 12, md: 8 }}>
            {!selected ? (
              <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 6, textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                <Typography color="text.secondary">Chọn học sinh để xem sổ liên lạc</Typography>
              </Paper>
            ) : (
              <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                {/* Student header */}
                <Box sx={{
                  px: 3, py: 2.5,
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  borderBottom: '1px solid', borderColor: '#a7f3d0',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar
                      src={selected.avatar}
                      sx={{ width: 52, height: 52, bgcolor: '#0891b2', fontSize: 18, fontWeight: 700, border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                    >
                      {initials(selected.fullName)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>{selected.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {calcAge(selected.dateOfBirth)} · {genderLabel(selected.gender)}
                        {classInfo && ` · ${classInfo.className}`}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                    {selected.needsSpecialAttention && (
                      <Chip label="Cần chú ý" size="small" color="warning" sx={{ fontWeight: 700 }} />
                    )}
                    <Chip
                      label={selected.status === 'active' ? 'Đang học' : 'Nghỉ học'}
                      size="small"
                      color={selected.status === 'active' ? 'success' : 'default'}
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>
                </Box>

                {/* Tabs */}
                <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      px: 1,
                      '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13, minHeight: 44 },
                      '& .Mui-selected': { color: '#0891b2' },
                      '& .MuiTabs-indicator': { bgcolor: '#0891b2' },
                    }}
                  >
                    {TABS.map((t, i) => (
                      <Tab key={i} label={t.label} iconPosition="start" icon={t.icon} />
                    ))}
                  </Tabs>
                </Box>

                {/* Tab content */}
                <Box sx={{ p: 2.5 }}>
                  {tab === 0 && (
                    <TabDiemDanh classId={classId} studentId={selected._id} />
                  )}
                  {tab === 1 && (
                    <TabHoSo student={selected} health={health} healthLoading={healthLoading} />
                  )}
                  {tab === 2 && (
                    <TabSucKhoe health={health} healthLoading={healthLoading} />
                  )}
                  {tab === 3 && (
                    <TabPlaceholder
                      icon={<ForumIcon sx={{ fontSize: 44, color: 'grey.300' }} />}
                      label="Tính năng đang phát triển — trao đổi với phụ huynh"
                    />
                  )}
                </Box>
              </Paper>
            )}
          </Grid>

        </Grid>
      )}
    </RoleLayout>
  );
}
