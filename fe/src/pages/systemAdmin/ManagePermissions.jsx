import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSystemAdmin } from '../../context/SystemAdminContext';

function ManagePermissions() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]); // Tất cả permissions trong hệ thống
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState(new Set()); // Set of permission codes
  const [success, setSuccess] = useState('');
  const [showPermissionForm, setShowPermissionForm] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null); // Permission đang sửa
  const [permissionForm, setPermissionForm] = useState({ code: '', description: '' });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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

  const handleViewProfile = () => {
    navigate('/profile');
  };

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
    setShowPermissionForm(true);
  };

  const handleClosePermissionForm = () => {
    setShowPermissionForm(false);
    setEditingPermission(null);
    setPermissionForm({ code: '', description: '' });
  };

  const handleSavePermission = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess('');

      if (editingPermission) {
        // Cập nhật permission
        await updatePermission(editingPermission._id || editingPermission.id, permissionForm.code, permissionForm.description);
        setSuccess('Cập nhật phân quyền thành công.');
      } else {
        // Tạo permission mới
        await createPermission(permissionForm.code, permissionForm.description);
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

  const handleDeletePermission = async (permissionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phân quyền này?')) {
      return;
    }

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
        const updatedRole = rolesData.find(r => (r.id || r._id) === (selectedRole.id || selectedRole._id));
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

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="px-6 py-4 font-semibold text-lg border-b border-gray-800">
          Menu
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = item.key === 'permissions';
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleMenuSelect(item.key)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'hover:bg-gray-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-gray-800">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-800 transition text-red-400"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Quản lý phân quyền cho vai trò</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gán phân quyền (permissions) cho từng vai trò trong hệ thống.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm hover:bg-gray-50 transition"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <span className="font-medium">{userName}</span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-10">
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleViewProfile();
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Xem hồ sơ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        navigate('/login', { replace: true });
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Click outside để đóng dropdown */}
        {showProfileMenu && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowProfileMenu(false)}
          />
        )}

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

        {/* Quản lý Permissions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Quản lý phân quyền</h3>
            <button
              type="button"
              onClick={() => handleOpenPermissionForm()}
              className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-700 transition-colors"
            >
              + Thêm phân quyền
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {permissions.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-full">Chưa có phân quyền nào.</p>
            ) : (
              permissions.map((perm) => (
                <div
                  key={perm._id || perm.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">{perm.code}</div>
                    <div className="text-xs text-gray-500 mt-1">{perm.description}</div>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPermissionForm(perm)}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePermission(perm._id || perm.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Form thêm/sửa permission */}
        {showPermissionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingPermission ? 'Sửa phân quyền' : 'Thêm phân quyền mới'}
              </h3>
              <form onSubmit={handleSavePermission}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={permissionForm.code}
                    onChange={(e) => setPermissionForm({ ...permissionForm, code: e.target.value.toUpperCase() })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="VD: CREATE_USER"
                    required
                    disabled={!!editingPermission}
                  />
                  {editingPermission && (
                    <p className="text-xs text-gray-500 mt-1">Không thể thay đổi code khi sửa</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={permissionForm.description}
                    onChange={(e) => setPermissionForm({ ...permissionForm, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Mô tả phân quyền này"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClosePermissionForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Đang lưu...' : editingPermission ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Danh sách vai trò */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Danh sách vai trò</h3>
            <div className="space-y-2">
              {roles.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có vai trò nào.</p>
              ) : (
                roles.map((role) => {
                  const roleId = role.id || role._id;
                  const isSelected = selectedRole && (selectedRole.id || selectedRole._id) === roleId;
                  return (
                    <button
                      key={roleId}
                      type="button"
                      onClick={() => handleSelectRole(role)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                          : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">{role.roleName}</div>
                      {role.description && (
                        <div className="text-xs text-gray-500 mt-1">{role.description}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {role.permissions?.length || 0} phân quyền
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Quản lý phân quyền cho vai trò đã chọn */}
          <div className="bg-white rounded-lg shadow p-6">
            {selectedRole ? (
              <>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">
                    Phân quyền cho vai trò: {selectedRole.roleName}
                  </h3>
                  {selectedRole.description && (
                    <p className="text-xs text-gray-500">{selectedRole.description}</p>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 mb-4 max-h-96 overflow-y-auto">
                    {permissions.length === 0 ? (
                      <p className="text-sm text-gray-500">Chưa có phân quyền nào trong hệ thống.</p>
                    ) : (
                      permissions.map((perm) => {
                        const isChecked = selectedPermissions.has(perm.code);
                        return (
                          <button
                            key={perm._id || perm.id}
                            type="button"
                            onClick={() => togglePermission(perm.code)}
                            className={`inline-flex items-center rounded-lg border px-3 py-2 text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                            }`}
                          >
                            <span className="font-medium mr-2">{perm.code}</span>
                            {perm.description && (
                              <span className="text-xs opacity-90">- {perm.description}</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={loading}
                    className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    onClick={handleSaveRolePermissions}
                  >
                    {loading ? 'Đang lưu...' : 'Lưu phân quyền'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">
                  Vui lòng chọn một vai trò để quản lý phân quyền.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ManagePermissions;
