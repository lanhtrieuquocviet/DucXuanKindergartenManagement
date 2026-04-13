import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, post, ENDPOINTS } from '../../service/api';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, Stack, IconButton, TextField, Button,
  CircularProgress, Alert, Chip, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const STATUS_MAP = {
  pending: { label: 'Chờ duyệt', color: 'warning' },
  approved: { label: 'Đã duyệt', color: 'success' },
  rejected: { label: 'Từ chối', color: 'error' },
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
  const date = new Date(ymd);
  date.setDate(date.getDate() + 1);
  return toYmd(date);
};

export default function LeaveRequest() {
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();
  const [children, setChildren] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [form, setForm] = useState({
    studentId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const selectedStudent = children.find((c) => c._id === form.studentId) || children[0] || null;
  const parentName = user?.fullName || user?.username || 'Phụ huynh';
  const todayYmd = toYmd(new Date());

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const [childrenRes, reqRes] = await Promise.all([
        get(ENDPOINTS.AUTH.MY_CHILDREN),
        get(ENDPOINTS.LEAVE.MY_REQUESTS),
      ]);
      const childList = childrenRes.data || [];
      setChildren(childList);
      setRequests(reqRes.data || []);
      setForm((prev) => ({ ...prev, studentId: prev.studentId || childList[0]?._id || '' }));
    } catch (e) {
      setError(e.message || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    fetchMyRequests();
  }, [isInitializing, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    setError('');
    setSuccess('');
    if (!form.studentId || !form.startDate || !form.endDate || !form.reason.trim()) {
      setError('Vui lòng nhập đủ thông tin');
      return;
    }
    if (form.startDate < todayYmd) {
      setError('Từ ngày không được nhỏ hơn ngày hiện tại');
      return;
    }
    if (form.endDate <= form.startDate) {
      setError('Đến ngày phải lớn hơn Từ ngày');
      return;
    }
    setSubmitting(true);
    try {
      await post(ENDPOINTS.LEAVE.CREATE, {
        studentId: form.studentId,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
      });
      setSuccess('');
      toast.success('Đã gửi đơn xin nghỉ thành công');
      setForm((prev) => ({ ...prev, startDate: '', endDate: '', reason: '' }));
      setOpenCreateDialog(false);
      fetchMyRequests();
    } catch (e2) {
      setError(e2.data?.message || e2.message || 'Gửi đơn thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f0fdf4' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', px: 2, py: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton onClick={() => navigate('/student')} size="small" sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.18)' }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography color="white" fontWeight={700}>Đơn xin nghỉ</Typography>
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 700, mx: 'auto', p: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Typography fontWeight={700}>Danh sách đơn xin nghỉ học</Typography>
              <Button variant="contained" onClick={() => setOpenCreateDialog(true)}>
                Tạo đơn xin nghỉ
              </Button>
            </Stack>
          </Box>
          {loading ? (
            <Stack alignItems="center" py={4}><CircularProgress size={24} /></Stack>
          ) : requests.length === 0 ? (
            <Typography sx={{ p: 2, color: 'text.secondary' }}>Chưa có đơn nào.</Typography>
          ) : (
            requests.map((r, idx) => {
              const status = STATUS_MAP[r.status] || { label: r.status, color: 'default' };
              return (
                <Box key={r._id}>
                  <Box sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography fontWeight={600}>{r.student?.fullName || 'Học sinh'}</Typography>
                      <Chip size="small" color={status.color} label={status.label} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(r.startDate).toLocaleDateString('vi-VN')} - {new Date(r.endDate).toLocaleDateString('vi-VN')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.75 }}>{r.reason}</Typography>
                    {r.status === 'rejected' && r.rejectedReason ? (
                      <Typography variant="caption" color="error" sx={{ mt: 0.75, display: 'block' }}>
                        Lý do từ chối: {r.rejectedReason}
                      </Typography>
                    ) : null}
                  </Box>
                  {idx < requests.length - 1 && <Divider />}
                </Box>
              );
            })
          )}
        </Paper>
      </Box>

      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tạo đơn xin nghỉ</DialogTitle>
        <DialogContent>
          <Stack component="form" spacing={2} onSubmit={onSubmit} sx={{ mt: 1 }}>
            <TextField
              label="Học sinh"
              value={selectedStudent?.fullName || ''}
              size="small"
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Lớp"
              value={selectedStudent?.classId?.className || 'Chưa xếp lớp'}
              size="small"
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Phụ huynh"
              value={parentName}
              size="small"
              InputProps={{ readOnly: true }}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                type="date"
                label="Từ ngày"
                InputLabelProps={{ shrink: true }}
                size="small"
                fullWidth
                value={form.startDate}
                inputProps={{ min: todayYmd }}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => {
                    const shouldResetEnd = prev.endDate && prev.endDate <= value;
                    return { ...prev, startDate: value, endDate: shouldResetEnd ? '' : prev.endDate };
                  });
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
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </Stack>
            {(form.startDate || form.endDate) && (
              <Typography variant="caption" color="text.secondary">
                Từ ngày {formatDdMmYyyy(form.startDate) || '--/--/----'} · Đến ngày {formatDdMmYyyy(form.endDate) || '--/--/----'}
              </Typography>
            )}
            <TextField
              label="Lý do xin nghỉ"
              multiline
              minRows={3}
              value={form.reason}
              onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setOpenCreateDialog(false)}>Hủy</Button>
          <Button onClick={onSubmit} variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Tạo đơn xin nghỉ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
