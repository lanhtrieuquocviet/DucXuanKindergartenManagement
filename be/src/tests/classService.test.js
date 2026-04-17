jest.mock('../models/Classes');
jest.mock('../models/Student');
jest.mock('../models/Grade');
jest.mock('../models/AcademicYear');
jest.mock('../models/User');
jest.mock('../models/Teacher');
jest.mock('../models/Classroom');

const Classes = require('../models/Classes');
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const AcademicYear = require('../models/AcademicYear');
const Teacher = require('../models/Teacher');
const Classroom = require('../models/Classroom');

const {
  getClassList,
  getStudentInClass,
  getClassDetail,
  getGradeList,
  createClass,
  updateClass,
  addStudentsToClass,
  removeStudentFromClass,
  deleteClass,
} = require('../services/classService');

const mockRes = () => {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};
const mockReq = (body = {}, params = {}, query = {}, user = { _id: 'user1' }) => ({
  body, params, query, user,
});

const makeClass = (o = {}) => ({
  _id: 'cls1',
  className: 'Lá 1',
  gradeId: 'grade1',
  academicYearId: 'yr1',
  teacherIds: ['t1', 't2'],
  maxStudents: 0,
  roomId: null,
  save: jest.fn().mockResolvedValue(undefined),
  ...o,
});

const makeGrade = (o = {}) => ({
  _id: 'grade1',
  gradeName: 'Mẫu giáo lớn',
  maxClasses: 10,
  ...o,
});

const makeActiveYear = () => ({ _id: 'yr1', yearName: '2025-2026', startDate: new Date('2025-09-01') });

const makePopulateChain = (result) => ({
  populate: jest.fn().mockResolvedValue(result),
});

const makeFullPopulateClass = (result) => ({
  populate: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(result),
      }),
    }),
  }),
});

