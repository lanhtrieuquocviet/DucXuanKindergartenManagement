const express = require('express');
const multer = require('multer');
const { authenticate, authorizeRoles, authorizePermissions, authorizeAnyPermission } = require('../middleware/auth');
const contactController = require('../controller/contactController');
const User = require('../models/User');
const Role = require('../models/Role');
const Teacher = require('../models/Teacher');
const Staff = require('../models/Staff');
const { listClassrooms, createClassroom, updateClassroom, deleteClassroom } = require('../controller/classroomController');
const assetCtrl = require('../controller/assetInspectionController');
const assetCrudCtrl = require('../controller/assetController');
const purchaseCtrl = require('../controller/purchaseRequestController');
const allocationCtrl  = require('../controller/assetAllocationController');
const incidentCtrl    = require('../controller/assetIncidentController');
const {
  getAttendanceOverview,
  getClassAttendanceDetail,
  getStudentAttendanceDetail,
  getStudentAttendanceHistory,
  getAttendanceExportData,
} = require('../controller/attendanceController');
const blogController = require('../controller/blogController');
const blogCategoryController = require('../controller/blogCategoryController');
const qaController = require('../controller/qaController');
const documentController = require('../controller/documentController');
const publicInfoController = require('../controller/publicInfoController');
const bannerController = require('../controller/bannerController');
const imageLibraryController = require('../controller/imageLibraryController');
const videoClipController = require('../controller/videoClipController');
const academicYearController = require('../controller/academicYearController');
const AcademicYear = require('../models/AcademicYear');
const curriculumController = require('../controller/curriculumController');
const academicPlanController = require('../controller/academicPlanController');
const academicEventController = require('../controller/academicEventController');
const timetableController = require('../controller/timetableController');

const router = express.Router();

// Multer configuration for PDF files
const pdfUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /^application\/pdf$/i.test(file.mimetype);
    if (allowed) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file PDF.'));
  },
});

// Middleware xử lý lỗi upload
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        status: 'error',
        message: 'File quá lớn (tối đa 10MB)',
      });
    }
    return res.status(400).json({
      status: 'error',
      message: `Lỗi upload: ${err.message}`,
    });
  }
  if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message || 'Lỗi upload file',
    });
  }
  next();
}

/**
 * @openapi
 * /api/school-admin/dashboard:
 *   get:
 *     summary: Dashboard SchoolAdmin
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin dashboard SchoolAdmin
 *       403:
 *         description: Không có quyền SchoolAdmin
 */
router.get('/dashboard', authenticate, authorizeRoles('SchoolAdmin'), (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Trang SchoolAdmin dashboard',
    data: { user: req.user },
  });
});

// ============================================
// Contacts
// ============================================

/**
 * @openapi
 * /api/school-admin/contacts:
 *   get:
 *     summary: Lấy danh sách liên hệ
 *     tags:
 *       - SchoolAdmin - Contacts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách liên hệ
 */
router.get('/contacts', authenticate, authorizePermissions('MANAGE_CONTACT'), contactController.listContacts);

/**
 * @openapi
 * /api/school-admin/contacts/{id}/reply:
 *   patch:
 *     summary: Phản hồi liên hệ
 *     tags:
 *       - SchoolAdmin - Contacts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID liên hệ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - replyContent
 *             properties:
 *               replyContent:
 *                 type: string
 *                 example: Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm.
 *     responses:
 *       200:
 *         description: Phản hồi thành công
 *       404:
 *         description: Không tìm thấy liên hệ
 */
router.patch('/contacts/:id/reply', authenticate, authorizePermissions('MANAGE_CONTACT'), contactController.validateReplyContact, contactController.replyContact);

/**
 * @openapi
 * /api/school-admin/contacts/{id}/clear-reply:
 *   patch:
 *     summary: Xóa nội dung phản hồi của liên hệ
 *     tags:
 *       - SchoolAdmin - Contacts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID liên hệ
 *     responses:
 *       200:
 *         description: Xóa phản hồi thành công
 */
router.patch('/contacts/:id/clear-reply', authenticate, authorizePermissions('MANAGE_CONTACT'), contactController.clearReplyContact);

/**
 * @openapi
 * /api/school-admin/contacts/{id}/resend-email:
 *   post:
 *     summary: Gửi lại email phản hồi
 *     tags:
 *       - SchoolAdmin - Contacts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID liên hệ
 *     responses:
 *       200:
 *         description: Gửi lại email thành công
 */
router.post('/contacts/:id/resend-email', authenticate, authorizePermissions('MANAGE_CONTACT'), contactController.resendReplyEmail);

// ============================================
// Homepage banners
// ============================================
router.get('/banners', authenticate, authorizePermissions('MANAGE_BANNER'), bannerController.getAdminHomepageBanners);
router.post('/banners', authenticate, authorizePermissions('MANAGE_BANNER'), bannerController.createAdminHomepageBanner);
router.put('/banners', authenticate, authorizePermissions('MANAGE_BANNER'), bannerController.updateAdminHomepageBanners);
router.patch('/banners/:bannerId', authenticate, authorizePermissions('MANAGE_BANNER'), bannerController.updateAdminHomepageBannerById);
router.delete('/banners/:bannerId', authenticate, authorizePermissions('MANAGE_BANNER'), bannerController.deleteAdminHomepageBannerById);

// ============================================
// Attendance
// ============================================

/**
 * @openapi
 * /api/school-admin/attendance/overview:
 *   get:
 *     summary: Tổng quan điểm danh tất cả các lớp
 *     tags:
 *       - SchoolAdmin - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày điểm danh (YYYY-MM-DD), mặc định hôm nay
 *     responses:
 *       200:
 *         description: Tổng quan điểm danh
 */
router.get('/attendance/overview', authenticate, authorizePermissions('VIEW_ATTENDANCE'), getAttendanceOverview);
router.get('/attendance/export-data', authenticate, authorizePermissions('VIEW_ATTENDANCE'), getAttendanceExportData);

/**
 * @openapi
 * /api/school-admin/classes/{classId}/attendance:
 *   get:
 *     summary: Chi tiết điểm danh của một lớp
 *     tags:
 *       - SchoolAdmin - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày điểm danh (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Chi tiết điểm danh lớp
 */
router.get('/classes/:classId/attendance', authenticate, authorizePermissions('VIEW_ATTENDANCE'), getClassAttendanceDetail);

/**
 * @openapi
 * /api/school-admin/students/{studentId}/attendance:
 *   get:
 *     summary: Chi tiết điểm danh của một học sinh
 *     tags:
 *       - SchoolAdmin - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết điểm danh học sinh
 */
router.get('/students/:studentId/attendance', authenticate, authorizePermissions('VIEW_ATTENDANCE'), getStudentAttendanceDetail);

/**
 * @openapi
 * /api/school-admin/students/{studentId}/attendance/history:
 *   get:
 *     summary: Lịch sử điểm danh của một học sinh
 *     tags:
 *       - SchoolAdmin - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           example: "2024-09"
 *         description: Tháng cần xem (YYYY-MM)
 *     responses:
 *       200:
 *         description: Lịch sử điểm danh
 */
router.get('/students/:studentId/attendance/history', authenticate, authorizePermissions('VIEW_ATTENDANCE'), getStudentAttendanceHistory);

