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
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Shield as ShieldIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Lock as LockIcon,
  TableChart as TableChartIcon,
  ViewList as ViewListIcon,
} from '@mui/icons-material';

const COMMON_ACTIONS = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE', 'EXPORT', 'APPROVE', 'REJECT', 'ASSIGN'];

// Nhóm quyền liên quan mặc định theo tên role
// null = hiện tất cả (SchoolAdmin và các role custom/test)
const ROLE_RELEVANT_GROUPS = {
  Teacher:        ['Điểm danh', 'Báo cáo', 'Tài sản & Mua sắm'],
  HeadTeacher:    ['Điểm danh', 'Báo cáo', 'Tài sản & Mua sắm'],
  KitchenStaff:   ['Bếp & Thực phẩm', 'Báo cáo'],
  InventoryStaff: ['Tài sản & Mua sắm'],
  MedicalStaff:   ['Y tế'],
  HeadParent:     ['Bếp & Thực phẩm'],
  SchoolAdmin:    null,
};

// Nhóm permissions theo field group (từ DB)
function groupByField(permissions) {
  const groups = {};
  permissions.forEach((perm) => {
    const key = perm.group || 'Chưa phân nhóm';
    if (!groups[key]) groups[key] = [];
    groups[key].push(perm);
  });
  return groups;
}

