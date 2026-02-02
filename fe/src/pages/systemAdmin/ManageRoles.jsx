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
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const { 
    getRoles, 
    createRole, 
    updateRole, 
    deleteRole,
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
                      <td className="px-4 py-3 border-b border-gray-100 text-gray-600">
                        {role.permissions?.length || 0}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
    </RoleLayout>
  );
}

export default ManageRoles;