// ── Student Change Requests (School Admin) ────────────────────
// GET /school-admin/students/change-requests — danh sách tất cả yêu cầu
router.get('/students/change-requests', authenticate, authorizePermissions('MANAGE_STUDENT'), async (req, res) => {
  try {
    const StudentChangeRequest = require('../models/StudentChangeRequest');
    const { status } = req.query; // 'pending' | 'resolved' | undefined (all)
    const filter = {};
    if (status) filter.status = status;

    const requests = await StudentChangeRequest.find(filter)
      .populate('studentId', 'fullName classId avatar')
      .populate({ path: 'studentId', populate: { path: 'classId', select: 'className' } })
      .populate('teacherId', 'userId')
      .populate({ path: 'teacherId', populate: { path: 'userId', select: 'fullName' } })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ status: 'success', data: requests });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /school-admin/students/change-requests/pending-map — map studentId -> pending count
router.get('/students/change-requests/pending-map', authenticate, authorizePermissions('MANAGE_STUDENT'), async (req, res) => {
  try {
    const StudentChangeRequest = require('../models/StudentChangeRequest');
    const counts = await StudentChangeRequest.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: '$studentId', count: { $sum: 1 } } },
    ]);
    const map = {};
    counts.forEach(c => { map[c._id.toString()] = c.count; });
    return res.json({ status: 'success', data: map });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// PATCH /school-admin/students/change-requests/:id/resolve — giải quyết yêu cầu
