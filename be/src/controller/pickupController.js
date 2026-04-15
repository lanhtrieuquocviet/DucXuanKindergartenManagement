<<<<<<< HEAD
const PickupRequest = require("../models/PickupRequest");
const Student = require("../models/Student"); // Students
const Classes = require("../models/Classes"); // Classes
const Teacher = require("../models/Teacher"); // Teachers
const mongoose = require("mongoose");
const BPMEngine = require("../services/bpmEngine.service");
// 1. Tạo đăng ký mới (phụ huynh)
exports.createPickupRequest = async (req, res) => {
  try {

    const { fullName, relation, phone, imageUrl, studentId } = req.body;
=======
const service = require('../services/pickupService.js');
>>>>>>> 4353c6d86870654ca8aec10b6e87b538d89e8813

const createPickupRequest = async (req, res, next) => service.createPickupRequest(req, res, next);
const getMyPickupRequests = async (req, res, next) => service.getMyPickupRequests(req, res, next);
const getPickupRequests = async (req, res, next) => service.getPickupRequests(req, res, next);
const getApprovedPickupPersonsByStudent = async (req, res, next) => service.getApprovedPickupPersonsByStudent(req, res, next);
const updatePickupRequestStatus = async (req, res, next) => service.updatePickupRequestStatus(req, res, next);
const updateMyPickupRequest = async (req, res, next) => service.updateMyPickupRequest(req, res, next);
const deleteMyPickupRequest = async (req, res, next) => service.deleteMyPickupRequest(req, res, next);

module.exports = {
  createPickupRequest,
  getMyPickupRequests,
  getPickupRequests,
  getApprovedPickupPersonsByStudent,
  updatePickupRequestStatus,
  updateMyPickupRequest,
  deleteMyPickupRequest,
};
<<<<<<< HEAD

// 2. Phụ huynh xem danh sách đăng ký của mình
exports.getMyPickupRequests = async (req, res) => {
  try {
    const requests = await PickupRequest.find({ parent: req.user._id })
      .populate("student", "fullName classId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách đăng ký",
      error: error.message,
    });
  }
};

// 3. Giáo viên xem danh sách chờ duyệt (lớp mình phụ trách)
exports.getPickupRequests = async (req, res) => {
  try {
    const { status } = req.query; // lấy từ query string

    // Tìm Teacher document tương ứng với user hiện tại
    const teacher = await Teacher.findOne({ userId: req.user._id }).lean();
    const myTeacherId = teacher?._id;

    // Tìm các lớp giáo viên phụ trách
    const classes = await Classes.find({ teacherIds: myTeacherId }).select(
      "_id"
    );
    const classIds = classes.map((c) => c._id);

    // Tìm học sinh thuộc các lớp đó
    const students = await Student.find({ classId: { $in: classIds } }).select(
      "_id"
    );
    const studentIds = students.map((s) => s._id);

    // Xây dựng filter cho status
    const filter = { student: { $in: studentIds } };
    if (status && status !== "all") {
      filter.status = status; // chỉ lấy theo trạng thái cụ thể
    }

    const requests = await PickupRequest.find(filter)
      .populate("student", "fullName")
      .populate("parent", "fullName phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách đăng ký",
      error: error.message,
    });
  }
};

