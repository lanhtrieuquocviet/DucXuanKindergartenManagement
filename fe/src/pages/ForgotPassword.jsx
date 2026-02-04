import { useState } from 'react';
import { Link } from 'react-router-dom';
import { post, ENDPOINTS } from '../service/api';
import './Login.css';

function generateCaptcha(length = 5) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Nhập tài khoản, 2: Nhập OTP, 3: Nhập mật khẩu mới
  const [account, setAccount] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaCode, setCaptchaCode] = useState(() => generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput('');
    setCaptchaError('');
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!captchaInput.trim()) {
      setCaptchaError('Vui lòng nhập mã bảo mật');
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setCaptchaError('Mã bảo mật không chính xác');
      refreshCaptcha();
      return;
    }

    setCaptchaError('');
    setLoading(true);

    try {
      const response = await post(
        ENDPOINTS.AUTH.FORGOT_PASSWORD_VERIFY_ACCOUNT,
        { username: account },
        { includeAuth: false }
      );

      if (response.status === 'success') {
        setMaskedEmail(response.data.maskedEmail);
        setStep(2); // Chuyển sang bước nhập OTP
        refreshCaptcha();
      }
    } catch (err) {
      setError(err.message || 'Không thể xác minh tài khoản');
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!captchaInput.trim()) {
      setCaptchaError('Vui lòng nhập mã bảo mật');
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setCaptchaError('Mã bảo mật không chính xác');
      refreshCaptcha();
      return;
    }

    if (!otpCode.trim()) {
      setError('Vui lòng nhập mã OTP');
      return;
    }

    setCaptchaError('');
    setLoading(true);

    try {
      const response = await post(
        ENDPOINTS.AUTH.FORGOT_PASSWORD_VERIFY_OTP,
        { username: account, otpCode: otpCode.trim() },
        { includeAuth: false }
      );

      if (response.status === 'success') {
        setStep(3); // Chuyển sang bước nhập mật khẩu mới
        refreshCaptcha();
      }
    } catch (err) {
      setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn');
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  // Hàm validation mật khẩu
  const validatePassword = (password) => {
    const errors = [];

    // Độ dài 8-32 ký tự
    if (password.length < 8 || password.length > 32) {
      errors.push('Mật khẩu phải có từ 8 đến 32 ký tự');
    }

    // Không chứa khoảng trắng
    if (/\s/.test(password)) {
      errors.push('Mật khẩu không được chứa khoảng trắng');
    }

    // Ít nhất 1 chữ hoa
    if (!/[A-Z]/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất 1 chữ hoa');
    }

    // Ít nhất 1 chữ thường
    if (!/[a-z]/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất 1 chữ thường');
    }

    // Ít nhất 1 số
    if (!/[0-9]/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất 1 chữ số');
    }

    // Ít nhất 1 ký tự đặc biệt
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt');
    }

    return errors;
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu');
      return;
    }

    // Validate mật khẩu mới
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join('. '));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);

    try {
      const response = await post(
        ENDPOINTS.AUTH.FORGOT_PASSWORD_RESET,
        { username: account, newPassword },
        { includeAuth: false }
      );

      if (response.status === 'success') {
    setSent(true);
      }
    } catch (err) {
      setError(err.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSent(false);
    refreshCaptcha();
  };

  const handleBackToStep2 = () => {
    setStep(2);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    refreshCaptcha();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-emerald-50 to-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur shadow-2xl rounded-3xl border border-sky-100 p-8 md:p-10">
        <div className="mb-6 text-center">
          <h1 className="text-xl md:text-2xl font-bold text-sky-900">
            Quên mật khẩu
          </h1>
          {step === 1 && (
            <p className="mt-2 text-xs md:text-sm text-sky-600">
              Nhập tài khoản dùng để đăng nhập. Hệ thống sẽ gửi mã OTP qua email.
            </p>
          )}
          {step === 2 && (
          <p className="mt-2 text-xs md:text-sm text-sky-600">
              Nhập mã OTP đã được gửi đến email <strong>{maskedEmail}</strong>
          </p>
          )}
          {step === 3 && (
            <p className="mt-2 text-xs md:text-sm text-sky-600">
              Nhập mật khẩu mới cho tài khoản <strong>{account}</strong>
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleStep1Submit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="account"
              className="block text-sm font-medium text-sky-900"
            >
              Tài khoản
            </label>
            <input
              id="account"
              name="account"
              type="text"
              required
              value={account}
              onChange={(e) => setAccount(e.target.value)}
                disabled={loading}
                className="block w-full rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2.5 text-sm text-sky-900 placeholder-sky-400 shadow-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="vd: phuhuynh01"
            />
          </div>

          {/* Mã bảo mật */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-sky-900">
              Mã bảo mật <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-md bg-slate-900 text-white px-4 py-3 font-mono text-lg tracking-widest select-none shadow-inner">
                {captchaCode.split('').map((ch) => (
                  <span
                    key={ch + Math.random()}
                    className="mx-0.5"
                    style={{
                      transform: `rotate(${(Math.random() - 0.5) * 20}deg)`,
                    }}
                  >
                    {ch}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={refreshCaptcha}
                  disabled={loading}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 text-sky-600 hover:bg-sky-50 hover:text-sky-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↻
              </button>
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                  disabled={loading}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    captchaError
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                      : 'border-sky-100 bg-sky-50/60 text-sky-900 placeholder-sky-400 focus:border-sky-400 focus:bg-white focus:ring-sky-200'
                  }`}
                  placeholder="Nhập mã bảo mật"
                />
              </div>
              {captchaError && (
                <p className="text-xs text-red-600 mt-1">{captchaError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-sky-600 hover:to-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang xử lý...' : 'Tiếp theo'}
            </button>
          </form>
        ) : step === 2 ? (
          <form onSubmit={handleStep2Submit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-sky-900"
              >
                Mã OTP <span className="text-red-500">*</span>
              </label>
              <div className="mb-2 text-xs text-sky-600">
                Email của bạn: <strong className="text-sky-800">{maskedEmail}</strong>
              </div>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                className="block w-full rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2.5 text-sm text-sky-900 placeholder-sky-400 shadow-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 transition disabled:opacity-50 disabled:cursor-not-allowed text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
              />
              <p className="text-xs text-sky-500 mt-1">
                Mã OTP có 6 chữ số, có hiệu lực trong 10 phút
              </p>
            </div>

            {/* Mã bảo mật */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-sky-900">
                Mã bảo mật <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-md bg-slate-900 text-white px-4 py-3 font-mono text-lg tracking-widest select-none shadow-inner">
                  {captchaCode.split('').map((ch) => (
                    <span
                      key={ch + Math.random()}
                      className="mx-0.5"
                      style={{
                        transform: `rotate(${(Math.random() - 0.5) * 20}deg)`,
                      }}
                    >
                      {ch}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  disabled={loading || sent}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 text-sky-600 hover:bg-sky-50 hover:text-sky-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ↻
                </button>
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  disabled={loading || sent}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  captchaError
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                    : 'border-sky-100 bg-sky-50/60 text-sky-900 placeholder-sky-400 focus:border-sky-400 focus:bg-white focus:ring-sky-200'
                }`}
                placeholder="Nhập mã bảo mật"
              />
            </div>
            {captchaError && (
              <p className="text-xs text-red-600 mt-1">{captchaError}</p>
            )}
          </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBackToStep1}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center rounded-xl border border-sky-300 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 shadow-sm hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Quay lại
              </button>
          <button
            type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-sky-600 hover:to-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
                {loading ? 'Đang xác minh...' : 'Xác minh OTP'}
          </button>
            </div>
        </form>
        ) : (
          <form onSubmit={handleStep3Submit} className="space-y-5">
            {sent ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                  Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:from-sky-600 hover:to-emerald-500 transition"
                >
                  Đăng nhập ngay
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-sky-900"
                  >
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading || sent}
                    className="block w-full rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2.5 text-sm text-sky-900 placeholder-sky-400 shadow-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Nhập mật khẩu mới (8-32 ký tự, có HOA, thường, số, ký tự đặc biệt, không khoảng trắng)"
                  />
                  <p className="text-xs text-sky-500 mt-1">
                    Yêu cầu: 8-32 ký tự, chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt và không chứa khoảng trắng
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-sky-900"
                  >
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading || sent}
                    className="block w-full rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2.5 text-sm text-sky-900 placeholder-sky-400 shadow-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBackToStep2}
                    disabled={loading || sent}
                    className="flex-1 inline-flex items-center justify-center rounded-xl border border-sky-300 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 shadow-sm hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={loading || sent}
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-sky-600 hover:to-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        <div className="mt-6 text-center text-xs text-sky-500">
          <Link
            to="/login"
            className="font-medium text-sky-600 hover:text-sky-700 underline underline-offset-2"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;

