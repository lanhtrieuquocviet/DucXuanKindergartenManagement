import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ENDPOINTS, get, put } from '../service/api';
import {
  Box, Button, TextField, Typography, Paper, Chip,
  CircularProgress, Stack, Avatar, IconButton,
  InputAdornment,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { toast } from 'react-toastify';

const DEFAULT_AVATAR = 'https://via.placeholder.com/300x400.png?text=Avatar+3x4';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^0\d{9}$/;
const PASSWORD_RULE_HELPER = 'Mật khẩu 8-32 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt và không chứa khoảng trắng.';

const getPasswordRuleError = (password) => {
  if (!password) return 'Vui lòng nhập mật khẩu mới.';
  if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';
  if (password.length > 32) return 'Mật khẩu không được vượt quá 32 ký tự.';
  if (/\s/.test(password)) return 'Mật khẩu không được chứa khoảng trắng.';
  if (!/[A-Z]/.test(password)) return 'Mật khẩu phải chứa ít nhất 1 chữ hoa.';
  if (!/[a-z]/.test(password)) return 'Mật khẩu phải chứa ít nhất 1 chữ thường.';
  if (!/\d/.test(password)) return 'Mật khẩu phải chứa ít nhất 1 chữ số.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt.';
  return '';
};

const normalizePhone = (phone) => {
  const value = String(phone || '').trim();
  if (value.startsWith('+84')) return `0${value.slice(3)}`;
  return value;
};

/* ── Small reusable card ── */
function SectionCard({ icon, title, accentGradient, children }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <Box sx={{ height: 4, background: accentGradient }} />
      <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.25, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Avatar sx={{ width: 32, height: 32, background: accentGradient, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>{icon}</Avatar>
        <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 14 }}>{title}</Typography>
      </Box>
      <Box sx={{ p: 3 }}>{children}</Box>
    </Paper>
  );
}

function ProfileForm({ color = 'primary', profileForm, onProfileChange, onSubmit, savingProfile, currentAvatar }) {
  return (
    <Stack component="form" onSubmit={onSubmit} spacing={2.5}>
      <TextField
        label="Họ và tên" name="fullName"
        value={profileForm.fullName ?? ''}
        onChange={(e) => { if (e.target.value.length <= 30) onProfileChange(e); }}
        helperText={`${profileForm.fullName?.length || 0}/30 ký tự`}
        size="small" fullWidth color={color}
      />
      <TextField
        label="Email" name="email" type="email"
        value={profileForm.email ?? ''}
        onChange={onProfileChange}
        size="small" fullWidth color={color}
      />
      <TextField
        label="Số điện thoại" name="phone" type="tel"
        value={profileForm.phone ?? ''}
        onChange={(e) => { if (e.target.value.length <= 10) onProfileChange(e); }}
        helperText={`${profileForm.phone?.length || 0}/10 ký tự`}
        size="small" fullWidth color={color}
      />
      <TextField
        label="Địa chỉ" name="address"
        value={profileForm.address ?? ''}
        onChange={(e) => { if (e.target.value.length <= 200) onProfileChange(e); }}
        helperText={`${profileForm.address?.length || 0}/200 ký tự`}
        size="small" fullWidth color={color}
      />
      <Box>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>Ảnh đại diện (3×4)</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ width: 80, aspectRatio: '3/4', borderRadius: 2, overflow: 'hidden', border: '2px solid', borderColor: 'divider', bgcolor: 'grey.100' }}>
            <img src={currentAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>Ảnh đại diện chỉ hiển thị, không thể chỉnh sửa trong trang này.</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary">Trạng thái:</Typography>
        <Chip icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />} label={profileForm.status || 'Đang hoạt động'} size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
      </Box>
      <Box>
        <Button type="submit" variant="contained" color={color} disabled={savingProfile} startIcon={savingProfile ? <CircularProgress size={15} color="inherit" /> : <EditOutlinedIcon />} sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}>
          {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </Box>
    </Stack>
  );
}

