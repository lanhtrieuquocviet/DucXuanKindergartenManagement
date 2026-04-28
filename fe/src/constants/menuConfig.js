/**
 * Cấu hình Menu chuẩn cho từng vai trò trong hệ thống.
 * Mỗi mục menu bao gồm:
 * - key: định danh duy nhất (dùng để map icon trong RoleLayout)
 * - label: tên hiển thị
 * - path: đường dẫn điều hướng
 * - permissionCode: mã quyền tương ứng trong DB (dùng để lọc nếu có)
 * - children: danh sách menu con
 */

export const MENU_CONFIG = {
  SystemAdmin: [
    { key: 'overview', label: 'Tổng quan', path: '/system-admin' },
    {
      key: 'system-management',
      label: 'Hệ thống',
      children: [
        { key: 'manage-accounts', label: 'Tài khoản', path: '/system-admin/manage-accounts', permissionCode: 'MANAGE_ACCOUNT' },
        { key: 'manage-roles', label: 'Vai trò', path: '/system-admin/manage-roles', permissionCode: 'MANAGE_ROLE' },
        { key: 'manage-permissions', label: 'Quyền hạn', path: '/system-admin/manage-permissions', permissionCode: 'MANAGE_PERMISSION' },
        { key: 'job-positions', label: 'Chức danh', path: '/system-admin/job-positions', permissionCode: 'MANAGE_JOB_POSITION' },
        { key: 'system-logs', label: 'Nhật ký hệ thống', path: '/system-admin/system-logs', permissionCode: 'VIEW_LOGS' },
        { key: 'bpm', label: 'Quy trình BPM', path: '/system-admin/bpm', permissionCode: 'MANAGE_BPM' },
      ]
    }
  ],

  SchoolAdmin: [
    { key: 'overview', label: 'Tổng quan', path: '/school-admin' },
    {
      key: 'academic-management',
      label: 'Học vụ & Lớp học',
      children: [
        { key: 'academic-years', label: 'Năm học', path: '/school-admin/academic-years', permissionCode: 'MANAGE_ACADEMIC_YEAR' },
        { key: 'academic-plan', label: 'Kế hoạch học tập', path: '/school-admin/academic-plan', permissionCode: 'MANAGE_ACADEMIC_PLAN' },
        { key: 'academic-events', label: 'Sự kiện năm học', path: '/school-admin/academic-events', permissionCode: 'MANAGE_ACADEMIC_EVENTS' },
        { key: 'curriculum', label: 'Chương trình khung', path: '/school-admin/curriculum', permissionCode: 'MANAGE_CURRICULUM' },
        { key: 'timetable', label: 'Thời khóa biểu', path: '/school-admin/timetable', permissionCode: 'MANAGE_TIMETABLE' },
        { key: 'grades', label: 'Khối lớp', path: '/school-admin/grades', permissionCode: 'MANAGE_GRADE' },
        { key: 'classes', label: 'Danh sách lớp', path: '/school-admin/classes', permissionCode: 'MANAGE_CLASS' },
        { key: 'students', label: 'Học sinh', path: '/school-admin/students', permissionCode: 'MANAGE_STUDENT' },
        { key: 'assessment-templates', label: 'Mẫu đánh giá', path: '/school-admin/assessment-templates', permissionCode: 'MANAGE_ASSESSMENT_TEMPLATE' },
      ]
    },
    {
      key: 'attendance-management',
      label: 'Điểm danh & Đưa đón',
      children: [
        { key: 'attendance-overview', label: 'Tổng quan điểm danh', path: '/school-admin/attendance/overview', permissionCode: 'VIEW_ATTENDANCE' },
        { key: 'face-attendance', label: 'Điểm danh khuôn mặt', path: '/school-admin/face-attendance', permissionCode: 'REGISTER_FACE' },
        { key: 'attendance-export', label: 'Xuất báo cáo', path: '/school-admin/attendance/export', permissionCode: 'EXPORT_REPORT' },
      ]
    },
    {
      key: 'personnel',
      label: 'Nhân sự',
      children: [
        { key: 'staff-positions', label: 'Vị trí công tác', path: '/school-admin/staff-positions', permissionCode: 'MANAGE_STAFF_POSITION' },
        { key: 'personnel-management', label: 'Danh sách nhân sự', path: '/school-admin/personnel', permissionCode: 'MANAGE_PERSONNEL' },
      ]
    },
    {
      key: 'food-nutrition',
      label: 'Bếp & Dinh dưỡng',
      children: [
        { key: 'menu-admin', label: 'Thực đơn', path: '/school-admin/menus', permissionCode: 'APPROVE_MENU' },
        { key: 'meal-management', label: 'Suất ăn & Phản hồi', path: '/school-admin/meal-management', permissionCode: 'MANAGE_MEAL' },
        { key: 'district-nutrition-plan', label: 'Kế hoạch dinh dưỡng', path: '/school-admin/district-nutrition-plan', permissionCode: 'SCHOOL_ADMIN_DISTRICT_NUTRITION' },
      ]
    },
    {
      key: 'assets-management',
      label: 'CSVC & Thiết bị',
      children: [
        { key: 'assets', label: 'Kho tài sản', path: '/school-admin/assets', permissionCode: 'MANAGE_ASSET' },
        { key: 'asset-allocation', label: 'Bàn giao tài sản', path: '/school-admin/asset-allocation', permissionCode: 'MANAGE_HANDOVER' },
        { key: 'asset-incidents', label: 'Sự cố & Sửa chữa', path: '/school-admin/asset-incidents', permissionCode: 'MANAGE_ASSET_ISSUES' },
        { key: 'room-assets', label: 'Tài sản theo phòng', path: '/school-admin/room-assets', permissionCode: 'MANAGE_ROOM_ASSETS' },
        { key: 'purchase-requests', label: 'Đề xuất mua sắm', path: '/school-admin/purchase-requests', permissionCode: 'MANAGE_PURCHASE' },
        { key: 'committee', label: 'Hội đồng kiểm kê', path: '/school-admin/committee', permissionCode: 'MANAGE_COMMITTEE' },
        { key: 'minutes', label: 'Biên bản kiểm kê', path: '/school-admin/minutes', permissionCode: 'MANAGE_MINUTES' },
      ]
    },
    {
      key: 'cms-management',
      label: 'Nội dung & Truyền thông',
      children: [
        { key: 'public-info', label: 'Thông tin công khai', path: '/school-admin/public-info', permissionCode: 'MANAGE_PUBLIC_INFO' },
        { key: 'banners', label: 'Banners', path: '/school-admin/banners', permissionCode: 'MANAGE_BANNER' },
        { key: 'blogs', label: 'Tin tức', path: '/school-admin/blogs', permissionCode: 'MANAGE_BLOG' },
        { key: 'blog-categories', label: 'Danh mục tin', path: '/school-admin/blog-categories', permissionCode: 'MANAGE_BLOG_CATEGORY' },
        { key: 'documents', label: 'Văn bản & Hồ sơ', path: '/school-admin/documents', permissionCode: 'MANAGE_DOCUMENT' },
        { key: 'image-library', label: 'Thư viện ảnh', path: '/school-admin/image-library', permissionCode: 'MANAGE_IMAGE_LIBRARY' },
        { key: 'video-library', label: 'Thư viện video', path: '/school-admin/video-library', permissionCode: 'MANAGE_VIDEOS' },
        { key: 'contacts', label: 'Liên hệ', path: '/school-admin/contacts', permissionCode: 'MANAGE_CONTACT' },
        // { key: 'qa', label: 'Hỏi đáp (Q&A)', path: '/school-admin/qa', permissionCode: 'MANAGE_QA' },
        { key: 'static-blocks', label: 'Khối nội dung tĩnh', path: '/school-admin/static-blocks', permissionCode: 'MANAGE_STATIC_BLOCK' },
      ]
    }
  ],

  Teacher: [
    { key: 'overview', label: 'Tổng quan', path: '/teacher' },
    { key: 'classes-teacher', label: 'Lớp phụ trách', path: '/teacher', permissionCode: 'VIEW_TEACHER_DASHBOARD' },
    { key: 'students-teacher', label: 'Danh sách học sinh', path: '/teacher/students', permissionCode: 'VIEW_TEACHER_STUDENTS' },
    { key: 'attendance', label: 'Điểm danh', path: '/teacher/attendance', permissionCode: 'MANAGE_ATTENDANCE' },
    { key: 'leave-requests', label: 'Đơn xin nghỉ', path: '/teacher/leave-requests', permissionCode: 'MANAGE_ATTENDANCE' },
    { key: 'evaluation-teacher', label: 'Đánh giá học sinh', path: '/teacher/evaluation', permissionCode: 'MANAGE_TEACHER_EVALUATION' },
    { key: 'contact-book', label: 'Sổ liên lạc', path: '/teacher/contact-book', permissionCode: 'MANAGE_TEACHER_CONTACT_BOOK' },
    { key: 'pickup-approval', label: 'Đơn đưa đón', path: '/teacher/pickup-approval', permissionCode: 'MANAGE_PICKUP' },
    { key: 'class-assets', label: 'Tài sản lớp', path: '/teacher/class-assets', permissionCode: 'MANAGE_ASSET' },
    { key: 'asset-incidents-teacher', label: 'Báo cáo sự cố', path: '/teacher/asset-incidents', permissionCode: 'MANAGE_ASSET' },
  ],

  KitchenStaff: [
    { key: 'overview', label: 'Tổng quan', path: '/kitchen' },
    { key: 'menu-kitchen', label: 'Quản lý thực đơn', path: '/kitchen/menus', permissionCode: 'MANAGE_MENU' },
    { key: 'food-list', label: 'Món ăn', path: '/kitchen/foods', permissionCode: 'MANAGE_FOOD' },
    { key: 'ingredients', label: 'Nguyên liệu', path: '/kitchen/ingredients', permissionCode: 'MANAGE_INGREDIENTS' },
    { key: 'meal-management', label: 'Suất ăn', path: '/kitchen/meal-management', permissionCode: 'MANAGE_MEAL' },
    { key: 'headcount', label: 'Số lượng báo ăn', path: '/kitchen/headcount', permissionCode: 'VIEW_MEAL_COUNT' },
    { key: 'sample-food', label: 'Lưu mẫu thức ăn', path: '/kitchen/sample-food', permissionCode: 'MANAGE_SAMPLE_FOOD' },
    { key: 'district-nutrition', label: 'Dinh dưỡng phòng', path: '/kitchen/district-nutrition', permissionCode: 'KITCHEN_DISTRICT_NUTRITION' },
    { key: 'report', label: 'Báo cáo & Thống kê', path: '/kitchen/report', permissionCode: 'VIEW_KITCHEN_REPORT' },
  ],

  MedicalStaff: [
    { key: 'overview', label: 'Tổng quan', path: '/medical-staff' },
    { key: 'health-records', label: 'Hồ sơ sức khỏe', path: '/medical-staff/health', permissionCode: 'MANAGE_HEALTH' },
    { key: 'health-incidents', label: 'Sự cố y tế', path: '/medical-staff/incidents', permissionCode: 'MANAGE_HEALTH_INCIDENTS' },
  ],

  SchoolNurse: [
    { key: 'overview', label: 'Tổng quan', path: '/school-nurse' },
    { key: 'health-list', label: 'Khám sức khỏe', path: '/school-nurse/health-list', permissionCode: 'MANAGE_HEALTH' },
    { key: 'follow-up', label: 'Theo dõi điều trị', path: '/school-nurse/follow-up', permissionCode: 'MANAGE_HEALTH' },
    { key: 'health-reports', label: 'Báo cáo y tế', path: '/school-nurse/health-reports', permissionCode: 'VIEW_HEALTH_REPORT' },
  ],

  HeadParent: [
    { key: 'overview', label: 'Tổng quan', path: '/head-parent' },
    { key: 'menu-review', label: 'Xem xét thực đơn', path: '/head-parent/menus', permissionCode: 'REVIEW_MENU' },
  ]
};

/**
 * Trả về bộ menu mặc định dựa trên vai trò.
 */
export const getDefaultMenuByRole = (roleName) => {
  if (!roleName) return [];
  
  // Ánh xạ role name từ DB sang key trong MENU_CONFIG
  const roleMap = {
    'SystemAdmin': 'SystemAdmin',
    'SchoolAdmin': 'SchoolAdmin',
    'Teacher': 'Teacher',
    'HeadTeacher': 'Teacher',
    'KitchenStaff': 'KitchenStaff',
    'MedicalStaff': 'MedicalStaff',
    'SchoolNurse': 'SchoolNurse',
    'HeadParent': 'HeadParent',
  };

  const configKey = roleMap[roleName] || roleName;
  return MENU_CONFIG[configKey] || [];
};
