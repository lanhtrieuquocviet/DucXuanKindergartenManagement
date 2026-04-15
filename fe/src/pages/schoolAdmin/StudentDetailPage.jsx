import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, del, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, Avatar, Chip, Skeleton, Alert, Stack,
  Divider, Tabs, Tab, Grid, TextField, CircularProgress,
  MenuItem, Select, LinearProgress, IconButton, Tooltip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Cake as CakeIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  MonitorHeart as HealthIcon,
  StickyNote2 as NoteIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  EventBusy as LeaveIcon,
  Restaurant as MenuIcon,
  EditNote as NoteTabIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

// ── helpers ─────────────────────────────────────────────────────
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
function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('vi-VN'); }
function genderLabel(g) { if (g === 'male') return 'Nam'; if (g === 'female') return 'Nữ'; return 'Khác'; }
function initials(n) { return n ? n.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() : '?'; }

// ── InfoRow ──────────────────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>{label}</Typography>
      <Stack direction="row" alignItems="center" spacing={0.75}>
        {icon && <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>}
        <Typography variant="body2" fontWeight={600}>{value || '—'}</Typography>
      </Stack>
    </Box>
  );
}

// ── TabHoSo ──────────────────────────────────────────────────────
function TabHoSo({ student }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
        <PersonIcon sx={{ fontSize: 18, color: '#e11d48' }} />
        <Typography variant="subtitle2" fontWeight={700}>Thông tin cơ bản</Typography>
      </Stack>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 6 }}><InfoRow label="Họ và tên" value={student.fullName} /></Grid>
        <Grid size={{ xs: 6 }}><InfoRow label="Ngày sinh" value={fmtDate(student.dateOfBirth)} icon={<CakeIcon sx={{ fontSize: 14 }} />} /></Grid>
        <Grid size={{ xs: 6 }}><InfoRow label="Giới tính" value={genderLabel(student.gender)} /></Grid>
        <Grid size={{ xs: 6 }}><InfoRow label="Lớp" value={student.classId?.className || '—'} /></Grid>
        <Grid size={{ xs: 12 }}><InfoRow label="Địa chỉ" value={student.address} icon={<HomeIcon sx={{ fontSize: 14 }} />} /></Grid>
        <Grid size={{ xs: 6 }}><InfoRow label="Phụ huynh" value={student.parentId?.fullName} icon={<PeopleIcon sx={{ fontSize: 14 }} />} /></Grid>
        <Grid size={{ xs: 6 }}><InfoRow label="SĐT" value={student.parentId?.phone || student.parentPhone} icon={<PhoneIcon sx={{ fontSize: 14 }} />} /></Grid>
        {student.parentId?.email && (
          <Grid size={{ xs: 12 }}><InfoRow label="Email phụ huynh" value={student.parentId.email} /></Grid>
        )}
        {student.specialNote && (
          <Grid size={{ xs: 12 }}><InfoRow label="Ghi chú đặc biệt" value={student.specialNote} icon={<NoteIcon sx={{ fontSize: 14 }} />} /></Grid>
        )}
      </Grid>
    </Paper>
  );
}

// ── TabSucKhoe ───────────────────────────────────────────────────
const STATUS_HEALTH = { healthy: { label: 'Bình thường', color: 'success' }, monitor: { label: 'Cần theo dõi', color: 'warning' }, concerning: { label: 'Đáng lo ngại', color: 'error' } };
function calcBMI(h, w) { if (!h || !w) return null; return +(w / ((h / 100) ** 2)).toFixed(1); }
function bmiLabel(bmi) {
  if (!bmi) return null;
  if (bmi < 14.5) return { label: 'Thiếu cân', color: 'info' };
  if (bmi < 18) return { label: 'Bình thường', color: 'success' };
  if (bmi < 25) return { label: 'Thừa cân', color: 'warning' };
  return { label: 'Béo phì', color: 'error' };
}

