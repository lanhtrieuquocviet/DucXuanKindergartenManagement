import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton,
  Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, Typography, Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { get, patch, ENDPOINTS } from '../../service/api';

// ── Allocation status labels ───────────────────────────────────────────────
const ALLOCATION_STATUS = {
  pending_confirmation: { label: 'Chờ xác nhận', color: 'warning' },
  active:               { label: 'Đang sử dụng',  color: 'success' },
  transferred:          { label: 'Đã chuyển',      color: 'default' },
  returned:             { label: 'Đã thu hồi',     color: 'default' },
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

// ── Asset list grouped by category ────────────────────────────────────────
function AssetTable({ title, assets }) {
  const [open, setOpen]               = useState(true);
  const [page, setPage]               = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  if (!assets || assets.length === 0) return null;

  const pagedAssets = assets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const grouped = pagedAssets.reduce((acc, a) => {
    const cat = a.category || 'Khác';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  return (
    <Box mb={3}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        <IconButton size="small" onClick={() => setOpen(v => !v)}>
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Stack>
      <Collapse in={open}>
        <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 1 }}>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 480 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell width={36} align="center">STT</TableCell>
                  <TableCell>Tên tài sản</TableCell>
                  <TableCell width={70} align="center">Đơn vị</TableCell>
                  <TableCell width={50} align="center">SL</TableCell>
                  <TableCell width={100} align="center">Đối tượng</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Ghi chú</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(grouped).map(([cat, rows]) => (
                  <>
                    {cat !== 'Khác' && (
                      <TableRow key={`cat-${cat}`}>
                        <TableCell colSpan={6} sx={{ bgcolor: 'primary.50', fontWeight: 700, py: 0.5, fontSize: 12, color: 'primary.main' }}>
                          {cat}
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map((a, i) => (
                      <TableRow key={i} hover>
                        <TableCell align="center" sx={{ color: 'text.secondary' }}>{page * rowsPerPage + i + 1}</TableCell>
                        <TableCell>{a.name}</TableCell>
                        <TableCell align="center">{a.unit}</TableCell>
                        <TableCell align="center">{a.quantity}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={a.targetUser}
                            size="small"
                            variant="outlined"
                            color={a.targetUser === 'Giáo viên' ? 'secondary' : a.targetUser === 'Dùng chung' ? 'info' : 'default'}
                            sx={{ fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: 12, display: { xs: 'none', sm: 'table-cell' } }}>{a.notes}</TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={assets.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage="Số hàng:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
              sx={{
                '.MuiTablePagination-selectLabel': { display: { xs: 'none', sm: 'block' } },
                '.MuiTablePagination-input':       { display: { xs: 'none', sm: 'flex' } },
              }}
            />
          </TableContainer>
        </Paper>
      </Collapse>
    </Box>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function TeacherClassAssets() {
  const navigate = useNavigate();
  const { user, logout, isInitializing, hasPermission, hasRole } = useAuth();

  const [loading, setLoading]         = useState(true);
  const [allocation, setAlloc]        = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming]   = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const aRes = await get(ENDPOINTS.TEACHER.MY_ASSET_ALLOCATION);
      setAlloc(aRes.data?.allocation || null);
    } catch (err) {
      toast.error(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    fetchData();
  }, [user, isInitializing, navigate]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await patch(ENDPOINTS.TEACHER.ASSET_ALLOCATION_CONFIRM(allocation._id), {});
      toast.success('Xác nhận bàn giao thành công!');
      setConfirmOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Xác nhận thất bại');
    } finally {
      setConfirming(false);
    }
  };

  const menuItems = [
    { key: 'classes',          label: 'Lớp phụ trách' },
    { key: 'students',         label: 'Danh sách học sinh' },
    { key: 'attendance',       label: 'Điểm danh' },
    { key: 'pickup-approval',  label: 'Đơn đăng ký đưa đón' },
    { key: 'leave-requests',   label: 'Danh sách đơn xin nghỉ' },
    { key: 'contact-book',     label: 'Sổ liên lạc' },
    { key: 'asset-incidents-teacher', label: 'Báo cáo sự cố CSVC' },
    { key: 'class-assets',     label: 'Tài sản lớp' },
    ...(hasRole('InventoryStaff') ? [{ key: 'asset-inspection', label: 'Kiểm kê tài sản' }] : []),
  ];

  const handleMenuSelect = (key) => {
    const MAP = {
      classes: '/teacher', students: '/teacher/students',
      'contact-book': '/teacher/contact-book', attendance: '/teacher/attendance',
      'pickup-approval': '/teacher/pickup-approval', 'leave-requests': '/teacher/leave-requests',
      'asset-incidents-teacher': '/teacher/asset-incidents',
      'class-assets': '/teacher/class-assets', 'asset-inspection': '/teacher/asset-inspection',
    };
    if (MAP[key]) navigate(MAP[key]);
  };

  const totalAssets = (allocation?.assets?.length || 0) + (allocation?.extraAssets?.length || 0);

  return (
    <RoleLayout
      menuItems={menuItems}
      activeKey="class-assets"
      onMenuSelect={handleMenuSelect}
      onLogout={logout}
      userName={user?.fullName || user?.username}
    >
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>
              Tài sản lớp
            </Typography>
            {allocation && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0, sm: 1 }} mt={0.5}>
                <Typography variant="body2" color="text.secondary">Lớp: <strong>{allocation.className}</strong></Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>·</Typography>
                <Typography variant="body2" color="text.secondary">Ngày BG: {formatDate(allocation.handoverDate)}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>·</Typography>
                <Typography variant="body2" color="text.secondary">{totalAssets} tài sản</Typography>
              </Stack>
            )}
          </Box>
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <Box>
            {!allocation ? (
                  <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                    Lớp của bạn chưa có biên bản bàn giao tài sản nào đang hoạt động.
                  </Paper>
                ) : (
                  <>
                    {/* Allocation info */}
                    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Mã biên bản</Typography>
                          <Typography variant="body2" fontWeight={600}>{allocation.documentCode || '—'}</Typography>
                        </Box>
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Lớp</Typography>
                          <Typography variant="body2" fontWeight={600}>{allocation.className}</Typography>
                        </Box>
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Người bàn giao</Typography>
                          <Typography variant="body2" fontWeight={600}>{allocation.handoverByName || '—'}</Typography>
                          {allocation.handoverByPosition && (
                            <Typography variant="caption" color="text.secondary">{allocation.handoverByPosition}</Typography>
                          )}
                        </Box>
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Giáo viên nhận</Typography>
                          <Typography variant="body2" fontWeight={600}>{allocation.teacherName || '—'}</Typography>
                        </Box>
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Ngày bàn giao</Typography>
                          <Typography variant="body2" fontWeight={600}>{formatDate(allocation.handoverDate)}</Typography>
                        </Box>
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Năm học</Typography>
                          <Typography variant="body2" fontWeight={600}>{allocation.academicYear || '—'}</Typography>
                        </Box>
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Trạng thái</Typography>
                          <Box>
                            <Chip
                              label={ALLOCATION_STATUS[allocation.status]?.label || allocation.status}
                              size="small"
                              color={ALLOCATION_STATUS[allocation.status]?.color || 'default'}
                            />
                          </Box>
                        </Box>
                      </Stack>
                    </Paper>

                    {allocation.status === 'pending_confirmation' && (
                      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'warning.50', borderColor: 'warning.main' }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2}>
                          <Box>
                            <Typography variant="body2" fontWeight={700} color="warning.dark">
                              Biên bản bàn giao đang chờ xác nhận
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Vui lòng kiểm tra danh sách tài sản bên dưới và xác nhận nhận bàn giao.
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => setConfirmOpen(true)}
                            fullWidth={false}
                            sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
                          >
                            Xác nhận bàn giao
                          </Button>
                        </Stack>
                      </Paper>
                    )}

                    <AssetTable title="Tài sản theo Thông tư" assets={allocation.assets} />
                    <AssetTable title="Thiết bị khác ngoài Thông tư" assets={allocation.extraAssets} />
                  </>
                )}
          </Box>
        )}
      </Box>

      {/* ── Confirm handover dialog ── */}
      <Dialog open={confirmOpen} onClose={() => !confirming && setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Xác nhận nhận bàn giao tài sản</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Bạn xác nhận đã kiểm tra và nhận đầy đủ tài sản theo biên bản{' '}
            <strong>{allocation?.documentCode}</strong> của lớp{' '}
            <strong>{allocation?.className}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Sau khi xác nhận, trạng thái sẽ chuyển sang "Đang sử dụng".
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={confirming}>Hủy</Button>
          <Button variant="contained" color="success" onClick={handleConfirm} disabled={confirming} startIcon={<CheckCircleIcon />}>
            {confirming ? 'Đang xác nhận...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>

    </RoleLayout>
  );
}
