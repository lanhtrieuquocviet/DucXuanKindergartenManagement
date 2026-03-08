import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip,
  useMediaQuery,
  useTheme,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  RestaurantMenu as MenuIcon2,
  LocalFireDepartment as FoodIcon,
  CloudUpload as UploadIcon,
  BarChart as ReportIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Notifications as NotifIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Restaurant as MealIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

const DRAWER_FULL = 260;
const DRAWER_MINI = 68;

const KITCHEN_MENU = [
  {
    label: 'Tổng quan',
    key: 'dashboard',
    icon: <DashboardIcon fontSize="small" />,
    path: '/kitchen',
  },
  {
    label: 'Quản lý thực đơn',
    key: 'menus',
    icon: <MenuIcon2 fontSize="small" />,
    path: '/kitchen/menus',
  },
  {
    label: 'Quản lý món ăn',
    key: 'foods',
    icon: <FoodIcon fontSize="small" />,
    path: '/kitchen/foods',
  },
  {
    label: 'Quản lý bữa ăn',
    key: 'meal-management',
    icon: <MealIcon fontSize="small" />,
    path: '/kitchen/meal-management',
    children: [
      {
        label: 'Sĩ số & Suất cơm',
        key: 'headcount',
        icon: <PeopleIcon fontSize="small" />,
        path: '/kitchen/headcount',
      },
    ],
  },
  {
    label: 'Upload ảnh',
    key: 'upload',
    icon: <UploadIcon fontSize="small" />,
    path: '/kitchen/upload-food',
  },
  {
    label: 'Báo cáo',
    key: 'report',
    icon: <ReportIcon fontSize="small" />,
    path: '/kitchen/report',
  },
];

