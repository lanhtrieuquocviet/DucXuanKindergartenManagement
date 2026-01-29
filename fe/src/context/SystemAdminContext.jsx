import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { get, put, ENDPOINTS } from '../service/api';

const SystemAdminContext = createContext(null);

export const useSystemAdmin = () => {
  const context = useContext(SystemAdminContext);
  if (!context) {
    throw new Error('useSystemAdmin must be used within SystemAdminProvider');
  }
  return context;
};

export const SystemAdminProvider = ({
  children,
  onError,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sử dụng useRef để lưu trữ callback functions, tránh thay đổi kích thước mảng dependencies
  const onErrorRef = useRef(onError);
  const onSuccessRef = useRef(onSuccess);

  // Cập nhật ref khi prop thay đổi
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // Get dashboard data
  const getDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.SYSTEM_ADMIN.DASHBOARD);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Không tải được dữ liệu admin';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get users list
  const getUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.SYSTEM_ADMIN.USERS);
      // Backend trả về { status: 'success', data: [...] }
      return response.data || [];
    } catch (err) {
      // Xử lý lỗi từ API response
      const errorMessage = err.data?.message || err.message || 'Không lấy được danh sách người dùng';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get roles list
  const getRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.SYSTEM_ADMIN.ROLES);
      // Backend trả về { status: 'success', data: [...] }
      // Mỗi role có: { id, roleName, description, permissions: [{ code, description }] }
      return response.data || [];
    } catch (err) {
      // Xử lý lỗi từ API response
      const errorMessage = err.data?.message || err.message || 'Không lấy được danh sách vai trò';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user roles
  const updateUserRoles = useCallback(async (userId, roleIds) => {
    try {
      setLoading(true);
      setError(null);
      
      // Đảm bảo roleIds là mảng
      if (!Array.isArray(roleIds)) {
        throw new Error('roleIds phải là một mảng');
      }
      
      const response = await put(ENDPOINTS.SYSTEM_ADMIN.UPDATE_USER_ROLES(userId), { roleIds });
      
      if (onSuccessRef.current) {
        onSuccessRef.current({ userId, roleIds, response: response.data });
      }
      
      return response;
    } catch (err) {
      // Xử lý lỗi từ API response
      const errorMessage = err.data?.message || err.message || 'Không cập nhật được vai trò cho tài khoản này';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

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
