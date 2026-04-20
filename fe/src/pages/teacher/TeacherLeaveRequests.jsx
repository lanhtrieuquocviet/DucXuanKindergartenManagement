import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, post, ENDPOINTS } from '../../service/api';
import { toast } from 'react-toastify';
import {
  Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import {
  EventBusy as LeaveIcon,
  HourglassEmpty as PendingIcon,
  CheckCircleOutline as ApprovedIcon,
  BlockOutlined as RejectedIcon,
} from '@mui/icons-material';

const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'cancelled'];
const STATUS_LABEL = {
  pending: { label: 'Chờ duyệt', color: 'warning' },
  approved: { label: 'Đã duyệt', color: 'success' },
  rejected: { label: 'Từ chối', color: 'error' },
  cancelled: { label: 'Phụ huynh hủy', color: 'default' },
};
const STATUS_ICON = {
  pending: <PendingIcon sx={{ fontSize: 14 }} />,
  approved: <ApprovedIcon sx={{ fontSize: 14 }} />,
  rejected: <RejectedIcon sx={{ fontSize: 14 }} />,
  cancelled: <RejectedIcon sx={{ fontSize: 14 }} />,
};

const toYmd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const nextDayYmd = (ymd) => {
  if (!ymd) return '';
  const d = new Date(ymd);
  d.setDate(d.getDate() + 1);
  return toYmd(d);
};

const formatLeaveDateRange = (startDate, endDate) => {
  const startYmd = startDate?.split('T')[0];
  const endYmd = endDate?.split('T')[0];
  if (!startYmd) return '—';

  const startLabel = new Date(startDate).toLocaleDateString('vi-VN');
  if (!endYmd) return startLabel;

  const endLabel = new Date(endDate).toLocaleDateString('vi-VN');
  return nextDayYmd(startYmd) === endYmd ? startLabel : `${startLabel} - ${endLabel}`;
};

function LeaveRequestCard({ row, onApprove, onReject }) {
  const statusCfg = STATUS_LABEL[row.status] || { label: row.status, color: 'default' };
  const isPending = row.status === 'pending';
  return (
    <Box
      sx={{
        px: 2, py: 1.75,
        borderBottom: '1px solid', borderColor: 'divider',
        bgcolor: isPending ? 'rgba(245,158,11,0.03)' : 'transparent',
        '&:last-child': { borderBottom: 0 },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} mb={1}>
        <Avatar sx={{ width: 34, height: 34, bgcolor: 'teal.100', color: 'teal.800', fontSize: 14, fontWeight: 700 }}>
          {(row.student?.fullName || '?').charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>{row.student?.fullName || '—'}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>{row.parent?.fullName || '—'}</Typography>
        </Box>
        <Chip
          size="small"
          color={statusCfg.color}
          label={statusCfg.label}
          icon={STATUS_ICON[row.status]}
          sx={{ fontWeight: 700, fontSize: 11, height: 23 }}
        />
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        Thời gian nghỉ
      </Typography>
      <Typography variant="body2" fontWeight={600} mb={1}>
        {formatLeaveDateRange(row.startDate, row.endDate)}
      </Typography>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        Lý do
      </Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: row.status === 'rejected' && row.rejectedReason ? 1 : 0 }}>
        {row.reason}
      </Typography>

      {row.status === 'rejected' && row.rejectedReason ? (
        <Box sx={{ mt: 0.75, px: 1, py: 0.75, borderRadius: 1.5, bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
          <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
            Từ chối: {row.rejectedReason}
          </Typography>
        </Box>
      ) : null}

      {isPending ? (
        <Stack direction="row" spacing={1} mt={1.25}>
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={() => onApprove(row._id)}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, flex: 1 }}
          >
            Duyệt
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => onReject(row)}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, flex: 1 }}
          >
            Từ chối
          </Button>
        </Stack>
      ) : null}
    </Box>
  );
}

