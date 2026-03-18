import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  alpha,
  LinearProgress,
  Button,
  IconButton,
  Tooltip,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Restaurant as RestaurantIcon,
  CalendarMonth as CalIcon,
  WarningAmber as WarningIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { getAttendanceSummary } from '../../service/mealManagement.api';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getLocalToday = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const groupByClass = (records = []) => {
  const map = {};
  records.forEach((r) => {
    const name = r.classId?.className || 'Không xác định';
    if (!map[name]) map[name] = { className: name, total: r.classTotalStudents ?? 0, present: 0, absent: 0 };
    // Sĩ số lấy từ classTotalStudents (tổng HS đăng ký lớp), không đếm bản ghi điểm danh
    if (r.classTotalStudents != null) map[name].total = r.classTotalStudents;
    if (r.status === 'present') map[name].present++;
    else map[name].absent++;
  });
  return Object.values(map).sort((a, b) => a.className.localeCompare(b.className, 'vi'));
};

// ─────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, gradient, loading }) {
  return (
    <Card
      elevation={0}
      sx={{
        flex: 1,
        border: '1.5px solid',
        borderColor: alpha(color, 0.18),
        borderRadius: 3.5,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: `0 8px 28px ${alpha(color, 0.2)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 3 }, pb: { xs: '12px !important', sm: '24px !important' } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: { xs: 1, sm: 2 } }}>
          <Avatar sx={{ width: { xs: 36, sm: 52 }, height: { xs: 36, sm: 52 }, background: gradient, boxShadow: `0 4px 12px ${alpha(color, 0.35)}` }}>
            {icon}
          </Avatar>
          {sub && !loading && (
            <Chip label={sub} size="small"
              sx={{ height: { xs: 20, sm: 26 }, fontSize: { xs: 10, sm: 12 }, fontWeight: 800, bgcolor: alpha(color, 0.1), color, border: `1px solid ${alpha(color, 0.2)}` }} />
          )}
        </Box>
        <Typography color="text.secondary" sx={{ fontSize: { xs: 10, sm: 13 }, mb: 0.5, fontWeight: 500, lineHeight: 1.3 }}>
          {label}
        </Typography>
        {loading ? (
          <Skeleton variant="text" width={60} height={36} />
        ) : (
          <Typography fontWeight={900} sx={{ color, lineHeight: 1, fontSize: { xs: 22, sm: 32, md: 38 } }}>
            {value ?? '—'}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// ClassTable
// ─────────────────────────────────────────────
function ClassTable({ rows, loading }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const totals = rows.reduce(
    (acc, r) => ({ total: acc.total + r.total, present: acc.present + r.present, absent: acc.absent + r.absent }),
    { total: 0, present: 0, absent: 0 }
  );

  if (loading) {
    return (
      <Stack spacing={1.5}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rounded" height={isMobile ? 72 : 48} sx={{ borderRadius: 1.5 }} />
        ))}
      </Stack>
    );
  }

  if (!rows.length) {
    return (
      <Box sx={{ py: 8, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2.5, border: '1.5px dashed', borderColor: 'divider' }}>
        <Typography sx={{ fontSize: 40, mb: 1.5 }}>📋</Typography>
        <Typography variant="body1" fontWeight={700} color="text.secondary">Chưa có dữ liệu điểm danh</Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>Chọn một ngày khác để xem thông tin</Typography>
      </Box>
    );
  }

  /* ── Mobile: card per class ── */
  if (isMobile) {
    return (
      <Stack spacing={1.5}>
        {rows.map((row) => {
          const pct = row.total > 0 ? Math.round((row.present / row.total) * 100) : 0;
          return (
            <Card key={row.className} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography fontWeight={700} sx={{ fontSize: 14 }}>{row.className}</Typography>
                  <Chip label={`${pct}%`} size="small"
                    sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: alpha('#4f46e5', 0.08), color: '#4f46e5', border: 'none' }} />
                </Stack>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 1 }}>
                  <Box sx={{ textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1.5, py: 0.75 }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 800, color: 'text.primary' }}>{row.total}</Typography>
                    <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>Sĩ số</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', bgcolor: alpha('#16a34a', 0.08), borderRadius: 1.5, py: 0.75 }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#16a34a' }}>{row.present}</Typography>
                    <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>Có mặt</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', bgcolor: row.absent > 0 ? alpha('#dc2626', 0.07) : 'grey.50', borderRadius: 1.5, py: 0.75 }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 800, color: row.absent > 0 ? '#dc2626' : 'text.disabled' }}>{row.absent}</Typography>
                    <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>Vắng</Typography>
                  </Box>
                </Box>
                <LinearProgress variant="determinate" value={pct}
                  sx={{ height: 5, borderRadius: 3, bgcolor: alpha('#4f46e5', 0.1),
                    '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#4f46e5,#7c3aed)', borderRadius: 3 } }} />
              </CardContent>
            </Card>
          );
        })}
        {/* Tổng cộng */}
        <Card elevation={0} sx={{ border: '2px solid', borderColor: alpha('#4f46e5', 0.2), borderRadius: 2.5, bgcolor: alpha('#4f46e5', 0.03) }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography fontWeight={800} sx={{ fontSize: 13, mb: 1, color: '#4f46e5' }}>Tổng cộng</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: 18, fontWeight: 900, color: 'text.primary' }}>{totals.total}</Typography>
                <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>Sĩ số</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>{totals.present}</Typography>
                <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>Có mặt</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: 18, fontWeight: 900, color: '#dc2626' }}>{totals.absent}</Typography>
                <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>Vắng</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    );
  }

  /* ── Desktop: table ── */
  const headerCell = (label, align = 'left') => (
    <TableCell align={align} sx={{ fontWeight: 700, fontSize: 13, color: 'text.secondary', bgcolor: 'grey.50', borderBottom: '2px solid', borderColor: 'divider', py: 1.5, whiteSpace: 'nowrap' }}>
      {label}
    </TableCell>
  );

  return (
    <TableContainer sx={{ borderRadius: 2.5, overflowX: 'auto', border: '1px solid', borderColor: 'divider' }}>
      <Table size="medium" sx={{ minWidth: 480 }}>
        <TableHead>
          <TableRow>
            {headerCell('Lớp')}
            {headerCell('Sĩ số', 'center')}
            {headerCell('Có mặt', 'center')}
            {headerCell('Vắng', 'center')}
            {headerCell('Suất cơm', 'center')}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={row.className} sx={{ bgcolor: idx % 2 === 0 ? 'background.paper' : alpha('#f5f6fa', 0.7), '&:hover': { bgcolor: alpha('#4f46e5', 0.04) }, transition: 'background 0.15s' }}>
              <TableCell sx={{ fontSize: 14, fontWeight: 600, py: 1.75 }}>{row.className}</TableCell>
              <TableCell align="center" sx={{ fontSize: 14, fontWeight: 600 }}>{row.total}</TableCell>
              <TableCell align="center">
                <Chip label={row.present} size="small" sx={{ minWidth: 36, height: 28, fontSize: 13, fontWeight: 700, bgcolor: alpha('#16a34a', 0.1), color: '#16a34a', border: 'none' }} />
              </TableCell>
              <TableCell align="center">
                {row.absent > 0
                  ? <Chip label={row.absent} size="small" sx={{ minWidth: 36, height: 28, fontSize: 13, fontWeight: 700, bgcolor: alpha('#dc2626', 0.08), color: '#dc2626', border: 'none' }} />
                  : <Typography sx={{ fontSize: 14, color: 'text.disabled' }}>0</Typography>}
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#4f46e5' }}>{row.present}</Typography>
              </TableCell>
            </TableRow>
          ))}
          <TableRow sx={{ bgcolor: alpha('#4f46e5', 0.04), borderTop: '2px solid', borderColor: alpha('#4f46e5', 0.15) }}>
            <TableCell sx={{ fontSize: 14, fontWeight: 800, py: 2 }}>Tổng cộng</TableCell>
            <TableCell align="center" sx={{ fontSize: 14, fontWeight: 800 }}>{totals.total}</TableCell>
            <TableCell align="center"><Typography sx={{ fontSize: 14, fontWeight: 800, color: '#16a34a' }}>{totals.present}</Typography></TableCell>
            <TableCell align="center"><Typography sx={{ fontSize: 14, fontWeight: 800, color: '#dc2626' }}>{totals.absent}</Typography></TableCell>
            <TableCell align="center"><Typography sx={{ fontSize: 14, fontWeight: 800, color: '#4f46e5' }}>{totals.present}</Typography></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─────────────────────────────────────────────
// Main: MealHeadcount
// ─────────────────────────────────────────────
function MealHeadcount() {
  const navigate = useNavigate();
  const today = getLocalToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async (date) => {
    setLoading(true);
    setSummary(null);
    try {
      const res = await getAttendanceSummary(date);
      setSummary(res.data);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary(selectedDate);
  }, [selectedDate, fetchSummary]);

  const isToday = selectedDate === today;
  const classRows = groupByClass(summary?.records);
  const attendanceRate =
    summary?.total > 0 ? Math.round((summary.present / summary.total) * 100) : null;

  return (
    <Box>
      {/* ═══════════════ HEADER BANNER ═══════════════ */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #9333ea 100%)',
          position: 'relative',
        }}
      >
        {/* Decorative circles */}
        <Box sx={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />
        <Box sx={{ position: 'absolute', right: 100, bottom: -40, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
        <Box sx={{ position: 'absolute', left: -20, top: -20, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            px: { xs: 3, md: 4 },
            py: { xs: 2, md: 3 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          {/* Left: icon + title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: { xs: 44, md: 54 }, height: { xs: 44, md: 54 }, bgcolor: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.3)' }}>
              <PeopleIcon sx={{ fontSize: { xs: 22, md: 28 }, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', fontSize: { xs: 17, md: 22 }, lineHeight: 1.25 }}>
                Sĩ số & Suất cơm
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.88)', fontSize: { xs: 11.5, md: 13 }, mt: 0.3, fontWeight: 500 }}>
                Dữ liệu điểm danh · Tính số suất cơm
              </Typography>
            </Box>
          </Box>

          {/* Right: actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            {/* Back button */}
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/kitchen/meal-management')}
              size="small"
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                fontWeight: 700,
                borderRadius: 2.5,
                textTransform: 'none',
                fontSize: 13,
                px: 2,
                py: 0.85,
                backdropFilter: 'blur(6px)',
                bgcolor: 'rgba(255,255,255,0.08)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.18)',
                  borderColor: 'rgba(255,255,255,0.8)',
                },
                transition: 'all 0.15s',
              }}
            >
              Quay lại
            </Button>

            {/* Refresh button */}
            <Tooltip title="Làm mới dữ liệu" arrow>
              <IconButton
                onClick={() => fetchSummary(selectedDate)}
                size="small"
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  border: '1.5px solid rgba(255,255,255,0.35)',
                  borderRadius: 2,
                  width: 36,
                  height: 36,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                }}
              >
                <RefreshIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            {/* Date picker */}
            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                bgcolor: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(10px)',
                border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 2.5,
                px: { xs: 1.5, sm: 2 }, py: 1, flex: { xs: 1, sm: 'none' },
              }}
            >
              <CalIcon sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: 700, mb: 0.1, textTransform: 'uppercase' }}>
                  Ngày xem
                </Typography>
                <input
                  type="date"
                  value={selectedDate}
                  max={today}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  style={{
                    border: 'none', outline: 'none', background: 'transparent',
                    fontSize: 14, fontWeight: 800, color: 'white',
                    cursor: 'pointer', fontFamily: 'inherit', colorScheme: 'dark',
                    width: '100%',
                  }}
                />
              </Box>
              {isToday && (
                <Chip label="Hôm nay" size="small"
                  sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: 'rgba(255,255,255,0.22)', color: 'white', border: 'none', flexShrink: 0 }} />
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Loading bar */}
      {loading && <LinearProgress sx={{ borderRadius: 4, mb: 2.5, height: 3 }} />}

      {/* ═══════════════ 3 STAT CARDS ═══════════════ */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: { xs: 1.5, sm: 2.5 },
          mb: 3,
        }}
      >
        <StatCard
          icon={<PeopleIcon sx={{ fontSize: 26, color: 'white' }} />}
          label="Tổng học sinh"
          value={summary?.total}
          color="#4f46e5"
          gradient="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
          loading={loading}
        />
        <StatCard
          icon={<CheckCircleIcon sx={{ fontSize: 26, color: 'white' }} />}
          label="Có mặt hôm nay"
          value={summary?.present}
          sub={attendanceRate !== null ? `${attendanceRate}%` : undefined}
          color="#16a34a"
          gradient="linear-gradient(135deg, #16a34a 0%, #22c55e 100%)"
          loading={loading}
        />
        <StatCard
          icon={<RestaurantIcon sx={{ fontSize: 26, color: 'white' }} />}
          label="Tổng suất cơm"
          value={summary?.mealCount}
          color="#f97316"
          gradient="linear-gradient(135deg, #f97316 0%, #fb923c 100%)"
          loading={loading}
        />
      </Box>

      {/* ═══════════════ TABLE CARD ═══════════════ */}
      <Card
        elevation={0}
        sx={{
          border: '1.5px solid',
          borderColor: 'divider',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 3, pb: '24px !important' }}>
          {/* Section header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <Box sx={{ width: 5, height: 28, borderRadius: 4, background: 'linear-gradient(180deg, #4f46e5, #7c3aed)', flexShrink: 0 }} />
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, fontSize: 16 }}>
                Chi tiết theo lớp
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12.5, mt: 0.25 }}>
                Dữ liệu từ hệ thống điểm danh ngày {formatDisplayDate(selectedDate)}
              </Typography>
            </Box>
            {!loading && summary?.total > 0 && (
              <Chip
                label={`${classRows.length} lớp`}
                size="small"
                sx={{ ml: 'auto', height: 26, fontSize: 12, fontWeight: 700, bgcolor: alpha('#4f46e5', 0.08), color: '#4f46e5', border: 'none' }}
              />
            )}
          </Box>

          {/* Absent alert */}
          {!loading && summary?.absent > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                px: 2,
                py: 1.25,
                mb: 2,
                borderRadius: 2,
                bgcolor: alpha('#f59e0b', 0.08),
                border: '1px solid',
                borderColor: alpha('#f59e0b', 0.25),
              }}
            >
              <WarningIcon sx={{ fontSize: 18, color: '#d97706' }} />
              <Typography variant="body2" sx={{ color: '#92400e', fontSize: 13, fontWeight: 500 }}>
                Có <strong>{summary.absent}</strong> học sinh vắng mặt —
                đã trừ khỏi số suất cơm cần chuẩn bị.
              </Typography>
            </Box>
          )}

          <ClassTable rows={classRows} loading={loading} />
        </CardContent>
      </Card>
    </Box>
  );
}

export default MealHeadcount;
