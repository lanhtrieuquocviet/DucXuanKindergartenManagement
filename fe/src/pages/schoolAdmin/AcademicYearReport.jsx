import { Download as DownloadIcon, PictureAsPdf as PdfIcon, Search as SearchIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS, get } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';

function formatVnDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatVnDateRange(startDateStr, endDateStr) {
  const start = formatVnDate(startDateStr);
  const end = formatVnDate(endDateStr || startDateStr);
  if (!start) return '';
  if (!end || start === end) return start;
  return `${start} - ${end}`;
}

function normalizeDateOnly(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getChipStyles(tone) {
  if (tone === 'done') {
    return {
      bgcolor: '#dcfce7',
      color: '#16a34a',
      border: '1px solid',
      borderColor: '#86efac',
      fontWeight: 700,
    };
  }
  if (tone === 'ongoing') {
    return {
      bgcolor: '#dbeafe',
      color: '#1d4ed8',
      border: '1px solid',
      borderColor: '#93c5fd',
      fontWeight: 700,
    };
  }
  if (tone === 'upcoming') {
    return {
      bgcolor: '#fef9c3',
      color: '#ca8a04',
      border: '1px solid',
      borderColor: '#facc15',
      fontWeight: 700,
    };
  }
  return {};
}

export default function AcademicYearReport() {
  const { yearId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [summary, setSummary] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    healthyPercent: 0,
    monitorPercent: 0,
    concerningPercent: 0,
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const onMenuSelect = (path) => navigate(path);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setSummary(null);

        let resolvedYearId = yearId || '';
        if (yearId) {
          const params = new URLSearchParams();
          params.set('yearId', yearId);
          const historyResp = await get(
            `${ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.HISTORY}?${params.toString()}`,
          );

          if (
            historyResp?.status === 'success' &&
            Array.isArray(historyResp.data) &&
            historyResp.data[0]
          ) {
            if (!cancelled) setSummary(historyResp.data[0]);
            resolvedYearId = historyResp.data[0]?._id || yearId;
          } else {
            resolvedYearId = yearId;
          }
        }

        // Nếu không tìm thấy trong history, thử lấy năm học hiện tại.
        if (!resolvedYearId) {
          const currentResp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT);
          if (
            !cancelled &&
            currentResp?.status === 'success' &&
            currentResp.data &&
            (!yearId || String(currentResp.data._id) === String(yearId))
          ) {
            setSummary(currentResp.data);
            resolvedYearId = currentResp.data._id;
          }
        }

        const [yearClassesRes, healthRes, eventsRes] = await Promise.all([
          get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CLASSES(resolvedYearId)),
          get(ENDPOINTS.STUDENTS.HEALTH_OVERVIEW),
          get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_EVENTS.GET(resolvedYearId)),
        ]);

        const classRows = Array.isArray(yearClassesRes?.data) ? yearClassesRes.data : [];
        const classIdSet = new Set(classRows.map((c) => String(c?._id || '')).filter(Boolean));
        const totalClasses = classRows.length;
        const totalStudents = classRows.reduce(
          (sum, c) => sum + Number(c?.studentCount || 0),
          0,
        );

        const healthRows = Array.isArray(healthRes?.data) ? healthRes.data : [];
        const yearHealthRows = healthRows.filter((r) => classIdSet.has(String(r?.classId || '')));
        const healthyCount = yearHealthRows.filter((r) => r?.generalStatus === 'healthy').length;
        const monitorCount = yearHealthRows.filter((r) => r?.generalStatus === 'monitor').length;
        const concerningCount = yearHealthRows.filter((r) => r?.generalStatus === 'concerning').length;
        const denominator = totalStudents > 0 ? totalStudents : 1;
        const healthyPercent = Math.round((healthyCount / denominator) * 100);
        const monitorPercent = Math.round((monitorCount / denominator) * 100);
        const concerningPercent = Math.round((concerningCount / denominator) * 100);

        const months = Array.isArray(eventsRes?.data?.months) ? eventsRes.data.months : [];
        const flattenedEvents = months
          .flatMap((m) =>
            (m?.items || []).map((it) => ({
              name: it?.name || '',
              time: formatVnDateRange(it?.startDate || it?.date, it?.endDate || it?.startDate || it?.date),
              classes: it?.gradeName || 'Khối lớp',
              startDateObj: normalizeDateOnly(it?.startDate || it?.date),
              endDateObj: normalizeDateOnly(it?.endDate || it?.startDate || it?.date),
            })),
          )
          .filter((e) => e.name && e.time)
          .sort((a, b) => {
            if (!a.startDateObj && !b.startDateObj) return 0;
            if (!a.startDateObj) return 1;
            if (!b.startDateObj) return -1;
            return a.startDateObj - b.startDateObj;
          })
          .map((e) => {
            const today = new Date();
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            let status = 'Sắp diễn ra';
            let statusTone = 'upcoming';
            if (e.startDateObj && e.endDateObj) {
              if (todayOnly >= e.startDateObj && todayOnly <= e.endDateObj) {
                status = 'Đang diễn ra';
                statusTone = 'ongoing';
              } else if (e.endDateObj < todayOnly) {
                status = 'Đã tổ chức';
                statusTone = 'done';
              }
            }
            return {
              name: e.name,
              time: e.time,
              classes: e.classes,
              status,
              statusTone,
            };
          });

        if (!cancelled) {
          setStats({
            totalStudents,
            totalClasses,
            healthyPercent,
            monitorPercent,
            concerningPercent,
          });
          setEvents(flattenedEvents);
        }

      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error loading academic year report:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [yearId]);

  const yearName = summary?.yearName || '2025-2026';

  const kpis = [
    { value: stats.totalStudents, label: 'Tổng số trẻ', accent: '#4f46e5' },
    { value: stats.totalClasses, label: 'Tổng số lớp học', accent: '#6366f1' },
    { value: `${stats.healthyPercent}%`, label: '% trẻ bình thường', accent: '#16a34a' },
    { value: `${stats.monitorPercent}%`, label: '% trẻ đang theo dõi', accent: '#d97706' },
    { value: `${stats.concerningPercent}%`, label: '% trẻ đáng lo ngại', accent: '#dc2626' },
  ];

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return events;

    return events.filter((ev) => {
      return [ev.name, ev.time, ev.classes, ev.status].some((v) =>
        String(v).toLowerCase().includes(q),
      );
    });
  }, [events, searchQuery]);

  const userName = user?.fullName || user?.username || 'School Admin';

  return (
    <Box>
      <Stack spacing={3}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
            MamNon DX &gt; Ban Giám hiệu &gt; Quản lý Năm học &gt; Báo cáo &amp; Thống kê
          </Typography>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{ color: '#4f46e5', mt: 1 }}
          >
            Báo cáo &amp; Thống kê - Năm học {yearName}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Tổng hợp dữ liệu và báo cáo qua trong năm học hiện tại.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2.5,
            p: { xs: 2, md: 2.5 },
            background: 'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(79,70,229,0.08) 100%)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <TextField
                placeholder="Tìm trong sự kiện (ví dụ: tên sự kiện, thời gian...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  backgroundColor: 'white',
                  borderRadius: 999,
                  '& .MuiOutlinedInput-root': { borderRadius: 999 },
                }}
              />

              <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<PdfIcon />}
                  sx={{
                    bgcolor: '#4f46e5',
                    '&:hover': { bgcolor: '#4338ca' },
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 2.2,
                  }}
                  onClick={() => window.print()}
                >
                  Báo cáo (PDF)
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  sx={{
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 2.2,
                  }}
                  onClick={() => toast.info('Chưa tích hợp xuất Excel trong bản demo.')}
                >
                  Excel
                </Button>
              </Stack>
            </Stack>

            <Grid container spacing={2}>
              {kpis.map((card) => (
                <Grid item xs={12} sm={6} md={3} key={card.label}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      backgroundColor: 'white',
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      minHeight: 92,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: 0.5,
                      '&:hover': { borderColor: '#c7d2fe' },
                    }}
                  >
                    <Typography
                      variant="h4"
                      fontWeight={900}
                      sx={{ color: '#4f46e5', lineHeight: 1.1 }}
                    >
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={700} sx={{ mt: 0.5 }}>
                      {card.label}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Paper>

        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#4f46e5', mb: 1.5 }}>
            Danh sách tất cả sự kiện trong năm học
          </Typography>
        </Box>

        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 2.5,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'white',
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#4f46e5' }}>
                <TableCell sx={{ color: 'white', fontWeight: 900, borderColor: 'rgba(255,255,255,0.15)', width: 60 }}>
                  STT
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 900, borderColor: 'rgba(255,255,255,0.15)' }}>
                  Tên sự kiện
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 900, borderColor: 'rgba(255,255,255,0.15)', width: 180 }}>
                  Thời gian
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 900, borderColor: 'rgba(255,255,255,0.15)', width: 200 }}>
                  Khối lớp liên quan
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 900, borderColor: 'rgba(255,255,255,0.15)', width: 160 }}>
                  Trạng thái
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Đang tải dữ liệu...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Không có sự kiện phù hợp với bộ lọc.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((ev, idx) => (
                  <TableRow
                    key={`${ev.name}-${idx}`}
                    sx={{
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{ev.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{ev.time}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{ev.classes}</TableCell>
                    <TableCell>
                      <Chip label={ev.status} size="small" sx={getChipStyles(ev.statusTone)} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Box>
  );
}
