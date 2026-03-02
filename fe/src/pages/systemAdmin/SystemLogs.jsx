import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSystemAdmin } from '../../context/SystemAdminContext';
import RoleLayout from '../../layouts/RoleLayout';

function SystemLogs() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const { getSystemLogs, loading, error, setError } = useSystemAdmin();
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [localError, setLocalError] = useState('');

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
    }
  }, [navigate, user, isInitializing]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) return;
      try {
        setLocalError('');
        setError(null);
        const response = await getSystemLogs({ page: 1, limit: 50 });
        setLogs(response.data || []);
      } catch (err) {
        setLocalError(err.message || 'Không lấy được nhật ký hệ thống');
      }
    };

    fetchLogs();
  }, [getSystemLogs, setError, user]);

  const menuItems = useMemo(
    () => [
      { key: 'overview', label: 'Tổng quan hệ thống' },
      { key: 'schools', label: 'Quản lý trường' },
      { key: 'accounts', label: 'Quản lý tài khoản' },
      { key: 'roles', label: 'Quản lý vai trò' },
      { key: 'permissions', label: 'Quản lý phân quyền' },
      { key: 'system-logs', label: 'Nhật ký hệ thống' },
      { key: 'reports', label: 'Báo cáo tổng hợp' },
    ],
    []
  );

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      navigate('/system-admin');
    } else if (key === 'accounts') {
      navigate('/system-admin/manage-accounts');
    } else if (key === 'roles') {
      navigate('/system-admin/manage-roles');
    } else if (key === 'permissions') {
      navigate('/system-admin/manage-permissions');
    } else if (key === 'system-logs') {
      navigate('/system-admin/system-logs');
    } else {
      navigate('/system-admin');
    }
  };

  const userName = user?.fullName || user?.username || 'System Admin';

  const handleViewProfile = () => {
    navigate('/profile');
  };

  return (
    <RoleLayout
      title="Nhật ký hệ thống"
      description="Theo dõi các hoạt động quan trọng trong hệ thống."
      menuItems={menuItems}
      activeKey="system-logs"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
    >
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              📜
            </span>
            <div>
              <h3 className="text-base font-semibold text-gray-900">System Log</h3>
              <p className="text-xs text-gray-500">
                Theo dõi thao tác người dùng trong hệ thống.
              </p>
            </div>
          </div>
        </div>

        {(localError || error) && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
            {localError || error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 text-gray-900">
              <tr>
                <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                  ID
                </th>
                <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                  Thời gian
                </th>
                <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                  Người thực hiện
                </th>
                <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                  Hành động
                </th>
                <th className="px-4 py-3 text-center font-semibold border-b border-gray-200">
                  Xem chi tiết
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b border-gray-100 text-gray-900 font-medium">
                    {log._id}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-gray-800">
                    {log.createdAt
                      ? new Date(log.createdAt).toLocaleString('vi-VN')
                      : '--'}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-gray-800">
                    {log.actorName || 'Không rõ'}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-gray-800">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700 transition-colors"
                    >
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Chưa có nhật ký nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h4 className="text-base font-semibold text-gray-900">
                Chi tiết nhật ký
              </h4>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm text-gray-700">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">ID</span>
                <span className="col-span-2 font-medium">{selectedLog._id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Thời gian</span>
                <span className="col-span-2 font-medium">
                  {selectedLog.createdAt
                    ? new Date(selectedLog.createdAt).toLocaleString('vi-VN')
                    : '--'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Người thực hiện</span>
                <span className="col-span-2 font-medium">
                  {selectedLog.actorName || 'Không rõ'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Hành động</span>
                <span className="col-span-2 font-medium">
                  {selectedLog.action}
                </span>
              </div>
              <div className="pt-2">
                <div className="text-gray-500 mb-1">Nội dung chi tiết</div>
                <div className="rounded-md bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700">
                  {selectedLog.detail || 'Không có nội dung chi tiết.'}
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}

export default SystemLogs;
