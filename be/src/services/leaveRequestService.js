const LeaveRequest = require('../models/LeaveRequest');
const Student = require('../models/Student');
const Classes = require('../models/Classes');
const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendances');
const { createNotification } = require('../controller/notification.controller');

function startOfDay(input) {
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
}

function eachDateInclusive(from, to) {
  const dates = [];
  const cur = startOfDay(from);
  const end = startOfDay(to);
  while (cur <= end) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function normalizeDateRange(startDate, endDate) {
  const from = startOfDay(startDate);
  const to = startOfDay(endDate);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return null;
  }
  return { from, to };
}

async function ensureNoOverlap({ studentId, from, to, excludeRequestId = null }) {
  const query = {
    student: studentId,
    status: { $in: ['pending', 'approved'] },
    startDate: { $lte: to },
    endDate: { $gte: from },
  };
  if (excludeRequestId) query._id = { $ne: excludeRequestId };

  const overlapped = await LeaveRequest.findOne(query).lean();
  if (overlapped) {
    return {
      success: false,
      message: 'Khoảng thời gian này đã có đơn xin nghỉ chờ duyệt hoặc đã duyệt',
    };
  }
  return { success: true };
}

exports.createLeaveRequest = async (req, res) => {
  try {
    const { studentId, startDate, endDate, reason } = req.body;
    if (!studentId || !startDate || !endDate || !reason?.trim()) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    const student = await Student.findOne({ _id: studentId, parentId: req.user._id }).lean();
    if (!student) {
      return res.status(403).json({ success: false, message: 'Học sinh không thuộc quyền quản lý của bạn' });
    }

    const range = normalizeDateRange(startDate, endDate);
    if (!range) {
      return res.status(400).json({ success: false, message: 'Ngày không hợp lệ' });
    }
    const { from, to } = range;
    if (from > to) {
      return res.status(400).json({ success: false, message: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc' });
    }

    const overlapCheck = await ensureNoOverlap({ studentId: student._id, from, to });
    if (!overlapCheck.success) {
      return res.status(400).json(overlapCheck);
    }

    const request = await LeaveRequest.create({
      student: student._id,
      classId: student.classId,
      parent: req.user._id,
      startDate: from,
      endDate: to,
      reason: reason.trim(),
    });

    const classDoc = await Classes.findById(student.classId).lean();
    const teacherIds = classDoc?.teacherIds || [];
    const teachers = await Teacher.find({ _id: { $in: teacherIds } }).select('userId').lean();
    const teacherUserIds = teachers.map((t) => t.userId).filter(Boolean);
    await Promise.all(
      teacherUserIds.map((teacherUserId) =>
        createNotification({
          title: 'Có đơn xin nghỉ mới',
          body: `${student.fullName} có đơn xin nghỉ từ ${from.toLocaleDateString('vi-VN')} đến ${to.toLocaleDateString('vi-VN')}.`,
          type: 'leave_request',
          targetRole: 'Teacher',
          targetUserId: teacherUserId,
          extra: { leaveRequestId: request._id, studentId: student._id },
        }),
      ),
    );

    return res.status(201).json({ success: true, message: 'Đã gửi đơn xin nghỉ', data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi tạo đơn xin nghỉ', error: error.message });
  }
};

exports.cancelLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await LeaveRequest.findOne({ _id: id, parent: req.user._id });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
    }
    if (request.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Không thể hủy đơn đã được duyệt' });
    }
    if (request.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Đơn đã ở trạng thái hủy' });
    }

    request.status = 'cancelled';
    request.processedBy = null;
    request.processedAt = null;
    request.rejectedReason = '';
    await request.save();

    return res.json({ success: true, message: 'Đã hủy đơn xin nghỉ', data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi hủy đơn xin nghỉ', error: error.message });
  }
};

exports.updateMyLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason?.trim()) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    const request = await LeaveRequest.findOne({ _id: id, parent: req.user._id });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
    }
    if (request.status !== 'cancelled') {
      return res.status(400).json({ success: false, message: 'Chỉ được cập nhật đơn đã hủy' });
    }

    const range = normalizeDateRange(startDate, endDate);
    if (!range) {
      return res.status(400).json({ success: false, message: 'Ngày không hợp lệ' });
    }
    const { from, to } = range;
    if (from > to) {
      return res.status(400).json({ success: false, message: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc' });
    }

    const overlapCheck = await ensureNoOverlap({
      studentId: request.student,
      from,
      to,
      excludeRequestId: request._id,
    });
    if (!overlapCheck.success) {
      return res.status(400).json(overlapCheck);
    }

    request.startDate = from;
    request.endDate = to;
    request.reason = reason.trim();
    request.status = 'pending';
    request.processedBy = null;
    request.processedAt = null;
    request.rejectedReason = '';
    await request.save();

    return res.json({ success: true, message: 'Đã cập nhật và gửi lại đơn xin nghỉ', data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật đơn xin nghỉ', error: error.message });
  }
};

exports.deleteMyLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await LeaveRequest.findOne({ _id: id, parent: req.user._id }).lean();
    if (!request) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
    }
    if (request.status !== 'cancelled') {
      return res.status(400).json({ success: false, message: 'Chỉ được xóa đơn đã hủy' });
    }

    await LeaveRequest.deleteOne({ _id: id });
    return res.json({ success: true, message: 'Đã xóa đơn xin nghỉ' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi xóa đơn xin nghỉ', error: error.message });
  }
};

exports.getMyLeaveRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ parent: req.user._id })
      .populate('student', 'fullName classId')
      .sort({ createdAt: -1 });
    return res.json({ success: true, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách đơn', error: error.message });
  }
};

