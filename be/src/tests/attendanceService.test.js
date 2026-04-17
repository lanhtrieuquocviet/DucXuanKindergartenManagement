jest.mock('../models/Attendances');
jest.mock('../models/Classes');
jest.mock('../models/Student');
jest.mock('../models/Grade', () => ({ findOne: jest.fn() }));
jest.mock('../utils/systemLog', () => ({
  createSystemLog: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../controller/notification.controller', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

const Attendances = require('../models/Attendances');
const Classes = require('../models/Classes');
const Students = require('../models/Student');
const Grade = require('../models/Grade');
const { createNotification } = require('../controller/notification.controller');

const {
  upsertAttendance,
  checkoutAttendance,
  getAttendances,
  getAttendanceOverview,
  getClassAttendanceDetail,
  getStudentAttendanceDetail,
  getStudentAttendanceHistory,
  getAttendanceExportData,
} = require('../services/attendanceService');

const mockRes = () => {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};
const mockReq = (body = {}, params = {}, query = {}) => ({ body, params, query });

const makeAtt = (o = {}) => ({
  _id: 'att1',
  studentId: { _id: 'stu1', fullName: 'Nguyễn Văn An', classId: 'cls1', parentId: 'parent1' },
  classId: { _id: 'cls1', className: 'Lá 1' },
  date: new Date('2026-04-17'),
  status: 'present',
  time: { checkIn: new Date('2026-04-17T07:00:00.000Z'), checkOut: null },
  timeString: { checkIn: '07:00', checkOut: '' },
  absentReason: '',
  ...o,
});

const makeStudent = (o = {}) => ({
  _id: 'stu1',
  fullName: 'Nguyễn Văn An',
  classId: { _id: 'cls1', className: 'Lá 1' },
  ...o,
});

const makeClass = (o = {}) => ({
  _id: 'cls1',
  className: 'Lá 1',
  gradeId: { _id: 'grade1', gradeName: 'Mầm' },
  ...o,
});

// ════════════════════════════════════════════════
// upsertAttendance
// ════════════════════════════════════════════════
describe('upsertAttendance', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = { studentId: 'stu1', date: '2026-04-17', status: 'present' };

  const setupMock = (attOverride = {}) => {
    Attendances.findOneAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(makeAtt(attOverride)),
      }),
    });
  };

  test('UTC001 [N] Điểm danh check-in thành công → 200', async () => {
    setupMock();
    const res = mockRes();
    await upsertAttendance(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Thiếu studentId → 400', async () => {
    const res = mockRes();
    await upsertAttendance(mockReq({ date: '2026-04-17' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Thiếu date → 400', async () => {
    const res = mockRes();
    await upsertAttendance(mockReq({ studentId: 'stu1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [N] Status "absent" → gửi thông báo vắng mặt cho phụ huynh', async () => {
    setupMock({ status: 'absent' });
    const res = mockRes();
    await upsertAttendance(mockReq({ ...validBody, status: 'absent' }), res);
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'attendance_absent' }),
    );
  });

  test('UTC005 [B] Học sinh không có parentId → không gửi thông báo', async () => {
    setupMock({
      studentId: { _id: 'stu1', fullName: 'An', classId: 'cls1', parentId: null },
    });
    const res = mockRes();
    await upsertAttendance(mockReq(validBody), res);
    expect(createNotification).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('UTC006 [A] DB throw exception → 500', async () => {
    Attendances.findOneAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('DB error')),
      }),
    });
    const res = mockRes();
    await upsertAttendance(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// checkoutAttendance
// ════════════════════════════════════════════════
describe('checkoutAttendance', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = { studentId: 'stu1', date: '2026-04-17' };

  const checkedInRecord = {
    timeString: { checkIn: '07:00', checkOut: '' },
    time: { checkIn: new Date('2026-04-17T07:00:00.000Z'), checkOut: null },
  };

  const setupCheckoutMock = () => {
    Attendances.findOne = jest.fn().mockResolvedValue(checkedInRecord);
    Attendances.findOneAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(
          makeAtt({ timeString: { checkIn: '07:00', checkOut: '16:00' } }),
        ),
      }),
    });
  };

  test('UTC001 [N] Check-out thành công → 200', async () => {
    setupCheckoutMock();
    const res = mockRes();
    await checkoutAttendance(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Thiếu studentId → 400', async () => {
    const res = mockRes();
    await checkoutAttendance(mockReq({}), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Chưa có bản ghi điểm danh đến → 400', async () => {
    Attendances.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await checkoutAttendance(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('chưa điểm danh đến') }),
    );
  });

  test('UTC004 [A] Đã điểm danh về rồi → 400', async () => {
    Attendances.findOne = jest.fn().mockResolvedValue({
      timeString: { checkIn: '07:00' },
      time: { checkIn: new Date(), checkOut: new Date() },
    });
    const res = mockRes();
    await checkoutAttendance(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('đã điểm danh về') }),
    );
  });

  test('UTC005 [B] Không truyền date → dùng ngày hiện tại, vẫn trả 200', async () => {
    setupCheckoutMock();
    const res = mockRes();
    await checkoutAttendance(mockReq({ studentId: 'stu1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('UTC006 [A] DB throw exception → 500', async () => {
    Attendances.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await checkoutAttendance(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getAttendances
// ════════════════════════════════════════════════
describe('getAttendances', () => {
  beforeEach(() => jest.clearAllMocks());

  const setupFindMock = (result = [makeAtt()]) => {
    Attendances.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(result),
        }),
      }),
    });
  };

  test('UTC001 [N] Lấy danh sách điểm danh thành công → 200', async () => {
    setupFindMock();
    const res = mockRes();
    await getAttendances(mockReq({}, {}, {}), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success', data: expect.any(Array) }),
    );
  });

  test('UTC002 [N] Lọc theo date → filter.date có $gte và $lte', async () => {
    setupFindMock();
    const res = mockRes();
    await getAttendances(mockReq({}, {}, { date: '2026-04-17' }), res);
    const filter = Attendances.find.mock.calls[0][0];
    expect(filter.date).toHaveProperty('$gte');
    expect(filter.date).toHaveProperty('$lte');
  });

  test('UTC003 [B] Lọc theo from/to → filter.date có $gte và $lte', async () => {
    setupFindMock();
    const res = mockRes();
    await getAttendances(mockReq({}, {}, { from: '2026-04-01', to: '2026-04-17' }), res);
    const filter = Attendances.find.mock.calls[0][0];
    expect(filter.date.$gte).toBeDefined();
    expect(filter.date.$lte).toBeDefined();
  });

  test('UTC004 [N] Không có bản ghi → data=[], total=0', async () => {
    setupFindMock([]);
    const res = mockRes();
    await getAttendances(mockReq({}, {}, {}), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [], total: 0 }));
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
    await getAttendances(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getAttendanceOverview
// ════════════════════════════════════════════════
describe('getAttendanceOverview', () => {
  beforeEach(() => jest.clearAllMocks());

  const VALID_OID = '507f1f77bcf86cd799439011';

  const setupOverviewMock = ({ classesData = [makeClass()], attData = [], totalStudents = 5 } = {}) => {
    Classes.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(classesData),
      }),
    });
    Attendances.find = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(attData),
    });
    Students.countDocuments = jest.fn().mockResolvedValue(totalStudents);
  };

  test('UTC001 [N] Lấy overview thành công (không filter) → 200', async () => {
    setupOverviewMock();
    const res = mockRes();
    await getAttendanceOverview(mockReq({}, {}, {}), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [B] gradeId là ObjectId hợp lệ → classFilter.gradeId = gradeId', async () => {
    setupOverviewMock();
    const res = mockRes();
    await getAttendanceOverview(mockReq({}, {}, { gradeId: VALID_OID }), res);
    const classFilter = Classes.find.mock.calls[0][0];
    expect(classFilter).toHaveProperty('gradeId', VALID_OID);
  });

  test('UTC003 [B] Filter status=complete → chỉ trả lớp đủ học sinh (present=totalStudents, absent=0)', async () => {
    Classes.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([makeClass()]),
      }),
    });
    Attendances.find = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { classId: 'cls1', status: 'present', time: { checkIn: new Date(), checkOut: new Date() } },
        { classId: 'cls1', status: 'present', time: { checkIn: new Date(), checkOut: new Date() } },
        { classId: 'cls1', status: 'present', time: { checkIn: new Date(), checkOut: new Date() } },
        { classId: 'cls1', status: 'present', time: { checkIn: new Date(), checkOut: new Date() } },
        { classId: 'cls1', status: 'present', time: { checkIn: new Date(), checkOut: new Date() } },
      ]),
    });
    Students.countDocuments = jest.fn().mockResolvedValue(5);
    const res = mockRes();
    await getAttendanceOverview(mockReq({}, {}, { status: 'complete' }), res);
    const body = res.json.mock.calls[0][0];
    expect(body.data.classes.length).toBe(1);
  });

  test('UTC004 [B] Filter status=monitoring → trả lớp có học sinh chưa checkout', async () => {
    Classes.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([makeClass()]),
      }),
    });
    Attendances.find = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { classId: 'cls1', status: 'present', time: { checkIn: new Date(), checkOut: null } },
      ]),
    });
    Students.countDocuments = jest.fn().mockResolvedValue(5);
    const res = mockRes();
    await getAttendanceOverview(mockReq({}, {}, { status: 'monitoring' }), res);
    const body = res.json.mock.calls[0][0];
    expect(body.data.classes.length).toBe(1);
  });

  test('UTC005 [A] DB throw exception → 500', async () => {
    Classes.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('DB error')),
      }),
    });
    const res = mockRes();
    await getAttendanceOverview(mockReq({}, {}, {}), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getClassAttendanceDetail
// ════════════════════════════════════════════════
describe('getClassAttendanceDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  const setupDetailMock = ({
    classInfo = makeClass(),
    students = [makeStudent()],
    atts = [makeAtt()],
    allClasses = [makeClass()],
  } = {}) => {
    Classes.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(classInfo),
      }),
    });
    Students.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(students),
      }),
    });
    Attendances.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(atts),
      }),
    });
    Classes.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(allClasses),
        }),
      }),
    });
  };

  test('UTC001 [N] Lấy chi tiết điểm danh lớp thành công → 200', async () => {
    setupDetailMock();
    const res = mockRes();
    await getClassAttendanceDetail(mockReq({}, { classId: 'cls1' }, {}), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Thiếu classId → 400', async () => {
    const res = mockRes();
    await getClassAttendanceDetail(mockReq({}, {}, {}), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Lớp không tồn tại → 404', async () => {
    Classes.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });
    const res = mockRes();
    await getClassAttendanceDetail(mockReq({}, { classId: 'cls999' }, {}), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC004 [N] Học sinh không có bản ghi điểm danh → attendance=null', async () => {
    setupDetailMock({ atts: [] });
    const res = mockRes();
    await getClassAttendanceDetail(mockReq({}, { classId: 'cls1' }, {}), res);
    const body = res.json.mock.calls[0][0];
    expect(body.data.students[0].attendance).toBeNull();
  });

  test('UTC005 [A] DB throw exception → 500', async () => {
    Classes.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('DB error')),
      }),
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

  const setupDetailMock = ({ student = makeStudent(), att = makeAtt() } = {}) => {
    Students.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(student),
      }),
    });
    Attendances.findOne = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(att),
    });
  };

  test('UTC001 [N] Lấy chi tiết điểm danh học sinh thành công → 200', async () => {
    setupDetailMock();
    const res = mockRes();
    await getStudentAttendanceDetail(mockReq({}, { studentId: 'stu1' }, {}), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Thiếu studentId → 400', async () => {
    const res = mockRes();
    await getStudentAttendanceDetail(mockReq({}, {}, {}), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Học sinh không tồn tại → 404', async () => {
    Students.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });
    const res = mockRes();
    await getStudentAttendanceDetail(mockReq({}, { studentId: 'stu999' }, {}), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC004 [N] Không có bản ghi điểm danh trong ngày → attendance=null', async () => {
    setupDetailMock({ att: null });
    const res = mockRes();
    await getStudentAttendanceDetail(mockReq({}, { studentId: 'stu1' }, {}), res);
    const body = res.json.mock.calls[0][0];
    expect(body.data.attendance).toBeNull();
  });

  test('UTC005 [A] DB throw exception → 500', async () => {
    Students.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('DB error')),
      }),
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

  const setupHistoryMock = (atts = [makeAtt()]) => {
    Students.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(makeStudent()),
      }),
    });
    Attendances.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(atts),
      }),
    });
  };

  test('UTC001 [N] Lấy lịch sử thành công → 200 + có stats', async () => {
    setupHistoryMock();
    const res = mockRes();
    await getStudentAttendanceHistory(mockReq({}, { studentId: 'stu1' }, {}), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ stats: expect.any(Object) }) }),
    );
  });

  test('UTC002 [A] Thiếu studentId → 400', async () => {
    const res = mockRes();
    await getStudentAttendanceHistory(mockReq({}, {}, {}), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Học sinh không tồn tại → 404', async () => {
    Students.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });
    const res = mockRes();
    await getStudentAttendanceHistory(mockReq({}, { studentId: 'stu999' }, {}), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC004 [N] Không có lịch sử → stats đều = 0', async () => {
    setupHistoryMock([]);
    const res = mockRes();
    await getStudentAttendanceHistory(mockReq({}, { studentId: 'stu1' }, {}), res);
    const body = res.json.mock.calls[0][0];
    expect(body.data.stats).toEqual({ totalDays: 0, present: 0, absent: 0, late: 0 });
  });

  test('UTC005 [B] Có điểm danh đến trễ (sau 08:30) → late=1', async () => {
    const lateAtt = makeAtt({ timeString: { checkIn: '09:00', checkOut: '16:00' } });
    setupHistoryMock([lateAtt]);
    const res = mockRes();
    await getStudentAttendanceHistory(mockReq({}, { studentId: 'stu1' }, {}), res);
    const body = res.json.mock.calls[0][0];
    expect(body.data.stats.late).toBe(1);
  });

  test('UTC006 [B] Lọc theo from/to → filter.date có $gte và $lte', async () => {
    setupHistoryMock();
    const res = mockRes();
    await getStudentAttendanceHistory(
      mockReq({}, { studentId: 'stu1' }, { from: '2026-04-01', to: '2026-04-17' }),
      res,
    );
    const filter = Attendances.find.mock.calls[0][0];
    expect(filter.date.$gte).toBeDefined();
    expect(filter.date.$lte).toBeDefined();
  });

  test('UTC007 [A] DB throw exception → 500', async () => {
    Students.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('DB error')),
      }),
    });
    const res = mockRes();
    await getStudentAttendanceHistory(mockReq({}, { studentId: 'stu1' }, {}), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getAttendanceExportData
// ════════════════════════════════════════════════
describe('getAttendanceExportData', () => {
  beforeEach(() => jest.clearAllMocks());

  const setupExportMock = (atts = [makeAtt()]) => {
    Attendances.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(atts),
          }),
        }),
      }),
    });
  };

  test('UTC001 [N] Xuất dữ liệu thành công → 200 + data có đủ trường', async () => {
    setupExportMock();
    const res = mockRes();
    await getAttendanceExportData(mockReq({}, {}, { from: '2026-04-01', to: '2026-04-17' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.data[0]).toHaveProperty('className');
    expect(body.data[0]).toHaveProperty('status');
  });

  test('UTC002 [A] Thiếu from → 400', async () => {
    const res = mockRes();
    await getAttendanceExportData(mockReq({}, {}, { to: '2026-04-17' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Thiếu to → 400', async () => {
    const res = mockRes();
    await getAttendanceExportData(mockReq({}, {}, { from: '2026-04-01' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [B] Lọc thêm theo classId → filter chứa classId', async () => {
    setupExportMock();
    const res = mockRes();
    await getAttendanceExportData(
      mockReq({}, {}, { from: '2026-04-01', to: '2026-04-17', classId: 'cls1' }),
      res,
    );
    const filter = Attendances.find.mock.calls[0][0];
    expect(filter).toHaveProperty('classId', 'cls1');
  });

  test('UTC005 [A] DB throw exception → 500', async () => {
    Attendances.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      }),
    });
    const res = mockRes();
    await getAttendanceExportData(mockReq({}, {}, { from: '2026-04-01', to: '2026-04-17' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