router.patch('/students/change-requests/:id/resolve', authenticate, authorizePermissions('MANAGE_STUDENT'), async (req, res) => {
  try {
    const StudentChangeRequest = require('../models/StudentChangeRequest');
    const req_ = await StudentChangeRequest.findById(req.params.id);
    if (!req_) return res.status(404).json({ status: 'error', message: 'Không tìm thấy yêu cầu.' });
    req_.status = 'resolved';
    req_.resolvedAt = new Date();
    req_.resolvedBy = req.user._id;
    await req_.save();
    return res.json({ status: 'success', data: req_ });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── Health classes — lớp thuộc năm học hiện tại ──────────────
// GET /school-admin/students/health-classes
router.get('/students/health-classes', authenticate, authorizeAnyPermission('MANAGE_STUDENT', 'MANAGE_HEALTH'), async (req, res) => {
  try {
    const AcademicYear = require('../models/AcademicYear');
    const Classes      = require('../models/Classes');

    const activeYear = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1 }).lean();
    if (!activeYear) return res.json({ status: 'success', data: [] });

    const classes = await Classes.find({ academicYearId: activeYear._id })
      .select('className capacity')
      .sort({ className: 1 })
      .lean();

    return res.json({ status: 'success', data: classes, academicYear: activeYear.yearName });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── Health overview (báo cáo sức khỏe tổng quan) ──────────────
// GET /school-admin/students/health-overview
router.get('/students/health-overview', authenticate, authorizeAnyPermission('MANAGE_STUDENT', 'MANAGE_HEALTH'), async (req, res) => {
  try {
    const Student      = require('../models/Student');
    const HealthCheck  = require('../models/HealthCheck');
    const AcademicYear = require('../models/AcademicYear');

    // Lấy năm học hiện tại
    const activeYear = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1 }).lean();
    if (!activeYear) return res.json({ status: 'success', data: [] });

    const { classId } = req.query;
    const studentFilter = { status: 'active', academicYearId: activeYear._id };
    if (classId) studentFilter.classId = classId;

    const students = await Student.find(studentFilter)
      .populate('classId', 'className')
      .sort({ fullName: 1 })
      .lean();

    const studentIds = students.map(s => s._id);

    // Lấy bản ghi sức khỏe mới nhất của mỗi học sinh
    const healthRecords = await HealthCheck.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $sort: { studentId: 1, checkDate: -1 } },
      { $group: { _id: '$studentId', doc: { $first: '$$ROOT' } } },
    ]);
    const healthMap = {};
    healthRecords.forEach(r => { healthMap[r._id.toString()] = r.doc; });

    const data = students.map(s => {
      const h = healthMap[s._id.toString()] || null;
      return {
        _id: s._id,
        fullName: s.fullName,
        dateOfBirth: s.dateOfBirth,
        gender: s.gender,
        className: s.classId?.className || '—',
        classId: s.classId?._id || null,
        height: h?.height || null,
        weight: h?.weight || null,
        bmi: (h?.height && h?.weight) ? +(h.weight / ((h.height / 100) ** 2)).toFixed(1) : null,
        chronicDiseases: h?.chronicDiseases || [],
        allergies: (h?.allergies || []).map(a => a.allergen || a).filter(Boolean),
        generalStatus: h?.generalStatus || null,
        checkDate: h?.checkDate || null,
        healthId: h?._id || null,
      };
    });

    return res.json({ status: 'success', data });
  } catch (err) {
    console.error('health-overview error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /school-admin/students/health-record — tạo/cập nhật hồ sơ sức khỏe cho 1 học sinh
router.post('/students/health-record', authenticate, authorizeAnyPermission('MANAGE_STUDENT', 'MANAGE_HEALTH'), async (req, res) => {
  try {
    const HealthCheck = require('../models/HealthCheck');
    const Student     = require('../models/Student');
    const { studentId, height, weight, temperature, heartRate, chronicDiseases, allergies, notes, generalStatus, checkDate, followUpDate, recommendations } = req.body;

    if (!studentId) return res.status(400).json({ status: 'error', message: 'Thiếu studentId' });
    const student = await Student.findById(studentId).lean();
    if (!student) return res.status(404).json({ status: 'error', message: 'Không tìm thấy học sinh' });

    const allergiesArr = Array.isArray(allergies)
      ? allergies
      : (allergies || '').split(',').map(a => a.trim()).filter(Boolean).map(a => ({ allergen: a }));
    const chronicArr = Array.isArray(chronicDiseases)
      ? chronicDiseases
      : (chronicDiseases || '').split(',').map(d => d.trim()).filter(Boolean);

    const record = await HealthCheck.create({
      studentId,
      height:          height ? Number(height) : undefined,
      weight:          weight ? Number(weight) : undefined,
      temperature:     temperature ? Number(temperature) : undefined,
      heartRate:       heartRate ? Number(heartRate) : undefined,
      chronicDiseases: chronicArr,
      allergies:       allergiesArr,
      notes:           notes || '',
      generalStatus:   generalStatus || 'healthy',
      checkDate:       checkDate ? new Date(checkDate) : new Date(),
      followUpDate:    followUpDate ? new Date(followUpDate) : undefined,
      recommendations: recommendations || '',
      recordedBy:      req.user._id,
    });

    return res.status(201).json({ status: 'success', message: 'Tạo hồ sơ sức khỏe thành công', data: record });
  } catch (err) {
    console.error('health-record create error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// PUT /school-admin/students/health-record/:id — cập nhật hồ sơ sức khỏe
router.put('/students/health-record/:id', authenticate, authorizeAnyPermission('MANAGE_STUDENT', 'MANAGE_HEALTH'), async (req, res) => {
  try {
    const HealthCheck = require('../models/HealthCheck');
    const record = await HealthCheck.findById(req.params.id);
    if (!record) return res.status(404).json({ status: 'error', message: 'Không tìm thấy hồ sơ sức khỏe' });

    const { height, weight, temperature, heartRate, chronicDiseases, allergies, notes, generalStatus, checkDate, followUpDate, recommendations } = req.body;

    const allergiesArr = Array.isArray(allergies)
      ? allergies
      : (allergies || '').split(',').map(a => a.trim()).filter(Boolean).map(a => ({ allergen: a }));
    const chronicArr = Array.isArray(chronicDiseases)
      ? chronicDiseases
      : (chronicDiseases || '').split(',').map(d => d.trim()).filter(Boolean);

    if (height !== undefined)      record.height          = height ? Number(height) : undefined;
    if (weight !== undefined)      record.weight          = weight ? Number(weight) : undefined;
    if (temperature !== undefined) record.temperature     = temperature ? Number(temperature) : undefined;
    if (heartRate !== undefined)   record.heartRate       = heartRate ? Number(heartRate) : undefined;
    record.chronicDiseases = chronicArr;
    record.allergies       = allergiesArr;
    if (notes !== undefined)           record.notes           = notes;
    if (generalStatus !== undefined)   record.generalStatus   = generalStatus;
    if (checkDate !== undefined)       record.checkDate       = checkDate ? new Date(checkDate) : record.checkDate;
    if (followUpDate !== undefined)    record.followUpDate    = followUpDate ? new Date(followUpDate) : undefined;
    if (recommendations !== undefined) record.recommendations = recommendations;

    await record.save();
    return res.json({ status: 'success', message: 'Cập nhật hồ sơ thành công', data: record });
  } catch (err) {
    console.error('health-record update error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// DELETE /school-admin/students/health-record/:id — xóa hồ sơ sức khỏe
router.delete('/students/health-record/:id', authenticate, authorizeAnyPermission('MANAGE_STUDENT', 'MANAGE_HEALTH'), async (req, res) => {
  try {
    const HealthCheck = require('../models/HealthCheck');
    const record = await HealthCheck.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ status: 'error', message: 'Không tìm thấy hồ sơ sức khỏe' });
    return res.json({ status: 'success', message: 'Đã xóa hồ sơ sức khỏe' });
  } catch (err) {
    console.error('health-record delete error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /school-admin/students/health-import — import từ Excel (nhận mảng rows đã parse)
router.post('/students/health-import', authenticate, authorizeAnyPermission('MANAGE_STUDENT', 'MANAGE_HEALTH'), async (req, res) => {
  try {
    const Student     = require('../models/Student');
    const HealthCheck = require('../models/HealthCheck');
    const { rows } = req.body; // [{ fullName, className, height, weight, chronicDiseases, allergies, notes }]
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Không có dữ liệu để import' });
    }

    let created = 0, updated = 0, skipped = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row number (header = 1)
      const name = (row.fullName || '').trim();
      if (!name) { skipped++; continue; }

      // Tìm học sinh theo tên (có thể lọc thêm theo className)
      const query = { fullName: name, status: 'active' };
      let student;
      if (row.className) {
        const Classes = require('../models/Classes');
        const cls = await Classes.findOne({ className: row.className.trim() }).lean();
        if (cls) query.classId = cls._id;
      }
      const matches = await Student.find(query).lean();
      if (matches.length === 0) { errors.push(`Hàng ${rowNum}: Không tìm thấy học sinh "${name}"`); skipped++; continue; }
      if (matches.length > 1)   { errors.push(`Hàng ${rowNum}: Có nhiều học sinh tên "${name}", cần chỉ định lớp`); skipped++; continue; }
      student = matches[0];

      // Parse allergies: "Tôm, Sữa" → [{allergen:'Tôm'}, {allergen:'Sữa'}]
      const allergies = (row.allergies || '').split(',').map(a => a.trim()).filter(Boolean).map(a => ({ allergen: a }));
      // Parse chronicDiseases: "hen suyễn, tiểu đường"
      const chronicDiseases = (row.chronicDiseases || '').split(',').map(d => d.trim()).filter(Boolean);

      const payload = {
        studentId: student._id,
        height: row.height ? Number(row.height) : undefined,
        weight: row.weight ? Number(row.weight) : undefined,
        allergies,
        chronicDiseases,
        notes: row.notes || '',
        generalStatus: 'healthy',
        recordedBy: req.user._id,
        checkDate: new Date(),
      };

      // Upsert: tạo record mới (giữ lịch sử)
      await HealthCheck.create(payload);
      created++;
    }

    return res.json({ status: 'success', message: `Import xong: ${created} tạo mới, ${skipped} bỏ qua`, created, skipped, errors });
  } catch (err) {
    console.error('health-import error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ============================================
// Blogs
// ============================================

/**
 * @openapi
 * /api/school-admin/blogs:
 *   get:
 *     summary: Lấy danh sách tất cả bài viết (SchoolAdmin)
 *     tags:
 *       - SchoolAdmin - Blogs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách bài viết
 *   post:
 *     summary: Tạo bài viết mới
 *     tags:
 *       - SchoolAdmin - Blogs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: Thông báo khai giảng năm học 2024-2025
 *               content:
 *                 type: string
 *                 example: Nội dung bài viết...
 *               category:
 *                 type: string
 *                 example: 664abc123def456789012345
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *                 example: published
 *               thumbnail:
 *                 type: string
 *                 example: https://res.cloudinary.com/...
 *     responses:
 *       201:
 *         description: Tạo bài viết thành công
 */
router.get('/blogs', authenticate, authorizePermissions('MANAGE_BLOG'), blogController.listBlogs);
router.post('/blogs', authenticate, authorizePermissions('MANAGE_BLOG'), blogController.createBlog);

/**
 * @openapi
 * /api/school-admin/blogs/{id}:
 *   get:
 *     summary: Lấy chi tiết bài viết
 *     tags:
 *       - SchoolAdmin - Blogs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết bài viết
 *       404:
 *         description: Không tìm thấy bài viết
 *   put:
 *     summary: Cập nhật bài viết
 *     tags:
 *       - SchoolAdmin - Blogs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa bài viết
 *     tags:
 *       - SchoolAdmin - Blogs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.get('/blogs/:id', authenticate, authorizePermissions('MANAGE_BLOG'), blogController.getBlog);
router.put('/blogs/:id', authenticate, authorizePermissions('MANAGE_BLOG'), blogController.updateBlog);
router.delete('/blogs/:id', authenticate, authorizePermissions('MANAGE_BLOG'), blogController.deleteBlog);

// ============================================
// Blog Categories
// ============================================

/**
 * @openapi
 * /api/school-admin/blog-categories:
 *   get:
 *     summary: Lấy danh sách danh mục blog
 *     tags:
 *       - SchoolAdmin - Blog Categories
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 *       403:
 *         description: Thiếu permission MANAGE_BLOG_CATEGORY
 *   post:
 *     summary: Tạo danh mục blog mới
 *     tags:
 *       - SchoolAdmin - Blog Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Hoạt động ngoại khóa
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.get('/blog-categories', authenticate, authorizePermissions('MANAGE_BLOG_CATEGORY'), blogCategoryController.listBlogCategories);
router.post('/blog-categories', authenticate, authorizePermissions('MANAGE_BLOG_CATEGORY'), blogCategoryController.createBlogCategory);

/**
 * @openapi
 * /api/school-admin/blog-categories/{id}:
 *   put:
 *     summary: Cập nhật danh mục blog
 *     tags:
 *       - SchoolAdmin - Blog Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa danh mục blog
 *     tags:
 *       - SchoolAdmin - Blog Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.put('/blog-categories/:id', authenticate, authorizePermissions('MANAGE_BLOG_CATEGORY'), blogCategoryController.updateBlogCategory);
router.delete('/blog-categories/:id', authenticate, authorizePermissions('MANAGE_BLOG_CATEGORY'), blogCategoryController.deleteBlogCategory);

// ============================================
// Q&A
// ============================================

/**
 * @openapi
 * /api/school-admin/qa/questions:
 *   get:
 *     summary: Lấy danh sách câu hỏi Q&A
 *     tags:
 *       - SchoolAdmin - Q&A
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách câu hỏi
 */
router.get('/qa/questions', authenticate, authorizePermissions('MANAGE_QA'), qaController.getQuestions);

/**
 * @openapi
 * /api/school-admin/qa/questions/{id}:
 *   patch:
 *     summary: Cập nhật câu hỏi Q&A
 *     tags:
 *       - SchoolAdmin - Q&A
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, answered]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa câu hỏi Q&A
 *     tags:
 *       - SchoolAdmin - Q&A
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.patch('/qa/questions/:id', authenticate, authorizePermissions('MANAGE_QA'), qaController.validateQuestionId, qaController.validateCreateQuestion, qaController.updateQuestion);
router.delete('/qa/questions/:id', authenticate, authorizePermissions('MANAGE_QA'), qaController.validateQuestionId, qaController.deleteQuestion);

/**
 * @openapi
 * /api/school-admin/qa/questions/{id}/answers:
 *   post:
 *     summary: Thêm câu trả lời cho câu hỏi
 *     tags:
 *       - SchoolAdmin - Q&A
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answer
 *             properties:
 *               answer:
 *                 type: string
 *                 example: Trường mầm non mở cửa từ 7h sáng đến 5h chiều.
 *     responses:
 *       201:
 *         description: Thêm câu trả lời thành công
 */
router.post('/qa/questions/:id/answers', authenticate, authorizePermissions('MANAGE_QA'), qaController.validateCreateAnswer, qaController.createAnswer);

/**
 * @openapi
 * /api/school-admin/qa/questions/{id}/answers/{answerIndex}:
 *   patch:
 *     summary: Cập nhật câu trả lời
 *     tags:
 *       - SchoolAdmin - Q&A
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: answerIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vị trí câu trả lời trong mảng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch('/qa/questions/:id/answers/:answerIndex', authenticate, authorizePermissions('MANAGE_QA'), qaController.validateUpdateAnswer, qaController.updateAnswer);

// ============================================
// Documents
// ============================================

/**
 * @openapi
 * /api/school-admin/documents:
 *   get:
 *     summary: Lấy danh sách tài liệu (SchoolAdmin)
 *     tags:
 *       - SchoolAdmin - Documents
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tài liệu
 *   post:
 *     summary: Tạo tài liệu mới
 *     tags:
 *       - SchoolAdmin - Documents
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - fileUrl
 *             properties:
 *               title:
 *                 type: string
 *                 example: Quy chế trường học 2024
 *               fileUrl:
 *                 type: string
 *                 example: https://res.cloudinary.com/.../document.pdf
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *     responses:
 *       201:
 *         description: Tạo tài liệu thành công
 */
router.get('/documents', authenticate, authorizePermissions('MANAGE_DOCUMENT'), documentController.listDocuments);
router.post('/documents', authenticate, authorizePermissions('MANAGE_DOCUMENT'), documentController.createDocument);
router.get('/image-library', authenticate, authorizePermissions('MANAGE_IMAGE_LIBRARY'), imageLibraryController.listAdminImageLibrary);
router.post('/image-library', authenticate, authorizePermissions('MANAGE_IMAGE_LIBRARY'), imageLibraryController.createImageLibraryItem);
router.delete('/image-library/:id', authenticate, authorizePermissions('MANAGE_IMAGE_LIBRARY'), imageLibraryController.deleteImageLibraryItem);
router.get('/video-library', authenticate, authorizePermissions('MANAGE_IMAGE_LIBRARY'), videoClipController.listAdminVideoClips);
router.post('/video-library', authenticate, authorizePermissions('MANAGE_IMAGE_LIBRARY'), videoClipController.createVideoClipItem);
router.delete('/video-library/:id', authenticate, authorizePermissions('MANAGE_IMAGE_LIBRARY'), videoClipController.deleteVideoClipItem);

/**
 * @openapi
 * /api/school-admin/documents/{id}:
 *   get:
 *     summary: Lấy chi tiết tài liệu
 *     tags:
 *       - SchoolAdmin - Documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết tài liệu
 *   put:
 *     summary: Cập nhật tài liệu
 *     tags:
 *       - SchoolAdmin - Documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa tài liệu
 *     tags:
 *       - SchoolAdmin - Documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.get('/documents/:id', authenticate, authorizePermissions('MANAGE_DOCUMENT'), documentController.getDocument);
router.put('/documents/:id', authenticate, authorizePermissions('MANAGE_DOCUMENT'), documentController.updateDocument);
router.delete('/documents/:id', authenticate, authorizePermissions('MANAGE_DOCUMENT'), documentController.deleteDocument);

// ============================================
// Public Info
// ============================================

/**
 * @openapi
 * /api/school-admin/public-info:
 *   get:
 *     summary: Lấy danh sách thông tin công khai (SchoolAdmin)
 *     tags:
 *       - SchoolAdmin - Public Info
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thông tin
 *   post:
 *     summary: Tạo thông tin công khai mới
 *     tags:
 *       - SchoolAdmin - Public Info
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.get('/public-info', authenticate, authorizePermissions('MANAGE_PUBLIC_INFO'), publicInfoController.listPublicInfos);
router.post('/public-info', authenticate, authorizePermissions('MANAGE_PUBLIC_INFO'), publicInfoController.createPublicInfo);

/**
 * @openapi
 * /api/school-admin/public-info/{id}:
 *   get:
 *     summary: Lấy chi tiết thông tin công khai
 *     tags:
 *       - SchoolAdmin - Public Info
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết thông tin
 *   put:
 *     summary: Cập nhật thông tin công khai
 *     tags:
 *       - SchoolAdmin - Public Info
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa thông tin công khai
 *     tags:
 *       - SchoolAdmin - Public Info
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.get('/public-info/:id', authenticate, authorizePermissions('MANAGE_PUBLIC_INFO'), publicInfoController.getPublicInfo);
router.put('/public-info/:id', authenticate, authorizePermissions('MANAGE_PUBLIC_INFO'), publicInfoController.updatePublicInfo);
router.delete('/public-info/:id', authenticate, authorizePermissions('MANAGE_PUBLIC_INFO'), publicInfoController.deletePublicInfo);

// ============================================
// Academic Years
// ============================================

/**
 * @openapi
 * /api/school-admin/academic-years/current:
 *   get:
 *     summary: Lấy năm học hiện tại đang hoạt động
 *     tags:
 *       - SchoolAdmin - Academic Years
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Năm học hiện tại
 */
router.get('/academic-years/current', authenticate, authorizePermissions('MANAGE_ACADEMIC_YEAR'), academicYearController.getCurrentAcademicYear);

router.patch(
  '/academic-years/current/timetable-season',
  authenticate,
  authorizePermissions('MANAGE_CURRICULUM'),
  academicYearController.patchCurrentTimetableSeason,
);

/**
 * @openapi
 * /api/school-admin/academic-years/history:
 *   get:
 *     summary: Lấy lịch sử các năm học
 *     tags:
 *       - SchoolAdmin - Academic Years
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách năm học đã kết thúc
 */
router.get('/academic-years/history', authenticate, authorizePermissions('MANAGE_ACADEMIC_YEAR'), academicYearController.getAcademicYearHistory);

/**
 * @openapi
 * /api/school-admin/academic-years:
 *   get:
 *     summary: Lấy danh sách năm học
 *     tags:
 *       - SchoolAdmin - Academic Years
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách năm học
 *   post:
 *     summary: Tạo năm học mới
 *     tags:
 *       - SchoolAdmin - Academic Years
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Năm học 2024-2025
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-09-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-05-31"
 *     responses:
 *       201:
 *         description: Tạo năm học thành công
 */
router.get('/academic-years', authenticate, authorizePermissions('MANAGE_ACADEMIC_YEAR'), academicYearController.listAcademicYears);
router.post('/academic-years', authenticate, authorizePermissions('MANAGE_ACADEMIC_YEAR'), academicYearController.createAcademicYear);

/**
 * @openapi
 * /api/school-admin/academic-years/{id}/finish:
 *   patch:
 *     summary: Kết thúc năm học
 *     tags:
 *       - SchoolAdmin - Academic Years
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID năm học
 *     responses:
 *       200:
 *         description: Kết thúc năm học thành công
 */
router.patch('/academic-years/:id/finish', authenticate, authorizePermissions('MANAGE_ACADEMIC_YEAR'), academicYearController.finishAcademicYear);

/**
 * @openapi
 * /api/school-admin/academic-years/{yearId}/classes:
 *   get:
 *     summary: Lấy danh sách lớp theo năm học
 *     tags:
 *       - SchoolAdmin - Academic Years
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: yearId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID năm học
 *     responses:
 *       200:
 *         description: Danh sách lớp của năm học
 */
router.get('/academic-years/:yearId/classes', authenticate, authorizePermissions('MANAGE_ACADEMIC_YEAR'), academicYearController.getClassesByAcademicYear);

// ============================================
// Academic Plan
// ============================================
router.get('/academic-plan/topics', authenticate, authorizePermissions('MANAGE_CURRICULUM'), academicPlanController.listTopics);
router.post('/academic-plan/topics', authenticate, authorizePermissions('MANAGE_CURRICULUM'), academicPlanController.createTopic);
router.patch('/academic-plan/topics/:id', authenticate, authorizePermissions('MANAGE_CURRICULUM'), academicPlanController.updateTopic);
router.delete('/academic-plan/topics/:id', authenticate, authorizePermissions('MANAGE_CURRICULUM'), academicPlanController.deleteTopic);
router.get('/academic-events', authenticate, authorizePermissions('MANAGE_CURRICULUM'), academicEventController.getEventPlan);
router.put('/academic-events', authenticate, authorizePermissions('MANAGE_CURRICULUM'), academicEventController.upsertEventPlan);

// ============================================
// Curriculum
// ============================================

/**
 * @openapi
 * /api/school-admin/curriculum:
 *   get:
 *     summary: Lấy danh sách chủ đề chương trình giáo dục
 *     tags:
 *       - SchoolAdmin - Curriculum
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: yearId
 *         schema:
 *           type: string
 *         description: ID năm học (tùy chọn)
 *     responses:
 *       200:
 *         description: Danh sách chủ đề
 *   post:
 *     summary: Tạo chủ đề chương trình mới
 *     tags:
 *       - SchoolAdmin - Curriculum
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - yearId
 *             properties:
 *               title:
 *                 type: string
 *                 example: Chủ đề mùa thu
 *               yearId:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.get('/curriculum', authenticate, authorizePermissions('MANAGE_CURRICULUM'), curriculumController.listCurriculumTopics);
router.post('/curriculum', authenticate, authorizePermissions('MANAGE_CURRICULUM'), curriculumController.createCurriculumTopic);

/**
 * @openapi
 * /api/school-admin/curriculum/{id}:
 *   patch:
 *     summary: Cập nhật chủ đề chương trình
 *     tags:
 *       - SchoolAdmin - Curriculum
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa chủ đề chương trình
 *     tags:
 *       - SchoolAdmin - Curriculum
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.patch('/curriculum/:id', authenticate, authorizePermissions('MANAGE_CURRICULUM'), curriculumController.updateCurriculumTopic);
router.delete('/curriculum/:id', authenticate, authorizePermissions('MANAGE_CURRICULUM'), curriculumController.deleteCurriculumTopic);

// ============================================
// Timetable
// ============================================

/**
 * @openapi
 * /api/school-admin/timetable:
 *   get:
 *     summary: Lấy thời khóa biểu theo năm học / khối (SchoolAdmin)
 *     tags:
 *       - SchoolAdmin - Timetable
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: yearId
 *         schema:
 *           type: string
 *         description: ID năm học
 *     responses:
 *       200:
 *         description: Thời khóa biểu
 *   put:
 *     summary: Tạo hoặc cập nhật thời khóa biểu (upsert)
 *     tags:
 *       - SchoolAdmin - Timetable
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - yearId
 *               - gradeId
 *               - schedule
 *             properties:
 *               yearId:
 *                 type: string
 *               gradeId:
 *                 type: string
 *               schedule:
 *                 type: array
 *                 description: Danh sách tiết học theo ngày
 *     responses:
 *       200:
 *         description: Lưu thời khóa biểu thành công
 */
router.get('/timetable', authenticate, authorizePermissions('MANAGE_CURRICULUM'), timetableController.listByYear);
router.put('/timetable', authenticate, authorizePermissions('MANAGE_CURRICULUM'), timetableController.upsert);
router.delete('/timetable/:id', authenticate, authorizePermissions('MANAGE_CURRICULUM'), timetableController.remove);

// ============================================
// Teachers
// ============================================

/**
 * @openapi
 * /api/school-admin/teachers:
 *   get:
 *     summary: Lấy danh sách giáo viên (dùng cho form tạo/cập nhật lớp)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách giáo viên đang active
 */
// GET /school-admin/teachers/check-username?username=...
router.get('/teachers/check-username', authenticate, authorizePermissions('MANAGE_TEACHER'), async (req, res) => {
  try {
    const { username } = req.query;
    if (!username?.trim()) return res.status(400).json({ status: 'error', message: 'Thiếu tham số username' });
    const existing = await User.findOne({ username: username.trim() }).lean();
    return res.status(200).json({ status: 'success', available: !existing });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /school-admin/teachers/availability?className=...&excludeClassId=...
// Trả về trạng thái từng giáo viên theo nghiệp vụ phân công lớp
router.get('/teachers/availability', authenticate, authorizePermissions('MANAGE_TEACHER'), async (req, res) => {
  try {
    const { className, excludeClassId } = req.query;
    const Classes = require('../models/Classes');

    // Lấy năm học hiện tại
    const activeYear = await AcademicYear.findOne({ status: 'active' }).lean();

    // Lấy tất cả Teacher active
    const teacherDocs = await Teacher.find({ status: 'active' })
      .populate('userId', 'fullName email status')
      .lean();

    const result = await Promise.all(
      teacherDocs
        .filter(t => t.userId && t.userId.status === 'active')
        .map(async (t) => {
          // Rule 2: đã phụ trách lớp khác trong năm này chưa?
          let inCurrentYear = false;
          if (activeYear) {
            const q = { academicYearId: activeYear._id, teacherIds: t._id };
            if (excludeClassId) q._id = { $ne: excludeClassId };
            const existing = await Classes.findOne(q).select('className').lean();
            if (existing) inCurrentYear = existing.className;
          }

          // Rule 3: đã dạy className này bao nhiêu năm?
          let yearsInClass = 0;
          if (className?.trim()) {
            const q = { className: className.trim(), teacherIds: t._id };
            if (excludeClassId) q._id = { $ne: excludeClassId };
            yearsInClass = await Classes.countDocuments(q);
          }

          return {
            _id: t._id,
            fullName: t.userId.fullName,
            email: t.userId.email,
            degree: t.degree,
            experienceYears: t.experienceYears,
            inCurrentYear,   // false | tên lớp đang phụ trách
            yearsInClass,    // 0 | 1 | 2
            maxYearsReached: yearsInClass >= 2,
          };
        })
    );

    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('teacherAvailability error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi kiểm tra giáo viên' });
  }
});

router.get('/teachers', authenticate, authorizePermissions('MANAGE_TEACHER'), async (req, res) => {
  try {
    const teacherRole = await Role.findOne({ roleName: 'Teacher' }).lean();

    // Đồng bộ: tạo Teacher record cho TẤT CẢ User có role Teacher (kể cả inactive)
    if (teacherRole) {
      const teacherUsers = await User.find({ roles: teacherRole._id }).lean();
      for (const u of teacherUsers) {
        const exists = await Teacher.findOne({ userId: u._id }).lean();
        if (!exists) await Teacher.create({ userId: u._id, status: u.status === 'active' ? 'active' : 'inactive' });
      }
    }

    const teacherDocs = await Teacher.find()
      .populate('userId', 'fullName email phone avatar status')
      .sort({ createdAt: 1 })
      .lean();

    const teachers = teacherDocs
      .filter(t => t.userId)
      .map(t => ({
        _id: t._id,
        fullName: t.userId.fullName,
        email: t.userId.email,
        phone: t.userId.phone,
        avatar: t.userId.avatar,
        status: t.userId.status,
        degree: t.degree,
        experienceYears: t.experienceYears,
        hireDate: t.hireDate,
        employmentType: t.employmentType,
        gender: t.gender,
        isLeader: t.isLeader,
      }));

    return res.status(200).json({ status: 'success', data: teachers });
  } catch (error) {
    console.error('listTeachers error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách giáo viên' });
  }
});

// GET /school-admin/teachers/generate-username — sinh username tự động
router.get('/teachers/generate-username', authenticate, authorizePermissions('MANAGE_TEACHER'), async (req, res) => {
  try {
    const VALID_PREFIXES = ['HE', 'SE'];
    const prefix = req.query.prefix
      ? req.query.prefix.toUpperCase()
      : VALID_PREFIXES[Math.floor(Math.random() * VALID_PREFIXES.length)];
    if (!VALID_PREFIXES.includes(prefix)) {
      return res.status(400).json({ status: 'error', message: 'Prefix không hợp lệ. Chọn HE, SE hoặc HS' });
    }
    const yearSuffix = String(new Date().getFullYear()).slice(-2); // "26"
    let username = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      const rand = Math.floor(Math.random() * 1000) + 1; // 1–1000
      const candidate = `${prefix}${yearSuffix}${String(rand).padStart(4, '0')}`;
      const exists = await User.findOne({ username: candidate }).lean();
      if (!exists) { username = candidate; break; }
    }
    if (!username) {
      return res.status(409).json({ status: 'error', message: 'Không thể tạo username duy nhất, vui lòng thử lại' });
    }
    return res.json({ status: 'success', username });
  } catch (error) {
    console.error('generateUsername error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi sinh username', error: error.message });
  }
});

// POST /school-admin/teachers — tạo giáo viên mới (User + Teacher record)
router.post('/teachers', authenticate, authorizePermissions('MANAGE_TEACHER'), async (req, res) => {
  try {
    const { username, fullName, email, phone, password, degree, experienceYears, hireDate, avatar, employmentType, gender } = req.body;
    if (!username?.trim()) return res.status(400).json({ status: 'error', message: 'Tài khoản đăng nhập không được để trống' });
    if (!fullName?.trim()) return res.status(400).json({ status: 'error', message: 'Họ tên không được để trống' });
    if (!email?.trim()) return res.status(400).json({ status: 'error', message: 'Email không được để trống' });
    if (!password || password.length < 6) return res.status(400).json({ status: 'error', message: 'Mật khẩu tối thiểu 6 ký tự' });

    const existingUser = await User.findOne({
      $or: [{ username: username.trim() }, { email: email.trim().toLowerCase() }],
    }).lean();
    if (existingUser) {
      if (existingUser.username === username.trim())
        return res.status(400).json({ status: 'error', message: 'Tài khoản đăng nhập đã tồn tại trong hệ thống' });
      return res.status(400).json({ status: 'error', message: 'Email đã được sử dụng' });
    }

    const teacherRole = await Role.findOne({ roleName: 'Teacher' }).lean();
    if (!teacherRole) return res.status(500).json({ status: 'error', message: 'Không tìm thấy role Teacher trong hệ thống' });

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      username: username.trim(),
      passwordHash,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      avatar: avatar || '',
      roles: [teacherRole._id],
      status: 'active',
    });

    const teacher = await Teacher.create({
      userId: user._id,
      degree: degree?.trim() || '',
      experienceYears: Number(experienceYears) || 0,
      hireDate: hireDate || null,
      employmentType: ['contract', 'permanent'].includes(employmentType) ? employmentType : 'contract',
      gender: ['male', 'female'].includes(gender) ? gender : 'male',
      status: 'active',
    });

    await teacher.populate('userId', 'fullName email phone avatar');
    return res.status(201).json({
      status: 'success',
      message: 'Tạo giáo viên thành công',
      data: {
        _id: teacher._id,
        fullName: teacher.userId.fullName,
        email: teacher.userId.email,
        phone: teacher.userId.phone,
        avatar: teacher.userId.avatar,
        degree: teacher.degree,
        experienceYears: teacher.experienceYears,
        hireDate: teacher.hireDate,
        employmentType: teacher.employmentType,
        gender: teacher.gender,
      },
    });
  } catch (error) {
    console.error('createTeacher error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi tạo giáo viên', error: error.message });
  }
});

// PUT /school-admin/teachers/:id — cập nhật giáo viên
router.put('/teachers/:id', authenticate, authorizePermissions('MANAGE_TEACHER'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).lean();
    if (!teacher) return res.status(404).json({ status: 'error', message: 'Không tìm thấy giáo viên' });

    const { fullName, email, phone, degree, experienceYears, hireDate, avatar, status, employmentType, gender } = req.body;

    // Cập nhật User
    const userUpdate = {};
    if (fullName?.trim()) userUpdate.fullName = fullName.trim();
    if (phone !== undefined) userUpdate.phone = phone?.trim() || '';
    if (avatar !== undefined) userUpdate.avatar = avatar;
    if (email?.trim()) {
      const currentUser = await User.findById(teacher.userId).select('email').lean();
      if (email.trim().toLowerCase() !== currentUser?.email) {
        const dup = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: teacher.userId } }).lean();
        if (dup) return res.status(400).json({ status: 'error', message: 'Email đã được sử dụng' });
        userUpdate.email = email.trim().toLowerCase();
      }
    }
    if (status && ['active', 'inactive'].includes(status)) {
      userUpdate.status = status;
    }
    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(teacher.userId, userUpdate);
    }

    // Cập nhật Teacher
    const teacherUpdate = {};
    if (degree !== undefined) teacherUpdate.degree = degree?.trim() || '';
    if (experienceYears !== undefined) teacherUpdate.experienceYears = Number(experienceYears) || 0;
    if (hireDate !== undefined) teacherUpdate.hireDate = hireDate || null;
    if (status && ['active', 'inactive'].includes(status)) teacherUpdate.status = status;
    if (employmentType && ['contract', 'permanent'].includes(employmentType)) teacherUpdate.employmentType = employmentType;
    if (gender && ['male', 'female'].includes(gender)) teacherUpdate.gender = gender;
    await Teacher.findByIdAndUpdate(teacher._id, teacherUpdate);

    const updated = await Teacher.findById(teacher._id)
      .populate('userId', 'fullName email phone avatar status')
      .lean();

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật giáo viên thành công',
      data: {
        _id: updated._id,
        fullName: updated.userId.fullName,
        email: updated.userId.email,
        phone: updated.userId.phone,
        avatar: updated.userId.avatar,
        status: updated.userId.status,
        degree: updated.degree,
        experienceYears: updated.experienceYears,
        hireDate: updated.hireDate,
        employmentType: updated.employmentType,
        gender: updated.gender,
      },
    });
  } catch (error) {
    console.error('updateTeacher error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật giáo viên', error: error.message });
  }
});

// DELETE /school-admin/teachers/:id — xóa giáo viên
router.delete('/teachers/:id', authenticate, authorizePermissions('MANAGE_TEACHER'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).lean();
    if (!teacher) return res.status(404).json({ status: 'error', message: 'Không tìm thấy giáo viên' });

    const Classes = require('../models/Classes');
    const inUse = await Classes.countDocuments({ teacherIds: teacher._id });
    if (inUse > 0) return res.status(400).json({ status: 'error', message: `Không thể xóa: giáo viên đang phụ trách ${inUse} lớp học` });

    await Teacher.findByIdAndDelete(teacher._id);
    await User.findByIdAndUpdate(teacher.userId, { status: 'inactive' });

    return res.status(200).json({ status: 'success', message: 'Đã xóa giáo viên' });
  } catch (error) {
    console.error('deleteTeacher error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi xóa giáo viên', error: error.message });
  }
});

