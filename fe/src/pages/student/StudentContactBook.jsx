import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';
import {
  Box, Paper, Typography, Avatar, Chip, Skeleton, Alert, Stack,
  Tabs, Tab, Grid, Select, MenuItem, Divider, LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
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
  MenuBook as ContactIcon,
  School as SchoolIcon,
  HealthAndSafety as SafetyIcon,
  EditNote as NoteTabIcon,
} from '@mui/icons-material';

const PRIMARY = '#059669';

/* ── helpers ─────────────────────────────────────────────── */
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '—'; }
function genderLabel(g) { return g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'; }
function calcAge(dob) {
  if (!dob) return null;
  const b = new Date(dob), now = new Date();
  let y = now.getFullYear() - b.getFullYear();
  if (now.getMonth() - b.getMonth() < 0 || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) y--;
  return y > 0 ? `${y} tuổi` : null;
}
function calcBMI(h, w) { return (h && w) ? +(w / ((h / 100) ** 2)).toFixed(1) : null; }
function bmiLabel(bmi) {
  if (!bmi) return null;
  if (bmi < 14.5) return { label: 'Thiếu cân', color: 'info' };
  if (bmi < 18)   return { label: 'Bình thường', color: 'success' };
  if (bmi < 25)   return { label: 'Thừa cân', color: 'warning' };
  return           { label: 'Béo phì', color: 'error' };
}
const STATUS_HEALTH = { healthy: { label: 'Bình thường', color: 'success' }, monitor: { label: 'Cần theo dõi', color: 'warning' }, concerning: { label: 'Đáng lo ngại', color: 'error' } };
const ATTENDANCE_CFG = {
  present: { label: 'Có mặt', color: '#16a34a', bg: '#dcfce7', icon: <PresentIcon sx={{ fontSize: 14 }} /> },
  absent:  { label: 'Vắng',   color: '#dc2626', bg: '#fee2e2', icon: <AbsentIcon  sx={{ fontSize: 14 }} /> },
  leave:   { label: 'Nghỉ phép', color: '#d97706', bg: '#fef3c7', icon: <LeaveIcon sx={{ fontSize: 14 }} /> },
};

function InfoRow({ label, value, icon }) {
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

/* ── Tab: Hồ sơ ──────────────────────────────────────────── */
function TabHoSo({ student }) {
  if (!student) return <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />;
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
        <Grid size={{ xs: 6 }}><InfoRow label="Lớp" value={student.classId?.className} icon={<SchoolIcon sx={{ fontSize: 14 }} />} /></Grid>
        <Grid size={{ xs: 12 }}><InfoRow label="Địa chỉ" value={student.address} icon={<HomeIcon sx={{ fontSize: 14 }} />} /></Grid>
        <Grid size={{ xs: 6 }}><InfoRow label="Phụ huynh" value={student.parentId?.fullName} icon={<PeopleIcon sx={{ fontSize: 14 }} />} /></Grid>
        <Grid size={{ xs: 6 }}><InfoRow label="SĐT" value={student.parentId?.phone || student.parentPhone || student.phone} icon={<PhoneIcon sx={{ fontSize: 14 }} />} /></Grid>
        {student.specialNote && (
          <Grid size={{ xs: 12 }}><InfoRow label="Ghi chú đặc biệt" value={student.specialNote} icon={<NoteIcon sx={{ fontSize: 14 }} />} /></Grid>
        )}
      </Grid>
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary" fontStyle="italic">Chỉ Ban Giám hiệu mới có quyền chỉnh sửa thông tin học sinh</Typography>
      </Box>
    </Paper>
  );
}

/* ── Tab: Sức khỏe ───────────────────────────────────────── */
function TabSucKhoe({ health, loading }) {
  if (loading) return <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} />;
  if (!health) return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}>
      <SafetyIcon sx={{ fontSize: 44, color: 'grey.300', mb: 1 }} />
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
        {health.height && (
          <Box sx={{ bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 2, px: 2, py: 1, textAlign: 'center', minWidth: 80 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>Chiều cao</Typography>
            <Typography variant="body1" fontWeight={800} color="#0891b2">{health.height}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>cm</Typography>
          </Box>
        )}
        {health.weight && (
          <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2, px: 2, py: 1, textAlign: 'center', minWidth: 80 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>Cân nặng</Typography>
            <Typography variant="body1" fontWeight={800} color="#16a34a">{health.weight}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>kg</Typography>
          </Box>
        )}
        {bmi && (
          <Box sx={{ bgcolor: '#fefce8', border: '1px solid #fde68a', borderRadius: 2, px: 2, py: 1, textAlign: 'center', minWidth: 80 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>BMI</Typography>
            <Typography variant="body1" fontWeight={800} color="#d97706">{bmi}</Typography>
            {bmiCfg && <Chip label={bmiCfg.label} size="small" color={bmiCfg.color} variant="outlined" sx={{ height: 16, fontSize: '0.62rem', mt: 0.25, '& .MuiChip-label': { px: 0.75 } }} />}
          </Box>
        )}
        {health.temperature && (
          <Box sx={{ bgcolor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 2, px: 2, py: 1, textAlign: 'center', minWidth: 80 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>Thân nhiệt</Typography>
            <Typography variant="body1" fontWeight={800} color="#e11d48">{health.temperature}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>°C</Typography>
          </Box>
        )}
      </Stack>
      <Grid container spacing={2}>
        {health.chronicDiseases?.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Tiền sử bệnh</Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {health.chronicDiseases.map((d, i) => <Chip key={i} label={d} size="small" color="error" variant="outlined" />)}
            </Stack>
          </Grid>
        )}
        {health.allergies?.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Dị ứng</Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {health.allergies.map((a, i) => <Chip key={i} label={a.allergen || a} size="small" color="warning" variant="outlined" />)}
            </Stack>
          </Grid>
        )}
        {health.notes && (
          <Grid size={{ xs: 12 }}><InfoRow label="Ghi chú" value={health.notes} icon={<NoteIcon sx={{ fontSize: 14 }} />} /></Grid>
        )}
      </Grid>
    </Paper>
  );
}

/* ── Tab: Điểm danh ──────────────────────────────────────── */
function TabDiemDanh({ studentId }) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (y, m) => {
    setLoading(true);
    try {
      const q = studentId ? `&studentId=${studentId}` : '';
      const res = await get(`${ENDPOINTS.STUDENTS.CONTACT_BOOK_ATTENDANCE}?year=${y}&month=${m}${q}`);
      setData(res.data || null);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [studentId]);

  useEffect(() => { fetch(year, month); }, [year, month, fetch]);

  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
  const YEARS  = [now.getFullYear() - 1, now.getFullYear()];

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
        <Stack spacing={1}>{[1,2,3].map(i => <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: 2 }} />)}</Stack>
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
                <LinearProgress variant="determinate" value={data.rate ?? 0}
                  sx={{ mt: 0.75, height: 6, borderRadius: 3, bgcolor: '#dcfce7', '& .MuiLinearProgress-bar': { bgcolor: '#16a34a', borderRadius: 3 } }} />
              </Box>
              <Stack direction="row" spacing={2}>
                {[{ key: 'present', label: 'Có mặt', val: data.present }, { key: 'absent', label: 'Vắng', val: data.absent }, { key: 'leave', label: 'Phép', val: data.leave }].map(s => (
                  <Box key={s.key} sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={700} color={ATTENDANCE_CFG[s.key].color}>{s.val}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Paper>
          <Stack spacing={0.5}>
            {data.records.map((r, idx) => {
              const cfg = ATTENDANCE_CFG[r.status] || ATTENDANCE_CFG.present;
              return (
                <Box key={r._id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', py: 1.25, px: 0.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</Typography>
                      <Typography variant="caption" color={cfg.color}>
                        {cfg.label}{r.timeString?.checkIn ? ` · ${r.timeString.checkIn}` : ''}{r.absentReason ? ` · ${r.absentReason}` : ''}
                      </Typography>
                    </Box>
                    <Chip label={cfg.label} size="small" icon={cfg.icon}
                      sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${cfg.bg}`, '& .MuiChip-icon': { color: cfg.color } }} />
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

/* ── Tab: Thực đơn ───────────────────────────────────────── */
function TabThucDon() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    get(ENDPOINTS.TEACHER.CONTACT_BOOK_TODAY_MENU)
      .then(res => { setData(res.data || null); setMessage(res.message || ''); })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const dateStr = today.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  if (loading) return <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />;
  if (!data) return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}>
      <MenuIcon sx={{ fontSize: 44, color: 'grey.300', mb: 1 }} />
      <Typography color="text.secondary" variant="body2">{message || 'Không có thực đơn cho hôm nay'}</Typography>
    </Paper>
  );
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <MenuIcon sx={{ fontSize: 18, color: '#16a34a' }} />
        <Typography variant="subtitle2" fontWeight={700}>Thực đơn & Dinh dưỡng</Typography>
      </Stack>
      <Typography variant="body2" fontWeight={700} mb={1.5} sx={{ textTransform: 'capitalize' }}>{dateStr}</Typography>
      {(data.lunchFoods?.length > 0 || data.afternoonFoods?.length > 0) && (
        <Paper elevation={0} sx={{ borderRadius: 2, bgcolor: '#fefce8', border: '1px solid #fde68a', p: 2.5, mb: 2 }}>
          <Stack spacing={1.5}>
            {data.lunchFoods?.length > 0 && (
              <Box>
                <Typography variant="caption" fontWeight={700} color="#92400e" sx={{ display: 'block', mb: 0.5 }}>🍱 Bữa trưa</Typography>
                <Typography variant="body2">{data.lunchFoods.map(f => f.name).join(', ')}</Typography>
              </Box>
            )}
            {data.lunchFoods?.length > 0 && data.afternoonFoods?.length > 0 && <Divider sx={{ borderStyle: 'dashed' }} />}
            {data.afternoonFoods?.length > 0 && (
              <Box>
                <Typography variant="caption" fontWeight={700} color="#92400e" sx={{ display: 'block', mb: 0.5 }}>🍎 Bữa chiều</Typography>
                <Typography variant="body2">{data.afternoonFoods.map(f => f.name).join(', ')}</Typography>
              </Box>
            )}
          </Stack>
        </Paper>
      )}
      {(data.totalCalories > 0 || data.totalProtein > 0) && (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {[{ label: 'Calories', val: data.totalCalories, unit: 'kcal', color: '#f97316' }, { label: 'Protein', val: data.totalProtein, unit: 'g', color: '#6366f1' }, { label: 'Chất béo', val: data.totalFat, unit: 'g', color: '#eab308' }, { label: 'Tinh bột', val: data.totalCarb, unit: 'g', color: '#22c55e' }]
            .filter(n => n.val > 0).map(n => (
              <Box key={n.label} sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5, px: 1.5, py: 0.75, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>{n.label}</Typography>
                <Typography variant="body2" fontWeight={700} color={n.color}>{Math.round(n.val)}{n.unit}</Typography>
              </Box>
            ))}
        </Stack>
      )}
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
        Tuần {data.weekType === 'odd' ? 'lẻ' : 'chẵn'} · Tuần {data.weekNum} của năm
      </Typography>
    </Box>
  );
}

/* ── Tab: Ghi chú giáo viên ──────────────────────────────── */
function TabGhiChu({ studentId }) {
  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    setLoading(true);
    const q = studentId ? `?studentId=${studentId}` : '';
    get(`${ENDPOINTS.STUDENTS.CONTACT_BOOK_NOTES}${q}`)
      .then(res => setNotes(res.data || []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <Stack spacing={1.5}>{[1,2].map(i => <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 3 }} />)}</Stack>;
  if (notes.length === 0) return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}>
      <NoteTabIcon sx={{ fontSize: 44, color: 'grey.300', mb: 1 }} />
      <Typography color="text.secondary" variant="body2">Giáo viên chưa có ghi chú nào.</Typography>
    </Paper>
  );
  return (
    <Box>
      <Stack spacing={1.5}>
        {notes.map(note => (
          <Paper key={note._id} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2.5 }}>
            <Chip
              label={new Date(note.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#f3f4f6', color: 'text.secondary', fontWeight: 600, mb: 1 }}
            />
            <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{note.content}</Typography>
            {note.images?.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1} mt={1.5}>
                {note.images.map((url, i) => (
                  <Box key={i} component="img" src={url} alt="" onClick={() => setLightbox(url)}
                    sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2, border: '1px solid #e2e8f0', cursor: 'pointer', '&:hover': { opacity: 0.85 } }} />
                ))}
              </Stack>
            )}
          </Paper>
        ))}
      </Stack>
      {lightbox && (
        <Box onClick={() => setLightbox(null)} sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <Box component="img" src={lightbox} alt="" sx={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 2, boxShadow: 8 }} />
        </Box>
      )}
    </Box>
  );
}

/* ── Main ─────────────────────────────────────────────────── */
const TABS = [
  { label: 'Hồ sơ',     icon: <PersonIcon fontSize="small" /> },
  { label: 'Sức khỏe',  icon: <HealthIcon fontSize="small" /> },
  { label: 'Điểm danh', icon: <CalendarIcon fontSize="small" /> },
  { label: 'Thực đơn',  icon: <MenuIcon fontSize="small" /> },
  { label: 'Ghi chú GV', icon: <NoteTabIcon fontSize="small" /> },
];

export default function StudentContactBook() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isInitializing } = useAuth();

  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(() => searchParams.get('studentId') || '');
  const [student, setStudent]   = useState(null);
  const [health, setHealth]     = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [error, setError]       = useState('');
  const [tab, setTab]           = useState(0);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    get(ENDPOINTS.AUTH.MY_CHILDREN)
      .then(res => {
        const list = res.data || [];
        setChildren(list);
        setSelectedChildId(prev => {
          if (prev && list.some(c => c._id === prev)) return prev;
          return list[0]?._id || '';
        });
      })
      .catch(() => {});
  }, [isInitializing, user, navigate]);

  useEffect(() => {
    if (!selectedChildId) return;
    setLoadingInfo(true);
    setLoadingHealth(true);
    setStudent(null);
    setHealth(null);
    setError('');
    const q = `?studentId=${selectedChildId}`;
    Promise.all([
      get(`${ENDPOINTS.STUDENTS.CONTACT_BOOK_MY}${q}`).then(res => setStudent(res.data)).catch(() => setError('Không tìm thấy thông tin học sinh.')).finally(() => setLoadingInfo(false)),
      get(`${ENDPOINTS.STUDENTS.CONTACT_BOOK_HEALTH}${q}`).then(res => setHealth(res.data)).catch(() => setHealth(null)).finally(() => setLoadingHealth(false)),
    ]);
  }, [selectedChildId]);

  const studentName = student?.fullName || 'Học sinh';
  const className   = student?.classId?.className || 'Chưa xếp lớp';
  const age         = calcAge(student?.dateOfBirth);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #047857 100%)`, px: 2, pt: 2.5, pb: 3, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(5,150,105,0.3)' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box onClick={() => navigate('/student')} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', '&:hover': { color: 'white' } }}>
            <BackIcon sx={{ fontSize: 22 }} />
          </Box>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
            <ContactIcon sx={{ fontSize: 20, color: 'white' }} />
          </Avatar>
          <Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }}>Sổ liên lạc điện tử</Typography>
            <Typography sx={{ color: 'white', fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.2 }}>
              {loadingInfo ? '...' : studentName}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 680, mx: 'auto', px: 2, pb: 4 }}>
        {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}

        {/* Student info card */}
        <Paper elevation={0} sx={{ mt: -1.5, mb: 2, p: 2, borderRadius: 3, border: '1px solid', borderColor: '#bbf7d0', bgcolor: 'white' }}>
          {loadingInfo ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <Skeleton variant="circular" width={52} height={52} />
              <Box flex={1}><Skeleton variant="text" width="60%" /><Skeleton variant="text" width="40%" /></Box>
            </Stack>
          ) : student ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar src={student.avatar || undefined} sx={{ width: 52, height: 52, bgcolor: '#d1fae5', color: PRIMARY, fontSize: '1.3rem', fontWeight: 700, flexShrink: 0 }}>
                {studentName.charAt(0)}
              </Avatar>
              <Box flex={1} minWidth={0}>
                <Typography fontWeight={800} fontSize="1rem" color="#111827" noWrap>{studentName}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" mt={0.25}>
                  <SchoolIcon sx={{ fontSize: 13, color: '#6b7280' }} />
                  <Typography fontSize="0.8rem" color="text.secondary">{className}</Typography>
                  {age && <><Typography fontSize="0.8rem" color="text.disabled">·</Typography><Typography fontSize="0.8rem" color="text.secondary">{age}</Typography></>}
                </Stack>
              </Box>
              <Chip label="Chỉ xem" size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 20, color: 'text.secondary', borderColor: 'divider' }} />
            </Stack>
          ) : null}
        </Paper>

        {children.length > 1 && (
          <Paper elevation={0} sx={{ mb: 2, p: 1.5, borderRadius: 3, border: '1px solid #bbf7d0' }}>
            <Typography fontWeight={700} fontSize="0.82rem" mb={1}>Chọn bé</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.75}>
              {children.map(child => (
                <Chip
                  key={child._id}
                  label={child.fullName}
                  onClick={() => { setSelectedChildId(child._id); setTab(0); }}
                  variant={selectedChildId === child._id ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: 700,
                    bgcolor: selectedChildId === child._id ? PRIMARY : 'transparent',
                    color: selectedChildId === child._id ? 'white' : '#374151',
                    borderColor: PRIMARY,
                    '&:hover': { bgcolor: selectedChildId === child._id ? PRIMARY : '#ecfdf5' },
                  }}
                />
              ))}
            </Stack>
          </Paper>
        )}

        {/* Tabs */}
        <Paper elevation={0} sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Tabs
            value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
            sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 12, minHeight: 44, minWidth: 80 }, '& .Mui-selected': { color: PRIMARY }, '& .MuiTabs-indicator': { bgcolor: PRIMARY } }}
          >
            {TABS.map((t, i) => <Tab key={i} icon={t.icon} iconPosition="start" label={t.label} />)}
          </Tabs>
        </Paper>

        {/* Tab content */}
        <Box>
          {tab === 0 && <TabHoSo student={student} />}
          {tab === 1 && <TabSucKhoe health={health} loading={loadingHealth} />}
          {tab === 2 && <TabDiemDanh studentId={selectedChildId} />}
          {tab === 3 && <TabThucDon />}
          {tab === 4 && <TabGhiChu studentId={selectedChildId} />}
        </Box>
      </Box>
    </Box>
  );
}
