jest.mock('../models/Attendances');
jest.mock('../models/Classes');
jest.mock('../models/Student');
jest.mock('../utils/systemLog', () => ({ createSystemLog: jest.fn().mockResolvedValue(undefined) }));

const Attendances = require('../models/Attendances');
const Classes = require('../models/Classes');
const Students = require('../models/Student');
const {
  upsertAttendance,
  checkoutAttendance,
  getAttendances,
  getClassAttendanceDetail,
  getStudentAttendanceDetail,
  getStudentAttendanceHistory,
} = require('../controller/attendanceController');

const mockRes = () => {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};
const mockReq = (body = {}, params = {}, query = {}) => ({ body, params, query, user: { _id: 'user1' } });

const makeAttendance = (o = {}) => ({
  _id: 'att123',
  studentId: { _id: 'stu1', fullName: 'Nguyễn Văn A', classId: 'cls1' },
  classId: { _id: 'cls1', className: 'Lá 1' },
  date: new Date('2024-01-15'),
  status: 'present',
  time: { checkIn: new Date('2024-01-15T07:00:00Z'), checkOut: null },
  timeString: { checkIn: '07:00', checkOut: '' },
  note: '',
  ...o,
});

const makeStudent = (o = {}) => ({
  _id: 'stu1',
  fullName: 'Nguyễn Văn A',
  classId: { _id: 'cls1', className: 'Lá 1' },
  status: 'active',
  ...o,
});

const makeClass = (o = {}) => ({
  _id: 'cls1',
  className: 'Lá 1',
  gradeId: { gradeName: 'Mẫu giáo lớn' },
  ...o,
});

