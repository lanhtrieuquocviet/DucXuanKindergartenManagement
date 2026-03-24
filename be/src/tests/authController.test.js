const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../models/User');
jest.mock('../utils/email', () => ({
  sendPasswordResetEmail: jest.fn(),
  sendOTPEmail: jest.fn(),
  generateRandomPassword: jest.fn(),
}));
jest.mock('../utils/systemLog', () => ({ createSystemLog: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../utils/tokenBlacklist', () => ({ addToBlacklist: jest.fn() }));

const User = require('../models/User');
const { login, resetPassword } = require('../controller/authController');

const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockReq = (body = {}) => ({ body, headers: {} });
const makeUser = (o = {}) => ({
  _id: 'uid123', username: 'testuser', passwordHash: 'hashed', status: 'active',
  email: 'test@example.com', roles: [], otpVerified: true,
  toObject: function () { return { ...this }; },
  save: jest.fn().mockResolvedValue(undefined),
  ...o,
});

// ════════════════════════════════════════════════
// login
// ════════════════════════════════════════════════
describe('login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Đăng nhập thành công', async () => {
    User.findOne = jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue(makeUser()) });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('token_abc');
    const res = mockRes();
    await login(mockReq({ username: 'testuser', password: 'Password1!' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Thiếu username → 400', async () => {
    const res = mockRes();
    await login(mockReq({ password: 'Password1!' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Thiếu password → 400', async () => {
    const res = mockRes();
    await login(mockReq({ username: 'testuser' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] User không tồn tại → 401', async () => {
    User.findOne = jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    const res = mockRes();
    await login(mockReq({ username: 'nouser', password: 'Password1!' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('UTC005 [A] Tài khoản bị khóa → 403', async () => {
    User.findOne = jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue(makeUser({ status: 'inactive' })) });
    const res = mockRes();
    await login(mockReq({ username: 'testuser', password: 'Password1!' }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('UTC006 [A] Sai mật khẩu → 401', async () => {
    User.findOne = jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue(makeUser()) });
    bcrypt.compare.mockResolvedValue(false);
    const res = mockRes();
    await login(mockReq({ username: 'testuser', password: 'WrongPass!' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('UTC007 [B] Username có khoảng trắng đầu/cuối vẫn match → 200', async () => {
    User.findOne = jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue(makeUser()) });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('token_abc');
    const res = mockRes();
    await login(mockReq({ username: '  testuser  ', password: 'Password1!' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('UTC008 [A] DB throw exception → 500', async () => {
    User.findOne = jest.fn().mockReturnValue({ populate: jest.fn().mockRejectedValue(new Error('DB error')) });
    const res = mockRes();
    await login(mockReq({ username: 'testuser', password: 'Password1!' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// resetPassword
// ════════════════════════════════════════════════
describe('resetPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  test('UTC001 [N] Đặt lại mật khẩu thành công → 200', async () => {
    User.findOne = jest.fn().mockResolvedValue(makeUser({ otpVerified: true }));
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('new_hash');
    const res = mockRes();
    await resetPassword(mockReq({ username: 'testuser', newPassword: 'NewPass1!' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Thiếu username → 400', async () => {
    const res = mockRes();
    await resetPassword(mockReq({ newPassword: 'NewPass1!' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Thiếu newPassword → 400', async () => {
    const res = mockRes();
    await resetPassword(mockReq({ username: 'testuser' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [B] newPassword < 8 ký tự → 400', async () => {
    const res = mockRes();
    await resetPassword(mockReq({ username: 'testuser', newPassword: 'Ab1!' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('8 ký tự') }));
  });

  test('UTC005 [B] newPassword > 64 ký tự → 400', async () => {
    const res = mockRes();
    await resetPassword(mockReq({ username: 'testuser', newPassword: 'A1!' + 'a'.repeat(63) }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('64 ký tự') }));
  });

  test('UTC006 [A] newPassword chứa khoảng trắng → 400', async () => {
    const res = mockRes();
    await resetPassword(mockReq({ username: 'testuser', newPassword: 'New Pass1!' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('khoảng trắng') }));
  });

  test('UTC007 [A] Username không tồn tại → 404', async () => {
    User.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await resetPassword(mockReq({ username: 'unknown', newPassword: 'NewPass1!' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC008 [A] Tài khoản bị khóa → 403', async () => {
    User.findOne = jest.fn().mockResolvedValue(makeUser({ status: 'inactive' }));
    const res = mockRes();
    await resetPassword(mockReq({ username: 'testuser', newPassword: 'NewPass1!' }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('UTC009 [A] Chưa xác minh OTP → 400', async () => {
    User.findOne = jest.fn().mockResolvedValue(makeUser({ otpVerified: false }));
    const res = mockRes();
    await resetPassword(mockReq({ username: 'testuser', newPassword: 'NewPass1!' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('OTP') }));
  });

  test('UTC010 [B] newPassword đúng 8 ký tự (min) → 200', async () => {
    User.findOne = jest.fn().mockResolvedValue(makeUser({ otpVerified: true }));
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hash');
    const res = mockRes();
    await resetPassword(mockReq({ username: 'testuser', newPassword: 'Passw1!x' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('UTC011 [B] newPassword đúng 64 ký tự (max) → 200', async () => {
    User.findOne = jest.fn().mockResolvedValue(makeUser({ otpVerified: true }));
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hash');
    const res = mockRes();
    await resetPassword(mockReq({ username: 'testuser', newPassword: 'A1!' + 'a'.repeat(61) }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('UTC012 [A] DB throw exception → 500', async () => {
    User.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await resetPassword(mockReq({ username: 'testuser', newPassword: 'NewPass1!' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
