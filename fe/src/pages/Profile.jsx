import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ENDPOINTS, postFormData, get, put } from '../service/api';
import {
  Box, Button, TextField, Typography, Paper, Alert, Chip,
  CircularProgress, Stack, Avatar, Divider, IconButton, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

const DEFAULT_AVATAR = 'https://via.placeholder.com/300x400.png?text=Avatar+3x4';

/* ── Small reusable card ── */
function SectionCard({ icon, title, accentGradient, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      {/* Accent bar */}
      <Box sx={{ height: 4, background: accentGradient }} />

      {/* Header */}
      <Box sx={{
        px: 3, py: 2,
        display: 'flex', alignItems: 'center', gap: 1.25,
        borderBottom: '1px solid', borderColor: 'divider',
        bgcolor: 'grey.50',
      }}>
        <Avatar sx={{
          width: 32, height: 32,
          background: accentGradient,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          {icon}
        </Avatar>
        <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 14 }}>
          {title}
        </Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        {children}
      </Box>
    </Paper>
  );
}

function AvatarUpload({ currentAvatar, uploadingAvatar, fileInputRef, onSelectFile }) {
  return (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <Box sx={{
          width: 80, aspectRatio: '3/4',
          borderRadius: 2, overflow: 'hidden',
          border: '2px solid', borderColor: 'divider',
          bgcolor: 'grey.100',
        }}>
          <img src={currentAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </Box>
        {uploadingAvatar && (
          <Box sx={{ position: 'absolute', inset: 0, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={22} sx={{ color: 'white' }} />
          </Box>
        )}
        <Tooltip title="Đổi ảnh" arrow>
          <IconButton
            size="small"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            sx={{
              position: 'absolute', bottom: -8, right: -8,
              width: 28, height: 28,
              bgcolor: 'primary.main', color: 'white',
              border: '2px solid white',
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { bgcolor: 'grey.400' },
            }}
          >
            <PhotoCameraIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, pt: 0.5 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={onSelectFile}
          style={{ display: 'none' }}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<PhotoCameraIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingAvatar}
          sx={{ mb: 1, borderRadius: 2 }}
        >
          {uploadingAvatar ? 'Đang tải lên...' : 'Chọn ảnh'}
        </Button>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.5 }}>
          Tỉ lệ 3×4 · JPEG, PNG, GIF, WebP
          <br />Nhấn &ldquo;Lưu thay đổi&rdquo; để cập nhật.
        </Typography>
      </Box>
    </Stack>
  );
}

function ProfileForm({
  color = 'primary',
  profileForm,
  onProfileChange,
  onSubmit,
  savingProfile,
  currentAvatar,
  uploadingAvatar,
  fileInputRef,
  onSelectFile,
}) {
  return (
    <Stack component="form" onSubmit={onSubmit} spacing={2.5}>
      <TextField label="Họ và tên" name="fullName" value={profileForm.fullName ?? ''} onChange={onProfileChange} size="small" fullWidth color={color} />
      <TextField label="Email" name="email" type="email" value={profileForm.email ?? ''} onChange={onProfileChange} size="small" fullWidth color={color} />
      <TextField
        label="Số điện thoại" name="phone" type="tel"
        value={profileForm.phone ?? ''}
        onChange={(e) => { if (e.target.value.length <= 50) onProfileChange(e); }}
        inputProps={{ maxLength: 50 }}
        helperText={`${profileForm.phone?.length || 0}/50 ký tự`}
        size="small" fullWidth color={color}
      />
      <TextField
        label="Địa chỉ" name="address"
        value={profileForm.address ?? ''}
        onChange={(e) => { if (e.target.value.length <= 50) onProfileChange(e); }}
        inputProps={{ maxLength: 50 }}
        helperText={`${profileForm.address?.length || 0}/50 ký tự`}
        size="small" fullWidth color={color}
      />

      <Box>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Ảnh đại diện (3×4)
        </Typography>
        <AvatarUpload
          currentAvatar={currentAvatar}
          uploadingAvatar={uploadingAvatar}
          fileInputRef={fileInputRef}
          onSelectFile={onSelectFile}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary">Trạng thái:</Typography>
        <Chip
          icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
          label={profileForm.status || 'Đang hoạt động'}
          size="small"
          color="success"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      </Box>

      <Box>
        <Button
          type="submit"
          variant="contained"
          color={color}
          disabled={savingProfile}
          startIcon={savingProfile ? <CircularProgress size={15} color="inherit" /> : <EditOutlinedIcon />}
          sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
        >
          {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </Box>
    </Stack>
  );
}

function PasswordForm({ passwordForm, passwordHint, onPasswordChange, onSubmit, changingPassword }) {
  return (
    <Stack component="form" onSubmit={onSubmit} spacing={2.5}>
      <TextField
        label="Mật khẩu hiện tại" name="currentPassword" type="password"
        value={passwordForm.currentPassword} onChange={onPasswordChange}
        size="small" fullWidth
      />
      <TextField
        label="Mật khẩu mới" name="newPassword" type="password"
        value={passwordForm.newPassword} onChange={onPasswordChange}
        size="small" fullWidth
        helperText={passwordHint || ' '}
        FormHelperTextProps={{ sx: { color: passwordHint ? 'warning.main' : 'transparent', mt: 0.25 } }}
      />
      <TextField
        label="Xác nhận mật khẩu mới" name="confirmPassword" type="password"
        value={passwordForm.confirmPassword} onChange={onPasswordChange}
        size="small" fullWidth
      />
      <Box>
        <Button
          type="submit"
          variant="contained"
          color="warning"
          disabled={changingPassword}
          startIcon={changingPassword ? <CircularProgress size={15} color="inherit" /> : <LockOutlinedIcon />}
          sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
        >
          {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
        </Button>
      </Box>
    </Stack>
  );
}

function Alerts({ message, authError, onClearMessage, onClearError }) {
  return (
    <>
      {message && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={onClearMessage}>
          {message}
        </Alert>
      )}
      {authError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={onClearError}>
          {authError}
        </Alert>
      )}
    </>
  );
}

function HeroBanner({ gradient, roleLabel, extra, currentAvatar, displayName, user, profileFormLoading, profileForm, onBack, onLogout }) {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 4, borderRadius: 3,
        background: gradient,
        color: 'white', overflow: 'hidden', position: 'relative',
      }}
    >
      {/* Decorative circles */}
      <Box sx={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
      <Box sx={{ position: 'absolute', right: 80, bottom: -50, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
      <Box sx={{ position: 'absolute', left: -20, bottom: -30, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />

      <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 2.5, md: 3 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        {/* Left: avatar + info */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ position: 'relative' }}>
            <Box sx={{
              width: 72, aspectRatio: '3/4',
              borderRadius: 2.5, overflow: 'hidden',
              border: '3px solid rgba(255,255,255,0.4)',
              bgcolor: 'rgba(255,255,255,0.15)',
              flexShrink: 0,
            }}>
              <img src={currentAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </Box>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: 12 }}>{roleLabel}</Typography>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, mt: 0.25 }}>
              {displayName}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.65 }}>
              {user?.email ?? profileForm.email}
            </Typography>
            {profileFormLoading && (
              <Stack direction="row" spacing={0.75} alignItems="center" mt={0.5}>
                <CircularProgress size={12} sx={{ color: 'rgba(255,255,255,0.7)' }} />
                <Typography variant="caption" sx={{ opacity: 0.65 }}>Đang tải...</Typography>
              </Stack>
            )}
          </Box>
        </Stack>

        {/* Right: action buttons */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {extra}
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            size="small"
            sx={{
              color: 'white', borderColor: 'rgba(255,255,255,0.45)',
              fontWeight: 600, borderRadius: 2, textTransform: 'none',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.7)' },
            }}
          >
            Bảng điều khiển
          </Button>
          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={onLogout}
            size="small"
            sx={{
              color: 'white', borderColor: 'rgba(255,255,255,0.45)',
              fontWeight: 600, borderRadius: 2, textTransform: 'none',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.7)' },
            }}
          >
            Đăng xuất
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}

