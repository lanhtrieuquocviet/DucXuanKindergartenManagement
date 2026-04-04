import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';
import {
  Box, Paper, Typography, Avatar, Stack, Chip, IconButton,
  CircularProgress, Alert, Divider, Grid, Collapse, Select,
  MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  ArrowBack, School, ExpandMore, ExpandLess, CheckCircle,
  Cancel, AccessTime, CalendarMonth, Login as LoginIcon, Logout as LogoutIcon, Image as ImageIcon,
} from '@mui/icons-material';

const PRIMARY = '#059669';
const PRIMARY_DARK = '#047857';
const BG = '#f0fdf4';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

const formatTime = (t) => {
  if (!t) return '—';
  if (/^\d{2}:\d{2}$/.test(t)) return t;
  try { const d = new Date(t); return isNaN(d) ? '—' : `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
  catch { return '—'; }
};

const isLate = (t) => {
  if (!t) return false;
  try {
    let h, m;
    if (typeof t === 'string' && /^\d{2}:\d{2}$/.test(t)) { [h, m] = t.split(':').map(Number); }
    else { const d = new Date(t); if (isNaN(d)) return false; h = d.getHours(); m = d.getMinutes(); }
    return h > 7 || (h === 7 && m > 30);
  } catch { return false; }
};

const getStatus = (att) => {
  if (!att || att.status === 'absent') return { label: 'Nghỉ học', color: 'error' };
  if (att.status === 'present') {
    const t = att?.timeString?.checkIn || att?.time?.checkIn;
    if (isLate(t)) return { label: 'Đi trễ', color: 'warning' };
    return { label: 'Có mặt', color: 'success' };
  }
  return { label: '—', color: 'default' };
};

const toYmd = (y, m, d) => `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

function StatCard({ icon, label, value, color, bg, border }) {
  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: border, bgcolor: bg }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography fontSize="0.72rem" fontWeight={700} color={color} textTransform="uppercase" letterSpacing="0.05em">{label}</Typography>
          <Typography fontSize="2rem" fontWeight={800} color={color} lineHeight={1.1} mt={0.5}>{value}</Typography>
        </Box>
        <Avatar sx={{ bgcolor: `${color}20`, color, width: 36, height: 36 }}>{icon}</Avatar>
      </Stack>
    </Paper>
  );
}

