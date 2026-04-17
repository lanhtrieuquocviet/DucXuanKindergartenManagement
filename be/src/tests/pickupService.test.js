jest.mock('../models/PickupRequest', () => {
  const PickupRequest = jest.fn();
  PickupRequest.find = jest.fn();
  PickupRequest.findOne = jest.fn();
  PickupRequest.findById = jest.fn();
  PickupRequest.create = jest.fn();
  PickupRequest.findByIdAndDelete = jest.fn();
  PickupRequest.findOneAndUpdate = jest.fn();
  return PickupRequest;
});
jest.mock('../models/Student');
jest.mock('../models/Classes');
jest.mock('../models/Teacher');

const PickupRequest = require('../models/PickupRequest');
const Student = require('../models/Student');
const Classes = require('../models/Classes');
const Teacher = require('../models/Teacher');

const {
  createPickupRequest,
  getMyPickupRequests,
  getPickupRequests,
  getApprovedPickupPersonsByStudent,
  updatePickupRequestStatus,
  updateMyPickupRequest,
  deleteMyPickupRequest,
} = require('../services/pickupService');

const mockRes = () => {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};
const mockReq = (body = {}, params = {}, query = {}, user = { _id: '507f1f77bcf86cd799439011', id: '507f1f77bcf86cd799439011', roles: [] }) => ({
  body, params, query, user,
});

const VALID_OID = '507f1f77bcf86cd799439011';
const VALID_OID2 = '507f1f77bcf86cd799439012';

const makeStudent = (o = {}) => ({
  _id: VALID_OID2,
  fullName: 'Nguyễn Văn An',
  classId: 'cls1',
  parentId: VALID_OID,
  ...o,
});

const makePickup = (o = {}) => ({
  _id: VALID_OID,
  student: VALID_OID2,
  classId: 'cls1',
  parent: VALID_OID,
  fullName: 'Trần Thị Bình',
  relation: 'Mẹ',
  phone: '0901234567',
  imageUrl: '',
  status: 'pending',
  save: jest.fn().mockResolvedValue(undefined),
  ...o,
});

const makeClass = (o = {}) => ({
  _id: 'cls1',
  className: 'Lá 1',
  teacherIds: [{ toString: () => 'teacher1' }],
  ...o,
});