function ManagePermissions() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [inheritedPermissions, setInheritedPermissions] = useState(new Set());
  const [success, setSuccess] = useState('');
  const [showPermissionForm, setShowPermissionForm] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [permissionForm, setPermissionForm] = useState({ code: '', description: '', group: '' });
  const [permSearch, setPermSearch] = useState('');
  const [assignSearch, setAssignSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [viewMode, setViewMode] = useState('matrix');
  const [showAllPerms, setShowAllPerms] = useState(false);
  const [confirmState, setConfirmState] = useState({
    open: false, title: '', message: '', onConfirm: null,
  });

  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const {
    getRoles, getPermissions, updatePermission, deletePermission, updateRolePermissions,
    loading, error, setError,
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
      overview: '/system-admin', accounts: '/system-admin/manage-accounts',
      roles: '/system-admin/manage-roles', permissions: '/system-admin/manage-permissions',
      bpm: '/system-admin/bpm',
      'system-logs': '/system-admin/system-logs',
    };
    navigate(routes[key] || '/system-admin');
  };

  const menuItems = [
    { key: 'overview', label: 'Tổng quan hệ thống' },
    { key: 'accounts', label: 'Quản lý người dùng' },
    { key: 'roles', label: 'Quản lý vai trò' },
    { key: 'permissions', label: 'Quản lý phân quyền' },
    { key: 'bpm', label: 'Quản lý quy trình (BPM)' },
    { key: 'system-logs', label: 'Nhật ký hệ thống' },
  ];

  // ── Permission edit/delete ────────────────────────────────────────────

  const handleOpenPermissionForm = (permission = null) => {
    setEditingPermission(permission);
    setPermissionForm(permission
      ? { code: permission.code || '', description: permission.description || '', group: permission.group || '' }
      : { code: '', description: '', group: '' }
    );
    setError(null);
    setSuccess('');
    setShowPermissionForm(true);
  };

  const handleClosePermissionForm = () => {
    setShowPermissionForm(false);
    setEditingPermission(null);
    setPermissionForm({ code: '', description: '', group: '' });
    setError(null);
  };

  const handleSavePermission = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess('');
      const code = permissionForm.code.toUpperCase().trim();
      const description = permissionForm.description.trim();
      const group = permissionForm.group.trim();

      if (code.length < 3 || code.length > 64) { setError('Code phải có từ 3 đến 64 ký tự'); return; }
      if (!description) { setError('Mô tả không được để trống'); return; }
      if (description.length > 255) { setError('Mô tả không được vượt quá 255 ký tự'); return; }
      if (!/^[A-Z]+_[A-Z]/.test(code)) {
        setError('Code theo định dạng HÀNH_ĐỘNG_MODULE, VD: CREATE_USER'); return;
      }

      if (editingPermission) {
        await updatePermission(editingPermission._id || editingPermission.id, code, description, group);
        setSuccess('Cập nhật quyền thành công.');
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
    setShowAllPerms(false);
    const ownPerms = new Set();
    (role.permissions || []).forEach((p) => { if (p?.code) ownPerms.add(p.code); });
    setSelectedPermissions(ownPerms);
    const inherited = new Set();
    (role.inheritedPermissions || []).forEach((p) => { if (p?.code) inherited.add(p.code); });
    setInheritedPermissions(inherited);
  };

  const togglePermission = (code) => {
    if (inheritedPermissions.has(code)) return;
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const toggleGroup = (groupPerms) => {
    const editableCodes = groupPerms.map((p) => p.code).filter((c) => !inheritedPermissions.has(c));
    const allChecked = editableCodes.every((c) => selectedPermissions.has(c));
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (allChecked) { editableCodes.forEach((c) => next.delete(c)); }
      else { editableCodes.forEach((c) => next.add(c)); }
      return next;
    });
  };

  // Toggle toàn bộ hàng trong matrix (theo group)
  const toggleGroupRow = (allGroupPerms) => {
    const editablePerms = allGroupPerms.filter((p) => !inheritedPermissions.has(p.code));
    const allChecked = editablePerms.length > 0 && editablePerms.every((p) => selectedPermissions.has(p.code));
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (allChecked) editablePerms.forEach((p) => next.delete(p.code));
      else editablePerms.forEach((p) => next.add(p.code));
      return next;
    });
  };

  // Toggle một ô trong matrix (theo group + action)
  const toggleCellPerms = (editablePerms, allChecked) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (allChecked) editablePerms.forEach((p) => next.delete(p.code));
      else editablePerms.forEach((p) => next.add(p.code));
      return next;
    });
  };

  const handleSelectAll = () => {
    const editableCodes = filteredAssignPerms
      .filter((p) => !inheritedPermissions.has(p.code))
      .map((p) => p.code);
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      editableCodes.forEach((c) => next.add(c));
      return next;
    });
  };

  const handleDeselectAll = () => {
    const editableCodes = new Set(
      filteredAssignPerms.filter((p) => !inheritedPermissions.has(p.code)).map((p) => p.code)
    );
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      editableCodes.forEach((c) => next.delete(c));
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
      if (updated) handleSelectRole(updated);
    } catch (_) {}
  };

  // ── Derived / memoised values ─────────────────────────────────────────

  const existingGroups = useMemo(
    () => [...new Set(permissions.map((p) => p.group).filter(Boolean))].sort(),
    [permissions]
  );

  const filteredPermList = useMemo(() => {
    const q = permSearch.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter(
      (p) => p.code.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || (p.group || '').toLowerCase().includes(q)
    );
  }, [permissions, permSearch]);

  // Nhóm quyền liên quan của role đang chọn (null = tất cả)
  const relevantGroups = useMemo(() => {
    if (!selectedRole) return null;
    const defined = ROLE_RELEVANT_GROUPS[selectedRole.roleName];
    // Role có parent → có thể dùng mapping của parent
    if (defined === undefined && selectedRole.parentName) {
      return ROLE_RELEVANT_GROUPS[selectedRole.parentName] ?? null;
    }
    return defined ?? null; // undefined role → null (hiện tất cả)
  }, [selectedRole]);

  const filteredAssignPerms = useMemo(() => {
    let base = permissions;
    // Lọc theo nhóm liên quan (trừ khi showAllPerms hoặc role hiện tất cả)
    if (!showAllPerms && relevantGroups !== null) {
      base = base.filter((p) => relevantGroups.includes(p.group || 'Chưa phân nhóm'));
    }
    const q = assignSearch.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (p) => p.code.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || (p.group || '').toLowerCase().includes(q)
    );
  }, [permissions, assignSearch, showAllPerms, relevantGroups]);

  const assignGroups = useMemo(() => groupByField(filteredAssignPerms), [filteredAssignPerms]);
  const listGroups = useMemo(() => groupByField(filteredPermList), [filteredPermList]);

  // Dữ liệu matrix: actions (cột) + groupMap (hàng × cột → [perms])
  const matrixData = useMemo(() => {
    if (!filteredAssignPerms.length) return null;
    const actionSet = new Set();
    filteredAssignPerms.forEach((p) => actionSet.add(p.code.split('_')[0]));
    const actions = [...actionSet].sort((a, b) => {
      const ai = COMMON_ACTIONS.indexOf(a);
      const bi = COMMON_ACTIONS.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
    const groupMap = {};
    filteredAssignPerms.forEach((p) => {
      const g = p.group || 'Chưa phân nhóm';
      const action = p.code.split('_')[0];
      if (!groupMap[g]) groupMap[g] = {};
      if (!groupMap[g][action]) groupMap[g][action] = [];
      groupMap[g][action].push(p);
    });
    const groups = Object.keys(groupMap).sort();
    return { actions, groups, groupMap };
  }, [filteredAssignPerms]);

  const toggleGroupCollapse = (module) => {
    setCollapsedGroups((prev) => ({ ...prev, [module]: !prev[module] }));
  };

  const effectiveCount = useMemo(
    () => new Set([...selectedPermissions, ...inheritedPermissions]).size,
    [selectedPermissions, inheritedPermissions]
  );

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
          borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ShieldIcon sx={{ color: 'white', fontSize: 36 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} color="white">Quản lý phân quyền</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
              Nhóm quyền theo chức năng và gán cho từng vai trò
            </Typography>
          </Box>
        </Box>
        <Chip
          label={`${permissions.length} quyền · ${existingGroups.length} nhóm`}
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
        />
      </Paper>

      <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}>
        {/* ── LEFT: Danh sách quyền ──────────────────────────────────── */}
        <Grid item xs={12} lg={5}>
          <Paper elevation={1} sx={{ borderRadius: 2, height: 'calc(100vh - 260px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                Danh sách quyền
              </Typography>
              <TextField
                size="small" fullWidth placeholder="Tìm theo tên, mô tả hoặc nhóm..."
                value={permSearch} onChange={(e) => setPermSearch(e.target.value)}
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

            <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
              {filteredPermList.length === 0 ? (
                <Typography variant="body2" color="text.disabled" sx={{ py: 4, textAlign: 'center' }}>
                  {permSearch ? 'Không tìm thấy quyền phù hợp.' : 'Chưa có quyền nào.'}
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {Object.entries(listGroups).map(([groupName, groupPerms]) => (
                    <Box key={groupName} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
                      <Stack
                        direction="row" alignItems="center"
                        sx={{ px: 1.5, py: 1, bgcolor: 'grey.50', cursor: 'pointer', '&:hover': { bgcolor: 'grey.100' } }}
                        onClick={() => toggleGroupCollapse(`list_${groupName}`)}
                      >
                        <Typography variant="caption" fontWeight={700} color="text.secondary"
                          sx={{ flex: 1, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 11 }}>
                          {groupName}
                        </Typography>
                        <Chip label={groupPerms.length} size="small"
                          sx={{ fontSize: 10, height: 18, bgcolor: 'rgba(99,102,241,0.1)', color: '#4338ca', fontWeight: 700, mr: 1 }} />
                        {collapsedGroups[`list_${groupName}`]
                          ? <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                          : <ExpandLessIcon sx={{ fontSize: 16, color: 'text.disabled' }} />}
                      </Stack>
                      <Collapse in={!collapsedGroups[`list_${groupName}`]}>
                        <Stack spacing={0} sx={{ p: 0.75 }}>
                          {groupPerms.map((perm) => (
                            <Box
                              key={perm._id || perm.id}
                              sx={{
                                display: 'flex', alignItems: 'center',
                                p: 1, borderRadius: 1.5,
                                '&:hover': { bgcolor: 'grey.100' }, transition: 'background 0.15s',
                              }}
                            >
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={700} noWrap
                                  sx={{ fontFamily: 'monospace', color: '#4338ca', fontSize: 12 }}>
                                  {perm.code}
                                </Typography>
                                <Typography variant="caption" color="text.secondary"
                                  sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {perm.description}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={0.25} sx={{ ml: 1, flexShrink: 0 }}>
                                <Tooltip title="Sửa mô tả / nhóm">
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
                      </Collapse>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* ── RIGHT: Gán quyền cho vai trò ───────────────────────────── */}
        <Grid item xs={12} lg={7}>
          <Paper elevation={1} sx={{ borderRadius: 2, height: 'calc(100vh - 260px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* ── Section 1: Role chips (luôn hiện, chiều cao cố định) ── */}
            <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                Gán quyền cho vai trò
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {roles.filter((r) => !['SystemAdmin', 'Parent', 'Student'].includes(r.roleName)).map((role) => {
                  const roleId = role.id || role._id;
                  const isSelected = selectedRole && (selectedRole.id || selectedRole._id) === roleId;
                  return (
                    <Chip
                      key={roleId}
                      label={role.parentName ? `${role.roleName} ← ${role.parentName}` : role.roleName}
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

            {/* ── Section 2: Role info bar (luôn hiện, chiều cao cố định) ── */}
            <Box sx={{ px: 2.5, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0, minHeight: 46, display: 'flex', alignItems: 'center' }}>
              {selectedRole ? (
                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={700} color="primary.main">
                    {selectedRole.roleName}
                  </Typography>
                  {selectedRole.parentName && (
                    <Chip
                      label={`Kế thừa từ: ${selectedRole.parentName}`}
                      size="small"
                      icon={<LockIcon sx={{ fontSize: '12px !important' }} />}
                      sx={{ fontSize: 11, bgcolor: 'rgba(234,179,8,0.1)', color: '#92400e', fontWeight: 600 }}
                    />
                  )}
                  <Chip
                    label={`${selectedPermissions.size} riêng · ${inheritedPermissions.size} kế thừa · ${effectiveCount} hiệu lực`}
                    size="small" color="primary" variant="filled" sx={{ fontSize: 11 }}
                  />
                  {relevantGroups !== null && !showAllPerms && (
                    <Tooltip title={`Chỉ hiện nhóm liên quan: ${relevantGroups.join(', ')}`}>
                      <Chip
                        label={`${filteredAssignPerms.length}/${permissions.length} quyền`}
                        size="small"
                        onClick={() => setShowAllPerms(true)}
                        sx={{ fontSize: 11, cursor: 'pointer', bgcolor: 'rgba(234,179,8,0.12)', color: '#92400e', fontWeight: 600, '&:hover': { bgcolor: 'rgba(234,179,8,0.22)' } }}
                      />
                    </Tooltip>
                  )}
                  {showAllPerms && relevantGroups !== null && (
                    <Chip
                      label="Đang hiện tất cả"
                      size="small"
                      onDelete={() => setShowAllPerms(false)}
                      sx={{ fontSize: 11, bgcolor: 'rgba(99,102,241,0.1)', color: '#3730a3', fontWeight: 600 }}
                    />
                  )}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', fontSize: 13 }}>
                  Chọn một vai trò ở trên để bắt đầu chỉnh sửa phân quyền
                </Typography>
              )}
            </Box>

            {/* ── Section 3: Search + controls (luôn hiện, chiều cao cố định) ── */}
            <Box sx={{ px: 2.5, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small" fullWidth
                  disabled={!selectedRole}
                  placeholder={selectedRole ? 'Lọc quyền...' : 'Chọn vai trò trước...'}
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
                <Button size="small" variant="outlined" disabled={!selectedRole} onClick={handleSelectAll}
                  sx={{ textTransform: 'none', fontSize: 12, py: 0.5, borderRadius: 1.5, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Chọn tất
                </Button>
                <Button size="small" variant="outlined" color="inherit" disabled={!selectedRole} onClick={handleDeselectAll}
                  sx={{ textTransform: 'none', fontSize: 12, py: 0.5, borderRadius: 1.5, whiteSpace: 'nowrap', flexShrink: 0, color: 'text.secondary' }}>
                  Bỏ hết
                </Button>
                <ToggleButtonGroup
                  value={viewMode} exclusive size="small"
                  onChange={(_, v) => { if (v) setViewMode(v); }}
                  sx={{ flexShrink: 0 }}
                >
                  <ToggleButton value="matrix" disabled={!selectedRole} sx={{ px: 1.25, py: 0.5 }}>
                    <Tooltip title="Dạng bảng"><TableChartIcon sx={{ fontSize: 18 }} /></Tooltip>
                  </ToggleButton>
                  <ToggleButton value="list" disabled={!selectedRole} sx={{ px: 1.25, py: 0.5 }}>
                    <Tooltip title="Dạng danh sách"><ViewListIcon sx={{ fontSize: 18 }} /></Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Box>

            {/* ── Section 4: Content (flex 1, scrollable) ── */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {!selectedRole ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }} spacing={1.5}>
                  <ShieldIcon sx={{ fontSize: 52, color: 'text.disabled' }} />
                  <Typography variant="body2" color="text.disabled">
                    Chọn một vai trò ở trên để bắt đầu
                  </Typography>
                </Stack>
              ) : filteredAssignPerms.length === 0 ? (
                <Typography variant="body2" color="text.disabled" sx={{ py: 4, textAlign: 'center' }}>
                  Không tìm thấy quyền phù hợp.
                </Typography>
              ) : viewMode === 'matrix' && matrixData ? (
                    /* ── Matrix view ───────────────────────────── */
                    <TableContainer>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{
                                minWidth: 160, fontWeight: 700, fontSize: 12,
                                bgcolor: 'grey.100', borderRight: '2px solid',
                                borderColor: 'divider', position: 'sticky', left: 0, zIndex: 3,
                              }}
                            >
                              Nhóm chức năng
                            </TableCell>
                            {matrixData.actions.map((action) => (
                              <TableCell
                                key={action}
                                align="center"
                                sx={{
                                  fontWeight: 700, fontFamily: 'monospace', fontSize: 11,
                                  bgcolor: 'grey.100', minWidth: 68, px: 0.5,
                                  color: COMMON_ACTIONS.includes(action) ? '#3730a3' : 'text.secondary',
                                }}
                              >
                                {action}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {matrixData.groups.map((group, idx) => {
                            const allGroupPerms = Object.values(matrixData.groupMap[group] || {}).flat();
                            const editableGroupPerms = allGroupPerms.filter((p) => !inheritedPermissions.has(p.code));
                            const checkedGroupCount = editableGroupPerms.filter((p) => selectedPermissions.has(p.code)).length;
                            const allGroupChecked = editableGroupPerms.length > 0 && checkedGroupCount === editableGroupPerms.length;
                            const someGroupChecked = checkedGroupCount > 0 && !allGroupChecked;

                            return (
                              <TableRow
                                key={group}
                                sx={{ bgcolor: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)', '&:hover td': { bgcolor: 'rgba(99,102,241,0.04)' } }}
                              >
                                {/* Row header (group name + row-level checkbox) */}
                                <TableCell
                                  sx={{
                                    borderRight: '2px solid', borderColor: 'divider',
                                    py: 0.75, px: 1.25,
                                    position: 'sticky', left: 0, zIndex: 1,
                                    bgcolor: idx % 2 === 0 ? 'white' : 'rgba(0,0,0,0.015)',
                                  }}
                                >
                                  <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <Checkbox
                                      size="small"
                                      checked={allGroupChecked}
                                      indeterminate={someGroupChecked}
                                      disabled={editableGroupPerms.length === 0}
                                      onChange={() => toggleGroupRow(allGroupPerms)}
                                      sx={{ p: 0.25, flexShrink: 0, '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: '#4f46e5' } }}
                                    />
                                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: 12, lineHeight: 1.3 }}>
                                      {group}
                                    </Typography>
                                  </Stack>
                                </TableCell>

                                {/* Action cells */}
                                {matrixData.actions.map((action) => {
                                  const cellPerms = matrixData.groupMap[group]?.[action] || [];
                                  if (cellPerms.length === 0) {
                                    return (
                                      <TableCell key={action} align="center" sx={{ color: 'text.disabled', fontSize: 13, px: 0.5 }}>
                                        –
                                      </TableCell>
                                    );
                                  }

                                  const inheritedInCell = cellPerms.filter((p) => inheritedPermissions.has(p.code));
                                  const editableInCell = cellPerms.filter((p) => !inheritedPermissions.has(p.code));
                                  const checkedInCell = editableInCell.filter((p) => selectedPermissions.has(p.code)).length;
                                  const allCellChecked = editableInCell.length > 0 && checkedInCell === editableInCell.length;
                                  const someCellChecked = checkedInCell > 0 && !allCellChecked;
                                  const allInherited = editableInCell.length === 0;

                                  if (allInherited) {
                                    return (
                                      <TableCell key={action} align="center"
                                        sx={{ bgcolor: 'rgba(234,179,8,0.08)', px: 0.5 }}>
                                        <Tooltip title={cellPerms.map((p) => p.code).join(', ')}>
                                          <LockIcon sx={{ fontSize: 14, color: '#b45309', display: 'block', mx: 'auto' }} />
                                        </Tooltip>
                                      </TableCell>
                                    );
                                  }

                                  const tooltipText = cellPerms.map((p) => p.code).join('\n');
                                  return (
                                    <TableCell
                                      key={action}
                                      align="center"
                                      sx={{
                                        px: 0.5, cursor: 'pointer',
                                        bgcolor: allCellChecked
                                          ? 'rgba(99,102,241,0.1)'
                                          : someCellChecked ? 'rgba(99,102,241,0.06)' : 'transparent',
                                        '&:hover': { bgcolor: 'rgba(99,102,241,0.12) !important' },
                                        transition: 'background 0.1s',
                                      }}
                                      onClick={() => toggleCellPerms(editableInCell, allCellChecked)}
                                    >
                                      <Tooltip title={tooltipText}>
                                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.25}>
                                          {inheritedInCell.length > 0 && (
                                            <LockIcon sx={{ fontSize: 10, color: '#b45309', flexShrink: 0 }} />
                                          )}
                                          <Checkbox
                                            size="small"
                                            checked={allCellChecked}
                                            indeterminate={someCellChecked}
                                            onChange={() => toggleCellPerms(editableInCell, allCellChecked)}
                                            onClick={(e) => e.stopPropagation()}
                                            sx={{ p: 0.25, '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: '#4f46e5' } }}
                                          />
                                          {cellPerms.length > 1 && (
                                            <Typography sx={{ fontSize: 9, color: 'text.disabled', lineHeight: 1 }}>
                                              {cellPerms.length}
                                            </Typography>
                                          )}
                                        </Stack>
                                      </Tooltip>
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    /* ── List view ─────────────────────────────── */
                    <Box sx={{ px: 2.5, pb: 2, pt: 1 }}>
                      <Stack spacing={1.5}>
                        {Object.entries(assignGroups).map(([groupName, groupPerms]) => {
                          const groupCodes = groupPerms.map((p) => p.code);
                          const editableCodes = groupCodes.filter((c) => !inheritedPermissions.has(c));
                          const checkedOwn = editableCodes.filter((c) => selectedPermissions.has(c)).length;
                          const checkedInherited = groupCodes.filter((c) => inheritedPermissions.has(c)).length;
                          const totalChecked = checkedOwn + checkedInherited;
                          const allEditableChecked = editableCodes.length > 0 && checkedOwn === editableCodes.length;
                          const someChecked = totalChecked > 0 && !allEditableChecked;
                          const isCollapsed = collapsedGroups[groupName];

                          return (
                            <Box key={groupName} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
                              <Stack direction="row" alignItems="center"
                                sx={{ px: 1.5, py: 1, bgcolor: 'grey.50', cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'grey.100' } }}
                                onClick={() => toggleGroupCollapse(groupName)}>
                                <Checkbox
                                  size="small"
                                  checked={allEditableChecked}
                                  indeterminate={someChecked}
                                  disabled={editableCodes.length === 0}
                                  onChange={() => toggleGroup(groupPerms)}
                                  onClick={(e) => e.stopPropagation()}
                                  sx={{ p: 0, mr: 1, flexShrink: 0, '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: '#4f46e5' } }}
                                />
                                <Typography variant="caption" fontWeight={700} color="text.secondary"
                                  sx={{ flex: 1, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 11 }}>
                                  {groupName}
                                </Typography>
                                <Chip
                                  label={`${totalChecked}/${groupCodes.length}`}
                                  size="small"
                                  sx={{
                                    fontSize: 10, height: 18, mr: 1,
                                    bgcolor: totalChecked > 0 ? 'rgba(99,102,241,0.1)' : 'grey.200',
                                    color: totalChecked > 0 ? '#4338ca' : 'text.secondary', fontWeight: 700,
                                  }}
                                />
                                {checkedInherited > 0 && (
                                  <Chip label={`${checkedInherited} kế thừa`} size="small"
                                    sx={{ fontSize: 10, height: 18, mr: 1, bgcolor: 'rgba(234,179,8,0.15)', color: '#92400e', fontWeight: 600 }} />
                                )}
                                {isCollapsed
                                  ? <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                                  : <ExpandLessIcon sx={{ fontSize: 16, color: 'text.disabled' }} />}
                              </Stack>

                              <Collapse in={!isCollapsed}>
                                <Stack spacing={0} sx={{ p: 0.75 }}>
                                  {groupPerms.map((perm) => {
                                    const isInherited = inheritedPermissions.has(perm.code);
                                    const isChecked = isInherited || selectedPermissions.has(perm.code);
                                    return (
                                      <Box
                                        key={perm._id || perm.id}
                                        onClick={() => !isInherited && togglePermission(perm.code)}
                                        sx={{
                                          display: 'flex', alignItems: 'flex-start', p: 1, borderRadius: 1.5,
                                          cursor: isInherited ? 'default' : 'pointer',
                                          bgcolor: isInherited
                                            ? 'rgba(234,179,8,0.05)'
                                            : isChecked ? 'rgba(99,102,241,0.06)' : 'transparent',
                                          '&:hover': isInherited ? {} : { bgcolor: isChecked ? 'rgba(99,102,241,0.1)' : 'action.hover' },
                                          transition: 'background 0.1s', opacity: isInherited ? 0.8 : 1,
                                        }}
                                      >
                                        {isInherited ? (
                                          <Tooltip title="Quyền kế thừa từ role cha – không thể bỏ">
                                            <LockIcon sx={{ fontSize: 14, mt: 0.3, mr: 1.5, flexShrink: 0, color: '#b45309' }} />
                                          </Tooltip>
                                        ) : (
                                          <Checkbox
                                            size="small" checked={isChecked}
                                            onChange={() => togglePermission(perm.code)}
                                            onClick={(e) => e.stopPropagation()}
                                            sx={{ p: 0, mr: 1.5, mt: 0.1, flexShrink: 0, '&.Mui-checked': { color: '#4f46e5' } }}
                                          />
                                        )}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <Typography variant="body2" fontWeight={600} noWrap
                                              sx={{ fontFamily: 'monospace', fontSize: 12, color: isInherited ? '#92400e' : isChecked ? '#3730a3' : 'text.primary' }}>
                                              {perm.code}
                                            </Typography>
                                            {isInherited && (
                                              <Chip label="kế thừa" size="small"
                                                sx={{ fontSize: 9, height: 16, bgcolor: 'rgba(234,179,8,0.15)', color: '#92400e', fontWeight: 600 }} />
                                            )}
                                          </Stack>
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
                    </Box>
                  )}
                </Box>

            {/* ── Section 5: Footer save (luôn hiện, disabled khi chưa chọn role) ── */}
            <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
              <Stack direction="row" justifyContent="flex-end">
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  disabled={!selectedRole || loading}
                  onClick={handleSaveRolePermissions}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
                >
                  {loading ? 'Đang lưu...' : 'Lưu phân quyền'}
                </Button>
              </Stack>
            </Box>

          </Paper>
        </Grid>
      </Grid>

      {/* Dialog: Sửa permission */}
      <Dialog
        open={showPermissionForm}
        onClose={handleClosePermissionForm}
        maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2, overflow: 'hidden' } } }}
      >
        <Box sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShieldIcon sx={{ color: 'white', fontSize: 22 }} />
          <Typography variant="h6" fontWeight={700} color="white">Sửa quyền</Typography>
        </Box>

        <Box component="form" onSubmit={handleSavePermission}>
          <DialogContent sx={{ pt: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TextField
              label="Code"
              value={permissionForm.code}
              fullWidth disabled size="small" sx={{ mb: 2 }}
              helperText="Không thể thay đổi code"
            />

            <TextField
              label={<>Mô tả <Box component="span" sx={{ color: 'error.main' }}>*</Box></>}
              value={permissionForm.description}
              onChange={(e) => setPermissionForm({ ...permissionForm, description: e.target.value })}
              fullWidth required multiline rows={2}
              slotProps={{ htmlInput: { maxLength: 255 } }}
              placeholder="Mô tả quyền này"
              size="small" sx={{ mb: 2 }}
            />

            <Autocomplete
              freeSolo
              options={existingGroups}
              value={permissionForm.group}
              onInputChange={(_, val) => setPermissionForm({ ...permissionForm, group: val })}
              renderInput={(params) => (
                <TextField
                  {...params} label="Nhóm chức năng" size="small"
                  placeholder="VD: Điểm danh, Quản lý học sinh..."
                  helperText="Gõ tên nhóm mới hoặc chọn nhóm đã có"
                />
              )}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={handleClosePermissionForm} variant="outlined" color="inherit" sx={{ textTransform: 'none', borderRadius: 1.5 }}>
              Hủy
            </Button>
            <Button type="submit" variant="contained" disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}>
              {loading ? 'Đang lưu...' : 'Cập nhật'}
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
