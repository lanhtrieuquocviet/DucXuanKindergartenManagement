const ClassTransferRequest = require('../models/ClassTransferRequest');
const Student = require('../models/Student');
const Classes = require('../models/Classes');
const Teacher = require('../models/Teacher');
const AcademicYear = require('../models/AcademicYear');
const { createNotification } = require('../controller/notification.controller');

// ─── Helpers ────────────────────────────────────────────────────────────────

async function notifyUsers(userIds, { title, body, extra }) {
  await Promise.all(
    userIds.filter(Boolean).map((uid) =>
      createNotification({
        title,
        body,
        type: 'class_transfer',
        targetRole: 'all',
        targetUserId: uid,
        extra,
      }),
    ),
  );
}

async function getTeacherUserIds(classId) {
  const classDoc = await Classes.findById(classId).lean();
  if (!classDoc?.teacherIds?.length) return [];
  const teachers = await Teacher.find({ _id: { $in: classDoc.teacherIds } }).select('userId').lean();
  return teachers.map((t) => t.userId).filter(Boolean);
}

// ─── Parent: tạo đơn ─────────────────────────────────────────────────────────

exports.createClassTransferRequest = async (req, res) => {
  try {
    const { studentId, toClassId, reason } = req.body;
    if (!studentId || !toClassId || !reason?.trim()) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    // BR-171: phụ huynh chỉ gửi cho con mình
    const student = await Student.findOne({ _id: studentId, parentId: req.user._id }).lean();
    if (!student) {
      return res.status(403).json({ success: false, message: 'Học sinh không thuộc quyền quản lý của bạn' });
    }
    if (!student.classId) {
      return res.status(400).json({ success: false, message: 'Học sinh chưa được xếp lớp' });
    }

    const fromClassId = student.classId;
    if (fromClassId.toString() === toClassId) {
      return res.status(400).json({ success: false, message: 'Lớp đích trùng với lớp hiện tại' });
    }

    // Lấy thông tin cả 2 lớp để kiểm tra cùng khối
    const [fromClass, toClass] = await Promise.all([
      Classes.findById(fromClassId).lean(),
      Classes.findById(toClassId).lean(),
    ]);
    if (!toClass) {
      return res.status(404).json({ success: false, message: 'Lớp đích không tồn tại' });
    }

    // Kiểm tra cùng khối (gradeId)
    if (!fromClass?.gradeId || !toClass?.gradeId ||
        fromClass.gradeId.toString() !== toClass.gradeId.toString()) {
      return res.status(400).json({ success: false, message: 'Chỉ được chuyển sang lớp trong cùng khối với lớp hiện tại' });
    }
    const maxStudents = toClass.maxStudents || toClass.capacity || 0;
    if (maxStudents > 0) {
      const currentCount = await Student.countDocuments({ classId: toClassId, status: 'active' });
      if (currentCount >= maxStudents) {
        return res.status(400).json({ success: false, message: `Lớp ${toClass.className} đã đạt sĩ số tối đa (${maxStudents} học sinh)` });
      }
    }

    // Kiểm tra đã có đơn pending chưa
    const existing = await ClassTransferRequest.findOne({
      studentId: student._id,
      status: 'pending',
    }).lean();
    if (existing) {
      return res.status(400).json({ success: false, message: 'Học sinh đã có đơn xin chuyển lớp đang chờ duyệt' });
    }

    const activeYear = await AcademicYear.findOne({ status: 'active' }).select('_id').lean();

    const request = await ClassTransferRequest.create({
      studentId: student._id,
      parentId: req.user._id,
      fromClassId,
      toClassId,
      reason: reason.trim(),
      academicYearId: activeYear?._id || null,
    });

    // Thông báo: Admin + giáo viên lớp đi + giáo viên lớp đến
    const [fromTeacherIds, toTeacherIds] = await Promise.all([
      getTeacherUserIds(fromClassId),
      getTeacherUserIds(toClassId),
    ]);
    const allTeacherIds = [...new Set([...fromTeacherIds, ...toTeacherIds].map(String))].map(
      (id) => fromTeacherIds.find((t) => t.toString() === id) || toTeacherIds.find((t) => t.toString() === id),
    );

    const notifPayload = {
      title: 'Có đơn xin chuyển lớp mới',
      body: `${student.fullName} có đơn xin chuyển từ lớp sang lớp ${toClass.className}.`,
      extra: { classTransferRequestId: request._id, studentId: student._id },
    };
    await Promise.all([
      notifyUsers(allTeacherIds, notifPayload),
      createNotification({
        ...notifPayload,
        type: 'class_transfer',
        targetRole: 'SchoolAdmin',
        targetUserId: null,
      }),
    ]);

    return res.status(201).json({ success: true, message: 'Đã gửi đơn xin chuyển lớp', data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi tạo đơn', error: error.message });
  }
};

// ─── Parent: xem đơn của mình ────────────────────────────────────────────────

exports.getMyClassTransferRequests = async (req, res) => {
  try {
    const requests = await ClassTransferRequest.find({ parentId: req.user._id })
      .populate('studentId', 'fullName studentCode')
      .populate('fromClassId', 'className')
      .populate('toClassId', 'className')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách đơn', error: error.message });
  }
};

// ─── Parent: huỷ đơn ─────────────────────────────────────────────────────────

exports.cancelClassTransferRequest = async (req, res) => {
  try {
    const request = await ClassTransferRequest.findOne({ _id: req.params.id, parentId: req.user._id });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể huỷ đơn đang chờ duyệt' });
    }
    request.status = 'cancelled';
    await request.save();
    return res.json({ success: true, message: 'Đã huỷ đơn xin chuyển lớp', data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi huỷ đơn', error: error.message });
  }
};

// ─── Teacher: xem đơn liên quan lớp mình (BR-169) ───────────────────────────

exports.getTeacherClassTransferRequests = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id }).lean();
    if (!teacher) {
      return res.status(403).json({ success: false, message: 'Không tìm thấy thông tin giáo viên' });
    }
    const classDocs = await Classes.find({ teacherIds: teacher._id }).select('_id className').lean();
    const classIds = classDocs.map((c) => c._id);
    console.log('[ClassTransfer] teacher._id:', teacher._id, '| classes:', classDocs.map(c => c.className));

    if (!classIds.length) {
      return res.json({ success: true, data: [] });
    }

    const { status } = req.query;
    const filter = {
      $or: [{ fromClassId: { $in: classIds } }, { toClassId: { $in: classIds } }],
    };
    if (status && status !== 'all') filter.status = status;

    const requests = await ClassTransferRequest.find(filter)
      .populate('studentId', 'fullName studentCode')
      .populate('fromClassId', 'className')
      .populate('toClassId', 'className')
      .populate('parentId', 'fullName phone')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách đơn', error: error.message });
  }
};