exports.getTeacherLeaveRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const teacher = await Teacher.findOne({ userId: req.user._id }).lean();
    const classDocs = await Classes.find({ teacherIds: teacher?._id }).select('_id');
    const classIds = classDocs.map((item) => item._id);

    const filter = { classId: { $in: classIds } };
    if (status && status !== 'all') filter.status = status;

    const requests = await LeaveRequest.find(filter)
      .populate('student', 'fullName classId')
      .populate('parent', 'fullName phone')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách đơn', error: error.message });
  }
};

exports.updateLeaveRequestStatus = async (req, res) => {
  try {
    const { requestId, status, rejectedReason } = req.body;
    if (!requestId || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Thiếu requestId hoặc trạng thái không hợp lệ' });
    }

    const request = await LeaveRequest.findById(requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });

    const student = await Student.findById(request.student).lean();
    const teacher = await Teacher.findOne({ userId: req.user._id }).lean();
    const classDoc = await Classes.findById(student?.classId).lean();
    const canHandle = classDoc?.teacherIds?.some((id) => id.toString() === teacher?._id?.toString());
    if (!canHandle) return res.status(403).json({ success: false, message: 'Không có quyền xử lý đơn này' });

    request.status = status;
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    request.rejectedReason = status === 'rejected' ? (rejectedReason || '').trim() : '';
    await request.save();

    if (status === 'approved') {
      const dates = eachDateInclusive(request.startDate, request.endDate);
      // Upsert lịch sử điểm danh nghỉ phép theo từng ngày đã duyệt.
      await Promise.all(
        dates.map((d) =>
          Attendance.findOneAndUpdate(
            { studentId: request.student, classId: request.classId, date: d },
            {
              $set: {
                studentId: request.student,
                classId: request.classId,
                date: d,
                status: 'absent',
                note: request.reason,
                absentReason: request.reason,
                isTakeOff: true,
              },
            },
            { upsert: true, new: true },
          ),
        ),
      );
    }

    const title = status === 'approved' ? 'Đơn xin nghỉ đã được duyệt' : 'Đơn xin nghỉ bị từ chối';
    const body = status === 'approved'
      ? `Đơn xin nghỉ của ${student?.fullName || 'học sinh'} đã được giáo viên duyệt.`
      : `Đơn xin nghỉ của ${student?.fullName || 'học sinh'} bị từ chối${request.rejectedReason ? `: ${request.rejectedReason}` : '.'}`;
    await createNotification({
      title,
      body,
      type: 'leave_request',
      targetRole: 'Parent',
      targetUserId: request.parent,
      extra: { leaveRequestId: request._id, status: request.status },
    });

    return res.json({ success: true, message: 'Cập nhật trạng thái thành công', data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái đơn', error: error.message });
  }
};
