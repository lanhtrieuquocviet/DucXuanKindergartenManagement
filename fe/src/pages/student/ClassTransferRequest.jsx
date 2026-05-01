import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, post, patch, ENDPOINTS } from '../../service/api';
import {
  Box, Paper, Typography, Button, Chip, Stack, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  MenuItem, Select, FormControl, InputLabel, TextField, FormHelperText,
  IconButton, Alert, useMediaQuery,
} from '@mui/material';
import { ArrowBack, SwapHoriz, Close } from '@mui/icons-material';

const PRIMARY = '#059669';
const PRIMARY_DARK = '#047857';
const REASON_MIN = 10;
const REASON_MAX = 500;

const STATUS_CONFIG = {
  pending:   { label: 'Chờ duyệt',    color: 'warning' },
  approved:  { label: 'Đã duyệt',     color: 'success' },
  rejected:  { label: 'Bị từ chối',   color: 'error' },
  cancelled: { label: 'Đã huỷ',       color: 'default' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ClassTransferRequestPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width:600px)');

  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(params.get('studentId') || '');
  const [requests, setRequests] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [toClassId, setToClassId] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Tải danh sách con
  useEffect(() => {
    get(ENDPOINTS.AUTH.MY_CHILDREN)
      .then((res) => {
        const list = res.data || [];
        setChildren(list);
        if (!selectedChildId && list.length) setSelectedChildId(list[0]._id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Tải đơn khi con thay đổi
  useEffect(() => {
    get(ENDPOINTS.CLASS_TRANSFER.MY_REQUESTS)
      .then((res) => setRequests(res.data || []))
      .catch(() => setRequests([]));
  }, [selectedChildId, successMsg]);

  // Tải lớp hiện có để chọn lớp đích
  useEffect(() => {
    get(ENDPOINTS.CLASSES.LIST)
      .then((res) => setAvailableClasses(res.data || []))
      .catch(() => setAvailableClasses([]));
  }, []);

  const studentInfo = children.find((c) => c._id === selectedChildId) || null;
  const currentClassId = studentInfo?.classId?._id || studentInfo?.classId || '';

  // Tìm gradeId của lớp hiện tại từ danh sách lớp đã fetch
  const currentClass = availableClasses.find(
    (c) => c._id === currentClassId || c._id?.toString() === currentClassId?.toString(),
  );
  const currentGradeId = currentClass?.gradeId?._id || currentClass?.gradeId || null;

  const filteredRequests = requests.filter((r) => r.studentId?._id === selectedChildId || r.studentId === selectedChildId);

  const hasPending = filteredRequests.some((r) => r.status === 'pending');

  const openDialog = () => {
    setToClassId('');
    setReason('');
    setFormError('');
    setDialogOpen(true);
  };

  const selectedClass = availableClasses.find((c) => c._id === toClassId);
  const selectedClassFull = selectedClass?.maxStudents > 0
    && (selectedClass?.studentCount || 0) >= selectedClass?.maxStudents;

  const handleSubmit = async () => {
    if (!toClassId) { setFormError('Vui lòng chọn lớp muốn chuyển đến'); return; }
    if (selectedClassFull) { setFormError('Lớp này đã đủ sĩ số, vui lòng chọn lớp khác'); return; }
    const trimmed = reason.trim();
    if (!trimmed) { setFormError('Vui lòng nhập lý do xin chuyển lớp'); return; }
    if (trimmed.length < REASON_MIN) {
      setFormError(`Lý do phải có ít nhất ${REASON_MIN} ký tự`);
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await post(ENDPOINTS.CLASS_TRANSFER.CREATE, {
        studentId: selectedChildId,
        toClassId,
        reason: reason.trim(),
      });
      setDialogOpen(false);
      setSuccessMsg('Đã gửi đơn xin chuyển lớp thành công!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      setFormError(e.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc muốn huỷ đơn này không?')) return;
    setCancelling(id);
    try {
      await post(ENDPOINTS.CLASS_TRANSFER.CANCEL(id));
      setRequests((prev) => prev.map((r) => (r._id === id ? { ...r, status: 'cancelled' } : r)));
    } catch (e) {
      alert(e.message || 'Không thể huỷ đơn');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: PRIMARY }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f0fdf4', pb: 4 }}>
      {/* Header */}
      <Box sx={{
        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
        px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 }, pb: { xs: 2.5, sm: 3 },
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(5,150,105,0.3)',
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton onClick={() => navigate('/student')} size="small" sx={{ color: 'white' }}>
            <ArrowBack />
          </IconButton>
          <SwapHoriz sx={{ color: 'white', fontSize: 22 }} />
          <Typography sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
            Đơn xin chuyển lớp
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 1.5, sm: 2 }, pt: 2.5 }}>

        {/* Chọn bé */}
        {children.length > 1 && (
          <Paper elevation={0} sx={{ mb: 2, p: 2, borderRadius: 3, border: '1px solid #bbf7d0' }}>
            <Typography fontWeight={700} fontSize="0.88rem" mb={1}>Chọn bé</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {children.map((c) => (
                <Chip
                  key={c._id}
                  label={c.fullName}
                  onClick={() => setSelectedChildId(c._id)}
                  color={selectedChildId === c._id ? 'success' : 'default'}
                  variant={selectedChildId === c._id ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Stack>
          </Paper>
        )}

        {/* Thông tin học sinh hiện tại */}
        {studentInfo && (
          <Paper elevation={0} sx={{ mb: 2, p: 2, borderRadius: 3, border: '1px solid #bbf7d0', bgcolor: '#ecfdf5' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography fontWeight={700} fontSize="0.95rem">{studentInfo.fullName}</Typography>
                <Typography fontSize="0.8rem" color="text.secondary">
                  Lớp hiện tại: <strong>{studentInfo.classId?.className || '—'}</strong>
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                disabled={hasPending || !currentClassId}
                onClick={openDialog}
                sx={{
                  borderRadius: 2, textTransform: 'none', fontWeight: 700,
                  bgcolor: PRIMARY, '&:hover': { bgcolor: PRIMARY_DARK },
                }}
              >
                + Gửi đơn
              </Button>
            </Stack>
            {hasPending && (
              <Typography fontSize="0.76rem" color="warning.main" mt={1}>
                Đang có đơn chờ duyệt. Không thể gửi thêm đơn mới.
              </Typography>
            )}
          </Paper>
        )}

        {successMsg && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{successMsg}</Alert>
        )}

        {/* Danh sách đơn */}
        <Typography fontWeight={700} fontSize="0.92rem" color="#065f46" mb={1.25}>
          Lịch sử đơn chuyển lớp
        </Typography>

        {filteredRequests.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #d1fae5', textAlign: 'center' }}>
            <Typography fontSize="2rem" mb={1}>📋</Typography>
            <Typography color="text.secondary" fontSize="0.875rem">Chưa có đơn xin chuyển lớp nào</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {filteredRequests.map((req) => {
              const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              return (
                <Paper key={req._id} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #d1fae5' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                    <Typography fontSize="0.72rem" color="text.disabled">{fmtDate(req.createdAt)}</Typography>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1}>
                    <Box flex={1}>
                      <Typography fontSize="0.76rem" color="text.secondary">Lớp hiện tại</Typography>
                      <Typography fontWeight={700} fontSize="0.88rem">{req.fromClassId?.className || '—'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#6b7280' }}>
                      <SwapHoriz fontSize="small" />
                    </Box>
                    <Box flex={1}>
                      <Typography fontSize="0.76rem" color="text.secondary">Lớp muốn chuyển đến</Typography>
                      <Typography fontWeight={700} fontSize="0.88rem">{req.toClassId?.className || '—'}</Typography>
                    </Box>
                  </Stack>
                  <Typography fontSize="0.8rem" color="text.secondary" mb={0.5}>
                    <strong>Lý do:</strong> {req.reason}
                  </Typography>
                  {req.status === 'rejected' && req.rejectedReason && (
                    <Alert severity="error" sx={{ mt: 1, py: 0.5, fontSize: '0.78rem', borderRadius: 1.5 }}>
                      Lý do từ chối: {req.rejectedReason}
                    </Alert>
                  )}
                  {req.status === 'approved' && req.processedAt && (
                    <Typography fontSize="0.75rem" color="success.main" mt={0.5}>
                      Đã duyệt lúc {fmtDate(req.processedAt)}
                    </Typography>
                  )}
                  {req.status === 'pending' && (
                    <Box mt={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={cancelling === req._id}
                        onClick={() => handleCancel(req._id)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.78rem' }}
                      >
                        {cancelling === req._id ? <CircularProgress size={14} /> : 'Huỷ đơn'}
                      </Button>
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Dialog gửi đơn */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        fullScreen={isMobile}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: isMobile ? '20px 20px 0 0' : 3, mt: isMobile ? 'auto' : undefined } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography fontWeight={700} fontSize="1rem">Gửi đơn xin chuyển lớp</Typography>
            {!submitting && (
              <IconButton size="small" onClick={() => setDialogOpen(false)}><Close fontSize="small" /></IconButton>
            )}
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography fontSize="0.78rem" fontWeight={600} color="text.secondary" mb={0.5}>
                Học sinh
              </Typography>
              <Typography fontWeight={700}>{studentInfo?.fullName}</Typography>
              <Typography fontSize="0.8rem" color="text.secondary">
                Lớp hiện tại: {studentInfo?.classId?.className || '—'}
              </Typography>
            </Box>

            {(() => {
              const sameGradeClasses = availableClasses.filter((c) => {
                if (c._id?.toString() === currentClassId?.toString()) return false;
                if (!currentGradeId) return true;
                const cGrade = c.gradeId?._id || c.gradeId;
                return cGrade?.toString() === currentGradeId?.toString();
              });
              const noOptions = sameGradeClasses.length === 0;
              const allFull = !noOptions && sameGradeClasses.every(
                (c) => c.maxStudents > 0 && (c.studentCount || 0) >= c.maxStudents,
              );

              const getClassLabel = (c) => {
                const count = c.studentCount || 0;
                const max = c.maxStudents || 0;
                if (max > 0) {
                  const full = count >= max;
                  return `${c.className} — ${count}/${max} HS${full ? ' (Đã đủ sĩ số)' : ''}`;
                }
                return c.className;
              };

              return (
                <FormControl fullWidth size="small" error={noOptions || allFull}>
                  <InputLabel shrink={noOptions || allFull || !!toClassId}>
                    Lớp muốn chuyển đến *
                  </InputLabel>
                  <Select
                    value={toClassId}
                    label="Lớp muốn chuyển đến *"
                    onChange={(e) => { setToClassId(e.target.value); setFormError(''); }}
                    disabled={noOptions || allFull}
                    displayEmpty
                  >
                    {sameGradeClasses.map((c) => {
                      const isFull = c.maxStudents > 0 && (c.studentCount || 0) >= c.maxStudents;
                      return (
                        <MenuItem
                          key={c._id}
                          value={c._id}
                          disabled={isFull}
                          sx={isFull ? { color: 'text.disabled', fontStyle: 'italic' } : {}}
                        >
                          {getClassLabel(c)}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  {noOptions && (
                    <FormHelperText>Không có lớp nào trong cùng khối để chuyển</FormHelperText>
                  )}
                  {allFull && !noOptions && (
                    <FormHelperText>Tất cả lớp trong cùng khối đã đủ sĩ số</FormHelperText>
                  )}
                </FormControl>
              );
            })()}

            <TextField
              label="Lý do xin chuyển lớp *"
              multiline
              rows={3}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setFormError(''); }}
              inputProps={{ maxLength: REASON_MAX }}
              size="small"
              fullWidth
              placeholder="Nhập lý do (tối thiểu 10 ký tự)..."
              helperText={
                <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    {reason.trim().length > 0 && reason.trim().length < REASON_MIN
                      ? `Cần thêm ${REASON_MIN - reason.trim().length} ký tự nữa`
                      : ' '}
                  </span>
                  <span style={{ color: reason.length >= REASON_MAX * 0.9 ? '#ef4444' : '#9ca3af' }}>
                    {reason.length}/{REASON_MAX}
                  </span>
                </Box>
              }
              error={reason.trim().length > 0 && reason.trim().length < REASON_MIN}
              FormHelperTextProps={{ component: 'div' }}
            />

            {formError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>{formError}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={submitting}
            variant="outlined"
            sx={{ flex: 1, borderRadius: 2, textTransform: 'none', borderColor: '#d1d5db', color: '#6b7280' }}
          >
            Huỷ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            variant="contained"
            sx={{ flex: 2, borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: PRIMARY, '&:hover': { bgcolor: PRIMARY_DARK } }}
          >
            {submitting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Gửi đơn'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