// Migration: tạo Teacher record cho User có role Teacher chưa có record
router.post('/teachers/migrate', authenticate, authorizePermissions('MANAGE_TEACHER'), async (req, res) => {
  try {
    const teacherRole = await Role.findOne({ roleName: 'Teacher' }).lean();
    if (!teacherRole) return res.status(200).json({ status: 'success', message: 'Không tìm thấy role Teacher', created: 0 });

    const users = await User.find({ roles: teacherRole._id }).select('_id').lean();
    let created = 0;
    for (const u of users) {
      const result = await Teacher.findOneAndUpdate(
        { userId: u._id },
        { $setOnInsert: { userId: u._id, status: 'active' } },
        { upsert: true, new: true, rawResult: true }
      );
      if (result.lastErrorObject?.upserted) created++;
    }
    return res.status(200).json({ status: 'success', message: `Đã tạo ${created} Teacher record mới`, created });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// School Staff management
// ============================================
// Helper function to generate employee ID
const generateEmployeeId = async (position) => {
  const positionCodes = {
    'BGH': 'BGH',
    'Giáo viên': 'GV',
    'Nhân viên văn phòng': 'VP',
    'nhân viên y tế': 'YT',
    'nhân viên bếp': 'BP'
  };

  const code = positionCodes[position] || 'KH';
  const count = await Staff.countDocuments(
    code === 'KH'
      ? { position: { $nin: Object.keys(positionCodes) } }
      : { position }
  );
  const nextNumber = count + 1;
  return `${code}${nextNumber.toString().padStart(3, '0')}`;
};

router.get('/staff-users', authenticate, authorizeRoles('SchoolAdmin'), async (req, res) => {
  try {
    const users = await User.find({ status: 'active' })
      .populate('roles', 'roleName')
      .select('fullName phone username email roles avatar status')
      .sort({ fullName: 1 })
      .lean();

    const filteredUsers = users.filter((user) => {
      const roleNames = (user.roles || []).map((role) => role.roleName || '').filter(Boolean);
      return roleNames.length > 0 && !roleNames.includes('Student');
    });

    const data = filteredUsers.map((user) => ({
      ...user,
      roleNames: (user.roles || []).map((role) => role.roleName || '').filter(Boolean).join(', '),
    }));

    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    console.error('staffUsers error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách người dùng' });
  }
});

router.get('/staff-members', authenticate, authorizeRoles('SchoolAdmin'), async (req, res) => {
  try {
    const staffDocs = await Staff.find()
      .populate('userId', 'fullName email phone avatar status')
      .sort({ employeeId: 1 })
      .lean();

    const data = staffDocs.map((item) => ({
      _id: item._id,
      employeeId: item.employeeId,
      position: item.position,
      status: item.status,
      notes: item.notes,
      user: item.userId ? {
        _id: item.userId._id,
        fullName: item.userId.fullName,
        email: item.userId.email,
        phone: item.userId.phone,
        avatar: item.userId.avatar || '',
        status: item.userId.status,
        roleNames: (item.userId.roles || []).map((role) => role.roleName || '').filter(Boolean).join(', '),
      } : null,
    }));

    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    console.error('staffMembers error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách nhân sự' });
  }
});

router.post('/staff-members', authenticate, authorizeRoles('SchoolAdmin'), async (req, res) => {
  try {
    const { position, status, userId, notes } = req.body;
    if (!position?.trim()) return res.status(400).json({ status: 'error', message: 'Chức vụ không được để trống' });
    if (!userId) return res.status(400).json({ status: 'error', message: 'Người dùng phải được chọn' });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ status: 'error', message: 'Người dùng không tồn tại' });

    const existingUserStaff = await Staff.findOne({ userId }).lean();
    if (existingUserStaff) {
      return res.status(400).json({ status: 'error', message: 'Người dùng này đã có nhân sự' });
    }

    const employeeId = await generateEmployeeId(position.trim());

    const newStaff = await Staff.create({
      userId,
      employeeId,
      position: position.trim(),
      status: ['active', 'inactive'].includes(status) ? status : 'active',
      notes: notes?.trim() || '',
    });

    await newStaff.populate('userId', 'fullName phone status');

    return res.status(201).json({
      status: 'success',
      message: 'Tạo nhân sự thành công',
      data: {
        _id: newStaff._id,
        employeeId: newStaff.employeeId,
        position: newStaff.position,
        status: newStaff.status,
        notes: newStaff.notes,
        user: newStaff.userId ? {
          _id: newStaff.userId._id,
          fullName: newStaff.userId.fullName,
          phone: newStaff.userId.phone,
          status: newStaff.userId.status,
        } : null,
      },
    });
  } catch (error) {
    console.error('createStaffMember error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi tạo nhân sự' });
  }
});

