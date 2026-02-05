import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSystemAdmin } from '../../context/SystemAdminContext';

function ManageAccounts() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [success, setSuccess] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [usernameHint, setUsernameHint] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [userForm, setUserForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    status: 'active',
    roleIds: [],
  });

  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const {
    getUsers,
    getRoles,
    createUser,
    updateUser,
    deleteUser,
    loading,
    error,
    setError,
  } = useSystemAdmin();

  useEffect(() => {
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
        const [usersData, rolesData] = await Promise.all([
          getUsers(),
          getRoles(),
        ]);
        setUsers(usersData || []);
        setRoles(rolesData || []);
      } catch (err) {
        // Error được xử lý trong context
      }
    };

    fetchData();
  }, [navigate, user, getUsers, getRoles, setError, isInitializing]);

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const menuItems = [
    { key: 'overview', label: 'Tổng quan hệ thống' },
    { key: 'schools', label: 'Quản lý trường' },
    { key: 'accounts', label: 'Quản lý tài khoản' },
    { key: 'roles', label: 'Quản lý vai trò' },
    { key: 'permissions', label: 'Quản lý phân quyền' },
    { key: 'reports', label: 'Báo cáo tổng hợp' },
  ];

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      navigate('/system-admin');
    } else if (key === 'accounts') {
      navigate('/system-admin/manage-accounts');
    } else if (key === 'roles') {
      navigate('/system-admin/manage-roles');
    } else if (key === 'permissions') {
      navigate('/system-admin/manage-permissions');
    } else {
      navigate('/system-admin');
    }
  };

  const handleOpenUserForm = (account = null) => {
    setSaveErrorMessage('');
    if (account) {
      setEditingUser(account);
      setUserForm({
        username: account.username || '',
        fullName: account.fullName || '',
        email: account.email || '',
        password: '',
        confirmPassword: '',
        status: account.status || 'active',
        roleIds: (account.roles || []).map((r) => r._id || r.id).filter(Boolean),
      });
    } else {
      setEditingUser(null);
      setUserForm({
        username: '',
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        status: 'active',
        roleIds: [],
      });
    }
    setShowUserForm(true);
  };

  const handleCloseUserForm = () => {
    setSaveErrorMessage('');
    setShowUserForm(false);
    setEditingUser(null);
    setUserForm({
      username: '',
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      status: 'active',
      roleIds: [],
    });
  };

  const handleToggleRole = (roleId) => {
    setUserForm((prev) => {
      const ids = prev.roleIds || [];
      const has = ids.includes(roleId);
      if (has) {
        return { ...prev, roleIds: ids.filter((id) => id !== roleId) };
      }
      return { ...prev, roleIds: [...ids, roleId] };
    });
  };

  const handleChangeField = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'username') {
      if (value && (/[\s]/.test(value) || /[^A-Za-z0-9]/.test(value))) {
        setUsernameHint('Tài khoản không được chứa khoảng trắng và ký tự đặc biệt.');
      } else {
        setUsernameHint('');
      }
    }
    if (name === 'password') {
      const hasUpper = /[A-Z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[^A-Za-z0-9]/.test(value);
      if (value && (!hasUpper || !hasNumber || !hasSpecial)) {
        setPasswordHint(
          'Mật khẩu phải có ít nhất 1 chữ cái viết hoa, 1 số và 1 ký tự đặc biệt.'
        );
      } else {
        setPasswordHint('');
      }
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess('');
      setSaveErrorMessage('');

      const usernameTrimmed = (userForm.username || '').trim();
      if (/[\s]/.test(usernameTrimmed) || /[^A-Za-z0-9]/.test(usernameTrimmed)) {
        const msg = 'Tài khoản không được chứa khoảng trắng và ký tự đặc biệt.';
        setError(msg);
        setSaveErrorMessage(msg);
        return;
      }

      if (userForm.password || !editingUser) {
        if (!userForm.password) {
          const msg = 'Vui lòng nhập mật khẩu cho tài khoản mới.';
          setError(msg);
          setSaveErrorMessage(msg);
          return;
        }
        if (userForm.password !== userForm.confirmPassword) {
          const msg = 'Mật khẩu và xác nhận mật khẩu không khớp.';
          setError(msg);
          setSaveErrorMessage(msg);
          return;
        }
        const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
        if (!strongPasswordRegex.test(userForm.password)) {
          const msg = 'Mật khẩu phải có ít nhất 1 chữ cái viết hoa, 1 số và 1 ký tự đặc biệt, tối thiểu 6 ký tự.';
          setError(msg);
          setSaveErrorMessage(msg);
          return;
        }
      }

      if (!editingUser) {
        const payload = {
          username: usernameTrimmed,
          password: userForm.password,
          fullName: userForm.fullName.trim(),
          email: userForm.email.trim(),
          status: userForm.status,
          roleIds: userForm.roleIds || [],
        };
        await createUser(payload);
        setSuccess('Tạo tài khoản thành công.');
      } else {
        const payload = {
          username: usernameTrimmed,
          fullName: userForm.fullName.trim(),
          email: userForm.email.trim(),
          status: userForm.status,
          roleIds: userForm.roleIds || [],
        };
        if (userForm.password) {
          payload.password = userForm.password;
        }
        await updateUser(editingUser._id || editingUser.id, payload);
        setSuccess('Cập nhật tài khoản thành công.');
      }

      setTimeout(() => setSuccess(''), 3000);
      handleCloseUserForm();

      const refreshedUsers = await getUsers();
      setUsers(refreshedUsers || []);
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Có lỗi khi lưu tài khoản.';
      setSaveErrorMessage(msg);
      // Error cũng được set trong context
    }
  };

  const openDeleteConfirm = (account) => {
    setDeleteConfirmUser(account);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmUser(null);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteConfirmUser) return;

    try {
      setError(null);
      setSuccess('');
      await deleteUser(deleteConfirmUser._id || deleteConfirmUser.id);
      setSuccess('Tài khoản đã được khóa (xóa mềm) thành công.');
      setTimeout(() => setSuccess(''), 3000);

      const refreshedUsers = await getUsers();
      setUsers(refreshedUsers || []);
    } catch (err) {
      // Error đã được xử lý trong context
    } finally {
      closeDeleteConfirm();
    }
  };

  const userName = user?.fullName || user?.username || 'System Admin';

  const renderRoleNames = (account) => {
    const roleNames = (account.roles || [])
      .map((r) => r.roleName || (typeof r === 'string' ? r : ''))
      .filter(Boolean);
    if (roleNames.length === 0) {
      return <span className="text-gray-400">Chưa gán vai trò</span>;
    }
    return roleNames.join(', ');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="px-6 py-4 font-semibold text-lg border-b border-gray-800">
          Menu
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = item.key === 'accounts';
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleMenuSelect(item.key)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition ${
                  isActive ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'
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
            <h1 className="text-2xl font-semibold text-gray-800">Quản lý tài khoản</h1>
            <p className="text-sm text-gray-500 mt-1">
              Thêm, sửa, xóa tài khoản và gán vai trò trong hệ thống.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm hover:bg-gray-50 transition"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    userName.charAt(0).toUpperCase()
                  )}
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

        {success && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-800">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Danh sách tài khoản</h3>
            <button
              type="button"
              onClick={() => handleOpenUserForm()}
              className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-700 transition-colors"
            >
              + Thêm tài khoản
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 text-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">Tài khoản</th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">Họ và tên</th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">Email</th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">Vai trò</th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-semibold border-b border-gray-200">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-gray-500"
                      colSpan={6}
                    >
                      Chưa có tài khoản nào trong hệ thống.
                    </td>
                  </tr>
                )}
                {users.map((account) => {
                  const userId = account._id || account.id;
                  const isActive = account.status === 'active';
                  return (
                    <tr key={userId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b border-gray-100 text-gray-900 font-medium">
                        {account.username}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-gray-800">
                        {account.fullName || (
                          <span className="text-gray-400">Chưa cập nhật</span>
                        )}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-gray-800">
                        {account.email}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-gray-800">
                        {renderRoleNames(account)}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isActive ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenUserForm(account)}
                            className="inline-flex items-center rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteConfirm(account)}
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

        {/* Form thêm/sửa tài khoản */}
        {showUserForm && (
          <div className="fixed inset-0 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingUser ? 'Sửa tài khoản' : 'Thêm tài khoản mới'}
              </h3>
              <form onSubmit={handleSaveUser}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tài khoản <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={userForm.username}
                      onChange={handleChangeField}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="VD: schooladmin01"
                      required
                    />
                    {usernameHint && (
                      <p className="mt-1 text-xs text-amber-600">
                        {usernameHint}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={userForm.fullName}
                      onChange={handleChangeField}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={userForm.email}
                      onChange={handleChangeField}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="VD: example@gmail.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái
                    </label>
                    <select
                      name="status"
                      value={userForm.status}
                      onChange={handleChangeField}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="active">Đang hoạt động</option>
                      <option value="inactive">Đã khóa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu {editingUser ? '(để trống nếu không đổi)' : <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={userForm.password}
                      onChange={handleChangeField}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={editingUser ? 'Để trống nếu giữ nguyên mật khẩu' : 'Nhập mật khẩu'}
                      required={!editingUser}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Xác nhận mật khẩu {editingUser ? '' : <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={userForm.confirmPassword}
                      onChange={handleChangeField}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Nhập lại mật khẩu"
                      required={!editingUser}
                    />
                  </div>
                </div>

                {passwordHint && (
                  <p className="mt-2 text-xs text-amber-600">
                    {passwordHint}
                  </p>
                )}

                {saveErrorMessage && (
                  <div className="mt-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
                    {saveErrorMessage}
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vai trò (có thể chọn nhiều)
                  </label>
                  {roles.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      Chưa có vai trò nào. Vui lòng tạo vai trò trước.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {roles.map((role) => {
                        const roleId = role.id || role._id;
                        const checked = (userForm.roleIds || []).includes(roleId);
                        return (
                          <label
                            key={roleId}
                            className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer px-2 py-1 rounded hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleRole(roleId)}
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className="font-medium">{role.roleName}</span>
                            {role.description && (
                              <span className="text-xs text-gray-500">
                                ({role.description})
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseUserForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Đang lưu...' : editingUser ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Hộp xác nhận xóa (khóa) tài khoản */}
        {deleteConfirmUser && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Xóa tài khoản?
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                Bạn có chắc chắn muốn xóa (khóa) tài khoản{' '}
                <span className="font-semibold">{deleteConfirmUser.username}</span>
                ? Tài khoản sẽ bị <span className="font-semibold">khóa lại</span> và
                người dùng sẽ không thể đăng nhập, nhưng dữ liệu vẫn được giữ trong hệ thống.
              </p>
              <p className="text-xs text-amber-600 mb-4">
                Thao tác này có thể được hoàn tác bằng cách chuyển trạng thái tài khoản sang
                &quot;Đang hoạt động&quot; trong form chỉnh sửa tài khoản.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmDeleteUser}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Đang xử lý...' : 'Xóa (khóa) tài khoản'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ManageAccounts;

