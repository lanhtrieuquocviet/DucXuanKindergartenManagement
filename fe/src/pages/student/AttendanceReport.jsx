import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';
import {
  Box, Paper, Typography, Avatar, Stack, Chip, IconButton,
  Alert, Divider, Grid, Collapse, Select,
  MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  ArrowBack, School, ExpandMore, ExpandLess, CheckCircle,
  Cancel, AccessTime, CalendarMonth, Login as LoginIcon, Logout as LogoutIcon,
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

// ── Helpers ────────────────────────────────────────────────────────────────────

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

/** Ô thông tin: label nhỏ trên, value to dưới — tránh vỡ dòng */
function InfoItem({ label, value, valueColor, chipItems, chipBg, chipColor }) {
  const empty = chipItems ? chipItems.length === 0 : !value;
  return (
    <Box>
      <Typography fontSize="0.65rem" fontWeight={700} color="#9ca3af" textTransform="uppercase" letterSpacing="0.05em" mb={0.4}>
        {label}
      </Typography>
      {chipItems !== undefined ? (
        chipItems.length > 0 ? (
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {chipItems.map((item, i) => (
              <Chip key={i} label={item} size="small"
                sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, bgcolor: chipBg || '#f3f4f6', color: chipColor || '#374151' }} />
            ))}
          </Stack>
        ) : (
          <Typography fontSize="0.82rem" color="#cbd5e1" fontStyle="italic">Không có</Typography>
        )
      ) : (
        <Typography fontSize="0.85rem" fontWeight={empty ? 400 : 600}
          color={empty ? '#cbd5e1' : (valueColor || 'text.primary')}
          fontStyle={empty ? 'italic' : 'normal'}>
          {value || 'Không có'}
        </Typography>
      )}
    </Box>
  );
}

