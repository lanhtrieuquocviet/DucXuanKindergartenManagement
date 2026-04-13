import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, post, ENDPOINTS } from '../../service/api';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';

const STATUS_OPTIONS = ['pending', 'approved', 'rejected'];
const STATUS_LABEL = {
  pending: { label: 'Chờ duyệt', color: 'warning' },
  approved: { label: 'Đã duyệt', color: 'success' },
  rejected: { label: 'Từ chối', color: 'error' },
};

export default function TeacherLeaveRequests() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isInitializing, hasPermission, hasRole } = useAuth();
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [rejectDialog, setRejectDialog] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const menuItems = useMemo(() => {
    const all = [
      { key: 'classes', label: 'Lớp phụ trách' },
      { key: 'students', label: 'Danh sách học sinh' },
      { key: 'attendance', label: 'Điểm danh', permission: 'MANAGE_ATTENDANCE' },
      { key: 'pickup-approval', label: 'Đơn đăng ký đưa đón', permission: 'MANAGE_PICKUP' },
      { key: 'leave-requests', label: 'Danh sách đơn xin nghỉ', permission: 'MANAGE_ATTENDANCE' },
      { key: 'schedule', label: 'Lịch dạy & hoạt động' },
      { key: 'purchase-request', label: 'Cơ sở vật chất', permission: 'MANAGE_PURCHASE_REQUEST' },
      { key: 'class-assets', label: 'Tài sản lớp', permission: 'MANAGE_ASSET' },
      { key: 'asset-inspection', label: 'Kiểm kê tài sản', role: 'InventoryStaff' },
    ];
    return all.filter((item) => {
      if (item.permission) return hasPermission(item.permission);
      if (item.role) return hasRole(item.role);
      return true;
    });
  }, [hasPermission, hasRole]);

  const fetchRows = async () => {
    try {
      const res = await get(`${ENDPOINTS.LEAVE.REQUESTS}?status=${status}`);
      setRows(res.data || []);
    } catch (e) {
      setError(e.message || 'Không tải được danh sách đơn');
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
      fetchRows();
    } catch (e) {
      setError(e.data?.message || e.message || 'Cập nhật trạng thái thất bại');
    }
  };

  const handleMenuSelect = (key) => {
    const map = {
      classes: '/teacher',
      students: '/teacher/students',
      attendance: '/teacher/attendance',
      'pickup-approval': '/teacher/pickup-approval',
      'leave-requests': '/teacher/leave-requests',
      'purchase-request': '/teacher/purchase-request',
      'class-assets': '/teacher/class-assets',
      'asset-inspection': '/teacher/asset-inspection',
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
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Paper sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select value={status} label="Trạng thái" onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="all">Tất cả</MenuItem>
              {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{STATUS_LABEL[s].label}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">{rows.length} đơn</Typography>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
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
                  <TableRow key={r._id} hover>
                    <TableCell>{r.student?.fullName || '—'}</TableCell>
                    <TableCell>{r.parent?.fullName || '—'}</TableCell>
                    <TableCell>
                      {new Date(r.startDate).toLocaleDateString('vi-VN')} - {new Date(r.endDate).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 240 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{r.reason}</Typography>
                      {r.status === 'rejected' && r.rejectedReason ? (
                        <Typography variant="caption" color="error.main">Từ chối: {r.rejectedReason}</Typography>
                      ) : null}
                    </TableCell>
                    <TableCell><Chip size="small" color={statusCfg.color} label={statusCfg.label} /></TableCell>
                    <TableCell align="right">
                      {r.status === 'pending' ? (
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="contained" color="success" onClick={() => updateStatus(r._id, 'approved')}>
                            Duyệt
                          </Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => setRejectDialog(r)}>
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
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center">Không có đơn nào</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={!!rejectDialog} onClose={() => setRejectDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Từ chối đơn xin nghỉ</DialogTitle>
        <DialogContent>
          <TextField
            label="Lý do từ chối"
            fullWidth
            multiline
            minRows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(null)} color="inherit">Hủy</Button>
          <Button
            color="error"
            variant="contained"
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
