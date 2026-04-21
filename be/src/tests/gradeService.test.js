jest.mock('../models/Grade');
jest.mock('../models/Classes');
jest.mock('../models/Student');
jest.mock('../models/Teacher');
jest.mock('../models/StaticBlock');
jest.mock('../models/AcademicYear');

const Grade = require('../models/Grade');
const Classes = require('../models/Classes');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const StaticBlock = require('../models/StaticBlock');
const AcademicYear = require('../models/AcademicYear');

const { listGrades, createGrade, updateGrade, deleteGrade } = require('../services/gradeService');

const mockRes = () => {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};
const mockReq = (body = {}, params = {}) => ({ body, params });

const makeGrade = (o = {}) => ({
  _id: 'grade1',
  gradeName: 'Mẫu giáo lớn',
  description: 'Lớp lớn',
  maxClasses: 10,
  minAge: 5,
  maxAge: 6,
  headTeacherId: null,
  academicYearId: 'yr1',
  staticBlockId: 'sb1',
  set: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
  ...o,
});

const makeActiveYear = () => ({ _id: 'yr1', yearName: '2025-2026', startDate: new Date('2025-09-01') });

const makeStaticBlock = (o = {}) => ({
  _id: 'sb1',
  name: 'Mẫu giáo lớn',
  description: 'Lớp lớn',
  maxClasses: 5,
  minAge: 5,
  maxAge: 6,
  ...o,
});