// ════════════════════════════════════════════════
// upsertAttendance
// ════════════════════════════════════════════════
describe('upsertAttendance', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Điểm danh thành công → 200', async () => {
    Attendances.findOneAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(makeAttendance()),
      }),
    });
    const res = mockRes();
    await upsertAttendance(
      mockReq({ studentId: 'stu1', date: '2024-01-15', status: 'present' }),
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Thiếu studentId → 400', async () => {
    const res = mockRes();
    await upsertAttendance(mockReq({ date: '2024-01-15' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Thiếu date → 400', async () => {
    const res = mockRes();
    await upsertAttendance(mockReq({ studentId: 'stu1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [B] isTakeOff truthy được chuyển thành true', async () => {
    Attendances.findOneAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(makeAttendance()),
      }),
    });
    const res = mockRes();
    await upsertAttendance(
      mockReq({ studentId: 'stu1', date: '2024-01-15', isTakeOff: 1 }),
      res
    );
    expect(Attendances.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ $set: expect.objectContaining({ isTakeOff: true }) }),
      expect.anything()
    );
  });

  test('UTC005 [A] DB throw exception → 500', async () => {
    Attendances.findOneAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('DB error')),
      }),
    });
    const res = mockRes();
    await upsertAttendance(mockReq({ studentId: 'stu1', date: '2024-01-15' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// checkoutAttendance
// ════════════════════════════════════════════════
describe('checkoutAttendance', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Check-out thành công → 200', async () => {
    Attendances.findOneAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(makeAttendance()),
      }),
    });
    const res = mockRes();
    await checkoutAttendance(mockReq({ studentId: 'stu1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Thiếu studentId → 400', async () => {
    const res = mockRes();
    await checkoutAttendance(mockReq({}), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [B] Không truyền date → lấy ngày hiện tại', async () => {
    Attendances.findOneAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(makeAttendance()),
      }),
    });
    const res = mockRes();
    await checkoutAttendance(mockReq({ studentId: 'stu1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    Attendances.findOneAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('DB error')),
      }),
    });
    const res = mockRes();
    await checkoutAttendance(mockReq({ studentId: 'stu1' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getAttendances
// ════════════════════════════════════════════════
describe('getAttendances', () => {
  beforeEach(() => jest.clearAllMocks());

  const makeChain = (result) => ({
    sort: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(result),
      }),
    }),
  });

  test('UTC001 [N] Lấy danh sách điểm danh (không filter) → 200', async () => {
    Attendances.find = jest.fn().mockReturnValue(makeChain([makeAttendance()]));
    const res = mockRes();
    await getAttendances(mockReq({}, {}, {}), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success', total: 1 }));
  });

  test('UTC002 [B] Filter theo studentId → find nhận đúng filter', async () => {
    Attendances.find = jest.fn().mockReturnValue(makeChain([]));
    const res = mockRes();
    await getAttendances(mockReq({}, {}, { studentId: 'stu1' }), res);
    expect(Attendances.find).toHaveBeenCalledWith(expect.objectContaining({ studentId: 'stu1' }));
  });

  test('UTC003 [B] Filter theo date cụ thể → find dùng $gte/$lte', async () => {
    Attendances.find = jest.fn().mockReturnValue(makeChain([]));
    const res = mockRes();
    await getAttendances(mockReq({}, {}, { date: '2024-01-15' }), res);
    expect(Attendances.find).toHaveBeenCalledWith(
      expect.objectContaining({ date: expect.objectContaining({ $gte: expect.any(Date), $lte: expect.any(Date) }) })
    );
  });

  test('UTC004 [B] Filter theo from/to → find dùng $gte/$lte', async () => {
    Attendances.find = jest.fn().mockReturnValue(makeChain([]));
    const res = mockRes();
    await getAttendances(mockReq({}, {}, { from: '2024-01-01', to: '2024-01-31' }), res);
    expect(Attendances.find).toHaveBeenCalledWith(
      expect.objectContaining({ date: expect.objectContaining({ $gte: expect.any(Date), $lte: expect.any(Date) }) })
    );
  });

  test('UTC005 [A] DB throw exception → 500', async () => {
    Attendances.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error('DB error')),
        }),
      }),
    });
    const res = mockRes();
    await getAttendances(mockReq({}, {}, {}), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getClassAttendanceDetail
// ════════════════════════════════════════════════
describe('getClassAttendanceDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Lấy chi tiết điểm danh lớp thành công → 200', async () => {
    Classes.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeClass()) }),
    });
    Students.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([makeStudent()]) }),
    });
    Attendances.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([makeAttendance()]) }),
    });
    Classes.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([makeClass()]) }) }),
    });
    const res = mockRes();
    await getClassAttendanceDetail(mockReq({}, { classId: 'cls1' }, {}), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Không tìm thấy lớp → 404', async () => {
    Classes.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });
    const res = mockRes();
    await getClassAttendanceDetail(mockReq({}, { classId: 'notexist' }, {}), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] DB throw exception → 500', async () => {
    Classes.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB error')) }),
    });
    const res = mockRes();
    await getClassAttendanceDetail(mockReq({}, { classId: 'cls1' }, {}), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getStudentAttendanceDetail
// ════════════════════════════════════════════════
describe('getStudentAttendanceDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Lấy chi tiết điểm danh học sinh thành công → 200', async () => {
    Students.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeStudent()) }),
    });
    Attendances.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeAttendance()) });
    const res = mockRes();
    await getStudentAttendanceDetail(mockReq({}, { studentId: 'stu1' }, {}), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Không tìm thấy học sinh → 404', async () => {
    Students.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });
    const res = mockRes();
    await getStudentAttendanceDetail(mockReq({}, { studentId: 'notexist' }, {}), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [B] Học sinh chưa điểm danh ngày đó → attendance: null', async () => {
    Students.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeStudent()) }),
    });
    Attendances.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const res = mockRes();
    await getStudentAttendanceDetail(mockReq({}, { studentId: 'stu1' }, { date: '2024-01-15' }), res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ attendance: null }) })
    );
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    Students.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB error')) }),
    });
    const res = mockRes();
    await getStudentAttendanceDetail(mockReq({}, { studentId: 'stu1' }, {}), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getStudentAttendanceHistory
// ════════════════════════════════════════════════
describe('getStudentAttendanceHistory', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Lấy lịch sử điểm danh thành công → 200', async () => {
    Students.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeStudent()) }),
    });
    Attendances.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([makeAttendance()]) }),
    });
    const res = mockRes();
    await getStudentAttendanceHistory(mockReq({}, { studentId: 'stu1' }, {}), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Không tìm thấy học sinh → 404', async () => {
    Students.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });
    const res = mockRes();
    await getStudentAttendanceHistory(mockReq({}, { studentId: 'notexist' }, {}), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [B] Tính đúng thống kê: present / absent / late', async () => {
    Students.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeStudent()) }),
    });
    const records = [
      makeAttendance({ status: 'present', timeString: { checkIn: '07:00', checkOut: '17:00' } }),  // đúng giờ
      makeAttendance({ status: 'present', timeString: { checkIn: '07:45', checkOut: '17:00' } }),  // đi trễ
      makeAttendance({ status: 'absent', timeString: { checkIn: '', checkOut: '' } }),
    ];
    Attendances.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(records) }),
    });
    const res = mockRes();
    await getStudentAttendanceHistory(mockReq({}, { studentId: 'stu1' }, {}), res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stats: { totalDays: 3, present: 2, absent: 1, late: 1 },
        }),
      })
    );
  });

  test('UTC004 [B] Filter theo from/to → find nhận đúng filter', async () => {
    Students.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeStudent()) }),
    });
    Attendances.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
    });
    const res = mockRes();
    await getStudentAttendanceHistory(mockReq({}, { studentId: 'stu1' }, { from: '2024-01-01', to: '2024-01-31' }), res);
    expect(Attendances.find).toHaveBeenCalledWith(
      expect.objectContaining({ date: expect.objectContaining({ $gte: expect.any(Date), $lte: expect.any(Date) }) })
    );
  });

  test('UTC005 [A] DB throw exception → 500', async () => {
    Students.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB error')) }),
    });
    const res = mockRes();
    await getStudentAttendanceHistory(mockReq({}, { studentId: 'stu1' }, {}), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
