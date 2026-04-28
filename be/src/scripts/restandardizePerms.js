const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');
const Role = require('../models/Role');

const PERMISSIONS_DATA = [
  // Hệ thống
  { code: 'MANAGE_ACCOUNT', description: 'Quản lý tài khoản người dùng', group: 'Hệ thống', path: '/system-admin/manage-accounts', menuKey: 'manage-accounts', order: 10 },
  { code: 'MANAGE_ROLE', description: 'Quản lý vai trò (Role)', group: 'Hệ thống', path: '/system-admin/manage-roles', menuKey: 'manage-roles', order: 11 },
  { code: 'MANAGE_PERMISSION', description: 'Quản lý quyền hạn (Permission)', group: 'Hệ thống', path: '/system-admin/manage-permissions', menuKey: 'manage-permissions', order: 12 },
  { code: 'MANAGE_JOB_POSITION', description: 'Quản lý chức danh hệ thống', group: 'Hệ thống', path: '/system-admin/job-positions', menuKey: 'job-positions', order: 13 },
  { code: 'VIEW_LOGS', description: 'Xem nhật ký hệ thống', group: 'Hệ thống', path: '/system-admin/system-logs', menuKey: 'system-logs', order: 14 },
  { code: 'MANAGE_BPM', description: 'Quản lý quy trình BPM', group: 'Hệ thống', path: '/system-admin/bpm', menuKey: 'bpm', order: 15 },

  // Học vụ & Lớp học
  { code: 'MANAGE_ACADEMIC_YEAR', description: 'Quản lý năm học', group: 'Học vụ & Lớp học', path: '/school-admin/academic-years', menuKey: 'academic-years', order: 20 },
  { code: 'MANAGE_ACADEMIC_PLAN', description: 'Quản lý kế hoạch học tập', group: 'Học vụ & Lớp học', path: '/school-admin/academic-plan', menuKey: 'academic-plan', order: 21 },
  { code: 'MANAGE_ACADEMIC_EVENTS', description: 'Quản lý sự kiện năm học', group: 'Học vụ & Lớp học', path: '/school-admin/academic-events', menuKey: 'academic-events', order: 22 },
  { code: 'MANAGE_CURRICULUM', description: 'Quản lý chương trình khung', group: 'Học vụ & Lớp học', path: '/school-admin/curriculum', menuKey: 'curriculum', order: 23 },
  { code: 'MANAGE_TIMETABLE', description: 'Quản lý thời khóa biểu', group: 'Học vụ & Lớp học', path: '/school-admin/timetable', menuKey: 'timetable', order: 24 },
  { code: 'MANAGE_GRADE', description: 'Quản lý khối lớp', group: 'Học vụ & Lớp học', path: '/school-admin/grades', menuKey: 'grades', order: 25 },
  { code: 'MANAGE_CLASS', description: 'Quản lý danh sách lớp', group: 'Học vụ & Lớp học', path: '/school-admin/classes', menuKey: 'classes', order: 26 },
  { code: 'MANAGE_STUDENT', description: 'Quản lý học sinh', group: 'Học vụ & Lớp học', path: '/school-admin/students', menuKey: 'students', order: 27 },
  { code: 'MANAGE_ASSESSMENT_TEMPLATE', description: 'Quản lý mẫu đánh giá', group: 'Học vụ & Lớp học', path: '/school-admin/assessment-templates', menuKey: 'assessment-templates', order: 28 },
  { code: 'MANAGE_STATIC_BLOCK', description: 'Quản lý khối nội dung tĩnh', group: 'Học vụ & Lớp học', path: '/school-admin/static-blocks', menuKey: 'static-blocks', order: 29 },

  // Điểm danh & Đưa đón
  { code: 'VIEW_ATTENDANCE', description: 'Xem tổng quan điểm danh', group: 'Điểm danh & Đưa đón', path: '/school-admin/attendance/overview', menuKey: 'attendance-overview', order: 30 },
  { code: 'REGISTER_FACE', description: 'Đăng ký & Điểm danh khuôn mặt', group: 'Điểm danh & Đưa đón', path: '/school-admin/face-attendance', menuKey: 'face-attendance', order: 31 },
  { code: 'EXPORT_REPORT', description: 'Xuất báo cáo điểm danh', group: 'Điểm danh & Đưa đón', path: '/school-admin/attendance/export', menuKey: 'attendance-export', order: 32 },
  { code: 'MANAGE_ATTENDANCE', description: 'Thực hiện điểm danh (Giáo viên)', group: 'Điểm danh & Đưa đón', path: '/teacher/attendance', menuKey: 'attendance', order: 33 },
  { code: 'MANAGE_PICKUP', description: 'Phê duyệt đơn đưa đón', group: 'Điểm danh & Đưa đón', path: '/teacher/pickup-approval', menuKey: 'pickup-approval', order: 34 },

  // Nhân sự
  { code: 'MANAGE_STAFF_POSITION', description: 'Quản lý vị trí công tác', group: 'Nhân sự', path: '/school-admin/staff-positions', menuKey: 'staff-positions', order: 40 },
  { code: 'MANAGE_PERSONNEL', description: 'Quản lý danh sách nhân sự', group: 'Nhân sự', path: '/school-admin/personnel', menuKey: 'personnel-management', order: 41 },
  { code: 'MANAGE_TEACHER', description: 'Quản lý giáo viên (legacy)', group: 'Nhân sự', path: '/school-admin/teachers', menuKey: 'teachers', order: 42 },

  // Bếp & Dinh dưỡng
  { code: 'APPROVE_MENU', description: 'Phê duyệt thực đơn', group: 'Bếp & Dinh dưỡng', path: '/school-admin/menus', menuKey: 'menu-admin', order: 50 },
  { code: 'MANAGE_MENU', description: 'Quản lý thực đơn (Bếp)', group: 'Bếp & Dinh dưỡng', path: '/kitchen/menus', menuKey: 'menu-kitchen', order: 51 },
  { code: 'MANAGE_FOOD', description: 'Quản lý món ăn', group: 'Bếp & Dinh dưỡng', path: '/kitchen/foods', menuKey: 'food-list', order: 52 },
  { code: 'MANAGE_INGREDIENTS', description: 'Quản lý nguyên liệu', group: 'Bếp & Dinh dưỡng', path: '/kitchen/ingredients', menuKey: 'ingredients', order: 53 },
  { code: 'MANAGE_MEAL', description: 'Quản lý suất ăn & Phản hồi', group: 'Bếp & Dinh dưỡng', path: '/kitchen/meal-management', menuKey: 'meal-management', order: 54 },
  { code: 'VIEW_MEAL_COUNT', description: 'Xem số lượng báo ăn', group: 'Bếp & Dinh dưỡng', path: '/kitchen/headcount', menuKey: 'headcount', order: 55 },
  { code: 'MANAGE_SAMPLE_FOOD', description: 'Quản lý lưu mẫu thức ăn', group: 'Bếp & Dinh dưỡng', path: '/kitchen/sample-food', menuKey: 'sample-food', order: 56 },
  { code: 'SCHOOL_ADMIN_DISTRICT_NUTRITION', description: 'Dinh dưỡng phòng (BGH)', group: 'Bếp & Dinh dưỡng', path: '/school-admin/district-nutrition-plan', menuKey: 'district-nutrition-plan', order: 57 },
  { code: 'KITCHEN_DISTRICT_NUTRITION', description: 'Dinh dưỡng phòng (Bếp)', group: 'Bếp & Dinh dưỡng', path: '/kitchen/district-nutrition', menuKey: 'district-nutrition', order: 58 },
  { code: 'VIEW_KITCHEN_REPORT', description: 'Xem báo cáo bếp', group: 'Bếp & Dinh dưỡng', path: '/kitchen/report', menuKey: 'report', order: 59 },
  { code: 'REVIEW_MENU', description: 'Xem xét thực đơn (Hội phụ huynh)', group: 'Bếp & Dinh dưỡng', path: '/head-parent/menus', menuKey: 'menu-review', order: 60 },

  // CSVC & Thiết bị
  { code: 'MANAGE_ASSET', description: 'Quản lý kho tài sản', group: 'CSVC & Thiết bị', path: '/school-admin/assets', menuKey: 'assets', order: 70 },
  { code: 'MANAGE_HANDOVER', description: 'Quản lý bàn giao tài sản', group: 'CSVC & Thiết bị', path: '/school-admin/asset-allocation', menuKey: 'asset-handover', order: 71 },
  { code: 'MANAGE_ASSET_ISSUES', description: 'Quản lý sự cố & sửa chữa', group: 'CSVC & Thiết bị', path: '/school-admin/asset-incidents', menuKey: 'asset-issues', order: 72 },
  { code: 'MANAGE_ROOM_ASSETS', description: 'Quản lý tài sản theo phòng', group: 'CSVC & Thiết bị', path: '/school-admin/room-assets', menuKey: 'room-assets', order: 73 },
  { code: 'MANAGE_PURCHASE', description: 'Quản lý đề xuất mua sắm', group: 'CSVC & Thiết bị', path: '/school-admin/purchase-requests', menuKey: 'purchase-requests', order: 74 },
  { code: 'MANAGE_COMMITTEE', description: 'Quản lý hội đồng kiểm kê', group: 'CSVC & Thiết bị', path: '/school-admin/committee', menuKey: 'committee', order: 75 },
  { code: 'MANAGE_MINUTES', description: 'Quản lý biên bản kiểm kê', group: 'CSVC & Thiết bị', path: '/school-admin/minutes', menuKey: 'minutes', order: 76 },

  // Nội dung & Truyền thông
  { code: 'MANAGE_PUBLIC_INFO', description: 'Quản lý thông tin công khai', group: 'Nội dung & Truyền thông', path: '/school-admin/public-info', menuKey: 'public-info', order: 80 },
  { code: 'MANAGE_BANNER', description: 'Quản lý Banner', group: 'Nội dung & Truyền thông', path: '/school-admin/banners', menuKey: 'banners', order: 81 },
  { code: 'MANAGE_BLOG', description: 'Quản lý bài viết/tin tức', group: 'Nội dung & Truyền thông', path: '/school-admin/blogs', menuKey: 'blogs', order: 82 },
  { code: 'MANAGE_BLOG_CATEGORY', description: 'Quản lý danh mục bài viết', group: 'Nội dung & Truyền thông', path: '/school-admin/blog-categories', menuKey: 'blog-categories', order: 83 },
  { code: 'MANAGE_DOCUMENT', description: 'Quản lý văn bản & hồ sơ', group: 'Nội dung & Truyền thông', path: '/school-admin/documents', menuKey: 'documents', order: 84 },
  { code: 'MANAGE_IMAGE_LIBRARY', description: 'Quản lý thư viện ảnh', group: 'Nội dung & Truyền thông', path: '/school-admin/image-library', menuKey: 'image-library', order: 85 },
  { code: 'MANAGE_VIDEOS', description: 'Quản lý thư viện video', group: 'Nội dung & Truyền thông', path: '/school-admin/video-library', menuKey: 'video-library', order: 86 },
  { code: 'MANAGE_CONTACT', description: 'Quản lý liên hệ khách hàng', group: 'Nội dung & Truyền thông', path: '/school-admin/contacts', menuKey: 'contacts', order: 87 },
  { code: 'MANAGE_QA', description: 'Quản lý hỏi đáp (Q&A)', group: 'Nội dung & Truyền thông', path: '/school-admin/qa', menuKey: 'qa', order: 88 },

  // Y tế
  { code: 'MANAGE_HEALTH', description: 'Quản lý hồ sơ sức khỏe', group: 'Y tế', path: '/medical-staff/health', menuKey: 'health-records', order: 90 },
  { code: 'MANAGE_HEALTH_INCIDENTS', description: 'Quản lý sự cố y tế', group: 'Y tế', path: '/medical-staff/incidents', menuKey: 'health-incidents', order: 91 },
  { code: 'VIEW_HEALTH_REPORT', description: 'Xem báo cáo y tế', group: 'Y tế', path: '/school-nurse/health-reports', menuKey: 'health-reports', order: 92 },

  // Role specific view perms
  { code: 'VIEW_TEACHER_DASHBOARD', description: 'Xem dashboard giáo viên', group: 'Giáo viên', path: '/teacher', menuKey: 'classes-teacher', order: 100 },
  { code: 'VIEW_TEACHER_STUDENTS', description: 'Xem danh sách học sinh lớp mình', group: 'Giáo viên', path: '/teacher/students', menuKey: 'students-teacher', order: 101 },
  { code: 'MANAGE_TEACHER_EVALUATION', description: 'Thực hiện đánh giá học sinh', group: 'Giáo viên', path: '/teacher/evaluation', menuKey: 'evaluation-teacher', order: 102 },
  { code: 'MANAGE_TEACHER_CONTACT_BOOK', description: 'Quản lý sổ liên lạc lớp', group: 'Giáo viên', path: '/teacher/contact-book', menuKey: 'contact-book', order: 103 },
];

