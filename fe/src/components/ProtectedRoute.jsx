import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { token, user, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-sky-400 border-t-transparent" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // KIỂM TRA BẮT BUỘC ĐỔI MẬT KHẨU LẦN ĐẦU
  if (user.isChangePassword === false && location.pathname !== '/profile') {
    return <Navigate to="/profile?forceChangePassword=1" replace />;
  }

  return children;
}

export default ProtectedRoute;
