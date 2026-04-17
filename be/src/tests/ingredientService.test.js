jest.mock('../models/Ingredient', () => {
  const MockIngredient = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(undefined),
  }));
  MockIngredient.countDocuments = jest.fn();
  MockIngredient.updateMany = jest.fn();
  MockIngredient.find = jest.fn();
  MockIngredient.findOne = jest.fn();
  MockIngredient.findByIdAndUpdate = jest.fn();
  MockIngredient.findByIdAndDelete = jest.fn();
  return MockIngredient;
});

const Ingredient = require('../models/Ingredient');
const {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} = require('../services/ingredientService');

const mockRes = () => {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};
const mockReq = (body = {}, params = {}) => ({ body, params });

const makeIngredient = (o = {}) => ({
  _id: 'ing1',
  name: 'Gạo',
  category: 'luong_thuc',
  unit: '100g',
  calories: 350,
  protein: 7,
  fat: 0.5,
  carb: 78,
  ...o,
});

// ════════════════════════════════════════════════
// getIngredients
// ════════════════════════════════════════════════
describe('getIngredients', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Lấy danh sách nguyên liệu thành công → json({ success: true })', async () => {
    Ingredient.countDocuments = jest.fn().mockResolvedValue(0);
    Ingredient.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([makeIngredient()]),
    });
    const res = mockRes();
    await getIngredients(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.any(Array) }),
    );
  });

  test('UTC002 [N] Có nguyên liệu thiếu category → tự động cập nhật rồi trả về', async () => {
    Ingredient.countDocuments = jest.fn().mockResolvedValue(2);
    Ingredient.updateMany = jest.fn().mockResolvedValue({ nModified: 2 });
    Ingredient.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([makeIngredient()]),
    });
    const res = mockRes();
    await getIngredients(mockReq(), res);
    expect(Ingredient.updateMany).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC003 [A] DB throw exception → 500', async () => {
    Ingredient.countDocuments = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await getIngredients(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// createIngredient
// ════════════════════════════════════════════════
describe('createIngredient', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = {
    name: 'Thịt bò',
    category: 'giau_dam',
    unit: '100g',
    calories: 250,
    protein: 26,
    fat: 15,
    carb: 0,
  };

  test('UTC001 [N] Tạo nguyên liệu thành công → 201', async () => {
    Ingredient.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await createIngredient(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] Thiếu name → 400', async () => {
    const res = mockRes();
    await createIngredient(mockReq({ category: 'giau_dam' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('bắt buộc') }),
    );
  });

  test('UTC003 [A] Nguyên liệu đã tồn tại → 400', async () => {
    Ingredient.findOne = jest.fn().mockResolvedValue(makeIngredient({ name: 'Thịt bò' }));
    const res = mockRes();
    await createIngredient(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('đã tồn tại') }),
    );
  });

  test('UTC004 [B] Category không nằm trong danh sách → dùng "luong_thuc"', async () => {
    Ingredient.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await createIngredient(mockReq({ ...validBody, category: 'invalid_cat' }), res);
    const constructorArg = Ingredient.mock.calls[0][0];
    expect(constructorArg.category).toBe('luong_thuc');
  });

  test('UTC005 [B] Category hợp lệ (rau_cu) → dùng category đó', async () => {
    Ingredient.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await createIngredient(mockReq({ ...validBody, category: 'rau_cu' }), res);
    const constructorArg = Ingredient.mock.calls[0][0];
    expect(constructorArg.category).toBe('rau_cu');
  });

  test('UTC006 [A] DB throw exception → 500', async () => {
    Ingredient.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await createIngredient(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// updateIngredient
// ════════════════════════════════════════════════
describe('updateIngredient', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = {
    name: 'Thịt bò sốt',
    category: 'giau_dam',
    unit: '100g',
    calories: 260,
    protein: 27,
    fat: 14,
    carb: 0,
  };

  test('UTC001 [N] Cập nhật thành công → json({ success: true })', async () => {
    Ingredient.findOne = jest.fn().mockResolvedValue(null);
    Ingredient.findByIdAndUpdate = jest.fn().mockResolvedValue(makeIngredient());
    const res = mockRes();
    await updateIngredient(mockReq(validBody, { id: 'ing1' }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] Thiếu name → 400', async () => {
    const res = mockRes();
    await updateIngredient(mockReq({ category: 'giau_dam' }, { id: 'ing1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Tên trùng với nguyên liệu khác → 400', async () => {
    Ingredient.findOne = jest.fn().mockResolvedValue(makeIngredient({ _id: 'ing2' }));
    const res = mockRes();
    await updateIngredient(mockReq(validBody, { id: 'ing1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('đã tồn tại') }),
    );
  });

  test('UTC004 [A] Nguyên liệu không tồn tại → 404', async () => {
    Ingredient.findOne = jest.fn().mockResolvedValue(null);
    Ingredient.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await updateIngredient(mockReq(validBody, { id: 'notexist' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC005 [B] Category không hợp lệ → findByIdAndUpdate nhận category="luong_thuc"', async () => {
    Ingredient.findOne = jest.fn().mockResolvedValue(null);
    Ingredient.findByIdAndUpdate = jest.fn().mockResolvedValue(makeIngredient());
    const res = mockRes();
    await updateIngredient(mockReq({ ...validBody, category: 'bad_cat' }, { id: 'ing1' }), res);
    const updateArg = Ingredient.findByIdAndUpdate.mock.calls[0][1];
    expect(updateArg.category).toBe('luong_thuc');
  });

  test('UTC006 [A] DB throw exception → 500', async () => {
    Ingredient.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await updateIngredient(mockReq(validBody, { id: 'ing1' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// deleteIngredient
// ════════════════════════════════════════════════
describe('deleteIngredient', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Xóa nguyên liệu thành công → json({ success: true })', async () => {
    Ingredient.findByIdAndDelete = jest.fn().mockResolvedValue(makeIngredient());
    const res = mockRes();
    await deleteIngredient(mockReq({}, { id: 'ing1' }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] Nguyên liệu không tồn tại → 404', async () => {
    Ingredient.findByIdAndDelete = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await deleteIngredient(mockReq({}, { id: 'notexist' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] DB throw exception → 500', async () => {
    Ingredient.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await deleteIngredient(mockReq({}, { id: 'ing1' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
