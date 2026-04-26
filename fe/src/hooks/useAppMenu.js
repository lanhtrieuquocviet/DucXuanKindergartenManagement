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

    // 5. Xác định đường dẫn Tổng quan dựa trên role
    const userRoles = user.roles.map((r) => r.roleName || r) || [];
    let overviewPath = '/';
    
    if (userRoles.includes('SystemAdmin')) {
      overviewPath = '/system-admin';
    } else if (userRoles.includes('SchoolAdmin')) {
      overviewPath = '/school-admin';
    } else if (userRoles.includes('Teacher') || userRoles.includes('HeadTeacher')) {
      overviewPath = '/teacher';
    } else if (userRoles.includes('KitchenStaff')) {
      overviewPath = '/kitchen';
    } else if (userRoles.includes('MedicalStaff')) {
      overviewPath = '/medical-staff';
    } else if (userRoles.includes('HeadParent')) {
      overviewPath = '/head-parent';
    } else if (userRoles.includes('Student') || userRoles.includes('Parent')) {
      overviewPath = '/student';
    }

    return [
      { key: 'overview', label: 'Tổng quan', path: overviewPath },
      ...sortedGroups,
    ];
  }, [user, isInitializing]);

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
