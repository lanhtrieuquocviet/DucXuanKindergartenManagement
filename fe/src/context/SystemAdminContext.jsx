import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { get, post, put, del as deleteRequest, postFormData, ENDPOINTS } from '../service/api';

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

  // Create user account
  const createUser = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await post(ENDPOINTS.SYSTEM_ADMIN.CREATE_USER, userData);
      if (onSuccessRef.current) {
        onSuccessRef.current({ user: response.data });
      }
      return response;
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Không tạo được tài khoản';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user account
  const updateUser = useCallback(async (userId, userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await put(ENDPOINTS.SYSTEM_ADMIN.UPDATE_USER(userId), userData);
      if (onSuccessRef.current) {
        onSuccessRef.current({ user: response.data });
      }
      return response;
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Không cập nhật được tài khoản';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete user account
  const deleteUser = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await deleteRequest(ENDPOINTS.SYSTEM_ADMIN.DELETE_USER(userId));
      if (onSuccessRef.current) {
        onSuccessRef.current({ userId });
      }
      return response;
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Không xóa được tài khoản';
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

  // Create role
  const createRole = useCallback(async (roleName, description, parentId = null) => {
    try {
      setLoading(true);
      setError(null);
      const response = await post(ENDPOINTS.SYSTEM_ADMIN.CREATE_ROLE, { roleName, description, parentId });
      if (onSuccessRef.current) {
        onSuccessRef.current({ role: response.data });
      }
      return response;
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Không tạo được vai trò';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update role
  const updateRole = useCallback(async (roleId, roleName, description, parentId) => {
    try {
      setLoading(true);
      setError(null);
      const updateData = {};
      if (roleName) updateData.roleName = roleName;
      if (description !== undefined) updateData.description = description;
      if (parentId !== undefined) updateData.parentId = parentId;
      const response = await put(ENDPOINTS.SYSTEM_ADMIN.UPDATE_ROLE(roleId), updateData);
      if (onSuccessRef.current) {
        onSuccessRef.current({ role: response.data });
      }
      return response;
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Không cập nhật được vai trò';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete role
  const deleteRole = useCallback(async (roleId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await deleteRequest(ENDPOINTS.SYSTEM_ADMIN.DELETE_ROLE(roleId));
      if (onSuccessRef.current) {
        onSuccessRef.current({ roleId });
      }
      return response;
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Không xóa được vai trò';
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

  // Get permissions list
  const getPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.SYSTEM_ADMIN.PERMISSIONS);
      return response.data || [];
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Không lấy được danh sách phân quyền';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create permission
  const createPermission = useCallback(async (code, description, group = '') => {
    try {
      setLoading(true);
      setError(null);
      const response = await post(ENDPOINTS.SYSTEM_ADMIN.CREATE_PERMISSION, { code, description, group });
      if (onSuccessRef.current) {
        onSuccessRef.current({ permission: response.data });
      }
      return response;
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Không tạo được phân quyền';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update permission
  const updatePermission = useCallback(async (permissionId, code, description, group) => {
    try {
      setLoading(true);
      setError(null);
      const updateData = {};
      if (code) updateData.code = code;
      if (description) updateData.description = description;
      if (group !== undefined) updateData.group = group;
      const response = await put(ENDPOINTS.SYSTEM_ADMIN.UPDATE_PERMISSION(permissionId), updateData);
      if (onSuccessRef.current) {
        onSuccessRef.current({ permission: response.data });
      }
      return response;
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Không cập nhật được phân quyền';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete permission
  const deletePermission = useCallback(async (permissionId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await deleteRequest(ENDPOINTS.SYSTEM_ADMIN.DELETE_PERMISSION(permissionId));
      if (onSuccessRef.current) {
        onSuccessRef.current({ permissionId });
      }
      return response;
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Không xóa được phân quyền';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update role permissions
  const updateRolePermissions = useCallback(async (roleId, permissionCodes) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!Array.isArray(permissionCodes)) {
        throw new Error('permissionCodes phải là một mảng');
      }
      
      const response = await put(ENDPOINTS.SYSTEM_ADMIN.UPDATE_ROLE_PERMISSIONS(roleId), { permissionCodes });
      
      if (onSuccessRef.current) {
        onSuccessRef.current({ roleId, permissionCodes, response: response.data });
      }
      
      return response;
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Không cập nhật được phân quyền cho vai trò';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get system logs with pagination and filters
  const getSystemLogs = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      // Chuyển params thành query string
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, value);
        }
      });

      const queryString = query.toString();
      const endpoint = `${ENDPOINTS.SYSTEM_ADMIN.SYSTEM_LOGS}${queryString ? `?${queryString}` : ''}`;
      
      const response = await get(endpoint);
      // Backend trả về { status: 'success', data: [...], pagination: {...} }
      return response;
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Không lấy được nhật ký hệ thống';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get BPM Workflows
  const getBPMWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.SYSTEM_ADMIN.BPM_WORKFLOWS);
      return response.data || [];
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Không lấy được danh sách quy trình BPM';
      setError(errorMessage);
      if (onErrorRef.current) onErrorRef.current(err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save BPM Workflow
  const saveBPMWorkflow = useCallback(async (workflowData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await post(ENDPOINTS.SYSTEM_ADMIN.SAVE_BPM_WORKFLOW, workflowData);
      if (onSuccessRef.current) onSuccessRef.current({ workflow: response.data });
      return response;
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Không lưu được quy trình BPM';
      setError(errorMessage);
      if (onErrorRef.current) onErrorRef.current(err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get BPM Health
  const getBPMHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.SYSTEM_ADMIN.BPM_HEALTH);
      return response.data;
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Không lấy được trạng thái BPM';
      setError(errorMessage);
      if (onErrorRef.current) onErrorRef.current(err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateBPMFromDocx = useCallback(async (file) => {
    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      const response = await postFormData(ENDPOINTS.SYSTEM_ADMIN.GENERATE_BPM_FROM_DOCX, formData);
      return response.data;
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Lỗi khi phân tích file Word';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getBPMNodeDefinitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.SYSTEM_ADMIN.BPM_NODES);
      return response.data || [];
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Không lấy được danh mục Node BPM';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBPMWorkflow = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await deleteRequest(ENDPOINTS.SYSTEM_ADMIN.DELETE_BPM_WORKFLOW(id));
      return true;
    } catch (err) {
      const errorMessage = err.data?.message || err.message || 'Không thể xóa quy trình';
      setError(errorMessage);
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
    createUser,
    updateUser,
    deleteUser,
    getRoles,
    createRole,
    updateRole,
    deleteRole,
    updateUserRoles,
    getPermissions,
    createPermission,
    updatePermission,
    deletePermission,
    updateRolePermissions,
    getSystemLogs,
    getBPMWorkflows,
    saveBPMWorkflow,
    deleteBPMWorkflow,
    getBPMHealth,
    getBPMNodeDefinitions,
    generateBPMFromDocx,
    postFormData,
    setError,
  };

  return (
    <SystemAdminContext.Provider value={value}>
      {children}
    </SystemAdminContext.Provider>
  );
};

export default SystemAdminContext;
