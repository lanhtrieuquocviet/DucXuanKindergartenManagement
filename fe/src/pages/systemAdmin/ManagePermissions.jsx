import {
  Alert,
  Box,
  Fade,
  Grid,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useSystemAdmin } from '../../context/SystemAdminContext';


// Sub-components
import PermissionHeader from './components/PermissionHeader';
import PermissionListPanel from './components/PermissionListPanel';
import PermissionAssignmentPanel from './components/PermissionAssignmentPanel';
import PermissionDialog from './components/PermissionDialog';

// Utils
import {
  COMMON_ACTIONS,
  getActionStyle,
  groupByField,
  ROLE_RELEVANT_GROUPS
} from './utils/permissionUtils';

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
  const [hoveredPerm, setHoveredPerm] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false, title: '', message: '', onConfirm: null,
  });

  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const {
    getRoles, getPermissions, createPermission, updatePermission, deletePermission, updateRolePermissions,
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
      } catch (_) { }
    };
    fetchData();
  }, [navigate, user, getRoles, getPermissions, setError, isInitializing]);


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

      if (editingPermission) {
        await updatePermission(editingPermission._id || editingPermission.id, code, description, group);
        setSuccess('Cập nhật quyền thành công.');
      } else {
        await createPermission(code, description, group);
        setSuccess('Tạo quyền mới thành công.');
      }

      setTimeout(() => setSuccess(''), 3000);
      setShowPermissionForm(false);
      const permissionsData = await getPermissions();
      setPermissions(permissionsData || []);
    } catch (_) { }
  };

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
    } catch (_) { }
  };

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

  const relevantGroups = useMemo(() => {
    if (!selectedRole) return null;
    const defined = ROLE_RELEVANT_GROUPS[selectedRole.roleName];
    if (defined === undefined && selectedRole.parentName) {
      return ROLE_RELEVANT_GROUPS[selectedRole.parentName] ?? null;
    }
    return defined ?? null;
  }, [selectedRole]);

  const filteredAssignPerms = useMemo(() => {
    let base = permissions;
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

  const calculateProgress = (groupPerms) => {
    const total = groupPerms.length;
    if (total === 0) return 0;
    const checked = groupPerms.filter(p => selectedPermissions.has(p.code) || inheritedPermissions.has(p.code)).length;
    return Math.round((checked / total) * 100);
  };

  const userName = user?.fullName || user?.username || 'System Admin';

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

      <PermissionHeader 
        totalPermissions={permissions.length} 
        groupCount={existingGroups.length} 
      />

      <Grid container spacing={2} alignItems="stretch" sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        <Grid item xs={12} md={2.5}>
          <PermissionListPanel 
            listGroups={listGroups}
            permSearch={permSearch}
            setPermSearch={setPermSearch}
            collapsedGroups={collapsedGroups}
            toggleGroupCollapse={(key) => setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }))}
            handleOpenPermissionForm={handleOpenPermissionForm}
            getActionStyle={getActionStyle}
          />
        </Grid>

        <Grid item xs={12} md={9.5}>
          <PermissionAssignmentPanel 
            selectedRole={selectedRole}
            roles={roles}
            handleSelectRole={handleSelectRole}
            assignSearch={assignSearch}
            setAssignSearch={setAssignSearch}
            handleSelectAll={handleSelectAll}
            handleDeselectAll={handleDeselectAll}
            viewMode={viewMode}
            setViewMode={setViewMode}
            handleSaveRolePermissions={handleSaveRolePermissions}
            selectedPermissions={selectedPermissions}
            inheritedPermissions={inheritedPermissions}
            relevantGroups={relevantGroups}
            showAllPerms={showAllPerms}
            setShowAllPerms={setShowAllPerms}
            matrixData={matrixData}
            calculateProgress={calculateProgress}
            toggleGroupRow={toggleGroupRow}
            toggleCellPerms={toggleCellPerms}
            setHoveredPerm={setHoveredPerm}
            togglePermission={togglePermission}
            assignGroups={assignGroups}
            getActionStyle={getActionStyle}
          />
        </Grid>
      </Grid>

      <PermissionDialog 
        open={showPermissionForm}
        onClose={() => setShowPermissionForm(false)}
        editingPermission={editingPermission}
        permissionForm={permissionForm}
        setPermissionForm={setPermissionForm}
        onSave={handleSavePermission}
        loading={loading}
      />

      {/* Floating Info Panel */}
      <Fade in={!!hoveredPerm}>
        <Paper elevation={10} sx={{
          position: 'fixed', bottom: 24, right: 24, width: 320, p: 2, borderRadius: 4,
          bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
          border: '1px solid', borderColor: 'primary.light', zIndex: 2000
        }}>
          {hoveredPerm && (
            <>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: 1.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: getActionStyle(hoveredPerm.code).bg, color: getActionStyle(hoveredPerm.code).text
                }}>
                  {getActionStyle(hoveredPerm.code).icon}
                </Box>
                <Typography variant="subtitle2" fontWeight={800}>{hoveredPerm.code}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">{hoveredPerm.description}</Typography>
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700 }}>NHÓM: {hoveredPerm.group || 'Chưa phân nhóm'}</Typography>
              </Box>
            </>
          )}
        </Paper>
      </Fade>

      <ConfirmDialog
        open={confirmState.open} title={confirmState.title} message={confirmState.message}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmState.onConfirm}
      />
    </Box>
  );
}

export default ManagePermissions;