// ════════════════════════════════════════════════
// createPickupRequest
// ════════════════════════════════════════════════
describe('createPickupRequest', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = {
    studentId: VALID_OID2,
    fullName: 'Trần Thị Bình',
    relation: 'Mẹ',
    phone: '0901234567',
  };

  const setupCreateMocks = () => {
    Student.findOne = jest.fn().mockResolvedValue(makeStudent({ classId: 'cls1' }));
    PickupRequest.countDocuments = jest.fn().mockResolvedValue(0);
    PickupRequest.findOne = jest.fn().mockResolvedValue(null);
    const pickup = makePickup();
    PickupRequest.mockImplementation(() => pickup);
  };

  test('UTC001 [N] Tạo đăng ký đưa đón thành công → 201', async () => {
    setupCreateMocks();
    const res = mockRes();
    await createPickupRequest(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] Thiếu studentId → 400', async () => {
    const res = mockRes();
    await createPickupRequest(mockReq({ fullName: 'Bình', relation: 'Mẹ', phone: '090' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Thiếu studentId') }));
  });

  test('UTC003 [A] studentId không phải ObjectId hợp lệ → 400', async () => {
    const res = mockRes();
    await createPickupRequest(mockReq({ ...validBody, studentId: 'invalid-id' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('không hợp lệ') }));
  });

  test('UTC004 [A] Học sinh không thuộc quyền quản lý → 403', async () => {
    Student.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await createPickupRequest(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('UTC005 [A] Học sinh chưa được đăng ký lớp → 400', async () => {
    Student.findOne = jest.fn().mockResolvedValue(makeStudent({ classId: null }));
    const res = mockRes();
    await createPickupRequest(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('chưa được đăng ký lớp') }));
  });

  test('UTC006 [A] Đã có 5 người đưa đón → 400', async () => {
    Student.findOne = jest.fn().mockResolvedValue(makeStudent());
    PickupRequest.countDocuments = jest.fn().mockResolvedValue(5);
    const res = mockRes();
    await createPickupRequest(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('tối đa 5') }));
  });

  test('UTC007 [A] Trùng tên, quan hệ và SĐT → 400', async () => {
    Student.findOne = jest.fn().mockResolvedValue(makeStudent());
    PickupRequest.countDocuments = jest.fn().mockResolvedValue(1);
    PickupRequest.findOne = jest.fn().mockResolvedValue(makePickup({ phone: '0901234567' }));
    const res = mockRes();
    await createPickupRequest(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Trùng tên') }));
  });

  test('UTC008 [B] 4 người đưa đón hiện có, thêm 1 nữa được → 201', async () => {
    Student.findOne = jest.fn().mockResolvedValue(makeStudent());
    PickupRequest.countDocuments = jest.fn().mockResolvedValue(4);
    PickupRequest.findOne = jest.fn().mockResolvedValue(null);
    const pickup = makePickup();
    PickupRequest.mockImplementation(() => pickup);
    const res = mockRes();
    await createPickupRequest(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('UTC009 [A] DB throw exception → 500', async () => {
    Student.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await createPickupRequest(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getMyPickupRequests
// ════════════════════════════════════════════════
describe('getMyPickupRequests', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Lấy danh sách đăng ký của phụ huynh → 200', async () => {
    PickupRequest.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([makePickup()]) }),
    });
    const res = mockRes();
    await getMyPickupRequests(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.any(Array) }));
  });

  test('UTC002 [N] Không có đăng ký → trả về mảng rỗng', async () => {
    PickupRequest.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
    });
    const res = mockRes();
    await getMyPickupRequests(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [] }));
  });

  test('UTC003 [A] DB throw exception → 500', async () => {
    PickupRequest.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB error')) }),
    });
    const res = mockRes();
    await getMyPickupRequests(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getPickupRequests
// ════════════════════════════════════════════════
describe('getPickupRequests', () => {
  beforeEach(() => jest.clearAllMocks());

  const teacherUser = { _id: VALID_OID, id: VALID_OID, roles: [] };

  const setupTeacherMocks = () => {
    Teacher.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'teacher1' }) });
    Classes.find = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: 'cls1' }]) });
    PickupRequest.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([makePickup()]) }),
      }),
    });
  };

  test('UTC001 [N] Giáo viên xem đơn lớp mình → 200', async () => {
    setupTeacherMocks();
    const res = mockRes();
    await getPickupRequests(mockReq({}, {}, {}, teacherUser), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [B] Filter theo status=pending → find với filter đúng', async () => {
    setupTeacherMocks();
    const res = mockRes();
    await getPickupRequests(mockReq({}, {}, { status: 'pending' }, teacherUser), res);
    expect(PickupRequest.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
  });

  test('UTC003 [B] status=all → không thêm filter status', async () => {
    setupTeacherMocks();
    const res = mockRes();
    await getPickupRequests(mockReq({}, {}, { status: 'all' }, teacherUser), res);
    const findCall = PickupRequest.find.mock.calls[0][0];
    expect(findCall).not.toHaveProperty('status');
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    Teacher.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB error')) });
    const res = mockRes();
    await getPickupRequests(mockReq({}, {}, {}, teacherUser), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getApprovedPickupPersonsByStudent
// ════════════════════════════════════════════════
describe('getApprovedPickupPersonsByStudent', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] SchoolAdmin xem được danh sách → 200', async () => {
    Student.findById = jest.fn().mockResolvedValue(makeStudent());
    PickupRequest.find = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue([makePickup({ status: 'approved' })]),
    });
    const res = mockRes();
    await getApprovedPickupPersonsByStudent(
      mockReq({}, { studentId: VALID_OID2 }, {}, { _id: VALID_OID, roles: ['SchoolAdmin'] }),
      res,
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] Không tìm thấy học sinh → 404', async () => {
    Student.findById = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await getApprovedPickupPersonsByStudent(
      mockReq({}, { studentId: VALID_OID2 }, {}, { _id: VALID_OID, roles: ['SchoolAdmin'] }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] Teacher không phụ trách lớp → 403', async () => {
    Student.findById = jest.fn().mockResolvedValue(makeStudent());
    Teacher.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'other_teacher' }) });
    Classes.findById = jest.fn().mockResolvedValue(makeClass({
      teacherIds: [{ toString: () => 'teacher1' }],
    }));
    const res = mockRes();
    await getApprovedPickupPersonsByStudent(
      mockReq({}, { studentId: VALID_OID2 }, {}, { _id: VALID_OID, roles: [] }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    Student.findById = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await getApprovedPickupPersonsByStudent(
      mockReq({}, { studentId: VALID_OID2 }, {}, { _id: VALID_OID, roles: ['SchoolAdmin'] }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// updatePickupRequestStatus
// ════════════════════════════════════════════════
describe('updatePickupRequestStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  const teacherUser = { _id: VALID_OID, id: VALID_OID, roles: [] };

  const setupUpdateMocks = () => {
    PickupRequest.findById = jest.fn().mockResolvedValue(makePickup());
    Student.findById = jest.fn().mockResolvedValue(makeStudent());
    Teacher.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'teacher1' }) });
    Classes.findById = jest.fn().mockResolvedValue(makeClass({
      teacherIds: [{ toString: () => 'teacher1' }],
    }));
  };

  test('UTC001 [N] Duyệt đăng ký thành công → 200', async () => {
    setupUpdateMocks();
    const res = mockRes();
    await updatePickupRequestStatus(
      mockReq({ requestId: VALID_OID, status: 'approved' }, {}, {}, teacherUser),
      res,
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [N] Từ chối đăng ký → 200', async () => {
    setupUpdateMocks();
    const res = mockRes();
    await updatePickupRequestStatus(
      mockReq({ requestId: VALID_OID, status: 'rejected', rejectedReason: 'Không hợp lệ' }, {}, {}, teacherUser),
      res,
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC003 [A] Thiếu requestId → 400', async () => {
    const res = mockRes();
    await updatePickupRequestStatus(mockReq({ status: 'approved' }, {}, {}, teacherUser), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] Status không hợp lệ → 400', async () => {
    const res = mockRes();
    await updatePickupRequestStatus(
      mockReq({ requestId: VALID_OID, status: 'invalidstatus' }, {}, {}, teacherUser),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC005 [A] Không tìm thấy đăng ký → 404', async () => {
    PickupRequest.findById = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await updatePickupRequestStatus(
      mockReq({ requestId: VALID_OID, status: 'approved' }, {}, {}, teacherUser),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC006 [A] Teacher không phụ trách lớp → 403', async () => {
    PickupRequest.findById = jest.fn().mockResolvedValue(makePickup());
    Student.findById = jest.fn().mockResolvedValue(makeStudent());
    Teacher.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'other_teacher' }) });
    Classes.findById = jest.fn().mockResolvedValue(makeClass({
      teacherIds: [{ toString: () => 'teacher1' }],
    }));
    const res = mockRes();
    await updatePickupRequestStatus(
      mockReq({ requestId: VALID_OID, status: 'approved' }, {}, {}, teacherUser),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('UTC007 [A] DB throw exception → 500', async () => {
    PickupRequest.findById = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await updatePickupRequestStatus(
      mockReq({ requestId: VALID_OID, status: 'approved' }, {}, {}, teacherUser),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// updateMyPickupRequest
// ════════════════════════════════════════════════
describe('updateMyPickupRequest', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = { fullName: 'Trần Thị Bình', relation: 'Mẹ', phone: '0901234567' };

  test('UTC001 [N] Cập nhật đăng ký thành công → 200', async () => {
    PickupRequest.findOne = jest.fn().mockResolvedValue(makePickup({ status: 'pending', student: VALID_OID2 }));
    PickupRequest.findOne.mockResolvedValueOnce(makePickup({ status: 'pending', student: VALID_OID2 }))
                         .mockResolvedValueOnce(null); // no duplicate
    const res = mockRes();
    await updateMyPickupRequest(mockReq(validBody, { id: VALID_OID }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] Thiếu fullName → 400', async () => {
    const res = mockRes();
    await updateMyPickupRequest(mockReq({ relation: 'Mẹ', phone: '090' }, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('họ tên') }));
  });

  test('UTC003 [A] Thiếu phone → 400', async () => {
    const res = mockRes();
    await updateMyPickupRequest(mockReq({ fullName: 'Bình', relation: 'Mẹ' }, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('số điện thoại') }));
  });

  test('UTC004 [A] Thiếu relation → 400', async () => {
    const res = mockRes();
    await updateMyPickupRequest(mockReq({ fullName: 'Bình', phone: '090' }, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('mối quan hệ') }));
  });

  test('UTC005 [B] fullName > 50 ký tự → 400', async () => {
    const res = mockRes();
    await updateMyPickupRequest(
      mockReq({ fullName: 'T'.repeat(51), relation: 'Mẹ', phone: '090' }, { id: VALID_OID }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('50 ký tự') }));
  });

  test('UTC006 [A] Không tìm thấy đăng ký → 404', async () => {
    PickupRequest.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await updateMyPickupRequest(mockReq(validBody, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC007 [A] Đăng ký không ở trạng thái pending → 400', async () => {
    PickupRequest.findOne = jest.fn().mockResolvedValue(makePickup({ status: 'approved' }));
    const res = mockRes();
    await updateMyPickupRequest(mockReq(validBody, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('chờ duyệt') }));
  });

  test('UTC008 [A] DB throw exception → 500', async () => {
    PickupRequest.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await updateMyPickupRequest(mockReq(validBody, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// deleteMyPickupRequest
// ════════════════════════════════════════════════
describe('deleteMyPickupRequest', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Hủy đăng ký thành công → 200', async () => {
    PickupRequest.findOne = jest.fn().mockResolvedValue(makePickup({ status: 'pending' }));
    PickupRequest.deleteOne = jest.fn().mockResolvedValue({});
    const res = mockRes();
    await deleteMyPickupRequest(mockReq({}, { id: VALID_OID }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] Không tìm thấy đăng ký → 404', async () => {
    PickupRequest.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await deleteMyPickupRequest(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] Đăng ký không ở trạng thái pending → 400', async () => {
    PickupRequest.findOne = jest.fn().mockResolvedValue(makePickup({ status: 'approved' }));
    const res = mockRes();
    await deleteMyPickupRequest(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('chờ duyệt') }));
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    PickupRequest.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await deleteMyPickupRequest(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