router.put('/staff-members/:id', authenticate, authorizeRoles('SchoolAdmin'), async (req, res) => {
  try {
    const { position, status, notes, avatar } = req.body;
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ status: 'error', message: 'Không tìm thấy nhân sự' });

    // Note: employeeId is auto-generated and cannot be changed
    if (position !== undefined) staff.position = position?.trim() || staff.position;
    if (status && ['active', 'inactive'].includes(status)) staff.status = status;
    if (notes !== undefined) staff.notes = notes?.trim() || '';

    await staff.save();

    if (avatar !== undefined && staff.userId) {
      await User.findByIdAndUpdate(staff.userId, { avatar });
    }

    await staff.populate('userId', 'fullName phone avatar status');

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật nhân sự thành công',
      data: {
        _id: staff._id,
        employeeId: staff.employeeId,
        position: staff.position,
        status: staff.status,
        notes: staff.notes,
        user: staff.userId ? {
          _id: staff.userId._id,
          fullName: staff.userId.fullName,
          phone: staff.userId.phone,
          avatar: staff.userId.avatar,
          status: staff.userId.status,
        } : null,
      },
    });
  } catch (error) {
    console.error('updateStaffMember error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật nhân sự' });
  }
});

router.put('/users/:id', authenticate, authorizeRoles('SchoolAdmin'), async (req, res) => {
  try {
    const { avatar, status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng' });

    if (avatar !== undefined) user.avatar = avatar;
    if (status && ['active', 'inactive'].includes(status)) user.status = status;

    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật người dùng thành công',
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật người dùng' });
  }
});

router.delete('/staff-members/:id', authenticate, authorizeRoles('SchoolAdmin'), async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).lean();
    if (!staff) return res.status(404).json({ status: 'error', message: 'Không tìm thấy nhân sự' });

    await Staff.findByIdAndDelete(staff._id);
    return res.status(200).json({ status: 'success', message: 'Đã xóa nhân sự' });
  } catch (error) {
    console.error('deleteStaffMember error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi xóa nhân sự' });
  }
});

