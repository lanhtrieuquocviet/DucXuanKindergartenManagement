import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultMenuByRole } from '../constants/menuConfig';

/**
 * Cấu hình menu tổng thể của ứng dụng.
 * Sử dụng bộ menu tĩnh từ menuConfig.js và lọc theo quyền từ DB.
 */
export const useAppMenu = () => {
  const { user, isInitializing, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = useMemo(() => {
    if (isInitializing || !user || !user.roles) return [];

    // 1. Lấy bộ menu chuẩn cho role hiện tại (ưu tiên role đầu tiên)
    const primaryRole = user.roles[0]?.roleName || user.roles[0];
    const baseMenu = getDefaultMenuByRole(primaryRole);

    // 2. Đệ quy lọc menu dựa trên hasPermission
    const filterMenu = (items) => {
      return items
        .filter((item) => {
          // Nếu mục menu có yêu cầu mã quyền, kiểm tra qua AuthContext
          if (item.permissionCode && !hasPermission(item.permissionCode)) {
            return false;
          }
          return true;
        })
        .map((item) => {
          // Nếu có con, lọc tiếp các con
          if (item.children) {
            return {
              ...item,
              children: filterMenu(item.children),
            };
          }
          return item;
        })
        .filter((item) => {
          // Nếu là group/item có con nhưng sau khi lọc con bị trống thì ẩn luôn (tùy chọn)
          if (item.children && item.children.length === 0) return false;
          return true;
        });
    };

    return filterMenu(baseMenu);
  }, [user, isInitializing, hasPermission]);

  /**
   * Tìm key đang hoạt động dựa trên URL hiện tại.
   */
  const activeKey = useMemo(() => {
    // Chuẩn hóa path: xóa dấu / ở cuối (trừ khi chỉ có /)
    const normalize = (p) => (p && p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p);
    const currentPath = normalize(location.pathname);

    // 1. Tìm khớp chính xác (ưu tiên trước)
    const findExactMatch = (items) => {
      for (const item of items) {
        if (normalize(item.path) === currentPath) return item.key;
        if (item.children) {
          const childKey = findExactMatch(item.children);
          if (childKey) return childKey;
        }
      }
      return null;
    };

    const itemsToSearch = [...menuItems];
    const overviewItem = itemsToSearch.shift(); // Lấy overview ra

    // Ưu tiên tìm trong các nhóm trước, sau đó mới tìm trong overview
    const exactMatch = findExactMatch(itemsToSearch) || findExactMatch([overviewItem]);
    if (exactMatch) return exactMatch;

    // 2. Tìm khớp theo tiền tố (nếu không có khớp chính xác)
    // Ưu tiên path dài nhất (cụ thể nhất)
    const findPrefixMatches = (items) => {
      let matches = [];
      for (const item of items) {
        const itemPath = normalize(item.path);
        if (itemPath && itemPath !== '/' && currentPath.startsWith(itemPath)) {
          matches.push({ key: item.key, length: itemPath.length });
        }
        if (item.children) {
          matches = matches.concat(findPrefixMatches(item.children));
        }
      }
      return matches;
    };

    const prefixMatches = findPrefixMatches(menuItems);
    if (prefixMatches.length > 0) {
      // Sắp xếp theo chiều dài giảm dần để lấy path cụ thể nhất
      prefixMatches.sort((a, b) => b.length - a.length);
      return prefixMatches[0].key;
    }

    return 'overview';
  }, [location.pathname, menuItems]);

  const handleMenuSelect = (key) => {
    const findItemByKey = (items, targetKey) => {
      for (const item of items) {
        if (item.key === targetKey && item.path) return item;
        if (item.children) {
          const childItem = findItemByKey(item.children, targetKey);
          if (childItem) return childItem;
        }
      }
      return null;
    };

    const item = findItemByKey(menuItems, key);
    if (item && item.path) {
      navigate(item.path);
    }
  };

  return {
    menuItems,
    activeKey,
    handleMenuSelect,
  };
};
