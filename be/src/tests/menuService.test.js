jest.mock('../models/Menu');
jest.mock('../models/DailyMenu');
jest.mock('../models/NutritionPlanSetting');
jest.mock('../models/DistrictNutritionPlan');
jest.mock('../services/districtNutritionPlanService', () => ({
  autoArchiveExpiredDistrictPlans: jest.fn().mockResolvedValue(undefined),
}));

const Menu = require('../models/Menu');
const DailyMenu = require('../models/DailyMenu');
const NutritionPlanSetting = require('../models/NutritionPlanSetting');
const DistrictNutritionPlan = require('../models/DistrictNutritionPlan');

const {
  createMenu,
  getPublicMenus,
  getMenus,
  getPublicMenuDetail,
  getMenuDetail,
  updateMenu,
  submitMenu,
  approveMenu,
  rejectMenu,
  requestEditFromActiveMenu,
  applyMenu,
  endMenu,
  getNutritionPlanSetting,
  updateNutritionPlanSetting,
} = require('../services/menuService');

const mockRes = () => {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};
const mockReq = (body = {}, params = {}, query = {}, user = { _id: 'user1', roles: ['KitchenStaff'] }) => ({
  body, params, query, user,
});

const VALID_OID = '507f1f77bcf86cd799439011';

const makeMenu = (o = {}) => ({
  _id: VALID_OID,
  month: 6,
  year: 2026,
  status: 'draft',
  isCurrent: false,
  version: 1,
  changeReason: '',
  parentMenuId: null,
  changedAt: null,
  statusHistory: [],
  rejectReason: '',
  rejectPresets: [],
  rejectDetail: '',
  appliedAt: null,
  endedAt: null,
  scheduledStartAt: null,
  scheduledEndAt: null,
  toObject: function () { return { ...this }; },
  save: jest.fn().mockResolvedValue(undefined),
  ...o,
});

