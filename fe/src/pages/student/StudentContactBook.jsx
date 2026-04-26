import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';
import {
  Box, Paper, Typography, Avatar, Chip, Skeleton, Stack,
  Tabs, Tab, CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Person as PersonIcon,
  MonitorHeart as HealthIcon,
  CalendarMonth as CalendarIcon,
  Restaurant as MenuIcon,
  School as SchoolIcon,
  EditNote as NoteTabIcon,
} from '@mui/icons-material';

import { PRIMARY, calcAge } from './ContactBookTabs/ContactBookUtils';
import TabHoSo from './ContactBookTabs/TabHoSo';
import TabSucKhoe from './ContactBookTabs/TabSucKhoe';
import TabDiemDanh from './ContactBookTabs/TabDiemDanh';
import TabThucDon from './ContactBookTabs/TabThucDon';
import TabGhiChu from './ContactBookTabs/TabGhiChu';
import TabDanhGia from './ContactBookTabs/TabDanhGia';

/* ── Main ─────────────────────────────────────────────────── */
const TABS = [
  { label: 'Hồ sơ',     icon: <PersonIcon fontSize="small" /> },
  { label: 'Sức khỏe',  icon: <HealthIcon fontSize="small" /> },
  { label: 'Điểm danh', icon: <CalendarIcon fontSize="small" /> },
  { label: 'Thực đơn',  icon: <MenuIcon fontSize="small" /> },
  { label: 'Ghi chú GV', icon: <NoteTabIcon fontSize="small" /> },
  { label: 'Đánh giá',  icon: <SchoolIcon fontSize="small" /> },
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
          {tab === 5 && <TabDanhGia studentId={selectedChildId} />}
        </Box>
      </Box>
    </Box>
  );
}
