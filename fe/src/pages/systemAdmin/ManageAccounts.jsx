import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSystemAdmin } from '../../context/SystemAdminContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Checkbox,
  Stack,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  useMediaQuery,
  useTheme,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ManageAccounts as ManageAccountsIcon,
} from '@mui/icons-material';

function ManageAccounts() {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdDown = useMediaQuery(theme.breakpoints.down('md'));

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [success, setSuccess] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [usernameHint, setUsernameHint] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });
  const [userForm, setUserForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    status: 'active',
    roleIds: [],
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const {
    getUsers,
    getRoles,
    createUser,
    updateUser,
    deleteUser,
    loading,
    error,
    setError,
  } = useSystemAdmin();

  useEffect(() => {
    if (isInitializing) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('SystemAdmin')) {
      navigate('/', { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        setError(null);
        const [usersData, rolesData] = await Promise.all([getUsers(), getRoles()]);
        setUsers(usersData || []);
        setRoles(rolesData || []);
      } catch (err) {
        // Error được xử lý trong context
      }
    };

    fetchData();
  }, [navigate, user, getUsers, getRoles, setError, isInitializing]);

  const menuItems = [
    { key: 'overview', label: 'Tổng quan hệ thống' },
    { key: 'schools', label: 'Quản lý trường' },
    { key: 'accounts', label: 'Quản lý tài khoản' },
    { key: 'roles', label: 'Quản lý vai trò' },
    { key: 'permissions', label: 'Quản lý phân quyền' },
    { key: 'system-logs', label: 'Nhật ký hệ thống' },
    { key: 'reports', label: 'Báo cáo tổng hợp' },
  ];

  const handleMenuSelect = (key) => {
    if (key === 'overview') navigate('/system-admin');
    else if (key === 'accounts') navigate('/system-admin/manage-accounts');
    else if (key === 'roles') navigate('/system-admin/manage-roles');
    else if (key === 'permissions') navigate('/system-admin/manage-permissions');
    else if (key === 'system-logs') navigate('/system-admin/system-logs');
    else navigate('/system-admin');
  };

  const handleOpenUserForm = (account = null) => {
    setSaveErrorMessage('');
    setError(null);
    if (account) {
      setEditingUser(account);
      setUserForm({
        username: account.username || '',
        fullName: account.fullName || '',
        email: account.email || '',
        password: '',
        confirmPassword: '',
        status: account.status || 'active',
        roleIds: (account.roles || []).map((r) => r._id || r.id).filter(Boolean),
      });
    } else {
      setEditingUser(null);
      setUserForm({
        username: '',
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        status: 'active',
        roleIds: [],
      });
    }
    setShowUserForm(true);
  };

  const handleCloseUserForm = () => {
    setSaveErrorMessage('');
    setShowUserForm(false);
    setEditingUser(null);
    setUsernameHint('');
    setPasswordHint('');
    setError(null);
    setUserForm({
      username: '',
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      status: 'active',
      roleIds: [],
    });
  };

  const handleToggleRole = (roleId) => {
    setUserForm((prev) => {
      const ids = prev.roleIds || [];
      const has = ids.includes(roleId);
      if (has) return { ...prev, roleIds: ids.filter((id) => id !== roleId) };
      return { ...prev, roleIds: [...ids, roleId] };
    });
  };

  const handleChangeField = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'username') {
      if (value && (/[\s]/.test(value) || /[^A-Za-z0-9]/.test(value))) {
        setUsernameHint('Tài khoản không được chứa khoảng trắng và ký tự đặc biệt.');
      } else {
        setUsernameHint('');
      }
    }
    if (name === 'password') {
      const hasUpper = /[A-Z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[^A-Za-z0-9]/.test(value);
      if (value && (!hasUpper || !hasNumber || !hasSpecial)) {
        setPasswordHint('Mật khẩu phải có ít nhất 1 chữ cái viết hoa, 1 số và 1 ký tự đặc biệt.');
      } else {
        setPasswordHint('');
      }
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess('');
      setSaveErrorMessage('');

      const usernameTrimmed = (userForm.username || '').trim();
      if (/[\s]/.test(usernameTrimmed) || /[^A-Za-z0-9]/.test(usernameTrimmed)) {
        const msg = 'Tài khoản không được chứa khoảng trắng và ký tự đặc biệt.';
        setSaveErrorMessage(msg);
        return;
      }

      if (userForm.password || !editingUser) {
        if (!userForm.password) {
          const msg = 'Vui lòng nhập mật khẩu cho tài khoản mới.';
          setSaveErrorMessage(msg);
          return;
        }
        if (userForm.password !== userForm.confirmPassword) {
          const msg = 'Mật khẩu và xác nhận mật khẩu không khớp.';
          setSaveErrorMessage(msg);
          return;
        }
        const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
        if (!strongPasswordRegex.test(userForm.password)) {
          const msg =
            'Mật khẩu phải có ít nhất 1 chữ cái viết hoa, 1 số và 1 ký tự đặc biệt, tối thiểu 6 ký tự.';
          setSaveErrorMessage(msg);
          return;
        }
      }

      if (!editingUser) {
        const payload = {
          username: usernameTrimmed,
          password: userForm.password,
          fullName: userForm.fullName.trim(),
          email: userForm.email.trim(),
          status: userForm.status,
          roleIds: userForm.roleIds || [],
        };
        await createUser(payload);
        setSuccess('Tạo tài khoản thành công.');
      } else {
        const payload = {
          username: usernameTrimmed,
          fullName: userForm.fullName.trim(),
          email: userForm.email.trim(),
          status: userForm.status,
          roleIds: userForm.roleIds || [],
        };
        if (userForm.password) payload.password = userForm.password;
        await updateUser(editingUser._id || editingUser.id, payload);
        setSuccess('Cập nhật tài khoản thành công.');
      }

      setTimeout(() => setSuccess(''), 3000);
      handleCloseUserForm();

      const refreshedUsers = await getUsers();
      setUsers(refreshedUsers || []);
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Có lỗi khi lưu tài khoản.';
      setSaveErrorMessage(msg);
    }
  };

  const handleDeleteAccount = (account) => {
    setConfirmState({
      open: true,
      title: 'Xóa tài khoản?',
      message: `Bạn có chắc chắn muốn xóa (khóa) tài khoản "${account.username}"? Tài khoản sẽ bị khóa và người dùng sẽ không thể đăng nhập, nhưng dữ liệu vẫn được giữ trong hệ thống.`,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        try {
          setError(null);
          setSuccess('');
          await deleteUser(account._id || account.id);
          setSuccess('Tài khoản đã được khóa (xóa mềm) thành công.');
          setTimeout(() => setSuccess(''), 3000);
          const refreshedUsers = await getUsers();
          setUsers(refreshedUsers || []);
        } catch (err) {
          // Error đã được xử lý trong context
        }
      },
    });
  };

  const paginatedUsers = users.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const renderRoleNames = (account) => {
    const roleNames = (account.roles || [])
      .map((r) => r.roleName || (typeof r === 'string' ? r : ''))
      .filter(Boolean);
    if (roleNames.length === 0) return <Typography variant="caption" color="text.disabled">Chưa gán vai trò</Typography>;
    return roleNames.map((name) => (
      <Chip key={name} label={name} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.25 }} />
    ));
  };

  const userName = user?.fullName || user?.username || 'System Admin';

  return (
    <RoleLayout
      title="Quản lý tài khoản"
      description="Thêm, sửa, xóa tài khoản và gán vai trò trong hệ thống."
      menuItems={menuItems}
      activeKey="accounts"
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {/* Alert messages */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Header Paper */}
      <Paper
        elevation={0}
        sx={{
          mb: { xs: 2, sm: 3 },
          p: { xs: 2, sm: 3 },
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" fontWeight={700} color="white" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          Quản lý tài khoản
        </Typography>
        <Typography variant="body2" color="rgba(255,255,255,0.8)" mt={0.5}>
          Thêm, sửa, xóa tài khoản và gán vai trò trong hệ thống.
        </Typography>
      </Paper>

      {/* Accounts table */}
      <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Table header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={{ xs: 1.5, sm: 0 }}
          sx={{ px: { xs: 2, sm: 3 }, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
            <Typography variant="subtitle2" fontWeight={600}>
              Danh sách tài khoản
            </Typography>
            <Chip
              label={`${users.length} tài khoản`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Stack>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleOpenUserForm()}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            Thêm tài khoản
          </Button>
        </Stack>

        <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Table size="small" sx={{ minWidth: isMdDown ? 640 : undefined }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 }, px: { xs: 1.5, sm: 2 }, whiteSpace: 'nowrap' }}>Tài khoản</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 }, px: { xs: 1.5, sm: 2 }, whiteSpace: 'nowrap' }}>Họ và tên</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 }, px: { xs: 1.5, sm: 2 }, display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 }, px: { xs: 1.5, sm: 2 }, display: { xs: 'none', lg: 'table-cell' } }}>Vai trò</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 }, px: { xs: 1.5, sm: 2 }, whiteSpace: 'nowrap' }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 }, px: { xs: 1, sm: 2 }, whiteSpace: 'nowrap' }}>
                  Thao tác
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    Chưa có tài khoản nào trong hệ thống.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((account) => {
                  const userId = account._id || account.id;
                  const isActive = account.status === 'active';
                  return (
                    <TableRow
                      key={userId}
                      hover
                      sx={{ '&:last-child td': { border: 0 } }}
                    >
                      <TableCell sx={{ px: { xs: 1.5, sm: 2 }, maxWidth: { xs: 100, sm: 'none' } }}>
                        <Typography variant="body2" fontWeight={600} noWrap title={account.username}>
                          {account.username}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ px: { xs: 1.5, sm: 2 }, maxWidth: { xs: 100, sm: 'none' } }}>
                        <Typography variant="body2" color={account.fullName ? 'text.primary' : 'text.disabled'} noWrap title={account.fullName || 'Chưa cập nhật'}>
                          {account.fullName || 'Chưa cập nhật'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ px: { xs: 1.5, sm: 2 }, display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }} title={account.email}>
                          {account.email}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ px: { xs: 1.5, sm: 2 }, display: { xs: 'none', lg: 'table-cell' } }}>{renderRoleNames(account)}</TableCell>
                      <TableCell sx={{ px: { xs: 1.5, sm: 2 } }}>
                        <Chip
                          label={isActive ? 'Đang hoạt động' : 'Đã khóa'}
                          size="small"
                          color={isActive ? 'success' : 'error'}
                          variant="filled"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ px: { xs: 1, sm: 2 } }}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenUserForm(account)}
                            title="Sửa"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={loading}
                            onClick={() => handleDeleteAccount(account)}
                            title="Xóa"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {users.length > 0 && (
          <TablePagination
            component="div"
            count={users.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Số dòng/trang:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              flexWrap: 'wrap',
              '& .MuiTablePagination-toolbar': {
                flexWrap: 'wrap',
                minHeight: { xs: 52, sm: 52 },
                px: { xs: 1.5, sm: 2 },
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
              },
            }}
          />
        )}
      </Paper>

      {/* Add/Edit User Dialog */}
      <Dialog
        open={showUserForm}
        onClose={handleCloseUserForm}
        maxWidth="sm"
        fullWidth
        fullScreen={isSmDown}
        PaperProps={{ sx: { borderRadius: isSmDown ? 0 : 2 } }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          {editingUser ? 'Sửa tài khoản' : 'Thêm tài khoản mới'}
        </DialogTitle>

        <Box component="form" onSubmit={handleSaveUser}>
          <DialogContent sx={{ pt: 3 }}>
            {saveErrorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {saveErrorMessage}
              </Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label={<span>Tài khoản <span style={{ color: 'red' }}>*</span></span>}
                name="username"
                value={userForm.username}
                onChange={handleChangeField}
                required
                size="small"
                placeholder="VD: schooladmin01"
                helperText={usernameHint || undefined}
                FormHelperTextProps={{ sx: { color: 'warning.main' } }}
                inputProps={{ autoComplete: 'off' }}
              />

              <TextField
                label="Họ và tên"
                name="fullName"
                value={userForm.fullName}
                onChange={handleChangeField}
                size="small"
                placeholder="Nhập họ và tên"
              />

              <TextField
                label={<span>Email <span style={{ color: 'red' }}>*</span></span>}
                name="email"
                type="email"
                value={userForm.email}
                onChange={handleChangeField}
                required
                size="small"
                placeholder="VD: example@gmail.com"
              />

              <FormControl size="small">
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  name="status"
                  value={userForm.status}
                  label="Trạng thái"
                  onChange={handleChangeField}
                >
                  <MenuItem value="active">Đang hoạt động</MenuItem>
                  <MenuItem value="inactive">Đã khóa</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label={
                  editingUser ? (
                    'Mật khẩu (để trống nếu không đổi)'
                  ) : (
                    <span>Mật khẩu <span style={{ color: 'red' }}>*</span></span>
                  )
                }
                name="password"
                type="password"
                value={userForm.password}
                onChange={handleChangeField}
                required={!editingUser}
                size="small"
                placeholder={editingUser ? 'Để trống nếu giữ nguyên' : 'Nhập mật khẩu'}
                helperText={passwordHint || undefined}
                FormHelperTextProps={{ sx: { color: 'warning.main' } }}
                inputProps={{ autoComplete: 'new-password' }}
              />

              <TextField
                label={
                  editingUser ? (
                    'Xác nhận mật khẩu'
                  ) : (
                    <span>Xác nhận mật khẩu <span style={{ color: 'red' }}>*</span></span>
                  )
                }
                name="confirmPassword"
                type="password"
                value={userForm.confirmPassword}
                onChange={handleChangeField}
                required={!editingUser}
                size="small"
                placeholder="Nhập lại mật khẩu"
                inputProps={{ autoComplete: 'new-password' }}
              />
            </Box>

            {/* Roles */}
            <Box mt={2.5}>
              <Typography variant="body2" fontWeight={600} color="text.primary" mb={1}>
                Vai trò (có thể chọn nhiều)
              </Typography>
              {roles.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  Chưa có vai trò nào. Vui lòng tạo vai trò trước.
                </Typography>
              ) : (
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    p: 1,
                    maxHeight: 180,
                    overflowY: 'auto',
                  }}
                >
                  <Stack spacing={0.5}>
                    {roles.map((role) => {
                      const roleId = role.id || role._id;
                      const checked = (userForm.roleIds || []).includes(roleId);
                      return (
                        <Box
                          key={roleId}
                          onClick={() => handleToggleRole(roleId)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 1.5,
                            cursor: 'pointer',
                            bgcolor: checked ? 'rgba(99,102,241,0.07)' : 'transparent',
                            border: '1px solid',
                            borderColor: checked ? 'primary.main' : 'transparent',
                            '&:hover': { bgcolor: checked ? 'rgba(99,102,241,0.12)' : 'grey.50' },
                            transition: 'all 0.15s',
                          }}
                        >
                          <Checkbox
                            checked={checked}
                            onChange={() => handleToggleRole(roleId)}
                            size="small"
                            color="primary"
                            sx={{ p: 0, flexShrink: 0 }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color={checked ? 'primary.main' : 'text.primary'}
                          >
                            {role.roleName}
                          </Typography>
                          {role.description && (
                            <Typography variant="caption" color="text.secondary">
                              ({role.description})
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2.5, flexWrap: 'wrap', gap: 1 }}>
            <Button
              onClick={handleCloseUserForm}
              variant="outlined"
              color="inherit"
              sx={{ textTransform: 'none', borderRadius: 1.5 }}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 1.5,
              }}
            >
              {loading ? 'Đang lưu...' : editingUser ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmState.onConfirm}
      />
    </RoleLayout>
  );
}

export default ManageAccounts;
