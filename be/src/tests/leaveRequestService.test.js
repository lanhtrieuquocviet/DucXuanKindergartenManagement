jest.mock('../models/LeaveRequest', () => {
  const LeaveRequest = jest.fn();
  LeaveRequest.find = jest.fn();
  LeaveRequest.findOne = jest.fn();
  LeaveRequest.findById = jest.fn();
  LeaveRequest.create = jest.fn();
  LeaveRequest.findOneAndUpdate = jest.fn();
  return LeaveRequest;
});
jest.mock('../models/Student');
jest.mock('../models/Classes');
jest.mock('../models/Teacher');
jest.mock('../models/Attendances');
jest.mock('../controller/notification.controller', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

const LeaveRequest = require('../models/LeaveRequest');
const Student = require('../models/Student');
const Classes = require('../models/Classes');
const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendances');

const {
  createLeaveRequest,
  getMyLeaveRequests,
  getTeacherLeaveRequests,
  updateLeaveRequestStatus,
} = require('../services/leaveRequestService');

const mockRes = () => {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};
const mockReq = (body = {}, params = {}, query = {}, user = { _id: 'parent1', id: 'parent1' }) => ({
  body, params, query, user,
});

const makeStudent = (o = {}) => ({
  _id: 'stu1',
  fullName: 'Nguyễn Văn An',
  classId: 'cls1',
  parentId: 'parent1',
  ...o,
});

const makeLeaveRequest = (o = {}) => ({
  _id: 'req1',
  student: 'stu1',
  classId: 'cls1',
  parent: 'parent1',
  startDate: new Date('2026-04-20'),
  endDate: new Date('2026-04-22'),
  reason: 'Bé bị ốm',
  status: 'pending',
  rejectedReason: '',
  save: jest.fn().mockResolvedValue(undefined),
  ...o,
});

const makeClass = (o = {}) => ({
  _id: 'cls1',
  className: 'Lá 1',
  teacherIds: ['teacher1'],
  ...o,
});

// ════════════════════════════════════════════════
// createLeaveRequest
// ════════════════════════════════════════════════
describe('createLeaveRequest', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = {
    studentId: 'stu1',
    startDate: '2026-04-20',
    endDate: '2026-04-22',
    reason: 'Bé bị ốm sốt cao',
  };

  test('UTC001 [N] Tạo đơn xin nghỉ thành công → 201', async () => {
    Student.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeStudent()) });
    LeaveRequest.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    LeaveRequest.create = jest.fn().mockResolvedValue(makeLeaveRequest());
    Classes.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeClass()) });
    Teacher.find = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) });
    const res = mockRes();
    await createLeaveRequest(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] Thiếu studentId → 400', async () => {
    const res = mockRes();
    await createLeaveRequest(mockReq({ startDate: '2026-04-20', endDate: '2026-04-22', reason: 'Bé ốm' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Thiếu startDate → 400', async () => {
    const res = mockRes();
    await createLeaveRequest(mockReq({ studentId: 'stu1', endDate: '2026-04-22', reason: 'Bé ốm' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] Thiếu endDate → 400', async () => {
    const res = mockRes();
    await createLeaveRequest(mockReq({ studentId: 'stu1', startDate: '2026-04-20', reason: 'Bé ốm' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC005 [A] Thiếu reason (chuỗi rỗng) → 400', async () => {
    const res = mockRes();
    await createLeaveRequest(
      mockReq({ studentId: 'stu1', startDate: '2026-04-20', endDate: '2026-04-22', reason: '   ' }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC006 [A] Học sinh không thuộc quyền quản lý → 403', async () => {
    Student.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const res = mockRes();
    await createLeaveRequest(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('UTC007 [A] startDate > endDate → 400', async () => {
    Student.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeStudent()) });
    const res = mockRes();
    await createLeaveRequest(
      mockReq({ ...validBody, startDate: '2026-04-22', endDate: '2026-04-20' }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('nhỏ hơn') }));
  });

  test('UTC008 [A] Đã có đơn trùng thời gian → 400', async () => {
    Student.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeStudent()) });
    LeaveRequest.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeLeaveRequest()) });
    const res = mockRes();
    await createLeaveRequest(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('đã có đơn') }));
  });

  test('UTC009 [B] startDate = endDate (nghỉ 1 ngày) → 201', async () => {
    Student.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeStudent()) });
    LeaveRequest.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    LeaveRequest.create = jest.fn().mockResolvedValue(makeLeaveRequest());
    Classes.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeClass()) });
    Teacher.find = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) });
    const res = mockRes();
    await createLeaveRequest(
      mockReq({ ...validBody, startDate: '2026-04-20', endDate: '2026-04-20' }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('UTC010 [A] DB throw exception → 500', async () => {
    Student.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB error')) });
    const res = mockRes();
    await createLeaveRequest(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getMyLeaveRequests
// ════════════════════════════════════════════════
describe('getMyLeaveRequests', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Lấy danh sách đơn của phụ huynh → 200', async () => {
    LeaveRequest.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([makeLeaveRequest()]),
      }),
    });
    const res = mockRes();
    await getMyLeaveRequests(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.any(Array) }));
  });

  test('UTC002 [N] Không có đơn nào → trả về mảng rỗng', async () => {
    LeaveRequest.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
    });
    const res = mockRes();
    await getMyLeaveRequests(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [] }));
  });

  test('UTC003 [A] DB throw exception → 500', async () => {
    LeaveRequest.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB error')) }),
    });
    const res = mockRes();
    await getMyLeaveRequests(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getTeacherLeaveRequests
// ════════════════════════════════════════════════
describe('getTeacherLeaveRequests', () => {
  beforeEach(() => jest.clearAllMocks());

  const teacherUser = { _id: 'teacher1', id: 'teacher1' };

  const setupTeacherMocks = (status = undefined) => {
    Teacher.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'teacher1' }) });
    Classes.find = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: 'cls1' }]) });
    LeaveRequest.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([makeLeaveRequest()]) }),
      }),
    });
  };

  test('UTC001 [N] Giáo viên lấy đơn xin nghỉ lớp mình → 200', async () => {
    setupTeacherMocks();
    const res = mockRes();
    await getTeacherLeaveRequests(mockReq({}, {}, {}, teacherUser), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [B] Filter theo status=pending → find với filter đúng', async () => {
    setupTeacherMocks('pending');
    const res = mockRes();
    await getTeacherLeaveRequests(mockReq({}, {}, { status: 'pending' }, teacherUser), res);
    expect(LeaveRequest.find).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending' }),
    );
  });

  test('UTC003 [B] status=all → không filter theo status', async () => {
    setupTeacherMocks('all');
    const res = mockRes();
    await getTeacherLeaveRequests(mockReq({}, {}, { status: 'all' }, teacherUser), res);
    const findCall = LeaveRequest.find.mock.calls[0][0];
    expect(findCall).not.toHaveProperty('status');
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    Teacher.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB error')) });
    const res = mockRes();
    await getTeacherLeaveRequests(mockReq({}, {}, {}, teacherUser), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// updateLeaveRequestStatus
// ════════════════════════════════════════════════
describe('updateLeaveRequestStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  const teacherUser = { _id: 'teacher_user1', id: 'teacher_user1' };

  const setupUpdateMocks = (status = 'approved') => {
    const req = makeLeaveRequest({ status: 'pending' });
    LeaveRequest.findById = jest.fn().mockResolvedValue(req);
    Student.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeStudent()) });
    Teacher.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'teacher1' }) });
    Classes.findById = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(makeClass({
        teacherIds: [{ toString: () => 'teacher1' }],
      })),
    });
    Attendance.findOneAndUpdate = jest.fn().mockResolvedValue({});
  };

  test('UTC001 [N] Duyệt đơn thành công → 200', async () => {
    setupUpdateMocks('approved');
    const res = mockRes();
    await updateLeaveRequestStatus(
      mockReq({ requestId: 'req1', status: 'approved' }, {}, {}, teacherUser),
      res,
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [N] Từ chối đơn thành công → 200', async () => {
    setupUpdateMocks('rejected');
    const res = mockRes();
    await updateLeaveRequestStatus(
      mockReq({ requestId: 'req1', status: 'rejected', rejectedReason: 'Lý do từ chối' }, {}, {}, teacherUser),
      res,
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC003 [A] Thiếu requestId → 400', async () => {
    const res = mockRes();
    await updateLeaveRequestStatus(mockReq({ status: 'approved' }, {}, {}, teacherUser), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] Status không hợp lệ → 400', async () => {
    const res = mockRes();
    await updateLeaveRequestStatus(
      mockReq({ requestId: 'req1', status: 'invalidstatus' }, {}, {}, teacherUser),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC005 [A] Không tìm thấy đơn → 404', async () => {
    LeaveRequest.findById = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await updateLeaveRequestStatus(
      mockReq({ requestId: 'notexist', status: 'approved' }, {}, {}, teacherUser),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC006 [A] Giáo viên không phụ trách lớp → 403', async () => {
    LeaveRequest.findById = jest.fn().mockResolvedValue(makeLeaveRequest());
    Student.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeStudent()) });
    Teacher.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'other_teacher' }) });
    Classes.findById = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(makeClass({ teacherIds: [{ toString: () => 'teacher1' }] })),
    });
    const res = mockRes();
    await updateLeaveRequestStatus(
      mockReq({ requestId: 'req1', status: 'approved' }, {}, {}, teacherUser),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('UTC007 [B] Duyệt đơn → tạo attendance "leave" cho từng ngày', async () => {
    setupUpdateMocks('approved');
    const res = mockRes();
    await updateLeaveRequestStatus(
      mockReq({ requestId: 'req1', status: 'approved' }, {}, {}, teacherUser),
      res,
    );
    // endDate - startDate = 2 ngày → 3 lần gọi findOneAndUpdate (20,21,22/04)
    expect(Attendance.findOneAndUpdate).toHaveBeenCalledTimes(3);
  });

  test('UTC008 [A] DB throw exception → 500', async () => {
    LeaveRequest.findById = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await updateLeaveRequestStatus(
      mockReq({ requestId: 'req1', status: 'approved' }, {}, {}, teacherUser),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
