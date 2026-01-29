import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSystemAdmin } from '../../context/SystemAdminContext';

function ManagePermission() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState({}); // { userId: Set(roleId) }
  const [success, setSuccess] = useState('');
  const [selectedUserForPerm, setSelectedUserForPerm] = useState(null);
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const { getUsers, getRoles, updateUserRoles, loading, error, setError } = useSystemAdmin();

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

    const fetchAll = async () => {
      try {
        setError(null);

        const [usersData, rolesData] = await Promise.all([
          getUsers(),
          getRoles(),
        ]);

        setUsers(usersData || []);
        setRoles(rolesData || []);

        const initialSelected = {};
        (usersData || []).forEach((u) => {
          // Backend trả về roles với _id hoặc id
          const roleIds = (u.roles || []).map((r) => {
            // Nếu role là object có _id hoặc id
            if (typeof r === 'object' && r !== null) {
              return r._id || r.id || r;
            }
            // Nếu role là string (ObjectId)
            return r;
          });
          initialSelected[u._id || u.id] = new Set(roleIds);
        });
        setSelectedRoles(initialSelected);
      } catch (err) {
        // Error được xử lý trong context
      }
    };

    fetchAll();
  }, [navigate, user, getUsers, getRoles, setError, isInitializing]);

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      navigate('/system-admin');
    } else if (key === 'roles') {
      navigate('/system-admin/managepermitsion');
    } else {
      navigate('/system-admin');
    }
  };

  const menuItems = [
    { key: 'overview', label: 'Tổng quan hệ thống' },
    { key: 'schools', label: 'Quản lý trường' },
    { key: 'accounts', label: 'Quản lý tài khoản' },
    { key: 'roles', label: 'Phân quyền & vai trò' },
    { key: 'reports', label: 'Báo cáo tổng hợp' },
  ];

  // Chỉ cho phép mỗi tài khoản có đúng 1 role được chọn tại một thời điểm
  const toggleUserRole = (userId, roleId) => {
    setSelectedRoles((prev) => {
      const current = new Set(prev[userId] || []);
      const roleIdStr = String(roleId);

      // Nếu đã chọn role này rồi thì giữ nguyên (không xóa hết để tránh user không có role)
      if (current.has(roleIdStr)) {
        return prev;
      }

      // Gán lại: chỉ chứa đúng 1 roleId
      const next = new Set([roleIdStr]);
      return { ...prev, [userId]: next };
    });
  };

  const handleSaveUserRoles = async (userId) => {
    try {
      setError(null);
      setSuccess('');

      const roleIds = Array.from(selectedRoles[userId] || []);
      
      // Đảm bảo roleIds là mảng các string/ObjectId
      const validRoleIds = roleIds.map(id => String(id));

      await updateUserRoles(userId, validRoleIds);

      setSuccess('Cập nhật vai trò thành công.');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh lại danh sách users để cập nhật roles mới nhất từ backend
      try {
        const usersData = await getUsers();
        setUsers(usersData || []);
        
        // Cập nhật lại selectedRoles với dữ liệu mới từ backend
        const updatedSelected = {};
        (usersData || []).forEach((u) => {
          const uId = u._id || u.id;
          const roleIds = (u.roles || []).map((r) => {
            if (typeof r === 'object' && r !== null) {
              return String(r._id || r.id || r);
            }
            return String(r);
          });
          updatedSelected[uId] = new Set(roleIds);
        });
        setSelectedRoles(updatedSelected);
        
        // Nếu đang xem permissions của user này, cập nhật lại
        if (selectedUserForPerm && (selectedUserForPerm._id === userId || selectedUserForPerm.id === userId)) {
          const updatedUser = usersData.find(u => (u._id || u.id) === userId);
          if (updatedUser) {
            setSelectedUserForPerm(updatedUser);
          }
        }
      } catch (refreshErr) {
        // Nếu refresh thất bại, không làm gì cả
        console.warn('Không thể refresh danh sách users:', refreshErr);
      }
    } catch (err) {
      // Error được xử lý trong context
    }
  };

  const getPermissionsForUser = (user) => {
    if (!user) return [];
    const userId = user._id || user.id;
    const roleIdSet = selectedRoles[userId] || new Set();
    const permsMap = new Map();

    roles.forEach((role) => {
      const roleId = role.id || role._id;
      // Chỉ lấy permissions của các role đã được chọn cho user này
      if (roleIdSet.has(roleId)) {
        (role.permissions || []).forEach((p) => {
          // Backend trả về permission với code và description
          if (!p || !p.code) return;
          const permCode = typeof p === 'string' ? p : p.code;
          const permDesc = typeof p === 'string' ? '' : (p.description || '');
          
          if (!permsMap.has(permCode)) {
            permsMap.set(permCode, {
              code: permCode,
              description: permDesc,
            });
          }
        });
      }
    });

    return Array.from(permsMap.values());
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
            const isActive = item.key === 'roles';
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
            <h1 className="text-2xl font-semibold text-gray-800">Phân quyền & vai trò cho tài khoản</h1>
            <p className="text-sm text-gray-500 mt-1">
              Thêm / Xóa / Sửa vai trò (quyền) cho từng tài khoản người dùng.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <button
              type="button"
              onClick={handleViewProfile}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm hover:bg-gray-50 transition"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">
                {userName.charAt(0).toUpperCase()}
              </span>
              <span className="font-medium">{userName}</span>
            </button>
          </div>
        </div>

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
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Danh sách tài khoản</h3>
            {loading && (
              <span className="text-xs text-gray-500">Đang tải / lưu dữ liệu...</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 text-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                    Tài khoản
                  </th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                    Họ tên
                  </th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                    Vai trò
                  </th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                    Quyền (permission)
                  </th>
                  <th className="px-4 py-3 text-right font-semibold border-b border-gray-200">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-gray-500"
                      colSpan={5}
                    >
                      Chưa có tài khoản nào.
                    </td>
                  </tr>
                )}
                {users.map((u) => {
                  const userId = u._id || u.id;
                  return (
                    <tr key={userId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b border-gray-100 text-gray-900">
                        {u.username}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-gray-800">
                        {u.fullName}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100">
                        <div className="flex flex-wrap gap-2">
                          {roles.length === 0 ? (
                            <span className="text-xs text-gray-400">Chưa có vai trò nào</span>
                          ) : (
                            roles.map((role) => {
                              const roleId = role.id || role._id;
                              const roleIdStr = String(roleId);
                              const isChecked = (selectedRoles[userId] || new Set()).has(roleIdStr);
                              return (
                                <button
                                  key={roleId}
                                  type="button"
                                  onClick={() => toggleUserRole(userId, roleId)}
                                  className={`inline-flex items-center rounded-full border px-2 py-1 text-xs cursor-pointer transition-colors ${
                                    isChecked
                                      ? 'bg-indigo-600 border-indigo-600 text-white'
                                      : 'bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200'
                                  }`}
                                  title={role.description || role.roleName}
                                >
                                  <span>{role.roleName}</span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100">
                        <button
                          type="button"
                          className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                          onClick={() => setSelectedUserForPerm(u)}
                        >
                          Xem quyền
                        </button>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-right">
                        <button
                          type="button"
                          disabled={loading}
                          className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          onClick={() => handleSaveUserRoles(userId)}
                        >
                          {loading ? 'Đang lưu...' : 'Lưu phân quyền'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {selectedUserForPerm && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Quyền của tài khoản: {selectedUserForPerm.username}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Tổng hợp theo các vai trò hiện đang được chọn cho tài khoản này.
                </p>
              </div>
              <button
                type="button"
                className="text-xs text-gray-600 hover:text-gray-800"
                onClick={() => setSelectedUserForPerm(null)}
              >
                Đóng
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {getPermissionsForUser(selectedUserForPerm).length === 0 && (
                <span className="text-xs text-gray-500">
                  Tài khoản hiện chưa có quyền (permission) nào.
                </span>
              )}
              {getPermissionsForUser(selectedUserForPerm).map((perm) => (
                <div
                  key={perm.code}
                  className="inline-flex items-center rounded-lg bg-gray-50 border border-gray-200 px-3 py-1 text-xs text-gray-800"
                >
                  <span className="font-semibold mr-1">{perm.code}</span>
                  <span className="text-gray-600">- {perm.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ManagePermission;

