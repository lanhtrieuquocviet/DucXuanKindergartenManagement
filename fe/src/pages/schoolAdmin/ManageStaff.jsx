import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Autocomplete,
  Avatar,
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { get, post, put, del, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';

const POSITION_OPTIONS = ['BGH', 'Giáo viên', 'Nhân viên văn phòng', 'nhân viên y tế', 'nhân viên bếp'];

const EMPTY_FORM = {
  position: '',
  customPosition: '',
  status: 'active',
  userId: null,
};

const DEFAULT_STAFF_AVATAR_3X4 = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160" viewBox="0 0 120 160">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#e2e8f0"/>
        <stop offset="100%" stop-color="#cbd5e1"/>
      </linearGradient>
    </defs>
    <rect width="120" height="160" fill="url(#g)"/>
    <circle cx="60" cy="58" r="24" fill="#94a3b8"/>
    <rect x="28" y="90" width="64" height="44" rx="22" fill="#94a3b8"/>
    <text x="60" y="151" text-anchor="middle" font-size="14" font-family="Arial, sans-serif" fill="#475569">3x4</text>
  </svg>`
)}`;

export default function ManageStaff() {
  const navigate = useNavigate();
  const { user, logout, isInitializing, hasRole } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [staff, setStaff] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [filterPosition, setFilterPosition] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!hasRole('SchoolAdmin')) {
      navigate('/', { replace: true });
      return;
    }

    loadStaff();
    loadUsers();
  }, [isInitializing, navigate, user, hasRole]);

  const loadStaff = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await get(ENDPOINTS.SCHOOL_ADMIN.STAFF_MEMBERS);
      setStaff(response.data || []);
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Lỗi khi tải danh sách nhân sự';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await get(ENDPOINTS.SCHOOL_ADMIN.STAFF_USERS);
      setUsers(response.data || []);
    } catch (err) {
      console.error('loadUsers error', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStaff(), loadUsers()]);
    setRefreshing(false);
  };

  const handleOpenDialog = (mode = 'create', staffItem = null) => {
    setDialogMode(mode);
    setFormErrors({});

    if (mode === 'edit' && staffItem) {
      setSelectedStaffId(staffItem._id);
      const existingPosition = staffItem.position || '';
      const isKnownPosition = POSITION_OPTIONS.includes(existingPosition);
      setForm({
        position: isKnownPosition ? existingPosition : 'other',
        customPosition: isKnownPosition ? '' : existingPosition,
        status: staffItem.status || 'active',
        userId: staffItem.user?._id || null,
      });
    } else {
      setSelectedStaffId(null);
      setForm(EMPTY_FORM);
    }

    setDialogOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.position.trim()) errors.position = 'Chức vụ bắt buộc';
    if (form.position === 'other' && !form.customPosition.trim()) {
      errors.customPosition = 'Vui lòng nhập chức vụ khác';
    }
    if (!form.userId) errors.userId = 'Vui lòng chọn người dùng';
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        position: form.position === 'other' ? form.customPosition.trim() : form.position.trim(),
        status: form.status,
        userId: form.userId,
      };

      if (dialogMode === 'create') {
        await post(ENDPOINTS.SCHOOL_ADMIN.STAFF_MEMBERS, payload);
        toast.success('Thêm nhân sự thành công');
      } else {
        await put(ENDPOINTS.SCHOOL_ADMIN.STAFF_MEMBER(selectedStaffId), payload);
        toast.success('Cập nhật nhân sự thành công');
      }

      await handleRefresh();
      setDialogOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Lỗi khi lưu nhân sự');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRequestDelete = (item) => {
    setDeleteDialog({ open: true, item });
  };

  const handleDelete = async () => {
    const item = deleteDialog.item;
    if (!item?._id) return;
    try {
      setSaveLoading(true);
      await del(ENDPOINTS.SCHOOL_ADMIN.STAFF_MEMBER(item._id));
      await loadStaff();
      toast.success('Xóa nhân sự thành công');
      setDeleteDialog({ open: false, item: null });
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Lỗi khi xóa nhân sự');
    } finally {
      setSaveLoading(false);
    }
  };

  const availableUsers = useMemo(() => {
    const assignedUserIds = new Set(staff.map((item) => item.user?._id));
    return users.filter((u) => {
      if (dialogMode === 'edit' && form.userId === u._id) return true;
      return !assignedUserIds.has(u._id);
    });
  }, [users, staff, dialogMode, form.userId]);

  const userById = useMemo(() => {
    const map = new Map();
    users.forEach((u) => {
      if (u?._id) map.set(u._id, u);
    });
    return map;
  }, [users]);

  const getStaffEmail = (item) => {
    const fromStaffApi = item?.user?.email;
    if (fromStaffApi) return fromStaffApi;
    const fromUsersApi = userById.get(item?.user?._id)?.email;
    return fromUsersApi || '—';
  };

  const filteredStaff = useMemo(() => {
    const searchTerm = searchName.trim().toLowerCase();
    return staff.filter((item) => {
      const fullName = String(item.user?.fullName || '').toLowerCase();
      const position = String(item.position || '');
      const matchesName = !searchTerm || fullName.includes(searchTerm);
      const matchesPosition =
        !filterPosition ||
        (filterPosition === 'Khác'
          ? !POSITION_OPTIONS.includes(position)
          : position === filterPosition);
      return matchesName && matchesPosition;
    });
  }, [staff, searchName, filterPosition]);

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);
  const userName = user?.fullName || user?.username || 'School Admin';

  return (
    <RoleLayout
      title="Quản lý nhân sự"
      description="Quản lý mã nhân viên, chức vụ và trạng thái nhân sự trường."
      menuItems={menuItems}
      activeKey="staff"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
          borderRadius: 3,
          px: 4,
          py: 3,
          mb: 3,
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="white">
              Quản lý nhân sự
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: { xs: 2, sm: 0 } }}>
            <Button variant="contained" color="secondary" onClick={() => handleOpenDialog('create')} sx={{ textTransform: 'none' }}>
              Thêm nhân sự
            </Button>
            <Button variant="outlined" color="inherit" onClick={handleRefresh} disabled={refreshing} sx={{ textTransform: 'none' }}>
              {refreshing ? 'Làm mới...' : 'Làm mới'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              Đang tải...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 4 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : staff.length === 0 ? (
          <Box sx={{ p: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Không có nhân sự để hiển thị.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <TextField
                size="small"
                label="Tìm theo tên"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                sx={{ minWidth: 240 }}
              />

              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="staff-filter-position-label">Chức vụ</InputLabel>
                <Select
                  labelId="staff-filter-position-label"
                  label="Chức vụ"
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="BGH">BGH</MenuItem>
                  <MenuItem value="Giáo viên">Giáo viên</MenuItem>
                  <MenuItem value="Nhân viên văn phòng">Nhân viên văn phòng</MenuItem>
                  <MenuItem value="Nhân viên y tế">Nhân viên y tế</MenuItem>
                  <MenuItem value="Nhân viên bếp">Nhân viên bếp</MenuItem>
                  <MenuItem value="Khác">Khác</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {filteredStaff.length === 0 ? (
              <Box sx={{ p: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Không có nhân sự phù hợp với điều kiện tìm kiếm.
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 920 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã NV</TableCell>
                      <TableCell>Hình ảnh</TableCell>
                      <TableCell>Họ và tên</TableCell>
                      <TableCell sx={{ minWidth: 220 }}>Email</TableCell>
                      <TableCell>Chức vụ</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Số điện thoại</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Trạng thái</TableCell>
                      <TableCell align="right">Hành động</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStaff.map((item) => (
                      <TableRow key={item._id} hover>
                        <TableCell>{item.employeeId || '—'}</TableCell>
                        <TableCell>
                          <Avatar
                            variant="rounded"
                            src={item.user?.avatar || DEFAULT_STAFF_AVATAR_3X4}
                            alt={item.user?.fullName || 'Ảnh nhân sự'}
                            sx={{
                              width: 48,
                              height: 64,
                              borderRadius: 1.5,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: '#e2e8f0',
                              '& .MuiAvatar-img': { objectFit: 'cover' },
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.user?.fullName || '—'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{getStaffEmail(item)}</TableCell>
                        <TableCell>{item.position || '—'}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{item.user?.phone || '—'}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          {item.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Chỉnh sửa">
                            <IconButton size="small" onClick={() => handleOpenDialog('edit', item)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa nhân sự">
                            <IconButton size="small" color="error" onClick={() => handleRequestDelete(item)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'create' ? 'Thêm nhân sự mới' : 'Chỉnh sửa nhân sự'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={availableUsers}
              getOptionLabel={(option) => {
                const title = option.fullName || option.username || 'Người dùng';
                const meta = option.roleNames || option.phone || option.email || option.username;
                return `${title} • ${meta}`;
              }}
              value={availableUsers.find((u) => u._id === form.userId) || null}
              onChange={(_, value) => setForm((prev) => ({ ...prev, userId: value ? value._id : null }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Chọn người dùng"
                  error={!!formErrors.userId}
                  helperText={formErrors.userId}
                  size="small"
                />
              )}
              disabled={dialogMode === 'edit'}
              fullWidth
            />

            <FormControl fullWidth size="small" error={!!formErrors.position}>
              <InputLabel id="staff-position-label">Chức vụ</InputLabel>
              <Select
                labelId="staff-position-label"
                label="Chức vụ"
                value={form.position}
                onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
              >
                <MenuItem value="BGH">BGH</MenuItem>
                <MenuItem value="Giáo viên">Giáo viên</MenuItem>
                <MenuItem value="Nhân viên văn phòng">Nhân viên văn phòng</MenuItem>
                <MenuItem value="Nhân viên y tế">Nhân viên y tế</MenuItem>
                <MenuItem value="Nhân viên bếp">Nhân viên bếp</MenuItem>
                <MenuItem value="other">Khác</MenuItem>
              </Select>
              {formErrors.position && <Typography variant="caption" color="error">{formErrors.position}</Typography>}
            </FormControl>
            {form.position === 'other' && (
              <TextField
                label="Chức vụ khác"
                size="small"
                value={form.customPosition}
                onChange={(e) => setForm((prev) => ({ ...prev, customPosition: e.target.value }))}
                error={!!formErrors.customPosition}
                helperText={formErrors.customPosition}
                fullWidth
              />
            )}

            <FormControl fullWidth size="small">
              <InputLabel id="staff-status-label">Trạng thái</InputLabel>
              <Select
                labelId="staff-status-label"
                label="Trạng thái"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Không hoạt động</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saveLoading}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saveLoading}>
            {saveLoading ? 'Đang lưu...' : dialogMode === 'create' ? 'Lưu' : 'Cập nhật'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, item: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Xác nhận xóa nhân sự</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa nhân sự{' '}
            <strong>{deleteDialog.item?.user?.fullName || deleteDialog.item?.employeeId || 'này'}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })} disabled={saveLoading}>
            Hủy
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saveLoading}>
            {saveLoading ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}
