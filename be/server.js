const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');

// Tải các biến môi trường
dotenv.config();

// Import các routes
const authRoutes = require('./src/routes/auth.routes');
const systemAdminRoutes = require('./src/routes/systemAdmin.routes');
const teacherRoutes = require('./src/routes/teacher.routes');
const schoolAdminRoutes = require('./src/routes/schoolAdmin.routes');
const classesRoutes = require('./src/routes/classes.routes');
const gradeRoutes = require('./src/routes/grade.routes');
const studentRoutes = require('./src/routes/student.routes');
const cloudinaryRoutes = require('./src/routes/cloudinary.routes');
const contactRoutes = require('./src/routes/contact.routes');
const bannerRoutes = require('./src/routes/banner.routes');
const qaRoutes = require('./src/routes/qa.routes');
const blogsRoutes = require('./src/routes/blogs.routes');
const documentsRoutes = require('./src/routes/documents.routes');
const otpRoutes = require('./src/routes/otp.routes');
const pickupRoutes = require("./src/routes/pickup.routes");
const foodRoutes = require("./src/routes/food.routes");
const ingredientRoutes = require("./src/routes/ingredient.routes");
const menuRoutes = require("./src/routes/menu.routes");
const aiRoutes = require("./src/routes/ai.routes");

const publicInfoRoutes = require('./src/routes/publicInfo.routes');
const imageLibraryRoutes = require('./src/routes/imageLibrary.routes');
const videoLibraryRoutes = require('./src/routes/videoLibrary.routes');
const DailyMenu = require('./src/routes/dailyMenu.routes');
const mealPhotoRoutes = require('./src/routes/mealPhoto.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const reportRoutes = require('./src/routes/report.routes');
const faceRoutes = require('./src/routes/face.routes');
const healthRoutes = require('./src/routes/health.routes');
const { startAutoApproveSampleEntries } = require('./src/jobs/autoApproveSampleEntries');
const { startDailyTimetableSummary, startTimetableRealtime } = require('./src/jobs/timetableNotifier');

// Import models để Mongoose đăng ký schema (tránh lỗi "Schema hasn't been registered for model 'Roles'")
require('./src/models/Role');
require('./src/models/Permission');
require('./src/models/Student');
require('./src/models/Grade');
require('./src/models/Classes');
require('./src/models/AcademicYear');
require('./src/models/User');
require('./src/models/Contact');
require('./src/models/Blog');
require('./src/models/BlogCategory');
require('./src/models/Question');
require('./src/models/Document');
require('./src/models/PublicInfo');
require('./src/models/SystemLog');
require('./src/models/CurriculumTopic');
require('./src/models/AcademicPlanTopic');
require('./src/models/AcademicEventPlan');
require('./src/models/Timetable');
require('./src/models/Notification');
require('./src/models/Classroom');
require('./src/models/Teacher');
require('./src/models/Ingredient');
require('./src/models/HealthCheck');
require('./src/models/HomepageBannerSetting');
require('./src/models/ImageLibraryItem');
require('./src/models/VideoClipItem');
require('./src/models/NutritionPlanSetting');
require('./src/models/InspectionCommittee');
require('./src/models/InspectionMinutes');

// Seed default roles on startup
(async () => {
  try {
    const Role = require('./src/models/Role');
    const defaultRoles = ['SystemAdmin', 'SchoolAdmin', 'HeadTeacher', 'Teacher', 'Parent', 'KitchenStaff'];
    for (const roleName of defaultRoles) {
      await Role.findOneAndUpdate(
        { roleName },
        { roleName },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Default roles seeded');

    // Đồng bộ Teacher records từ User có role Teacher
    const User = require('./src/models/User');
    const Teacher = require('./src/models/Teacher');
    const teacherRole = await Role.findOne({ roleName: 'Teacher' }).lean();
    if (teacherRole) {
      const teacherUsers = await User.find({ roles: teacherRole._id }).lean();
      let synced = 0;
      for (const u of teacherUsers) {
        const result = await Teacher.findOneAndUpdate(
          { userId: u._id },
          { $setOnInsert: { userId: u._id, status: 'active' } },
          { upsert: true, new: true, rawResult: true }
        );
        if (result.lastErrorObject?.upserted) synced++;
      }
      if (synced > 0) console.log(`✅ Synced ${synced} Teacher record(s) from User accounts`);
    }
  } catch (err) {
    console.error('Error seeding roles:', err);
  }
})();

// ensure default blog categories exist
(async () => {
  const BlogCategory = require('./src/models/BlogCategory');
  const Blog = require('./src/models/Blog');
  const Permission = require('./src/models/Permission');
  const defaults = [
    'Bản tin trường',
    'Thông báo',
    'Tin tức từ Phòng',
    'Thông báo từ Phòng',
    'Hoạt động ngoại khóa',
  ];
  try {
    for (const name of defaults) {
      await BlogCategory.findOneAndUpdate({ name }, { name }, { upsert: true, new: true });
    }
    console.log('✅ Default blog categories seeded');

    // migrate existing blog documents whose category field is still a string
    const blogsToFix = await Blog.find({ category: { $type: 'string' } });
    for (const b of blogsToFix) {
      const cat = await BlogCategory.findOne({ name: b.category });
      if (cat) {
        b.category = cat._id;
        await b.save();
      }
    }
    if (blogsToFix.length > 0) {
      console.log(`🔁 Migrated ${blogsToFix.length} blog(s) to use category ObjectId`);
    }

    // Set category: null on documents that don't have the field yet
    const Document = require('./src/models/Document');
    const docMigrated = await Document.updateMany(
      { category: { $exists: false } },
      { $set: { category: null } }
    );
    if (docMigrated.modifiedCount > 0) {
      console.log(`🔁 Initialized category field on ${docMigrated.modifiedCount} document(s)`);
    }

    // Ensure MANAGE_DOCUMENTS permission exists (legacy – không dùng trong route, giữ để không mất dữ liệu)
    await Permission.findOneAndUpdate(
      { code: 'MANAGE_DOCUMENTS' },
      { code: 'MANAGE_DOCUMENTS', description: 'Quản lý tài liệu (legacy)', group: 'Nội dung & Truyền thông' },
      { upsert: true, new: true }
    );
    console.log('✅ MANAGE_DOCUMENTS permission seeded');

    // Ensure MANAGE_BLOG_CATEGORY permission exists
    await Permission.findOneAndUpdate(
      { code: 'MANAGE_BLOG_CATEGORY' },
      { code: 'MANAGE_BLOG_CATEGORY', description: 'Quản lý danh mục blog', group: 'Nội dung & Truyền thông' },
      { upsert: true, new: true }
    );
    console.log('✅ MANAGE_BLOG_CATEGORY permission seeded');
  } catch (err) {
    console.error('Error seeding/migrating blog categories and permissions', err);
  }
})();

// Seed default permissions và gán cho từng role
(async () => {
  try {
    const Role = require('./src/models/Role');
    const Permission = require('./src/models/Permission');

    // Toàn bộ permissions hệ thống
    const allPermissions = [
      // Nội dung & Truyền thông
      { code: 'MANAGE_CONTACT',        description: 'Xem và phản hồi liên hệ từ phụ huynh gửi qua trang web',              group: 'Nội dung & Truyền thông' },
      { code: 'MANAGE_BANNER',         description: 'Thêm, sửa, xóa banner hiển thị trên trang chủ',                        group: 'Nội dung & Truyền thông' },
      { code: 'MANAGE_BLOG',           description: 'Thêm, sửa, xóa và xuất bản bài viết blog của trường',                  group: 'Nội dung & Truyền thông' },
      { code: 'MANAGE_BLOG_CATEGORY',  description: 'Thêm, sửa, xóa danh mục phân loại bài viết blog',                      group: 'Nội dung & Truyền thông' },
      { code: 'MANAGE_QA',             description: 'Xem và trả lời câu hỏi từ phụ huynh trên trang web hỏi đáp',           group: 'Nội dung & Truyền thông' },
      { code: 'MANAGE_DOCUMENT',       description: 'Tải lên, sửa và xóa tài liệu nội bộ (công văn, thông báo, biểu mẫu)', group: 'Nội dung & Truyền thông' },
      { code: 'MANAGE_DOCUMENTS',      description: 'Tải lên, sửa và xóa tài liệu nội bộ (công văn, thông báo, biểu mẫu)', group: 'Nội dung & Truyền thông' },
      { code: 'MANAGE_PUBLIC_INFO',    description: 'Cập nhật thông tin giới thiệu trường hiển thị công khai trên web',     group: 'Nội dung & Truyền thông' },
      { code: 'MANAGE_IMAGE_LIBRARY',  description: 'Tải lên, sắp xếp và xóa ảnh trong thư viện ảnh của trường',           group: 'Nội dung & Truyền thông' },
      // Học vụ
      { code: 'MANAGE_ACADEMIC_YEAR',  description: 'Tạo và quản lý năm học, học kỳ trong hệ thống',                        group: 'Học vụ' },
      { code: 'MANAGE_CURRICULUM',     description: 'Quản lý chủ đề học tập, thời khóa biểu và kế hoạch giảng dạy',        group: 'Học vụ' },
      { code: 'MANAGE_STUDENT',        description: 'Thêm, sửa, xóa hồ sơ học sinh và quản lý thông tin phụ huynh',        group: 'Học vụ' },
      { code: 'MANAGE_CLASS',          description: 'Thêm, sửa, xóa lớp học và phân công giáo viên chủ nhiệm',             group: 'Học vụ' },
      { code: 'MANAGE_CLASSES',        description: 'Thêm, sửa, xóa lớp học và phân công giáo viên chủ nhiệm',             group: 'Học vụ' },
      { code: 'MANAGE_GRADE',          description: 'Thêm, sửa, xóa khối lớp (Lá, Chồi, Mầm, ...) trong hệ thống',        group: 'Học vụ' },
      { code: 'MANAGE_GRADES',         description: 'Thêm, sửa, xóa khối lớp (Lá, Chồi, Mầm, ...) trong hệ thống',        group: 'Học vụ' },
      { code: 'MANAGE_TEACHER',        description: 'Thêm, sửa, xóa hồ sơ giáo viên và nhân viên trường',                  group: 'Học vụ' },
      // Điểm danh
      { code: 'VIEW_ATTENDANCE',       description: 'Xem tổng quan, tra cứu lịch sử và xuất dữ liệu điểm danh theo lớp/học sinh', group: 'Điểm danh' },
      { code: 'MANAGE_ATTENDANCE',     description: 'Thực hiện điểm danh vào buổi sáng (check-in) cho học sinh',           group: 'Điểm danh' },
      { code: 'CHECKOUT_STUDENT',      description: 'Thực hiện điểm danh ra về (check-out) cho học sinh cuối ngày',         group: 'Điểm danh' },
      { code: 'REGISTER_FACE',         description: 'Đăng ký và cập nhật dữ liệu khuôn mặt nhận diện cho học sinh',        group: 'Điểm danh' },
      { code: 'MANAGE_PICKUP',         description: 'Quản lý yêu cầu đón trả học sinh và xác nhận người được phép đón',    group: 'Điểm danh' },
      // Y tế
      { code: 'MANAGE_HEALTH',         description: 'Ghi nhận, cập nhật và xem hồ sơ y tế, lịch kiểm tra sức khỏe học sinh', group: 'Y tế' },
      // Bếp & Thực phẩm
      { code: 'MANAGE_FOOD',           description: 'Thêm, sửa, xóa danh mục thực phẩm, nguyên liệu và món ăn',            group: 'Bếp & Thực phẩm' },
      { code: 'MANAGE_MENU',           description: 'Tạo, sửa và gửi duyệt thực đơn hàng ngày cho học sinh',               group: 'Bếp & Thực phẩm' },
      { code: 'MANAGE_MEAL_PHOTO',     description: 'Tải lên ảnh bữa ăn thực tế và quản lý mẫu thực phẩm kiểm tra',       group: 'Bếp & Thực phẩm' },
      { code: 'APPROVE_MENU',          description: 'Xem xét và duyệt thực đơn, ảnh bữa ăn do bếp gửi lên',               group: 'Bếp & Thực phẩm' },
      // Tài sản & Mua sắm
      { code: 'MANAGE_ASSET',          description: 'Quản lý danh mục tài sản, biên bản bàn giao, phân bổ và sự cố hư hỏng', group: 'Tài sản & Mua sắm' },
      { code: 'MANAGE_PURCHASE_REQUEST', description: 'Tạo, theo dõi và xét duyệt đề xuất mua sắm thiết bị, vật tư',      group: 'Tài sản & Mua sắm' },
      { code: 'MANAGE_INSPECTION',     description: 'Lập và quản lý biên bản kiểm kê, kiểm tra tình trạng tài sản',        group: 'Tài sản & Mua sắm' },
      { code: 'MANAGE_FACILITIES',     description: 'Quản lý cơ sở vật chất, phòng học và trang thiết bị trường học',      group: 'Tài sản & Mua sắm' },
      // Quản trị hệ thống
      { code: 'MANAGE_USERS',          description: 'Tạo, sửa, vô hiệu hóa tài khoản người dùng trong hệ thống',           group: 'Quản trị hệ thống' },
      // Báo cáo
      { code: 'VIEW_REPORT',           description: 'Xem và xuất báo cáo tuần, tháng, báo cáo mẫu thực phẩm và khẩu phần ăn', group: 'Báo cáo' },
      { code: 'SUBMIT_REPORT',         description: 'Gửi báo cáo giảng dạy, điểm danh lên tổ trưởng để xét duyệt',        group: 'Báo cáo' },
      { code: 'MANAGE_TEACHER_REPORT', description: 'Xem danh sách, duyệt và chuyển tiếp báo cáo giáo viên lên ban giám hiệu', group: 'Báo cáo' },
    ];

    // Upsert tất cả permissions
    const permMap = {};
    for (const p of allPermissions) {
      const doc = await Permission.findOneAndUpdate(
        { code: p.code },
        { code: p.code, description: p.description, group: p.group || '' },
        { upsert: true, new: true }
      );
      permMap[p.code] = doc._id;
    }

    // Permissions mặc định theo role
    const roleDefaults = {
      SchoolAdmin: [
        'MANAGE_CONTACT', 'MANAGE_BANNER', 'VIEW_ATTENDANCE', 'MANAGE_BLOG',
        'MANAGE_BLOG_CATEGORY', 'MANAGE_QA', 'MANAGE_DOCUMENT', 'MANAGE_PUBLIC_INFO',
        'MANAGE_IMAGE_LIBRARY', 'MANAGE_ACADEMIC_YEAR', 'MANAGE_CURRICULUM',
        'MANAGE_STUDENT', 'MANAGE_CLASS', 'MANAGE_GRADE', 'MANAGE_TEACHER',
        'APPROVE_MENU', 'VIEW_REPORT', 'MANAGE_HEALTH',
        'REGISTER_FACE', 'CHECKOUT_STUDENT', 'MANAGE_ATTENDANCE',
        'MANAGE_PURCHASE_REQUEST', 'MANAGE_ASSET', 'MANAGE_PICKUP',
      ],
      HeadTeacher: [
        // Tất cả quyền của giáo viên
        'MANAGE_ATTENDANCE', 'MANAGE_PURCHASE_REQUEST', 'MANAGE_ASSET',
        'MANAGE_PICKUP', 'REGISTER_FACE', 'CHECKOUT_STUDENT',
        'SUBMIT_REPORT',
        // Quyền riêng của tổ trưởng: xem, duyệt và chuyển báo cáo lên ban giám hiệu
        'MANAGE_TEACHER_REPORT',
      ],
      Teacher: [
        'MANAGE_ATTENDANCE', 'MANAGE_PURCHASE_REQUEST', 'MANAGE_ASSET',
        'MANAGE_PICKUP', 'REGISTER_FACE', 'CHECKOUT_STUDENT',
        'SUBMIT_REPORT',
      ],
      KitchenStaff: [
        'MANAGE_FOOD', 'MANAGE_MENU', 'MANAGE_MEAL_PHOTO', 'VIEW_REPORT',
      ],
      InventoryStaff: [
        'MANAGE_INSPECTION',
      ],
    };

    for (const [roleName, codes] of Object.entries(roleDefaults)) {
      const role = await Role.findOne({ roleName });
      if (!role) continue;
      const ids = codes.map(c => permMap[c]).filter(Boolean);
      // Chỉ thêm permissions chưa có, không ghi đè cấu hình hiện tại
      const existing = (role.permissions || []).map(id => id.toString());
      const toAdd = ids.filter(id => !existing.includes(id.toString()));
      if (toAdd.length > 0) {
        await Role.updateOne({ _id: role._id }, { $addToSet: { permissions: { $each: toAdd } } });
        console.log(`✅ Added ${toAdd.length} permission(s) to role ${roleName}`);
      }
    }
    console.log('✅ Default permissions seeded and assigned to roles');

    // Cấu hình kế thừa role (parent)
    // HeadTeacher kế thừa toàn bộ quyền của Teacher, chỉ thêm MANAGE_TEACHER_REPORT
    const parentConfig = [
      { child: 'HeadTeacher', parent: 'Teacher' },
    ];
    for (const { child, parent } of parentConfig) {
      const childRole  = await Role.findOne({ roleName: child });
      const parentRole = await Role.findOne({ roleName: parent });
      if (!childRole || !parentRole) continue;
      // Chỉ set nếu chưa có parent (không ghi đè cấu hình thủ công)
      if (!childRole.parent) {
        await Role.updateOne({ _id: childRole._id }, { $set: { parent: parentRole._id } });
        console.log(`✅ Set ${child}.parent = ${parent}`);
      }
    }
    console.log('✅ Role parent relationships configured');
  } catch (err) {
    console.error('Error seeding permissions:', err);
  }
})();

// Khởi tạo ứng dụng express
const app = express();

// ============================================
// Các hàm hỗ trợ cấu hình
// ============================================

/**
 * Phân tích và hợp nhất các CORS origins từ biến môi trường
 * @returns {string[]} Mảng các origins được phép
 */
const getAllowedOrigins = () => {
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'https://duc-xuan-kindergarten-management.vercel.app/',
    'https://duc-xuan-kindergarten-management.vercel.app',
    'https://ducxuankindergartenmanagement-production.up.railway.app'
  ];

  const envOrigins = process.env.CORS_ORIGINS ||
    process.env.CORS_ORIGIN ||
    process.env.FRONTEND_URL ||
    '';

  const parsedEnvOrigins = envOrigins
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);

  return [...new Set([...defaultOrigins, ...parsedEnvOrigins])];
};

/**
 * Lấy base URL cho server
 * @param {number} port - Cổng server
 * @returns {string} Base URL
 */
const getBaseUrl = (port) => {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  if (process.env.NODE_ENV === 'production' && process.env.PRODUCTION_BACKEND_URL) {
    return process.env.PRODUCTION_BACKEND_URL;
  }
  return `http://localhost:${port}`;
};

/**
 * Lấy các tùy chọn kết nối MongoDB dựa trên loại URI
 * @param {string} uri - URI kết nối MongoDB
 * @returns {object} Các tùy chọn kết nối Mongoose
 */
const getMongooseOptions = (uri) => {
  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  // Thêm tùy chọn TLS cho MongoDB Atlas (cloud)
  if (uri.includes('mongodb+srv')) {
    options.tls = true;
    options.tlsAllowInvalidCertificates = false;
  }

  return options;
};

// ============================================
// Cấu hình Middleware
// ============================================

// Cấu hình CORS
const allowedOrigins = getAllowedOrigins();
const corsOptions = {
  origin: (origin, callback) => {
    // Cho phép các request không có origin (ứng dụng mobile, Postman, curl, v.v.)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const error = new Error(
      `Origin ${origin} not allowed by CORS. Allowed origins: ${allowedOrigins.join(', ')}`
    );
    return callback(error);
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// Swagger API Docs
// ============================================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// ============================================
// Các Routes
// ============================================

// Routes xác thực (đăng nhập)
app.use('/api/auth', authRoutes);

// SystemAdmin routes
app.use('/api/system-admin', systemAdminRoutes);

// Teacher routes
app.use('/api/teacher', teacherRoutes);

// Classes routes
app.use('/api/classes', classesRoutes);
app.use('/api/grades', gradeRoutes);

// Student routes
app.use('/api/students', studentRoutes);

// Cloudinary helper routes
app.use('/api/cloudinary', cloudinaryRoutes);

// SchoolAdmin routes
app.use('/api/school-admin', schoolAdminRoutes);

// Contact (public submit)
app.use('/api/contact', contactRoutes);
app.use('/api/banners', bannerRoutes);

// Q&A (public)
app.use('/api/qa', qaRoutes);

// Documents (public - published only)
app.use('/api/documents', documentsRoutes);

// Blogs (public - published only)
app.use('/api/blogs', blogsRoutes);

// OTP routes
app.use('/api/otp', otpRoutes);

// pickup-requets
app.use("/api/pickup", pickupRoutes);

//menus
app.use("/api/foods", foodRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/daily-menus",DailyMenu);
app.use('/api/meal-photos', mealPhotoRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// Face attendance routes (nhận diện khuôn mặt)
app.use('/api/face', faceRoutes);

// Health check routes (SchoolNurse)
app.use('/api/health', healthRoutes);

// Public info (public - published only)
app.use('/api/public-info', publicInfoRoutes);
app.use('/api/image-library', imageLibraryRoutes);
app.use('/api/video-library', videoLibraryRoutes);

// Thời khóa biểu (public - không cần đăng nhập)
const timetableRoutes = require('./src/routes/timetable.routes');
app.use('/api/timetable', timetableRoutes);
// Route kiểm tra sức khỏe hệ thống
/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Kiểm tra tình trạng server
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Trạng thái hệ thống hiện tại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: SEP490_G54 API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                 mongodb:
 *                   type: string
 *                   example: connected
 */
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'success',
    message: 'SEP490_G54 API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.json(healthStatus);
});

// ============================================
// Xử lý lỗi
// ============================================

// Xử lý lỗi toàn cục
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Xử lý 404
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.method} ${req.path}`,
    availableRoutes: [
      'POST /api/auth/login',
      'GET  /api/health',
      'GET  /api/system-admin/dashboard',
      'GET  /api/teacher/dashboard',
      'GET  /api/school-admin/dashboard',
    ],
  });
});

// ============================================
// Khởi tạo Server
// ============================================

const PORT = process.env.PORT || 5000;
const baseUrl = getBaseUrl(PORT);

// Khởi động server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on ${baseUrl}`);
  console.log(`📡 Health check: ${baseUrl}/api/health`);
  console.log(`📘 Swagger docs: ${baseUrl}/api-docs`);

  // Khởi động cron jobs
  startAutoApproveSampleEntries();
  startDailyTimetableSummary();
  startTimetableRealtime();
});

// ============================================
// Kết nối Database
// ============================================

const MONGODB_URI = process.env.MONGODB_URI || '';

if (MONGODB_URI && MONGODB_URI.trim() !== '') {
  const mongooseOptions = getMongooseOptions(MONGODB_URI);
  const isAtlas = MONGODB_URI.includes('mongodb+srv');

  mongoose
    .connect(MONGODB_URI, mongooseOptions)
    .then(() => {
      const dbName = mongoose.connection.db.databaseName;
      const dbHost = mongoose.connection.host;
      console.log(`✅ MongoDB ${isAtlas ? 'Atlas' : ''} connected successfully!`);
      console.log(`   Database: ${dbName}`);
      console.log(`   Host: ${dbHost}`);
    })
    .catch((err) => {
      console.error('❌ MongoDB connection failed:');
      console.error(`   Error: ${err.message}`);
      console.error('   Server continues without database connection.');
    });

  // Xử lý các sự kiện kết nối MongoDB
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });
} else {
  console.warn('⚠️  No MongoDB URI provided. Running without database connection.');
  console.warn('   Please set MONGODB_URI in your .env file');
}

module.exports = app;
