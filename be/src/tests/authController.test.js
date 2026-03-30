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
const { login, resetPassword, verifyAccount, verifyOTP } = require('../controller/authController');
const { sendOTPEmail } = require('../utils/email');

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

// ════════════════════════════════════════════════
// verifyAccount (Gửi OTP qua email)
// ════════════════════════════════════════════════
describe('verifyAccount', () => {
  beforeEach(() => jest.clearAllMocks());

  const makeUserForOtp = (o = {}) => makeUser({
    email: 'test@example.com',
    otpCode: null,
    otpExpiresAt: null,
    otpVerified: false,
    passwordResetAttempts: 0,
    lastPasswordResetAt: null,
    nextPasswordResetAllowedAt: null,
    ...o,
  });

  test('UTC001 [N] Gửi OTP thành công → 200', async () => {
    User.findOne = jest.fn().mockResolvedValue(makeUserForOtp());
    sendOTPEmail.mockResolvedValue(undefined);
    const res = mockRes();
    await verifyAccount(mockReq({ username: 'testuser' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Thiếu username → 400', async () => {
    const res = mockRes();
    await verifyAccount(mockReq({}), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Username không tồn tại → 404', async () => {
    User.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await verifyAccount(mockReq({ username: 'nouser' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC004 [A] Tài khoản bị khóa → 403', async () => {
    User.findOne = jest.fn().mockResolvedValue(makeUserForOtp({ status: 'inactive' }));
    const res = mockRes();
    await verifyAccount(mockReq({ username: 'testuser' }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('UTC005 [A] Tài khoản không có email → 400', async () => {
    User.findOne = jest.fn().mockResolvedValue(makeUserForOtp({ email: null }));
    const res = mockRes();
    await verifyAccount(mockReq({ username: 'testuser' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('email') }));
  });

  test('UTC006 [A] Bị rate limit (đang trong thời gian chờ) → 429', async () => {
    const waitUntil = new Date(Date.now() + 30 * 60 * 1000); // chờ 30 phút
    User.findOne = jest.fn().mockResolvedValue(makeUserForOtp({
      passwordResetAttempts: 5,
      nextPasswordResetAllowedAt: waitUntil,
      lastPasswordResetAt: new Date(),
    }));
    const res = mockRes();
    await verifyAccount(mockReq({ username: 'testuser' }), res);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  test('UTC007 [A] Gửi email thất bại → 500', async () => {
    User.findOne = jest.fn().mockResolvedValue(makeUserForOtp());
    sendOTPEmail.mockRejectedValue(new Error('Email error'));
    const res = mockRes();
    await verifyAccount(mockReq({ username: 'testuser' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('UTC008 [B] Response chứa maskedEmail → che bớt email', async () => {
    User.findOne = jest.fn().mockResolvedValue(makeUserForOtp());
    sendOTPEmail.mockResolvedValue(undefined);
    const res = mockRes();
    await verifyAccount(mockReq({ username: 'testuser' }), res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ maskedEmail: expect.any(String) }) })
    );
  });

  test('UTC009 [A] DB throw exception → 500', async () => {
    User.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await verifyAccount(mockReq({ username: 'testuser' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════
// verifyOTP
// ════════════════════════════════════════════════
describe('verifyOTP', () => {
  beforeEach(() => jest.clearAllMocks());

  const validOtp = '123456';
  const makeUserWithOtp = (o = {}) => makeUser({
    otpCode: validOtp,
    otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // còn 10 phút
    otpVerified: false,
    ...o,
  });

  test('UTC001 [N] Xác minh OTP thành công → 200', async () => {
    User.findOne = jest.fn().mockResolvedValue(makeUserWithOtp());
    const res = mockRes();
    await verifyOTP(mockReq({ username: 'testuser', otpCode: validOtp }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('UTC002 [A] Thiếu username → 400', async () => {
    const res = mockRes();
    await verifyOTP(mockReq({ otpCode: validOtp }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC003 [A] Thiếu otpCode → 400', async () => {
    const res = mockRes();
    await verifyOTP(mockReq({ username: 'testuser' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UTC004 [A] Username không tồn tại → 404', async () => {
    User.findOne = jest.fn().mockResolvedValue(null);
    const res = mockRes();
    await verifyOTP(mockReq({ username: 'nouser', otpCode: validOtp }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('UTC005 [A] Tài khoản bị khóa → 403', async () => {
    User.findOne = jest.fn().mockResolvedValue(makeUserWithOtp({ status: 'inactive' }));
    const res = mockRes();
    await verifyOTP(mockReq({ username: 'testuser', otpCode: validOtp }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('UTC006 [A] Chưa có OTP (chưa gửi) → 400', async () => {
    User.findOne = jest.fn().mockResolvedValue(makeUserWithOtp({ otpCode: null }));
    const res = mockRes();
    await verifyOTP(mockReq({ username: 'testuser', otpCode: validOtp }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('OTP') }));
  });

  test('UTC007 [A] OTP sai → 400', async () => {
    User.findOne = jest.fn().mockResolvedValue(makeUserWithOtp());
    const res = mockRes();
    await verifyOTP(mockReq({ username: 'testuser', otpCode: '000000' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('không chính xác') }));
  });

  test('UTC008 [A] OTP đã hết hạn → 400', async () => {
    User.findOne = jest.fn().mockResolvedValue(
      makeUserWithOtp({ otpExpiresAt: new Date(Date.now() - 1000) }) // hết hạn 1 giây trước
    );
    const res = mockRes();
    await verifyOTP(mockReq({ username: 'testuser', otpCode: validOtp }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('hết hạn') }));
  });

  test('UTC009 [B] OTP có khoảng trắng đầu/cuối vẫn match → 200', async () => {
    User.findOne = jest.fn().mockResolvedValue(makeUserWithOtp());
    const res = mockRes();
    await verifyOTP(mockReq({ username: 'testuser', otpCode: `  ${validOtp}  ` }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('UTC010 [A] DB throw exception → 500', async () => {
    User.findOne = jest.fn().mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await verifyOTP(mockReq({ username: 'testuser', otpCode: validOtp }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
