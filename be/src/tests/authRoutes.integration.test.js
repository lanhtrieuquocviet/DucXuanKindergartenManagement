const express = require('express');
const request = require('supertest');

jest.mock('../services/authService.js', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  changePassword: jest.fn(),
  verifyAccount: jest.fn(),
  verifyOTP: jest.fn(),
  resetPassword: jest.fn(),
  getMyChildren: jest.fn(),
  createMyChild: jest.fn(),
  updateMyChild: jest.fn(),
  deleteMyChild: jest.fn(),
  getMyStudentInfo: jest.fn(),
}));

const authService = require('../services/authService.js');
const authRoutes = require('../routes/auth.routes');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
};

describe('auth.routes integration', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
  });

  test('IT001 POST /api/auth/login -> route calls service and returns success payload', async () => {
    authService.login.mockImplementation((req, res) => {
      return res.status(200).json({
        status: 'success',
        message: 'Đăng nhập thành công',
        data: { token: 'token_abc' },
      });
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'teacher01', password: 'Password1!' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'success',
        message: expect.any(String),
      })
    );
    expect(authService.login).toHaveBeenCalledTimes(1);
  });

  test('IT002 POST /api/auth/forgot-password/verify-account -> route forwards payload to service', async () => {
    authService.verifyAccount.mockImplementation((req, res) => {
      return res.status(200).json({
        status: 'success',
        message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
        data: { maskedEmail: 'te***@mail.com' },
      });
    });

    const response = await request(app)
      .post('/api/auth/forgot-password/verify-account')
      .send({ username: 'teacher01' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          maskedEmail: expect.any(String),
        }),
      })
    );
    expect(authService.verifyAccount).toHaveBeenCalledTimes(1);
  });

  test('IT003 GET /api/auth/me without token -> middleware blocks with 401', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'error',
        message: 'Thiếu token xác thực',
      })
    );
    expect(authService.getProfile).not.toHaveBeenCalled();
  });
});
