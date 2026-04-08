import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';
import {
  Box, Paper, Typography, Avatar, Stack, Chip, IconButton,
  CircularProgress, Alert, Divider,
} from '@mui/material';
import {
  ArrowBack, Person, School, CalendarMonth,
  Login as LoginIcon, Logout as LogoutIcon, Image as ImageIcon, SmartToy,
} from '@mui/icons-material';

const PRIMARY = '#059669';
const PRIMARY_DARK = '#047857';
const BG = '#f0fdf4';

function InfoRow({ label, value }) {
  return (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Typography fontSize="0.78rem" color="text.secondary" width={100} flexShrink={0} pt={0.2}>{label}</Typography>
      <Typography fontSize="0.88rem" fontWeight={600} color="#111827">{value || '—'}</Typography>
    </Stack>
  );
}

function PhotoSlot({ src, alt, color }) {
  if (src) {
    return (
      <Box
        component="a" href={src} target="_blank" rel="noopener noreferrer"
        sx={{ display: 'block', borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: `${color}40` }}
      >
        <Box component="img" src={src} alt={alt} sx={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
        <Stack direction="row" spacing={0.75} alignItems="center" px={1.5} py={1} bgcolor="#f9fafb">
          <ImageIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
          <Typography fontSize="0.72rem" color="text.disabled">Nhấn để xem ảnh đầy đủ</Typography>
        </Stack>
      </Box>
    );
  }
  return (
    <Stack alignItems="center" justifyContent="center" spacing={1}
      sx={{ py: 4, borderRadius: 3, border: '2px dashed', borderColor: `${color}30`, bgcolor: `${color}08` }}>
      <ImageIcon sx={{ fontSize: 36, color: `${color}40` }} />
      <Typography fontSize="0.78rem" color="text.disabled">Chưa có ảnh</Typography>
    </Stack>
  );
}

export default function TodayAttendance() {
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();
  const [children, setChildren] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = useMemo(() => new Date(), []);
  const todayLabel = today.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const todayQuery = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

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
        if (!student?._id) { setError('Chưa có thông tin trẻ để xem điểm danh.'); return; }
        const attRes = await get(`${ENDPOINTS.STUDENTS.ATTENDANCE_LIST}?studentId=${student._id}&date=${todayQuery}`);
        setAttendance((attRes.data || [])[0] || null);
      } catch { setError('Không tải được dữ liệu điểm danh hôm nay.'); }
      finally { setLoading(false); }
    })();
  }, [navigate, user, isInitializing, todayQuery]);

  const student = children[0] || null;
  const studentName = student?.fullName || '—';
  const className = student?.classId?.className || 'Chưa xếp lớp';
  const checkInTime = attendance?.timeString?.checkIn || '';
  const checkOutTime = attendance?.timeString?.checkOut || '';
  const note = attendance?.note || '';
  const delivererDisplay = attendance?.delivererType || attendance?.delivererOtherInfo || '';
  const receiverDisplay = attendance?.receiverType || attendance?.receiverOtherInfo || '';
  const hasCheckIn = Boolean(checkInTime || attendance?.status === 'present');
  const hasCheckOut = Boolean(checkOutTime);
  const checkedInByAI = attendance?.checkedInByAI || false;
  const checkedOutByAI = attendance?.checkedOutByAI || false;

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
          <Box>
            <Typography color="white" fontWeight={700} fontSize="1rem">Điểm danh hôm nay</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem' }}>{todayLabel}</Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 2.5, pb: 4 }}>
        {/* Student card */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #bbf7d0', mb: 2.5 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: '#d1fae5', color: PRIMARY, width: 44, height: 44, fontWeight: 700 }}>
              {studentName.charAt(0)}
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Typography fontWeight={700} fontSize="0.95rem" noWrap>{studentName}</Typography>
              <Stack direction="row" spacing={1.5} mt={0.5}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <School sx={{ fontSize: 13, color: '#6b7280' }} />
                  <Typography fontSize="0.78rem" color="text.secondary">{className}</Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <CalendarMonth sx={{ fontSize: 13, color: '#6b7280' }} />
                  <Typography fontSize="0.78rem" color="text.secondary">{todayQuery}</Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {loading ? (
          <Stack alignItems="center" py={8}><CircularProgress sx={{ color: PRIMARY }} /></Stack>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}

            {/* Check-in Card */}
            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #bbf7d0', mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.5} px={2} py={1.5}
                sx={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #10b981 100%)` }}>
                <LoginIcon sx={{ color: 'white', fontSize: 20 }} />
                <Typography color="white" fontWeight={700} fontSize="0.95rem">Điểm danh đến</Typography>
              </Stack>
              <Box px={2.5} py={2.5}>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <Chip
                    label={hasCheckIn ? 'Có mặt' : 'Chưa điểm danh'}
                    color={hasCheckIn ? 'success' : 'default'}
                    size="small" sx={{ fontWeight: 700 }}
                  />
                  {checkedInByAI && (
                    <Chip icon={<SmartToy sx={{ fontSize: '14px !important' }} />}
                      label="Nhận diện AI" size="small"
                      sx={{ fontWeight: 700, bgcolor: '#f3e8ff', color: '#7c3aed', border: '1px solid #e9d5ff' }}
                    />
                  )}
                </Stack>
                <Stack spacing={1.5}>
                  <InfoRow label="Giờ đến" value={checkInTime ?
                    <Typography fontWeight={800} fontSize="1.5rem" color={PRIMARY}>{checkInTime}</Typography>
                    : <Typography color="text.disabled" fontSize="0.85rem">Chưa có dữ liệu</Typography>
                  } />
                  <Divider />
                  <InfoRow label="Người đưa" value={delivererDisplay || <Typography color="text.disabled" fontSize="0.85rem">Chưa có thông tin</Typography>} />
                  <Divider />
                  <InfoRow label="Ghi chú" value={note || <Typography color="text.disabled" fontSize="0.85rem">Không có ghi chú</Typography>} />
                </Stack>
                <Box mt={2.5}>
                  <Typography fontSize="0.78rem" fontWeight={600} color="text.secondary" mb={1}>Ảnh xác nhận check-in</Typography>
                  <PhotoSlot src={attendance?.checkinImageName} alt="Ảnh check-in" color={PRIMARY} />
                </Box>
              </Box>
            </Paper>

            {/* Check-out Card */}
            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #bfdbfe' }}>
              <Stack direction="row" alignItems="center" spacing={1.5} px={2} py={1.5}
                sx={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' }}>
                <LogoutIcon sx={{ color: 'white', fontSize: 20 }} />
                <Typography color="white" fontWeight={700} fontSize="0.95rem">Điểm danh về</Typography>
              </Stack>
              <Box px={2.5} py={2.5}>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <Chip
                    label={hasCheckOut ? 'Đã đón' : 'Chưa đón'}
                    color={hasCheckOut ? 'info' : 'default'}
                    size="small" sx={{ fontWeight: 700 }}
                  />
                  {checkedOutByAI && (
                    <Chip icon={<SmartToy sx={{ fontSize: '14px !important' }} />}
                      label="Nhận diện AI" size="small"
                      sx={{ fontWeight: 700, bgcolor: '#f3e8ff', color: '#7c3aed', border: '1px solid #e9d5ff' }}
                    />
                  )}
                </Stack>
                <Stack spacing={1.5}>
                  <InfoRow label="Giờ về" value={checkOutTime ?
                    <Typography fontWeight={800} fontSize="1.5rem" color="#2563eb">{checkOutTime}</Typography>
                    : <Typography color="text.disabled" fontSize="0.85rem">Chưa có dữ liệu</Typography>
                  } />
                  <Divider />
                  <InfoRow label="Người đón" value={receiverDisplay || <Typography color="text.disabled" fontSize="0.85rem">Chưa có thông tin</Typography>} />
                  <Divider />
                  <InfoRow label="Xác nhận PH" value={
                    <Chip label={hasCheckOut ? 'Đã xác nhận' : 'Chưa xác nhận'}
                      color={hasCheckOut ? 'info' : 'default'} size="small" sx={{ fontWeight: 700 }} />
                  } />
                </Stack>
                <Box mt={2.5}>
                  <Typography fontSize="0.78rem" fontWeight={600} color="text.secondary" mb={1}>Ảnh xác nhận check-out</Typography>
                  <PhotoSlot src={attendance?.checkoutImageName} alt="Ảnh check-out" color="#2563eb" />
                </Box>
              </Box>
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
}
