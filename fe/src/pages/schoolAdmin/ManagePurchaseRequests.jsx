import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, IconButton, InputLabel,
  MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Typography,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  ImageSearch as ImageIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { get, patch, ENDPOINTS } from '../../service/api';
import {
  createSchoolAdminMenuSelect,
} from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';

const STATUS_LABEL = {
  draft:    { label: 'Nháp',      color: 'default' },
  pending:  { label: 'Chờ duyệt', color: 'warning' },
  approved: { label: 'Đã duyệt',  color: 'success' },
  rejected: { label: 'Từ chối',   color: 'error' },
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

function formatCost(n) {
  if (!n && n !== 0) return '—';
  return Number(n).toLocaleString('vi-VN') + ' đ';
}

// ── Detail Dialog ──────────────────────────────────────────────────────────────
function DetailDialog({ open, request, onClose, onApprove, onReject }) {
  if (!request) return null;
  const st = STATUS_LABEL[request.status] || { label: request.status, color: 'default' };
  const canAct = request.status === 'pending';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Chi tiết yêu cầu mua sắm
        <Chip
          label={st.label}
          color={st.color}
          size="small"
          sx={{ ml: 1.5, fontSize: 11, height: 22, verticalAlign: 'middle' }}
        />
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Row label="Số YC"            value={request.requestCode || '—'} mono />
          <Row label="Ngày tạo"         value={formatDate(request.createdAt)} />
          <Row label="Người yêu cầu"    value={request.createdBy?.fullName || request.createdBy?.username || '—'} />
          <Row label="Lớp"              value={request.classId?.className || '—'} />
          <Divider />
          <Row label="Tên đồ dùng / Tài sản" value={request.assetName} bold />
          <Row label="Số lượng"         value={`${request.quantity} ${request.unit}`} />
          <Row label="Ước tính chi phí" value={formatCost(request.estimatedCost)} />
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>Lý do mua sắm</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{request.reason || '—'}</Typography>
          </Box>
          {request.notes && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Ghi chú thêm</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{request.notes}</Typography>
            </Box>
          )}

          {/* Images */}
          {request.images?.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Ảnh bằng chứng ({request.images.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.75 }}>
                {request.images.map((url, i) => (
                  <Box
                    key={i}
                    component="img"
                    src={url}
                    onClick={() => window.open(url, '_blank')}
                    sx={{
                      width: 80, height: 80, borderRadius: 1.5,
                      objectFit: 'cover', cursor: 'pointer',
                      border: '1px solid', borderColor: 'divider',
                      '&:hover': { opacity: 0.85 },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Review info */}
          {(request.status === 'approved' || request.status === 'rejected') && (
            <>
              <Divider />
              <Row label="Người duyệt" value={request.reviewedBy?.fullName || request.reviewedBy?.username || '—'} />
              {request.reviewNote && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Ghi chú duyệt</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{request.reviewNote}</Typography>
                </Box>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 2, gap: 1 }}>
        <Button onClick={onClose}>Đóng</Button>
        {canAct && (
          <>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RejectIcon />}
              onClick={() => { onClose(); onReject(request); }}
            >
              Từ chối
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={() => { onClose(); onApprove(request); }}
            >
              Duyệt
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

function Row({ label, value, mono, bold }) {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={bold ? 700 : 400}
        fontFamily={mono ? 'monospace' : 'inherit'}
      >
        {value}
      </Typography>
    </Box>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ManagePurchaseRequests() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [loading, setLoading]         = useState(true);
  const [requests, setRequests]       = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [detailTarget, setDetailTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget]   = useState(null);
  const [rejectNote, setRejectNote]       = useState('');
  const [actioning, setActioning]         = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.PURCHASE_REQUESTS);
      setRequests(res?.data?.requests || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được dữ liệu.');
    } finally { setLoading(false); }
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    setActioning(true);
    try {
      await patch(ENDPOINTS.SCHOOL_ADMIN.PURCHASE_REQUEST_APPROVE(approveTarget._id), {});
      toast.success('Đã duyệt yêu cầu mua sắm.');
      setApproveTarget(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Duyệt thất bại.');
    } finally { setActioning(false); }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectNote.trim()) { toast.error('Vui lòng nhập lý do từ chối.'); return; }
    setActioning(true);
    try {
      await patch(ENDPOINTS.SCHOOL_ADMIN.PURCHASE_REQUEST_REJECT(rejectTarget._id), { reviewNote: rejectNote });
      toast.success('Đã từ chối yêu cầu.');
      setRejectTarget(null);
      setRejectNote('');
      load();
    } catch (err) {
      toast.error(err?.message || 'Từ chối thất bại.');
    } finally { setActioning(false); }
  };

  const filtered = filterStatus === 'all'
    ? requests
    : requests.filter(r => r.status === filterStatus);

  const countByStatus = (s) => requests.filter(r => r.status === s).length;

  const userName = user?.fullName || user?.username || 'SchoolAdmin';

  return (
    <RoleLayout
      title="Yêu cầu mua sắm"
      description="Xem và phê duyệt yêu cầu mua sắm đồ dùng từ giáo viên."
      menuItems={menuItems}
      activeKey="purchase-requests"
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={createSchoolAdminMenuSelect(navigate)}
    >
      {/* ── Summary cards ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Chờ duyệt', status: 'pending',  color: '#f59e0b', bg: '#fef3c7' },
          { label: 'Đã duyệt',  status: 'approved', color: '#10b981', bg: '#d1fae5' },
          { label: 'Từ chối',   status: 'rejected', color: '#ef4444', bg: '#fee2e2' },
          { label: 'Tất cả',    status: 'all',      color: '#6366f1', bg: '#ede9fe' },
        ].map(({ label, status, color, bg }) => (
          <Paper
            key={status}
            elevation={0}
            onClick={() => setFilterStatus(status)}
            sx={{
              px: 2.5, py: 1.75, borderRadius: 2.5, cursor: 'pointer',
              border: '2px solid',
              borderColor: filterStatus === status ? color : 'transparent',
              bgcolor: filterStatus === status ? bg : 'background.paper',
              boxShadow: filterStatus === status ? `0 0 0 1px ${color}40` : '0 1px 3px rgba(0,0,0,0.08)',
              transition: 'all 0.15s',
              '&:hover': { borderColor: color, bgcolor: bg },
              minWidth: 120,
            }}
          >
            <Typography variant="h5" fontWeight={800} sx={{ color, lineHeight: 1 }}>
              {status === 'all' ? requests.length : countByStatus(status)}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
          </Paper>
        ))}
      </Box>

      {/* ── Table ── */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{
          px: 2.5, py: 1.75,
          borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
        }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Danh sách yêu cầu
            {filterStatus !== 'all' && (
              <Chip
                label={STATUS_LABEL[filterStatus]?.label}
                color={STATUS_LABEL[filterStatus]?.color}
                size="small"
                sx={{ ml: 1, fontSize: 11, height: 20 }}
              />
            )}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Lọc trạng thái</InputLabel>
            <Select
              label="Lọc trạng thái"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              startAdornment={<FilterIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="pending">Chờ duyệt</MenuItem>
              <MenuItem value="approved">Đã duyệt</MenuItem>
              <MenuItem value="rejected">Từ chối</MenuItem>
              <MenuItem value="draft">Nháp</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 7 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 7, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">Không có yêu cầu nào.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Số YC</TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Ngày tạo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Giáo viên</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tên đồ dùng / Tài sản</TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Lớp</TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} align="right">Số lượng</TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} align="right">Ước tính</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Ảnh</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((r) => {
                  const canAct = r.status === 'pending';
                  return (
                    <TableRow
                      key={r._id}
                      hover
                      onClick={() => setDetailTarget(r)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 13, whiteSpace: 'nowrap' }}>
                        {r.requestCode || '—'}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {formatDate(r.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#6366f120', color: '#6366f1' }}>
                            {(r.createdBy?.fullName || r.createdBy?.username || '?')[0].toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 130 }}>
                            {r.createdBy?.fullName || r.createdBy?.username || '—'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{r.assetName}</Typography>
                        {r.reason && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            {r.reason}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {r.classId?.className || '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {r.quantity} {r.unit}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {formatCost(r.estimatedCost)}
                      </TableCell>
                      <TableCell align="center">
                        {r.images?.length > 0
                          ? <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: 'primary.main' }}>
                              <ImageIcon sx={{ fontSize: 16 }} />
                              <Typography variant="caption" fontWeight={600}>{r.images.length}</Typography>
                            </Box>
                          : <Typography variant="caption" color="text.disabled">—</Typography>
                        }
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={STATUS_LABEL[r.status]?.label || r.status}
                          color={STATUS_LABEL[r.status]?.color || 'default'}
                          size="small"
                          sx={{ fontSize: 11, height: 22 }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          color="success"
                          disabled={!canAct}
                          title="Duyệt"
                          onClick={() => setApproveTarget(r)}
                        >
                          <ApproveIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={!canAct}
                          title="Từ chối"
                          onClick={() => { setRejectTarget(r); setRejectNote(''); }}
                        >
                          <RejectIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* ── Detail Dialog ── */}
      <DetailDialog
        open={!!detailTarget}
        request={detailTarget}
        onClose={() => setDetailTarget(null)}
        onApprove={(r) => setApproveTarget(r)}
        onReject={(r) => { setRejectTarget(r); setRejectNote(''); }}
      />

      {/* ── Approve Confirm ── */}
      <ConfirmDialog
        open={!!approveTarget}
        title="Duyệt yêu cầu mua sắm"
        message={`Xác nhận duyệt yêu cầu "${approveTarget?.assetName}" từ lớp ${approveTarget?.classId?.className || ''}?`}
        confirmText={actioning ? 'Đang duyệt...' : 'Xác nhận duyệt'}
        cancelText="Hủy"
        onConfirm={handleApprove}
        onCancel={() => setApproveTarget(null)}
      />

      {/* ── Reject Dialog ── */}
      <Dialog
        open={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectNote(''); }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight={700}>Từ chối yêu cầu mua sắm</DialogTitle>
        <DialogContent>
          {rejectTarget && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Từ chối yêu cầu <strong>"{rejectTarget.assetName}"</strong> của{' '}
              <strong>{rejectTarget.createdBy?.fullName || rejectTarget.createdBy?.username}</strong>?
            </Typography>
          )}
          <TextField
            fullWidth multiline rows={3}
            label="Lý do từ chối *"
            placeholder="Nhập lý do để giáo viên biết và điều chỉnh..."
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
          <Button onClick={() => { setRejectTarget(null); setRejectNote(''); }} disabled={actioning}>Hủy</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={actioning || !rejectNote.trim()}
            startIcon={actioning ? <CircularProgress size={14} color="inherit" /> : <RejectIcon />}
          >
            Xác nhận từ chối
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}
