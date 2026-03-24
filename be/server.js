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
const qaRoutes = require('./src/routes/qa.routes');
const blogsRoutes = require('./src/routes/blogs.routes');
const documentsRoutes = require('./src/routes/documents.routes');
const otpRoutes = require('./src/routes/otp.routes');
const pickupRoutes = require("./src/routes/pickup.routes");
const foodRoutes = require("./src/routes/food.routes");
const ingredientRoutes = require("./src/routes/ingredient.routes");
const menuRoutes = require("./src/routes/menu.routes");


const publicInfoRoutes = require('./src/routes/publicInfo.routes');
const DailyMenu = require('./src/routes/dailyMenu.routes');
const mealPhotoRoutes = require('./src/routes/mealPhoto.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const reportRoutes = require('./src/routes/report.routes');
const faceRoutes = require('./src/routes/face.routes');
const { startAutoApproveSampleEntries } = require('./src/jobs/autoApproveSampleEntries');

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
require('./src/models/Timetable');
require('./src/models/Notification');
require('./src/models/Classroom');
require('./src/models/Teacher');
require('./src/models/Ingredient');

// Seed default roles on startup
(async () => {
  try {
    const Role = require('./src/models/Role');
    const defaultRoles = ['SystemAdmin', 'SchoolAdmin', 'Teacher', 'Parent', 'KitchenStaff'];
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

    // Ensure MANAGE_DOCUMENTS permission exists
    await Permission.findOneAndUpdate(
      { code: 'MANAGE_DOCUMENTS' },
      { code: 'MANAGE_DOCUMENTS', description: 'Quản lý tài liệu' },
      { upsert: true, new: true }
    );
    console.log('✅ MANAGE_DOCUMENTS permission seeded');

    // Ensure MANAGE_BLOG_CATEGORY permission exists
    await Permission.findOneAndUpdate(
      { code: 'MANAGE_BLOG_CATEGORY' },
      { code: 'MANAGE_BLOG_CATEGORY', description: 'Quản lý danh mục blog' },
      { upsert: true, new: true }
    );
    console.log('✅ MANAGE_BLOG_CATEGORY permission seeded');
  } catch (err) {
    console.error('Error seeding/migrating blog categories and permissions', err);
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
    'https://ducxuankindergartenmanagement-production.up.railway.app/api-docs/'
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
app.use("/api/daily-menus",DailyMenu);
app.use('/api/meal-photos', mealPhotoRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// Face attendance routes (nhận diện khuôn mặt)
app.use('/api/face', faceRoutes);

// Public info (public - published only)
app.use('/api/public-info', publicInfoRoutes);

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
                   example: success
                 message:
                   type: string
                   example: SEP490_G54 API is running
                 timestamp:
                   type: string
                   format: date-time
                 environment:
                   type: string
                 mongodb:
                   type: string
                   example: connected
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