// ─── Admin: xem tất cả đơn ───────────────────────────────────────────────────

exports.getAdminClassTransferRequests = async (req, res) => {
  try {
    const { status, academicYearId } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (academicYearId) filter.academicYearId = academicYearId;

    const requests = await ClassTransferRequest.find(filter)
      .populate('studentId', 'fullName studentCode avatar')
      .populate('fromClassId', 'className')
      .populate('toClassId', 'className')
      .populate('parentId', 'fullName phone')
      .populate('processedBy', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách đơn', error: error.message });
  }
};

// ─── Admin: duyệt / từ chối (BR-168) ─────────────────────────────────────────

exports.updateClassTransferRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectedReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ (approved | rejected)' });
    }

    const request = await ClassTransferRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể xử lý đơn đang chờ duyệt' });
    }

    // AF-4: kiểm tra lại capacity khi duyệt
    if (status === 'approved') {
      const toClass = await Classes.findById(request.toClassId).lean();
      const maxStudents = toClass?.maxStudents || toClass?.capacity || 0;
      if (maxStudents > 0) {
        const currentCount = await Student.countDocuments({ classId: request.toClassId, status: 'active' });
        if (currentCount >= maxStudents) {
          return res.status(400).json({
            success: false,
            message: `Lớp ${toClass.className} đã đạt sĩ số tối đa (${maxStudents} học sinh)`,
          });
        }
      }

      // BR-170: cập nhật classId học sinh ngay lập tức
      await Student.findByIdAndUpdate(request.studentId, { classId: request.toClassId });
    }

    request.status = status;
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    request.rejectedReason = status === 'rejected' ? (rejectedReason || '').trim() : '';
    await request.save();

    const student = await Student.findById(request.studentId).lean();
    const fromClass = await Classes.findById(request.fromClassId).lean();
    const toClass = await Classes.findById(request.toClassId).lean();

    const title = status === 'approved' ? 'Đơn chuyển lớp đã được duyệt' : 'Đơn chuyển lớp bị từ chối';
    const body =
      status === 'approved'
        ? `Đơn xin chuyển lớp của ${student?.fullName} từ ${fromClass?.className} sang ${toClass?.className} đã được duyệt.`
        : `Đơn xin chuyển lớp của ${student?.fullName} bị từ chối${request.rejectedReason ? `: ${request.rejectedReason}` : '.'}`;

    const notifExtra = { classTransferRequestId: request._id, status: request.status };

    // Thông báo phụ huynh
    await createNotification({
      title,
      body,
      type: 'class_transfer',
      targetRole: 'Parent',
      targetUserId: request.parentId,
      extra: notifExtra,
    });

    // Thông báo giáo viên cả 2 lớp (BR-170)
    const [fromTeacherIds, toTeacherIds] = await Promise.all([
      getTeacherUserIds(request.fromClassId),
      getTeacherUserIds(request.toClassId),
    ]);
    const allTeacherIds = [...new Set([...fromTeacherIds, ...toTeacherIds].map(String))].map(
      (id) => fromTeacherIds.find((t) => t.toString() === id) || toTeacherIds.find((t) => t.toString() === id),
    );
    await notifyUsers(allTeacherIds, { title, body, extra: notifExtra });

    return res.json({ success: true, message: 'Cập nhật trạng thái thành công', data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi xử lý đơn', error: error.message });
  }
};
