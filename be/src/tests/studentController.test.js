jest.mock('../models/Student');
jest.mock('../models/User');
jest.mock('../models/ParentProfile');
jest.mock('../models/Role', () => {
  const Role = jest.fn();
  Role.find = jest.fn();
  Role.findOne = jest.fn();
  Role.findById = jest.fn();
  Role.create = jest.fn();
  Role.countDocuments = jest.fn();
  return Role;
});
jest.mock('../models/AcademicYear');
jest.mock('../models/RefreshToken');
jest.mock('bcryptjs');
jest.mock('../utils/email', () => ({
  generateRandomPassword: jest.fn().mockReturnValue('RandPass1!'),
  sendParentAccountEmail: jest.fn().mockResolvedValue(undefined),
}));

const Student = require('../models/Student');
const User = require('../models/User');
const ParentProfile = require('../models/ParentProfile');
const Role = require('../models/Role');
const AcademicYear = require('../models/AcademicYear');
const bcrypt = require('bcryptjs');

const {
  getStudents,
  createStudent,
  createStudentWithParent,
  getStudentDetail,
  updateStudent,
  deleteStudent,
  checkUsernameAvailability,
  checkParentByPhone,
} = require('../controller/studentController');

const mockRes = () => {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};
const mockReq = (body = {}, params = {}, query = {}, user = { _id: 'user1', id: 'user1', roles: ['SchoolAdmin'] }) => ({
  body, params, query, user,
});

const makeStudentObj = (o = {}) => ({
  _id: 'stu1',
  studentCode: '260001',
  fullName: 'Nguyễn Văn An',
  dateOfBirth: new Date('2020-01-01'),
  gender: 'male',
  classId: 'cls1',
  parentId: 'user1',
  faceEmbedding: [],
  faceEmbeddings: [],
  faceImageUrls: [],
  status: 'active',
  toObject: function () { return { ...this }; },
  save: jest.fn().mockResolvedValue(undefined),
  ...o,
});

const makePopulateChain4 = (result) => ({
  populate: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(result),
      }),
    }),
  }),
});

