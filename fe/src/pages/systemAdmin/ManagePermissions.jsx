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
  Divider,
  Grid,
  Stack,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Shield as ShieldIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

function ManagePermissions() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]); // Tất cả permissions trong hệ thống
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState(new Set()); // Set of permission codes
  const [success, setSuccess] = useState('');
  const [showPermissionForm, setShowPermissionForm] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null); // Permission đang sửa
  const [permissionForm, setPermissionForm] = useState({ code: '', description: '' });
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const {
    getRoles,
    getPermissions,
    createPermission,
    updatePermission,
    deletePermission,
    updateRolePermissions,
    loading,
    error,
    setError,
  } = useSystemAdmin();

  useEffect(() => {
    // Chờ quá trình khởi tạo (verify token) hoàn thành
    if (isInitializing) {
      return;
    }

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
        const [rolesData, permissionsData] = await Promise.all([
          getRoles(),
          getPermissions(),
        ]);
        setRoles(rolesData || []);
        setPermissions(permissionsData || []);
      } catch (err) {
        // Error được xử lý trong context
      }
    };

    fetchData();
  }, [navigate, user, getRoles, getPermissions, setError, isInitializing]);

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      navigate('/system-admin');
    } else if (key === 'accounts') {
      navigate('/system-admin/manage-accounts');
    } else if (key === 'roles') {
      navigate('/system-admin/manage-roles');
    } else if (key === 'permissions') {
      navigate('/system-admin/manage-permissions');
    } else if (key === 'system-logs') {
      navigate('/system-admin/system-logs');
    } else {
      navigate('/system-admin');
    }
  };

  const menuItems = [
    { key: 'overview', label: 'Tổng quan hệ thống' },
    { key: 'schools', label: 'Quản lý trường' },
    { key: 'accounts', label: 'Quản lý tài khoản' },
    { key: 'roles', label: 'Quản lý vai trò' },
    { key: 'permissions', label: 'Quản lý phân quyền' },
    { key: 'system-logs', label: 'Nhật ký hệ thống' },
    { key: 'reports', label: 'Báo cáo tổng hợp' },
  ];

  const handleOpenPermissionForm = (permission = null) => {
    if (permission) {
      setEditingPermission(permission);
      setPermissionForm({
        code: permission.code || '',
        description: permission.description || '',
      });
    } else {
      setEditingPermission(null);
      setPermissionForm({ code: '', description: '' });
    }
    setError(null);
    setSuccess('');
    setShowPermissionForm(true);
  };

  const handleClosePermissionForm = () => {
    setShowPermissionForm(false);
    setEditingPermission(null);
    setPermissionForm({ code: '', description: '' });
    setError(null);
  };

  const handleSavePermission = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess('');

      const code = permissionForm.code.toUpperCase().trim();
      const description = permissionForm.description.trim();

      // Validate độ dài
      if (code.length < 3 || code.length > 64) {
        setError('Code phải có từ 3 đến 64 ký tự');
        return;
      }

      if (description.length === 0) {
        setError('Mô tả không được để trống');
        return;
      }

      if (description.length > 255) {
        setError('Mô tả không được vượt quá 255 ký tự');
        return;
      }

      // Chỉ cho phép định dạng ACTION_MODULE (chữ in hoa + _)
      const codePattern = /^[A-Z]+_[A-Z]+$/;
      if (!codePattern.test(code)) {
        setError(
          'Code chỉ được chứa chữ in hoa (A-Z) và dấu gạch dưới (_), theo định dạng ACTION_MODULE. Ví dụ: CREATE_USER'
        );
        return;
      }

      const payload = { code, description };

      if (editingPermission) {
        // Cập nhật permission
        await updatePermission(
          editingPermission._id || editingPermission.id,
          payload.code,
          payload.description
        );
        setSuccess('Cập nhật phân quyền thành công.');
      } else {
        // Tạo permission mới
        await createPermission(payload.code, payload.description);
        setSuccess('Tạo phân quyền thành công.');
      }

      setTimeout(() => setSuccess(''), 3000);
      handleClosePermissionForm();

      // Refresh permissions
      const permissionsData = await getPermissions();
      setPermissions(permissionsData || []);
    } catch (err) {
      // Error được xử lý trong context
    }
  };

  const handleDeletePermissionConfirmed = async (permissionId) => {
    try {
      setError(null);
      setSuccess('');
      await deletePermission(permissionId);
      setSuccess('Xóa phân quyền thành công.');
      setTimeout(() => setSuccess(''), 3000);

      // Refresh permissions
      const permissionsData = await getPermissions();
      setPermissions(permissionsData || []);

      // Nếu permission đang được chọn trong role, cập nhật lại
      if (selectedRole) {
        const rolePerms = new Set();
        (selectedRole.permissions || []).forEach((p) => {
          if (p && p.code && (p._id || p.id) !== permissionId) {
            rolePerms.add(typeof p === 'string' ? p : p.code);
          }
        });
        setSelectedPermissions(rolePerms);
      }
    } catch (err) {
      // Error được xử lý trong context
    }
  };

  const handleDeletePermission = (permissionId) => {
    setConfirmState({
      open: true,
      title: 'Xóa phân quyền',
      message: 'Bạn có chắc chắn muốn xóa phân quyền này?',
      onConfirm: () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        handleDeletePermissionConfirmed(permissionId);
      },
    });
  };

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    // Load permissions của role này
    const rolePerms = new Set();
    (role.permissions || []).forEach((p) => {
      if (p && p.code) {
        rolePerms.add(typeof p === 'string' ? p : p.code);
      }
    });
    setSelectedPermissions(rolePerms);
  };

  const togglePermission = (permCode) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permCode)) {
        next.delete(permCode);
      } else {
        next.add(permCode);
      }
      return next;
    });
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      setError(null);
      setSuccess('');

      const permissionCodes = Array.from(selectedPermissions);
      await updateRolePermissions(selectedRole.id || selectedRole._id, permissionCodes);

      setSuccess('Cập nhật phân quyền cho vai trò thành công.');
      setTimeout(() => setSuccess(''), 3000);

      // Refresh roles
      try {
        const rolesData = await getRoles();
        setRoles(rolesData || []);

        // Update selected role với dữ liệu mới
        const updatedRole = rolesData.find(
          (r) => (r.id || r._id) === (selectedRole.id || selectedRole._id)
        );
        if (updatedRole) {
          setSelectedRole(updatedRole);
          const rolePerms = new Set();
          (updatedRole.permissions || []).forEach((p) => {
            if (p && p.code) {
              rolePerms.add(typeof p === 'string' ? p : p.code);
            }
          });
          setSelectedPermissions(rolePerms);
        }
      } catch (refreshErr) {
        console.warn('Không thể refresh danh sách roles:', refreshErr);
      }
    } catch (err) {
      // Error được xử lý trong context
    }
  };

  const userName = user?.fullName || user?.username || 'System Admin';

  const handleViewProfile = () => {
    navigate('/profile');
  };

  return (
    <RoleLayout
      title="Quản lý phân quyền cho vai trò"
      description="Gán phân quyền (permissions) cho từng vai trò trong hệ thống."
      menuItems={menuItems}
      activeKey="permissions"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
    >
      {/* Alert messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Header Paper */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" fontWeight={700} color="white">
          Quản lý phân quyền
        </Typography>
        <Typography variant="body2" color="rgba(255,255,255,0.8)" mt={0.5}>
          Gán phân quyền (permissions) cho từng vai trò trong hệ thống.
        </Typography>
      </Paper>

      {/* Permissions list section */}
      <Paper elevation={1} sx={{ borderRadius: 2, p: 3, mb: 3 }}>
        {/* Section header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
              Danh sách phân quyền
            </Typography>
            <Chip
              label={`${permissions.length} phân quyền`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Stack>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleOpenPermissionForm()}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Thêm phân quyền
          </Button>
        </Stack>

        {/* Scrollable permissions list */}
        <Box
          sx={{
            maxHeight: 280,
            overflowY: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            p: 1,
          }}
        >
          {permissions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              Chưa có phân quyền nào.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {permissions.map((perm) => (
                <Box
                  key={perm._id || perm.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    bgcolor: 'grey.50',
                    '&:hover': { bgcolor: 'grey.100' },
                    transition: 'background-color 0.15s',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="text.primary"
                      noWrap
                      sx={{ fontFamily: 'monospace' }}
                    >
                      {perm.code}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mt: 0.25,
                      }}
                    >
                      {perm.description}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} sx={{ ml: 1.5, flexShrink: 0 }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenPermissionForm(perm)}
                      title="Sửa"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeletePermission(perm._id || perm.id)}
                      title="Xóa"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Paper>

      {/* Bottom two-column grid */}
      <Grid container spacing={3}>
        {/* Left: Role list */}
        <Grid item xs={12} lg={6}>
          <Paper elevation={1} sx={{ borderRadius: 2, p: 3, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.primary" mb={2}>
              Danh sách vai trò
            </Typography>
            {roles.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Chưa có vai trò nào.
              </Typography>
            ) : (
              <List disablePadding>
                {roles.map((role) => {
                  const roleId = role.id || role._id;
                  const isSelected =
                    selectedRole && (selectedRole.id || selectedRole._id) === roleId;
                  return (
                    <ListItemButton
                      key={roleId}
                      onClick={() => handleSelectRole(role)}
                      sx={{
                        borderRadius: 1.5,
                        mb: 1,
                        bgcolor: isSelected ? 'rgba(99,102,241,0.08)' : 'transparent',
                        borderLeft: isSelected ? '3px solid' : '3px solid transparent',
                        borderColor: isSelected ? 'primary.main' : 'transparent',
                        '&:hover': {
                          bgcolor: isSelected ? 'rgba(99,102,241,0.12)' : 'action.hover',
                        },
                        transition: 'all 0.15s',
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color={isSelected ? 'primary.main' : 'text.primary'}
                            noWrap
                          >
                            {role.roleName}
                          </Typography>
                        }
                        secondary={
                          <>
                            {role.description && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {role.description}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.disabled" display="block">
                              {role.permissions?.length || 0} phân quyền
                            </Typography>
                          </>
                        }
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Right: Permission assignment for selected role */}
        <Grid item xs={12} lg={6}>
          <Paper elevation={1} sx={{ borderRadius: 2, p: 3, height: '100%' }}>
            {selectedRole ? (
              <>
                {/* Role info header */}
                <Box mb={2}>
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    <Typography variant="subtitle2" fontWeight={600} color="text.primary" noWrap>
                      Phân quyền cho: {selectedRole.roleName}
                    </Typography>
                    <Chip
                      label={`${selectedPermissions.size}/${permissions.length} đã chọn`}
                      size="small"
                      color="primary"
                      variant="filled"
                    />
                  </Stack>
                  {selectedRole.description && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mt: 0.5,
                      }}
                    >
                      {selectedRole.description}
                    </Typography>
                  )}
                </Box>

                {/* Scrollable checkbox list */}
                <Box
                  sx={{
                    maxHeight: 384,
                    overflowY: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    p: 1,
                    mb: 2,
                  }}
                >
                  {permissions.length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 3, textAlign: 'center' }}
                    >
                      Chưa có phân quyền nào trong hệ thống.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {permissions.map((perm) => {
                        const isChecked = selectedPermissions.has(perm.code);
                        return (
                          <Box
                            key={perm._id || perm.id}
                            onClick={() => togglePermission(perm.code)}
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              p: 1.5,
                              borderRadius: 1.5,
                              cursor: 'pointer',
                              bgcolor: isChecked ? 'rgba(99,102,241,0.07)' : 'grey.50',
                              border: '1px solid',
                              borderColor: isChecked ? 'primary.main' : 'divider',
                              '&:hover': {
                                bgcolor: isChecked ? 'rgba(99,102,241,0.12)' : 'grey.100',
                              },
                              transition: 'all 0.15s',
                            }}
                          >
                            <Checkbox
                              checked={isChecked}
                              onChange={() => togglePermission(perm.code)}
                              size="small"
                              color="primary"
                              sx={{ p: 0, mr: 1.5, mt: 0.25, flexShrink: 0 }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                color={isChecked ? 'primary.main' : 'text.primary'}
                                noWrap
                                title={perm.code}
                                sx={{ fontFamily: 'monospace' }}
                              >
                                {perm.code}
                              </Typography>
                              {perm.description && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    mt: 0.25,
                                  }}
                                >
                                  {perm.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Box>

                {/* Save button */}
                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    disabled={loading}
                    onClick={handleSaveRolePermissions}
                    sx={{
                      bgcolor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.dark' },
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {loading ? 'Đang lưu...' : 'Lưu phân quyền'}
                  </Button>
                </Stack>
              </>
            ) : (
              /* Empty state */
              <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }} spacing={2}>
                <ShieldIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Vui lòng chọn một vai trò để quản lý phân quyền.
                </Typography>
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Add/Edit Permission Dialog */}
      <Dialog
        open={showPermissionForm}
        onClose={handleClosePermissionForm}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
            fontWeight: 700,
            fontSize: '1rem',
            pb: 2,
          }}
        >
          {editingPermission ? 'Sửa phân quyền' : 'Thêm phân quyền mới'}
        </DialogTitle>

        <Box component="form" onSubmit={handleSavePermission}>
          <DialogContent sx={{ pt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label={
                <span>
                  Code <span style={{ color: 'red' }}>*</span>
                </span>
              }
              value={permissionForm.code}
              onChange={(e) =>
                setPermissionForm({ ...permissionForm, code: e.target.value.toUpperCase() })
              }
              fullWidth
              required
              disabled={!!editingPermission}
              inputProps={{ maxLength: 64 }}
              placeholder="VD: CREATE_USER"
              helperText={
                editingPermission ? 'Không thể thay đổi code khi sửa' : undefined
              }
              sx={{ mb: 2 }}
              size="small"
            />

            <TextField
              label={
                <span>
                  Mô tả <span style={{ color: 'red' }}>*</span>
                </span>
              }
              value={permissionForm.description}
              onChange={(e) =>
                setPermissionForm({ ...permissionForm, description: e.target.value })
              }
              fullWidth
              required
              multiline
              rows={3}
              inputProps={{ maxLength: 255 }}
              placeholder="Mô tả phân quyền này (tối đa 255 ký tự)"
              size="small"
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              onClick={handleClosePermissionForm}
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
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' },
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 1.5,
              }}
            >
              {loading ? 'Đang lưu...' : editingPermission ? 'Cập nhật' : 'Tạo mới'}
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

export default ManagePermissions;