const ROLES_MAPPING = {
  'SystemAdmin': PERMISSIONS_DATA.map(p => p.code),
  'SchoolAdmin': [
    'MANAGE_ACADEMIC_YEAR', 'MANAGE_ACADEMIC_PLAN', 'MANAGE_ACADEMIC_EVENTS', 'MANAGE_CURRICULUM', 
    'MANAGE_TIMETABLE', 'MANAGE_GRADE', 'MANAGE_CLASS', 'MANAGE_STUDENT', 'MANAGE_ASSESSMENT_TEMPLATE', 
    'MANAGE_STATIC_BLOCK', 'VIEW_ATTENDANCE', 'REGISTER_FACE', 'EXPORT_REPORT', 'MANAGE_STAFF_POSITION', 
    'MANAGE_PERSONNEL', 'APPROVE_MENU', 'MANAGE_MEAL', 'SCHOOL_ADMIN_DISTRICT_NUTRITION', 'MANAGE_ASSET', 
    'MANAGE_HANDOVER', 'MANAGE_ASSET_ISSUES', 'MANAGE_ROOM_ASSETS', 'MANAGE_PURCHASE', 'MANAGE_COMMITTEE', 
    'MANAGE_MINUTES', 'MANAGE_PUBLIC_INFO', 'MANAGE_BANNER', 'MANAGE_BLOG', 'MANAGE_BLOG_CATEGORY', 
    'MANAGE_DOCUMENT', 'MANAGE_IMAGE_LIBRARY', 'MANAGE_VIDEOS', 'MANAGE_CONTACT', 'MANAGE_QA',
    'VIEW_HEALTH_REPORT'
  ],
  'Teacher': [
    'VIEW_TEACHER_DASHBOARD', 'VIEW_TEACHER_STUDENTS', 'MANAGE_ATTENDANCE', 'MANAGE_TEACHER_EVALUATION', 
    'MANAGE_TEACHER_CONTACT_BOOK', 'MANAGE_PICKUP', 'MANAGE_ASSET'
  ],
  'HeadTeacher': [
    'VIEW_TEACHER_DASHBOARD', 'VIEW_TEACHER_STUDENTS', 'MANAGE_ATTENDANCE', 'MANAGE_TEACHER_EVALUATION', 
    'MANAGE_TEACHER_CONTACT_BOOK', 'MANAGE_PICKUP', 'MANAGE_ASSET'
  ],
  'KitchenStaff': [
    'MANAGE_MENU', 'MANAGE_FOOD', 'MANAGE_INGREDIENTS', 'MANAGE_MEAL', 'VIEW_MEAL_COUNT', 
    'MANAGE_SAMPLE_FOOD', 'KITCHEN_DISTRICT_NUTRITION', 'VIEW_KITCHEN_REPORT', 'APPROVE_MENU'
  ],
  'MedicalStaff': [
    'MANAGE_HEALTH', 'MANAGE_HEALTH_INCIDENTS', 'VIEW_HEALTH_REPORT'
  ],
  'SchoolNurse': [
    'MANAGE_HEALTH', 'VIEW_HEALTH_REPORT'
  ],
  'HeadParent': [
    'REVIEW_MENU'
  ]
};

async function standardize() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Upsert Permissions
    console.log('Upserting permissions...');
    for (const pData of PERMISSIONS_DATA) {
      await Permission.findOneAndUpdate(
        { code: pData.code },
        { $set: pData },
        { upsert: true, new: true }
      );
    }
    console.log('Permissions standardized.');

    // 2. Assign to Roles
    console.log('Assigning permissions to roles...');
    for (const [roleName, codes] of Object.entries(ROLES_MAPPING)) {
      let role = await Role.findOne({ roleName });
      if (!role) {
        console.log(`Role ${roleName} not found, creating...`);
        role = new Role({ roleName, description: `Vai trò ${roleName}` });
      }
      
      const permDocs = await Permission.find({ code: { $in: codes } });
      role.permissions = permDocs.map(p => p._id);
      await role.save();
      console.log(`Role ${roleName} standardized with ${permDocs.length} permissions.`);
    }

    console.log('Full standardization complete.');
    mongoose.disconnect();
  } catch (error) {
    console.error('Standardization failed:', error);
  }
}

standardize();
