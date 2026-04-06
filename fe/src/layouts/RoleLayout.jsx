/* Layout admin chung cho các role: sidebar trái + nội dung phải */
import { useState } from 'react';
import { Box, Drawer, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import {
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
  Person as PersonIcon,
  Circle as DotIcon,
  Public as PublicIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon,
  CameraAlt as CameraAltIcon,
  MenuBook as MenuBookIcon,
  Restaurant as RestaurantIcon,
  ShoppingCart as ShoppingCartIcon,
  ContentPasteSearch as ContentPasteSearchIcon,
  AccountTree as AccountTreeIcon,
  PhotoLibrary as PhotoLibraryIcon,
  VideoLibrary as VideoLibraryIcon,
  Grading as GradingIcon,
  Group as GroupIcon,
  Article as ArticleIcon,
} from '@mui/icons-material';
import { CurrencyIcon } from 'lucide-react';

import SidebarBrand from '../components/layouts/SidebarBrand';
import SidebarCollapseToggle from '../components/layouts/SidebarCollapseToggle';
import SidebarNavList from '../components/layouts/SidebarNavList';
import SidebarUserSection from '../components/layouts/SidebarUserSection';
import DashboardAppBar from '../components/layouts/DashboardAppBar';

const DRAWER_FULL = 260;
const DRAWER_MINI = 68;

export const KEY_ICONS = {
  overview:               <DashboardIcon fontSize="small" />,
  'academic-years':       <CalendarIcon fontSize="small" />,
  'academic-year-setup':  <CalendarIcon fontSize="small" />,
  'academic-plan':        <SchoolIcon fontSize="small" />,
  'academic-students':    <PeopleIcon fontSize="small" />,
  'academic-curriculum':  <CurrencyIcon fontSize="small" />,
  'academic-schedule':    <CalendarIcon fontSize="small" />,
  'academic-report':      <BarChartIcon fontSize="small" />,
  classes:                <SchoolIcon fontSize="small" />,
  teachers:               <PersonIcon fontSize="small" />,
  students:               <PeopleIcon fontSize="small" />,
  assets:                 <InventoryIcon fontSize="small" />,
  reports:                <AssessmentIcon fontSize="small" />,
  attendance:             <ChecklistIcon fontSize="small" />,
  'face-attendance':      <CameraAltIcon fontSize="small" />,
  'pickup-approval':      <HomeIcon fontSize="small" />,
  schedule:               <CalendarIcon fontSize="small" />,
  messages:               <NotifIcon fontSize="small" />,
  'class-list':           <SchoolIcon fontSize="small" />,
  'attendance-overview':  <BarChartIcon fontSize="small" />,
  blogs:                  <BlogIcon fontSize="small" />,
  documents:              <FolderIcon fontSize="small" />,
  'files-management':     <FolderIcon fontSize="small" />,
  'public-info':          <PublicIcon fontSize="small" />,
  'banner-management':    <DashboardIcon fontSize="small" />,
  qa:                     <QaIcon fontSize="small" />,
  menu:                   <MenuBookIcon fontSize="small" />,
  'meal-management':      <RestaurantIcon fontSize="small" />,
  contacts:               <EmailIcon fontSize="small" />,
  'contacts-list':        <EmailIcon fontSize="small" />,
  'assets-list':          <InventoryIcon fontSize="small" />,
  'public-info-list':     <PublicIcon fontSize="small" />,
  library:                <PhotoLibraryIcon fontSize="small" />,
  'image-library':        <PhotoLibraryIcon fontSize="small" />,
  'video-library':        <VideoLibraryIcon fontSize="small" />,
  permissions:            <ShieldIcon fontSize="small" />,
  roles:                  <RolesIcon fontSize="small" />,
  logs:                   <BarChartIcon fontSize="small" />,
  'purchase-request':     <ShoppingCartIcon fontSize="small" />,
  'purchase-requests':    <ShoppingCartIcon fontSize="small" />,
  'asset-inspection':     <ContentPasteSearchIcon fontSize="small" />,
  'class-assets':         <InventoryIcon fontSize="small" />,
  'asset-allocation':     <AccountTreeIcon fontSize="small" />,
  staff:                  <GroupIcon fontSize="small" />,
  kiemke:                 <GradingIcon fontSize="small" />,
  committee:              <GroupIcon fontSize="small" />,
  minutes:                <ArticleIcon fontSize="small" />,
};

/* ── Sidebar content (kết hợp các shared components) ── */
function SidebarContent({
  menuItems, activeKey, onMenuSelect, onLogout, onViewProfile,
  userName, userAvatar, collapsed, onToggleCollapse,
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper', overflowX: 'hidden' }}>
      <SidebarBrand collapsed={collapsed} />
      <SidebarCollapseToggle collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      <SidebarNavList
        menuItems={menuItems}
        activeKey={activeKey}
        onMenuSelect={onMenuSelect}
        collapsed={collapsed}
        keyIcons={KEY_ICONS}
      />
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
  const [collapsed, setCollapsed] = useState(false);

  const drawerWidth = isMobile ? DRAWER_FULL : (collapsed ? DRAWER_MINI : DRAWER_FULL);

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
        <DashboardAppBar
          isMobile={isMobile}
          onOpenMobile={() => setMobileOpen(true)}
          title={title}
          description={description}
          activeIcon={activeIcon}
          userName={userName}
          userAvatar={userAvatar}
          onViewProfile={onViewProfile}
          onLogout={onLogout}
        />

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