function TabSucKhoe({ studentId }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    get(ENDPOINTS.STUDENTS.ADMIN_HEALTH_LATEST(studentId))
      .then(res => setHealth(res.data || null))
      .catch(() => setHealth(null))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />;
  if (!health) return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}>
      <HealthIcon sx={{ fontSize: 44, color: 'grey.300', mb: 1 }} />
      <Typography color="text.secondary">Chưa có dữ liệu sức khỏe.</Typography>
    </Paper>
  );

  const bmi = calcBMI(health.height, health.weight);
  const bmiCfg = bmiLabel(bmi);
  const statusCfg = STATUS_HEALTH[health.generalStatus];

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
        <HealthIcon sx={{ fontSize: 18, color: '#0891b2' }} />
        <Typography variant="subtitle2" fontWeight={700}>Hồ sơ sức khỏe</Typography>
        <Chip label={fmtDate(health.checkDate)} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
        {statusCfg && <Chip label={statusCfg.label} size="small" color={statusCfg.color} sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />}
      </Stack>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" mb={2}>
        {health.height && <Box sx={{ bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 2, px: 2, py: 1, textAlign: 'center', minWidth: 80 }}><Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>Chiều cao</Typography><Typography variant="body1" fontWeight={800} color="#0891b2">{health.height}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>cm</Typography></Box>}
        {health.weight && <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2, px: 2, py: 1, textAlign: 'center', minWidth: 80 }}><Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>Cân nặng</Typography><Typography variant="body1" fontWeight={800} color="#16a34a">{health.weight}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>kg</Typography></Box>}
        {bmi && <Box sx={{ bgcolor: '#fefce8', border: '1px solid #fde68a', borderRadius: 2, px: 2, py: 1, textAlign: 'center', minWidth: 80 }}><Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>BMI</Typography><Typography variant="body1" fontWeight={800} color="#d97706">{bmi}</Typography>{bmiCfg && <Chip label={bmiCfg.label} size="small" color={bmiCfg.color} variant="outlined" sx={{ height: 16, fontSize: '0.62rem', mt: 0.25, '& .MuiChip-label': { px: 0.75 } }} />}</Box>}
        {health.temperature && <Box sx={{ bgcolor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 2, px: 2, py: 1, textAlign: 'center', minWidth: 80 }}><Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>Thân nhiệt</Typography><Typography variant="body1" fontWeight={800} color="#e11d48">{health.temperature}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>°C</Typography></Box>}
        {health.heartRate && <Box sx={{ bgcolor: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: 2, px: 2, py: 1, textAlign: 'center', minWidth: 80 }}><Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>Nhịp tim</Typography><Typography variant="body1" fontWeight={800} color="#9333ea">{health.heartRate}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>bpm</Typography></Box>}
      </Stack>
      <Grid container spacing={2}>
        {health.chronicDiseases?.length > 0 && <Grid size={{ xs: 12 }}><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Tiền sử bệnh</Typography><Stack direction="row" flexWrap="wrap" gap={0.75}>{health.chronicDiseases.map((d, i) => <Chip key={i} label={d} size="small" color="error" variant="outlined" />)}</Stack></Grid>}
        {health.allergies?.length > 0 && <Grid size={{ xs: 12 }}><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Dị ứng</Typography><Stack direction="row" flexWrap="wrap" gap={0.75}>{health.allergies.map((a, i) => <Chip key={i} label={a.allergen || a} size="small" color="warning" variant="outlined" />)}</Stack></Grid>}
        {health.notes && <Grid size={{ xs: 12 }}><InfoRow label="Ghi chú" value={health.notes} icon={<NoteIcon sx={{ fontSize: 14 }} />} /></Grid>}
      </Grid>
    </Paper>
  );
}

