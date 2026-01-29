import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    status: '',
    avatar: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const applyUserToForm = (user) => {
      if (!user) return;
      setProfileForm((prev) => ({
        ...prev,
        fullName: user.fullName || user.username || '',
        email: user.email || '',
        status: user.status === 'active' ? 'Đang hoạt động' : 'Đã khóa',
        avatar: user.avatar || '',
      }));
    };

    // Đổ ngay dữ liệu từ localStorage (nếu có) để không bị trống
    try {
      const cachedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (cachedUser) {
        applyUserToForm(cachedUser);
      }
    } catch {
      // ignore
    }

    // Sau đó gọi API để lấy dữ liệu mới nhất
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        setError('');

        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            navigate('/login', { replace: true });
            return;
          }
          throw new Error(json.message || 'Không lấy được hồ sơ người dùng');
        }

        const user = json.data || {};
        applyUserToForm(user);

        // Cập nhật lại localStorage để các màn khác dùng chung thông tin mới
        if (user && Object.keys(user).length > 0) {
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      setSavingProfile(true);
      setMessage('');
      setError('');

      const body = {
        fullName: profileForm.fullName,
        email: profileForm.email,
        avatar: profileForm.avatar,
      };

      const res = await fetch('http://localhost:5000/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Cập nhật hồ sơ thất bại');
      }

      const user = json.data || {};
      
      // Cập nhật lại form từ dữ liệu trả về (đã được backend chuẩn hóa)
      setProfileForm({
        fullName: user.fullName || user.username || '',
        email: user.email || '',
        status: user.status === 'active' ? 'Đang hoạt động' : 'Đã khóa',
        avatar: user.avatar || '',
      });

      // Cập nhật localStorage để các màn khác dùng chung thông tin mới
      localStorage.setItem('user', JSON.stringify(user));

      setMessage('Cập nhật hồ sơ thành công.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      setChangingPassword(true);
      setMessage('');
      setError('');

      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Đổi mật khẩu thất bại');
      }

      setMessage('Đổi mật khẩu thành công.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar giả lập như hình */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="px-6 py-4 font-semibold text-lg border-b border-gray-800">
          Menu
        </div>
        <button
          type="button"
          onClick={handleBack}
          className="text-left px-6 py-3 text-sm hover:bg-gray-800 transition"
        >
          ← Quay lại bảng điều khiển
        </button>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Quản lý hồ sơ</h1>
            <p className="text-sm text-gray-500 mt-1">
              Xem và cập nhật thông tin cá nhân, thay đổi mật khẩu đăng nhập.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            {profileForm.avatar ? (
              <img
                src={profileForm.avatar}
                alt="Avatar"
                className="h-9 w-9 rounded-full object-cover border border-gray-300"
              />
            ) : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">
                {profileForm.fullName ? profileForm.fullName.charAt(0).toUpperCase() : '?'}
              </span>
            )}
            <div className="flex flex-col">
              <span className="font-medium">{profileForm.fullName || 'Người dùng'}</span>
              <span className="text-xs text-gray-500">{profileForm.email}</span>
            </div>
          </div>
        </div>

        {(message || error) && (
          <div className="mb-4">
            {message && (
              <div className="mb-2 rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-800">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Edit Profile */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Chỉnh sửa hồ sơ
              {loadingProfile && (
                <span className="ml-2 text-xs font-normal text-gray-400">
                  Đang tải...
                </span>
              )}
            </h2>
            <form onSubmit={handleSubmitProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={profileForm.fullName}
                  onChange={handleProfileChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar (URL ảnh)
                </label>
                <input
                  type="text"
                  name="avatar"
                  value={profileForm.avatar}
                  onChange={handleProfileChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập đường dẫn ảnh avatar (nếu có)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái tài khoản
                </label>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 text-xs font-semibold px-3 py-1">
                    {profileForm.status || 'Đang hoạt động'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center justify-center px-6 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </section>

          {/* Change Password */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Đổi mật khẩu</h2>
            <form onSubmit={handleSubmitPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập mật khẩu mới"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center justify-center px-6 py-2 rounded-md bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Profile;

