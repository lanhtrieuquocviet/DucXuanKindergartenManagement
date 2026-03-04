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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Checkbox,
  FormControlLabel,
  Divider,
  CircularProgress,
  Stack,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  VpnKey as PermIcon,
} from '@mui/icons-material';

function ManageRoles() {
  const [roles, setRoles] = useState([]);
  const [success, setSuccess] = useState('');
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null); // Role đang sửa
  const [roleForm, setRoleForm] = useState({ roleName: '', description: '' });
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
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
    createRole,
    updateRole,
    deleteRole,
    getPermissions,
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

    const fetchRoles = async () => {
      try {
        setError(null);
        const rolesData = await getRoles();
        setRoles(rolesData || []);
      } catch (err) {
        // Error được xử lý trong context
      }
    };

    fetchRoles();
  }, [navigate, user, getRoles, setError, isInitializing]);

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

  const handleOpenRoleForm = (role = null) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        roleName: role.roleName || '',
        description: role.description || '',
      });
    } else {
      setEditingRole(null);
      setRoleForm({ roleName: '', description: '' });
    }
    setError(null);
    setShowRoleForm(true);
  };

  const handleCloseRoleForm = () => {
    setShowRoleForm(false);
    setEditingRole(null);
    setRoleForm({ roleName: '', description: '' });
    setError(null);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess('');

      const roleName = roleForm.roleName.trim();
      const description = (roleForm.description || '').trim();

      // Validate độ dài tên vai trò
      if (roleName.length < 3 || roleName.length > 32) {
        setError('Tên vai trò phải có từ 3 đến 32 ký tự');
        return;
      }

      // Chỉ cho phép chữ cái và số, bắt đầu bằng chữ cái, không khoảng trắng/ký tự đặc biệt
      const namePattern = /^[A-Za-z][A-Za-z0-9]*$/;
      if (!namePattern.test(roleName)) {
        setError(
          'Tên vai trò chỉ được chứa chữ cái và số, bắt đầu bằng chữ cái, không có khoảng trắng hoặc ký tự đặc biệt. Ví dụ: Teacher, SchoolAdmin'
        );
        return;
      }

      if (description.length > 255) {
        setError('Mô tả vai trò không được vượt quá 255 ký tự');
        return;
      }

      if (editingRole) {
        // Cập nhật role
        await updateRole(editingRole.id || editingRole._id, roleName, description);
        setSuccess('Cập nhật vai trò thành công.');
      } else {
        // Tạo role mới
        await createRole(roleName, description);
        setSuccess('Tạo vai trò thành công.');
      }

      setTimeout(() => setSuccess(''), 3000);
      handleCloseRoleForm();

      // Refresh roles
      const rolesData = await getRoles();
      setRoles(rolesData || []);
    } catch (err) {
      // Error được xử lý trong context
    }
  };

  const handleDeleteRoleConfirmed = async (roleId) => {
    try {
      setError(null);
      setSuccess('');
      await deleteRole(roleId);
      setSuccess('Xóa vai trò thành công.');
      setTimeout(() => setSuccess(''), 3000);

      // Refresh roles
      const rolesData = await getRoles();
      setRoles(rolesData || []);
    } catch (err) {
      // Error được xử lý trong context
    }
  };

  const handleDeleteRole = (roleId) => {
    setConfirmState({
      open: true,
      title: 'Xóa vai trò',
      message: 'Bạn có chắc chắn muốn xóa vai trò này? Vai trò sẽ không thể khôi phục.',
      onConfirm: () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        handleDeleteRoleConfirmed(roleId);
      },
    });
  };

  const userName = user?.fullName || user?.username || 'System Admin';

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const handleOpenPermissionModal = async (role) => {
    try {
      setError(null);
      setSelectedRoleForPermissions(role);

      // Lấy danh sách tất cả permissions
      const allPermissions = await getPermissions();
      setPermissions(allPermissions || []);

      // Lấy permissions hiện tại của role
      const rolePerms = new Set();
      (role.permissions || []).forEach((p) => {
        if (p && p.code) {
          rolePerms.add(typeof p === 'string' ? p : p.code);
        }
      });
      setSelectedPermissions(rolePerms);

      setShowPermissionModal(true);
    } catch (err) {
      // Error được xử lý trong context
    }
  };

  const handleClosePermissionModal = () => {
    setShowPermissionModal(false);
    setSelectedRoleForPermissions(null);
    setSelectedPermissions(new Set());
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
    if (!selectedRoleForPermissions) return;

    try {
      setError(null);
      setSuccess('');

      const permissionCodes = Array.from(selectedPermissions);
      await updateRolePermissions(
        selectedRoleForPermissions.id || selectedRoleForPermissions._id,
        permissionCodes
      );

      setSuccess('Cập nhật phân quyền cho vai trò thành công.');
      setTimeout(() => setSuccess(''), 3000);

      handleClosePermissionModal();

      // Refresh roles
      const rolesData = await getRoles();
      setRoles(rolesData || []);
    } catch (err) {
      // Error được xử lý trong context
    }
  };

  return (
    <RoleLayout
      title="Quản lý vai trò"
      description="Thêm, sửa, xóa các vai trò trong hệ thống."
      menuItems={menuItems}
      activeKey="roles"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
    >
      {/* Error / Success alerts */}
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

      {/* Header banner */}
      <Paper
        elevation={3}
        sx={{
          mb: 3,
          p: 3,
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SecurityIcon sx={{ color: 'white', fontSize: 36 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} color="white">
              Quản lý vai trò
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
              Thêm, sửa, xóa các vai trò trong hệ thống
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenRoleForm()}
          sx={{
            bgcolor: 'white',
            color: '#4f46e5',
            fontWeight: 700,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
            boxShadow: 2,
          }}
        >
          Thêm vai trò
        </Button>
      </Paper>

      {/* Main card with roles table */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            Danh sách vai trò
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    bgcolor: 'grey.50',
                    fontWeight: 700,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: 'text.secondary',
                  }}
                >
                  Tên vai trò
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: 'grey.50',
                    fontWeight: 700,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: 'text.secondary',
                  }}
                >
                  Mô tả
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: 'grey.50',
                    fontWeight: 700,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: 'text.secondary',
                  }}
                >
                  Số phân quyền
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    bgcolor: 'grey.50',
                    fontWeight: 700,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: 'text.secondary',
                  }}
                >
                  Thao tác
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Chưa có vai trò nào. Hãy thêm vai trò mới.
                  </TableCell>
                </TableRow>
              )}
              {roles.map((role) => {
                const roleId = role.id || role._id;
                return (
                  <TableRow
                    key={roleId}
                    hover
                    sx={{ '&:last-child td': { borderBottom: 0 } }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary', maxWidth: 180 }}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        noWrap
                        title={role.roleName}
                      >
                        {role.roleName}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        title={role.description || 'Không có mô tả'}
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {role.description || (
                          <Box component="span" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                            Không có mô tả
                          </Box>
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          cursor: 'pointer',
                          color: 'text.secondary',
                          '&:hover': { color: 'primary.main' },
                          transition: 'color 0.2s',
                        }}
                        onClick={() => handleOpenPermissionModal(role)}
                        title="Click để sửa phân quyền"
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {role.permissions?.length || 0}
                        </Typography>
                        <IconButton
                          size="small"
                          sx={{ p: 0.25, color: 'inherit' }}
                          tabIndex={-1}
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenRoleForm(role)}
                          sx={{
                            fontSize: 12,
                            borderColor: 'primary.light',
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.50', borderColor: 'primary.main' },
                          }}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={
                            loading ? (
                              <CircularProgress size={12} color="error" />
                            ) : (
                              <DeleteIcon />
                            )
                          }
                          onClick={() => handleDeleteRole(roleId)}
                          disabled={loading}
                          sx={{
                            fontSize: 12,
                            borderColor: 'error.light',
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.50', borderColor: 'error.main' },
                          }}
                        >
                          Xóa
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog: Form thêm/sửa role */}
      <Dialog
        open={showRoleForm}
        onClose={handleCloseRoleForm}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden' } }}
      >
        {/* Gradient header replacing DialogTitle */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <SecurityIcon sx={{ color: 'white', fontSize: 24 }} />
          <Typography variant="h6" fontWeight={700} color="white">
            {editingRole ? 'Sửa vai trò' : 'Thêm vai trò mới'}
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSaveRole}>
          <DialogContent sx={{ pt: 3, pb: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>
                {error}
              </Alert>
            )}

            <TextField
              label={
                <>
                  Tên vai trò{' '}
                  <Box component="span" sx={{ color: 'error.main' }}>
                    *
                  </Box>
                </>
              }
              value={roleForm.roleName}
              onChange={(e) => setRoleForm({ ...roleForm, roleName: e.target.value })}
              fullWidth
              required
              inputProps={{ maxLength: 32 }}
              placeholder="VD: Teacher, SchoolAdmin"
              size="small"
              sx={{ mb: 2.5 }}
            />

            <TextField
              label="Mô tả"
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              inputProps={{ maxLength: 255 }}
              placeholder="Mô tả vai trò này (tối đa 255 ký tự)"
              size="small"
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button
              onClick={handleCloseRoleForm}
              variant="outlined"
              color="inherit"
              sx={{ color: 'text.secondary', borderColor: 'divider' }}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, fontWeight: 700 }}
            >
              {loading ? 'Đang lưu...' : editingRole ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Dialog: Quản lý phân quyền cho vai trò */}
      <Dialog
        open={showPermissionModal && !!selectedRoleForPermissions}
        onClose={handleClosePermissionModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            maxHeight: '90vh',
          },
        }}
      >
        {/* Gradient header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <PermIcon sx={{ color: 'white', fontSize: 24 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} color="white" noWrap>
              Quản lý phân quyền
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.25 }}
              noWrap
              title={selectedRoleForPermissions?.roleName}
            >
              Vai trò: {selectedRoleForPermissions?.roleName}
            </Typography>
          </Box>
          <Chip
            label={`${selectedPermissions.size} / ${permissions.length}`}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 700,
              fontSize: 12,
            }}
          />
        </Box>

        <DialogContent
          sx={{
            p: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ px: 3, py: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              Đã chọn:{' '}
              <Box component="span" fontWeight={700} color="primary.main">
                {selectedPermissions.size}
              </Box>
              /{permissions.length} phân quyền
            </Typography>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            {permissions.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ py: 6 }}
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
                        border: '1px solid',
                        borderColor: isChecked ? 'primary.main' : 'grey.200',
                        bgcolor: isChecked ? 'rgba(99,102,241,0.08)' : 'grey.50',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: isChecked ? 'rgba(99,102,241,0.12)' : 'grey.100',
                        },
                      }}
                    >
                      <Checkbox
                        checked={isChecked}
                        onChange={() => togglePermission(perm.code)}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                        sx={{
                          p: 0,
                          mr: 1.5,
                          mt: 0.1,
                          flexShrink: 0,
                          color: isChecked ? 'primary.main' : 'grey.400',
                          '&.Mui-checked': { color: '#4f46e5' },
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={isChecked ? '#3730a3' : 'text.primary'}
                          noWrap
                          title={perm.code}
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
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={handleClosePermissionModal}
            variant="outlined"
            color="inherit"
            sx={{ color: 'text.secondary', borderColor: 'divider' }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSaveRolePermissions}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PermIcon />}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, fontWeight: 700 }}
          >
            {loading ? 'Đang lưu...' : 'Lưu phân quyền'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default ManageRoles;
