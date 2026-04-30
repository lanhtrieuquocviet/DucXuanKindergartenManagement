import { useState, useMemo, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Class as ClassIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  WarningAmber as WarningAmberIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const ClassSummary = memo(({ classes, loading, activeAcademicYear, onRefresh, onViewStudents }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const stats = useMemo(() => {
    const total = classes.length;
    const fullTeachers = classes.filter(c => (c.teacherIds?.length || 0) >= 2).length;
    const missingTeachers = total - fullTeachers;
    const teacherSet = new Set();
    classes.forEach(c => (c.teacherIds || []).forEach(t => teacherSet.add(t._id || t)));
    return { total, fullTeachers, missingTeachers, totalTeachers: teacherSet.size };
  }, [classes]);

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return classes;
    const term = debouncedSearch.toLowerCase();
    return classes.filter(c =>
      (c.className || '').toLowerCase().includes(term) ||
      (c.gradeId?.gradeName || '').toLowerCase().includes(term) ||
      (c.teacherIds || []).some(t => (t.userId?.fullName || '').toLowerCase().includes(term))
    );
  }, [classes, debouncedSearch]);

  const statItems = [
    { label: 'Tổng lớp học', value: stats.total, color: '#2563eb', bg: '#eff6ff', icon: <ClassIcon sx={{ fontSize: 20 }} /> },
    { label: 'Đủ giáo viên', value: stats.fullTeachers, color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircleIcon sx={{ fontSize: 18 }} /> },
    { label: 'Thiếu giáo viên', value: stats.missingTeachers, color: '#d97706', bg: '#fffbeb', icon: <WarningAmberIcon sx={{ fontSize: 18 }} /> },
    { label: 'Giáo viên tham gia', value: stats.totalTeachers, color: '#7c3aed', bg: '#f5f3ff', icon: <PersonIcon sx={{ fontSize: 18 }} /> },
  ];

  return (
    <Box mt={6}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        mb={3}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#eff6ff', color: '#2563eb', display: 'flex' }}>
            <ClassIcon />
          </Box>
          <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Danh sách lớp học{activeAcademicYear ? ` — ${activeAcademicYear.yearName}` : ''}
          </Typography>
        </Stack>
        {onRefresh && (
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, py: 1 }}
          >
            Làm mới dữ liệu
          </Button>
        )}
      </Stack>

      <Grid container spacing={1.5} mb={4}>
        {statItems.map((item) => (
          <Grid item xs={6} md={3} key={item.label}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, md: 2.5 },
                borderRadius: 4,
                bgcolor: item.bg,
                border: '1px solid',
                borderColor: 'transparent',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                transition: 'all 0.2s',
                '&:hover': { borderColor: item.color, transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
                <Box sx={{ color: item.color, display: 'flex', '& svg': { fontSize: { xs: 16, md: 20 } } }}>
                  {item.icon}
                </Box>
                <Typography
                  variant="caption"
                  fontWeight={800}
                  sx={{
                    color: item.color,
                    textTransform: 'uppercase',
                    fontSize: { xs: '0.55rem', md: '0.65rem' },
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.label}
                </Typography>
              </Stack>
              <Typography
                variant="h4"
                fontWeight={900}
                sx={{ color: item.color, lineHeight: 1.1, fontSize: { xs: '1.25rem', md: '2.125rem' } }}
              >
                {item.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
        <TextField
          size="small"
          placeholder="Tìm theo tên lớp, khối, giáo viên..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.disabled', fontSize: 20 }} /> }}
          sx={{ mb: 3, width: { xs: '100%', sm: 320 } }}
        />

        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          {loading ? (
            <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress size={30} /></Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 800, py: 1.5 }}>STT</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Tên lớp</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Khối</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Giáo viên phụ trách</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Phòng học</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Sĩ số</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      {debouncedSearch ? 'Không tìm thấy lớp phù hợp' : 'Chưa có lớp học nào trong năm học này'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((cls, idx) => (
                    <TableRow key={cls._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{idx + 1}</TableCell>
                      <TableCell
                        onClick={() => onViewStudents ? onViewStudents(cls._id) : navigate(`/school-admin/classes/${cls._id}/students`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <Typography variant="body2" fontWeight={800} color="primary.main">
                          {cls.className}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {cls.gradeId?.gradeName
                          ? <Chip label={cls.gradeId.gradeName} size="small" sx={{ bgcolor: '#f5f3ff', color: '#7c3aed', fontWeight: 700, fontSize: '0.75rem' }} />
                          : <Typography variant="caption" color="text.disabled">—</Typography>
                        }
                      </TableCell>
                      <TableCell>
                        {cls.teacherIds?.length > 0 ? (
                          <Stack spacing={0.5}>
                            {cls.teacherIds.map((t, i) => (
                              <Stack key={t._id || i} direction="row" alignItems="center" spacing={0.5}>
                                <PersonIcon sx={{ fontSize: 14, color: '#64748b' }} />
                                <Typography variant="caption" fontWeight={600}>
                                  {t.userId?.fullName || t.fullName || '—'}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        ) : (
                          <Chip
                            label="Thiếu GV"
                            size="small"
                            sx={{ bgcolor: '#fffbeb', color: '#d97706', fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {cls.roomId ? (
                          <Box>
                            <Typography variant="caption" fontWeight={700} display="block">{cls.roomId.roomName}</Typography>
                            <Typography variant="caption" color="text.secondary">Tầng {cls.roomId.floor}</Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.disabled">Chưa có phòng</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={cls.studentCount ?? 0}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 700, fontSize: '0.75rem', borderColor: 'divider', height: 20 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Paper>
    </Box>
  );
});

export default ClassSummary;
