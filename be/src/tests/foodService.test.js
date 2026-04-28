jest.mock('../models/Food');
jest.mock('../models/DailyMenu', () => ({
  findOne: jest.fn(),
}));

const Food = require('../models/Food');
const DailyMenu = require('../models/DailyMenu');
const { createFood, getFoods, getFoodById, updateFood, deleteFood, restoreFood } = require('../services/foodService');

const mockRes = () => {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};
const mockReq = (body = {}, params = {}, query = {}) => ({ body, params, query });

const VALID_OID = '507f1f77bcf86cd799439011';
const INVALID_OID = 'not-valid';

const makeFood = (o = {}) => ({
  _id: VALID_OID,
  name: 'Cơm trắng',
  calories: 130,
  protein: 2.7,
  fat: 0.3,
  carb: 28,
  ingredients: [],
  isDeleted: false,
  deletedAt: null,
  save: jest.fn().mockResolvedValue(undefined),
  deleteOne: jest.fn().mockResolvedValue(undefined),
  ...o,
});

// ════════════════════════════════════════════════
// createFood
// ════════════════════════════════════════════════
describe('createFood', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = { name: 'Cơm trắng', calories: 130, protein: 2.7, fat: 0.3, carb: 28 };

  test('UTC001 [N] Tạo món ăn thành công → 201', async () => {
    Food.findOne = jest.fn().mockResolvedValue(null);
    const food = makeFood();
    Food.mockImplementation(() => food);
    const res = mockRes();
    await createFood(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] Thiếu name → 400', async () => {
    const res = mockRes();
    await createFood(mockReq({ calories: 130, protein: 2.7, fat: 0.3, carb: 28 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Thiếu thông tin món ăn' }));
  });

  test('UTC003 [A] Thiếu calories → 400', async () => {
    const res = mockRes();
    await createFood(mockReq({ name: 'Cơm', protein: 2.7, fat: 0.3, carb: 28 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] Thiếu protein → 400', async () => {
    const res = mockRes();
    await createFood(mockReq({ name: 'Cơm', calories: 130, fat: 0.3, carb: 28 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC005 [A] Thiếu fat → 400', async () => {
    const res = mockRes();
    await createFood(mockReq({ name: 'Cơm', calories: 130, protein: 2.7, carb: 28 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC006 [A] Thiếu carb → 400', async () => {
    const res = mockRes();
    await createFood(mockReq({ name: 'Cơm', calories: 130, protein: 2.7, fat: 0.3 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC007 [A] calories âm → 400', async () => {
    const res = mockRes();
    await createFood(mockReq({ name: 'Cơm', calories: -1, protein: 2.7, fat: 0.3, carb: 28 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('âm') }));
  });

  test('UTC008 [A] protein âm → 400', async () => {
    const res = mockRes();
    await createFood(mockReq({ name: 'Cơm', calories: 130, protein: -1, fat: 0.3, carb: 28 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC009 [A] Tên món ăn đã tồn tại → 400', async () => {
    Food.findOne = jest.fn().mockResolvedValue(makeFood());
    const res = mockRes();
    await createFood(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Món ăn đã tồn tại' }));
  });

  test('UTC009b [N] Tên món đã xóa mềm → khôi phục thành công', async () => {
    const deletedFood = makeFood({ isDeleted: true });
    Food.findOne = jest.fn().mockResolvedValue(deletedFood);
    const res = mockRes();
    await createFood(mockReq(validBody), res);
    expect(deletedFood.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Khôi phục') }));
  });

  test('UTC010 [A] ingredients không phải mảng → 400', async () => {
    const res = mockRes();
    await createFood(mockReq({ ...validBody, ingredients: 'not-array' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Ingredients phải là mảng' }));
  });

  test('UTC011 [A] Nguyên liệu trong mảng thiếu name → 400', async () => {
    const res = mockRes();
    await createFood(mockReq({
      ...validBody,
      ingredients: [{ calories: 100, protein: 1, fat: 0, carb: 10 }],
    }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('nguyên liệu') }));
  });

  test('UTC012 [A] Nguyên liệu có calories âm → 400', async () => {
    const res = mockRes();
    await createFood(mockReq({
      ...validBody,
      ingredients: [{ name: 'Gạo', calories: -10, protein: 1, fat: 0, carb: 10 }],
    }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC013 [B] calories = 0 (biên dưới hợp lệ) → 201', async () => {
    Food.findOne = jest.fn().mockResolvedValue(null);
    const food = makeFood({ calories: 0 });
    Food.mockImplementation(() => food);
    const res = mockRes();
    await createFood(mockReq({ name: 'Nước lọc', calories: 0, protein: 0, fat: 0, carb: 0 }), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('UTC014 [A] DB throw exception → 500', async () => {
    Food.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await createFood(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getFoods
// ════════════════════════════════════════════════
describe('getFoods', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Lấy danh sách món ăn thành công → 200', async () => {
    Food.find = jest.fn().mockResolvedValue([makeFood()]);
    const res = mockRes();
    await getFoods(mockReq(), res);
    expect(Food.find).toHaveBeenCalledWith({ isDeleted: { $ne: true } });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.any(Array) }));
  });

  test('UTC002 [N] Danh sách rỗng → trả về mảng rỗng', async () => {
    Food.find = jest.fn().mockResolvedValue([]);
    const res = mockRes();
    await getFoods(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [] }));
  });

  test('UTC003 [A] DB throw exception → 500', async () => {
    Food.find = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await getFoods(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('UTC004 [B] filter=deleted → chỉ query món đã xóa mềm', async () => {
    Food.find = jest.fn().mockResolvedValue([makeFood({ isDeleted: true })]);
    const res = mockRes();
    await getFoods(mockReq({}, {}, { filter: 'deleted' }), res);
    expect(Food.find).toHaveBeenCalledWith({ isDeleted: true });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

// ════════════════════════════════════════════════
// getFoodById
// ════════════════════════════════════════════════
describe('getFoodById', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Lấy chi tiết món ăn thành công → 200', async () => {
    Food.findOne = jest.fn().mockResolvedValue(makeFood());
    const res = mockRes();
    await getFoodById(mockReq({}, { id: VALID_OID }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] ID không hợp lệ → 400', async () => {
    const res = mockRes();
    await getFoodById(mockReq({}, { id: INVALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'ID không hợp lệ' }));
  });

  test('UTC003 [A] Không tìm thấy món ăn → 404', async () => {
    Food.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await getFoodById(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Không tìm thấy món ăn' }));
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    Food.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await getFoodById(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// updateFood
// ════════════════════════════════════════════════
describe('updateFood', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Cập nhật món ăn thành công → 200', async () => {
    Food.findOne = jest.fn().mockResolvedValue(makeFood());
    const res = mockRes();
    await updateFood(mockReq({ name: 'Cơm chiên' }, { id: VALID_OID }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] Không tìm thấy món ăn → 404', async () => {
    Food.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await updateFood(mockReq({ name: 'X' }, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Món ăn không tồn tại' }));
  });

  test('UTC003 [A] ingredients không phải mảng → 400', async () => {
    Food.findOne = jest.fn().mockResolvedValue(makeFood());
    const res = mockRes();
    await updateFood(mockReq({ ingredients: 'bad' }, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Ingredients phải là mảng' }));
  });

  test('UTC004 [A] Nguyên liệu trong mảng không hợp lệ → 400', async () => {
    Food.findOne = jest.fn().mockResolvedValue(makeFood());
    const res = mockRes();
    await updateFood(
      mockReq({ ingredients: [{ name: 'Gạo', calories: -5, protein: 1, fat: 0, carb: 10 }] }, { id: VALID_OID }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC005 [N] Cập nhật với nguyên liệu hợp lệ → 200', async () => {
    Food.findOne = jest.fn().mockResolvedValue(makeFood());
    const res = mockRes();
    await updateFood(
      mockReq({ ingredients: [{ name: 'Gạo', calories: 100, protein: 2, fat: 0, carb: 20 }] }, { id: VALID_OID }),
      res,
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC006 [A] DB throw exception → 500', async () => {
    Food.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await updateFood(mockReq({ name: 'X' }, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('UTC007 [A] Cập nhật nutrition âm ở cấp món → 400', async () => {
    Food.findOne = jest.fn().mockResolvedValue(makeFood());
    const res = mockRes();
    await updateFood(mockReq({ protein: -1 }, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('không được âm') }),
    );
  });
});

// ════════════════════════════════════════════════
// deleteFood
// ════════════════════════════════════════════════
describe('deleteFood', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Xóa món ăn thành công → 200', async () => {
    const food = makeFood();
    Food.findOne = jest.fn().mockResolvedValue(food);
    DailyMenu.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    const res = mockRes();
    await deleteFood(mockReq({}, { id: VALID_OID }), res);
    expect(food.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: 'Xóa món ăn thành công' }));
  });

  test('UTC002 [A] Không tìm thấy món ăn → 404', async () => {
    Food.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await deleteFood(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Món ăn không tồn tại' }));
  });

  test('UTC003 [A] DB throw exception → 500', async () => {
    Food.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await deleteFood(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('UTC004 [A] Food đã gắn trong menu (draft/any status) → 400', async () => {
    Food.findOne = jest.fn().mockResolvedValue(makeFood({ _id: VALID_OID }));
    DailyMenu.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'dm1', menuId: 'm1' }),
    });
    const res = mockRes();
    await deleteFood(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('bản nháp') }),
    );
  });
});

// ════════════════════════════════════════════════
// restoreFood
// ════════════════════════════════════════════════
describe('restoreFood', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Khôi phục món ăn thành công → 200', async () => {
    const deleted = makeFood({ isDeleted: true, deletedAt: new Date() });
    Food.findById = jest.fn().mockResolvedValue(deleted);
    const res = mockRes();
    await restoreFood(mockReq({}, { id: VALID_OID }), res);
    expect(deleted.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] Không tìm thấy món ăn → 404', async () => {
    Food.findById = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await restoreFood(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [B] Món chưa xóa mềm → trả success', async () => {
    Food.findById = jest.fn().mockResolvedValue(makeFood({ isDeleted: false }));
    const res = mockRes();
    await restoreFood(mockReq({}, { id: VALID_OID }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
