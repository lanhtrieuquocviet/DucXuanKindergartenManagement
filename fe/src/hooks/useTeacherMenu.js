import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MENU_CONFIG } from '../constants/menuConfig';

export const useTeacherMenu = () => {
  const { hasPermission, isInitializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = useMemo(() => {
    if (isInitializing) return [];
    
    // Sử dụng bộ menu Teacher từ cấu hình chung
    const baseItems = MENU_CONFIG.Teacher || [];

    return baseItems.filter((item) => {
      if (item.permissionCode && !hasPermission(item.permissionCode)) return false;
      return true;
    });
  }, [hasPermission, isInitializing]);

  const activeKey = useMemo(() => {
    const path = location.pathname;
    const found = menuItems.find(item => path.startsWith(item.path));
    if (found) return found.key;
    return 'classes';
  }, [location.pathname, menuItems]);

  const handleMenuSelect = (key) => {
    const found = menuItems.find(item => item.key === key);
    if (found) navigate(found.path);
  };

  return {
    menuItems,
    activeKey,
    handleMenuSelect,
  };
};
