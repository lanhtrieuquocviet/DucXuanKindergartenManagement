/**
 * Shared menu configuration for all School Admin pages.
 * Import these in every page that uses RoleLayout to ensure
 * the sidebar menu is consistent across all pages.
 */

export const SCHOOL_ADMIN_MENU_ITEMS = [
  { key: 'overview', label: 'Tổng quan trường' },
  {
    key: 'academic-years',
    label: 'Học vụ',
    children: [
      { key: 'academic-year-setup', label: 'Quản lý năm học', path: '/school-admin/academic-years', permission: 'MANAGE_ACADEMIC_YEAR' },
      { key: 'academic-plan', label: 'Quản lý kế hoạch', path: '/school-admin/academic-plan', permission: 'MANAGE_CURRICULUM' },
      { key: 'academic-events', label: 'Quản lý sự kiện', path: '/school-admin/academic-events', permission: 'MANAGE_CURRICULUM' },
      { key: 'academic-schedule', label: 'Thời gian biểu', path: '/school-admin/timetable', permission: 'MANAGE_CURRICULUM' },
      { key: 'academic-report', label: 'Báo cáo & thống kê', path: '/school-admin/academic-report', permission: 'VIEW_REPORT' },
    ],
  },
  {
    key: 'classes-management',
    label: 'Quản lý khối & lớp học',
    permission: 'MANAGE_CLASS',
    children: [
      { key: 'classes', label: 'Danh sách khối & lớp', permission: 'MANAGE_CLASS' },
      { key: 'students', label: 'Danh sách học sinh', permission: 'MANAGE_STUDENT' },
      { key: 'assessment-templates', label: 'Mẫu đánh giá học sinh', permission: 'MANAGE_STUDENT' },
      { key: 'static-blocks', label: 'Cài đặt loại Khối', permission: 'MANAGE_STATIC_BLOCK' },
    ],
  },
  {
    key: 'personnel',
    label: 'Quản lý nhân sự',
    permission: 'MANAGE_TEACHER',
    children: [
      { key: 'personnel-management', label: 'Danh sách nhân sự', permission: 'MANAGE_TEACHER' },
      { key: 'staff-positions', label: 'Quản lý chức vụ', permission: 'MANAGE_STAFF_POSITION' },
    ],
  },
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
      { key: 'ingredient-categories', label: 'Nhóm nguyên liệu', permission: 'MANAGE_INGREDIENT_CATEGORY' },
      { key: 'district-nutrition-plan', label: 'Kế hoạch dinh dưỡng theo sở', permission: 'APPROVE_MENU' },
    ],
  },
  {
    key: 'assets',
    label: 'Quản lý CSVC & Tài sản',
    permission: 'MANAGE_ASSET',
    children: [
      { key: 'assets-list', label: 'Danh mục Loại tài sản', permission: 'MANAGE_ASSET' },
      { key: 'room-assets', label: 'Phân bổ theo phòng/lớp', permission: 'MANAGE_ASSET' },
      { key: 'facility-handover', label: 'Phiếu bàn giao tài sản', permission: 'MANAGE_ASSET' },
      { key: 'facility-inventory', label: 'Kiểm kê & Báo cáo', permission: 'MANAGE_ASSET' },
      { key: 'facility-issues', label: 'Xử lý sự cố & Hư hỏng', permission: 'MANAGE_ASSET' },
    ],
  },
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
    'static-blocks': '/school-admin/static-blocks',
    menu: '/school-admin/menus',
    'meal-management': '/school-admin/meal-management',
    'district-nutrition-plan': '/school-admin/district-nutrition-plan',
    personnel: '/school-admin/personnel',
    'personnel-management': '/school-admin/personnel',
    teachers: '/school-admin/personnel',
    staff: '/school-admin/personnel',
    students: '/school-admin/students',
    'assessment-templates': '/school-admin/assessment-templates',
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
    assets: '/school-admin/facilities',
    'assets-list': '/school-admin/facilities',
    'room-assets': '/school-admin/facilities/room-based',
    'facility-handover': '/school-admin/facilities/handover',
    'facility-inventory': '/school-admin/facilities/inventory',
    'facility-issues': '/school-admin/facilities/issues',
    'purchase-requests': '/school-admin/purchase-requests',
    attendance: '/school-admin/attendance/overview',
    'attendance-overview': '/school-admin/attendance/overview',
    'face-attendance': '/school-admin/face-attendance',
    'facility-categories': '/school-admin/facilities/categories',
    'asset-categories': '/school-admin/facilities/asset-categories',
    'ingredient-categories': '/school-admin/ingredient-categories',
    'staff-positions': '/school-admin/staff-positions',
    bpm: '/system-admin/bpm',
  };
  if (routes[key]) {
    navigate(routes[key]);
  }
};


