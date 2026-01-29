import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../../components/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { useSystemAdmin } from '../../context/SystemAdminContext';

function ManagePermission() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState({}); // { userId: Set(roleId) }
  const [success, setSuccess] = useState('');
  const [selectedUserForPerm, setSelectedUserForPerm] = useState(null);
  const navigate = useNavigate();
  const { user, hasRole, logout } = useAuth();
  const { getUsers, getRoles, updateUserRoles, loading, error, setError } = useSystemAdmin();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (!hasRole('SystemAdmin')) {
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
          const roleIds = (u.roles || []).map((r) => r._id || r.id);
          initialSelected[u._id] = new Set(roleIds);
        });
        setSelectedRoles(initialSelected);
      } catch (err) {
        // Error được xử lý trong context
      }
    };

    fetchAll();
  }, [navigate, user, hasRole, getUsers, getRoles, setError]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
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

      // Nếu đã chọn role này rồi thì giữ nguyên (không xóa hết để tránh user không có role)
      if (current.has(roleId)) {
        return prev;
      }

      // Gán lại: chỉ chứa đúng 1 roleId
      const next = new Set([roleId]);
      return { ...prev, [userId]: next };
    });
  };

  const handleSaveUserRoles = async (userId) => {
    try {
      setError(null);
      setSuccess('');

      const roleIds = Array.from(selectedRoles[userId] || []);

      await updateUserRoles(userId, roleIds);

      setSuccess('Cập nhật vai trò thành công.');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      // Error được xử lý trong context
    }
  };

  const getPermissionsForUser = (user) => {
    if (!user) return [];
    const roleIdSet = selectedRoles[user._id] || new Set();
    const permsMap = new Map();

    roles.forEach((role) => {
      const roleId = role.id || role._id;
      if (roleIdSet.has(roleId)) {
        (role.permissions || []).forEach((p) => {
          if (!p || !p.code) return;
          if (!permsMap.has(p.code)) {
            permsMap.set(p.code, {
              code: p.code,
              description: p.description || '',
            });
          }
        });
      }
    });

    return Array.from(permsMap.values());
  };

  return (
    <RoleLayout
      title="Phân quyền & vai trò cho tài khoản"
      description="Thêm / Xóa / Sửa vai trò (quyền) cho từng tài khoản người dùng."
      menuItems={menuItems}
      activeKey="roles"
      onLogout={handleLogout}
      onMenuSelect={handleMenuSelect}
      userName={user?.fullName || user?.username || 'System Admin'}
    >
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
          {success}
        </p>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-sky-900">Danh sách tài khoản</h3>
        {loading && (
          <span className="text-xs text-sky-600">Đang tải / lưu dữ liệu...</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs md:text-sm border border-sky-100 rounded-xl overflow-hidden bg-white">
          <thead className="bg-sky-50 text-sky-900">
            <tr>
              <th className="px-3 py-2 text-left font-semibold border-b border-sky-100">
                Tài khoản
              </th>
              <th className="px-3 py-2 text-left font-semibold border-b border-sky-100">
                Họ tên
              </th>
              <th className="px-3 py-2 text-left font-semibold border-b border-sky-100">
                Vai trò
              </th>
              <th className="px-3 py-2 text-left font-semibold border-b border-sky-100">
                Quyền (permission)
              </th>
              <th className="px-3 py-2 text-right font-semibold border-b border-sky-100">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td
                  className="px-3 py-3 text-center text-sky-500"
                  colSpan={4}
                >
                  Chưa có tài khoản nào.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u._id}>
                <td className="px-3 py-2 border-b border-sky-50 text-sky-900">
                  {u.username}
                </td>
                <td className="px-3 py-2 border-b border-sky-50 text-sky-800">
                  {u.fullName}
                </td>
                <td className="px-3 py-2 border-b border-sky-50">
                  <div className="flex flex-wrap gap-2">
                     {roles.map((role) => {
                       const roleId = role.id || role._id;
                       const isChecked = (selectedRoles[u._id] || new Set()).has(roleId);
                       return (
                         <button
                           key={roleId}
                           type="button"
                           onClick={() => toggleUserRole(u._id, roleId)}
                           className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] cursor-pointer ${
                             isChecked
                               ? 'bg-sky-500 border-sky-500 text-white'
                               : 'bg-sky-50 border-sky-100 text-sky-800'
                           }`}
                         >
                           <span>{role.roleName}</span>
                         </button>
                       );
                     })}
                  </div>
                </td>
                <td className="px-3 py-2 border-b border-sky-50">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-[11px] font-medium text-sky-700 border border-sky-200 hover:bg-sky-50"
                    onClick={() => setSelectedUserForPerm(u)}
                  >
                    Xem quyền
                  </button>
                </td>
                <td className="px-3 py-2 border-b border-sky-50 text-right">
                  <button
                    type="button"
                    disabled={loading}
                    className="inline-flex items-center rounded-lg bg-sky-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow hover:bg-sky-600 disabled:opacity-60"
                    onClick={() => handleSaveUserRoles(u._id)}
                  >
                    Lưu phân quyền
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUserForPerm && (
        <div className="mt-6 rounded-xl border border-sky-100 bg-sky-50/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-semibold text-sky-900">
                Quyền của tài khoản: {selectedUserForPerm.username}
              </h4>
              <p className="text-xs text-sky-600">
                Tổng hợp theo các vai trò hiện đang được chọn cho tài khoản này.
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-sky-600 hover:text-sky-800"
              onClick={() => setSelectedUserForPerm(null)}
            >
              Đóng
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {getPermissionsForUser(selectedUserForPerm).length === 0 && (
              <span className="text-xs text-sky-500">
                Tài khoản hiện chưa có quyền (permission) nào.
              </span>
            )}
            {getPermissionsForUser(selectedUserForPerm).map((perm) => (
              <div
                key={perm.code}
                className="inline-flex items-center rounded-lg bg-white border border-sky-100 px-3 py-1 text-[11px] text-sky-800 shadow-sm"
              >
                <span className="font-semibold mr-1">{perm.code}</span>
                <span className="text-sky-600">- {perm.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </RoleLayout>
  );
}

export default ManagePermission;