// ============================================
// Classrooms
// ============================================
router.get('/classrooms', authenticate, authorizePermissions('MANAGE_CLASS'), listClassrooms);
router.post('/classrooms', authenticate, authorizePermissions('MANAGE_CLASS'), createClassroom);
router.put('/classrooms/:id', authenticate, authorizePermissions('MANAGE_CLASS'), updateClassroom);
router.delete('/classrooms/:id', authenticate, authorizePermissions('MANAGE_CLASS'), deleteClassroom);

// ============================================
// GET /school-admin/staff — danh sách user có role SchoolAdmin (để chọn thành viên ban kiểm kê)
router.get('/staff', authenticate, authorizePermissions('MANAGE_ASSET'), async (req, res) => {
  try {
    const role = await Role.findOne({ roleName: 'SchoolAdmin' }).lean();
    if (!role) return res.status(200).json({ status: 'success', data: [] });
    const users = await User.find({ roles: role._id, status: 'active' })
      .select('fullName email')
      .sort({ fullName: 1 })
      .lean();
    return res.status(200).json({ status: 'success', data: users });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách nhân viên' });
  }
});

// Asset Inspection - Committees (Ban kiểm kê)
// ============================================
router.get('/asset-committees', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.listCommittees);
router.post('/asset-committees', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.createCommittee);
router.get('/asset-committees/:id', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.getCommittee);
router.put('/asset-committees/:id', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.updateCommittee);
router.delete('/asset-committees/:id', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.deleteCommittee);
router.patch('/asset-committees/:id/end', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.endCommittee);