// 5. Giáo viên xem danh sách người đưa đón đã được duyệt của một học sinh
exports.getApprovedPickupPersonsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Không tìm thấy học sinh" });
    }

    // SchoolAdmin có thể xem tất cả, Teacher chỉ xem lớp mình phụ trách
    const isSchoolAdmin = (req.user.roles || []).includes("SchoolAdmin");
    if (!isSchoolAdmin) {
      const myTeacher = await Teacher.findOne({ userId: req.user._id }).lean();
      const myTeacherId = myTeacher?._id?.toString();
      const classDoc = await Classes.findById(student.classId);
      if (
        !classDoc || !myTeacherId ||
        !classDoc.teacherIds.some((id) => id.toString() === myTeacherId)
      ) {
        return res.status(403).json({ success: false, message: "Không có quyền xem thông tin này" });
      }
    }

    const requests = await PickupRequest.find({
      student: studentId,
      status: "approved",
    }).select("fullName relation phone imageUrl faceEmbedding faceRegisteredAt");

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// 4. Giáo viên duyệt hoặc từ chối
exports.updatePickupRequestStatus = async (req, res) => {
  const { requestId, status, rejectedReason } = req.body;

  if (!requestId || !["approved", "rejected"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Thiếu requestId hoặc trạng thái không hợp lệ",
    });
  }

  try {
    const request = await PickupRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đăng ký",
      });
    }

    // Kiểm tra quyền: giáo viên có phụ trách lớp của học sinh không
    const student = await Student.findById(request.student);
    const myTeacher2 = await Teacher.findOne({ userId: req.user._id }).lean();
    const myTeacherId2 = myTeacher2?._id?.toString();
    const classDoc = await Classes.findById(student?.classId);
    if (
      !classDoc || !myTeacherId2 ||
      !classDoc.teacherIds.some((id) => id.toString() === myTeacherId2)
    ) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền xử lý đăng ký này",
      });
    }

    // === BỘ MÁY SO KHỚP BPM (Matching Engine) ===
    // Kiểm tra xem việc Phê duyệt này có đúng quy trình đã vẽ hay không
    if (status === "approved") {
      const bpmResult = await BPMEngine.validateTransition(
        'attendance',
        'Quy trình Đưa đón học sinh',
        'Tiếp nhận hồ sơ',
        'Giáo viên chủ nhiệm kiểm tra',
        req.user
      );

      if (!bpmResult.isValid) {
        return res.status(403).json({
          success: false,
          message: `Sai quy trình BPM: ${bpmResult.message}`
        });
      }
    }

    request.status = status;
    request.processedBy = req.user._id;
    request.processedAt = new Date();

    if (status === "rejected") {
      request.rejectedReason = rejectedReason || "";
    }

    await request.save();

    res.json({
      success: true,
      message: `Đã ${status === "approved" ? "duyệt" : "từ chối"} thành công`,
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái",
      error: error.message,
    });
  }
};

// 6. Phụ huynh sửa đăng ký (chỉ khi pending)
exports.updateMyPickupRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, relation, phone, imageUrl } = req.body;

    // Validate required fields
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập họ tên người đón",
      });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập số điện thoại",
      });
    }
    if (!relation || !relation.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mối quan hệ",
      });
    }

    // Validate fullName max 50 characters
    if (fullName.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: "Họ tên không được vượt quá 50 ký tự",
      });
    }

    // Validate phone: only digits and max 11
    const phoneDigits = phone.replace(/[^0-9]/g, "");
    if (phoneDigits.length > 11) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không được vượt quá 11 chữ số",
      });
    }
    if (phoneDigits.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại phải chứa ít nhất một chữ số",
      });
    }

    const request = await PickupRequest.findOne({
      _id: id,
      parent: req.user._id,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đăng ký",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ được sửa khi đang ở trạng thái chờ duyệt",
      });
    }

    // Check duplicate lại nếu cần
    const duplicate = await PickupRequest.findOne({
      _id: { $ne: id },
      student: request.student,
      fullName: fullName.trim(),
      relation: relation.trim(),
      phone: phoneDigits,
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Thông tin người đưa đón đã tồn tại",
      });
    }

    request.fullName = fullName.trim();
    request.relation = relation.trim();
    request.phone = phoneDigits;
    request.imageUrl = imageUrl || "";

    await request.save();

    res.json({
      success: true,
      message: "Cập nhật thành công",
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật đăng ký",
      error: error.message,
    });
  }
};

// 7. Phụ huynh hủy đăng ký (chỉ khi pending)
exports.deleteMyPickupRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await PickupRequest.findOne({
      _id: id,
      parent: req.user._id,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đăng ký",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ được hủy khi đang ở trạng thái chờ duyệt",
      });
    }

    await PickupRequest.deleteOne({ _id: id });

    res.json({
      success: true,
      message: "Đã hủy đăng ký thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi hủy đăng ký",
      error: error.message,
    });
  }
};
=======
>>>>>>> 4353c6d86870654ca8aec10b6e87b538d89e8813