function SidebarContent({
  activeKey,
  onMenuSelect,
  onLogout,
  onViewProfile,
  userName,
  userAvatar,
  collapsed,
  onToggleCollapse,
  expandedKeys,
  onToggleExpand,
}) {
  const initials = userName
    ? userName
        .split(' ')
        .map((w) => w[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
        overflowX: 'hidden',
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          px: collapsed ? 1.5 : 2.5,
          py: 2.25,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : 1.5,
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          transition: 'padding 0.22s ease',
        }}
      >
        {!collapsed && (
          <>
            <Box
              sx={{
                position: 'absolute',
                right: -18,
                top: -18,
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.07)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                right: 30,
                bottom: -25,
                width: 50,
                height: 50,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.05)',
              }}
            />
          </>
        )}
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'rgba(255,255,255,0.2)',
            fontSize: 19,
            position: 'relative',
            zIndex: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            flexShrink: 0,
          }}
        >
          🍳
        </Avatar>
        {!collapsed && (
          <Box sx={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: 'white',
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: 0.3,
              }}
            >
              Đức Xuân
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.65)',
                fontSize: 10.5,
              }}
            >
              Kitchen Management
            </Typography>
          </Box>
        )}
      </Box>

      {/* Collapse toggle */}
      <Box
        sx={{
          px: 1,
          pt: 1,
          pb: 0.25,
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-end',
        }}
      >
        <Tooltip
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          placement="right"
          arrow
        >
          <IconButton
            size="small"
            onClick={onToggleCollapse}
            sx={{
              width: 26,
              height: 26,
              bgcolor: 'grey.100',
              border: '1px solid',
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'rgba(99,102,241,0.1)',
                color: 'primary.main',
                borderColor: 'rgba(99,102,241,0.3)',
              },
            }}
          >
            {collapsed ? (
              <ChevronRightIcon sx={{ fontSize: 15 }} />
            ) : (
              <ChevronLeftIcon sx={{ fontSize: 15 }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Navigation */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          pt: 0.75,
          pb: 1,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.200', borderRadius: 2 },
        }}
      >
        {!collapsed && (
          <Typography
            variant="caption"
            sx={{
              px: 2.5,
              mb: 1,
              display: 'block',
              color: 'text.disabled',
              fontWeight: 700,
              letterSpacing: 1.2,
              fontSize: 10,
              textTransform: 'uppercase',
            }}
          >
            Menu
          </Typography>
        )}

        <List dense disablePadding sx={{ px: collapsed ? 0.75 : 1 }}>
          {KITCHEN_MENU.map((item) => {
            const hasChildren = item.children?.length > 0;
            const isChildActive = hasChildren && item.children.some((c) => c.key === activeKey);
            const isActive = item.key === activeKey;
            const isExpanded = expandedKeys?.includes(item.key);

            const btn = (
              <ListItemButton
                key={item.key}
                onClick={() => {
                  if (hasChildren && !collapsed) {
                    onToggleExpand(item.key);
                    if (!isExpanded) onMenuSelect(item.key);
                  } else {
                    onMenuSelect(item.key);
                  }
                }}
                sx={{
                  mb: 0.5,
                  borderRadius: 2,
                  px: collapsed ? 0 : 1.5,
                  minHeight: 40,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  position: 'relative',
                  overflow: 'hidden',
                  bgcolor: (isActive || isChildActive) ? 'rgba(99,102,241,0.09)' : 'transparent',
                  color: (isActive || isChildActive) ? 'primary.main' : 'text.secondary',
                  '&::before': (isActive || isChildActive) && !collapsed
                    ? {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '18%',
                        bottom: '18%',
                        width: 3.5,
                        borderRadius: '0 4px 4px 0',
                        background: 'linear-gradient(180deg, #4f46e5, #7c3aed)',
                      }
                    : {},
                  '&:hover': {
                    bgcolor: (isActive || isChildActive)
                      ? 'rgba(99,102,241,0.12)'
                      : 'rgba(0,0,0,0.04)',
                    color: (isActive || isChildActive) ? 'primary.main' : 'text.primary',
                  },
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 0 : 36,
                    color: (isActive || isChildActive) ? 'primary.main' : 'text.disabled',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <>
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: {
                          style: {
                            fontSize: 13,
                            fontWeight: (isActive || isChildActive) ? 700 : 400,
                          },
                        },
                      }}
                    />
                    {hasChildren && (
                      isExpanded
                        ? <ArrowUpIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                        : <ArrowDownIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                    )}
                  </>
                )}
              </ListItemButton>
            );

            const mainBtn = collapsed ? (
              <Tooltip key={item.key} title={item.label} placement="right" arrow>
                {btn}
              </Tooltip>
            ) : (
              <span key={item.key}>{btn}</span>
            );

            return (
              <span key={item.key}>
                {mainBtn}
                {hasChildren && isExpanded && !collapsed && (
                  <List dense disablePadding sx={{ pl: 2, mb: 0.5 }}>
                    {item.children.map((child) => {
                      const isChildItemActive = child.key === activeKey;
                      return (
                        <ListItemButton
                          key={child.key}
                          onClick={() => onMenuSelect(child.key)}
                          sx={{
                            mb: 0.5,
                            borderRadius: 2,
                            px: 1.5,
                            minHeight: 36,
                            position: 'relative',
                            bgcolor: isChildItemActive ? 'rgba(99,102,241,0.09)' : 'transparent',
                            color: isChildItemActive ? 'primary.main' : 'text.secondary',
                            '&::before': isChildItemActive
                              ? {
                                  content: '""',
                                  position: 'absolute',
                                  left: 0,
                                  top: '18%',
                                  bottom: '18%',
                                  width: 3,
                                  borderRadius: '0 4px 4px 0',
                                  background: 'linear-gradient(180deg, #4f46e5, #7c3aed)',
                                }
                              : {},
                            '&:hover': {
                              bgcolor: isChildItemActive ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.04)',
                              color: isChildItemActive ? 'primary.main' : 'text.primary',
                            },
                            transition: 'background 0.15s, color 0.15s',
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 32,
                              color: isChildItemActive ? 'primary.main' : 'text.disabled',
                              justifyContent: 'center',
                            }}
                          >
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={child.label}
                            slotProps={{
                              primary: {
                                style: {
                                  fontSize: 12.5,
                                  fontWeight: isChildItemActive ? 700 : 400,
                                },
                              },
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                )}
              </span>
            );
          })}
        </List>
      </Box>

      {/* User + Logout */}
      <Box
        sx={{
          px: collapsed ? 0.75 : 1.5,
          pb: 1.5,
          pt: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {collapsed ? (
          <>
            <Tooltip title={userName || 'Hồ sơ'} placement="right" arrow>
              <Box
                onClick={onViewProfile || undefined}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 0.5,
                  py: 0.75,
                  borderRadius: 2,
                  cursor: onViewProfile ? 'pointer' : 'default',
                  '&:hover': onViewProfile
                    ? { bgcolor: 'rgba(99,102,241,0.06)' }
                    : {},
                }}
              >
                <Avatar
                  src={userAvatar}
                  sx={{
                    width: 34,
                    height: 34,
                    fontSize: 13,
                    bgcolor: 'primary.main',
                    boxShadow: '0 2px 6px rgba(99,102,241,0.3)',
                  }}
                >
                  {initials}
                </Avatar>
              </Box>
            </Tooltip>
            <Tooltip title="Đăng xuất" placement="right" arrow>
              <IconButton
                onClick={onLogout}
                size="small"
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  color: 'error.main',
                  py: 0.875,
                  '&:hover': { bgcolor: 'rgba(211,47,47,0.07)' },
                }}
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
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1.25,
                borderRadius: 2.5,
                mb: 0.75,
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'divider',
                cursor: onViewProfile ? 'pointer' : 'default',
                '&:hover': onViewProfile
                  ? {
                      bgcolor: 'rgba(99,102,241,0.06)',
                      borderColor: 'rgba(99,102,241,0.3)',
                    }
                  : {},
                transition: 'all 0.15s',
              }}
            >
              <Avatar
                src={userAvatar}
                sx={{
                  width: 34,
                  height: 34,
                  fontSize: 13,
                  bgcolor: 'primary.main',
                  fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(99,102,241,0.3)',
                }}
              >
                {initials}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {userName || 'Người dùng'}
                </Typography>
                <Typography
                  variant="caption"
                  color="primary.main"
                  sx={{ fontSize: 11, opacity: 0.7 }}
                >
                  Xem hồ sơ →
                </Typography>
              </Box>
            </Box>
            <ListItemButton
              onClick={onLogout}
              sx={{
                borderRadius: 2,
                px: 1.5,
                py: 0.875,
                color: 'error.main',
                '&:hover': { bgcolor: 'rgba(211,47,47,0.07)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Đăng xuất"
                slotProps={{
                  primary: { style: { fontSize: 13, fontWeight: 500 } },
                }}
              />
            </ListItemButton>
          </>
        )}
      </Box>
    </Box>
  );
}

// Flatten all menu items (including children) for path lookup
const ALL_MENU_ITEMS = KITCHEN_MENU.flatMap((item) =>
  item.children ? [item, ...item.children] : [item]
);

function KitchenLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isInitializing } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeKey, setActiveKey] = useState('dashboard');
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState([]);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('KitchenStaff')) { navigate('/', { replace: true }); return; }
  }, [user, isInitializing, navigate]);

  // Sync active key and expanded parents from current URL
  useEffect(() => {
    const matched = ALL_MENU_ITEMS.find((item) => item.path === location.pathname);
    if (!matched) return;
    setActiveKey(matched.key);
    // If matched item is a child, auto-expand its parent
    const parent = KITCHEN_MENU.find((m) => m.children?.some((c) => c.key === matched.key));
    if (parent) {
      setExpandedKeys((prev) => prev.includes(parent.key) ? prev : [...prev, parent.key]);
    }
  }, [location.pathname]);

  const drawerWidth = isMobile
    ? DRAWER_FULL
    : collapsed
      ? DRAWER_MINI
      : DRAWER_FULL;

  const userName = user?.fullName || user?.name || 'Kitchen Staff';
  const userAvatar = user?.avatar || '';

  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const todayLabel = new Date().toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  });

  const activeItem = ALL_MENU_ITEMS.find((m) => m.key === activeKey);
  const activeIcon = activeItem?.icon;

  const handleMenuSelect = (key) => {
    setMobileOpen(false);
    setActiveKey(key);
    const item = ALL_MENU_ITEMS.find((m) => m.key === key);
    if (item) navigate(item.path);
  };

  const handleToggleExpand = (key) => {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleLogout = () => {
    setMobileOpen(false);
    setProfileAnchor(null);
    logout();
  };

  const handleViewProfile = () => {
    setMobileOpen(false);
    setProfileAnchor(null);
    navigate('/profile');
  };

  const sharedSidebarProps = {
    activeKey,
    onMenuSelect: handleMenuSelect,
    onLogout: handleLogout,
    onViewProfile: handleViewProfile,
    userName,
    userAvatar,
    collapsed: isMobile ? false : collapsed,
    onToggleCollapse: () => setCollapsed((p) => !p),
    expandedKeys,
    onToggleExpand: handleToggleExpand,
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f6fa' }}>
      {/* Sidebar */}
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

      {/* Main */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh',
        }}
      >
        {/* AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
          }}
        >
          <Toolbar
            sx={{
              gap: 1.5,
              minHeight: { xs: 56, sm: 64 },
              px: { xs: 2, md: 3 },
            }}
          >
            {/* Hamburger mobile */}
            {isMobile && (
              <IconButton
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ color: 'text.secondary', mr: 0.5 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Active page icon + Title */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                flex: 1,
                minWidth: 0,
              }}
            >
              {activeIcon && (
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: 'rgba(99,102,241,0.1)',
                    display: { xs: 'none', sm: 'flex' },
                    flexShrink: 0,
                  }}
                >
                  <Box sx={{ color: 'primary.main', display: 'flex' }}>
                    {activeIcon}
                  </Box>
                </Avatar>
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  noWrap
                  sx={{
                    fontSize: { xs: 15, sm: 17 },
                    lineHeight: 1.3,
                  }}
                >
                  {activeItem?.label || 'Kitchen'}
                </Typography>
              </Box>
            </Box>

            {/* Date chip */}
            <Chip
              label={todayLabel}
              size="small"
              variant="outlined"
              sx={{
                display: { xs: 'none', md: 'flex' },
                fontSize: 11,
                fontWeight: 600,
                height: 28,
                borderColor: 'divider',
                color: 'text.secondary',
              }}
            />

            {/* Notification */}
            <Tooltip title="Thông báo" arrow>
              <IconButton
                size="small"
                sx={{
                  width: 36,
                  height: 36,
                  border: '1px solid',
                  borderColor: 'divider',
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

            {/* Profile button */}
            <Tooltip title="Hồ sơ cá nhân" arrow>
              <IconButton
                onClick={handleViewProfile}
                size="small"
                sx={{
                  width: 36,
                  height: 36,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  color: 'text.secondary',
                  display: { xs: 'none', md: 'flex' },
                  '&:hover': {
                    bgcolor: 'rgba(99,102,241,0.1)',
                    color: 'primary.main',
                    borderColor: 'rgba(99,102,241,0.3)'
                  },
                }}
              >
                <PersonIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            {/* User menu */}
            {userName && (
              <>
                <Box
                  onClick={(e) => setProfileAnchor(e.currentTarget)}
                  sx={{
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 10,
                    border: '1.5px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'grey.50',
                      borderColor: 'rgba(99,102,241,0.3)',
                    },
                    transition: 'all 0.15s',
                  }}
                >
                  <Avatar
                    src={userAvatar}
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: 12,
                      bgcolor: 'primary.main',
                      boxShadow: '0 2px 4px rgba(99,102,241,0.25)',
                    }}
                  >
                    {initials}
                  </Avatar>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    noWrap
                    sx={{ maxWidth: 130 }}
                  >
                    {userName}
                  </Typography>
                  <ArrowDownIcon sx={{ color: 'text.disabled', fontSize: 16 }} />
                </Box>

                <IconButton
                  sx={{ display: { xs: 'flex', md: 'none' }, p: 0.5 }}
                  onClick={(e) => setProfileAnchor(e.currentTarget)}
                >
                  <Avatar
                    src={userAvatar}
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: 13,
                      bgcolor: 'primary.main',
                    }}
                  >
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
                        mt: 1,
                        minWidth: 210,
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 1.75,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      bgcolor: 'grey.50',
                    }}
                  >
                    <Avatar
                      src={userAvatar}
                      sx={{
                        width: 38,
                        height: 38,
                        bgcolor: 'primary.main',
                        fontWeight: 700,
                        boxShadow: '0 2px 6px rgba(99,102,241,0.3)',
                      }}
                    >
                      {initials}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        noWrap
                      >
                        {userName}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ fontSize: 11 }}
                      >
                        Nhân viên nhà bếp
                      </Typography>
                    </Box>
                  </Box>

                  <Divider />

                  <Box sx={{ p: 0.75 }}>
                    <MenuItem
                      onClick={handleLogout}
                      sx={{
                        gap: 1.5,
                        py: 1.1,
                        fontSize: 14,
                        color: 'error.main',
                        borderRadius: 1.5,
                      }}
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
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default KitchenLayout;