// ============================================
// Asset Inspection - Minutes (Biên bản kiểm kê)
// ============================================
router.get('/asset-minutes', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.listMinutes);
router.post('/asset-minutes', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.createMinutes);
router.get('/asset-minutes/:id/export-word', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.exportMinutesWord);
router.get('/asset-minutes/:id', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.getMinutes);
router.put('/asset-minutes/:id', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.updateMinutes);
router.delete('/asset-minutes/:id', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.deleteMinutes);
router.patch('/asset-minutes/:id/approve', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.approveMinutes);
router.patch('/asset-minutes/:id/reject', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.rejectMinutes);

// ============================================
// Assets CRUD (Danh sách tài sản)
// ============================================
router.get('/assets', authenticate, authorizePermissions('MANAGE_ASSET'), assetCrudCtrl.listAssets);
router.post('/assets', authenticate, authorizePermissions('MANAGE_ASSET'), assetCrudCtrl.createAsset);
router.post('/assets/bulk', authenticate, authorizePermissions('MANAGE_ASSET'), assetCrudCtrl.bulkCreateAssets);
router.get('/assets/:id', authenticate, authorizePermissions('MANAGE_ASSET'), assetCrudCtrl.getAsset);
router.put('/assets/:id', authenticate, authorizePermissions('MANAGE_ASSET'), assetCrudCtrl.updateAsset);
router.delete('/assets/:id', authenticate, authorizePermissions('MANAGE_ASSET'), assetCrudCtrl.deleteAsset);

