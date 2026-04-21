import { useState, useMemo, useEffect, memo } from 'react';
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
  Avatar,
  Chip,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Class as ClassIcon,
  WarningAmber as WarningAmberIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const StudentSummary = memo(({ students, activeAcademicYear, loading, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const activeYearId = String(activeAcademicYear?._id || '');

  const currentYearStudents = useMemo(() => {
    if (!activeYearId) return [];
    return students.filter(s => {
      const ids = Array.isArray(s.academicYearId) ? s.academicYearId : [s.academicYearId];
      return ids.some(id => String(id?._id || id || '') === activeYearId);
    });
  }, [students, activeYearId]);

  const stats = useMemo(() => {
    const total = currentYearStudents.length;
    const inClass = currentYearStudents.filter(s => s.classId).length;
    const noClass = total - inClass;
    const male = currentYearStudents.filter(s => s.gender === 'male').length;
    const female = currentYearStudents.filter(s => s.gender === 'female').length;
    return { total, inClass, noClass, male, female };
  }, [currentYearStudents]);

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return currentYearStudents;
    const term = debouncedSearch.toLowerCase();
    return currentYearStudents.filter(s => 
      (s.fullName || '').toLowerCase().includes(term) ||
      (s.classId?.className || '').toLowerCase().includes(term)
    );
  }, [currentYearStudents, debouncedSearch]);

  const statItems = [
    { label: 'Tổng học sinh', value: stats.total, color: '#2563eb', bg: '#eff6ff', icon: <PeopleIcon sx={{ fontSize: 20 }} /> },
    { label: 'Đã vào lớp', value: stats.inClass, color: '#16a34a', bg: '#f0fdf4', icon: <ClassIcon sx={{ fontSize: 18 }} /> },
    { label: 'Chưa vào lớp', value: stats.noClass, color: '#d97706', bg: '#fffbeb', icon: <WarningAmberIcon sx={{ fontSize: 18 }} /> },
    { label: 'Nam', value: stats.male, color: '#3b82f6', bg: '#f0f9ff', icon: <PersonIcon sx={{ fontSize: 18 }} /> },
    { label: 'Nữ', value: stats.female, color: '#db2777', bg: '#fdf2f8', icon: <PersonIcon sx={{ fontSize: 18 }} /> },
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
            <PeopleIcon />
          </Box>
          <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Tổng hợp học sinh năm học
          </Typography>
        </Stack>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={onRefresh}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, py: 1 }}
        >
          Làm mới dữ liệu
        </Button>
      </Stack>

      <Grid container spacing={1.5} mb={4}>
        {statItems.map((item, idx) => (
          <Grid 
            item 
            xs={idx < 2 ? 6 : 4} 
            sm={idx < 2 ? 6 : 4} 
            md={2.4} 
            key={item.label}
          >
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
                '&:hover': { borderColor: item.color, transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
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
                    textOverflow: 'ellipsis'
                  }}
                >
                  {item.label}
                </Typography>
              </Stack>
              <Typography 
                variant="h4" 
                fontWeight={900} 
                sx={{ 
                  color: item.color, 
                  lineHeight: 1.1,
                  fontSize: { xs: '1.25rem', md: '2.125rem' } 
                }}
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
          placeholder="Tìm theo tên học sinh, lớp..."
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
                  <TableCell sx={{ fontWeight: 800 }}>Họ tên</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Ngày sinh</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Giới tính</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Lớp học</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      {debouncedSearch ? 'Không tìm thấy học sinh phù hợp' : 'Chưa có dữ liệu học sinh'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s, idx) => (
                    <TableRow key={s._id} hover>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{idx + 1}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar src={s.avatar} sx={{ width: 32, height: 32, fontSize: '0.85rem', bgcolor: '#2563eb' }}>
                            {s.fullName?.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" fontWeight={700}>{s.fullName}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('vi-VN') : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={s.gender === 'male' ? 'Nam' : s.gender === 'female' ? 'Nữ' : 'Khác'}
                          size="small"
                          sx={{
                            bgcolor: s.gender === 'male' ? '#eff6ff' : s.gender === 'female' ? '#fff1f2' : '#f8fafc',
                            color: s.gender === 'male' ? '#2563eb' : s.gender === 'female' ? '#e11d48' : '#64748b',
                            fontWeight: 700, fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {s.classId?.className
                          ? <Chip label={s.classId.className} size="small" sx={{ bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 700 }} />
                          : <Typography variant="caption" color="text.disabled">Chưa vào lớp</Typography>
                        }
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={s.classId ? "Đang học" : "Chờ xếp lớp"} 
                          size="small" 
                          sx={{ 
                            bgcolor: s.classId ? '#f0fdf4' : '#f8fafc', 
                            color: s.classId ? '#16a34a' : '#64748b', 
                            fontWeight: 700 
                          }} 
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

export default StudentSummary;
