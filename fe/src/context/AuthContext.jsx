import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { get, post, put, ENDPOINTS } from '../service/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({
  children,
  onLoginSuccess,
  onLogout,
  onError,
  autoLoadUser = true,
}) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true); // Bắt đầu với loading = true để chờ verify token
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true); // Trạng thái đang khởi tạo

  // Sử dụng useRef để lưu trữ callback functions, tránh thay đổi kích thước mảng dependencies
  const onErrorRef = useRef(onError);
  const onLoginSuccessRef = useRef(onLoginSuccess);
  const onLogoutRef = useRef(onLogout);

  // Cập nhật ref khi prop thay đổi
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onLoginSuccessRef.current = onLoginSuccess;
  }, [onLoginSuccess]);

  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  // Load và verify user khi mount/reload
  useEffect(() => {
    if (!autoLoadUser) {
      setIsInitializing(false);
      setLoading(false);
      return;
    }

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      // Nếu không có token, không cần verify
      if (!storedToken) {
        setIsInitializing(false);
        setLoading(false);
        return;
      }

      // Nếu có token, verify với backend
      try {
        // Load user từ localStorage trước để hiển thị ngay (optimistic)
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Error parsing user from localStorage:', err);
            localStorage.removeItem('user');
          }
        }

        // Verify token với backend và lấy user mới nhất
        const response = await get(ENDPOINTS.AUTH.ME);
        const userData = response.data || {};

        // Cập nhật user từ backend (đảm bảo dữ liệu mới nhất)
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(storedToken); // Đảm bảo token được set
      } catch (err) {
        // Token không hợp lệ hoặc đã hết hạn
        if (err.status === 401 || err.status === 403) {
          // Xóa token và user không hợp lệ
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        } else {
          // Lỗi khác, giữ lại user từ localStorage nếu có
          const errorMessage = err.message || 'Không thể xác thực người dùng';
          setError(errorMessage);
          if (onErrorRef.current) {
            onErrorRef.current(err);
          }
        }
      } finally {
        setIsInitializing(false);
        setLoading(false);
      }
    };

    initializeAuth();
  }, [autoLoadUser]);

  // Login
  const login = useCallback(async (username, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await post(ENDPOINTS.AUTH.LOGIN, { username, password }, { includeAuth: false });
      const { token: newToken, user: newUser } = response.data || {};

      if (!newToken || !newUser) {
        throw new Error('Phản hồi đăng nhập không hợp lệ');
      }

      // Lưu vào state và localStorage
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      // Callback khi login thành công
      if (onLoginSuccessRef.current) {
        onLoginSuccessRef.current({ token: newToken, user: newUser });
      }

      // Return để component tự xử lý navigation
      return { token: newToken, user: newUser };
    } catch (err) {
      const errorMessage = err.message || 'Đăng nhập thất bại';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Callback khi logout
    if (onLogoutRef.current) {
      onLogoutRef.current();
    }
    // Component sẽ tự xử lý navigation
  }, []);

  // Get profile
  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await get(ENDPOINTS.AUTH.ME);
      const userData = response.data || {};

      // Cập nhật state và localStorage
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      return userData;
    } catch (err) {
      if (err.status === 401) {
        logout();
        return null;
      }
      const errorMessage = err.message || 'Không lấy được hồ sơ người dùng';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Update profile
  const updateProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await put(ENDPOINTS.AUTH.ME, profileData);
      const updatedUser = response.data || {};

      // Cập nhật state và localStorage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      return updatedUser;
    } catch (err) {
      const errorMessage = err.message || 'Cập nhật hồ sơ thất bại';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      await post(ENDPOINTS.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword });
    } catch (err) {
      const errorMessage = err.message || 'Đổi mật khẩu thất bại';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!token && !!user;
  }, [token, user]);

  // Get user roles
  const getUserRoles = useCallback(() => {
    if (!user || !user.roles) return [];
    return user.roles.map((r) => r.roleName || r);
  }, [user]);

  // Check if user has specific role
  const hasRole = useCallback((roleName) => {
    return getUserRoles().includes(roleName);
  }, [getUserRoles]);

  const value = {
    user,
    token,
    loading,
    isInitializing, // Trạng thái đang khởi tạo (verify token khi reload)
    error,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    isAuthenticated,
    getUserRoles,
    hasRole,
    setError, // Allow components to clear error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