// ============================================
// Asset Allocations (Biên bản bàn giao tài sản)
// ============================================
const wordUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
router.get('/asset-allocations', authenticate, authorizePermissions('MANAGE_ASSET'), allocationCtrl.listAllocations);
router.post('/asset-allocations', authenticate, authorizePermissions('MANAGE_ASSET'), allocationCtrl.createAllocation);
router.get('/asset-allocations/template', authenticate, authorizePermissions('MANAGE_ASSET'), allocationCtrl.generateExcelTemplate);
router.post('/asset-allocations/parse-word', authenticate, authorizePermissions('MANAGE_ASSET'), wordUpload.single('file'), allocationCtrl.parseWordFile);
router.post('/asset-allocations/parse-excel', authenticate, authorizePermissions('MANAGE_ASSET'), wordUpload.single('file'), allocationCtrl.parseExcelFile);
router.get('/asset-allocations/classes', authenticate, authorizePermissions('MANAGE_ASSET'), allocationCtrl.listClasses);
router.get('/asset-allocations/:id/export-word', authenticate, authorizePermissions('MANAGE_ASSET'), allocationCtrl.exportWord);
router.get('/asset-allocations/:id', authenticate, authorizePermissions('MANAGE_ASSET'), allocationCtrl.getAllocation);
router.put('/asset-allocations/:id', authenticate, authorizePermissions('MANAGE_ASSET'), allocationCtrl.updateAllocation);
router.delete('/asset-allocations/:id', authenticate, authorizePermissions('MANAGE_ASSET'), allocationCtrl.deleteAllocation);
router.patch('/asset-allocations/:id/transfer', authenticate, authorizePermissions('MANAGE_ASSET'), allocationCtrl.transferAllocation);

// ============================================
// Purchase Requests (Yêu cầu mua sắm)
// ============================================
router.get('/purchase-requests', authenticate, authorizePermissions('MANAGE_PURCHASE_REQUEST'), purchaseCtrl.listAllRequests);
router.patch('/purchase-requests/:id/approve', authenticate, authorizePermissions('MANAGE_PURCHASE_REQUEST'), purchaseCtrl.approveRequest);
router.patch('/purchase-requests/:id/reject', authenticate, authorizePermissions('MANAGE_PURCHASE_REQUEST'), purchaseCtrl.rejectRequest);

// ============================================
// Asset Incidents (Báo cáo sự cố tài sản)
// ============================================
router.get('/asset-incidents',          authenticate, authorizePermissions('MANAGE_ASSET'), incidentCtrl.listAllIncidents);
router.patch('/asset-incidents/:id',    authenticate, authorizePermissions('MANAGE_ASSET'), incidentCtrl.updateIncidentStatus);

module.exports = router;
