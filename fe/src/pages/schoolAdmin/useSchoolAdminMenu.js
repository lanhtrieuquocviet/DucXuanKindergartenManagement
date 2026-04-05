import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SCHOOL_ADMIN_MENU_ITEMS, filterMenuByPermissions } from './schoolAdminMenuConfig';

/**
 * Hook trả về menu items của SchoolAdmin đã lọc theo permissions của user hiện tại.
 * Dùng trong mọi page SchoolAdmin thay cho SCHOOL_ADMIN_MENU_ITEMS trực tiếp.
 *
 * @returns {Array} filtered menu items
 */
export function useSchoolAdminMenu() {
  const { hasPermission } = useAuth();
  return useMemo(
    () => filterMenuByPermissions(SCHOOL_ADMIN_MENU_ITEMS, hasPermission),
    [hasPermission],
  );
}
