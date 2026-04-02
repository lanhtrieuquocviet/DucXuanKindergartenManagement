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
  Alert,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Checkbox,
  Grid,
  Stack,
  CircularProgress,
  InputAdornment,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Shield as ShieldIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

// Permissions liên quan đến từng role (dùng để lọc panel gán quyền)
// Role không có entry → hiện tất cả (SystemAdmin, SchoolNurse...)
const ROLE_PERMISSION_POOL = {
  SchoolAdmin: [
    'MANAGE_CONTACT', 'MANAGE_BANNER', 'VIEW_ATTENDANCE', 'MANAGE_BLOG',
    'MANAGE_BLOG_CATEGORY', 'MANAGE_QA', 'MANAGE_DOCUMENT', 'MANAGE_PUBLIC_INFO',
    'MANAGE_IMAGE_LIBRARY', 'MANAGE_ACADEMIC_YEAR', 'MANAGE_CURRICULUM',
    'MANAGE_STUDENT', 'MANAGE_CLASS', 'MANAGE_GRADE', 'MANAGE_TEACHER',
    'APPROVE_MENU', 'VIEW_REPORT', 'MANAGE_HEALTH',
    'REGISTER_FACE', 'CHECKOUT_STUDENT', 'MANAGE_ATTENDANCE',
    'MANAGE_PURCHASE_REQUEST', 'MANAGE_ASSET', 'MANAGE_PICKUP',
  ],
  Teacher: [
    'MANAGE_ATTENDANCE', 'MANAGE_PURCHASE_REQUEST', 'MANAGE_ASSET',
    'MANAGE_PICKUP', 'REGISTER_FACE', 'CHECKOUT_STUDENT',
  ],
  KitchenStaff: [
    'MANAGE_FOOD', 'MANAGE_MENU', 'MANAGE_MEAL_PHOTO', 'VIEW_REPORT', 'APPROVE_MENU',
  ],
  SchoolNurse: [
    'MANAGE_HEALTH', 'VIEW_REPORT',
  ],
  Parent: [],
  Student: [],
};

// Trích xuất tên module từ permission code (VD: CREATE_USER → USER, MANAGE_BLOG_CATEGORY → BLOG_CATEGORY)
function getModule(code) {
  const idx = code.indexOf('_');
  if (idx === -1) return code;
  return code.slice(idx + 1);
}

// Nhóm permissions theo module
function groupPermissions(permissions) {
  const groups = {};
  permissions.forEach((perm) => {
    const module = getModule(perm.code);
    if (!groups[module]) groups[module] = [];
    groups[module].push(perm);
  });
  return groups;
}

