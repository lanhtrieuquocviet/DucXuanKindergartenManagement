import { useEffect, useState } from 'react';
import { get, patch, ENDPOINTS } from '../../service/api';
import {
  Box, Paper, Typography, Chip, Stack, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Divider, Avatar, Alert, IconButton, useMediaQuery,
} from '@mui/material';
import { SwapHoriz, CheckCircle, Cancel, Close } from '@mui/icons-material';

const PRIMARY = '#059669';
const PRIMARY_DARK = '#047857';

const STATUS_CONFIG = {
  pending:   { label: 'Chờ duyệt',    color: 'warning' },
  approved:  { label: 'Đã duyệt',     color: 'success' },
  rejected:  { label: 'Bị từ chối',   color: 'error' },
  cancelled: { label: 'Đã huỷ',       color: 'default' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ManageClassTransferRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const isMobile = useMediaQuery('(max-width:700px)');

  const [actionDialog, setActionDialog] = useState(null); // { req, action: 'approve'|'reject' }
  const [rejectedReason, setRejectedReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchRequests = () => {
    const q = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    setLoading(true);
    get(`${ENDPOINTS.CLASS_TRANSFER.ADMIN_REQUESTS}${q}`)
      .then((res) => setRequests(res.data || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const openApprove = (req) => {
    setActionDialog({ req, action: 'approve' });
    setRejectedReason('');
    setActionError('');
  };

  const openReject = (req) => {
    setActionDialog({ req, action: 'reject' });
    setRejectedReason('');
    setActionError('');
  };

  const handleAction = async () => {
    if (!actionDialog) return;
    const { req, action } = actionDialog;
    if (action === 'reject' && !rejectedReason.trim()) {
      setActionError('Vui lòng nhập lý do từ chối');
      return;
    }
    setProcessing(true);
    setActionError('');
    try {
      await patch(ENDPOINTS.CLASS_TRANSFER.UPDATE_STATUS(req._id), {
        status: action === 'approve' ? 'approved' : 'rejected',
        rejectedReason: action === 'reject' ? rejectedReason.trim() : '',
      });
      setActionDialog(null);
      setSuccessMsg(action === 'approve' ? 'Đã duyệt đơn thành công. Học sinh đã được chuyển lớp.' : 'Đã từ chối đơn.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchRequests();
    } catch (e) {
      setActionError(e.message || 'Có lỗi xảy ra');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5} flexWrap="wrap" useFlexGap>
        <SwapHoriz sx={{ color: '#059669', fontSize: 28 }} />
        <Typography fontWeight={800} fontSize="1.2rem">Quản lý đơn xin chuyển lớp</Typography>
        {pendingCount > 0 && (
          <Chip
            label={`${pendingCount} chờ duyệt`}
            color="warning"
            size="small"
            sx={{ fontWeight: 700 }}
          />
        )}
      </Stack>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{successMsg}</Alert>
      )}

      {/* Filter */}
      <Stack direction="row" spacing={1.5} mb={2.5}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select value={statusFilter} label="Trạng thái" onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="pending">Chờ duyệt</MenuItem>
            <MenuItem value="approved">Đã duyệt</MenuItem>
            <MenuItem value="rejected">Bị từ chối</MenuItem>
            <MenuItem value="cancelled">Đã huỷ</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: PRIMARY }} />
        </Box>
      ) : requests.length === 0 ? (
        <Paper elevation={0} sx={{ p: 5, borderRadius: 3, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <Typography fontSize="2.5rem" mb={1}>📋</Typography>
          <Typography color="text.secondary">Không có đơn nào</Typography>
        </Paper>
      ) : isMobile ? (
        // Mobile cards
        <Stack spacing={1.5}>
          {requests.map((req) => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            return (
              <Paper key={req._id} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 36, height: 36, bgcolor: '#ecfdf5', color: PRIMARY, fontWeight: 700 }}>
                      {req.studentId?.fullName?.charAt(0) || '?'}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={700} fontSize="0.88rem">{req.studentId?.fullName}</Typography>
                      <Typography fontSize="0.72rem" color="text.secondary">Phụ huynh: {req.parentId?.fullName || '—'}</Typography>
                    </Box>
                  </Stack>
                  <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" mb={0.75}>
                  <Typography fontSize="0.8rem" fontWeight={600}>{req.fromClassId?.className || '—'}</Typography>
                  <SwapHoriz sx={{ fontSize: 16, color: '#6b7280' }} />
                  <Typography fontSize="0.8rem" fontWeight={600}>{req.toClassId?.className || '—'}</Typography>
                </Stack>
                <Typography fontSize="0.76rem" color="text.secondary" mb={0.5}>Lý do: {req.reason}</Typography>
                <Typography fontSize="0.72rem" color="text.disabled">{fmtDate(req.createdAt)}</Typography>
                {req.rejectedReason && (
                  <Typography fontSize="0.74rem" color="error.main" mt={0.5}>Từ chối: {req.rejectedReason}</Typography>
                )}
                {req.status === 'pending' && (
                  <Stack direction="row" spacing={1} mt={1.25}>
                    <Button size="small" variant="contained" color="success" onClick={() => openApprove(req)}
                      startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
                      sx={{ flex: 1, borderRadius: 2, textTransform: 'none', fontSize: '0.78rem' }}>
                      Duyệt
                    </Button>
                    <Button size="small" variant="outlined" color="error" onClick={() => openReject(req)}
                      startIcon={<Cancel sx={{ fontSize: 14 }} />}
                      sx={{ flex: 1, borderRadius: 2, textTransform: 'none', fontSize: '0.78rem' }}>
                      Từ chối
                    </Button>
                  </Stack>
                )}
              </Paper>
            );
          })}
        </Stack>
      ) : (
        // Desktop table
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 700 }}>Học sinh</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Phụ huynh</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lớp đi</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lớp đến</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lý do</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ngày gửi</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((req) => {
                const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                return (
                  <TableRow key={req._id} hover>
                    <TableCell>
                      <Typography fontWeight={600} fontSize="0.88rem">{req.studentId?.fullName}</Typography>
                      <Typography fontSize="0.73rem" color="text.secondary">{req.studentId?.studentCode}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{req.parentId?.fullName || '—'}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{req.fromClassId?.className || '—'}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{req.toClassId?.className || '—'}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography fontSize="0.82rem" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {req.reason}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{fmtDate(req.createdAt)}</TableCell>
                    <TableCell>
                      <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                      {req.rejectedReason && (
                        <Typography fontSize="0.71rem" color="error.main" mt={0.5} sx={{ maxWidth: 160, wordBreak: 'break-word' }}>
                          {req.rejectedReason}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {req.status === 'pending' && (
                        <Stack direction="row" spacing={0.75}>
                          <Button size="small" variant="contained" color="success" onClick={() => openApprove(req)}
                            sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.76rem', minWidth: 'auto', px: 1.25 }}>
                            Duyệt
                          </Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => openReject(req)}
                            sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.76rem', minWidth: 'auto', px: 1.25 }}>
                            Từ chối
                          </Button>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Action Dialog */}
      <Dialog
        open={!!actionDialog}
        onClose={() => !processing && setActionDialog(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography fontWeight={700}>
              {actionDialog?.action === 'approve' ? '✅ Xác nhận duyệt đơn' : '❌ Từ chối đơn'}
            </Typography>
            {!processing && (
              <IconButton size="small" onClick={() => setActionDialog(null)}><Close fontSize="small" /></IconButton>
            )}
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {actionDialog && (
            <Stack spacing={2}>
              <Box sx={{ bgcolor: '#f9fafb', borderRadius: 2, p: 1.5 }}>
                <Typography fontWeight={700} fontSize="0.9rem">{actionDialog.req.studentId?.fullName}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                  <Typography fontSize="0.82rem">{actionDialog.req.fromClassId?.className}</Typography>
                  <SwapHoriz sx={{ fontSize: 16, color: '#6b7280' }} />
                  <Typography fontSize="0.82rem">{actionDialog.req.toClassId?.className}</Typography>
                </Stack>
                <Typography fontSize="0.78rem" color="text.secondary" mt={0.5}>Lý do: {actionDialog.req.reason}</Typography>
              </Box>

              {actionDialog.action === 'approve' && (
                <Alert severity="info" sx={{ borderRadius: 2, fontSize: '0.82rem' }}>
                  Sau khi duyệt, học sinh sẽ được chuyển sang lớp <strong>{actionDialog.req.toClassId?.className}</strong> ngay lập tức.
                </Alert>
              )}

              {actionDialog.action === 'reject' && (
                <TextField
                  label="Lý do từ chối *"
                  multiline
                  rows={3}
                  value={rejectedReason}
                  onChange={(e) => setRejectedReason(e.target.value)}
                  size="small"
                  fullWidth
                  inputProps={{ maxLength: 500 }}
                  placeholder="Nhập lý do từ chối..."
                />
              )}

              {actionError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>{actionError}</Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setActionDialog(null)}
            disabled={processing}
            variant="outlined"
            sx={{ flex: 1, borderRadius: 2, textTransform: 'none', borderColor: '#d1d5db', color: '#6b7280' }}
          >
            Huỷ
          </Button>
          <Button
            onClick={handleAction}
            disabled={processing}
            variant="contained"
            color={actionDialog?.action === 'approve' ? 'success' : 'error'}
            sx={{ flex: 2, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            {processing
              ? <CircularProgress size={18} sx={{ color: 'white' }} />
              : actionDialog?.action === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
