import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import logoDucXuan from '../assets/logo/ducxuan-logo.png';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [usernameWarning, setUsernameWarning] = useState('');
  const [passwordWarning, setPasswordWarning] = useState('');
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'username') {
      if (value && (/[\s]/.test(value) || /[^A-Za-z0-9]/.test(value))) {
        setUsernameWarning('Tài khoản không được chứa khoảng trắng và ký tự đặc biệt.');
      } else {
        setUsernameWarning('');
      }
    }
    if (name === 'password') {
      const hasUpper = /[A-Z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[^A-Za-z0-9]/.test(value);
      if (value && (!hasUpper || !hasNumber || !hasSpecial)) {
        setPasswordWarning(
          'Mật khẩu nên có ít nhất 1 chữ cái viết hoa, 1 số và 1 ký tự đặc biệt.'
        );
      } else {
        setPasswordWarning('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const usernameTrimmed = (form.username || '').trim();
    if (/[\s]/.test(usernameTrimmed) || /[^A-Za-z0-9]/.test(usernameTrimmed)) {
      setUsernameWarning('Tài khoản không được chứa khoảng trắng và ký tự đặc biệt.');
      return;
    }
    try {
      const { user: newUser } = await login(usernameTrimmed, form.password);
      // eslint-disable-next-line no-console
      console.log('Login successful - newUser:', newUser);
      // Chuyển hướng theo role
      const roles = (newUser.roles || []).map((r) => r.roleName || r);
      // eslint-disable-next-line no-console
      console.log('Mapped roles:', roles);
      if (roles.includes('SystemAdmin')) {
        navigate('/system-admin', { replace: true });
      } else if (roles.includes('SchoolAdmin')) {
        navigate('/school-admin', { replace: true });
      } else if (roles.includes('Teacher')) {
        navigate('/teacher', { replace: true });
      } else if (
        roles.includes('Parent') ||
        roles.includes('StudentParent') ||
        roles.includes('Student')
      ) {
        // Phụ huynh / tài khoản xem thông tin trẻ
        navigate('/student', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      // Error được xử lý trong AuthContext
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-emerald-50 to-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl bg-white/95 backdrop-blur shadow-2xl rounded-3xl border border-sky-100 p-8 md:p-10">
        <div className="flex flex-col md:flex-row gap-8 items-stretch">
          {/* Cột trái: logo + thông tin trường */}
          <div className="md:w-5/12 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="mb-4 h-24 w-24 md:h-28 md:w-28 rounded-full bg-sky-50 flex items-center justify-center shadow-md overflow-hidden">
              <img
                src={logoDucXuan}
                alt="Trường Mầm Non Đức Xuân"
                className="h-full w-full object-cover"
              />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-sky-900">
              Trường Mầm Non Đức Xuân
            </h1>
            <p className="mt-2 text-xs md:text-sm text-sky-600 max-w-xs">
              Trẻ em hôm nay – Thế giới ngày mai.
              <br />
              Hệ thống quản lý dành cho nhà trường, giáo viên và phụ huynh.
            </p>
          </div>

          {/* Cột phải: form đăng nhập */}
          <div className="md:w-7/12">
            <div className="mb-6 text-center md:text-left">
              <h2 className="text-lg md:text-xl font-semibold text-sky-900">
                Đăng nhập hệ thống
              </h2>
              <p className="mt-1 text-xs md:text-sm text-sky-500">
                Vui lòng nhập thông tin tài khoản của bạn.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-sky-900"
                >
                  Tài khoản
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={form.username}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2.5 text-sm text-sky-900 placeholder-sky-400 shadow-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 transition"
                  placeholder="vd: admin"
                />
                {usernameWarning && (
                  <p className="mt-1 text-xs text-amber-600">
                    {usernameWarning}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-sky-900"
                >
                  Mật khẩu
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2.5 text-sm text-sky-900 placeholder-sky-400 shadow-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 transition"
                  placeholder="Nhập mật khẩu"
                />
                {passwordWarning && (
                  <p className="mt-1 text-xs text-amber-600">
                    {passwordWarning}
                  </p>
                )}
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-sky-600 hover:text-sky-800 hover:underline underline-offset-2"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-sky-600 hover:to-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>

            <div className="mt-6 text-center md:text-left text-xs text-sky-500">
              <p>
                © {new Date().getFullYear()} DucXuan Kindergarten.{' '}
                <span className="hidden sm:inline">All rights reserved.</span>
              </p>
              <p className="mt-1">
                <Link
                  to="/"
                  className="font-medium text-sky-600 hover:text-sky-700 underline underline-offset-2"
                >
                  Quay lại trang chủ
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