/** Ảnh có tiêu đề, click mở tab mới */
function PhotoCard({ label, src }) {
  return (
    <Box>
      <Typography fontSize="0.65rem" fontWeight={700} color="#9ca3af" textTransform="uppercase" letterSpacing="0.05em" mb={0.5}>
        {label}
      </Typography>
      <Box component="a" href={src} target="_blank" rel="noopener noreferrer"
        sx={{ display: 'block', borderRadius: 1.5, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
        <Box component="img" src={src} alt={label}
          sx={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
      </Box>
    </Box>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AttendanceReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isInitializing } = useAuth();

  const initial = useMemo(() => {
    const d = searchParams.get('date') ? new Date(searchParams.get('date')) : new Date();
    return { month: d.getMonth()+1, year: d.getFullYear(), studentId: searchParams.get('studentId') || '' };
  }, []);

  const [children, setChildren]     = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(initial.studentId);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading]        = useState(true);
  const [error, setError]            = useState('');
  const [selectedMonth, setSelectedMonth] = useState(initial.month);
  const [selectedYear, setSelectedYear]   = useState(initial.year);
  const [expandedId, setExpandedId]       = useState(null);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const roles = user?.roles?.map(r => r.roleName || r) || [];
    if (!roles.includes('Parent') && !roles.includes('Student') && !roles.includes('StudentParent')) {
      navigate('/', { replace: true }); return;
    }
    get(ENDPOINTS.AUTH.MY_CHILDREN)
      .then(res => {
        const list = res.data || [];
        setChildren(list);
        setSelectedChildId(prev => {
          if (prev && list.some(c => c._id === prev)) return prev;
          return list[0]?._id || '';
        });
      })
      .catch(() => setError('Không tải được thông tin trẻ.'));
  }, [navigate, user, isInitializing]);

  useEffect(() => {
    if (!selectedChildId) return;
    const student = children.find(c => c._id === selectedChildId);
    if (!student) return;
    setError(''); setLoading(true);
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    const classParam = student?.classId?._id || student?.classId ? `&classId=${student?.classId?._id || student?.classId}` : '';
    const endpoint = `${ENDPOINTS.STUDENTS.ATTENDANCE_LIST}?studentId=${student._id}&from=${toYmd(selectedYear, selectedMonth, 1)}&to=${toYmd(selectedYear, selectedMonth, lastDay)}${classParam}`;
    get(endpoint)
      .then(res => setAttendances(res.data || []))
      .catch(() => { setError('Không tải được báo cáo điểm danh.'); setAttendances([]); })
      .finally(() => setLoading(false));
  }, [selectedChildId, selectedMonth, selectedYear, children]);

  const student     = children.find(c => c._id === selectedChildId) || children[0] || null;
  const studentName = student?.fullName || '—';
  const className   = student?.classId?.className || 'Chưa xếp lớp';

  const stats = useMemo(() => ({
    total:   attendances.length,
    present: attendances.filter(a => a.status === 'present').length,
    absent:  attendances.filter(a => a.status === 'absent').length,
    late:    attendances.filter(a => a.status === 'present' && isLate(a?.timeString?.checkIn || a?.time?.checkIn)).length,
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
        {/* Student info */}
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

        {children.length > 1 && (
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, border: '1px solid #bbf7d0', mb: 2 }}>
            <Typography fontWeight={700} fontSize="0.82rem" mb={1}>Chọn bé</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.75}>
              {children.map(child => (
                <Chip
                  key={child._id}
                  label={child.fullName}
                  onClick={() => setSelectedChildId(child._id)}
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

        {/* Filters */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e5e7eb', mb: 2 }}>
          <Typography fontSize="0.75rem" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing="0.05em" mb={1.5}>
            Lọc theo thời gian
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>Tháng</InputLabel>
              <Select value={selectedMonth} label="Tháng" onChange={e => setSelectedMonth(Number(e.target.value))} sx={{ borderRadius: 2 }}>
                {Array.from({length:12},(_,i)=>i+1).map(m => (
                  <MenuItem key={m} value={m}>Tháng {String(m).padStart(2,'0')}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Năm</InputLabel>
              <Select value={selectedYear} label="Năm" onChange={e => setSelectedYear(Number(e.target.value))} sx={{ borderRadius: 2 }}>
                {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* Stats */}
        <Grid container spacing={1.5} mb={2}>
          <Grid item xs={6}><StatCard icon={<CalendarMonth fontSize="small"/>} label="Ngày học"  value={stats.total}   color="#374151" bg="white"    border="#e5e7eb"/></Grid>
          <Grid item xs={6}><StatCard icon={<CheckCircle  fontSize="small"/>} label="Có mặt"   value={stats.present} color={PRIMARY}  bg="#f0fdf4"  border="#bbf7d0"/></Grid>
          <Grid item xs={6}><StatCard icon={<Cancel       fontSize="small"/>} label="Nghỉ học"  value={stats.absent}  color="#dc2626" bg="#fef2f2"  border="#fecaca"/></Grid>
          <Grid item xs={6}><StatCard icon={<AccessTime   fontSize="small"/>} label="Đi trễ"    value={stats.late}    color="#d97706" bg="#fffbeb"  border="#fde68a"/></Grid>
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
                    <Stack spacing={0.5}>
                      <Box sx={{ width: 80, height: 12, bgcolor: '#e5e7eb', borderRadius: 1 }} />
                      <Box sx={{ width: 60, height: 10, bgcolor: '#f3f4f6', borderRadius: 1 }} />
                    </Stack>
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
              const id       = att._id || idx;
              const status   = getStatus(att);
              const checkIn  = att?.timeString?.checkIn  || formatTime(att?.time?.checkIn);
              const checkOut = att?.timeString?.checkOut || formatTime(att?.time?.checkOut);
              const expanded = expandedId === id;
              const colorMap = { success: PRIMARY, error: '#dc2626', warning: '#d97706', default: '#6b7280' };
              const dotColor = colorMap[status.color];

              return (
                <Paper key={id} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  {/* Row header */}
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

                  {/* Expanded detail */}
                  <Collapse in={expanded}>
                    <Divider />
                    <Box px={2} py={2} bgcolor="#f9fafb">
                      {att.status === 'absent' ? (
                        /* ── Nghỉ học ─────────────────────────────────── */
                        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #fecaca', overflow: 'hidden' }}>
                          <Stack direction="row" alignItems="center" spacing={1} px={1.5} py={1} bgcolor="#fef2f2">
                            <Cancel sx={{ fontSize: 14, color: '#dc2626' }} />
                            <Typography fontSize="0.78rem" fontWeight={700} color="#dc2626">Vắng mặt</Typography>
                          </Stack>
                          <Box px={1.5} py={1.5}>
                            <InfoItem label="Lý do vắng" value={att.absentReason} valueColor="#dc2626" />
                          </Box>
                        </Paper>
                      ) : (
                        <Stack spacing={1.5}>
                          {/* ── Điểm danh đến ─────────────────────────── */}
                          <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #bbf7d0', overflow: 'hidden' }}>
                            {/* Header */}
                            <Stack direction="row" alignItems="center" spacing={1} px={1.5} py={1} bgcolor="#ecfdf5">
                              <LoginIcon sx={{ fontSize: 14, color: PRIMARY }} />
                              <Typography fontSize="0.78rem" fontWeight={700} color={PRIMARY}>Điểm danh đến</Typography>
                              <Box flex={1} />
                              {att.checkedInByAI && (
                                <Chip label="AI" size="small"
                                  sx={{ fontWeight: 700, height: 18, fontSize: '0.62rem', bgcolor: '#7c3aed', color: 'white', mr: 0.5 }} />
                              )}
                              <Chip
                                label={checkIn !== '—' ? checkIn : 'Chưa có'}
                                size="small"
                                sx={{ fontWeight: 700, height: 20, fontSize: '0.68rem', bgcolor: checkIn !== '—' ? PRIMARY : '#9ca3af', color: 'white' }}
                              />
                            </Stack>

                            {/* Info grid */}
                            <Grid container spacing={2} px={1.5} pt={1.5} pb={1.5}>
                              <Grid item xs={6}>
                                <InfoItem label="Người đưa" value={att.delivererType} />
                              </Grid>
                              <Grid item xs={6}>
                                <InfoItem label="SĐT người đưa" value={att.delivererOtherInfo} />
                              </Grid>
                              <Grid item xs={12}>
                                <InfoItem label="Ghi chú" value={att.note} />
                              </Grid>
                              <Grid item xs={12}>
                                <InfoItem
                                  label="Đồ mang đến"
                                  chipItems={att.checkinBelongings || []}
                                  chipBg="#d1fae5" chipColor="#065f46"
                                />
                              </Grid>
                            </Grid>

                            {/* Photos */}
                            {(att.delivererOtherImageName || att.checkinImageName) && (
                              <Box px={1.5} pb={1.5}>
                                <Divider sx={{ mb: 1.5 }} />
                                <Grid container spacing={1}>
                                  {att.delivererOtherImageName && (
                                    <Grid item xs={att.checkinImageName ? 6 : 12}>
                                      <PhotoCard label="Ảnh người đưa" src={att.delivererOtherImageName} />
                                    </Grid>
                                  )}
                                  {att.checkinImageName && (
                                    <Grid item xs={att.delivererOtherImageName ? 6 : 12}>
                                      <PhotoCard label="Ảnh điểm danh" src={att.checkinImageName} />
                                    </Grid>
                                  )}
                                </Grid>
                              </Box>
                            )}
                          </Paper>

                          {/* ── Điểm danh về ──────────────────────────── */}
                          <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #bfdbfe', overflow: 'hidden' }}>
                            {/* Header */}
                            <Stack direction="row" alignItems="center" spacing={1} px={1.5} py={1} bgcolor="#eff6ff">
                              <LogoutIcon sx={{ fontSize: 14, color: '#2563eb' }} />
                              <Typography fontSize="0.78rem" fontWeight={700} color="#2563eb">Điểm danh về</Typography>
                              <Box flex={1} />
                              {att.checkedOutByAI && (
                                <Chip label="AI" size="small"
                                  sx={{ fontWeight: 700, height: 18, fontSize: '0.62rem', bgcolor: '#7c3aed', color: 'white', mr: 0.5 }} />
                              )}
                              <Chip
                                label={checkOut !== '—' ? checkOut : 'Chưa có'}
                                size="small"
                                sx={{ fontWeight: 700, height: 20, fontSize: '0.68rem', bgcolor: checkOut !== '—' ? '#2563eb' : '#9ca3af', color: 'white' }}
                              />
                            </Stack>

                            {/* Info grid */}
                            <Grid container spacing={2} px={1.5} pt={1.5} pb={1.5}>
                              <Grid item xs={12}>
                                <InfoItem label="Người đón" value={att.receiverOtherInfo || att.receiverType} />
                              </Grid>
                              <Grid item xs={12}>
                                <InfoItem
                                  label="Đồ mang về"
                                  chipItems={att.checkoutBelongings || []}
                                  chipBg="#dbeafe" chipColor="#1e40af"
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <InfoItem label="Ghi chú đồ mang về" value={att.checkoutBelongingsNote} />
                              </Grid>
                            </Grid>

                            {/* Photos */}
                            {(att.receiverOtherImageName || att.checkoutImageName) && (
                              <Box px={1.5} pb={1.5}>
                                <Divider sx={{ mb: 1.5 }} />
                                <Grid container spacing={1}>
                                  {att.receiverOtherImageName && (
                                    <Grid item xs={att.checkoutImageName ? 6 : 12}>
                                      <PhotoCard label="Ảnh người đón" src={att.receiverOtherImageName} />
                                    </Grid>
                                  )}
                                  {att.checkoutImageName && (
                                    <Grid item xs={att.receiverOtherImageName ? 6 : 12}>
                                      <PhotoCard label="Ảnh điểm danh" src={att.checkoutImageName} />
                                    </Grid>
                                  )}
                                </Grid>
                              </Box>
                            )}
                          </Paper>
                        </Stack>
                      )}
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