// ── TabThucDon ───────────────────────────────────────────────────
function TabThucDon() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  useEffect(() => {
    setLoading(true);
    get(ENDPOINTS.STUDENTS.ADMIN_TODAY_MENU)
      .then(res => { setData(res.data || null); setMessage(res.message || ''); })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const dateStr = today.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  if (loading) return <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />;
  if (!data) return <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}><MenuIcon sx={{ fontSize: 44, color: 'grey.300', mb: 1 }} /><Typography color="text.secondary" variant="body2">{message || 'Không có thực đơn hôm nay'}</Typography></Paper>;

  const hasMeals = data.lunchFoods?.length > 0 || data.afternoonFoods?.length > 0;
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}><MenuIcon sx={{ fontSize: 18, color: '#16a34a' }} /><Typography variant="subtitle2" fontWeight={700}>Thực đơn & Dinh dưỡng</Typography></Stack>
      <Typography variant="body2" fontWeight={700} color="text.primary" mb={1.5} sx={{ textTransform: 'capitalize' }}>{dateStr}</Typography>
      {!hasMeals ? (
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 3, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">Chưa có món ăn hôm nay</Typography></Paper>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 2, bgcolor: '#fefce8', border: '1px solid #fde68a', p: 2.5 }}>
          <Stack spacing={1.5}>
            {data.lunchFoods?.length > 0 && <Box><Typography variant="caption" fontWeight={700} color="#92400e" sx={{ display: 'block', mb: 0.5 }}>🍱 Bữa trưa</Typography><Typography variant="body2">{data.lunchFoods.map(f => f.name).join(', ')}</Typography></Box>}
            {data.lunchFoods?.length > 0 && data.afternoonFoods?.length > 0 && <Divider sx={{ borderStyle: 'dashed' }} />}
            {data.afternoonFoods?.length > 0 && <Box><Typography variant="caption" fontWeight={700} color="#92400e" sx={{ display: 'block', mb: 0.5 }}>🍎 Bữa chiều</Typography><Typography variant="body2">{data.afternoonFoods.map(f => f.name).join(', ')}</Typography></Box>}
          </Stack>
        </Paper>
      )}
      {(data.totalCalories > 0 || data.totalProtein > 0) && (
        <Box mt={2}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 1 }}>Chỉ số dinh dưỡng</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {[{ label: 'Calories', val: data.totalCalories, unit: 'kcal', color: '#f97316' }, { label: 'Protein', val: data.totalProtein, unit: 'g', color: '#6366f1' }, { label: 'Chất béo', val: data.totalFat, unit: 'g', color: '#eab308' }, { label: 'Tinh bột', val: data.totalCarb, unit: 'g', color: '#22c55e' }].filter(n => n.val > 0).map(n => (
              <Box key={n.label} sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5, px: 1.5, py: 0.75, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>{n.label}</Typography>
                <Typography variant="body2" fontWeight={700} color={n.color}>{Math.round(n.val)}{n.unit}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>Tuần {data.weekType === 'odd' ? 'lẻ' : 'chẵn'} · Tuần {data.weekNum} của năm</Typography>
    </Box>
  );
}

// ── TabDiemDanh ──────────────────────────────────────────────────
function TabDiemDanh({ studentId }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    get(`${ENDPOINTS.STUDENTS.ADMIN_ATTENDANCE_MONTHLY(studentId)}?year=${year}&month=${month}`)
      .then(res => setData(res.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [studentId, year, month]);

  const STATUS_CONFIG = {
    present: { label: 'Có mặt', color: '#16a34a', bg: '#dcfce7', icon: <PresentIcon sx={{ fontSize: 14 }} /> },
    absent:  { label: 'Vắng',   color: '#dc2626', bg: '#fee2e2', icon: <AbsentIcon  sx={{ fontSize: 14 }} /> },
    leave:   { label: 'Nghỉ phép', color: '#d97706', bg: '#fef3c7', icon: <LeaveIcon sx={{ fontSize: 14 }} /> },
  };
  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
  const YEARS = [now.getFullYear() - 1, now.getFullYear()];

  return (
    <Box>
      <Stack direction="row" spacing={1.5} mb={2} alignItems="center">
        <CalendarIcon sx={{ fontSize: 18, color: '#0891b2' }} />
        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>Lịch sử điểm danh</Typography>
        <Select size="small" value={month} onChange={e => setMonth(e.target.value)} sx={{ minWidth: 110, fontSize: 13, borderRadius: 2 }}>
          {MONTHS.map(m => <MenuItem key={m} value={m} sx={{ fontSize: 13 }}>Tháng {m}</MenuItem>)}
        </Select>
        <Select size="small" value={year} onChange={e => setYear(e.target.value)} sx={{ minWidth: 80, fontSize: 13, borderRadius: 2 }}>
          {YEARS.map(y => <MenuItem key={y} value={y} sx={{ fontSize: 13 }}>{y}</MenuItem>)}
        </Select>
      </Stack>
      {loading ? (
        <Box>{[1,2,3].map(i => <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: 2, mb: 1 }} />)}</Box>
      ) : !data || data.records.length === 0 ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}>
          <CalendarIcon sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
          <Typography color="text.secondary" variant="body2">Không có dữ liệu điểm danh tháng {month}/{year}</Typography>
        </Paper>
      ) : (
        <>
          <Paper elevation={0} sx={{ borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', p: 2, mb: 2 }}>
            <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Typography variant="caption" color="text.secondary">Tỷ lệ đi học tháng {month}</Typography>
                <Stack direction="row" alignItems="baseline" spacing={0.5}>
                  <Typography variant="h5" fontWeight={800} color="#16a34a">{data.rate ?? '—'}%</Typography>
                  <Typography variant="caption" color="text.secondary">({data.present}/{data.total} ngày)</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={data.rate ?? 0} sx={{ mt: 0.75, height: 6, borderRadius: 3, bgcolor: '#dcfce7', '& .MuiLinearProgress-bar': { bgcolor: '#16a34a', borderRadius: 3 } }} />
              </Box>
              <Stack direction="row" spacing={2}>
                {[{ key: 'present', label: 'Có mặt', val: data.present }, { key: 'absent', label: 'Vắng', val: data.absent }, { key: 'leave', label: 'Phép', val: data.leave }].map(s => (
                  <Box key={s.key} sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={700} color={STATUS_CONFIG[s.key].color}>{s.val}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Paper>
          <Stack spacing={0.5}>
            {data.records.map((r, idx) => {
              const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.present;
              const dateLabel = new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
              return (
                <Box key={r._id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', py: 1.25, px: 0.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{dateLabel}</Typography>
                      <Typography variant="caption" color={cfg.color}>{cfg.label}{r.timeString?.checkIn ? ` · ${r.timeString.checkIn}` : ''}{r.absentReason ? ` · ${r.absentReason}` : ''}</Typography>
                    </Box>
                    <Chip label={cfg.label} size="small" icon={cfg.icon} sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${cfg.bg}`, '& .MuiChip-icon': { color: cfg.color } }} />
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

// ── TabGhiChu ────────────────────────────────────────────────────
function TabGhiChu({ studentId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  const fetchNotes = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await get(ENDPOINTS.STUDENTS.ADMIN_NOTES(studentId));
      setNotes(res.data || []);
    } catch { setNotes([]); } finally { setLoading(false); }
  }, [studentId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleDelete = async (noteId) => {
    try {
      await del(ENDPOINTS.STUDENTS.ADMIN_NOTE_DELETE(studentId, noteId));
      setNotes(prev => prev.filter(n => n._id !== noteId));
      toast.success('Đã xoá ghi chú');
    } catch (err) { toast.error(err.message || 'Xoá thất bại'); }
  };

  return (
    <Box>
      {loading ? (
        <Stack spacing={1.5}>{[1,2].map(i => <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 3 }} />)}</Stack>
      ) : notes.length === 0 ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}>
          <NoteTabIcon sx={{ fontSize: 44, color: 'grey.300', mb: 1 }} />
          <Typography color="text.secondary" variant="body2">Chưa có ghi chú nào từ giáo viên.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {notes.map(note => (
            <Paper key={note._id} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2.5 }}>
              <Stack direction="row" alignItems="center" mb={1}>
                <Chip label={new Date(note.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#f3f4f6', color: 'text.secondary', fontWeight: 600 }} />
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Xoá ghi chú">
                  <IconButton size="small" onClick={() => handleDelete(note._id)} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' }, p: 0.5, borderRadius: 1 }}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{note.content}</Typography>
              {note.images?.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={1} mt={1.5}>
                  {note.images.map((url, i) => (
                    <Box key={i} component="img" src={url} alt="" sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2, border: '1px solid #e2e8f0', cursor: 'pointer', '&:hover': { opacity: 0.85 } }} onClick={() => setLightbox(url)} />
                  ))}
                </Stack>
              )}
            </Paper>
          ))}
        </Stack>
      )}
      {lightbox && (
        <Box onClick={() => setLightbox(null)} sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <Box component="img" src={lightbox} alt="" sx={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 2, boxShadow: 8 }} />
        </Box>
      )}
    </Box>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function StudentDetailPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user, hasRole, logout, isInitializing } = useAuth();
  const menuItems = useSchoolAdminMenu();
  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (isInitializing || !user) return;
    if (!hasRole('SchoolAdmin') && !hasRole('SystemAdmin')) { navigate('/', { replace: true }); return; }
    setLoading(true);
    setError('');
    get(ENDPOINTS.STUDENTS.DETAIL(studentId))
      .then(res => {
        const s = res.data || null;
        setStudent(s);
        if (!s) setError('Không tìm thấy học sinh');
      })
      .catch(err => setError(err.message || 'Lỗi tải dữ liệu'))
      .finally(() => setLoading(false));
  }, [studentId, user, isInitializing]); // eslint-disable-line

  const TABS = [
    { label: 'Hồ sơ', icon: <PersonIcon fontSize="small" /> },
    { label: 'Sức khỏe', icon: <HealthIcon fontSize="small" /> },
    { label: 'Điểm danh', icon: <CalendarIcon fontSize="small" /> },
    { label: 'Thực đơn', icon: <MenuIcon fontSize="small" /> },
    { label: 'Ghi chú GV', icon: <NoteTabIcon fontSize="small" /> },
  ];

  return (
    <RoleLayout
      title={student ? `Sổ liên lạc - ${student.fullName}` : 'Sổ liên lạc học sinh'}
      description="Chi tiết thông tin, sức khỏe và điểm danh học sinh."
      menuItems={menuItems}
      activeKey="students"
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
      userName={user?.fullName || user?.username || 'Admin'}
      userAvatar={user?.avatar}
    >
      {/* Back */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Box onClick={() => navigate('/school-admin/students')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', color: 'text.secondary', '&:hover': { color: '#6366f1' }, transition: 'color 0.15s' }}>
          <BackIcon sx={{ fontSize: 20 }} />
          <Typography variant="body2" fontWeight={500}>Quay lại danh sách</Typography>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
        </Stack>
      ) : student ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', borderBottom: '1px solid', borderColor: '#c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar src={student.avatar} sx={{ width: 56, height: 56, bgcolor: '#6366f1', fontSize: 20, fontWeight: 700, border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                {initials(student.fullName)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>{student.fullName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {calcAge(student.dateOfBirth)} · {genderLabel(student.gender)}
                  {student.classId?.className ? ` · ${student.classId.className}` : ''}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
              {student.needsSpecialAttention && <Chip label="Cần chú ý" size="small" color="warning" sx={{ fontWeight: 700 }} />}
              <Chip label={student.status === 'active' ? 'Đang học' : 'Nghỉ học'} size="small" color={student.status === 'active' ? 'success' : 'default'} sx={{ fontWeight: 600 }} />
            </Stack>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ px: 1, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13, minHeight: 44 }, '& .Mui-selected': { color: '#6366f1' }, '& .MuiTabs-indicator': { bgcolor: '#6366f1' } }}>
              {TABS.map((t, i) => <Tab key={i} label={t.label} iconPosition="start" icon={t.icon} />)}
            </Tabs>
          </Box>

          {/* Tab content */}
          <Box sx={{ p: 2.5 }}>
            {tab === 0 && <TabHoSo student={student} />}
            {tab === 1 && <TabSucKhoe studentId={studentId} />}
            {tab === 2 && <TabDiemDanh studentId={studentId} />}
            {tab === 3 && <TabThucDon />}
            {tab === 4 && <TabGhiChu studentId={studentId} />}
          </Box>
        </Paper>
      ) : null}
    </RoleLayout>
  );
}
