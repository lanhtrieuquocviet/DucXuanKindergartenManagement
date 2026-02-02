const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const systemAdminRoutes = require('./src/routes/systemAdmin.routes');
const teacherRoutes = require('./src/routes/teacher.routes');
const schoolAdminRoutes = require('./src/routes/schoolAdmin.routes');
const classesRoutes = require('./src/routes/classes.routes');
const studentRoutes = require('./src/routes/student.routes');

// Import models để Mongoose đăng ký schema (tránh lỗi "Schema hasn't been registered for model 'Roles'")
require('./src/models/Role');
require('./src/models/Permission');
require('./src/models/Student');
require('./src/models/Grade');
require('./src/models/Classes');
require('./src/models/AcademicYear');
require('./src/models/User');

// Initialize express app
const app = express();

// ============================================
// Configuration Helpers
// ============================================

/**
 * Parse and merge CORS origins from environment variables
 * @returns {string[]} Array of allowed origins
 */
const getAllowedOrigins = () => {
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
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
 * Get base URL for the server
 * @param {number} port - Server port
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
 * Get MongoDB connection options based on URI type
 * @param {string} uri - MongoDB connection URI
 * @returns {object} Mongoose connection options
 */
const getMongooseOptions = (uri) => {
  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  // Add TLS options for MongoDB Atlas (cloud)
  if (uri.includes('mongodb+srv')) {
    options.tls = true;
    options.tlsAllowInvalidCertificates = false;
  }

  return options;
};

// ============================================
// Middleware Configuration
// ============================================

// CORS configuration
const allowedOrigins = getAllowedOrigins();
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
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
// Routes
// ============================================

// Auth routes (login)
app.use('/api/auth', authRoutes);

// SystemAdmin routes
app.use('/api/system-admin', systemAdminRoutes);

// Teacher routes
app.use('/api/teacher', teacherRoutes);

// Classes routes
app.use('/api/classes', classesRoutes);

// Student routes
app.use('/api/students', studentRoutes);

// SchoolAdmin routes
app.use('/api/school-admin', schoolAdminRoutes);

// Health check route
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
// Error Handling
// ============================================

// Global error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
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
// Server Initialization
// ============================================

const PORT = process.env.PORT || 5000;
const baseUrl = getBaseUrl(PORT);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on ${baseUrl}`);
  console.log(`📡 Health check: ${baseUrl}/api/health`);
  console.log(`📘 Swagger docs: ${baseUrl}/api-docs`);
});

// ============================================
// Database Connection
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

  // Handle MongoDB connection events
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
