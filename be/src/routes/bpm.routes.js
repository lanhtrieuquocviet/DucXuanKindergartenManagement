const express = require('express');
const router = express.Router();
const BPMWorkflow = require('../models/BPMWorkflow');
const BPMNodeDefinition = require('../models/BPMNodeDefinition');
const SystemLog = require('../models/SystemLog');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const mammoth = require('mammoth');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// ============================================
// Quản lý Workflow
// ============================================

/**
 * @openapi
 * /api/bpm/workflows:
 *   get:
 *     tags: [BPM]
 *     summary: Lấy danh sách quy trình (Workflow)
 *     responses:
 *       200:
 *         description: Trả về danh sách các bản thiết kế quy trình
 */
router.get(
  '/workflows',
  authenticate,
  authorizeRoles('SystemAdmin', 'SchoolAdmin'),
  async (req, res) => {
    try {
      const workflows = await BPMWorkflow.find().populate('createdBy', 'fullName');
      res.json({ status: 'success', data: workflows });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
);

/**
 * @openapi
 * /api/bpm/nodes:
 *   get:
 *     tags: [BPM]
 *     summary: Lấy danh mục Node định nghĩa sẵn (Library)
 *     responses:
 *       200:
 *         description: Trả về 18 loại node tiêu chuẩn của hệ thống
 */
router.get(
  '/nodes',
  authenticate,
  authorizeRoles('SystemAdmin', 'SchoolAdmin'),
  async (req, res) => {
    try {
      const nodes = await BPMNodeDefinition.find({ isActive: true });
      res.json({ status: 'success', data: nodes });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
);

/**
 * @openapi
 * /api/bpm/workflows/{id}:
 *   delete:
 *     tags: [BPM]
 *     summary: Xóa một quy trình
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete(
  '/workflows/:id',
  authenticate,
  authorizeRoles('SystemAdmin'),
  async (req, res) => {
    try {
      const workflow = await BPMWorkflow.findById(req.params.id);
      if (!workflow) {
        return res.status(404).json({ status: 'error', message: 'Không tìm thấy quy trình' });
      }

      await BPMWorkflow.findByIdAndDelete(req.params.id);

      // Ghi log hệ thống
      await SystemLog.create({
        userId: req.user._id,
        actorName: req.user.fullName || req.user.username || 'System Admin', // Fallback nếu fullName bị thiếu
        action: 'DELETE_BPM_WORKFLOW',
        module: 'BPM',
        details: `Đã xóa quy trình: ${workflow.name}`,
        ipAddress: req.ip
      });

      res.json({ status: 'success', message: 'Đã xóa quy trình thành công' });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
);

/**
 * @openapi
 * /api/bpm/workflows:
 *   post:
 *     tags: [BPM]
 *     summary: Tạo hoặc cập nhật quy trình
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               module: { type: string }
 *               nodes: { type: array }
 *               edges: { type: array }
 */
router.post(
  '/workflows',
  authenticate,
  authorizeRoles('SystemAdmin', 'SchoolAdmin'),
  async (req, res) => {
    try {
      const { name, description, module, status, nodes, edges, id } = req.body;
      let workflow;

      if (id) {
        workflow = await BPMWorkflow.findByIdAndUpdate(
          id,
          { name, description, module, status, nodes, edges },
          { new: true }
        );
      } else {
        workflow = await BPMWorkflow.create({
          name,
          description,
          module,
          status: status || 'draft',
          nodes,
          edges,
          createdBy: req.user._id,
        });
      }

      // Ghi log hệ thống sau khi lưu BPM
      await SystemLog.create({
        actorId: req.user._id,
        actorName: req.user.username,
        action: 'UPDATE_BPM_WORKFLOW',
        detail: `Cập nhật quy trình: ${name}`,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip || '',
      });

      res.json({ status: 'success', data: workflow });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
);

// Tự động sinh quy trình từ file Word (.docx)
router.post(
  '/generate-from-docx',
  authenticate,
  authorizeRoles('SystemAdmin', 'SchoolAdmin'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'Vui lòng chọn file .docx' });
      }

      // Trích xuất văn bản từ file Word
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      const text = result.value;

      // Phân tách thành các bước (dựa trên dòng mới, bỏ qua dòng trống)
      const lines = text.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 5); // Chỉ lấy các dòng có nội dung rõ ràng

      if (lines.length === 0) {
        throw new Error('Không tìm thấy nội dung quy trình trong file.');
      }

      // Tự động sinh danh sách Nodes và Edges
      const nodes = lines.map((line, index) => ({
        id: `node-${index}`,
        data: { label: line },
        position: { x: 50, y: index * 120 },
        type: index === 0 ? 'input' : (index === lines.length - 1 ? 'output' : 'default'),
      }));

      const edges = [];
      for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({
          id: `edge-${i}`,
          source: nodes[i].id,
          target: nodes[i+1].id,
          animated: true,
        });
      }

      // Ghi log hệ thống sau khi tự động sinh quy trình
      await SystemLog.create({
        actorId: req.user._id,
        actorName: req.user.username,
        action: 'AUTO_GENERATE_BPM',
        detail: `Tự động sinh quy trình từ file: ${req.file.originalname} (${nodes.length} bước)`,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip || '',
      });

      res.json({ 
        status: 'success', 
        data: { 
          name: req.file.originalname.replace('.docx', ''),
          nodes, 
          edges 
        } 
      });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
);

// ============================================
// Nhật ký Hệ thống (BPM Monitor)
// ============================================

// Lấy log gần nhất để hiển thị trên Dashboard BPM
router.get(
  '/logs',
  authenticate,
  authorizeRoles('SystemAdmin', 'SchoolAdmin'),
  async (req, res) => {
    try {
      const logs = await SystemLog.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('actorId', 'fullName');
      res.json({ status: 'success', data: logs });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
);

// API Health Check
router.get(
  '/health', 
  authenticate,
  authorizeRoles('SystemAdmin', 'SchoolAdmin'),
  async (req, res) => {
  const mongoose = require('mongoose');
  res.json({ 
    status: 'success', 
    data: {
      database: mongoose.connection.readyState === 1 ? 'healthy' : 'error',
      uptime: process.uptime(),
    }
  });
});

// Tải file mẫu .docx để người dùng biết cách nhập
router.get(
  '/download-template',
  async (req, res) => {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: "HƯỚNG DẪN SOẠN THẢO QUY TRÌNH (BPM TEMPLATE)",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({ text: "\n" }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "LƯU Ý: Mỗi đoạn văn dưới đây sẽ trở thành một 'Bước' trong quy trình tự động.",
                    bold: true,
                    color: "C41E3A"
                  }),
                ]
              }),
              new Paragraph({ text: "--------------------------------------------------------" }),
              new Paragraph({ text: "1. Tiếp nhận hồ sơ học sinh đăng ký nghỉ học" }),
              new Paragraph({ text: "2. Giáo viên chủ nhiệm kiểm tra và ký xác nhận" }),
              new Paragraph({ text: "3. Chuyển thông tin cho Phòng Hành chính tổng hợp" }),
              new Paragraph({ text: "4. Ban Giám Hiệu phê duyệt kết quả cuối cùng" }),
              new Paragraph({ text: "5. Bắn thông báo kết quả cho phụ huynh qua App" }),
              new Paragraph({ text: "" }),
              new Paragraph({
                text: "(Vui lòng xóa nội dung mẫu trên và viết quy trình của bạn theo cách tương tự)",
                italics: true
              }),
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename=BPM_Template_DucXuan.docx');
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
);

// ============================================
// Điều khiển và Lịch sử Thực thi
// ============================================

/**
 * @openapi
 * /api/bpm/history/{attendanceId}:
 *   get:
 *     tags: [BPM]
 *     summary: Lấy lịch sử vết (Trace) của một bản ghi cụ thể
 *     parameters:
 *       - in: path
 *         name: attendanceId
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
  '/history/:attendanceId',
  authenticate,
  authorizeRoles('SystemAdmin', 'SchoolAdmin', 'Teacher'),
  async (req, res) => {
    try {
      const Attendances = require('../models/Attendances');
      const attendance = await Attendances.findById(req.params.attendanceId)
        .populate('studentId', 'fullName')
        .populate('bpmWorkflowId', 'name');

      if (!attendance) {
        return res.status(404).json({ status: 'error', message: 'Không tìm thấy bản ghi' });
      }

      const traces = await SystemLog.find({
        action: { $in: ['BPM_STEP_TRACE', 'BPM_ACTION_EXEC', 'BPM_CRITICAL_ERROR'] },
        detail: { $regex: req.params.attendanceId }
      }).sort({ createdAt: 1 });

      res.json({
        status: 'success',
        data: {
          attendance,
          traces
        }
      });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
);

/**
 * @openapi
 * /api/bpm/execute/{attendanceId}:
 *   post:
 *     tags: [BPM]
 *     summary: Kích hoạt bước tiếp theo thủ công
 *     parameters:
 *       - in: path
 *         name: attendanceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
router.post(
  '/execute/:attendanceId',
  authenticate,
  authorizeRoles('SystemAdmin', 'SchoolAdmin', 'Teacher'),
  async (req, res) => {
    try {
      const BPMExecutionService = require('../services/bpmExecution.service');
      const result = await BPMExecutionService.executeNext(req.params.attendanceId, req.body, req);
      
      if (!result.success) {
        return res.status(400).json({ status: 'error', message: result.error });
      }

      res.json({ status: 'success', data: result });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
);

/**
 * @openapi
 * /api/bpm/stats:
 *   get:
 *     tags: [BPM]
 *     summary: Thống kê tổng quan BPM
 */
router.get(
  '/stats',
  authenticate,
  authorizeRoles('SystemAdmin', 'SchoolAdmin'),
  async (req, res) => {
    try {
      const Attendances = require('../models/Attendances');
      
      const stats = await Attendances.aggregate([
        { $match: { bpmStatus: { $exists: true } } },
        { $group: { _id: '$bpmStatus', count: { $sum: 1 } } }
      ]);

      const workflowCounts = await BPMWorkflow.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      res.json({
        status: 'success',
        data: {
          executionStats: stats,
          workflowStats: workflowCounts
        }
      });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
);

/**
 * @openapi
 * /api/bpm/active-workflows:
 *   get:
 *     tags: [BPM]
 *     summary: Lấy danh sách quy trình đang Active
 */
router.get(
  '/active-workflows',
  authenticate,
  async (req, res) => {
    try {
      const workflows = await BPMWorkflow.find({ status: 'active' })
        .select('name module type nodes edges')
        .lean();
      res.json({ status: 'success', data: workflows });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
);

module.exports = router;
