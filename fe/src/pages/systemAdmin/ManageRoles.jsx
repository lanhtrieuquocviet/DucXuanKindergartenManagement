import { Alert } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useSystemAdmin } from '../../context/SystemAdminContext';
import RoleLayout from '../../layouts/RoleLayout';
import { ENDPOINTS, get, put } from '../../service/api';

// Sub-components
import RoleHeader from './components/RoleHeader';
import RoleTable from './components/RoleTable';
import RoleDialog from './components/RoleDialog';
import RolePermissionDialog from './components/RolePermissionDialog';

function ManageRoles() {
  const [roles, setRoles] = useState([]);
  const [success, setSuccess] = useState('');
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ roleName: '', description: '', parentId: '', linkedPositions: [] });
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [inheritedPermissions, setInheritedPermissions] = useState(new Set());
  const [permSearch, setPermSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [rolePage, setRolePage] = useState(0);
  const [roleRowsPerPage, setRoleRowsPerPage] = useState(10);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [jobPositions, setJobPositions] = useState([]);
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

  const fetchJobPositions = async () => {
    try {
      const res = await get(ENDPOINTS.SYSTEM_ADMIN.JOB_POSITIONS);
      setJobPositions(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải chức vụ:', err);
    }
  };

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('SystemAdmin')) { navigate('/', { replace: true }); return; }

    const fetchData = async () => {
      try {
        setError(null);
        const rolesData = await getRoles();
        setRoles(rolesData || []);
        await fetchJobPositions();
      } catch (_) {}
    };
    fetchData();
  }, [navigate, user, getRoles, setError, isInitializing]);


  const handleOpenRoleForm = (role = null) => {
    setEditingRole(role);
    const linked = role 
      ? jobPositions.filter(jp => jp.roleName === role.roleName).map(jp => jp.title)
      : [];

    setRoleForm(role
      ? { 
          roleName: role.roleName || '', 
          description: role.description || '', 
          parentId: role.parentId || '',
          linkedPositions: linked
        }
      : { roleName: '', description: '', parentId: '', linkedPositions: [] }
    );
    setError(null);
    setShowRoleForm(true);
  };

  const handleCloseRoleForm = () => {
    setShowRoleForm(false);
    setEditingRole(null);
    setRoleForm({ roleName: '', description: '', parentId: '', linkedPositions: [] });
    setError(null);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess('');
      const roleName = roleForm.roleName.trim();
      const description = (roleForm.description || '').trim();
      const parentId = roleForm.parentId || null;

      if (roleName.length < 3 || roleName.length > 32) {
        setError('Tên vai trò phải có từ 3 đến 32 ký tự');
        return;
      }
      if (!/^[A-Za-z][A-Za-z0-9]*$/.test(roleName)) {
        setError('Tên vai trò chỉ được chứa chữ cái và số, bắt đầu bằng chữ cái.');
        return;
      }

      if (editingRole) {
        await updateRole(editingRole.id || editingRole._id, roleName, description, parentId);
        setSuccess('Cập nhật vai trò thành công.');
      } else {
        await createRole(roleName, description, parentId);
        setSuccess('Tạo vai trò thành công.');
      }

      const positionsToRemove = jobPositions.filter(jp => jp.roleName === roleName && !roleForm.linkedPositions.includes(jp.title));
      for (const jp of positionsToRemove) {
        await put(ENDPOINTS.SYSTEM_ADMIN.UPDATE_JOB_POSITION(jp._id), { roleName: null });
      }
      const positionsToAdd = jobPositions.filter(jp => roleForm.linkedPositions.includes(jp.title) && jp.roleName !== roleName);
      for (const jp of positionsToAdd) {
        await put(ENDPOINTS.SYSTEM_ADMIN.UPDATE_JOB_POSITION(jp._id), { roleName: roleName });
      }

      await fetchJobPositions();
      setTimeout(() => setSuccess(''), 3000);
      handleCloseRoleForm();
      const rolesData = await getRoles();
      setRoles(rolesData || []);
    } catch (_) {}
  };

  const handleDeleteRole = (roleId, roleName) => {
    setConfirmState({
      open: true,
      title: 'Xóa vai trò',
      message: `Bạn có chắc muốn xóa vai trò "${roleName}"? Hành động không thể hoàn tác.`,
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

  const handleOpenPermissionModal = async (role) => {
    try {
      setError(null);
      setPermSearch('');
      setCollapsedGroups({});
      setSelectedRoleForPermissions(role);
      const allPermissions = await getPermissions();
      setPermissions(allPermissions || []);
      const ownPerms = new Set();
      (role.permissions || []).forEach((p) => { if (p?.code) ownPerms.add(p.code); });
      setSelectedPermissions(ownPerms);
      const inherited = new Set();
      (role.inheritedPermissions || []).forEach((p) => { if (p?.code) inherited.add(p.code); });
      setInheritedPermissions(inherited);
      setShowPermissionModal(true);
    } catch (_) {}
  };

  const handleClosePermissionModal = () => {
    setShowPermissionModal(false);
    setSelectedRoleForPermissions(null);
  };

  const togglePermission = (code) => {
    const next = new Set(selectedPermissions);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelectedPermissions(next);
  };

  const handleSavePermissions = async () => {
    try {
      setError(null);
      await updateRolePermissions(
        selectedRoleForPermissions.id || selectedRoleForPermissions._id,
        Array.from(selectedPermissions)
      );
      setSuccess(`Đã cập nhật phân quyền cho vai trò ${selectedRoleForPermissions.roleName}`);
      setTimeout(() => setSuccess(''), 3000);
      handleClosePermissionModal();
      const rolesData = await getRoles();
      setRoles(rolesData || []);
    } catch (_) {}
  };

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) => (r.roleName || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)
    );
  }, [roles, roleSearch]);

  const paginatedRoles = filteredRoles.slice(
    rolePage * roleRowsPerPage,
    rolePage * roleRowsPerPage + roleRowsPerPage
  );

  const toggleGroupCollapse = (module) => {
    setCollapsedGroups((prev) => ({ ...prev, [module]: !prev[module] }));
  };

  const userName = user?.fullName || user?.username || 'System Admin';

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <RoleHeader onAddClick={() => handleOpenRoleForm()} />

      <RoleTable
        loading={loading}
        roles={roles}
        jobPositions={jobPositions}
        roleSearch={roleSearch}
        setRoleSearch={setRoleSearch}
        rolePage={rolePage}
        setRolePage={setRolePage}
        roleRowsPerPage={roleRowsPerPage}
        setRoleRowsPerPage={setRoleRowsPerPage}
        paginatedRoles={paginatedRoles}
        filteredRoles={filteredRoles}
        onEdit={handleOpenRoleForm}
        onDelete={handleDeleteRole}
        onOpenPermissions={handleOpenPermissionModal}
      />

      <RoleDialog
        open={showRoleForm}
        onClose={handleCloseRoleForm}
        editingRole={editingRole}
        roleForm={roleForm}
        setRoleForm={setRoleForm}
        roles={roles}
        jobPositions={jobPositions}
        loading={loading}
        error={error}
        onSubmit={handleSaveRole}
      />

      <RolePermissionDialog
        open={showPermissionModal}
        onClose={handleClosePermissionModal}
        selectedRole={selectedRoleForPermissions}
        permissions={permissions}
        selectedPermissions={selectedPermissions}
        inheritedPermissions={inheritedPermissions}
        permSearch={permSearch}
        setPermSearch={setPermSearch}
        collapsedGroups={collapsedGroups}
        onToggleGroup={toggleGroupCollapse}
        onTogglePermission={togglePermission}
        loading={loading}
        onSubmit={handleSavePermissions}
      />

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
        loading={loading}
      />
    </Box>
  );
}

export default ManageRoles;