export default function AttendanceReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isInitializing } = useAuth();

  const initial = useMemo(() => {
    const d = searchParams.get('date') ? new Date(searchParams.get('date')) : new Date();
    return { month: d.getMonth()+1, year: d.getFullYear() };
  }, []);

  const [children, setChildren] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(initial.month);
  const [selectedYear, setSelectedYear] = useState(initial.year);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const roles = user?.roles?.map(r => r.roleName || r) || [];
    if (!roles.includes('Parent') && !roles.includes('Student') && !roles.includes('StudentParent')) {
      navigate('/', { replace: true }); return;
    }
    (async () => {
      try {
        setError(''); setLoading(true);
        const childRes = await get(ENDPOINTS.AUTH.MY_CHILDREN);
        const list = childRes.data || [];
        setChildren(list);
        const student = list[0];
        if (!student?._id) { setError('Chưa có thông tin trẻ để xem báo cáo.'); setAttendances([]); return; }
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        const endpoint = `${ENDPOINTS.STUDENTS.ATTENDANCE_LIST}?studentId=${student._id}&from=${toYmd(selectedYear, selectedMonth, 1)}&to=${toYmd(selectedYear, selectedMonth, lastDay)}${student?.classId?._id || student?.classId ? `&classId=${student?.classId?._id || student?.classId}` : ''}`;
        const res = await get(endpoint);
        setAttendances(res.data || []);
      } catch { setError('Không tải được báo cáo điểm danh.'); setAttendances([]); }
      finally { setLoading(false); }
    })();
  }, [navigate, user, isInitializing, selectedMonth, selectedYear]);

  const student = children[0] || null;
  const studentName = student?.fullName || '—';
  const className = student?.classId?.className || 'Chưa xếp lớp';

  const stats = useMemo(() => ({
    total: attendances.length,
    present: attendances.filter(a => a.status === 'present').length,
    absent: attendances.filter(a => a.status === 'absent').length,
    late: attendances.filter(a => a.status === 'present' && isLate(a?.timeString?.checkIn || a?.time?.checkIn)).length,
  }), [attendances]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: BG }}>
      {/* AppBar */}
      <Box sx={{
        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
        px: 2, py: 2, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(5,150,105,0.3)',
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton onClick={() => navigate('/student')} size="small"
            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography color="white" fontWeight={700} fontSize="1rem">Báo cáo điểm danh</Typography>
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 2.5, pb: 4 }}>
        {/* Student */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #bbf7d0', mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: '#d1fae5', color: PRIMARY, width: 40, height: 40, fontWeight: 700 }}>
              {studentName.charAt(0)}
            </Avatar>
            <Box>
              <Typography fontWeight={700} fontSize="0.95rem">{studentName}</Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <School sx={{ fontSize: 13, color: '#6b7280' }} />
                <Typography fontSize="0.78rem" color="text.secondary">{className}</Typography>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* Filters */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e5e7eb', mb: 2 }}>
          <Typography fontSize="0.75rem" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing="0.05em" mb={1.5}>
            Lọc theo thời gian
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>Tháng</InputLabel>
              <Select value={selectedMonth} label="Tháng" onChange={e => setSelectedMonth(Number(e.target.value))}
                sx={{ borderRadius: 2 }}>
                {Array.from({length:12},(_,i)=>i+1).map(m => (
                  <MenuItem key={m} value={m}>Tháng {String(m).padStart(2,'0')}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Năm</InputLabel>
              <Select value={selectedYear} label="Năm" onChange={e => setSelectedYear(Number(e.target.value))}
                sx={{ borderRadius: 2 }}>
                {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* Stats */}
        <Grid container spacing={1.5} mb={2}>
          <Grid item xs={6}><StatCard icon={<CalendarMonth fontSize="small"/>} label="Ngày học" value={stats.total} color="#374151" bg="white" border="#e5e7eb"/></Grid>
          <Grid item xs={6}><StatCard icon={<CheckCircle fontSize="small"/>} label="Có mặt" value={stats.present} color={PRIMARY} bg="#f0fdf4" border="#bbf7d0"/></Grid>
          <Grid item xs={6}><StatCard icon={<Cancel fontSize="small"/>} label="Nghỉ học" value={stats.absent} color="#dc2626" bg="#fef2f2" border="#fecaca"/></Grid>
          <Grid item xs={6}><StatCard icon={<AccessTime fontSize="small"/>} label="Đi trễ" value={stats.late} color="#d97706" bg="#fffbeb" border="#fde68a"/></Grid>
        </Grid>

        {/* History */}
        <Typography fontSize="0.75rem" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing="0.05em" mb={1.5}>
          Lịch sử điểm danh
        </Typography>

        {loading ? (
          <Stack spacing={1.5}>
            {[1,2,3].map(i => (
              <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#e5e7eb' }} />
                    <Stack spacing={0.5}><Box sx={{ width: 80, height: 12, bgcolor: '#e5e7eb', borderRadius: 1 }} /><Box sx={{ width: 60, height: 10, bgcolor: '#f3f4f6', borderRadius: 1 }} /></Stack>
                  </Stack>
                  <Box sx={{ width: 60, height: 12, bgcolor: '#e5e7eb', borderRadius: 1 }} />
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
        ) : attendances.length === 0 ? (
          <Paper elevation={0} sx={{ py: 8, borderRadius: 3, border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <Typography fontSize="2.5rem" mb={1}>📭</Typography>
            <Typography color="text.secondary" fontSize="0.875rem">Không có dữ liệu trong tháng này</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {attendances.map((att, idx) => {
              const id = att._id || idx;
              const status = getStatus(att);
              const checkIn = att?.timeString?.checkIn || formatTime(att?.time?.checkIn);
              const checkOut = att?.timeString?.checkOut || formatTime(att?.time?.checkOut);
              const expanded = expandedId === id;
              const colorMap = { success: PRIMARY, error: '#dc2626', warning: '#d97706', default: '#6b7280' };
              const dotColor = colorMap[status.color];

              return (
                <Paper key={id} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <Box
                    onClick={() => setExpandedId(expanded ? null : id)}
                    sx={{ px: 2, py: 1.75, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.5, '&:hover': { bgcolor: '#f9fafb' } }}
                  >
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: dotColor, flexShrink: 0 }} />
                    <Box flex={1} minWidth={0}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography fontWeight={700} fontSize="0.875rem">{formatDate(att.date)}</Typography>
                        <Chip label={status.label} color={status.color} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.68rem' }} />
                      </Stack>
                      <Typography fontSize="0.75rem" color="text.secondary" mt={0.25}>
                        Đến: <strong>{checkIn}</strong>
                        <Box component="span" sx={{ mx: 0.75, color: '#d1d5db' }}>→</Box>
                        Về: <strong>{checkOut}</strong>
                      </Typography>
                    </Box>
                    {expanded ? <ExpandLess sx={{ color: '#9ca3af', fontSize: 20 }} /> : <ExpandMore sx={{ color: '#9ca3af', fontSize: 20 }} />}
                  </Box>

                  <Collapse in={expanded}>
                    <Divider />
                    <Box px={2} py={2} bgcolor="#f9fafb">
                      <Grid container spacing={1.5}>
                        {/* Check-in */}
                        <Grid item xs={12}>
                          <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #bbf7d0', overflow: 'hidden' }}>
                            <Stack direction="row" alignItems="center" spacing={1} px={1.5} py={1} bgcolor="#ecfdf5">
                              <LoginIcon sx={{ fontSize: 14, color: PRIMARY }} />
                              <Typography fontSize="0.78rem" fontWeight={700} color={PRIMARY}>Điểm danh đến</Typography>
                              <Box flex={1} />
                              <Chip label={checkIn !== '—' ? checkIn : 'Chưa có'} size="small"
                                sx={{ fontWeight: 700, height: 20, fontSize: '0.68rem', bgcolor: checkIn !== '—' ? PRIMARY : '#9ca3af', color: 'white' }} />
                            </Stack>
                            <Stack spacing={1} px={1.5} py={1.5} fontSize="0.8rem">
                              <Stack direction="row" spacing={1}><Typography color="text.secondary" width={80}>Người đưa:</Typography><Typography fontWeight={600}>{att.deliverer || '—'}</Typography></Stack>
                              <Stack direction="row" spacing={1}><Typography color="text.secondary" width={80}>Ghi chú:</Typography><Typography fontWeight={600}>{att.note || '—'}</Typography></Stack>
                            </Stack>
                            {att.checkinImageName && (
                              <Box px={1.5} pb={1.5}>
                                <Box component="a" href={att.checkinImageName} target="_blank" rel="noopener noreferrer"
                                  sx={{ display: 'block', borderRadius: 2, overflow: 'hidden' }}>
                                  <Box component="img" src={att.checkinImageName} alt="check-in"
                                    sx={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                                </Box>
                              </Box>
                            )}
                          </Paper>
                        </Grid>
                        {/* Check-out */}
                        <Grid item xs={12}>
                          <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #bfdbfe', overflow: 'hidden' }}>
                            <Stack direction="row" alignItems="center" spacing={1} px={1.5} py={1} bgcolor="#eff6ff">
                              <LogoutIcon sx={{ fontSize: 14, color: '#2563eb' }} />
                              <Typography fontSize="0.78rem" fontWeight={700} color="#2563eb">Điểm danh về</Typography>
                              <Box flex={1} />
                              <Chip label={checkOut !== '—' ? checkOut : 'Chưa có'} size="small"
                                sx={{ fontWeight: 700, height: 20, fontSize: '0.68rem', bgcolor: checkOut !== '—' ? '#2563eb' : '#9ca3af', color: 'white' }} />
                            </Stack>
                            <Stack spacing={1} px={1.5} py={1.5} fontSize="0.8rem">
                              <Stack direction="row" spacing={1}><Typography color="text.secondary" width={80}>Người đón:</Typography><Typography fontWeight={600}>{att.receiver || '—'}</Typography></Stack>
                            </Stack>
                            {att.checkoutImageName && (
                              <Box px={1.5} pb={1.5}>
                                <Box component="a" href={att.checkoutImageName} target="_blank" rel="noopener noreferrer"
                                  sx={{ display: 'block', borderRadius: 2, overflow: 'hidden' }}>
                                  <Box component="img" src={att.checkoutImageName} alt="check-out"
                                    sx={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                                </Box>
                              </Box>
                            )}
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>
                  </Collapse>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
