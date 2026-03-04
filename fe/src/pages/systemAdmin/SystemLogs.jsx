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
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    action: '',
    actor: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

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

  const fetchLogs = async (page = 1, limit = 20, extraFilters = {}) => {
    if (!user) return;
    try {
      setLocalError('');
      setError(null);
      const cleanFilters = {};
      Object.entries(extraFilters).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim() !== '') {
          cleanFilters[key] = value.trim();
        }
      });

      const response = await getSystemLogs({
        page,
        limit,
        ...cleanFilters,
      });
      setLogs(response.data || []);
      if (response.pagination) {
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
        });
      } else {
        setPagination((prev) => ({
          ...prev,
          page,
        }));
      }
    } catch (err) {
      setLocalError(err.message || 'Không lấy được nhật ký hệ thống');
    }
  };

  useEffect(() => {
    fetchLogs(1, pagination.limit, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getSystemLogs, setError, user]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyFilters = () => {
    fetchLogs(1, pagination.limit, filters);
  };

  const handleResetFilters = () => {
    const reset = {
      startDate: '',
      endDate: '',
      action: '',
      actor: '',
    };
    setFilters(reset);
    fetchLogs(1, pagination.limit, reset);
  };

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
                Theo dõi thao tác người dùng trong hệ thống (giới hạn trong 3 ngày gần nhất).
              </p>
            </div>
          </div>
        </div>

        {(localError || error) && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
            {localError || error}
          </div>
        )}

        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Từ ngày</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Đến ngày</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Hành động</label>
            <input
              type="text"
              placeholder="Tìm theo hành động..."
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Người thực hiện</label>
            <input
              type="text"
              placeholder="Tìm theo người thực hiện..."
              value={filters.actor}
              onChange={(e) => handleFilterChange('actor', e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-4 flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={loading}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium ${
                loading
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Xóa bộ lọc
            </button>
            <button
              type="button"
              onClick={handleApplyFilters}
              disabled={loading}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                loading
                  ? 'bg-blue-300 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Áp dụng
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 text-gray-900">
              <tr>
                {/* <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                  ID
                </th> */}
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
                  {/* <td className="px-4 py-3 border-b border-gray-100 text-gray-900 font-medium">
                    {log._id}
                  </td> */}
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

        <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
          <div>
            Trang{' '}
            <span className="font-semibold">
              {pagination.page}/{pagination.totalPages || 1}
            </span>{' '}
            • Tổng{' '}
            <span className="font-semibold">{pagination.total}</span> bản ghi
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (pagination.page > 1 && !loading) {
                  fetchLogs(pagination.page - 1, pagination.limit);
                }
              }}
              disabled={loading || pagination.page <= 1}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium ${
                pagination.page <= 1 || loading
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => {
                if (pagination.page < (pagination.totalPages || 1) && !loading) {
                  fetchLogs(pagination.page + 1, pagination.limit);
                }
              }}
              disabled={loading || pagination.page >= (pagination.totalPages || 1)}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium ${
                pagination.page >= (pagination.totalPages || 1) || loading
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Sau
            </button>
          </div>
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
              {/* <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">ID</span>
                <span className="col-span-2 font-medium">{selectedLog._id}</span>
              </div> */}
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
