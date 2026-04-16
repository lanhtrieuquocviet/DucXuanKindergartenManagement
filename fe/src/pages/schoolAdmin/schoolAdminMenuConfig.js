/**
 * Shared menu configuration for all School Admin pages.
 * Import these in every page that uses RoleLayout to ensure
 * the sidebar menu is consistent across all pages.
 */

export const SCHOOL_ADMIN_MENU_ITEMS = [
  { key: 'overview', label: 'Tổng quan trường' },
  {
    key: 'academic-years',
    label: 'Quản lý năm học',
    permission: 'MANAGE_ACADEMIC_YEAR',
    children: [
      { key: 'academic-year-setup', label: 'Thiết lập năm học', permission: 'MANAGE_ACADEMIC_YEAR' },
      { key: 'academic-plan', label: 'Thiết lập kế hoạch', permission: 'MANAGE_CURRICULUM' },
      { key: 'academic-events', label: 'Thiết lập sự kiện', permission: 'MANAGE_CURRICULUM' },
      { key: 'academic-schedule', label: 'Thời gian biểu', permission: 'MANAGE_CURRICULUM' },
      { key: 'academic-report', label: 'Báo cáo & thống kê', permission: 'VIEW_REPORT' },
    ],
  },
  { key: 'classes', label: 'Quản lý khối & lớp học', permission: 'MANAGE_CLASS' },
  { key: 'staff', label: 'Quản lý nhân sự', permission: 'MANAGE_ASSET' },
  { key: 'students', label: 'Học sinh', permission: 'MANAGE_STUDENT' },
  {
    key: 'attendance',
    label: 'Quản lý điểm danh',
    permission: 'VIEW_ATTENDANCE',
    children: [
      { key: 'attendance-overview', label: 'Điểm danh', permission: 'VIEW_ATTENDANCE' },
      { key: 'face-attendance', label: 'Trạng thái khuôn mặt AI', permission: 'REGISTER_FACE' },
    ],
  },
  {
    key: 'menu-management',
    label: 'Quản lý thực đơn & bữa ăn',
    permission: 'APPROVE_MENU',
    children: [
      { key: 'menu', label: 'Quản lý thực đơn', permission: 'APPROVE_MENU' },
      { key: 'meal-management', label: 'Quản lý bữa ăn', permission: 'APPROVE_MENU' },
      { key: 'district-nutrition-plan', label: 'Kế hoạch dinh dưỡng theo sở', permission: 'APPROVE_MENU' },
    ],
  },
  { key: 'teachers', label: 'Giáo viên', permission: 'MANAGE_TEACHER' },
  {
    key: 'assets',
    label: 'Quản lý cơ sở vật chất',
    permission: 'MANAGE_ASSET',
    children: [
      { key: 'assets-list', label: 'Danh sách cơ sở vật chất', permission: 'MANAGE_ASSET' },
      { key: 'asset-allocation', label: 'Phân bổ cơ sở vật chất', permission: 'MANAGE_ASSET' },
      { key: 'purchase-requests', label: 'Yêu cầu mua sắm', permission: 'MANAGE_PURCHASE_REQUEST' },
    ],
  },
  { key: 'kiemke', label: 'Quản lý kiểm kê tài sản', permission: 'MANAGE_ASSET' },
  {
    key: 'public-info',
    label: 'Quản lý cổng thông tin',
    children: [
      { key: 'public-info-list', label: 'Danh sách thông tin', permission: 'MANAGE_PUBLIC_INFO' },
      { key: 'blogs', label: 'Quản lý blog', permission: 'MANAGE_BLOG' },
      { key: 'banner-management', label: 'Quản lý banner', permission: 'MANAGE_BANNER' },
      { key: 'documents', label: 'Quản lý tài liệu', permission: 'MANAGE_DOCUMENT' },
      { key: 'files-management', label: 'Quản lý file', permission: 'MANAGE_DOCUMENT' },
      { key: 'contacts-list', label: 'Danh sách liên hệ', permission: 'MANAGE_CONTACT' },
      // { key: 'qa', label: 'Câu hỏi', permission: 'MANAGE_QA' },
      { key: 'image-library', label: 'Quản lý ảnh', permission: 'MANAGE_IMAGE_LIBRARY' },
      { key: 'video-library', label: 'Quản lý video-clip', permission: 'MANAGE_IMAGE_LIBRARY' },
    ],
  },
  
];

/**
 * Lọc menu items dựa trên danh sách permissions của user.
 * - Item không có `permission` field → luôn hiển thị (ví dụ: Tổng quan)
 * - Item có `permission` → chỉ hiển thị nếu user có permission đó
 * - Group item (có children) → chỉ hiển thị nếu ít nhất 1 child được hiển thị
 * @param {Array} items - SCHOOL_ADMIN_MENU_ITEMS
 * @param {Function} hasPermission - (code: string) => boolean, từ useAuth()
 * @returns {Array} filtered items
 */
export function filterMenuByPermissions(items, hasPermission) {
  return items.reduce((acc, item) => {
    if (item.children) {
      const visibleChildren = item.children.filter(
        (child) => !child.permission || hasPermission(child.permission)
      );
      // Ẩn group nếu không có child nào hiển thị
      if (visibleChildren.length === 0) return acc;
      // Nếu group có permission riêng, user phải có ít nhất permission đó
      if (item.permission && !hasPermission(item.permission)) return acc;
      return [...acc, { ...item, children: visibleChildren }];
    }
    if (!item.permission || hasPermission(item.permission)) {
      return [...acc, item];
    }
    return acc;
  }, []);
}

/**
 * Returns a handleMenuSelect function for school admin navigation.
 * @param {Function} navigate - react-router navigate function
 */
export const createSchoolAdminMenuSelect = (navigate) => (key) => {
  const routes = {
    overview: '/school-admin',
    'academic-years': '/school-admin/academic-years',
    'academic-year-setup': '/school-admin/academic-years',
    'academic-curriculum': '/school-admin/curriculum',
    'academic-schedule': '/school-admin/timetable',
    'academic-plan': '/school-admin/academic-plan',
    'academic-events': '/school-admin/academic-events',
    'academic-students': '/school-admin/class-list',
    'academic-report': '/school-admin/academic-report',
    classes: '/school-admin/classes',
    menu: '/school-admin/menus',
    'meal-management': '/school-admin/meal-management',
    'district-nutrition-plan': '/school-admin/district-nutrition-plan',
    teachers: '/school-admin/teachers',
    staff: '/school-admin/staff',
    students: '/school-admin/students',
    contacts: '/school-admin/contacts',
    'contacts-list': '/school-admin/contacts',
    qa: '/school-admin/qa',
    blogs: '/school-admin/blogs',
    'blogs-list': '/school-admin/blogs',
    documents: '/school-admin/documents',
    'files-management': '/school-admin/files',
    'image-library': '/school-admin/image-library',
    'video-library': '/school-admin/video-library',
    'public-info': '/school-admin/public-info',
    'public-info-list': '/school-admin/public-info',
    'banner-management': '/school-admin/banners',
    assets: '/school-admin/assets',
    'assets-list': '/school-admin/assets',
    'asset-allocation': '/school-admin/asset-allocation',
    'purchase-requests': '/school-admin/purchase-requests',
    'asset-incidents': '/school-admin/asset-incidents',
    kiemke: '/school-admin/committee',
    attendance: '/school-admin/attendance/overview',
    'attendance-overview': '/school-admin/attendance/overview',
    'face-attendance': '/school-admin/face-attendance',
  };
  if (routes[key]) navigate(routes[key], { preventScrollReset: true });
};
