import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';
import {
  Box, Paper, Typography, Avatar, Chip, Skeleton, Alert, Stack,
  List, ListItemButton, ListItemAvatar, ListItemText, Divider,
  Tabs, Tab, Grid, InputAdornment, TextField, IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  MonitorHeart as HealthIcon,
  Restaurant as MenuIcon,
  EditNote as NoteTabIcon,
  Grading as GradingIcon,
} from '@mui/icons-material';

import TabDiemDanh from './contact-book-tabs/TabDiemDanh';
import TabHoSo from './contact-book-tabs/TabHoSo';
import TabDanhGia from './contact-book-tabs/TabDanhGia';
import TabSucKhoe from './contact-book-tabs/TabSucKhoe';
import TabThucDon from './contact-book-tabs/TabThucDon';
import TabGhiChu from './contact-book-tabs/TabGhiChu';

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

function genderLabel(g) {
  if (g === 'male') return 'Nam';
  if (g === 'female') return 'Nữ';
  return 'Khác';
}

// ── Main component ────────────────────────────────────────────
export default function ContactBookDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();

  const [classInfo, setClassInfo]       = useState(null);
  const [students, setStudents]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [selected, setSelected]         = useState(null);
  const [search, setSearch]             = useState('');
  const [tab, setTab]                   = useState(0);

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

  const TABS = [
    { label: 'Điểm danh', icon: <CalendarIcon sx={{ fontSize: 18 }} /> },
    { label: 'Hồ sơ',     icon: <PersonIcon sx={{ fontSize: 18 }} /> },
    { label: 'Đánh giá',   icon: <GradingIcon sx={{ fontSize: 18 }} /> },
    { label: 'Sức khỏe',   icon: <HealthIcon sx={{ fontSize: 18 }} /> },
    { label: 'Thực đơn',   icon: <MenuIcon sx={{ fontSize: 18 }} /> },
    { label: 'Ghi chú',    icon: <NoteTabIcon sx={{ fontSize: 18 }} /> },
  ];

  const initials = (name) => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length < 2) return name.charAt(0);
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 3 }} />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 3, mb: 2 }}>{error}</Alert>
        <Button variant="outlined" onClick={() => navigate('/teacher/contact-book')}>Quay lại</Button>
      </Box>
    );
  }

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => navigate('/teacher/contact-book')} sx={{ bgcolor: 'white', boxShadow: 1, '&:hover': { bgcolor: '#f1f5f9' } }}>
          <BackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#0f172a">
            {classInfo?.className || 'Sổ liên lạc'}
          </Typography>
          <Typography variant="body2" color="text.secondary">Quản lý và theo dõi học tập của học sinh</Typography>
        </Box>
      </Stack>

        <Grid container spacing={3}>
        {/* Left: Student List */}
        <Grid size={{ xs: 12, md: 4, lg: 3.5 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
              <TextField
                fullWidth size="small" placeholder="Tìm tên học sinh..."
                value={search} onChange={e => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment>,
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#f8fafc' } }}
              />
            </Box>

            <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
              {filteredStudents.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Không tìm thấy học sinh</Typography>
                </Box>
              ) : (
                filteredStudents.map((s, idx) => (
                  <Box key={s._id}>
                    <ListItemButton
                      selected={selected?._id === s._id}
                      onClick={() => setSelected(s)}
                      sx={{
                        py: 1.5, px: 2, borderLeft: '4px solid transparent',
                        '&.Mui-selected': {
                          bgcolor: 'rgba(8,145,178,0.08)',
                          borderColor: '#0891b2',
                          '&:hover': { bgcolor: 'rgba(8,145,178,0.12)' },
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={s.avatar} sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 700, fontSize: 14 }}>
                          {initials(s.fullName)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={700} color={selected?._id === s._id ? '#0891b2' : 'text.primary'}>{s.fullName}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary">{calcAge(s.dateOfBirth)} · {genderLabel(s.gender)}</Typography>}
                      />
                    </ListItemButton>
                    {idx < filteredStudents.length - 1 && <Divider />}
                  </Box>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Right: Details */}
        <Grid size={{ xs: 12, md: 8, lg: 8.5 }}>
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
                    label={
                      selected.status === 'active' ? 'Đang học' :
                      selected.status === 'graduated' ? 'Đã tốt nghiệp' :
                      'Nghỉ học'
                    }
                    size="small"
                    color={
                      selected.status === 'active' ? 'success' :
                      selected.status === 'graduated' ? 'primary' :
                      'default'
                    }
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
                  <TabHoSo student={selected} />
                )}
                {tab === 2 && (
                  <TabDanhGia studentId={selected._id} classId={classId} academicYearId={classInfo?.academicYearId} />
                )}
                {tab === 3 && (
                  <TabSucKhoe classId={classId} studentId={selected._id} />
                )}
                {tab === 4 && (
                  <TabThucDon />
                )}
                {tab === 5 && (
                  <TabGhiChu classId={classId} studentId={selected._id} />
                )}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