function ManagePermissions() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [success, setSuccess] = useState('');
  const [showPermissionForm, setShowPermissionForm] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [permissionForm, setPermissionForm] = useState({ code: '', description: '' });
  const [permSearch, setPermSearch] = useState('');
  const [assignSearch, setAssignSearch] = useState('');
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
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('SystemAdmin')) { navigate('/', { replace: true }); return; }

    const fetchData = async () => {
      try {
        setError(null);
        const [rolesData, permissionsData] = await Promise.all([getRoles(), getPermissions()]);
        setRoles(rolesData || []);
        setPermissions(permissionsData || []);
      } catch (_) {}
    };
    fetchData();
  }, [navigate, user, getRoles, getPermissions, setError, isInitializing]);

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

  // ── Permissions CRUD ──────────────────────────────────────────────────

  const handleOpenPermissionForm = (permission = null) => {
    setEditingPermission(permission);
    setPermissionForm(permission
      ? { code: permission.code || '', description: permission.description || '' }
      : { code: '', description: '' }
    );
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

      if (code.length < 3 || code.length > 64) { setError('Code phải có từ 3 đến 64 ký tự'); return; }
      if (!description) { setError('Mô tả không được để trống'); return; }
      if (description.length > 255) { setError('Mô tả không được vượt quá 255 ký tự'); return; }
      if (!/^[A-Z]+_[A-Z]/.test(code)) {
        setError('Code theo định dạng HÀNH_ĐỘNG_MODULE, VD: CREATE_USER');
        return;
      }

      if (editingPermission) {
        await updatePermission(editingPermission._id || editingPermission.id, code, description);
        setSuccess('Cập nhật quyền thành công.');
      } else {
        await createPermission(code, description);
        setSuccess('Tạo quyền thành công.');
      }

      setTimeout(() => setSuccess(''), 3000);
      handleClosePermissionForm();
      const permissionsData = await getPermissions();
      setPermissions(permissionsData || []);
    } catch (_) {}
  };

  const handleDeletePermission = (permissionId) => {
    setConfirmState({
      open: true,
      title: 'Xóa quyền',
      message: 'Bạn có chắc muốn xóa quyền này? Hành động không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        try {
          setError(null);
          await deletePermission(permissionId);
          setSuccess('Xóa quyền thành công.');
          setTimeout(() => setSuccess(''), 3000);
          const permissionsData = await getPermissions();
          setPermissions(permissionsData || []);
        } catch (_) {}
      },
    });
  };

  // ── Role permission assignment ────────────────────────────────────────

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setAssignSearch('');
    const perms = new Set();
    (role.permissions || []).forEach((p) => { if (p?.code) perms.add(p.code); });
    setSelectedPermissions(perms);
  };

  const togglePermission = (code) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const toggleGroup = (groupPerms, allCodes) => {
    const groupCodes = groupPerms.map((p) => p.code);
    const allChecked = groupCodes.every((c) => allCodes.has(c));
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (allChecked) { groupCodes.forEach((c) => next.delete(c)); }
      else { groupCodes.forEach((c) => next.add(c)); }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedPermissions(new Set(filteredAssignPerms.map((p) => p.code)));
  };

  const handleDeselectAll = () => {
    const filtered = new Set(filteredAssignPerms.map((p) => p.code));
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      filtered.forEach((c) => next.delete(c));
      return next;
    });
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;
    try {
      setError(null);
      setSuccess('');
      await updateRolePermissions(selectedRole.id || selectedRole._id, Array.from(selectedPermissions));
      setSuccess(`Đã lưu phân quyền cho vai trò "${selectedRole.roleName}".`);
      setTimeout(() => setSuccess(''), 3000);
      const rolesData = await getRoles();
      setRoles(rolesData || []);
      const updated = rolesData?.find((r) => (r.id || r._id) === (selectedRole.id || selectedRole._id));
      if (updated) setSelectedRole(updated);
    } catch (_) {}
  };

  // ── Derived / memoised values ─────────────────────────────────────────

  const filteredPermList = useMemo(() => {
    const q = permSearch.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter(
      (p) => p.code.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    );
  }, [permissions, permSearch]);

  const filteredAssignPerms = useMemo(() => {
    const roleName = selectedRole?.roleName;
    const pool = roleName && ROLE_PERMISSION_POOL[roleName];
    // Nếu role có pool định nghĩa → chỉ hiện permissions trong pool đó
    // pool rỗng ([]) → role này không có permissions nào → trả về []
    // pool undefined → role chưa định nghĩa (SystemAdmin...) → hiện tất cả
    let base = permissions;
    if (pool !== undefined) {
      base = pool.length === 0 ? [] : permissions.filter((p) => pool.includes(p.code));
    }
    const q = assignSearch.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (p) => p.code.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    );
  }, [permissions, assignSearch, selectedRole]);

  const assignGroups = useMemo(() => groupPermissions(filteredAssignPerms), [filteredAssignPerms]);

  const toggleGroupCollapse = (module) => {
    setCollapsedGroups((prev) => ({ ...prev, [module]: !prev[module] }));
  };

  const userName = user?.fullName || user?.username || 'System Admin';

  return (
    <RoleLayout
      title="Quản lý phân quyền"
      description="Tạo và gán quyền (permissions) cho từng vai trò trong hệ thống."
      menuItems={menuItems}
      activeKey="permissions"
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 3, p: 3,
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          borderRadius: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ShieldIcon sx={{ color: 'white', fontSize: 36 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} color="white">Quản lý phân quyền</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
              Tạo quyền và gán cho từng vai trò trong hệ thống
            </Typography>
          </Box>
        </Box>
        <Chip
          label={`${permissions.length} quyền`}
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
        />
      </Paper>

      <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}>
        {/* ── LEFT: Danh sách quyền ──────────────────────────────────── */}
        <Grid item xs={12} lg={5}>
          <Paper elevation={1} sx={{ borderRadius: 2, height: 'calc(100vh - 260px)', display: 'flex', flexDirection: 'column' }}>
            {/* Panel header */}
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Danh sách quyền
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenPermissionForm()}
                  sx={{
                    textTransform: 'none', fontWeight: 600, borderRadius: 1.5,
                    bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' },
                  }}
                >
                  Thêm quyền
                </Button>
              </Stack>
              <TextField
                size="small"
                fullWidth
                placeholder="Tìm kiếm quyền..."
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
              />
            </Box>

            {/* Permissions list */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
              {filteredPermList.length === 0 ? (
                <Typography variant="body2" color="text.disabled" sx={{ py: 4, textAlign: 'center' }}>
                  {permSearch ? 'Không tìm thấy quyền phù hợp.' : 'Chưa có quyền nào.'}
                </Typography>
              ) : (
                <Stack spacing={0.75}>
                  {filteredPermList.map((perm) => (
                    <Box
                      key={perm._id || perm.id}
                      sx={{
                        display: 'flex', alignItems: 'center',
                        p: 1.5, borderRadius: 1.5, border: '1px solid',
                        borderColor: 'divider', bgcolor: 'grey.50',
                        '&:hover': { bgcolor: 'grey.100' }, transition: 'background 0.15s',
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2" fontWeight={700} noWrap
                          sx={{ fontFamily: 'monospace', color: '#4338ca', fontSize: 12 }}
                        >
                          {perm.code}
                        </Typography>
                        <Typography
                          variant="caption" color="text.secondary"
                          sx={{
                            display: '-webkit-box', WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}
                        >
                          {perm.description}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.25} sx={{ ml: 1, flexShrink: 0 }}>
                        <Tooltip title="Sửa mô tả">
                          <IconButton size="small" color="primary" onClick={() => handleOpenPermissionForm(perm)}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa quyền">
                          <IconButton size="small" color="error" onClick={() => handleDeletePermission(perm._id || perm.id)}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* ── RIGHT: Gán quyền cho vai trò ───────────────────────────── */}
        <Grid item xs={12} lg={7}>
          <Paper elevation={1} sx={{ borderRadius: 2, height: 'calc(100vh - 260px)', display: 'flex', flexDirection: 'column' }}>
            {/* Panel header */}
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                Gán quyền cho vai trò
              </Typography>
              {/* Role chips */}
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {roles.map((role) => {
                  const roleId = role.id || role._id;
                  const isSelected = selectedRole && (selectedRole.id || selectedRole._id) === roleId;
                  return (
                    <Chip
                      key={roleId}
                      label={role.roleName}
                      clickable
                      onClick={() => handleSelectRole(role)}
                      color={isSelected ? 'primary' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                      size="small"
                      sx={{ fontWeight: isSelected ? 700 : 500 }}
                    />
                  );
                })}
              </Stack>
            </Box>

            {selectedRole ? (
              <>
                {/* Role info + search + select actions */}
                <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        Đang chỉnh:
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {selectedRole.roleName}
                      </Typography>
                      <Chip
                        label={`${selectedPermissions.size}/${filteredAssignPerms.length} đã chọn`}
                        size="small"
                        color="primary"
                        variant="filled"
                        sx={{ fontSize: 11 }}
                      />
                    </Stack>
                    <Stack direction="row" spacing={0.75}>
                      <Tooltip title="Chọn tất cả (đang hiển thị)">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleSelectAll}
                          sx={{ textTransform: 'none', fontSize: 12, py: 0.25, borderRadius: 1.5, minWidth: 0, px: 1.5 }}
                        >
                          Chọn tất
                        </Button>
                      </Tooltip>
                      <Tooltip title="Bỏ chọn tất cả (đang hiển thị)">
                        <Button
                          size="small"
                          variant="outlined"
                          color="inherit"
                          onClick={handleDeselectAll}
                          sx={{ textTransform: 'none', fontSize: 12, py: 0.25, borderRadius: 1.5, minWidth: 0, px: 1.5, color: 'text.secondary' }}
                        >
                          Bỏ hết
                        </Button>
                      </Tooltip>
                    </Stack>
                  </Stack>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Lọc quyền..."
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                  />
                </Box>

                {/* Grouped permissions */}
                <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, pb: 2 }}>
                  {filteredAssignPerms.length === 0 ? (
                    <Typography variant="body2" color="text.disabled" sx={{ py: 4, textAlign: 'center' }}>
                      {assignSearch
                        ? 'Không tìm thấy quyền phù hợp.'
                        : `Vai trò "${selectedRole.roleName}" không có chức năng quản lý nào.`}
                    </Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {Object.entries(assignGroups).map(([module, groupPerms]) => {
                        const groupCodes = groupPerms.map((p) => p.code);
                        const checkedCount = groupCodes.filter((c) => selectedPermissions.has(c)).length;
                        const allChecked = checkedCount === groupCodes.length;
                        const someChecked = checkedCount > 0 && !allChecked;
                        const isCollapsed = collapsedGroups[module];

                        return (
                          <Box key={module} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
                            {/* Group header */}
                            <Stack
                              direction="row" alignItems="center"
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
                                onChange={() => toggleGroup(groupPerms, selectedPermissions)}
                                onClick={(e) => e.stopPropagation()}
                                sx={{ p: 0, mr: 1, flexShrink: 0, color: someChecked || allChecked ? '#4f46e5' : 'grey.400', '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: '#4f46e5' } }}
                              />
                              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ flex: 1, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 11 }}>
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
                              <Stack spacing={0} sx={{ p: 0.75 }}>
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
                                          variant="body2" fontWeight={600} noWrap
                                          sx={{ fontFamily: 'monospace', fontSize: 12, color: isChecked ? '#3730a3' : 'text.primary' }}
                                        >
                                          {perm.code}
                                        </Typography>
                                        {perm.description && (
                                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
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
                </Box>

                {/* Save */}
                <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" justifyContent="flex-end">
                    <Button
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                      disabled={loading}
                      onClick={handleSaveRolePermissions}
                      sx={{
                        textTransform: 'none', fontWeight: 700, borderRadius: 1.5,
                        bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' },
                      }}
                    >
                      {loading ? 'Đang lưu...' : 'Lưu phân quyền'}
                    </Button>
                  </Stack>
                </Box>
              </>
            ) : (
              <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, py: 8 }} spacing={2}>
                <ShieldIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Chọn một vai trò ở trên để xem và chỉnh sửa phân quyền.
                </Typography>
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog: Thêm / Sửa permission */}
      <Dialog
        open={showPermissionForm}
        onClose={handleClosePermissionForm}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2, overflow: 'hidden' } } }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
          }}
        >
          <ShieldIcon sx={{ color: 'white', fontSize: 22 }} />
          <Typography variant="h6" fontWeight={700} color="white">
            {editingPermission ? 'Sửa quyền' : 'Thêm quyền mới'}
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSavePermission}>
          <DialogContent sx={{ pt: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TextField
              label={<>Code <Box component="span" sx={{ color: 'error.main' }}>*</Box></>}
              value={permissionForm.code}
              onChange={(e) => setPermissionForm({ ...permissionForm, code: e.target.value.toUpperCase() })}
              fullWidth
              required
              disabled={!!editingPermission}
              slotProps={{ htmlInput: { maxLength: 64 } }}
              placeholder="VD: CREATE_USER"
              helperText={editingPermission ? 'Không thể thay đổi code khi sửa' : 'Định dạng: HÀNH_ĐỘNG_MODULE (chữ in hoa, dấu gạch dưới)'}
              sx={{ mb: 2 }}
              size="small"
            />

            <TextField
              label={<>Mô tả <Box component="span" sx={{ color: 'error.main' }}>*</Box></>}
              value={permissionForm.description}
              onChange={(e) => setPermissionForm({ ...permissionForm, description: e.target.value })}
              fullWidth
              required
              multiline
              rows={3}
              slotProps={{ htmlInput: { maxLength: 255 } }}
              placeholder="Mô tả quyền này (tối đa 255 ký tự)"
              size="small"
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={handleClosePermissionForm} variant="outlined" color="inherit" sx={{ textTransform: 'none', borderRadius: 1.5 }}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
            >
              {loading ? 'Đang lưu...' : editingPermission ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogActions>
        </Box>
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

export default ManagePermissions;
