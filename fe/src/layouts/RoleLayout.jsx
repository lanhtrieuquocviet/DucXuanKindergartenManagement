/* Layout admin chung cho các role: sidebar trái + nội dung phải */
import { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItemButton,
  ListItemIcon, ListItemText, Avatar, IconButton, Menu, MenuItem,
  Divider, Chip, useMediaQuery, useTheme, Badge, Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  ChecklistRtl as ChecklistIcon,
  Home as HomeIcon,
  Notifications as NotifIcon,
  CalendarMonth as CalendarIcon,
  Shield as ShieldIcon,
  ManageAccounts as RolesIcon,
  BarChart as BarChartIcon,
  Article as BlogIcon,
  Folder as FolderIcon,
  QuestionAnswer as QaIcon,
  Email as EmailIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Circle as DotIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Public as PublicIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { CurrencyIcon } from 'lucide-react';

const DRAWER_FULL = 260;
const DRAWER_MINI = 68;

const KEY_ICONS = {
  overview:              <DashboardIcon fontSize="small" />,
  'academic-years':      <CalendarIcon fontSize="small" />,
  'academic-plan':       <CalendarIcon fontSize="small" />,
  'academic-classes':    <SchoolIcon fontSize="small" />,
  'academic-students':   <PeopleIcon fontSize="small" />,
  'academic-curriculum':   <CurrencyIcon fontSize="small" />,
  'academic-schedule':   <SchoolIcon fontSize="small" />,
  'academic-report':    <BarChartIcon fontSize="small" />,
  classes:               <SchoolIcon fontSize="small" />,
  teachers:              <PersonIcon fontSize="small" />,
  students:              <PeopleIcon fontSize="small" />,
  assets:                <InventoryIcon fontSize="small" />,
  reports:               <AssessmentIcon fontSize="small" />,
  attendance:            <ChecklistIcon fontSize="small" />,
  'pickup-approval':     <HomeIcon fontSize="small" />,
  schedule:              <CalendarIcon fontSize="small" />,
  messages:              <NotifIcon fontSize="small" />,
  'class-list':          <SchoolIcon fontSize="small" />,
  'attendance-overview': <BarChartIcon fontSize="small" />,
  blogs:                 <BlogIcon fontSize="small" />,
  documents:             <FolderIcon fontSize="small" />,
  'public-info':         <PublicIcon fontSize="small" />,
  qa:                    <QaIcon fontSize="small" />,
  contacts:              <EmailIcon fontSize="small" />,
  permissions:           <ShieldIcon fontSize="small" />,
  roles:                 <RolesIcon fontSize="small" />,
  logs:                  <BarChartIcon fontSize="small" />,
};

/* ── Sidebar content ── */
function SidebarContent({
  menuItems, activeKey, onMenuSelect, onLogout, onViewProfile,
  userName, userAvatar, collapsed, onToggleCollapse,
}) {
  const [openGroups, setOpenGroups] = useState({});
  const initials = userName
    ? userName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()
    : '?';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper', overflowX: 'hidden' }}>

      {/* ── Brand ── */}
      <Box
        sx={{
          px: collapsed ? 1.5 : 2.5, py: 2.25,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          display: 'flex', alignItems: 'center',
          gap: collapsed ? 0 : 1.5,
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexShrink: 0,
          position: 'relative', overflow: 'hidden',
          transition: 'padding 0.22s ease',
        }}
      >
        {!collapsed && (
          <>
            <Box sx={{ position: 'absolute', right: -18, top: -18, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />
            <Box sx={{ position: 'absolute', right: 30, bottom: -25, width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
          </>
        )}
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 19, position: 'relative', zIndex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', flexShrink: 0 }}>
          🎓
        </Avatar>
        {!collapsed && (
          <Box sx={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.2, letterSpacing: 0.3 }}>
              Đức Xuân
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 10.5 }}>
              Kindergarten Management
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Collapse toggle ── */}
      <Box sx={{ px: 1, pt: 1, pb: 0.25, display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
        <Tooltip title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'} placement="right" arrow>
          <IconButton
            size="small"
            onClick={onToggleCollapse}
            sx={{
              width: 26, height: 26,
              bgcolor: 'grey.100',
              border: '1px solid', borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': { bgcolor: 'rgba(99,102,241,0.1)', color: 'primary.main', borderColor: 'rgba(99,102,241,0.3)' },
            }}
          >
            {collapsed
              ? <ChevronRightIcon sx={{ fontSize: 15 }} />
              : <ChevronLeftIcon sx={{ fontSize: 15 }} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Nav ── */}
      <Box
        sx={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden', pt: 0.75, pb: 1,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.200', borderRadius: 2 },
        }}
      >
        {!collapsed && (
          <Typography
            variant="caption"
            sx={{ px: 2.5, mb: 1, display: 'block', color: 'text.disabled', fontWeight: 700, letterSpacing: 1.2, fontSize: 10, textTransform: 'uppercase' }}
          >
            Menu chính
          </Typography>
        )}

        <List dense disablePadding sx={{ px: collapsed ? 0.75 : 1 }}>
          {menuItems.map((item) => {
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;
            const isChildActive = hasChildren
              ? item.children.some((child) => child.key === activeKey)
              : false;
            const isActive = item.key === activeKey || isChildActive;
            const icon = item.icon || KEY_ICONS[item.key] || <DotIcon fontSize="small" />;
            const isGroupOpen = openGroups[item.key] ?? true;

            const parentButton = (
              <ListItemButton
                key={item.key}
                onClick={() => {
                  if (hasChildren) {
                    setOpenGroups((prev) => ({
                      ...prev,
                      [item.key]: !isGroupOpen,
                    }));
                  }
                  onMenuSelect(item.key);
                }}
                sx={{
                  mb: 0.5, borderRadius: 2,
                  px: collapsed ? 0 : 1.5,
                  minHeight: 40,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  position: 'relative', overflow: 'hidden',
                  bgcolor: isActive ? 'rgba(99,102,241,0.09)' : 'transparent',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  '&::before': isActive && !collapsed
                    ? {
                        content: '""',
                        position: 'absolute',
                        left: 0, top: '18%', bottom: '18%',
                        width: 3.5, borderRadius: '0 4px 4px 0',
                        background: 'linear-gradient(180deg, #4f46e5, #7c3aed)',
                      }
                    : {},
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.04)',
                    color: isActive ? 'primary.main' : 'text.primary',
                  },
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: isActive ? 'primary.main' : 'text.disabled', justifyContent: 'center' }}>
                  {icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { style: { fontSize: 13, fontWeight: isActive ? 700 : 400 } } }}
                  />
                )}
                {!collapsed && item.badge && (
                  <Chip label={item.badge} size="small" color={isActive ? 'primary' : 'default'} sx={{ height: 18, fontSize: 10 }} />
                )}
              </ListItemButton>
            );

            if (!hasChildren) {
              return collapsed
                ? (
                  <Tooltip key={item.key} title={item.label} placement="right" arrow>
                    {parentButton}
                  </Tooltip>
                )
                : (
                  <span key={item.key}>{parentButton}</span>
                );
            }

            return (
              <Box key={item.key} sx={{ mb: 0.25 }}>
                {collapsed ? (
                  <Tooltip title={item.label} placement="right" arrow>
                    {parentButton}
                  </Tooltip>
                ) : (
                  parentButton
                )}
                {!collapsed && isGroupOpen && (
                  <List dense disablePadding sx={{ pl: 4 }}>
                    {item.children.map((child) => {
                      const childIsActive = child.key === activeKey;
                      const childIcon = child.icon || KEY_ICONS[child.key] || <DotIcon fontSize="small" />;
                      return (
                        <ListItemButton
                          key={child.key}
                          onClick={() => onMenuSelect(child.key)}
                          sx={{
                            mb: 0.25,
                            borderRadius: 2,
                            minHeight: 34,
                            px: 1.5,
                            bgcolor: childIsActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                            color: childIsActive ? 'primary.main' : 'text.secondary',
                            '&:hover': {
                              bgcolor: childIsActive ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.03)',
                              color: childIsActive ? 'primary.main' : 'text.primary',
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 28, color: childIsActive ? 'primary.main' : 'text.disabled' }}>
                            {childIcon}
                          </ListItemIcon>
                          <ListItemText
                            primary={child.label}
                            slotProps={{ primary: { style: { fontSize: 12.5, fontWeight: childIsActive ? 600 : 400 } } }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                )}
              </Box>
            );
          })}
        </List>
      </Box>

      {/* ── User + Logout ── */}
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
    </Box>
  );
}

/* ── RoleLayout ── */
function RoleLayout({
  title,
  description,
  menuItems = [],
  activeKey,
  onLogout,
  userName,
  userAvatar,
  onViewProfile,
  onMenuSelect,
  children,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const drawerWidth = isMobile ? DRAWER_FULL : (collapsed ? DRAWER_MINI : DRAWER_FULL);

  const initials = userName
    ? userName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()
    : '?';

  const todayLabel = new Date().toLocaleDateString('vi-VN', {
    weekday: 'short', day: 'numeric', month: 'numeric',
  });

  const activeItem = menuItems.find((m) => m.key === activeKey);
  const activeIcon = activeItem?.icon || KEY_ICONS[activeKey];

  const handleMenuSelect = (key) => {
    setMobileOpen(false);
    if (onMenuSelect) onMenuSelect(key);
  };

  const sharedSidebarProps = {
    menuItems, activeKey,
    onMenuSelect: handleMenuSelect,
    onLogout: () => { setMobileOpen(false); if (onLogout) onLogout(); },
    onViewProfile: onViewProfile ? () => { setMobileOpen(false); onViewProfile(); } : null,
    userName, userAvatar,
    collapsed: isMobile ? false : collapsed,
    onToggleCollapse: () => setCollapsed((p) => !p),
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f6fa' }}>

      {/* ── Sidebar ── */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          transition: 'width 0.22s ease',
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            border: 'none',
            overflowX: 'hidden',
            boxShadow: isMobile ? 8 : '1px 0 0 rgba(0,0,0,0.06)',
            transition: 'width 0.22s ease !important',
          },
        }}
      >
        {isMobile && (
          <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
            <IconButton size="small" onClick={() => setMobileOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        <SidebarContent {...sharedSidebarProps} />
      </Drawer>

      {/* ── Main ── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>

        {/* AppBar */}
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
            {/* Hamburger mobile */}
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ color: 'text.secondary', mr: 0.5 }}>
                <MenuIcon />
              </IconButton>
            )}

            {/* Active page icon + Title */}
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

            {/* Notification */}
            <Tooltip title="Thông báo" arrow>
              <IconButton
                size="small"
                sx={{
                  width: 36, height: 36,
                  border: '1px solid', borderColor: 'divider',
                  bgcolor: 'background.paper',
                  color: 'text.secondary',
                  display: { xs: 'none', md: 'flex' },
                  '&:hover': { bgcolor: 'grey.50', color: 'text.primary' },
                }}
              >
                <Badge badgeContent={0} color="error">
                  <NotifIcon sx={{ fontSize: 18 }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User chip */}
            {userName && (
              <>
                <Box
                  onClick={(e) => setProfileAnchor(e.currentTarget)}
                  sx={{
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center', gap: 1,
                    px: 1.5, py: 0.75,
                    borderRadius: 10,
                    border: '1.5px solid', borderColor: 'divider',
                    bgcolor: 'background.paper',
                    cursor: 'pointer',
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
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>Đã đăng nhập</Typography>
                    </Box>
                  </Box>

                  <Divider />

                  <Box sx={{ p: 0.75 }}>
                    <MenuItem
                      disabled={!onViewProfile}
                      onClick={() => { if (onViewProfile) { onViewProfile(); setProfileAnchor(null); } }}
                      sx={{ gap: 1.5, py: 1.1, fontSize: 14, borderRadius: 1.5 }}
                    >
                      <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(99,102,241,0.1)' }}>
                        <PersonIcon sx={{ fontSize: 15, color: 'primary.main' }} />
                      </Avatar>
                      Xem hồ sơ
                    </MenuItem>
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

        {/* Page content */}
        <Box component="main" sx={{ flex: 1, overflow: 'auto' }}>
          <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2.5, md: 3 } }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default RoleLayout;
