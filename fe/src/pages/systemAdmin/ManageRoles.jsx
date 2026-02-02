import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSystemAdmin } from '../../context/SystemAdminContext';
import RoleLayout from '../../layouts/RoleLayout';

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
    setError 
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
    } else if (key === 'roles') {
      navigate('/system-admin/manage-roles');
    } else if (key === 'permissions') {
      navigate('/system-admin/manage-permissions');
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
    setShowRoleForm(true);
  };

  const handleCloseRoleForm = () => {
    setShowRoleForm(false);
    setEditingRole(null);
    setRoleForm({ roleName: '', description: '' });
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess('');

      if (editingRole) {
        // Cập nhật role
        await updateRole(editingRole.id || editingRole._id, roleForm.roleName, roleForm.description);
        setSuccess('Cập nhật vai trò thành công.');
      } else {
        // Tạo role mới
        await createRole(roleForm.roleName, roleForm.description);
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

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vai trò này? Vai trò sẽ không thể khôi phục.')) {
      return;
    }

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
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
    >
      {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
            {error}
          </div>
      )}
      {success && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-800">
            {success}
          </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Danh sách vai trò</h3>
            <button
              type="button"
              onClick={() => handleOpenRoleForm()}
              className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-700 transition-colors"
            >
              + Thêm vai trò
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 text-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                    Tên vai trò
                  </th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                    Mô tả
                  </th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                    Số phân quyền
                  </th>
                  <th className="px-4 py-3 text-right font-semibold border-b border-gray-200">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {roles.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-gray-500"
                      colSpan={4}
                    >
                      Chưa có vai trò nào. Hãy thêm vai trò mới.
                    </td>
                  </tr>
                )}
                {roles.map((role) => {
                  const roleId = role.id || role._id;
                  return (
                    <tr key={roleId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b border-gray-100 text-gray-900 font-medium">
                        {role.roleName}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-gray-800">
                        {role.description || <span className="text-gray-400">Không có mô tả</span>}
                      </td>
                      <td 
                        className="px-4 py-3 border-b border-gray-100"
                      >
                        <div
                          className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-indigo-600 transition-colors group"
                          onClick={() => handleOpenPermissionModal(role)}
                          title="Click để sửa phân quyền"
                        >
                          <span className="font-medium">{role.permissions?.length || 0}</span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                            />
                          </svg>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenRoleForm(role)}
                            className="inline-flex items-center rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(roleId)}
                            disabled={loading}
                            className="inline-flex items-center rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      </div>

      {/* Form thêm/sửa role */}
      {showRoleForm && (
         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingRole ? 'Sửa vai trò' : 'Thêm vai trò mới'}
            </h3>
            <form onSubmit={handleSaveRole}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên vai trò <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roleForm.roleName}
                  onChange={(e) => setRoleForm({ ...roleForm, roleName: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="VD: Teacher, SchoolAdmin"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Mô tả vai trò này"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseRoleForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Đang lưu...' : editingRole ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal quản lý phân quyền cho vai trò */}
      {showPermissionModal && selectedRoleForPermissions && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quản lý phân quyền cho vai trò: {selectedRoleForPermissions.roleName}
            </h3>
            
            <div className="mb-4 text-sm text-gray-600">
              Đã chọn: {selectedPermissions.size}/{permissions.length} phân quyền
            </div>

            <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-lg p-4">
              {permissions.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  Chưa có phân quyền nào trong hệ thống.
                </p>
              ) : (
                <div className="space-y-2">
                  {permissions.map((perm) => {
                    const isChecked = selectedPermissions.has(perm.code);
                    return (
                      <label
                        key={perm._id || perm.id}
                        className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-500'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.code)}
                          className="mt-0.5 mr-3 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm ${isChecked ? 'text-indigo-900' : 'text-gray-900'}`}>
                            {perm.code}
                          </div>
                          {perm.description && (
                            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {perm.description}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClosePermissionModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveRolePermissions}
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Đang lưu...' : 'Lưu phân quyền'}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}

export default ManageRoles;