function PasswordForm({ passwordForm, onPasswordChange, onSubmit, changingPassword, showCurrentPassword, showNewPassword, showConfirmPassword, togglePasswordVisibility }) {
  return (
    <Stack component="form" onSubmit={onSubmit} spacing={2.5}>
      <TextField
        label="Mật khẩu hiện tại" name="currentPassword"
        type={showCurrentPassword ? 'text' : 'password'}
        value={passwordForm.currentPassword} onChange={onPasswordChange}
        size="small" fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton edge="end" size="small" onClick={() => togglePasswordVisibility('current')}>{showCurrentPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
            </InputAdornment>
          ),
        }}
      />
      <TextField
        label="Mật khẩu mới" name="newPassword"
        type={showNewPassword ? 'text' : 'password'}
        value={passwordForm.newPassword} onChange={onPasswordChange}
        size="small" fullWidth
        helperText={PASSWORD_RULE_HELPER}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton edge="end" size="small" onClick={() => togglePasswordVisibility('new')}>{showNewPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
            </InputAdornment>
          ),
        }}
      />
      <TextField
        label="Xác nhận mật khẩu mới" name="confirmPassword"
        type={showConfirmPassword ? 'text' : 'password'}
        value={passwordForm.confirmPassword} onChange={onPasswordChange}
        size="small" fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton edge="end" size="small" onClick={() => togglePasswordVisibility('confirm')}>{showConfirmPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Box>
        <Button type="submit" variant="contained" color="warning" disabled={changingPassword} startIcon={changingPassword ? <CircularProgress size={15} color="inherit" /> : <LockOutlinedIcon />} sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}>
          {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
        </Button>
      </Box>
    </Stack>
  );
}

function HeroBanner({ gradient, roleLabel, extra, currentAvatar, displayName, user, profileFormLoading, profileForm, onBack, onLogout }) {
  return (
    <Paper elevation={0} sx={{ mb: 4, borderRadius: 3, background: gradient, color: 'white', overflow: 'hidden', position: 'relative' }}>
      <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 2.5, md: 3 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 72, aspectRatio: '3/4', borderRadius: 2.5, overflow: 'hidden', border: '3px solid rgba(255,255,255,0.4)', bgcolor: 'rgba(255,255,255,0.15)' }}>
            <img src={currentAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: 12 }}>{roleLabel}</Typography>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, mt: 0.25 }}>{displayName}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.65 }}>{user?.email ?? profileForm.email}</Typography>
            {profileFormLoading && <Stack direction="row" spacing={0.75} alignItems="center" mt={0.5}><CircularProgress size={12} sx={{ color: 'rgba(255,255,255,0.7)' }} /><Typography variant="caption" sx={{ opacity: 0.65 }}>Đang tải...</Typography></Stack>}
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {extra}
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack} size="small" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.45)', fontWeight: 600, borderRadius: 2, textTransform: 'none' }}>Bảng điều khiển</Button>
          <Button variant="outlined" startIcon={<LogoutIcon />} onClick={onLogout} size="small" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.45)', fontWeight: 600, borderRadius: 2, textTransform: 'none' }}>Đăng xuất</Button>
        </Stack>
      </Box>
    </Paper>
  );
}