// ════════════════════════════════════════════════
// getStudents
// ════════════════════════════════════════════════
describe('getStudents', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Lấy danh sách học sinh thành công → 200', async () => {
    Student.find = jest.fn().mockReturnValue(makePopulateChain4([makeStudentObj()]));
    const res = mockRes();
    await getStudents(mockReq({}, {}, {}), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success', total: 1 }));
  });

  test('UTC002 [N] Danh sách rỗng → trả về mảng rỗng', async () => {
    Student.find = jest.fn().mockReturnValue(makePopulateChain4([]));
    const res = mockRes();
    await getStudents(mockReq({}, {}, {}), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ total: 0 }));
  });

  test('UTC003 [B] Filter theo classId → find nhận đúng filter', async () => {
    Student.find = jest.fn().mockReturnValue(makePopulateChain4([]));
    const res = mockRes();
    await getStudents(mockReq({}, {}, { classId: 'cls1' }), res);
    expect(Student.find).toHaveBeenCalledWith(expect.objectContaining({ classId: 'cls1' }));
  });

  test('UTC004 [B] Filter theo academicYearId → find nhận đúng filter', async () => {
    Student.find = jest.fn().mockReturnValue(makePopulateChain4([]));
    const res = mockRes();
    await getStudents(mockReq({}, {}, { academicYearId: 'year1' }), res);
    expect(Student.find).toHaveBeenCalledWith(expect.objectContaining({ academicYearId: 'year1' }));
  });

  test('UTC005 [B] Response không chứa faceEmbedding (bảo mật)', async () => {
    const stuWithFace = makeStudentObj({ faceEmbedding: [0.1, 0.2], faceEmbeddings: [[0.1]] });
    Student.find = jest.fn().mockReturnValue(makePopulateChain4([stuWithFace]));
    const res = mockRes();
    await getStudents(mockReq({}, {}, {}), res);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.data[0]).not.toHaveProperty('faceEmbedding');
    expect(jsonCall.data[0]).not.toHaveProperty('faceEmbeddings');
  });

  test('UTC006 [A] DB throw exception → 500', async () => {
    Student.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      }),
    });
    const res = mockRes();
    await getStudents(mockReq({}, {}, {}), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// createStudent
// ════════════════════════════════════════════════
describe('createStudent', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = { fullName: 'Trần Thị Bình', dateOfBirth: '2021-01-01', gender: 'female' };

  const setupCreateMocks = () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'yr1' }) }),
    });
    Student.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      }),
    });
    const stu = makeStudentObj();
    Student.mockImplementation(() => stu);
    Student.findById = jest.fn().mockReturnValue(makePopulateChain4(stu));
  };

  test('UTC001 [N] Tạo học sinh thành công → 201', async () => {
    setupCreateMocks();
    const res = mockRes();
    await createStudent(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Thiếu fullName → 400', async () => {
    const res = mockRes();
    await createStudent(mockReq({ dateOfBirth: '2021-01-01', gender: 'male' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Thiếu dateOfBirth → 400', async () => {
    const res = mockRes();
    await createStudent(mockReq({ fullName: 'An', gender: 'male' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] Thiếu gender → 400', async () => {
    const res = mockRes();
    await createStudent(mockReq({ fullName: 'An', dateOfBirth: '2021-01-01' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC005 [A] DB throw exception → 500', async () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB error')) }),
    });
    const res = mockRes();
    await createStudent(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// createStudentWithParent
// ════════════════════════════════════════════════
describe('createStudentWithParent', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = {
    parent: { fullName: 'Trần Văn Bình', email: 'binh@example.com', phone: '0901234567' },
    student: { fullName: 'Trần Bình An', dateOfBirth: '2021-01-01', gender: 'male' },
  };

  test('UTC001 [A] Thiếu thông tin phụ huynh (không có fullName) → 400', async () => {
    const res = mockRes();
    await createStudentWithParent(
      mockReq({ parent: { email: 'a@b.com', phone: '090' }, student: validBody.student }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
  });

  test('UTC002 [A] Thiếu email phụ huynh → 400', async () => {
    const res = mockRes();
    await createStudentWithParent(
      mockReq({ parent: { fullName: 'Bình', phone: '090' }, student: validBody.student }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Thiếu số điện thoại phụ huynh → 400', async () => {
    const res = mockRes();
    await createStudentWithParent(
      mockReq({ parent: { fullName: 'Bình', email: 'a@b.com' }, student: validBody.student }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] Thiếu fullName học sinh → 400', async () => {
    const res = mockRes();
    await createStudentWithParent(
      mockReq({ parent: validBody.parent, student: { dateOfBirth: '2021-01-01', gender: 'male' } }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC005 [A] Thiếu dateOfBirth học sinh → 400', async () => {
    const res = mockRes();
    await createStudentWithParent(
      mockReq({ parent: validBody.parent, student: { fullName: 'An', gender: 'male' } }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC006 [A] Thiếu gender học sinh → 400', async () => {
    const res = mockRes();
    await createStudentWithParent(
      mockReq({ parent: validBody.parent, student: { fullName: 'An', dateOfBirth: '2021-01-01' } }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC007 [A] Không truyền parent → 400', async () => {
    const res = mockRes();
    await createStudentWithParent(mockReq({ student: validBody.student }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC008 [N] Tạo thành công (phụ huynh mới) → 201', async () => {
    Role.findOne = jest.fn().mockResolvedValue({ _id: 'role1' });
    User.findOne = jest.fn().mockResolvedValue(null);
    const parentUser = {
      _id: 'par1', email: 'binh@example.com', phone: '0901234567', roles: [],
      fullName: 'Trần Văn Bình', username: '0901234567',
      save: jest.fn().mockResolvedValue(undefined),
    };
    User.mockImplementation(() => parentUser);
    bcrypt.genSalt = jest.fn().mockResolvedValue('salt');
    bcrypt.hash = jest.fn().mockResolvedValue('hashed');
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'yr1' }) }),
    });
    ParentProfile.findOneAndUpdate = jest.fn().mockResolvedValue({ _id: 'prof1' });
    Student.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      }),
    });
    const newStu = makeStudentObj();
    Student.mockImplementation(() => newStu);
    Student.findById = jest.fn().mockReturnValue(makePopulateChain4(newStu));
    const res = mockRes();
    await createStudentWithParent(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

// ════════════════════════════════════════════════
// getStudentDetail
// ════════════════════════════════════════════════
describe('getStudentDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  const makeChain3 = (result) => ({
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(result),
      }),
    }),
  });

  test('UTC001 [N] Lấy thông tin học sinh thành công → 200', async () => {
    Student.findById = jest.fn().mockReturnValue(makeChain3(makeStudentObj()));
    const res = mockRes();
    await getStudentDetail(mockReq({}, { studentId: 'stu1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Không tìm thấy học sinh → 404', async () => {
    Student.findById = jest.fn().mockReturnValue(makeChain3(null));
    const res = mockRes();
    await getStudentDetail(mockReq({}, { studentId: 'notexist' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [B] Response không chứa faceEmbedding (bảo mật)', async () => {
    const stuWithFace = makeStudentObj({ faceEmbedding: [0.1, 0.2], faceEmbeddings: [[0.1]] });
    Student.findById = jest.fn().mockReturnValue(makeChain3(stuWithFace));
    const res = mockRes();
    await getStudentDetail(mockReq({}, { studentId: 'stu1' }), res);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.data).not.toHaveProperty('faceEmbedding');
    expect(jsonCall.data).not.toHaveProperty('faceEmbeddings');
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    Student.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error('DB error')),
        }),
      }),
    });
    const res = mockRes();
    await getStudentDetail(mockReq({}, { studentId: 'stu1' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// updateStudent
// ════════════════════════════════════════════════
describe('updateStudent', () => {
  beforeEach(() => jest.clearAllMocks());

  const makeChain3Update = (result) => ({
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(result),
      }),
    }),
  });

  test('UTC001 [N] Cập nhật thành công (SchoolAdmin) → 200', async () => {
    Student.findById = jest.fn().mockResolvedValue(makeStudentObj());
    Student.findByIdAndUpdate = jest.fn().mockReturnValue(makeChain3Update(makeStudentObj()));
    const res = mockRes();
    await updateStudent(
      mockReq({ fullName: 'Tên mới' }, { studentId: 'stu1' }, {}, { _id: 'user1', id: 'user1', roles: ['SchoolAdmin'] }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Không tìm thấy học sinh → 404', async () => {
    Student.findById = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await updateStudent(mockReq({ fullName: 'X' }, { studentId: 'notexist' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] Không có quyền (không phải admin, không phải phụ huynh) → 403', async () => {
    Student.findById = jest.fn().mockResolvedValue(makeStudentObj({ parentId: 'other_user' }));
    const res = mockRes();
    await updateStudent(
      mockReq({ fullName: 'X' }, { studentId: 'stu1' }, {}, { _id: 'nobody', id: 'nobody', roles: ['Teacher'] }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    Student.findById = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await updateStudent(mockReq({ fullName: 'X' }, { studentId: 'stu1' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// deleteStudent
// ════════════════════════════════════════════════
describe('deleteStudent', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Xóa học sinh thành công → 200', async () => {
    Student.findById = jest.fn().mockResolvedValue(makeStudentObj({ parentId: null, parentProfileId: null }));
    Student.findByIdAndDelete = jest.fn().mockResolvedValue(makeStudentObj());
    Student.countDocuments = jest.fn().mockResolvedValue(0);
    const res = mockRes();
    await deleteStudent(mockReq({}, { studentId: 'stu1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Không tìm thấy học sinh → 404', async () => {
    Student.findById = jest.fn().mockResolvedValue(null);
    Student.findByIdAndDelete = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await deleteStudent(mockReq({}, { studentId: 'notexist' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] DB throw exception → 500', async () => {
    Student.findById = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await deleteStudent(mockReq({}, { studentId: 'stu1' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// checkUsernameAvailability
// ════════════════════════════════════════════════
describe('checkUsernameAvailability', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Username chưa tồn tại → available: true', async () => {
    User.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const res = mockRes();
    await checkUsernameAvailability(mockReq({}, {}, { username: 'newuser' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ available: true }));
  });

  test('UTC002 [N] Username đã tồn tại → available: false', async () => {
    User.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'u1' }) });
    const res = mockRes();
    await checkUsernameAvailability(mockReq({}, {}, { username: 'existinguser' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ available: false }));
  });

  test('UTC003 [A] Thiếu username → 400', async () => {
    const res = mockRes();
    await checkUsernameAvailability(mockReq({}, {}, {}), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] Username chỉ có khoảng trắng → 400', async () => {
    const res = mockRes();
    await checkUsernameAvailability(mockReq({}, {}, { username: '   ' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC005 [A] DB throw exception → 500', async () => {
    User.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB error')) });
    const res = mockRes();
    await checkUsernameAvailability(mockReq({}, {}, { username: 'user1' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// checkParentByPhone
// ════════════════════════════════════════════════
describe('checkParentByPhone', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Tìm thấy phụ huynh → exists: true', async () => {
    const parent = { _id: 'par1', fullName: 'Bình', phone: '0901234567' };
    User.findOne = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(parent) }) });
    User.findById = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'par1', roles: ['role1'] }) });
    // purgeOrphanParentAccount → Role.find, Student.countDocuments
    const Role = require('../models/Role');
    Role.find = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) });
    Student.countDocuments = jest.fn().mockResolvedValue(1);
    ParentProfile.findOneAndUpdate = jest.fn().mockResolvedValue({ _id: 'prof1' });
    const res = mockRes();
    await checkParentByPhone(mockReq({}, {}, { phone: '0901234567' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ exists: true }));
  });

  test('UTC002 [N] Không tìm thấy phụ huynh → exists: false', async () => {
    User.findOne = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
    const res = mockRes();
    await checkParentByPhone(mockReq({}, {}, { phone: '0999999999' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ exists: false }));
  });

  test('UTC003 [A] Thiếu hoặc sai số điện thoại → 400', async () => {
    const res = mockRes();
    await checkParentByPhone(mockReq({}, {}, {}), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    User.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB error')) }),
    });
    const res = mockRes();
    await checkParentByPhone(mockReq({}, {}, { phone: '0901234567' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
