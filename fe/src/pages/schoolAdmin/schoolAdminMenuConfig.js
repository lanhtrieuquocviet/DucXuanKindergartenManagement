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
    children: [
      { key: 'academic-year-setup', label: 'Thiết lập năm học' },
      { key: 'academic-plan', label: 'Thiết lập kế hoạch' },
      { key: 'academic-schedule', label: 'Thời gian biểu' },
      { key: 'academic-report', label: 'Báo cáo & thống kê' },
    ],
  },
  { key: 'classes', label: 'Lớp học' },
  { key: 'menu', label: 'Quản lý thực đơn' },
  { key: 'meal-management', label: 'Quản lý bữa ăn' },
  { key: 'teachers', label: 'Giáo viên' },
  { key: 'students', label: 'Học sinh & phụ huynh' },
  {
    key: 'assets',
    label: 'Quản lý tài sản',
    children: [
      { key: 'asset-allocation', label: 'Phân bổ tài sản' },
      { key: 'purchase-requests', label: 'Yêu cầu mua sắm' },
    ],
  },
  { key: 'reports', label: 'Báo cáo của trường' },
  { key: 'contacts', label: 'Liên hệ' },
  { key: 'qa', label: 'Câu hỏi' },
  { key: 'blogs', label: 'Quản lý blog' },
  { key: 'documents', label: 'Quản lý tài liệu' },
  { key: 'public-info', label: 'Thông tin công khai' },
  { key: 'banner-management', label: 'Quản lý banner' },
  { key: 'attendance', label: 'Quản lý điểm danh' },
  { key: 'face-attendance', label: 'Đăng ký khuôn mặt' },
  { key: 'bpm', label: 'Quản lý quy trình (BPM)' },
];

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
    'academic-students': '/school-admin/class-list',
    'academic-report': '/school-admin/academic-report',
    classes: '/school-admin/classes',
    menu: '/school-admin/menus',
    'meal-management': '/school-admin/meal-management',
    teachers: '/school-admin/teachers',
    students: '/school-admin/students',
    contacts: '/school-admin/contacts',
    qa: '/school-admin/qa',
    blogs: '/school-admin/blogs',
    documents: '/school-admin/documents',
    'public-info': '/school-admin/public-info',
    'banner-management': '/school-admin/banners',
    assets: '/school-admin/assets',
    'asset-allocation': '/school-admin/asset-allocation',
    'purchase-requests': '/school-admin/purchase-requests',
    attendance: '/school-admin/attendance/overview',
    'face-attendance': '/school-admin/face-attendance',
    bpm: '/system-admin/bpm',
  };
  if (routes[key]) navigate(routes[key]);
};
