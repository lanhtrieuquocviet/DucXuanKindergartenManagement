import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, post, ENDPOINTS } from '../../service/api';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, Stack, IconButton, TextField, Button,
  CircularProgress, Chip, Divider, Dialog, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Avatar, Skeleton,
} from '@mui/material';
import {
  ArrowBack, Add, EditNote, CalendarMonth, Person, School,
  CheckCircle, HourglassEmpty, Cancel, Close,
} from '@mui/icons-material';

const PRIMARY      = '#059669';
const PRIMARY_DARK = '#047857';
const BG           = '#f0fdf4';

const STATUS_MAP = {
  pending:  { label: 'Chờ duyệt', color: 'warning',  icon: <HourglassEmpty sx={{ fontSize: 14 }} /> },
  approved: { label: 'Đã duyệt',  color: 'success',  icon: <CheckCircle    sx={{ fontSize: 14 }} /> },
  rejected: { label: 'Từ chối',   color: 'error',    icon: <Cancel         sx={{ fontSize: 14 }} /> },
};

const toYmd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDdMmYyyy = (ymd) => {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
};

const nextDayYmd = (ymd) => {
  if (!ymd) return '';
  const d = new Date(ymd);
  d.setDate(d.getDate() + 1);
  return toYmd(d);
};

export default function LeaveRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isInitializing } = useAuth();

  const [children, setChildren]       = useState([]);
  const [requests, setRequests]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [openDialog, setOpenDialog]   = useState(false);
  const [form, setForm] = useState({
    studentId: searchParams.get('studentId') || '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const selectedStudent = children.find((c) => c._id === form.studentId) || children[0] || null;
  const parentName      = user?.fullName || user?.username || 'Phụ huynh';
  const todayYmd        = toYmd(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      const [childrenRes, reqRes] = await Promise.all([
        get(ENDPOINTS.AUTH.MY_CHILDREN),
        get(ENDPOINTS.LEAVE.MY_REQUESTS),
      ]);
      const childList = childrenRes.data || [];
      setChildren(childList);
      setRequests(reqRes.data || []);
      setForm((prev) => ({
        ...prev,
        studentId: prev.studentId && childList.some(c => c._id === prev.studentId)
          ? prev.studentId
          : childList[0]?._id || '',
      }));
    } catch (e) {
      toast.error(e.message || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    fetchData();
  }, [isInitializing, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setForm(prev => ({ ...prev, startDate: '', endDate: '', reason: '' }));
    setOpenDialog(true);
  };

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    if (!form.studentId || !form.startDate || !form.endDate || !form.reason.trim()) {
      toast.error('Vui lòng nhập đủ thông tin'); return;
    }
    if (form.startDate < todayYmd) {
      toast.error('Từ ngày không được nhỏ hơn ngày hiện tại'); return;
    }
    if (form.endDate <= form.startDate) {
      toast.error('Đến ngày phải lớn hơn Từ ngày'); return;
    }
    setSubmitting(true);
    try {
      await post(ENDPOINTS.LEAVE.CREATE, {
        studentId: form.studentId,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
      });
      toast.success('Đã gửi đơn xin nghỉ thành công');
      setOpenDialog(false);
      fetchData();
    } catch (e2) {
      toast.error(e2.data?.message || e2.message || 'Gửi đơn thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: BG }}>
      {/* ── AppBar ── */}
      <Box sx={{
        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
        px: 2, py: 2, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(5,150,105,0.3)',
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton onClick={() => navigate('/student')} size="small"
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
              <ArrowBack fontSize="small" />
            </IconButton>
            <Box>
              <Typography color="white" fontWeight={700} fontSize="1rem">Đơn xin nghỉ</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem' }}>
                {requests.length} đơn đã gửi
              </Typography>
            </Box>
          </Stack>
          <Button
            onClick={openCreate}
            startIcon={<Add />}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.18)', color: 'white', fontWeight: 700,
              borderRadius: 2.5, textTransform: 'none', fontSize: '0.82rem',
              px: 1.75, py: 0.75,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
            }}
          >
            Tạo đơn
          </Button>
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 2.5, pb: 4 }}>
        {/* ── List ── */}
        {loading ? (
          <Stack spacing={1.5}>
            {[1, 2, 3].map(i => (
              <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Skeleton variant="text" width={120} height={20} />
                    <Skeleton variant="rounded" width={72} height={24} sx={{ borderRadius: 2 }} />
                  </Stack>
                  <Skeleton variant="text" width={180} height={16} />
                  <Skeleton variant="text" width="90%" height={16} />
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : requests.length === 0 ? (
          <Paper elevation={0} sx={{ py: 8, borderRadius: 3, border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <Typography fontSize="2.5rem" mb={1}>📋</Typography>
            <Typography color="text.secondary" fontSize="0.9rem" fontWeight={600}>Chưa có đơn xin nghỉ nào</Typography>
            <Typography color="text.disabled" fontSize="0.8rem" mt={0.5}>Nhấn "Tạo đơn" để gửi đơn mới</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {requests.map((r) => {
              const status = STATUS_MAP[r.status] || { label: r.status, color: 'default' };
              const from   = formatDdMmYyyy(r.startDate?.split('T')[0]);
              const to     = formatDdMmYyyy(r.endDate?.split('T')[0]);
              return (
                <Paper key={r._id} elevation={0} sx={{
                  borderRadius: 3, border: '1.5px solid',
                  borderColor: r.status === 'approved' ? '#bbf7d0' : r.status === 'rejected' ? '#fecaca' : '#e5e7eb',
                  overflow: 'hidden',
                }}>
                  {/* Header strip */}
                  <Stack direction="row" alignItems="center" spacing={1.5} px={2} py={1.25}
                    sx={{
                      bgcolor: r.status === 'approved' ? '#f0fdf4' : r.status === 'rejected' ? '#fef2f2' : '#fafafa',
                      borderBottom: '1px solid',
                      borderColor: r.status === 'approved' ? '#d1fae5' : r.status === 'rejected' ? '#fecaca' : '#f3f4f6',
                    }}>
                    <Avatar sx={{
                      width: 32, height: 32, fontSize: '0.82rem', fontWeight: 700, flexShrink: 0,
                      bgcolor: PRIMARY + '20', color: PRIMARY,
                    }}>
                      {(r.student?.fullName || 'H').charAt(0)}
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Typography fontWeight={700} fontSize="0.88rem" noWrap>
                        {r.student?.fullName || 'Học sinh'}
                      </Typography>
                      <Typography fontSize="0.72rem" color="text.secondary" noWrap>
                        {r.student?.classId?.className || ''}
                      </Typography>
                    </Box>
                    <Chip
                      label={status.label}
                      color={status.color}
                      size="small"
                      icon={status.icon}
                      sx={{ fontWeight: 700, fontSize: '0.72rem', height: 24 }}
                    />
                  </Stack>

                  {/* Body */}
                  <Box px={2} py={1.5}>
                    <Stack direction="row" spacing={0.75} alignItems="center" mb={0.75}>
                      <CalendarMonth sx={{ fontSize: 14, color: '#6b7280' }} />
                      <Typography fontSize="0.82rem" color="text.secondary">
                        {from} <Box component="span" sx={{ mx: 0.5, color: '#d1d5db' }}>→</Box> {to}
                      </Typography>
                    </Stack>
                    <Typography fontSize="0.85rem" color="#374151" sx={{ lineHeight: 1.6 }}>
                      {r.reason}
                    </Typography>
                    {r.status === 'rejected' && r.rejectedReason && (
                      <Box mt={1} px={1.5} py={1} sx={{ bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #fecaca' }}>
                        <Typography fontSize="0.75rem" color="#dc2626" fontWeight={600}>
                          Lý do từ chối:
                        </Typography>
                        <Typography fontSize="0.8rem" color="#dc2626" mt={0.25}>
                          {r.rejectedReason}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* ── Create Dialog ── */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, mx: 2 } }}
      >
        {/* Dialog Header */}
        <Box sx={{
          background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
          px: 2.5, py: 2,
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
                <EditNote sx={{ fontSize: 20, color: 'white' }} />
              </Avatar>
              <Box>
                <Typography color="white" fontWeight={700} fontSize="1rem">Tạo đơn xin nghỉ</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem' }}>
                  Điền đầy đủ thông tin bên dưới
                </Typography>
              </Box>
            </Stack>
            <IconButton size="small" onClick={() => setOpenDialog(false)}
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
              <Close fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        <DialogContent sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
          <Stack spacing={2}>
            {/* Học sinh */}
            {children.length > 1 ? (
              <FormControl size="small" fullWidth>
                <InputLabel>Học sinh</InputLabel>
                <Select
                  label="Học sinh"
                  value={form.studentId}
                  onChange={e => setForm(prev => ({ ...prev, studentId: e.target.value, startDate: '', endDate: '' }))}
                  sx={{ borderRadius: 2 }}
                >
                  {children.map(c => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.fullName} — {c.classId?.className || 'Chưa xếp lớp'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#f9fafb' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: PRIMARY + '20', color: PRIMARY, width: 36, height: 36, fontWeight: 700, fontSize: '0.9rem' }}>
                    {(selectedStudent?.fullName || 'H').charAt(0)}
                  </Avatar>
                  <Box>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Person sx={{ fontSize: 13, color: '#6b7280' }} />
                      <Typography fontSize="0.88rem" fontWeight={700}>{selectedStudent?.fullName || '—'}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <School sx={{ fontSize: 13, color: '#6b7280' }} />
                      <Typography fontSize="0.78rem" color="text.secondary">
                        {selectedStudent?.classId?.className || 'Chưa xếp lớp'}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            )}

            <Divider />

            {/* Khoảng thời gian */}
            <Box>
              <Typography fontSize="0.75rem" fontWeight={700} color="text.secondary"
                textTransform="uppercase" letterSpacing="0.05em" mb={1}>
                Thời gian nghỉ
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  type="date"
                  label="Từ ngày"
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  fullWidth
                  value={form.startDate}
                  inputProps={{ min: todayYmd }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      startDate: value,
                      endDate: prev.endDate && prev.endDate <= value ? '' : prev.endDate,
                    }));
                  }}
                />
                <TextField
                  type="date"
                  label="Đến ngày"
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  fullWidth
                  value={form.endDate}
                  inputProps={{ min: form.startDate ? nextDayYmd(form.startDate) : todayYmd }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </Stack>
              {(form.startDate && form.endDate) && (
                <Stack direction="row" spacing={0.75} alignItems="center" mt={1}>
                  <CalendarMonth sx={{ fontSize: 13, color: PRIMARY }} />
                  <Typography fontSize="0.78rem" color={PRIMARY} fontWeight={600}>
                    {formatDdMmYyyy(form.startDate)} → {formatDdMmYyyy(form.endDate)}
                  </Typography>
                </Stack>
              )}
            </Box>

            {/* Lý do */}
            <Box>
              <Typography fontSize="0.75rem" fontWeight={700} color="text.secondary"
                textTransform="uppercase" letterSpacing="0.05em" mb={1}>
                Lý do xin nghỉ
              </Typography>
              <TextField
                placeholder="Nhập lý do xin nghỉ..."
                multiline
                minRows={3}
                fullWidth
                value={form.reason}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1, pt: 1.5 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            variant="outlined"
            sx={{ flex: 1, borderRadius: 2, textTransform: 'none', borderColor: '#d1d5db', color: '#6b7280', fontWeight: 600 }}
          >
            Hủy
          </Button>
          <Button
            onClick={onSubmit}
            variant="contained"
            disabled={submitting}
            sx={{ flex: 1, borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: PRIMARY, '&:hover': { bgcolor: PRIMARY_DARK } }}
          >
            {submitting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Gửi đơn'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