// ════════════════════════════════════════════════
// getClassList
// ════════════════════════════════════════════════
describe('getClassList', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Lấy danh sách lớp thành công → 200', async () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeActiveYear()) }),
    });
    Classes.find = jest.fn().mockReturnValue(makeFullPopulateClass([makeClass()]));
    const res = mockRes();
    await getClassList(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success', total: 1 }));
  });

  test('UTC002 [N] Không có năm học đang hoạt động → trả về mảng rỗng', async () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });
    const res = mockRes();
    await getClassList(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [], academicYear: null }));
  });

  test('UTC003 [N] Danh sách lớp rỗng → 200 với mảng rỗng', async () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeActiveYear()) }),
    });
    Classes.find = jest.fn().mockReturnValue(makeFullPopulateClass([]));
    const res = mockRes();
    await getClassList(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ total: 0 }));
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB error')) }),
    });
    const res = mockRes();
    await getClassList(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getStudentInClass
// ════════════════════════════════════════════════
describe('getStudentInClass', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Lấy danh sách học sinh trong lớp thành công → 200', async () => {
    Classes.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(makeClass()),
        }),
      }),
    });
    Student.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ _id: 'stu1', fullName: 'An', faceEmbedding: [], faceEmbeddings: [], faceImageUrls: [] }]),
      }),
    });
    const res = mockRes();
    await getStudentInClass(mockReq({}, { classId: 'cls1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Không tìm thấy lớp → 404', async () => {
    Classes.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      }),
    });
    const res = mockRes();
    await getStudentInClass(mockReq({}, { classId: 'notexist' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [N] Lớp không có học sinh → 200 mảng rỗng', async () => {
    Classes.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(makeClass()),
        }),
      }),
    });
    Student.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });
    const res = mockRes();
    await getStudentInClass(mockReq({}, { classId: 'cls1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ total: 0 }));
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    Classes.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error('DB error')),
        }),
      }),
    });
    const res = mockRes();
    await getStudentInClass(mockReq({}, { classId: 'cls1' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getClassDetail
// ════════════════════════════════════════════════
describe('getClassDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Lấy chi tiết lớp học thành công → 200', async () => {
    Classes.findById = jest.fn().mockReturnValue(makeFullPopulateClass(makeClass()));
    Student.countDocuments = jest.fn().mockResolvedValue(15);
    const res = mockRes();
    await getClassDetail(mockReq({}, { classId: 'cls1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success', studentCount: 15 }));
  });

  test('UTC002 [A] Không tìm thấy lớp → 404', async () => {
    Classes.findById = jest.fn().mockReturnValue(makeFullPopulateClass(null));
    const res = mockRes();
    await getClassDetail(mockReq({}, { classId: 'notexist' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] DB throw exception → 500', async () => {
    Classes.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      }),
    });
    const res = mockRes();
    await getClassDetail(mockReq({}, { classId: 'cls1' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getGradeList
// ════════════════════════════════════════════════
describe('getGradeList', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Lấy danh sách khối thành công → 200', async () => {
    Grade.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([makeGrade()]) }),
    });
    const res = mockRes();
    await getGradeList(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] DB throw exception → 500', async () => {
    Grade.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB error')) }),
    });
    const res = mockRes();
    await getGradeList(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// createClass
// ════════════════════════════════════════════════
describe('createClass', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = { className: 'Lá 1', gradeId: 'grade1', teacherIds: ['t1', 't2'] };

  const setupCreateMocks = () => {
    AcademicYear.findOne = jest.fn()
      .mockReturnValueOnce({ sort: jest.fn().mockResolvedValue(makeActiveYear()) }) // createClass active year
      .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }); // validateTeacher prevYear
    Classes.findOne = jest.fn()
      .mockResolvedValueOnce(null)  // existing class name check (direct await, no .lean())
      .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }); // validateTeacher calls (.lean())
    Grade.findById = jest.fn().mockResolvedValue(makeGrade());
    Classes.countDocuments = jest.fn().mockResolvedValue(0);
    Teacher.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ userId: { fullName: 'Giáo viên A' } }) }),
    });
    AcademicYear.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeActiveYear()) });
    const cls = makeClass();
    Classes.mockImplementation(() => cls);
    Classes.findById = jest.fn().mockReturnValue(makeFullPopulateClass(cls));
  };

  test('UTC001 [N] Tạo lớp thành công → 201', async () => {
    setupCreateMocks();
    const res = mockRes();
    await createClass(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Thiếu className → 400', async () => {
    const res = mockRes();
    await createClass(mockReq({ gradeId: 'g1', teacherIds: ['t1', 't2'] }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Thiếu gradeId → 400', async () => {
    const res = mockRes();
    await createClass(mockReq({ className: 'Lá 1', teacherIds: ['t1', 't2'] }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] Không có năm học đang hoạt động → 400', async () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(null),
    });
    const res = mockRes();
    await createClass(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'NO_ACTIVE_ACADEMIC_YEAR' }),
    );
  });

  test('UTC005 [A] Tên lớp đã tồn tại trong năm học → 400', async () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(makeActiveYear()),
    });
    Classes.findOne = jest.fn().mockResolvedValue(makeClass());
    const res = mockRes();
    await createClass(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Tên lớp đã tồn tại') }));
  });

  test('UTC006 [A] Không tìm thấy khối lớp → 400', async () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(makeActiveYear()),
    });
    Classes.findOne = jest.fn().mockResolvedValue(null);
    Grade.findById = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await createClass(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC007 [A] Khối đã đạt tối đa lớp → 400', async () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(makeActiveYear()),
    });
    Classes.findOne = jest.fn().mockResolvedValue(null);
    Grade.findById = jest.fn().mockResolvedValue(makeGrade({ maxClasses: 2 }));
    Classes.countDocuments = jest.fn().mockResolvedValue(2);
    const res = mockRes();
    await createClass(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('tối đa') }));
  });

  test('UTC008 [A] Số giáo viên không đúng 2 → 400', async () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(makeActiveYear()),
    });
    Classes.findOne = jest.fn().mockResolvedValue(null);
    Grade.findById = jest.fn().mockResolvedValue(makeGrade());
    Classes.countDocuments = jest.fn().mockResolvedValue(0);
    const res = mockRes();
    await createClass(mockReq({ className: 'Lá 1', gradeId: 'grade1', teacherIds: ['t1'] }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('2 giáo viên') }));
  });

  test('UTC009 [A] DB throw exception → 500', async () => {
    AcademicYear.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error('DB error')),
    });
    const res = mockRes();
    await createClass(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// addStudentsToClass
// ════════════════════════════════════════════════
describe('addStudentsToClass', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Thêm học sinh vào lớp thành công → 200', async () => {
    Classes.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeClass({ maxStudents: 30 })) });
    Student.countDocuments = jest.fn()
      .mockResolvedValueOnce(10)  // currentCount
      .mockResolvedValueOnce(11); // updatedCount
    Student.find = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
    });
    Student.updateMany = jest.fn().mockResolvedValue({ nModified: 1 });
    const res = mockRes();
    await addStudentsToClass(mockReq({ studentIds: ['stu1'] }, { classId: 'cls1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] studentIds rỗng → 400', async () => {
    const res = mockRes();
    await addStudentsToClass(mockReq({ studentIds: [] }, { classId: 'cls1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] studentIds không phải mảng → 400', async () => {
    const res = mockRes();
    await addStudentsToClass(mockReq({ studentIds: 'stu1' }, { classId: 'cls1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] Không tìm thấy lớp → 404', async () => {
    Classes.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const res = mockRes();
    await addStudentsToClass(mockReq({ studentIds: ['stu1'] }, { classId: 'notexist' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC005 [A] Vượt quá sĩ số tối đa → 400', async () => {
    Classes.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeClass({ maxStudents: 5 })) });
    Student.countDocuments = jest.fn().mockResolvedValue(5);
    const res = mockRes();
    await addStudentsToClass(mockReq({ studentIds: ['stu1'] }, { classId: 'cls1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('sĩ số tối đa') }));
  });

  test('UTC006 [A] Học sinh đã thuộc lớp khác → 400', async () => {
    Classes.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeClass()) });
    Student.countDocuments = jest.fn().mockResolvedValue(0);
    Student.find = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ _id: 'stu1', fullName: 'An', classId: 'othercls' }]),
      }),
    });
    const res = mockRes();
    await addStudentsToClass(mockReq({ studentIds: ['stu1'] }, { classId: 'cls1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('đã thuộc lớp khác') }));
  });

  test('UTC007 [A] DB throw exception → 500', async () => {
    Classes.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB error')) });
    const res = mockRes();
    await addStudentsToClass(mockReq({ studentIds: ['stu1'] }, { classId: 'cls1' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// removeStudentFromClass
// ════════════════════════════════════════════════
describe('removeStudentFromClass', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Xóa học sinh khỏi lớp thành công → 200', async () => {
    Student.findOne = jest.fn().mockResolvedValue({ _id: 'stu1', classId: 'cls1' });
    Student.findByIdAndUpdate = jest.fn().mockResolvedValue({});
    const res = mockRes();
    await removeStudentFromClass(mockReq({}, { classId: 'cls1', studentId: 'stu1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Học sinh không thuộc lớp này → 404', async () => {
    Student.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await removeStudentFromClass(mockReq({}, { classId: 'cls1', studentId: 'stu99' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] DB throw exception → 500', async () => {
    Student.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await removeStudentFromClass(mockReq({}, { classId: 'cls1', studentId: 'stu1' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// deleteClass
// ════════════════════════════════════════════════
describe('deleteClass', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Xóa lớp học thành công → 200', async () => {
    Classes.findById = jest.fn().mockResolvedValue(makeClass());
    Student.countDocuments = jest.fn().mockResolvedValue(0);
    Classes.findByIdAndDelete = jest.fn().mockResolvedValue(makeClass());
    const res = mockRes();
    await deleteClass(mockReq({}, { classId: 'cls1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Không tìm thấy lớp → 404', async () => {
    Classes.findById = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await deleteClass(mockReq({}, { classId: 'notexist' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] Lớp đang có học sinh → 400', async () => {
    Classes.findById = jest.fn().mockResolvedValue(makeClass());
    Student.countDocuments = jest.fn().mockResolvedValue(5);
    const res = mockRes();
    await deleteClass(mockReq({}, { classId: 'cls1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('học sinh') }));
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    Classes.findById = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await deleteClass(mockReq({}, { classId: 'cls1' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