function Profile() {
  const navigate = useNavigate();
  const { user, token, logout, getProfile, updateProfile, changePassword, isInitializing } = useAuth();
  const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
  const isStudentRole = userRoles.includes('Student') || userRoles.includes('Parent') || userRoles.includes('StudentParent');

  const [profileForm, setProfileForm] = useState({ fullName: '', email: '', status: '', avatar: '', address: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileFormLoading, setProfileFormLoading] = useState(false);
  const hasLoadedProfileRef = useRef(false);
  const hasUserEditedRef = useRef(false);

  useEffect(() => {
    if (isInitializing || !user || hasLoadedProfileRef.current) return;
    const loadData = async () => {
      setProfileFormLoading(true);
      try {
        const userData = await getProfile();
        setProfileForm({
          fullName: userData.fullName || '',
          email: userData.email || '',
          avatar: userData.avatar || '',
          address: userData.address || '',
          phone: normalizePhone(userData.phone || ''),
          status: userData.status === 'active' ? 'Đang hoạt động' : 'Đã khóa',
        });
        hasLoadedProfileRef.current = true;
      } finally { setProfileFormLoading(false); }
    };
    loadData();
  }, [user, isInitializing, getProfile]);

  const handleProfileChange = (e) => {
    hasUserEditedRef.current = true;
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateProfileForm = () => {
    const fullName = String(profileForm.fullName || '').trim();
    const email = String(profileForm.email || '').trim();
    const phone = String(profileForm.phone || '').trim();
    const address = String(profileForm.address || '').trim();

    if (!fullName) { toast.error('Vui lòng nhập họ và tên.'); return false; }
    if (fullName.length < 2 || fullName.length > 30) { toast.error('Họ và tên phải từ 2 đến 30 ký tự.'); return false; }
    if (!email) { toast.error('Vui lòng nhập email.'); return false; }
    if (!EMAIL_REGEX.test(email)) { toast.error('Email không đúng định dạng.'); return false; }
    if (phone && !PHONE_REGEX.test(phone)) { toast.error('Số điện thoại không đúng định dạng Việt Nam.'); return false; }
    if (!address) { toast.error('Vui lòng nhập địa chỉ.'); return false; }
    return true;
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;
    setSavingProfile(true);
    try {
      await updateProfile({
        fullName: profileForm.fullName.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
      });
      toast.success('Cập nhật hồ sơ thành công.');
    } catch (err) { toast.error(err.message || 'Cập nhật thất bại'); }
    finally { setSavingProfile(false); }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) { toast.error('Vui lòng nhập mật khẩu hiện tại.'); return; }
    const ruleError = getPasswordRuleError(passwordForm.newPassword);
    if (ruleError) { toast.error(ruleError); return; }
    if (passwordForm.currentPassword === passwordForm.newPassword) { toast.error('Mật khẩu mới không được trùng mật khẩu cũ.'); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Mật khẩu xác nhận không khớp.'); return; }

    setChangingPassword(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword, token);
      toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      new BroadcastChannel('auth_channel').postMessage({ type: 'LOGOUT_ALL_TABS' });
      await logout();
      navigate('/login', { replace: true });
    } catch (err) { toast.error(err.message || 'Đổi mật khẩu thất bại'); }
    finally { setChangingPassword(false); }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'current') setShowCurrentPassword(!showCurrentPassword);
    if (field === 'new') setShowNewPassword(!showNewPassword);
    if (field === 'confirm') setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6fa', py: 4 }}>
      <Box sx={{ maxWidth: 1060, mx: 'auto', px: 3 }}>
        <HeroBanner
          gradient={isStudentRole ? "linear-gradient(135deg, #059669 0%, #0d9488 100%)" : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"}
          roleLabel={isStudentRole ? "Phụ huynh học sinh" : (userRoles[0] || 'Quản trị viên')}
          currentAvatar={profileForm.avatar || DEFAULT_AVATAR}
          displayName={user?.fullName || profileForm.fullName || 'Người dùng'}
          user={user} profileFormLoading={profileFormLoading} profileForm={profileForm}
          onBack={() => isStudentRole ? navigate('/student') : navigate(-1)}
          onLogout={() => { logout(); navigate('/login'); }}
        />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
          <SectionCard icon={<PersonOutlineIcon sx={{ color: 'white' }} />} title="Chỉnh sửa hồ sơ" accentGradient={isStudentRole ? "linear-gradient(135deg, #059669 0%, #0d9488 100%)" : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"}>
            <ProfileForm color={isStudentRole ? "success" : "primary"} profileForm={profileForm} onProfileChange={handleProfileChange} onSubmit={handleSubmitProfile} savingProfile={savingProfile} currentAvatar={profileForm.avatar || DEFAULT_AVATAR} />
          </SectionCard>
          <SectionCard icon={<LockOutlinedIcon sx={{ color: 'white' }} />} title="Đổi mật khẩu" accentGradient="linear-gradient(135deg, #f59e0b 0%, #f97316 100%)">
            <PasswordForm passwordForm={passwordForm} onPasswordChange={(e) => setPasswordForm({...passwordForm, [e.target.name]: e.target.value})} onSubmit={handleSubmitPassword} changingPassword={changingPassword} showCurrentPassword={showCurrentPassword} showNewPassword={showNewPassword} showConfirmPassword={showConfirmPassword} togglePasswordVisibility={togglePasswordVisibility} />
          </SectionCard>
        </Box>
      </Box>
    </Box>
  );
}

export default Profile;