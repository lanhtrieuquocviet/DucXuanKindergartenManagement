const PickupRequest = require("../models/PickupRequest");
const Student = require("../models/Student"); // Students
const Classes = require("../models/Classes"); // Classes
const mongoose = require("mongoose");
// 1. Tạo đăng ký mới (phụ huynh)
exports.createPickupRequest = async (req, res) => {
  try {
  
    const { fullName, relation, phone, imageUrl, studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu studentId",
      });
    }

    let studentObjectId;
    let userObjectId;
    try {
      studentObjectId = new mongoose.Types.ObjectId(studentId);
      userObjectId = new mongoose.Types.ObjectId(req.user.id);
      console.log("ObjectIds created successfully");
    } catch (castErr) {
      console.error("Cast ObjectId error:", castErr);
      return res.status(400).json({
        success: false,
        message:
          "ID học sinh hoặc user không hợp lệ (không phải ObjectId hợp lệ)",
      });
    }

    console.log("Querying student...");
    const student = await Student.findOne({
      _id: studentObjectId,
      parentId: userObjectId,
    });

    console.log("Student query result:", student ? "Found" : "Not found");

    if (!student) {
      return res.status(403).json({
        success: false,
        message: "Học sinh không thuộc quyền quản lý của bạn",
      });
    }
    const duplicateByNameRelation = await PickupRequest.findOne({
      student: studentObjectId,
      fullName: fullName.trim(),
      relation: relation,
    });

    if (
      duplicateByNameRelation &&
      duplicateByNameRelation.phone === phone.trim()
    ) {
      return res.status(400).json({
        message: "Trùng tên, quan hệ và số điện thoại đã đăng ký trước đó",
      });
    }

    console.log("Creating PickupRequest...");
    const pickupRequest = new PickupRequest({
      student: studentObjectId,
      parent: userObjectId,
      fullName,
      relation,
      phone,
      imageUrl: imageUrl || "",
    });

    await pickupRequest.save();
    console.log("Saved successfully:", pickupRequest._id);

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công, đang chờ duyệt",
      data: pickupRequest,
    });
  } catch (error) {
    console.error("Create pickup request error:", error.stack);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo đăng ký",
      error: error.message,
    });
  }
};

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

    // Tìm các lớp giáo viên phụ trách
    const classes = await Classes.find({ teacherIds: req.user._id }).select(
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
    const classDoc = await Classes.findById(student.classId);
    if (
      !classDoc ||
      !classDoc.teacherIds.some(
        (id) => id.toString() === req.user._id.toString()
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền xử lý đăng ký này",
      });
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
