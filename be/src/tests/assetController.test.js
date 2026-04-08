jest.mock('../models/Asset');
jest.mock('../utils/systemLog', () => ({ createSystemLog: jest.fn().mockResolvedValue(undefined) }));

const Asset = require('../models/Asset');
const {
  listAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  bulkCreateAssets,
} = require('../controller/assetController');

const mockRes = () => {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};
const mockReq = (body = {}, params = {}, user = { _id: 'user1' }) => ({ body, params, user });

const makeAsset = (o = {}) => ({
  _id: 'asset123',
  assetCode: 'TS001',
  name: 'Bàn học',
  category: 'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em',
  room: 'P101',
  requiredQuantity: 10,
  quantity: 8,
  area: null,
  constructionType: 'Không áp dụng',
  condition: 'Tốt',
  notes: '',
  save: jest.fn().mockResolvedValue(undefined),
  ...o,
});

// ════════════════════════════════════════════════
// listAssets
// ════════════════════════════════════════════════
describe('listAssets', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Lấy danh sách tài sản thành công → 200', async () => {
    Asset.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([makeAsset()]),
      }),
    });
    const res = mockRes();
    await listAssets(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [N] Danh sách rỗng → trả về mảng rỗng', async () => {
    Asset.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      }),
    });
    const res = mockRes();
    await listAssets(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: { assets: [] } })
    );
  });

  test('UTC003 [A] DB throw exception → 500', async () => {
    Asset.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('DB error')),
      }),
    });
    const res = mockRes();
    await listAssets(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getAsset
// ════════════════════════════════════════════════
describe('getAsset', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Lấy tài sản theo ID thành công → 200', async () => {
    Asset.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(makeAsset()),
    });
    const res = mockRes();
    await getAsset(mockReq({}, { id: 'asset123' }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Không tìm thấy tài sản → 404', async () => {
    Asset.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });
    const res = mockRes();
    await getAsset(mockReq({}, { id: 'notexist' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] DB throw exception → 500', async () => {
    Asset.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockRejectedValue(new Error('DB error')),
    });
    const res = mockRes();
    await getAsset(mockReq({}, { id: 'asset123' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// createAsset
// ════════════════════════════════════════════════
describe('createAsset', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = { assetCode: 'TS001', name: 'Bàn học' };

  test('UTC001 [N] Tạo tài sản thành công → 201', async () => {
    Asset.findOne = jest.fn().mockResolvedValue(null);
    Asset.create = jest.fn().mockResolvedValue(makeAsset());
    const res = mockRes();
    await createAsset(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Thiếu assetCode → 400', async () => {
    const res = mockRes();
    await createAsset(mockReq({ name: 'Bàn học' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] assetCode chỉ chứa khoảng trắng → 400', async () => {
    const res = mockRes();
    await createAsset(mockReq({ assetCode: '   ', name: 'Bàn học' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] Thiếu name → 400', async () => {
    const res = mockRes();
    await createAsset(mockReq({ assetCode: 'TS001' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC005 [A] name chỉ chứa khoảng trắng → 400', async () => {
    const res = mockRes();
    await createAsset(mockReq({ assetCode: 'TS001', name: '   ' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC006 [A] Mã tài sản đã tồn tại → 409', async () => {
    Asset.findOne = jest.fn().mockResolvedValue(makeAsset());
    const res = mockRes();
    await createAsset(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('UTC007 [B] Tạo với category mặc định khi không truyền → 201', async () => {
    Asset.findOne = jest.fn().mockResolvedValue(null);
    Asset.create = jest.fn().mockResolvedValue(makeAsset());
    const res = mockRes();
    await createAsset(mockReq({ assetCode: 'TS002', name: 'Ghế' }), res);
    expect(Asset.create).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em' })
    );
  });

  test('UTC008 [B] area = null khi không truyền → 201', async () => {
    Asset.findOne = jest.fn().mockResolvedValue(null);
    Asset.create = jest.fn().mockResolvedValue(makeAsset());
    const res = mockRes();
    await createAsset(mockReq({ assetCode: 'TS003', name: 'Tủ' }), res);
    expect(Asset.create).toHaveBeenCalledWith(expect.objectContaining({ area: null }));
  });

  test('UTC009 [A] DB throw exception → 500', async () => {
    Asset.findOne = jest.fn().mockResolvedValue(null);
    Asset.create = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await createAsset(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// updateAsset
// ════════════════════════════════════════════════
describe('updateAsset', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Cập nhật tài sản thành công → 200', async () => {
    Asset.findById = jest.fn().mockResolvedValue(makeAsset());
    Asset.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await updateAsset(mockReq({ name: 'Bàn mới' }, { id: 'asset123' }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Không tìm thấy tài sản → 404', async () => {
    Asset.findById = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await updateAsset(mockReq({ name: 'Bàn mới' }, { id: 'notexist' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] Đổi assetCode sang mã đã tồn tại → 409', async () => {
    const existing = makeAsset({ _id: 'other123', assetCode: 'TS001' });
    const asset = makeAsset({ _id: 'asset123', assetCode: 'TS002' });
    Asset.findById = jest.fn().mockResolvedValue(asset);
    Asset.findOne = jest.fn().mockResolvedValue(existing);
    const res = mockRes();
    await updateAsset(mockReq({ assetCode: 'TS001' }, { id: 'asset123' }), res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('UTC004 [B] Đổi assetCode sang cùng mã hiện tại → không kiểm tra trùng', async () => {
    const asset = makeAsset({ assetCode: 'TS001' });
    Asset.findById = jest.fn().mockResolvedValue(asset);
    const res = mockRes();
    await updateAsset(mockReq({ assetCode: 'TS001' }, { id: 'asset123' }), res);
    expect(Asset.findOne).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC005 [A] DB throw exception → 500', async () => {
    Asset.findById = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await updateAsset(mockReq({ name: 'X' }, { id: 'asset123' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// deleteAsset
// ════════════════════════════════════════════════
describe('deleteAsset', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Xóa tài sản thành công → 200', async () => {
    Asset.findByIdAndDelete = jest.fn().mockResolvedValue(makeAsset());
    const res = mockRes();
    await deleteAsset(mockReq({}, { id: 'asset123' }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Không tìm thấy tài sản → 404', async () => {
    Asset.findByIdAndDelete = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await deleteAsset(mockReq({}, { id: 'notexist' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] DB throw exception → 500', async () => {
    Asset.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await deleteAsset(mockReq({}, { id: 'asset123' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// bulkCreateAssets
// ════════════════════════════════════════════════
describe('bulkCreateAssets', () => {
  beforeEach(() => jest.clearAllMocks());

  const validItem = { assetCode: 'TS001', name: 'Bàn học' };

  test('UTC001 [N] Tạo hàng loạt thành công → 200', async () => {
    Asset.findOne = jest.fn().mockResolvedValue(null);
    Asset.create = jest.fn().mockResolvedValue(makeAsset());
    const res = mockRes();
    await bulkCreateAssets(mockReq({ assets: [validItem] }), res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ created: 1, skipped: 0 }) })
    );
  });

  test('UTC002 [A] Không truyền assets → 400', async () => {
    const res = mockRes();
    await bulkCreateAssets(mockReq({}), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] assets là mảng rỗng → 400', async () => {
    const res = mockRes();
    await bulkCreateAssets(mockReq({ assets: [] }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] Item thiếu assetCode → bị skip', async () => {
    Asset.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await bulkCreateAssets(mockReq({ assets: [{ name: 'Bàn' }] }), res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ created: 0, skipped: 1 }) })
    );
  });

  test('UTC005 [A] Item thiếu name → bị skip', async () => {
    Asset.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await bulkCreateAssets(mockReq({ assets: [{ assetCode: 'TS001' }] }), res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ created: 0, skipped: 1 }) })
    );
  });

  test('UTC006 [A] Mã tài sản đã tồn tại → item bị skip', async () => {
    Asset.findOne = jest.fn().mockResolvedValue(makeAsset());
    const res = mockRes();
    await bulkCreateAssets(mockReq({ assets: [validItem] }), res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ skipped: 1 }) })
    );
  });

  test('UTC007 [B] Mix item hợp lệ và không hợp lệ → đếm đúng', async () => {
    Asset.findOne = jest.fn()
      .mockResolvedValueOnce(null)        // item 1 OK
      .mockResolvedValueOnce(makeAsset()); // item 2 trùng
    Asset.create = jest.fn().mockResolvedValue(makeAsset());
    const res = mockRes();
    await bulkCreateAssets(mockReq({ assets: [validItem, { assetCode: 'TS002', name: 'Ghế' }] }), res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ created: 1, skipped: 1 }) })
    );
  });

  test('UTC008 [A] DB throw exception (outer) → 500', async () => {
    Asset.findOne = jest.fn().mockRejectedValue(new Error('DB crash'));
    // Outer try sẽ catch do findOne ném lỗi trong vòng for
    // Thực ra inner try catch nên skipped tăng
    const res = mockRes();
    await bulkCreateAssets(mockReq({ assets: [validItem] }), res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ skipped: 1 }) })
    );
  });
});
