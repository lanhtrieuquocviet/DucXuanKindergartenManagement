import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
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
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { toast } from 'react-toastify';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { get, post, put, postFormData, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';

const ROLE_TO_POSITION = {
  schooladmin: 'Ban Giám Hiệu',
  teacher: 'Giáo viên',
  kitchenstaff: 'Nhân viên nhà bếp',
  medicalstaff: 'Nhân viên y tế',
  headteacher: 'Tổ trưởng chuyên môn',
};

const ALLOWED_STAFF_ROLES = new Set([
  'schooladmin',
  'teacher',
  'kitchenstaff',
  'medicalstaff',
  'headteacher',
]);

const POSITION_OPTIONS = [
  'Ban Giám Hiệu',
  'Giáo viên',
  'Nhân viên văn phòng',
  'Nhân viên y tế',
  'Nhân viên nhà bếp',
  'Tổ trưởng chuyên môn',
];

const KNOWN_POSITIONS = new Set(Object.values(ROLE_TO_POSITION));

const EMPTY_FORM = {
  username: '',
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  position: '',
  customPosition: '',
  phone: '',
  status: 'active',
  userId: null,
};

const splitRoleNames = (roleNames) =>
  String(roleNames || '')
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);

const normalizeRoleName = (roleName) =>
  String(roleName || '')
    .toLowerCase()
    .replace(/[\s_-]/g, '');

const getPositionFromRoleNames = (roleNames) => {
  const roles = splitRoleNames(roleNames);
  for (const role of roles) {
    const normalizedRole = normalizeRoleName(role);
    if (ALLOWED_STAFF_ROLES.has(normalizedRole) && ROLE_TO_POSITION[normalizedRole]) {
      return ROLE_TO_POSITION[normalizedRole];
    }
  }
  return '';
};

const hasRole = (roleNames, targetRole) =>
  splitRoleNames(roleNames).some((role) => normalizeRoleName(role) === normalizeRoleName(targetRole));

const getFirstRoleName = (roleNames) => splitRoleNames(roleNames)[0] || '';

const POSITION_TO_ROLE_NAME = {
  'Ban Giám Hiệu': 'SchoolAdmin',
  'Giáo viên': 'Teacher',
  'Nhân viên y tế': 'MedicalStaff',
  'Nhân viên nhà bếp': 'KitchenStaff',
  'Nhân viên bếp': 'KitchenStaff',
  'Tổ trưởng chuyên môn': 'HeadTeacher',
};