// ════════════════════════════════════════════════
// createMenu
// ════════════════════════════════════════════════
describe('createMenu', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Tạo thực đơn thành công → 201', async () => {
    Menu.findOne = jest.fn().mockResolvedValue(null);
    const m = makeMenu();
    Menu.mockImplementation(() => m);
    DailyMenu.insertMany = jest.fn().mockResolvedValue([]);
    const res = mockRes();
    await createMenu(mockReq({ month: 6, year: 2026 }), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] Thiếu month → 400', async () => {
    const res = mockRes();
    await createMenu(mockReq({ year: 2026 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Thiếu year → 400', async () => {
    const res = mockRes();
    await createMenu(mockReq({ month: 6 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] month < 1 → 400', async () => {
    const res = mockRes();
    await createMenu(mockReq({ month: 0, year: 2026 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC005 [A] month > 12 → 400', async () => {
    const res = mockRes();
    await createMenu(mockReq({ month: 13, year: 2026 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC006 [A] Tháng/năm đã qua → 400', async () => {
    const res = mockRes();
    await createMenu(mockReq({ month: 1, year: 2020 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('UTC007 [A] Thực đơn tháng này đã tồn tại → 400', async () => {
    Menu.findOne = jest.fn().mockResolvedValue(makeMenu());
    const res = mockRes();
    await createMenu(mockReq({ month: 6, year: 2026 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('đã tồn tại') }));
  });

  test('UTC008 [B] month = 1 (biên dưới) hợp lệ → 201', async () => {
    Menu.findOne = jest.fn().mockResolvedValue(null);
    const m = makeMenu({ month: 1, year: 2027 });
    Menu.mockImplementation(() => m);
    DailyMenu.insertMany = jest.fn().mockResolvedValue([]);
    const res = mockRes();
    await createMenu(mockReq({ month: 1, year: 2027 }), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('UTC009 [B] month = 12 (biên trên) hợp lệ → 201', async () => {
    Menu.findOne = jest.fn().mockResolvedValue(null);
    const m = makeMenu({ month: 12, year: 2027 });
    Menu.mockImplementation(() => m);
    DailyMenu.insertMany = jest.fn().mockResolvedValue([]);
    const res = mockRes();
    await createMenu(mockReq({ month: 12, year: 2027 }), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('UTC010 [A] DB throw exception → 500', async () => {
    Menu.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await createMenu(mockReq({ month: 6, year: 2026 }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getPublicMenus
// ════════════════════════════════════════════════
describe('getPublicMenus', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Lấy danh sách thực đơn công khai → 200', async () => {
    Menu.find = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([makeMenu({ status: 'approved' })]),
      }),
    });
    const res = mockRes();
    await getPublicMenus(mockReq({}, {}, {}), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [B] Filter theo month/year → find nhận đúng filter', async () => {
    Menu.find = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      }),
    });
    const res = mockRes();
    await getPublicMenus(mockReq({}, {}, { month: '4', year: '2026' }), res);
    expect(Menu.find).toHaveBeenCalledWith(
      expect.objectContaining({ month: 4, year: 2026 }),
    );
  });

  test('UTC003 [A] DB throw exception → 500', async () => {
    Menu.find = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('DB error')),
      }),
    });
    const res = mockRes();
    await getPublicMenus(mockReq({}, {}, {}), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getMenus
// ════════════════════════════════════════════════
describe('getMenus', () => {
  beforeEach(() => jest.clearAllMocks());

  const setupMenuFind = (docs) => {
    Menu.countDocuments = jest.fn().mockResolvedValue(docs.length);
    Menu.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(docs),
          }),
        }),
      }),
    });
  };

  test('UTC001 [N] KitchenStaff thấy tất cả thực đơn → 200', async () => {
    setupMenuFind([makeMenu()]);
    const res = mockRes();
    await getMenus(mockReq({}, {}, {}, { _id: 'u1', roles: [{ roleName: 'KitchenStaff' }] }), res);
    expect(Menu.find).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [N] SchoolAdmin không thấy draft → find với $ne draft', async () => {
    setupMenuFind([makeMenu({ status: 'pending' })]);
    const res = mockRes();
    await getMenus(mockReq({}, {}, {}, { _id: 'u1', roles: [{ roleName: 'SchoolAdmin' }] }), res);
    expect(Menu.find).toHaveBeenCalledWith(
      expect.objectContaining({ status: expect.objectContaining({ $ne: 'draft' }) }),
    );
  });

  test('UTC003 [N] Student chỉ thấy active/completed → filter đúng', async () => {
    setupMenuFind([makeMenu({ status: 'active' })]);
    const res = mockRes();
    await getMenus(mockReq({}, {}, {}, { _id: 'u1', roles: [{ roleName: 'Student' }] }), res);
    expect(Menu.find).toHaveBeenCalledWith(
      expect.objectContaining({ status: expect.objectContaining({ $in: ['active', 'completed'] }) }),
    );
  });

  test('UTC004 [B] Pagination mặc định page=1, limit=20', async () => {
    setupMenuFind([]);
    const res = mockRes();
    await getMenus(mockReq({}, {}, {}), res);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.pagination.page).toBe(1);
    expect(jsonCall.pagination.limit).toBe(20);
  });

  test('UTC005 [A] DB throw exception → 500', async () => {
    Menu.countDocuments = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await getMenus(mockReq({}, {}, {}), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getPublicMenuDetail
// ════════════════════════════════════════════════
describe('getPublicMenuDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  const setupDailyMenuFind = () => {
    DailyMenu.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });
  };

  test('UTC001 [N] Lấy chi tiết thực đơn công khai thành công → 200', async () => {
    Menu.findOne = jest.fn().mockResolvedValue(makeMenu({ status: 'approved' }));
    setupDailyMenuFind();
    const res = mockRes();
    await getPublicMenuDetail(mockReq({}, { id: VALID_OID }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] ID không hợp lệ → 400', async () => {
    const res = mockRes();
    await getPublicMenuDetail(mockReq({}, { id: 'not-valid-id' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Không tìm thấy thực đơn → 404', async () => {
    Menu.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await getPublicMenuDetail(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    Menu.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await getPublicMenuDetail(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getMenuDetail
// ════════════════════════════════════════════════
describe('getMenuDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  const setupDailyMenuFind = () => {
    DailyMenu.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });
  };

  test('UTC001 [N] Lấy chi tiết thực đơn thành công → 200', async () => {
    Menu.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(makeMenu({ status: 'draft' })),
    });
    setupDailyMenuFind();
    const res = mockRes();
    await getMenuDetail(mockReq({}, { id: VALID_OID }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] ID không hợp lệ → 400', async () => {
    const res = mockRes();
    await getMenuDetail(mockReq({}, { id: 'bad-id' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Không tìm thấy thực đơn → 404', async () => {
    Menu.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });
    const res = mockRes();
    await getMenuDetail(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC004 [B] Student chỉ thấy active/completed, menu draft → 404', async () => {
    Menu.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(makeMenu({ status: 'draft' })),
    });
    const res = mockRes();
    await getMenuDetail(
      mockReq({}, { id: VALID_OID }, {}, { _id: 'u1', roles: [{ roleName: 'Student' }] }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC005 [A] DB throw exception → 500', async () => {
    Menu.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockRejectedValue(new Error('DB error')),
    });
    const res = mockRes();
    await getMenuDetail(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// updateMenu
// ════════════════════════════════════════════════
describe('updateMenu', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Cập nhật thực đơn thành công → 200', async () => {
    Menu.findById = jest.fn().mockResolvedValue(makeMenu());
    const res = mockRes();
    await updateMenu(mockReq({ month: 7 }, { id: VALID_OID }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] Không tìm thấy thực đơn → 404', async () => {
    Menu.findById = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await updateMenu(mockReq({ month: 7 }, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] DB throw exception → 500', async () => {
    Menu.findById = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await updateMenu(mockReq({ month: 7 }, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// submitMenu
// ════════════════════════════════════════════════
describe('submitMenu', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Gửi duyệt thành công (status: draft) → 200', async () => {
    Menu.findById = jest.fn().mockResolvedValue(makeMenu({ status: 'draft' }));
    const res = mockRes();
    await submitMenu(mockReq({}, { id: VALID_OID }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [N] Gửi duyệt lại (status: rejected) → 200', async () => {
    Menu.findById = jest.fn().mockResolvedValue(makeMenu({ status: 'rejected' }));
    const res = mockRes();
    await submitMenu(mockReq({}, { id: VALID_OID }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC003 [A] Không tìm thấy thực đơn → 404', async () => {
    Menu.findById = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await submitMenu(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC004 [A] Status không phải draft/rejected → 400', async () => {
    Menu.findById = jest.fn().mockResolvedValue(makeMenu({ status: 'pending' }));
    const res = mockRes();
    await submitMenu(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('UTC005 [A] DB throw exception → 500', async () => {
    Menu.findById = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await submitMenu(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// approveMenu
// ════════════════════════════════════════════════
describe('approveMenu', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Duyệt thực đơn thành công → 200', async () => {
    Menu.findById = jest.fn().mockResolvedValue(makeMenu({ status: 'pending' }));
    const res = mockRes();
    await approveMenu(mockReq({}, { id: VALID_OID }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] Không tìm thấy thực đơn → 404', async () => {
    Menu.findById = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await approveMenu(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] Thực đơn không ở trạng thái pending → 400', async () => {
    Menu.findById = jest.fn().mockResolvedValue(makeMenu({ status: 'draft' }));
    const res = mockRes();
    await approveMenu(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    Menu.findById = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await approveMenu(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// rejectMenu
// ════════════════════════════════════════════════
describe('rejectMenu', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Từ chối với lý do chi tiết → 200', async () => {
    Menu.findById = jest.fn().mockResolvedValue(makeMenu({ status: 'pending' }));
    const res = mockRes();
    await rejectMenu(mockReq({ detail: 'Không đủ dinh dưỡng cần thiết' }, { id: VALID_OID }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [N] Từ chối với preset → 200', async () => {
    Menu.findById = jest.fn().mockResolvedValue(makeMenu({ status: 'pending' }));
    const res = mockRes();
    await rejectMenu(mockReq({ presets: ['nutrition'] }, { id: VALID_OID }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC003 [A] Không tìm thấy thực đơn → 404', async () => {
    Menu.findById = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await rejectMenu(mockReq({ detail: 'Lý do từ chối dài' }, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC004 [A] Thực đơn không ở trạng thái pending → 400', async () => {
    Menu.findById = jest.fn().mockResolvedValue(makeMenu({ status: 'approved' }));
    const res = mockRes();
    await rejectMenu(mockReq({ detail: 'Lý do từ chối dài' }, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC005 [A] Không có preset, detail < 5 ký tự → 400', async () => {
    Menu.findById = jest.fn().mockResolvedValue(makeMenu({ status: 'pending' }));
    const res = mockRes();
    await rejectMenu(mockReq({ presets: [], detail: 'ok' }, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('UTC006 [A] DB throw exception → 500', async () => {
    Menu.findById = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await rejectMenu(mockReq({ detail: 'Lý do từ chối' }, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// requestEditFromActiveMenu
// ════════════════════════════════════════════════
describe('requestEditFromActiveMenu', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Yêu cầu chỉnh sửa thực đơn đang áp dụng → 200', async () => {
    const m = makeMenu({ status: 'active', isCurrent: true, version: 1 });
    const cloned = makeMenu({
      _id: 'newmenu',
      status: 'rejected',
      isCurrent: false,
      version: 2,
      parentMenuId: m._id,
      changeReason: '• Chưa cân đối dinh dưỡng / chưa đạt chuẩn',
    });
    Menu.mockImplementation(() => cloned);
    Menu.findById = jest.fn()
      .mockResolvedValueOnce(m)
      .mockReturnValue({ populate: jest.fn().mockResolvedValue(cloned) });
    DailyMenu.find = jest.fn().mockResolvedValue([
      {
        weekType: 'odd',
        dayOfWeek: 'mon',
        lunchFoods: [],
        afternoonFoods: [],
      },
    ]);
    DailyMenu.insertMany = jest.fn().mockResolvedValue([]);
    const res = mockRes();
    await requestEditFromActiveMenu(mockReq({ presets: ['nutrition'] }, { id: VALID_OID }), res);
    expect(m.status).toBe('completed');
    expect(m.isCurrent).toBe(false);
    expect(cloned.status).toBe('rejected');
    expect(cloned.isCurrent).toBe(false);
    expect(cloned.version).toBe(2);
    expect(cloned.parentMenuId).toBe(m._id);
    expect(DailyMenu.insertMany).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] Không tìm thấy thực đơn → 404', async () => {
    Menu.findById = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await requestEditFromActiveMenu(mockReq({ detail: 'Chi tiết yêu cầu' }, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] Thực đơn không ở trạng thái active → 400', async () => {
    Menu.findById = jest.fn().mockResolvedValue(makeMenu({ status: 'pending' }));
    const res = mockRes();
    await requestEditFromActiveMenu(mockReq({ detail: 'Chi tiết yêu cầu' }, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] Không có preset, detail < 5 ký tự → 400', async () => {
    Menu.findById = jest.fn().mockResolvedValue(makeMenu({ status: 'active' }));
    const res = mockRes();
    await requestEditFromActiveMenu(mockReq({ presets: [], detail: 'ab' }, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC005 [A] DB throw exception → 500', async () => {
    Menu.findById = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await requestEditFromActiveMenu(mockReq({ presets: ['nutrition'] }, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// applyMenu
// ════════════════════════════════════════════════
describe('applyMenu', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Áp dụng thực đơn đã duyệt → 200', async () => {
    const approved = makeMenu({ status: 'approved' });
    Menu.findById = jest.fn()
      .mockResolvedValueOnce(approved)
      .mockReturnValue({ populate: jest.fn().mockResolvedValue(approved) });
    Menu.find = jest.fn().mockImplementation((filter) => {
      if (filter?.status === 'active' && filter?.scheduledEndAt) return Promise.resolve([]);
      if (filter?.status === 'approved' && filter?.scheduledStartAt) return Promise.resolve([]);
      if (filter?.status === 'active') return Promise.resolve([]);
      return Promise.resolve([]);
    });
    const res = mockRes();
    await applyMenu(mockReq({}, { id: VALID_OID }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [B] Kết thúc thực đơn đang active trước khi áp dụng mới', async () => {
    const oldActive = makeMenu({ status: 'active', _id: 'oldmenu' });
    const approved = makeMenu({ status: 'approved' });
    Menu.findById = jest.fn()
      .mockResolvedValueOnce(approved)
      .mockReturnValue({ populate: jest.fn().mockResolvedValue(approved) });
    Menu.find = jest.fn().mockImplementation((filter) => {
      if (filter?.status === 'active' && filter?.scheduledEndAt) return Promise.resolve([]);
      if (filter?.status === 'approved' && filter?.scheduledStartAt) return Promise.resolve([]);
      if (filter?.status === 'active') return Promise.resolve([oldActive]);
      return Promise.resolve([]);
    });
    const res = mockRes();
    await applyMenu(mockReq({}, { id: VALID_OID }), res);
    expect(oldActive.save).toHaveBeenCalled();
    expect(oldActive.status).toBe('completed');
  });

  test('UTC003 [A] Không tìm thấy thực đơn → 404', async () => {
    Menu.findById = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await applyMenu(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC004 [A] Thực đơn không ở trạng thái approved → 400', async () => {
    Menu.findById = jest.fn().mockResolvedValue(makeMenu({ status: 'pending' }));
    const res = mockRes();
    await applyMenu(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC005 [A] DB throw exception → 500', async () => {
    Menu.findById = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await applyMenu(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// endMenu
// ════════════════════════════════════════════════
describe('endMenu', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Kết thúc thực đơn đang áp dụng → 200', async () => {
    const active = makeMenu({ status: 'active' });
    Menu.findById = jest.fn()
      .mockResolvedValueOnce(active)
      .mockReturnValue({ populate: jest.fn().mockResolvedValue(active) });
    const res = mockRes();
    await endMenu(mockReq({}, { id: VALID_OID }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [A] Không tìm thấy thực đơn → 404', async () => {
    Menu.findById = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await endMenu(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC003 [A] Thực đơn không ở trạng thái active → 400', async () => {
    Menu.findById = jest.fn().mockResolvedValue(makeMenu({ status: 'approved' }));
    const res = mockRes();
    await endMenu(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    Menu.findById = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await endMenu(mockReq({}, { id: VALID_OID }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// getNutritionPlanSetting
// ════════════════════════════════════════════════
describe('getNutritionPlanSetting', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Có kế hoạch quận đang active → trả về kế hoạch quận', async () => {
    DistrictNutritionPlan.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ items: [{ name: 'Calo', min: 600, max: 700, actual: 0 }] }),
      }),
    });
    const res = mockRes();
    await getNutritionPlanSetting(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [N] Không có kế hoạch quận → lấy setting từ DB', async () => {
    DistrictNutritionPlan.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });
    NutritionPlanSetting.findOne = jest.fn().mockResolvedValue({
      items: [{ name: 'Calo', min: 615, max: 726, actual: 0 }],
    });
    const res = mockRes();
    await getNutritionPlanSetting(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC003 [N] Không có kế hoạch quận, không có setting → tạo default', async () => {
    DistrictNutritionPlan.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });
    NutritionPlanSetting.findOne = jest.fn().mockResolvedValue(null);
    NutritionPlanSetting.create = jest.fn().mockResolvedValue({
      items: [{ name: 'Calo trung bình/ngày', min: 615, max: 726, actual: 0 }],
    });
    const res = mockRes();
    await getNutritionPlanSetting(mockReq(), res);
    expect(NutritionPlanSetting.create).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC004 [A] DB throw exception → 500', async () => {
    DistrictNutritionPlan.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB error')) }),
    });
    const res = mockRes();
    await getNutritionPlanSetting(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// updateNutritionPlanSetting
// ════════════════════════════════════════════════
describe('updateNutritionPlanSetting', () => {
  beforeEach(() => jest.clearAllMocks());

  const validItems = [{ name: 'Calo', min: 600, max: 800, actual: 0 }];

  test('UTC001 [N] Cập nhật setting thành công (không có district plan) → 200', async () => {
    DistrictNutritionPlan.findOne = jest.fn().mockResolvedValue(null);
    NutritionPlanSetting.findOneAndUpdate = jest.fn().mockResolvedValue({ items: validItems });
    const res = mockRes();
    await updateNutritionPlanSetting(mockReq({ items: validItems }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC002 [N] Cập nhật district plan khi có plan đang active → 200', async () => {
    const districtPlan = {
      items: [],
      save: jest.fn().mockResolvedValue(undefined),
    };
    DistrictNutritionPlan.findOne = jest.fn().mockResolvedValue(districtPlan);
    const res = mockRes();
    await updateNutritionPlanSetting(mockReq({ items: validItems }), res);
    expect(districtPlan.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('UTC003 [A] Items chứa item không hợp lệ (tên rỗng, min/max NaN) → 400', async () => {
    const res = mockRes();
    await updateNutritionPlanSetting(mockReq({ items: [{ name: '', min: 'abc', max: 'xyz' }] }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] min >= max → 400', async () => {
    DistrictNutritionPlan.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await updateNutritionPlanSetting(
      mockReq({ items: [{ name: 'Calo', min: 800, max: 600, actual: 0 }] }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC005 [A] min âm → 400', async () => {
    DistrictNutritionPlan.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await updateNutritionPlanSetting(
      mockReq({ items: [{ name: 'Calo', min: -10, max: 600, actual: 0 }] }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC006 [A] DB throw exception → 500', async () => {
    DistrictNutritionPlan.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await updateNutritionPlanSetting(mockReq({ items: validItems }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
