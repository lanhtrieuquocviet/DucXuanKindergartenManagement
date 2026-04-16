import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';
import {
  Box, Paper, Typography, Avatar, Stack, Chip, IconButton,
  CircularProgress, Alert, Divider, Grid,
} from '@mui/material';

import {
  ArrowBack, School, CalendarMonth,
  Login as LoginIcon, Logout as LogoutIcon, Image as ImageIcon, SmartToy,
  VerifiedUser as VerifiedUserIcon, PersonOff as PersonOffIcon,
} from '@mui/icons-material';

const PRIMARY = '#059669';
const PRIMARY_DARK = '#047857';
const BG = '#f0fdf4';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Label nhỏ phía trên, value phía dưới — tránh vỡ dòng */
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
          color={empty ? '#cbd5e1' : (valueColor || '#111827')}
          fontStyle={empty ? 'italic' : 'normal'}>
          {value || 'Không có'}
        </Typography>
      )}
    </Box>
  );
}

/** Ảnh có tiêu đề, click mở tab mới; nếu không có ảnh thì hiện placeholder */
function PhotoCard({ label, src, color }) {
  return (
    <Box>
      <Typography fontSize="0.65rem" fontWeight={700} color="#9ca3af" textTransform="uppercase" letterSpacing="0.05em" mb={0.5}>
        {label}
      </Typography>
      {src ? (
        <Box component="a" href={src} target="_blank" rel="noopener noreferrer"
          sx={{ display: 'block', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: `${color}40` }}>
          <Box component="img" src={src} alt={label} sx={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} />
          <Stack direction="row" spacing={0.75} alignItems="center" px={1.5} py={0.75} bgcolor="#f9fafb">
            <ImageIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
            <Typography fontSize="0.68rem" color="text.disabled">Nhấn để xem đầy đủ</Typography>
          </Stack>
        </Box>
      ) : (
        <Stack alignItems="center" justifyContent="center" spacing={0.75}
          sx={{ py: 3, borderRadius: 2, border: '2px dashed', borderColor: `${color}25`, bgcolor: `${color}06` }}>
          <ImageIcon sx={{ fontSize: 28, color: `${color}35` }} />
          <Typography fontSize="0.72rem" color="text.disabled">Chưa có ảnh</Typography>
        </Stack>
      )}
    </Box>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TodayAttendance() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isInitializing } = useAuth();
  const [children, setChildren]   = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(() => searchParams.get('studentId') || '');
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

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
    setLoading(true);
    setError('');
    setAttendance(null);
    get(`${ENDPOINTS.STUDENTS.ATTENDANCE_LIST}?studentId=${selectedChildId}&date=${todayQuery}`)
      .then(res => setAttendance((res.data || [])[0] || null))
      .catch(() => setError('Không tải được dữ liệu điểm danh hôm nay.'))
      .finally(() => setLoading(false));
  }, [selectedChildId, todayQuery]);

  const student     = children.find(c => c._id === selectedChildId) || children[0] || null;
  const studentName = student?.fullName || '—';
  const className   = student?.classId?.className || 'Chưa xếp lớp';

  // Check-in data
  const checkInTime   = attendance?.timeString?.checkIn || '';
  const delivererName = attendance?.delivererType || '';           // tên người đưa
  const delivererPhone = attendance?.delivererOtherInfo || '';     // SĐT người đưa
  const delivererImg  = attendance?.delivererOtherImageName || '';
  const checkinImg    = attendance?.checkinImageName || '';
  const note          = attendance?.note || '';
  const checkinBelongings = attendance?.checkinBelongings || [];
  const checkedInByAI = attendance?.checkedInByAI || false;
  const absentReason  = attendance?.absentReason || '';
  const isOtherDeliverer = delivererName === 'Khác';

  // Check-out data
  const checkOutTime  = attendance?.timeString?.checkOut || '';
  // receiverType = "Tên (Quan hệ)"; receiverOtherInfo = SĐT — giống pattern check-in
  const receiverName  = attendance?.receiverType || '';
  const receiverPhone = attendance?.receiverOtherInfo || '';
  const receiverImg   = attendance?.receiverOtherImageName || '';
  const checkoutImg   = attendance?.checkoutImageName || '';
  const checkoutBelongings = attendance?.checkoutBelongings || [];
  const checkoutBelongingsNote = attendance?.checkoutBelongingsNote || '';
  const checkedOutByAI = attendance?.checkedOutByAI || false;
  const checkoutConfirmMethod = attendance?.checkoutConfirmMethod || '';
  const isOtherReceiver = receiverName === 'Khác';

  const isAbsent   = attendance?.status === 'absent';
  const hasCheckIn  = Boolean(checkInTime || attendance?.status === 'present');
  const hasCheckOut = Boolean(checkOutTime);

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

        {loading ? (
          <Stack alignItems="center" py={8}><CircularProgress sx={{ color: PRIMARY }} /></Stack>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}

            {/* ── Check-in Card ─────────────────────────────────────── */}
            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #bbf7d0', mb: 2 }}>
              {/* Header */}
              <Stack direction="row" alignItems="center" spacing={1.5} px={2} py={1.5}
                sx={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #10b981 100%)` }}>
                <LoginIcon sx={{ color: 'white', fontSize: 20 }} />
                <Typography color="white" fontWeight={700} fontSize="0.95rem">Điểm danh đến</Typography>
              </Stack>

              <Box px={2} py={2}>
                {/* Status chips */}
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.75} mb={2}>
                  <Chip
                    label={isAbsent ? 'Vắng mặt' : hasCheckIn ? 'Có mặt' : 'Chưa điểm danh'}
                    color={isAbsent ? 'error' : hasCheckIn ? 'success' : 'default'}
                    size="small" sx={{ fontWeight: 700 }}
                  />
                  {checkedInByAI && (
                    <Chip icon={<SmartToy sx={{ fontSize: '14px !important' }} />}
                      label="Nhận diện AI" size="small"
                      sx={{ fontWeight: 700, bgcolor: '#f3e8ff', color: '#7c3aed', border: '1px solid #e9d5ff' }}
                    />
                  )}
                  {isOtherDeliverer && hasCheckIn && (
                    <Chip icon={<VerifiedUserIcon sx={{ fontSize: '14px !important' }} />}
                      label="Giáo viên xác nhận trực tiếp" size="small"
                      sx={{ fontWeight: 700, bgcolor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
                    />
                  )}
                </Stack>

                {/* Time (large) */}
                <Box mb={2}>
                  <Typography fontSize="0.65rem" fontWeight={700} color="#9ca3af" textTransform="uppercase" letterSpacing="0.05em" mb={0.4}>
                    Giờ đến
                  </Typography>
                  {checkInTime
                    ? <Typography fontWeight={800} fontSize="1.6rem" color={PRIMARY} lineHeight={1}>{checkInTime}</Typography>
                    : <Typography color="#cbd5e1" fontSize="0.85rem" fontStyle="italic">Chưa có dữ liệu</Typography>
                  }
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Info grid */}
                <Grid container spacing={2} mb={2}>
                  <Grid size={{ xs: 6 }}>
                    <InfoItem label="Người đưa" value={delivererName} />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <InfoItem label="SĐT người đưa" value={delivererPhone} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <InfoItem label="Ghi chú" value={note} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <InfoItem label="Đồ mang đến" chipItems={checkinBelongings} chipBg="#d1fae5" chipColor="#065f46" />
                  </Grid>
                  {isAbsent && (
                    <Grid size={{ xs: 12 }}>
                      <InfoItem label="Lý do vắng" value={absentReason} valueColor="#dc2626" />
                    </Grid>
                  )}
                </Grid>

                {/* Photos */}
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1.5}>
                  {delivererImg && (
                    <Grid size={{ xs: checkinImg ? 6 : 12 }}>
                      <PhotoCard label="Ảnh người đưa" src={delivererImg} color={PRIMARY} />
                    </Grid>
                  )}
                  <Grid size={{ xs: delivererImg ? 6 : 12 }}>
                    <PhotoCard label="Ảnh xác nhận check-in" src={checkinImg} color={PRIMARY} />
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            {/* ── Check-out Card ─────────────────────────────────────── */}
            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #bfdbfe' }}>
              {/* Header */}
              <Stack direction="row" alignItems="center" spacing={1.5} px={2} py={1.5}
                sx={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' }}>
                <LogoutIcon sx={{ color: 'white', fontSize: 20 }} />
                <Typography color="white" fontWeight={700} fontSize="0.95rem">Điểm danh về</Typography>
              </Stack>

              <Box px={2} py={2}>
                {/* Status chips */}
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.75} mb={2}>
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
                  {isOtherReceiver && checkoutConfirmMethod === 'teacher' && (
                    <Chip icon={<VerifiedUserIcon sx={{ fontSize: '14px !important' }} />}
                      label="Giáo viên xác nhận trực tiếp" size="small"
                      sx={{ fontWeight: 700, bgcolor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
                    />
                  )}
                  {isOtherReceiver && checkoutConfirmMethod === 'school_otp' && (
                    <Chip icon={<VerifiedUserIcon sx={{ fontSize: '14px !important' }} />}
                      label="Phụ huynh xác nhận" size="small"
                      sx={{ fontWeight: 700, bgcolor: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' }}
                    />
                  )}
                  {isOtherReceiver && checkoutConfirmMethod === 'sms_otp' && (
                    <Chip icon={<PersonOffIcon sx={{ fontSize: '14px !important' }} />}
                      label="Xác thực OTP (SMS)" size="small"
                      sx={{ fontWeight: 700, bgcolor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}
                    />
                  )}
                </Stack>

                {/* Time (large) */}
                <Box mb={2}>
                  <Typography fontSize="0.65rem" fontWeight={700} color="#9ca3af" textTransform="uppercase" letterSpacing="0.05em" mb={0.4}>
                    Giờ về
                  </Typography>
                  {checkOutTime
                    ? <Typography fontWeight={800} fontSize="1.6rem" color="#2563eb" lineHeight={1}>{checkOutTime}</Typography>
                    : <Typography color="#cbd5e1" fontSize="0.85rem" fontStyle="italic">Chưa có dữ liệu</Typography>
                  }
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Info grid */}
                <Grid container spacing={2} mb={2}>
                  <Grid size={{ xs: 6 }}>
                    <InfoItem label="Người đón" value={receiverName} />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <InfoItem label="SĐT người đón" value={receiverPhone} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <InfoItem label="Ghi chú" value={checkoutBelongingsNote} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <InfoItem label="Đồ mang về" chipItems={checkoutBelongings} chipBg="#dbeafe" chipColor="#1e40af" />
                  </Grid>
                </Grid>

                {/* Photos */}
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1.5}>
                  {receiverImg && (
                    <Grid size={{ xs: checkoutImg ? 6 : 12 }}>
                      <PhotoCard label="Ảnh người đón" src={receiverImg} color="#2563eb" />
                    </Grid>
                  )}
                  <Grid size={{ xs: receiverImg ? 6 : 12 }}>
                    <PhotoCard label="Ảnh xác nhận check-out" src={checkoutImg} color="#2563eb" />
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
}
