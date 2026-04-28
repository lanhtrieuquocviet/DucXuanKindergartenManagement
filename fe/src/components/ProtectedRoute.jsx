import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles = [], requiredPermission = null }) {
  const { token, user, isInitializing, getUserRoles, hasPermission } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white/50 backdrop-blur-sm">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 1. KIỂM TRA QUYỀN TRUY CẬP THEO ROLE (NẾU CÓ YÊU CẦU)
  if (allowedRoles.length > 0) {
    const userRoles = getUserRoles();
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  // 2. KIỂM TRA QUYỀN TRUY CẬP THEO PERMISSION CODE (MỨC ĐỘ CHI TIẾT)
  if (requiredPermission) {
    if (!hasPermission(requiredPermission)) {
      // Nếu không có quyền chi tiết, quay về Dashboard của Role đó
      // Xác định dashboard path dựa trên role
      const userRoles = getUserRoles();
      let fallbackPath = '/';
      if (userRoles.includes('SystemAdmin')) fallbackPath = '/system-admin';
      else if (userRoles.includes('SchoolAdmin')) fallbackPath = '/school-admin';
      else if (userRoles.includes('Teacher') || userRoles.includes('HeadTeacher')) fallbackPath = '/teacher';
      else if (userRoles.includes('KitchenStaff')) fallbackPath = '/kitchen';
      else if (userRoles.includes('SchoolNurse')) fallbackPath = '/school-nurse';
      
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // 3. KIỂM TRA BẮT BUỘC ĐỔI MẬT KHẨU LẦN ĐẦU
  if (user.isChangePassword === false && location.pathname !== '/profile') {
    return <Navigate to="/profile?forceChangePassword=1" replace />;
  }

  return children;
}

export default ProtectedRoute;
