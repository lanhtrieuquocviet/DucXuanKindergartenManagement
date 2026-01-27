import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [account, setAccount] = useState('');
  const [sent, setSent] = useState(false);
  const [captchaCode, setCaptchaCode] = useState(() => generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput('');
    setCaptchaError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    // TODO: Gọi API backend để gửi email reset mật khẩu
    setSent(true);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-emerald-50 to-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur shadow-2xl rounded-3xl border border-sky-100 p-8 md:p-10">
        <div className="mb-6 text-center">
          <h1 className="text-xl md:text-2xl font-bold text-sky-900">
            Quên mật khẩu
          </h1>
          <p className="mt-2 text-xs md:text-sm text-sky-600">
            Nhập tài khoản dùng để đăng nhập. Hệ thống sẽ gửi hướng dẫn đặt lại mật
            khẩu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
              className="block w-full rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2.5 text-sm text-sky-900 placeholder-sky-400 shadow-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 transition"
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 text-sky-600 hover:bg-sky-50 hover:text-sky-800 text-sm"
              >
                ↻
              </button>
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 ${
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
              Nếu tài khoản tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã
              được gửi.
            </p>
          )}

          <button
            type="submit"
            className="mt-2 w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-sky-600 hover:to-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 transition"
          >
            Gửi yêu cầu
          </button>
        </form>

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

