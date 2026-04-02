import { useEffect, useState, useMemo } from 'react';
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
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Checkbox,
  CircularProgress,
  Stack,
  Chip,
  InputAdornment,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  VpnKey as PermIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

function getModule(code) {
  const idx = code.indexOf('_');
  if (idx === -1) return code;
  return code.slice(idx + 1);
}

function groupPermissions(permissions) {
  const groups = {};
  permissions.forEach((perm) => {
    const module = getModule(perm.code);
    if (!groups[module]) groups[module] = [];
    groups[module].push(perm);
  });
  return groups;
}

function ManageRoles() {
  const [roles, setRoles] = useState([]);
  const [success, setSuccess] = useState('');
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ roleName: '', description: '' });
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [permSearch, setPermSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState({});
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
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('SystemAdmin')) { navigate('/', { replace: true }); return; }

    const fetchRoles = async () => {
      try {
        setError(null);
        const rolesData = await getRoles();
        setRoles(rolesData || []);
      } catch (_) {}
    };
    fetchRoles();
  }, [navigate, user, getRoles, setError, isInitializing]);

  const handleMenuSelect = (key) => {
    const routes = {
      overview: '/system-admin',
      accounts: '/system-admin/manage-accounts',
      roles: '/system-admin/manage-roles',
      permissions: '/system-admin/manage-permissions',
      'system-logs': '/system-admin/system-logs',
    };
    navigate(routes[key] || '/system-admin');
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

  // ── Role CRUD ─────────────────────────────────────────────────────────

  const handleOpenRoleForm = (role = null) => {
    setEditingRole(role);
    setRoleForm(role
      ? { roleName: role.roleName || '', description: role.description || '' }
      : { roleName: '', description: '' }
    );
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

      if (roleName.length < 3 || roleName.length > 32) {
        setError('Tên vai trò phải có từ 3 đến 32 ký tự');
        return;
      }
      if (!/^[A-Za-z][A-Za-z0-9]*$/.test(roleName)) {
        setError('Tên vai trò chỉ được chứa chữ cái và số, bắt đầu bằng chữ cái. VD: Teacher, SchoolAdmin');
        return;
      }
      if (description.length > 255) {
        setError('Mô tả không được vượt quá 255 ký tự');
        return;
      }

      if (editingRole) {
        await updateRole(editingRole.id || editingRole._id, roleName, description);
        setSuccess('Cập nhật vai trò thành công.');
      } else {
        await createRole(roleName, description);
        setSuccess('Tạo vai trò thành công.');
      }

      setTimeout(() => setSuccess(''), 3000);
      handleCloseRoleForm();
      const rolesData = await getRoles();
      setRoles(rolesData || []);
    } catch (_) {}
  };

  const handleDeleteRole = (roleId) => {
    setConfirmState({
      open: true,
      title: 'Xóa vai trò',
      message: 'Bạn có chắc muốn xóa vai trò này? Hành động không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        try {
          setError(null);
          await deleteRole(roleId);
          setSuccess('Xóa vai trò thành công.');
          setTimeout(() => setSuccess(''), 3000);
          const rolesData = await getRoles();
          setRoles(rolesData || []);
        } catch (_) {}
      },
    });
  };

  // ── Permission modal ──────────────────────────────────────────────────

  const handleOpenPermissionModal = async (role) => {
    try {
      setError(null);
      setPermSearch('');
      setCollapsedGroups({});
      setSelectedRoleForPermissions(role);
      const allPermissions = await getPermissions();
      setPermissions(allPermissions || []);
      const rolePerms = new Set();
      (role.permissions || []).forEach((p) => { if (p?.code) rolePerms.add(p.code); });
      setSelectedPermissions(rolePerms);
      setShowPermissionModal(true);
    } catch (_) {}
  };

  const handleClosePermissionModal = () => {
    setShowPermissionModal(false);
    setSelectedRoleForPermissions(null);
    setSelectedPermissions(new Set());
    setPermSearch('');
  };

  const togglePermission = (code) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const toggleGroup = (groupPerms) => {
    const groupCodes = groupPerms.map((p) => p.code);
    const allChecked = groupCodes.every((c) => selectedPermissions.has(c));
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (allChecked) { groupCodes.forEach((c) => next.delete(c)); }
      else { groupCodes.forEach((c) => next.add(c)); }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedPermissions(new Set(filteredPerms.map((p) => p.code)));
  };

  const handleDeselectAll = () => {
    const filtered = new Set(filteredPerms.map((p) => p.code));
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      filtered.forEach((c) => next.delete(c));
      return next;
    });
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRoleForPermissions) return;
    try {
      setError(null);
      setSuccess('');
      await updateRolePermissions(
        selectedRoleForPermissions.id || selectedRoleForPermissions._id,
        Array.from(selectedPermissions)
      );
      setSuccess(`Đã lưu phân quyền cho vai trò "${selectedRoleForPermissions.roleName}".`);
      setTimeout(() => setSuccess(''), 3000);
      handleClosePermissionModal();
      const rolesData = await getRoles();
      setRoles(rolesData || []);
    } catch (_) {}
  };

  const filteredPerms = useMemo(() => {
    const q = permSearch.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter(
      (p) => p.code.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    );
  }, [permissions, permSearch]);

  const permGroups = useMemo(() => groupPermissions(filteredPerms), [filteredPerms]);

  const toggleGroupCollapse = (module) => {
    setCollapsedGroups((prev) => ({ ...prev, [module]: !prev[module] }));
  };

  const userName = user?.fullName || user?.username || 'System Admin';

  return (
    <RoleLayout
      title="Quản lý vai trò"
      description="Thêm, sửa, xóa các vai trò trong hệ thống."
      menuItems={menuItems}
      activeKey="roles"
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Header banner */}
      <Paper
        elevation={3}
        sx={{
          mb: 3, p: 3,
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SecurityIcon sx={{ color: 'white', fontSize: 36 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} color="white">Quản lý vai trò</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
              Thêm, sửa, xóa các vai trò trong hệ thống
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenRoleForm()}
          sx={{
            bgcolor: 'white', color: '#4f46e5', fontWeight: 700,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }, boxShadow: 2,
          }}
        >
          Thêm vai trò
        </Button>
      </Paper>

      {/* Roles table */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700}>Danh sách vai trò</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Tên vai trò', 'Mô tả', 'Số quyền', 'Thao tác'].map((h, i) => (
                  <TableCell
                    key={h}
                    align={i === 3 ? 'right' : 'left'}
                    sx={{
                      bgcolor: 'grey.50', fontWeight: 700, fontSize: 12,
                      textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary',
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
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
                  <TableRow key={roleId} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ maxWidth: 180 }}>
                      <Typography variant="body2" fontWeight={600} noWrap title={role.roleName}>
                        {role.roleName}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography
                        variant="body2" color="text.secondary"
                        title={role.description || 'Không có mô tả'}
                        sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                      >
                        {role.description || (
                          <Box component="span" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                            Không có mô tả
                          </Box>
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Nhấn để chỉnh sửa phân quyền">
                        <Chip
                          label={`${role.permissions?.length || 0} quyền`}
                          size="small"
                          clickable
                          onClick={() => handleOpenPermissionModal(role)}
                          color={role.permissions?.length > 0 ? 'primary' : 'default'}
                          variant="outlined"
                          icon={<PermIcon sx={{ fontSize: '14px !important' }} />}
                          sx={{ fontWeight: 600, cursor: 'pointer' }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenRoleForm(role)}
                          sx={{ fontSize: 12, borderColor: 'primary.light', color: 'primary.main', textTransform: 'none' }}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={loading ? <CircularProgress size={12} color="error" /> : <DeleteIcon />}
                          onClick={() => handleDeleteRole(roleId)}
                          disabled={loading}
                          sx={{ fontSize: 12, borderColor: 'error.light', color: 'error.main', textTransform: 'none' }}
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

      {/* Dialog: Thêm / Sửa role */}
      <Dialog
        open={showRoleForm}
        onClose={handleCloseRoleForm}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2, overflow: 'hidden' } } }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
          }}
        >
          <SecurityIcon sx={{ color: 'white', fontSize: 24 }} />
          <Typography variant="h6" fontWeight={700} color="white">
            {editingRole ? 'Sửa vai trò' : 'Thêm vai trò mới'}
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSaveRole}>
          <DialogContent sx={{ pt: 3, pb: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}
            <TextField
              label={<>Tên vai trò <Box component="span" sx={{ color: 'error.main' }}>*</Box></>}
              value={roleForm.roleName}
              onChange={(e) => setRoleForm({ ...roleForm, roleName: e.target.value })}
              fullWidth
              required
              slotProps={{ htmlInput: { maxLength: 32 } }}
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
              slotProps={{ htmlInput: { maxLength: 255 } }}
              placeholder="Mô tả vai trò này (tối đa 255 ký tự)"
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button onClick={handleCloseRoleForm} variant="outlined" color="inherit" sx={{ color: 'text.secondary', borderColor: 'divider', textTransform: 'none' }}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, fontWeight: 700, textTransform: 'none' }}
            >
              {loading ? 'Đang lưu...' : editingRole ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Dialog: Phân quyền cho vai trò */}
      <Dialog
        open={showPermissionModal && !!selectedRoleForPermissions}
        onClose={handleClosePermissionModal}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2, overflow: 'hidden', maxHeight: '90vh' } } }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
          }}
        >
          <PermIcon sx={{ color: 'white', fontSize: 24 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} color="white" noWrap>
              Phân quyền cho vai trò
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.25 }} noWrap>
              {selectedRoleForPermissions?.roleName}
            </Typography>
          </Box>
          <Chip
            label={`${selectedPermissions.size} / ${permissions.length}`}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700, fontSize: 12 }}
          />
        </Box>

        {/* Toolbar: search + select all/none */}
        <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              size="small"
              placeholder="Tìm kiếm quyền..."
              value={permSearch}
              onChange={(e) => setPermSearch(e.target.value)}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              size="small"
              variant="outlined"
              onClick={handleSelectAll}
              sx={{ textTransform: 'none', fontSize: 12, borderRadius: 1.5, whiteSpace: 'nowrap' }}
            >
              Chọn tất cả
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={handleDeselectAll}
              sx={{ textTransform: 'none', fontSize: 12, borderRadius: 1.5, whiteSpace: 'nowrap', color: 'text.secondary' }}
            >
              Bỏ hết
            </Button>
          </Stack>
        </Box>

        <DialogContent sx={{ p: 2, overflowY: 'auto' }}>
          {filteredPerms.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 6 }}>
              {permSearch ? 'Không tìm thấy quyền phù hợp.' : 'Chưa có quyền nào trong hệ thống.'}
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {Object.entries(permGroups).map(([module, groupPerms]) => {
                const groupCodes = groupPerms.map((p) => p.code);
                const checkedCount = groupCodes.filter((c) => selectedPermissions.has(c)).length;
                const allChecked = checkedCount === groupCodes.length;
                const someChecked = checkedCount > 0 && !allChecked;
                const isCollapsed = collapsedGroups[module];

                return (
                  <Box
                    key={module}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}
                  >
                    {/* Group header */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      sx={{
                        px: 1.5, py: 1, bgcolor: 'grey.50',
                        cursor: 'pointer', userSelect: 'none',
                        '&:hover': { bgcolor: 'grey.100' },
                      }}
                      onClick={() => toggleGroupCollapse(module)}
                    >
                      <Checkbox
                        size="small"
                        checked={allChecked}
                        indeterminate={someChecked}
                        onChange={() => toggleGroup(groupPerms)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          p: 0, mr: 1, flexShrink: 0,
                          '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: '#4f46e5' },
                        }}
                      />
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="text.secondary"
                        sx={{ flex: 1, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 11 }}
                      >
                        {module}
                      </Typography>
                      <Chip
                        label={`${checkedCount}/${groupCodes.length}`}
                        size="small"
                        sx={{
                          fontSize: 10, height: 18, mr: 1,
                          bgcolor: checkedCount > 0 ? 'rgba(99,102,241,0.1)' : 'grey.200',
                          color: checkedCount > 0 ? '#4338ca' : 'text.secondary',
                          fontWeight: 700,
                        }}
                      />
                      {isCollapsed
                        ? <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                        : <ExpandLessIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                      }
                    </Stack>

                    {/* Group items */}
                    <Collapse in={!isCollapsed}>
                      <Stack sx={{ p: 0.75 }}>
                        {groupPerms.map((perm) => {
                          const isChecked = selectedPermissions.has(perm.code);
                          return (
                            <Box
                              key={perm._id || perm.id}
                              onClick={() => togglePermission(perm.code)}
                              sx={{
                                display: 'flex', alignItems: 'flex-start', p: 1, borderRadius: 1.5,
                                cursor: 'pointer',
                                bgcolor: isChecked ? 'rgba(99,102,241,0.06)' : 'transparent',
                                '&:hover': { bgcolor: isChecked ? 'rgba(99,102,241,0.1)' : 'action.hover' },
                                transition: 'background 0.1s',
                              }}
                            >
                              <Checkbox
                                size="small"
                                checked={isChecked}
                                onChange={() => togglePermission(perm.code)}
                                onClick={(e) => e.stopPropagation()}
                                sx={{ p: 0, mr: 1.5, mt: 0.1, flexShrink: 0, '&.Mui-checked': { color: '#4f46e5' } }}
                              />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  noWrap
                                  sx={{ fontFamily: 'monospace', fontSize: 12, color: isChecked ? '#3730a3' : 'text.primary' }}
                                >
                                  {perm.code}
                                </Typography>
                                {perm.description && (
                                  <Typography variant="caption" color="text.secondary">
                                    {perm.description}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Collapse>
                  </Box>
                );
              })}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={handleClosePermissionModal}
            variant="outlined"
            color="inherit"
            sx={{ color: 'text.secondary', borderColor: 'divider', textTransform: 'none' }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSaveRolePermissions}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PermIcon />}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, fontWeight: 700, textTransform: 'none' }}
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
