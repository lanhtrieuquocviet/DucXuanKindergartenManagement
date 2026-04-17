jest.mock('../models/Grade');
jest.mock('../models/Classes');
jest.mock('../models/Student');
jest.mock('../models/Teacher');

const Grade = require('../models/Grade');
const Classes = require('../models/Classes');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

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
  set: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
  ...o,
});

// ════════════════════════════════════════════════
// listGrades
// ════════════════════════════════════════════════
describe('listGrades', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Lấy danh sách khối lớp thành công → 200', async () => {
    Grade.updateMany = jest.fn().mockResolvedValue({});
    Grade.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([makeGrade()]) }),
      }),
    });
    Classes.find = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      }),
    });
    Student.aggregate = jest.fn().mockResolvedValue([]);
    const res = mockRes();
    await listGrades(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [N] Danh sách khối rỗng → 200 mảng rỗng', async () => {
    Grade.updateMany = jest.fn().mockResolvedValue({});
    Grade.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      }),
    });
    Classes.find = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      }),
    });
    Student.aggregate = jest.fn().mockResolvedValue([]);
    const res = mockRes();
    await listGrades(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [] }));
  });

  test('UTC003 [A] DB throw exception → 500', async () => {
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

  const validBody = { gradeName: 'Nhà trẻ', description: 'Lớp nhỏ nhất', maxClasses: 3, minAge: 2, maxAge: 4 };

  const setupCreateMocks = (existingGrade = null, headConflict = null) => {
    Grade.findOne = jest.fn()
      .mockResolvedValueOnce(existingGrade)   // check existing name
      .mockResolvedValueOnce(headConflict);   // check head teacher conflict
    Grade.create = jest.fn().mockResolvedValue(makeGrade({ ...validBody }));
    Grade.updateOne = jest.fn().mockResolvedValue({});
  };

  test('UTC001 [N] Tạo khối lớp thành công → 201', async () => {
    setupCreateMocks();
    const res = mockRes();
    await createGrade(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Thiếu gradeName → 400', async () => {
    const res = mockRes();
    await createGrade(mockReq({ description: 'abc' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('không được để trống') }));
  });

  test('UTC003 [A] gradeName chỉ khoảng trắng → 400', async () => {
    const res = mockRes();
    await createGrade(mockReq({ gradeName: '   ' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [B] gradeName > 10 ký tự → 400', async () => {
    const res = mockRes();
    await createGrade(mockReq({ gradeName: 'Tên quá dài cho khối' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('10 ký tự') }));
  });

  test('UTC005 [B] description > 50 ký tự → 400', async () => {
    const res = mockRes();
    await createGrade(mockReq({ gradeName: 'NT', description: 'a'.repeat(51) }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('50 ký tự') }));
  });

  test('UTC006 [A] maxClasses < 1 → 400', async () => {
    const res = mockRes();
    await createGrade(mockReq({ gradeName: 'NT', maxClasses: 0 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('1 đến 10') }));
  });

  test('UTC007 [A] maxClasses > 10 → 400', async () => {
    const res = mockRes();
    await createGrade(mockReq({ gradeName: 'NT', maxClasses: 11 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('1 đến 10') }));
  });

  test('UTC008 [A] Tên khối lớp đã tồn tại → 400', async () => {
    Grade.findOne = jest.fn().mockResolvedValue(makeGrade({ gradeName: 'Nhà trẻ' }));
    const res = mockRes();
    await createGrade(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('đã tồn tại') }));
  });

  test('UTC009 [A] Head teacher đã là tổ trưởng khối khác → 400', async () => {
    Grade.findOne = jest.fn()
      .mockResolvedValueOnce(null)                   // check existing name
      .mockResolvedValueOnce(makeGrade({ gradeName: 'Mẫu giáo bé' }));  // head conflict
    const res = mockRes();
    await createGrade(mockReq({ ...validBody, headTeacherId: 'teacher1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('tổ trưởng') }));
  });

  test('UTC010 [A] minAge >= maxAge → 400', async () => {
    const res = mockRes();
    await createGrade(mockReq({ gradeName: 'NT', minAge: 5, maxAge: 4 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('tối đa phải lớn hơn') }));
  });

  test('UTC011 [A] minAge âm → 400', async () => {
    const res = mockRes();
    await createGrade(mockReq({ gradeName: 'NT', minAge: -1, maxAge: 4 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC012 [B] maxClasses = 1 (biên dưới) → 201', async () => {
    setupCreateMocks();
    const res = mockRes();
    await createGrade(mockReq({ ...validBody, maxClasses: 1 }), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('UTC013 [B] maxClasses = 10 (biên trên) → 201', async () => {
    setupCreateMocks();
    const res = mockRes();
    await createGrade(mockReq({ ...validBody, maxClasses: 10 }), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('UTC014 [A] DB throw exception → 500', async () => {
    Grade.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
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
    Grade.findOne = jest.fn().mockResolvedValue(null);
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
    Grade.findOne = jest.fn().mockResolvedValue(makeGrade({ _id: 'grade2', gradeName: 'Mẫu giáo bé' }));
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
