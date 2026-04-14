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

    const from = startOfDay(startDate);
    const to = startOfDay(endDate);
    if (from > to) {
      return res.status(400).json({ success: false, message: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc' });
    }

    const overlapped = await LeaveRequest.findOne({
      student: student._id,
      status: { $in: ['pending', 'approved'] },
      startDate: { $lte: to },
      endDate: { $gte: from },
    }).lean();
    if (overlapped) {
      return res.status(400).json({
        success: false,
        message: 'Khoảng thời gian này đã có đơn xin nghỉ chờ duyệt hoặc đã duyệt',
      });
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
                status: 'leave',
                note: request.reason,
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
