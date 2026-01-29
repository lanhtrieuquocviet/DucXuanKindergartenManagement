import { createContext, useContext, useState } from 'react';
import { get, put, ENDPOINTS } from '../service/api';

const SystemAdminContext = createContext(null);

export const useSystemAdmin = () => {
  const context = useContext(SystemAdminContext);
  if (!context) {
    throw new Error('useSystemAdmin must be used within SystemAdminProvider');
  }
  return context;
};

export const SystemAdminProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get dashboard data
  const getDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.SYSTEM_ADMIN.DASHBOARD);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Không tải được dữ liệu admin';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get users list
  const getUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.SYSTEM_ADMIN.USERS);
      return response.data || [];
    } catch (err) {
      const errorMessage = err.message || 'Không lấy được danh sách người dùng';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get roles list
  const getRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.SYSTEM_ADMIN.ROLES);
      return response.data || [];
    } catch (err) {
      const errorMessage = err.message || 'Không lấy được danh sách vai trò';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update user roles
  const updateUserRoles = async (userId, roleIds) => {
    try {
      setLoading(true);
      setError(null);
      await put(ENDPOINTS.SYSTEM_ADMIN.UPDATE_USER_ROLES(userId), { roleIds });
    } catch (err) {
      const errorMessage = err.message || 'Không cập nhật được vai trò cho tài khoản này';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    loading,
    error,
    getDashboard,
    getUsers,
    getRoles,
    updateUserRoles,
    setError,
  };

  return (
    <SystemAdminContext.Provider value={value}>
      {children}
    </SystemAdminContext.Provider>
  );
};

export default SystemAdminContext;