const resolvePositionLabel = (item) => {
  if (item.position) {
    const mappedFromPosition = getPositionFromRoleNames(item.position);
    return mappedFromPosition || item.position;
  }
  return getPositionFromRoleNames(item.roleNames) || getFirstRoleName(item.roleNames) || 'Nhân viên văn phòng';
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
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
  }, [isInitializing, navigate, user, hasRole]);

  const loadStaff = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await get(ENDPOINTS.SCHOOL_ADMIN.STAFF_USERS);
      const staffUsers = response.data || [];
      const mappedUsers = staffUsers
        .filter((item) => !hasRole(item.roleNames, 'Parent') && !hasRole(item.roleNames, 'SystemAdmin'))
        .map((item) => ({
          _id: item._id,
          employeeId: item.username || '—',
          position: getPositionFromRoleNames(item.roleNames) || 'Nhân viên văn phòng',
          status: item.status || 'inactive',
          roleNames: item.roleNames || '',
          user: {
            _id: item._id,
            fullName: item.fullName,
            email: item.email,
            phone: item.phone,
            avatar: item.avatar,
            status: item.status,
            roleNames: item.roleNames || '',
          },
        }));
      setStaff(mappedUsers);
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Lỗi khi tải danh sách nhân sự';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStaff();
    setRefreshing(false);
  };

  const handleOpenDialog = (mode = 'create', staffItem = null) => {
    setDialogMode(mode);
    setFormErrors({});
    setAvatarFile(null);
    setAvatarPreview('');
    setShowPassword(false);
    setShowConfirmPassword(false);

    if (mode === 'edit' && staffItem) {
      setSelectedStaffId(staffItem._id);
      const existingPosition = resolvePositionLabel(staffItem);
      const isKnownPosition = POSITION_OPTIONS.includes(existingPosition);
      setForm({
        username: staffItem.employeeId || '',
        fullName: staffItem.user?.fullName || staffItem.fullName || '',
        email: staffItem.user?.email || staffItem.email || '',
        password: '',
        confirmPassword: '',
        position: isKnownPosition ? existingPosition : 'other',
        customPosition: isKnownPosition ? '' : existingPosition,
        phone: staffItem.user?.phone || staffItem.phone || '',
        status: staffItem.status || 'active',
        userId: staffItem.user?._id || null,
      });
      setAvatarPreview(staffItem.avatar || staffItem.user?.avatar || '');
    } else {
      setSelectedStaffId(null);
      setForm(EMPTY_FORM);
    }

    setDialogOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    const selectedPosition = form.position === 'other' ? form.customPosition.trim() : form.position.trim();
    const normalizedPhone = String(form.phone || '').replace(/\s+/g, '');

    if (!form.position.trim()) errors.position = 'Chức vụ bắt buộc';
    if (form.position === 'other' && !selectedPosition) {
      errors.customPosition = 'Vui lòng nhập chức vụ khác';
    }
    if (dialogMode === 'create' && !normalizedPhone) {
      errors.phone = 'Số điện thoại bắt buộc';
    }
    if (normalizedPhone && !/^[0-9]{9,11}$/.test(normalizedPhone)) {
      errors.phone = 'Số điện thoại không hợp lệ (9-11 chữ số)';
    }

    if (dialogMode === 'create') {
      const username = (form.username || '').trim();
      const fullName = (form.fullName || '').trim();
      const email = (form.email || '').trim();
      const password = form.password || '';
      const confirmPassword = form.confirmPassword || '';

      if (!username) errors.username = 'Tên tài khoản bắt buộc';
      else if (/[\s]/.test(username) || /[^A-Za-z0-9]/.test(username)) {
        errors.username = 'Tên tài khoản không chứa khoảng trắng/ký tự đặc biệt';
      }
      if (!fullName) errors.fullName = 'Họ và tên bắt buộc';
      if (!email) errors.email = 'Email bắt buộc';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email không hợp lệ';
      if (!password) errors.password = 'Mật khẩu bắt buộc';
      else if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/.test(password)) {
        errors.password = 'Mật khẩu cần chữ hoa, số, ký tự đặc biệt và >= 6 ký tự';
      }
      if (!confirmPassword) errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
      else if (password !== confirmPassword) errors.confirmPassword = 'Xác nhận mật khẩu không khớp';
      if (!selectedPosition) errors.position = 'Vui lòng chọn chức vụ';
    }
    return errors;
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP).');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
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
        phone: String(form.phone || '').replace(/\s+/g, ''),
        status: form.status,
      };

      // Upload avatar nếu có file mới
      if (avatarFile && dialogMode === 'edit') {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const uploadResponse = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_AVATAR, formData);
        if (uploadResponse.data?.url) {
          payload.avatar = uploadResponse.data.url;
        }
      }

      if (dialogMode === 'create') {
        const roleName = POSITION_TO_ROLE_NAME[payload.position] || payload.position;
        await post('/school-admin/users', {
          username: form.username.trim(),
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: payload.phone,
          status: payload.status,
          roleName,
        });
        toast.success('Tạo tài khoản nhân sự thành công');
      } else {
        // Update user via school-admin endpoint
        const userUpdatePayload = {
          status: form.status,
          phone: payload.phone,
        };
        userUpdatePayload.roleName = POSITION_TO_ROLE_NAME[payload.position] || payload.position;
        if (payload.avatar) {
          userUpdatePayload.avatar = payload.avatar;
        }
        await put(`/school-admin/users/${form.userId}`, userUpdatePayload);
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
      await put(`/school-admin/users/${item._id}`, { status: 'inactive' });
      await loadStaff();
      toast.success('Đã vô hiệu hóa tài khoản nhân sự');
      setDeleteDialog({ open: false, item: null });
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Lỗi khi cập nhật trạng thái nhân sự');
    } finally {
      setSaveLoading(false);
    }
  };

  const getDisplayPosition = (item) => resolvePositionLabel(item);

  const getStaffEmail = (item) => {
    return item?.user?.email || item?.email || '—';
  };

  const filteredStaff = useMemo(() => {
    const searchTerm = searchName.trim().toLowerCase();
    return staff.filter((item) => {
      const fullName = String(item.user?.fullName || item.fullName || '').toLowerCase();
      const position = String(resolvePositionLabel(item));
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
            <Button
              variant="contained"
              onClick={() => handleOpenDialog('create')}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              + Thêm nhân sự
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
                  <MenuItem value="Ban Giám Hiệu">Ban Giám Hiệu</MenuItem>
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
                      <TableCell>Tên tài khoản</TableCell>
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
                            src={item.avatar || item.user?.avatar || DEFAULT_STAFF_AVATAR_3X4}
                            alt={item.user?.fullName || item.fullName || 'Ảnh nhân sự'}
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
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.user?.fullName || item.fullName || '—'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{getStaffEmail(item)}</TableCell>
                        <TableCell>{resolvePositionLabel(item) || '—'}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{item.user?.phone || item.phone || '—'}</TableCell>
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
            {dialogMode === 'create' && (
              <>
                <TextField
                  label="Tên tài khoản"
                  size="small"
                  value={form.username}
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                  error={!!formErrors.username}
                  helperText={formErrors.username}
                  fullWidth
                />
                <TextField
                  label="Họ và tên"
                  size="small"
                  value={form.fullName}
                  onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  error={!!formErrors.fullName}
                  helperText={formErrors.fullName}
                  fullWidth
                />
                <TextField
                  label="Email"
                  size="small"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  fullWidth
                />
                <TextField
                  label="Mật khẩu"
                  size="small"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton edge="end" onClick={() => setShowPassword((prev) => !prev)}>
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                />
                <TextField
                  label="Xác nhận mật khẩu"
                  size="small"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  error={!!formErrors.confirmPassword}
                  helperText={formErrors.confirmPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton edge="end" onClick={() => setShowConfirmPassword((prev) => !prev)}>
                          {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                />
                <TextField
                  label="Số điện thoại"
                  size="small"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  error={!!formErrors.phone}
                  helperText={formErrors.phone}
                  fullWidth
                />
              </>
            )}
            
            {dialogMode === 'edit' && (
              <Box>
                <Typography variant="subtitle2" fontSize={12} fontWeight={600} sx={{ mb: 1 }}>Ảnh đại diện</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Avatar
                    variant="rounded"
                    src={avatarPreview}
                    alt="Avatar"
                    sx={{
                      width: 80,
                      height: 107,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: '#e2e8f0',
                      '& .MuiAvatar-img': { objectFit: 'cover' },
                    }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    component="label"
                    sx={{ textTransform: 'none' }}
                  >
                    Chọn ảnh
                    <input type="file" accept="image/*" hidden onChange={handleAvatarSelect} />
                  </Button>
                </Box>
              </Box>
            )}

            {dialogMode === 'edit' && (
              <TextField
                label="Số điện thoại"
                size="small"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                error={!!formErrors.phone}
                helperText={formErrors.phone}
                fullWidth
              />
            )}

            <FormControl fullWidth size="small" error={!!formErrors.position}>
              <InputLabel id="staff-position-label">Chức vụ</InputLabel>
              <Select
                labelId="staff-position-label"
                label="Chức vụ"
                value={form.position}
                onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
              >
                <MenuItem value="Ban Giám Hiệu">Ban Giám Hiệu</MenuItem>
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
