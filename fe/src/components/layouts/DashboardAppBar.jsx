import { useState } from 'react';
import {
  AppBar, Toolbar, Box, Typography, Avatar, IconButton,
  Menu, MenuItem, Chip, Tooltip, Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import logoDucXuan from '../../assets/logo/ducxuan-logo.png';
import NotificationBell from './NotificationBell';

function getUserInitials(userName) {
  return userName
    ? userName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()
    : '?';
}

/**
 * AppBar cố định ở trên cùng cho các dashboard layout.
 * @param {boolean}   isMobile      - đang ở màn hình nhỏ
 * @param {function}  onOpenMobile  - callback mở sidebar trên mobile
 * @param {string}    title         - tiêu đề trang
 * @param {string}    description   - mô tả phụ (ẩn trên mobile)
 * @param {ReactNode} activeIcon    - icon trang hiện tại
 * @param {string}    userName      - tên người dùng
 * @param {string}    userAvatar    - URL avatar
 * @param {function}  onViewProfile - callback xem hồ sơ (null = ẩn menu item)
 * @param {function}  onLogout      - callback đăng xuất
 * @param {string}    loginStatus   - text hiện trong dropdown dưới tên (mặc định 'Đã đăng nhập')
 */
export default function DashboardAppBar({
  isMobile,
  onOpenMobile,
  title,
  description,
  activeIcon,
  userName,
  userAvatar,
  onViewProfile,
  onLogout,
  loginStatus = 'Đã đăng nhập',
}) {
  const [profileAnchor, setProfileAnchor] = useState(null);
  const initials = getUserInitials(userName);

  const todayLabel = new Date().toLocaleDateString('vi-VN', {
    weekday: 'short', day: 'numeric', month: 'numeric',
  });

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid', borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ gap: 1.5, minHeight: { xs: 56, sm: 64 }, px: { xs: 2, md: 3 } }}>
        {isMobile && (
          <>
            <IconButton edge="start" onClick={onOpenMobile} sx={{ color: 'text.secondary', mr: 0.5 }}>
              <MenuIcon />
            </IconButton>
            <Avatar
              src={logoDucXuan}
              sx={{ width: 32, height: 32, mr: 1 }}
            />
          </>
        )}

        {/* Title + icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flex: 1, minWidth: 0 }}>
          {activeIcon && (
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(99,102,241,0.1)', display: { xs: 'none', sm: 'flex' }, flexShrink: 0 }}>
              <Box sx={{ color: 'primary.main', display: 'flex' }}>{activeIcon}</Box>
            </Avatar>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} noWrap sx={{ fontSize: { xs: 15, sm: 17 }, lineHeight: 1.3 }}>
              {title}
            </Typography>
            {description && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1, mt: 0.25 }}>
                {description}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Date chip */}
        <Chip
          label={todayLabel}
          size="small"
          variant="outlined"
          sx={{ display: { xs: 'none', md: 'flex' }, fontSize: 11, fontWeight: 600, height: 28, borderColor: 'divider', color: 'text.secondary' }}
        />

        {/* Notifications */}
        <NotificationBell />

        {/* User profile chip + dropdown */}
        {userName && (
          <>
            {/* Desktop: pill */}
            <Box
              onClick={(e) => setProfileAnchor(e.currentTarget)}
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center', gap: 1,
                px: 1.5, py: 0.75,
                borderRadius: 10,
                border: '1.5px solid', borderColor: 'divider',
                bgcolor: 'background.paper', cursor: 'pointer',
                '&:hover': { bgcolor: 'grey.50', borderColor: 'rgba(99,102,241,0.3)' },
                transition: 'all 0.15s',
              }}
            >
              <Avatar src={userAvatar} sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main', boxShadow: '0 2px 4px rgba(99,102,241,0.25)' }}>
                {initials}
              </Avatar>
              <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 130 }}>
                {userName}
              </Typography>
              <ArrowDownIcon sx={{ color: 'text.disabled', fontSize: 16 }} />
            </Box>

            {/* Mobile: avatar only */}
            <IconButton sx={{ display: { xs: 'flex', md: 'none' }, p: 0.5 }} onClick={(e) => setProfileAnchor(e.currentTarget)}>
              <Avatar src={userAvatar} sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}>
                {initials}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={profileAnchor}
              open={Boolean(profileAnchor)}
              onClose={() => setProfileAnchor(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1, minWidth: 210, borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    border: '1px solid', borderColor: 'divider',
                    overflow: 'hidden',
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.75, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'grey.50' }}>
                <Avatar src={userAvatar} sx={{ width: 38, height: 38, bgcolor: 'primary.main', fontWeight: 700, boxShadow: '0 2px 6px rgba(99,102,241,0.3)' }}>
                  {initials}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>{userName}</Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>{loginStatus}</Typography>
                </Box>
              </Box>

              <Divider />

              <Box sx={{ p: 0.75 }}>
                {onViewProfile && (
                  <MenuItem
                    onClick={() => { onViewProfile(); setProfileAnchor(null); }}
                    sx={{ gap: 1.5, py: 1.1, fontSize: 14, borderRadius: 1.5 }}
                  >
                    <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(99,102,241,0.1)' }}>
                      <PersonIcon sx={{ fontSize: 15, color: 'primary.main' }} />
                    </Avatar>
                    Xem hồ sơ
                  </MenuItem>
                )}
                <MenuItem
                  onClick={() => { if (onLogout) { onLogout(); setProfileAnchor(null); } }}
                  sx={{ gap: 1.5, py: 1.1, fontSize: 14, color: 'error.main', borderRadius: 1.5 }}
                >
                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(211,47,47,0.08)' }}>
                    <LogoutIcon sx={{ fontSize: 15, color: 'error.main' }} />
                  </Avatar>
                  Đăng xuất
                </MenuItem>
              </Box>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
