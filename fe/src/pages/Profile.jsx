import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ENDPOINTS, postFormData } from '../service/api';

function Profile() {
  const DEFAULT_AVATAR =
    'https://via.placeholder.com/300x400.png?text=Avatar+3x4';

  const navigate = useNavigate();
  const {
    user,
    getProfile,
    updateProfile,
    changePassword,
    error: authError,
    setError,
    isInitializing,
  } = useAuth();

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
  const [passwordHint, setPasswordHint] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [profileFormLoading, setProfileFormLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const hasLoadedProfileRef = useRef(false);
  const hasUserEditedRef = useRef(false);
  const fileInputRef = useRef(null);

  // Chỉ reset ref khi rời trang (unmount), không reset khi effect chạy lại vì user thay đổi
  useEffect(() => {
    return () => {
      hasLoadedProfileRef.current = false;
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  // Điền form từ user ngay khi có user (chỉ lần đầu, không ghi đè khi user đã chỉnh sửa)
  useEffect(() => {
    if (isInitializing || !user) return;
    if (hasLoadedProfileRef.current) return;
    if (hasUserEditedRef.current) return;
    setProfileForm((prev) => ({
      ...prev,
      fullName: user.fullName || user.username || '',
      email: user.email || '',
      avatar: user.avatar || '',
      status: user.status === 'active' ? 'Đang hoạt động' : 'Đã khóa',
    }));
  }, [user, isInitializing]);

  // Load profile từ server một lần khi vào trang
  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (hasLoadedProfileRef.current) return;
    hasLoadedProfileRef.current = true;

    const loadProfile = async () => {
      try {
        setProfileFormLoading(true);
        const userData = await getProfile();
        if (userData && !hasUserEditedRef.current) {
          setProfileForm((prev) => ({
            ...prev,
            fullName: userData.fullName || userData.username || '',
            email: userData.email || '',
            avatar: userData.avatar || '',
            status: userData.status === 'active' ? 'Đang hoạt động' : 'Đã khóa',
          }));
        }
      } catch (err) {
        hasLoadedProfileRef.current = false;
      } finally {
        setProfileFormLoading(false);
      }
    };

    loadProfile();
  }, [navigate, getProfile, user, isInitializing]);

  const handleProfileChange = (e) => {
    hasUserEditedRef.current = true;
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.type)) {
      setError('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP).');
      return;
    }

    // Hiện preview ngay bằng blob URL (không đợi upload)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    hasUserEditedRef.current = true;

    try {
      setError(null);
      setMessage('');
      setUploadingAvatar(true);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_AVATAR, formData);
      const url = response.data?.url;

      if (!url) {
        setError('Không nhận được đường dẫn ảnh từ server.');
        return;
      }

      setProfileForm((prev) => ({ ...prev, avatar: url }));
      setAvatarPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return '';
      });
      setMessage('Đã tải ảnh lên. Nhấn "Lưu thay đổi" để cập nhật hồ sơ.');
    } catch (err) {
      setError(err.message || 'Không tải lên được ảnh.');
      // Giữ preview để user vẫn thấy ảnh đã chọn
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'newPassword') {
      const hasUpper = /[A-Z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[^A-Za-z0-9]/.test(value);
      if (value && (!hasUpper || !hasNumber || !hasSpecial)) {
        setPasswordHint(
          'Mật khẩu mới phải có ít nhất 1 chữ cái viết hoa, 1 số và 1 ký tự đặc biệt, tối thiểu 6 ký tự.'
        );
      } else {
        setPasswordHint('');
      }
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      setSavingProfile(true);
      setMessage('');
      setError(null);

      await updateProfile({
        fullName: profileForm.fullName,
        email: profileForm.email,
        avatar: profileForm.avatar || undefined,
      });

      hasUserEditedRef.current = false;
      setMessage('Cập nhật hồ sơ thành công.');
    } catch (err) {
      // Error được xử lý trong context
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

     // Kiểm tra độ mạnh mật khẩu mới
    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
    if (!strongPasswordRegex.test(passwordForm.newPassword || '')) {
      setError('Mật khẩu mới phải có ít nhất 1 chữ cái viết hoa, 1 số và 1 ký tự đặc biệt, tối thiểu 6 ký tự.');
      return;
    }

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      setChangingPassword(true);
      setMessage('');
      setError(null);

      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
      );

      setMessage('Đổi mật khẩu thành công.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      // Error được xử lý trong context
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
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="w-10 h-[52px] overflow-hidden rounded-md border border-gray-300 bg-gray-100 flex items-center justify-center">
              <img
                src={
                  avatarPreview ||
                  profileForm.avatar ||
                  user?.avatar ||
                  DEFAULT_AVATAR
                }
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">
                {(user?.fullName ?? profileForm.fullName) || 'Người dùng'}
              </span>
              <span className="text-xs text-gray-500">
                {(user?.email ?? profileForm.email)}
              </span>
            </div>
          </div>
        </div>

        {(message || authError) && (
          <div className="mb-4">
            {message && (
              <div className="mb-2 rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-800">
                {message}
              </div>
            )}
            {authError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
                {authError}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Edit Profile */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Chỉnh sửa hồ sơ
              {profileFormLoading && (
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
                  value={profileForm.fullName ?? ''}
                  onChange={handleProfileChange}
                  readOnly={false}
                  disabled={false}
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
                  value={profileForm.email ?? ''}
                  onChange={handleProfileChange}
                  readOnly={false}
                  disabled={false}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ảnh đại diện (3x4)
                </label>
                <div className="flex items-start gap-4">
                  <div className="w-24 aspect-[3/4] overflow-hidden rounded-md border border-gray-300 bg-gray-100 flex items-center justify-center">
                    <img
                      src={
                        avatarPreview ||
                        profileForm.avatar ||
                        user?.avatar ||
                        DEFAULT_AVATAR
                      }
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleSelectAvatarFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {uploadingAvatar ? 'Đang tải lên...' : 'Chọn ảnh trong máy'}
                    </button>
                    <p className="text-xs text-gray-500 max-w-xs">
                      Ảnh nên có tỉ lệ 3x4. Chọn file (JPEG, PNG, GIF, WebP), sau đó nhấn &quot;Lưu thay đổi&quot; để cập nhật.
                    </p>
                  </div>
                </div>
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

              {passwordHint && (
                <p className="text-xs text-amber-600">
                  {passwordHint}
                </p>
              )}

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