// ════════════════════════════════════════════════
// listGrades
// ════════════════════════════════════════════════
describe('listGrades', () => {
  beforeEach(() => jest.clearAllMocks());

  const setupListMocks = (year = makeActiveYear(), grades = [makeGrade()]) => {
    Grade.updateMany = jest.fn().mockResolvedValue({});
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(year) }),
    });
    Grade.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(grades) }),
        }),
      }),
    });
    Classes.find = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      }),
    });
    Student.aggregate = jest.fn().mockResolvedValue([]);
  };

  test('UTC001 [N] Lấy danh sách khối lớp thành công → 200', async () => {
    setupListMocks();
    const res = mockRes();
    await listGrades(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [N] Không có năm học đang hoạt động → 200 mảng rỗng', async () => {
    Grade.updateMany = jest.fn().mockResolvedValue({});
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });
    const res = mockRes();
    await listGrades(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [] }));
  });

  test('UTC003 [N] Danh sách khối rỗng → 200 mảng rỗng', async () => {
    setupListMocks(makeActiveYear(), []);
    const res = mockRes();
    await listGrades(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [] }));
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    Grade.updateMany = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await listGrades(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// createGrade
// ════════════════════════════════════════════════
describe('createGrade', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = { staticBlockId: 'sb1' };

  const setupCreateMocks = () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeActiveYear()) }),
    });
    StaticBlock.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeStaticBlock()) });
    Grade.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    Grade.create = jest.fn().mockResolvedValue(makeGrade());
    Grade.updateOne = jest.fn().mockResolvedValue({});
    Grade.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(makeGrade()),
        }),
      }),
    });
  };

  test('UTC001 [N] Tạo khối lớp thành công → 201', async () => {
    setupCreateMocks();
    const res = mockRes();
    await createGrade(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Thiếu staticBlockId → 400', async () => {
    const res = mockRes();
    await createGrade(mockReq({}), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('bắt buộc') }));
  });

  test('UTC003 [A] Không có năm học đang hoạt động → 400', async () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });
    const res = mockRes();
    await createGrade(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('năm học') }));
  });

  test('UTC004 [A] StaticBlock không tồn tại → 400', async () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeActiveYear()) }),
    });
    StaticBlock.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const res = mockRes();
    await createGrade(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('không tồn tại') }));
  });

  test('UTC005 [A] Danh mục khối đã được tạo trong năm học → 400', async () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeActiveYear()) }),
    });
    StaticBlock.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeStaticBlock()) });
    Grade.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeGrade()) });
    const res = mockRes();
    await createGrade(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('đã được tạo') }));
  });

  test('UTC006 [A] staticBlock.maxClasses = 0 (ngoài phạm vi) → 400', async () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeActiveYear()) }),
    });
    StaticBlock.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeStaticBlock({ maxClasses: 0 })) });
    Grade.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const res = mockRes();
    await createGrade(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('1 đến 10') }));
  });

  test('UTC007 [A] Head teacher đã là tổ trưởng khối khác → 400', async () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeActiveYear()) }),
    });
    StaticBlock.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeStaticBlock()) });
    Grade.findOne = jest.fn()
      .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) })
      .mockReturnValue({ lean: jest.fn().mockResolvedValue(makeGrade({ gradeName: 'Mẫu giáo bé' })) });
    const res = mockRes();
    await createGrade(mockReq({ ...validBody, headTeacherId: 'teacher1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('tổ trưởng') }));
  });

  test('UTC008 [A] DB throw exception → 500', async () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB error')) }),
    });
    const res = mockRes();
    await createGrade(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// updateGrade
// ════════════════════════════════════════════════
describe('updateGrade', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Cập nhật maxClasses thành công → 200', async () => {
    Grade.findById = jest.fn().mockResolvedValue(makeGrade({ maxClasses: 5 }));
    Classes.countDocuments = jest.fn().mockResolvedValue(3);
    Grade.updateOne = jest.fn().mockResolvedValue({});
    const res = mockRes();
    await updateGrade(mockReq({ maxClasses: 8 }, { id: 'grade1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Không tìm thấy khối lớp → 404', async () => {
    Grade.findById = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await updateGrade(mockReq({ maxClasses: 5 }, { id: 'notexist' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] Cố thay đổi gradeName → 400', async () => {
    Grade.findById = jest.fn().mockResolvedValue(makeGrade({ gradeName: 'Tên cũ' }));
    const res = mockRes();
    await updateGrade(mockReq({ gradeName: 'Tên mới' }, { id: 'grade1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Chỉ được phép') }));
  });

  test('UTC004 [A] maxClasses < số lớp hiện tại → 400', async () => {
    Grade.findById = jest.fn().mockResolvedValue(makeGrade({ maxClasses: 5 }));
    Classes.countDocuments = jest.fn().mockResolvedValue(4);
    const res = mockRes();
    await updateGrade(mockReq({ maxClasses: 2 }, { id: 'grade1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('đang có') }));
  });

  test('UTC005 [A] maxClasses > 10 → 400', async () => {
    Grade.findById = jest.fn().mockResolvedValue(makeGrade());
    const res = mockRes();
    await updateGrade(mockReq({ maxClasses: 11 }, { id: 'grade1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC006 [A] Head teacher đã là tổ trưởng khối khác → 400', async () => {
    Grade.findById = jest.fn().mockResolvedValue(makeGrade({ headTeacherId: null }));
    Grade.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeGrade({ _id: 'grade2', gradeName: 'Mẫu giáo bé' })) });
    const res = mockRes();
    await updateGrade(mockReq({ headTeacherId: 'teacher1' }, { id: 'grade1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('tổ trưởng') }));
  });

  test('UTC007 [A] DB throw exception → 500', async () => {
    Grade.findById = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await updateGrade(mockReq({ maxClasses: 5 }, { id: 'grade1' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// deleteGrade
// ════════════════════════════════════════════════
describe('deleteGrade', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Xóa khối lớp thành công → 200', async () => {
    Grade.findById = jest.fn().mockResolvedValue(makeGrade());
    Classes.countDocuments = jest.fn().mockResolvedValue(0);
    Grade.findByIdAndDelete = jest.fn().mockResolvedValue(makeGrade());
    const res = mockRes();
    await deleteGrade(mockReq({}, { id: 'grade1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Không tìm thấy khối lớp → 404', async () => {
    Grade.findById = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await deleteGrade(mockReq({}, { id: 'notexist' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] Khối lớp đang có lớp học liên kết → 400', async () => {
    Grade.findById = jest.fn().mockResolvedValue(makeGrade());
    Classes.countDocuments = jest.fn().mockResolvedValue(3);
    const res = mockRes();
    await deleteGrade(mockReq({}, { id: 'grade1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('lớp học liên kết') }));
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    Grade.findById = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await deleteGrade(mockReq({}, { id: 'grade1' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