export default function TeacherLeaveRequests() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isInitializing, hasPermission, hasRole } = useAuth();
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState([]);
  const [rejectDialog, setRejectDialog] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const pendingCount = rows.filter((r) => r.status === 'pending').length;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const menuItems = useMemo(() => {
    const all = [
      { key: 'classes', label: 'Lớp phụ trách' },
      { key: 'students', label: 'Danh sách học sinh' },
      { key: 'attendance', label: 'Điểm danh', permission: 'MANAGE_ATTENDANCE' },
      { key: 'pickup-approval', label: 'Đơn đăng ký đưa đón', permission: 'MANAGE_PICKUP' },
      { key: 'leave-requests', label: 'Danh sách đơn xin nghỉ', permission: 'MANAGE_ATTENDANCE' },
      { key: 'contact-book', label: 'Sổ liên lạc' },
      { key: 'purchase-request', label: 'Cơ sở vật chất', permission: 'MANAGE_PURCHASE_REQUEST' },
      { key: 'class-assets', label: 'Tài sản lớp', permission: 'MANAGE_ASSET' },
      { key: 'asset-inspection', label: 'Kiểm kê tài sản', role: 'InventoryStaff' },
    ];
    const items = all.filter((item) => {
      if (item.permission) return hasPermission(item.permission);
      if (item.role) return hasRole(item.role);
      return true;
    });
    if (hasPermission('MANAGE_TEACHER_REPORT')) {
      items.push({ key: 'manage-purchase-requests', label: 'Duyệt báo cáo giáo viên' });
    }
    return items;
  }, [hasPermission, hasRole]);

  const fetchRows = async () => {
    try {
      const url = status === 'all'
        ? ENDPOINTS.LEAVE.REQUESTS
        : `${ENDPOINTS.LEAVE.REQUESTS}?status=${status}`;
      const res = await get(url);
      setRows(res.data || []);
    } catch (e) {
      toast.error(e.message || 'Không tải được danh sách đơn');
    }
  };

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    fetchRows();
  }, [isInitializing, user, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = async (requestId, nextStatus, reason = '') => {
    try {
      await post(ENDPOINTS.LEAVE.UPDATE_STATUS, { requestId, status: nextStatus, rejectedReason: reason });
      toast.success(nextStatus === 'approved' ? 'Đã duyệt đơn xin nghỉ' : 'Đã từ chối đơn xin nghỉ');
      fetchRows();
    } catch (e) {
      toast.error(e.data?.message || e.message || 'Cập nhật trạng thái thất bại');
    }
  };

  const handleMenuSelect = (key) => {
    const map = {
      classes: '/teacher',
      students: '/teacher/students',
      'contact-book': '/teacher/contact-book',
      attendance: '/teacher/attendance',
      'pickup-approval': '/teacher/pickup-approval',
      'leave-requests': '/teacher/leave-requests',
      'purchase-request': '/teacher/purchase-request',
      'class-assets': '/teacher/class-assets',
      'asset-inspection': '/teacher/asset-inspection',
      'manage-purchase-requests': '/teacher/manage-purchase-requests',
    };
    if (map[key]) navigate(map[key]);
  };

  return (
    <RoleLayout
      title="Danh sách đơn xin nghỉ"
      description="Duyệt hoặc từ chối đơn xin nghỉ của học sinh lớp phụ trách"
      menuItems={menuItems}
      activeKey={location.pathname.startsWith('/teacher/leave-requests') ? 'leave-requests' : 'classes'}
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={user?.fullName || user?.username || 'Teacher'}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      <Paper
        elevation={0}
        sx={{
          mb: 2.5, borderRadius: 3, overflow: 'hidden',
          background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', right: -25, top: -30, width: 130, height: 130, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ px: { xs: 2.25, md: 3 }, py: 2.5, display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
          <Avatar sx={{ width: 46, height: 46, bgcolor: 'rgba(255,255,255,0.2)' }}>
            <LeaveIcon sx={{ color: 'white', fontSize: 24 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" color="white" fontWeight={700}>
              Quản lý đơn xin nghỉ
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.82)' }}>
              Xem và xử lý các đơn xin nghỉ của lớp phụ trách
            </Typography>
          </Box>
          <Chip
            label={`${pendingCount} chờ duyệt`}
            sx={{ ml: 'auto', bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 700, fontSize: 12 }}
          />
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box
          sx={{
            px: { xs: 2, md: 3 }, py: 2,
            borderBottom: '1px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap',
            bgcolor: 'grey.50',
          }}
        >
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select value={status} label="Trạng thái" onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="all">Tất cả</MenuItem>
              {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{STATUS_LABEL[s].label}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>{rows.length} đơn</Typography>
        </Box>

        {rows.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Không có đơn nào theo bộ lọc hiện tại
            </Typography>
          </Box>
        ) : isMobile ? (
          <Box>
            {rows.map((r) => (
              <LeaveRequestCard
                key={r._id}
                row={r}
                onApprove={(id) => updateStatus(id, 'approved')}
                onReject={(row) => {
                  setRejectDialog(row);
                  setRejectReason('');
                }}
              />
            ))}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    '& th': {
                      bgcolor: 'grey.50', fontWeight: 700, fontSize: 12,
                      color: 'text.secondary', textTransform: 'uppercase',
                      letterSpacing: 0.4, py: 1.5,
                      borderBottom: '2px solid', borderColor: 'divider',
                    },
                  }}
                >
                  <TableCell>Học sinh</TableCell>
                  <TableCell>Phụ huynh</TableCell>
                  <TableCell>Thời gian nghỉ</TableCell>
                  <TableCell>Lý do</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Xử lý</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => {
                  const statusCfg = STATUS_LABEL[r.status] || { label: r.status, color: 'default' };
                  return (
                    <TableRow key={r._id} hover sx={{ bgcolor: r.status === 'pending' ? 'rgba(245,158,11,0.03)' : 'transparent' }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{r.student?.fullName || '—'}</Typography>
                      </TableCell>
                      <TableCell>{r.parent?.fullName || '—'}</TableCell>
                      <TableCell>{formatLeaveDateRange(r.startDate, r.endDate)}</TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{r.reason}</Typography>
                        {r.status === 'rejected' && r.rejectedReason ? (
                          <Box sx={{ mt: 0.75, px: 1, py: 0.5, borderRadius: 1, bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
                            <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                              Từ chối: {r.rejectedReason}
                            </Typography>
                          </Box>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={statusCfg.color}
                          label={statusCfg.label}
                          icon={STATUS_ICON[r.status]}
                          sx={{ fontWeight: 700, fontSize: 11, height: 24 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {r.status === 'pending' ? (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => updateStatus(r._id, 'approved')}
                              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                            >
                              Duyệt
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => {
                                setRejectDialog(r);
                                setRejectReason('');
                              }}
                              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                            >
                              Từ chối
                            </Button>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Đã xử lý</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={!!rejectDialog}
        onClose={() => { setRejectDialog(null); setRejectReason(''); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, border: '1px solid', borderColor: 'divider' } }}
      >
        <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Avatar sx={{ bgcolor: 'error.main', width: 40, height: 40 }}>
            <RejectedIcon sx={{ color: 'white' }} />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>Từ chối đơn xin nghỉ</Typography>
            <Typography variant="body2" color="text.secondary">Nhập lý do để phụ huynh nắm được nguyên nhân từ chối.</Typography>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 0.5 }}>
          <TextField
            label="Lý do từ chối"
            placeholder="Ví dụ: Học sinh cần có xác nhận bổ sung từ phụ huynh..."
            fullWidth
            multiline
            minRows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => { setRejectDialog(null); setRejectReason(''); }}
            variant="outlined"
            color="inherit"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Hủy
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={!rejectReason.trim()}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
            onClick={async () => {
              await updateStatus(rejectDialog._id, 'rejected', rejectReason.trim());
              setRejectDialog(null);
              setRejectReason('');
            }}
          >
            Xác nhận từ chối
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}
