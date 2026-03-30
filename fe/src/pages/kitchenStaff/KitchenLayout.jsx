import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  RestaurantMenu as MenuIcon2,
  LocalFireDepartment as FoodIcon,
  BarChart as ReportIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  Restaurant as MealIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

import SidebarBrand from '../../components/layouts/SidebarBrand';
import SidebarCollapseToggle from '../../components/layouts/SidebarCollapseToggle';
import SidebarUserSection from '../../components/layouts/SidebarUserSection';
import DashboardAppBar from '../../components/layouts/DashboardAppBar';

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
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper', overflowX: 'hidden' }}>
      <SidebarBrand collapsed={collapsed} emoji="🍳" subtitle="Kitchen Management" />
      <SidebarCollapseToggle collapsed={collapsed} onToggleCollapse={onToggleCollapse} />

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

      <SidebarUserSection
        collapsed={collapsed}
        userName={userName}
        userAvatar={userAvatar}
        onViewProfile={onViewProfile}
        onLogout={onLogout}
      />
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
    logout();
  };

  const handleViewProfile = () => {
    setMobileOpen(false);
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
        <DashboardAppBar
          isMobile={isMobile}
          onOpenMobile={() => setMobileOpen(true)}
          title={activeItem?.label || 'Kitchen'}
          activeIcon={activeIcon}
          userName={userName}
          userAvatar={userAvatar}
          onViewProfile={handleViewProfile}
          onLogout={handleLogout}
          loginStatus="Nhân viên nhà bếp"
        />

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
