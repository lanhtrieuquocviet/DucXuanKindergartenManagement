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
  const [step, setStep] = useState(1); // 1: 输入账户名, 2: 输入邮箱
  const [account, setAccount] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [email, setEmail] = useState('');
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
        setStep(2);
        // 重置验证码
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

    setCaptchaError('');
    setLoading(true);

    try {
      const response = await post(
        ENDPOINTS.AUTH.FORGOT_PASSWORD_RESET,
        { username: account, email },
        { includeAuth: false }
      );

      if (response.status === 'success') {
    setSent(true);
      }
    } catch (err) {
      // Xử lý rate limiting (status 429)
      if (err.status === 429 && err.data) {
        const { waitMinutes, waitUntil } = err.data;
        const waitHours = Math.floor(waitMinutes / 60);
        const waitMins = waitMinutes % 60;
        let waitMessage = '';
        if (waitHours > 0) {
          waitMessage = `${waitHours} giờ${waitMins > 0 ? ` ${waitMins} phút` : ''}`;
        } else {
          waitMessage = `${waitMins} phút`;
        }
        setError(
          err.message ||
            `Bạn đã yêu cầu đặt lại mật khẩu quá nhiều lần. Vui lòng đợi ${waitMessage} trước khi thử lại.`
        );
      } else {
        setError(err.message || 'Email không khớp hoặc có lỗi xảy ra');
      }
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setEmail('');
    setError('');
    setSent(false);
    refreshCaptcha();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-emerald-50 to-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur shadow-2xl rounded-3xl border border-sky-100 p-8 md:p-10">
        <div className="mb-6 text-center">
          <h1 className="text-xl md:text-2xl font-bold text-sky-900">
            Quên mật khẩu
          </h1>
          {step === 1 ? (
          <p className="mt-2 text-xs md:text-sm text-sky-600">
            Nhập tài khoản dùng để đăng nhập. Hệ thống sẽ gửi hướng dẫn đặt lại mật
            khẩu.
          </p>
          ) : (
            <p className="mt-2 text-xs md:text-sm text-sky-600">
              Nhập email đầy đủ của tài khoản <strong>{account}</strong> để xác minh.
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
        ) : (
          <form onSubmit={handleStep2Submit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-sky-900"
              >
                Email
              </label>
              <div className="mb-2 text-xs text-sky-600">
                Email của bạn: <strong className="text-sky-800">{maskedEmail}</strong>
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || sent}
                className="block w-full rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2.5 text-sm text-sky-900 placeholder-sky-400 shadow-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Nhập email đầy đủ"
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

          {sent && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.
            </p>
          )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBackToStep1}
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
                {loading ? 'Đang gửi...' : sent ? 'Đã gửi' : 'Gửi yêu cầu'}
          </button>
            </div>
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

