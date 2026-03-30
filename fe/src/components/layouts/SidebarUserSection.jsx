import {
  Box, Avatar, Typography, IconButton,
  ListItemButton, ListItemIcon, ListItemText, Tooltip,
} from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';

function getUserInitials(userName) {
  return userName
    ? userName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()
    : '?';
}

/**
 * Phần dưới cùng sidebar: avatar người dùng + nút đăng xuất.
 * @param {boolean}  collapsed      - sidebar đang thu gọn
 * @param {string}   userName       - tên hiển thị
 * @param {string}   userAvatar     - URL ảnh avatar
 * @param {function} onViewProfile  - callback xem hồ sơ (null = ẩn liên kết)
 * @param {function} onLogout       - callback đăng xuất
 */
export default function SidebarUserSection({ collapsed, userName, userAvatar, onViewProfile, onLogout }) {
  const initials = getUserInitials(userName);

  return (
    <Box sx={{ px: collapsed ? 0.75 : 1.5, pb: 1.5, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
      {collapsed ? (
        <>
          <Tooltip title={userName || 'Hồ sơ'} placement="right" arrow>
            <Box
              onClick={onViewProfile || undefined}
              sx={{
                display: 'flex', justifyContent: 'center',
                mb: 0.5, py: 0.75, borderRadius: 2,
                cursor: onViewProfile ? 'pointer' : 'default',
                '&:hover': onViewProfile ? { bgcolor: 'rgba(99,102,241,0.06)' } : {},
              }}
            >
              <Avatar src={userAvatar} sx={{ width: 34, height: 34, fontSize: 13, bgcolor: 'primary.main', boxShadow: '0 2px 6px rgba(99,102,241,0.3)' }}>
                {initials}
              </Avatar>
            </Box>
          </Tooltip>
          <Tooltip title="Đăng xuất" placement="right" arrow>
            <IconButton
              onClick={onLogout}
              size="small"
              sx={{ width: '100%', borderRadius: 2, color: 'error.main', py: 0.875, '&:hover': { bgcolor: 'rgba(211,47,47,0.07)' } }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ) : (
        <>
          <Box
            onClick={onViewProfile || undefined}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              px: 1.5, py: 1.25, borderRadius: 2.5, mb: 0.75,
              bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider',
              cursor: onViewProfile ? 'pointer' : 'default',
              '&:hover': onViewProfile ? { bgcolor: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.3)' } : {},
              transition: 'all 0.15s',
            }}
          >
            <Avatar src={userAvatar} sx={{ width: 34, height: 34, fontSize: 13, bgcolor: 'primary.main', fontWeight: 700, boxShadow: '0 2px 6px rgba(99,102,241,0.3)' }}>
              {initials}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap>{userName || 'Người dùng'}</Typography>
              <Typography variant="caption" color="primary.main" sx={{ fontSize: 11, opacity: 0.7 }}>Xem hồ sơ →</Typography>
            </Box>
          </Box>
          <ListItemButton
            onClick={onLogout}
            sx={{ borderRadius: 2, px: 1.5, py: 0.875, color: 'error.main', '&:hover': { bgcolor: 'rgba(211,47,47,0.07)' } }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Đăng xuất" slotProps={{ primary: { style: { fontSize: 13, fontWeight: 500 } } }} />
          </ListItemButton>
        </>
      )}
    </Box>
  );
}
