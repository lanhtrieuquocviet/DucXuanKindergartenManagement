import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Cấu hình menu tổng thể của ứng dụng.
 * Mỗi item bao gồm:
 * - key: định danh duy nhất (dùng để map icon trong RoleLayout)
 * - label: tên hiển thị
 * - path: đường dẫn điều hướng
 * - permission: mã quyền tương ứng (nếu có)
 * - role: vai trò tương ứng (nếu cần giới hạn cứng theo role)
 * - children: danh sách menu con
 */
export const useAppMenu = () => {
  const { user, isInitializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Chuyển đổi danh sách permissions từ DB thành cấu trúc menu.
   * Grouping permissions by their 'group' field.
   */
  const menuItems = useMemo(() => {
    if (isInitializing || !user || !user.roles) return [];

    // 1. Gom tất cả permissions từ các roles
    const allPerms = user.roles.flatMap((role) => role.permissions || []);
    
    // 2. Chỉ lấy các permission có path (để hiển thị trên menu)
    // Và unique theo code
    const menuPerms = Array.from(
      new Map(
        allPerms
          .filter((p) => p.path)
          .map((p) => [p.code, p])
      ).values()
    );

    if (menuPerms.length === 0) return [{ key: 'overview', label: 'Tổng quan', path: '/' }];

    // 3. Phân nhóm theo 'group'
    const groupsMap = menuPerms.reduce((acc, p) => {
      const groupName = p.group || 'Khác';
      if (!acc[groupName]) {
        acc[groupName] = {
          key: `group-${groupName}`,
          label: groupName,
          order: p.order || 999, // Lấy order của item đầu tiên làm order của group (tạm thời)
          children: [],
        };
      }
      acc[groupName].children.push({
        key: p.menuKey || p.code,
        label: p.description,
        path: p.path,
        order: p.order || 0,
      });
      // Cập nhật group order nếu item có order nhỏ hơn
      if (p.order < acc[groupName].order) acc[groupName].order = p.order;
      return acc;
    }, {});

    // 4. Chuyển map thành array và sắp xếp
    const sortedGroups = Object.values(groupsMap)
      .sort((a, b) => a.order - b.order)
      .map((group) => ({
        ...group,
        children: group.children.sort((a, b) => a.order - b.order),
      }));

    return [
      { key: 'overview', label: 'Tổng quan', path: '/' },
      ...sortedGroups,
    ];
  }, [user, isInitializing]);

  /**
   * Tìm key đang hoạt động dựa trên URL hiện tại.
   */
  const activeKey = useMemo(() => {
    const path = location.pathname;

    const findActiveKey = (items) => {
      for (const item of items) {
        if (item.path && path.startsWith(item.path)) return item.key;
        if (item.children) {
          const childKey = findActiveKey(item.children);
          if (childKey) return childKey;
        }
      }
      return null;
    };

    return findActiveKey(menuItems) || 'overview';
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