function Profile() {
  const navigate = useNavigate();
  const {
    user, logout, getProfile, updateProfile, changePassword,
    error: authError, setError, isInitializing,
  } = useAuth();

  const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
  const isStudentRole =
    userRoles.includes('Student') ||
    userRoles.includes('Parent') ||
    userRoles.includes('StudentParent');

  const [profileForm, setProfileForm] = useState({
    fullName: '', email: '', status: '', avatar: '', address: '', phone: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [passwordHint, setPasswordHint] = useState('');
  const [children, setChildren] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [profileFormLoading, setProfileFormLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const hasLoadedProfileRef = useRef(false);
  const hasUserEditedRef = useRef(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      hasLoadedProfileRef.current = false;
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (isInitializing || !user) return;
    const fetchChildren = async () => {
      try {
        const response = await get(ENDPOINTS.AUTH.MY_CHILDREN);
        setChildren(response.data || []);
      } catch (e) {
        console.error('Failed to load children info', e);
        setChildren([]);
      }
    };
    fetchChildren();
  }, [user, isInitializing]);

  useEffect(() => {
    if (isInitializing || !user) return;
    if (hasLoadedProfileRef.current || hasUserEditedRef.current) return;
    setProfileForm((prev) => ({
      ...prev,
      fullName: user.fullName || user.username || '',
      email: user.email || '',
      avatar: user.avatar || '',
      address: user.address || '',
      phone: children.length > 0 ? (children[0]?.parentPhone || children[0]?.phone || '') : '',
      status: user.status === 'active' ? 'Đang hoạt động' : 'Đã khóa',
    }));
  }, [user, isInitializing]);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
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
            address: userData.address || '',
            phone: children.length > 0 ? (children[0]?.parentPhone || children[0]?.phone || '') : '',
            status: userData.status === 'active' ? 'Đang hoạt động' : 'Đã khóa',
          }));
        }
      } catch {
        hasLoadedProfileRef.current = false;
      } finally {
        setProfileFormLoading(false);
      }
    };
    loadProfile();
  }, [navigate, getProfile, user, isInitializing]);

  useEffect(() => {
    if (children.length === 0 || hasUserEditedRef.current) return;
    setProfileForm((prev) => ({
      ...prev,
      phone: children[0]?.parentPhone || children[0]?.phone || '',
    }));
  }, [children]);

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
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
    hasUserEditedRef.current = true;

    try {
      setError(null);
      setMessage('');
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_AVATAR, formData);
      const url = response.data?.url;
      if (!url) { setError('Không nhận được đường dẫn ảnh từ server.'); return; }
      setProfileForm((prev) => ({ ...prev, avatar: url }));
      setAvatarPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return ''; });
      setMessage('Đã tải ảnh lên. Nhấn "Lưu thay đổi" để cập nhật hồ sơ.');
    } catch (err) {
      setError(err.message || 'Không tải lên được ảnh.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'newPassword') {
      const ok = /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
      setPasswordHint(value && !ok
        ? 'Mật khẩu mới phải có ít nhất 1 chữ cái viết hoa, 1 số và 1 ký tự đặc biệt, tối thiểu 6 ký tự.'
        : '');
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login', { replace: true }); return; }
    try {
      setSavingProfile(true);
      setMessage('');
      setError(null);
      await updateProfile({
        fullName: profileForm.fullName,
        email: profileForm.email,
        avatar: profileForm.avatar || undefined,
        address: profileForm.address || '',
        phone: profileForm.phone || '',
      });
      if (children.length > 0) {
        const updates = await Promise.all(
          children.map((c) =>
            put(`/students/${c._id}`, { parentPhone: profileForm.phone || '' }).then((r) => r.data || r)
          )
        );
        setChildren((prev) =>
          prev.map((c) => {
            const u = updates.find((x) => x._id === c._id || x.id === c._id);
            return u ? { ...c, ...u } : c;
          })
        );
      }
      hasUserEditedRef.current = false;
      setMessage('Cập nhật hồ sơ thành công.');
    } catch {
      // handled in context
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
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/.test(passwordForm.newPassword || '')) {
      setError('Mật khẩu mới phải có ít nhất 1 chữ cái viết hoa, 1 số và 1 ký tự đặc biệt, tối thiểu 6 ký tự.');
      return;
    }
    if (!user) { navigate('/login', { replace: true }); return; }
    try {
      setChangingPassword(true);
      setMessage('');
      setError(null);
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setMessage('Đổi mật khẩu thành công.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      // handled in context
    } finally {
      setChangingPassword(false);
    }
  };

  const handleBackToDashboard = () => {
    if (isStudentRole) { navigate('/student'); return; }
    navigate(-1);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const currentAvatar = avatarPreview || profileForm.avatar || user?.avatar || DEFAULT_AVATAR;
  const displayName = user?.fullName || profileForm.fullName || user?.username || 'Người dùng';

  const sharedBannerProps = {
    currentAvatar,
    displayName,
    user,
    profileFormLoading,
    profileForm,
    onBack: handleBackToDashboard,
    onLogout: handleLogout,
  };

  const sharedProfileFormProps = {
    profileForm,
    onProfileChange: handleProfileChange,
    onSubmit: handleSubmitProfile,
    savingProfile,
    currentAvatar,
    uploadingAvatar,
    fileInputRef,
    onSelectFile: handleSelectAvatarFile,
  };

  const sharedPasswordFormProps = {
    passwordForm,
    passwordHint,
    onPasswordChange: handlePasswordChange,
    onSubmit: handleSubmitPassword,
    changingPassword,
  };

  const alertProps = {
    message,
    authError,
    onClearMessage: () => setMessage(''),
    onClearError: () => setError(null),
  };

  // ═══════════════ STUDENT / PARENT ═══════════════
  if (isStudentRole) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6fa' }}>
        <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
          <HeroBanner
            gradient="linear-gradient(135deg, #059669 0%, #0d9488 100%)"
            roleLabel="Phụ huynh học sinh"
            {...sharedBannerProps}
          />

          <Alerts {...alertProps} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <SectionCard
              icon={<PersonOutlineIcon sx={{ fontSize: 17, color: 'white' }} />}
              title="Chỉnh sửa hồ sơ"
              accentGradient="linear-gradient(135deg, #059669 0%, #0d9488 100%)"
            >
              <ProfileForm color="success" {...sharedProfileFormProps} />
            </SectionCard>

            <SectionCard
              icon={<LockOutlinedIcon sx={{ fontSize: 17, color: 'white' }} />}
              title="Đổi mật khẩu"
              accentGradient="linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"
            >
              <PasswordForm {...sharedPasswordFormProps} />
            </SectionCard>
          </Box>
        </Box>
      </Box>
    );
  }

  // ═══════════════ TEACHER / ADMIN ═══════════════
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6fa' }}>
      <Box sx={{ maxWidth: 1060, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        <HeroBanner
          gradient="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
          roleLabel={userRoles[0] || 'Quản trị viên'}
          {...sharedBannerProps}
        />

        <Alerts {...alertProps} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
          <SectionCard
            icon={<PersonOutlineIcon sx={{ fontSize: 17, color: 'white' }} />}
            title="Chỉnh sửa hồ sơ"
            accentGradient="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
          >
            <ProfileForm color="primary" {...sharedProfileFormProps} />
          </SectionCard>

          <SectionCard
            icon={<LockOutlinedIcon sx={{ fontSize: 17, color: 'white' }} />}
            title="Đổi mật khẩu"
            accentGradient="linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"
          >
            <PasswordForm {...sharedPasswordFormProps} />
          </SectionCard>
        </Box>
      </Box>
    </Box>
  );
}

export default Profile;
