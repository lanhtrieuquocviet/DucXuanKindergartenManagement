import {
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  School as SchoolIcon,
  Notifications as NotifIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Class as ClassIcon,
  Layers as LayersIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  Grading as GradingIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  ChecklistRtl as ChecklistIcon,
  CameraAlt as CameraAltIcon,
  Home as HomeIcon,
  MenuBook as MenuBookIcon,
  Article as BlogIcon,
  Folder as FolderIcon,
  Restaurant as RestaurantIcon,
  Public as PublicIcon,
  QuestionAnswer as QaIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Assignment as AssignmentIcon,
  Email as EmailIcon,
  PhotoLibrary as PhotoLibraryIcon,
  VideoLibrary as VideoLibraryIcon,
  Shield as ShieldIcon,
  ManageAccounts as RolesIcon,
  AdminPanelSettings as SecurityIcon,
  MeetingRoom as MeetingRoomIcon,
  AccountTree as AccountTreeIcon,
  ReportProblem as ReportProblemIcon,
  Settings as SettingsIcon,
  Timeline as PlanIcon,
  EventNote as EventNoteIcon,
  Schedule as ScheduleIcon,
  Badge as BadgeIcon,
  CheckCircle as AttendanceIcon,
  Face as FaceIcon,
  Fastfood as MealIcon,
  Inventory2 as Inventory2Icon,
  Handshake as HandoverIcon,
  ListAlt as ListIcon,
  ViewCarousel as BannerIcon,
  FolderOpen as FolderOpenIcon,
  ContactMail as ContactIcon,
  Description as DescriptionIcon,
  Info as InfoIcon,
  LibraryBooks as LibraryIcon,
  Close as CloseIcon,
  DirectionsCar as DirectionsCarIcon,
  EventBusy as EventBusyIcon,
  LocationOn as LocationIcon,
  Timeline as TimelineIcon,
  HealthAndSafety as HealthIcon,
  MedicalServices as MedicalIcon,
  LibraryAdd as LibraryAddIcon,
  AppRegistration as RegistrationIcon,
  Analytics as AnalyticsIcon,
  Feedback as FeedbackIcon,
  PhotoCamera as PhotoCameraIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { Box, Drawer, IconButton, useMediaQuery, useTheme } from '@mui/material';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

import DashboardAppBar from '../components/layouts/DashboardAppBar';
import SidebarBrand from '../components/layouts/SidebarBrand';
import SidebarCollapseToggle from '../components/layouts/SidebarCollapseToggle';
import SidebarNavList from '../components/layouts/SidebarNavList';
import SidebarUserSection from '../components/layouts/SidebarUserSection';
import { useAppMenu } from '../hooks/useAppMenu';

const DRAWER_FULL = 260;
const DRAWER_MINI = 68;

export const KEY_ICONS = {
  // Common
  overview: <DashboardIcon fontSize="small" />,
  
  // Groups
  'system-management': <SettingsIcon fontSize="small" />,
  'academic-management': <CalendarIcon fontSize="small" />,
  'attendance-management': <ChecklistIcon fontSize="small" />,
  'personnel': <BadgeIcon fontSize="small" />,
  'food-nutrition': <RestaurantIcon fontSize="small" />,
  'assets-management': <InventoryIcon fontSize="small" />,
  'cms-management': <PublicIcon fontSize="small" />,

  // System
  'manage-accounts': <PersonIcon fontSize="small" />,
  'manage-roles': <RolesIcon fontSize="small" />,
  'manage-permissions': <ShieldIcon fontSize="small" />,
  'job-positions': <BadgeIcon fontSize="small" />,
  'system-logs': <BarChartIcon fontSize="small" />,
  'bpm': <AccountTreeIcon fontSize="small" />,
  
  // Academic & Classes
  'academic-years': <CalendarIcon fontSize="small" />,
  'academic-plan': <PlanIcon fontSize="small" />,
  'academic-events': <EventNoteIcon fontSize="small" />,
  'curriculum': <ScheduleIcon fontSize="small" />,
  'timetable': <ScheduleIcon fontSize="small" />,
  'grades': <ClassIcon fontSize="small" />,
  'classes': <ClassIcon fontSize="small" />,
  'students': <PeopleIcon fontSize="small" />,
  'assessment-templates': <DescriptionIcon fontSize="small" />,
  'static-blocks': <LayersIcon fontSize="small" />,
  
  // Attendance
  'attendance-overview': <AttendanceIcon fontSize="small" />,
  'face-attendance': <FaceIcon fontSize="small" />,
  'attendance-export': <AssessmentIcon fontSize="small" />,
  'attendance': <ChecklistIcon fontSize="small" />,
  'pickup-approval': <DirectionsCarIcon fontSize="small" />,
  'leave-requests': <EventBusyIcon fontSize="small" />,

  // Personnel
  'staff-positions': <BadgeIcon fontSize="small" />,
  'personnel-management': <PeopleIcon fontSize="small" />,
  
  // Food & Nutrition
  'menu-admin': <MenuBookIcon fontSize="small" />,
  'menu-kitchen': <RestaurantIcon fontSize="small" />,
  'food-list': <MealIcon fontSize="small" />,
  'ingredients': <RestaurantIcon fontSize="small" />,
  'meal-management': <RestaurantIcon fontSize="small" />,
  'headcount': <PeopleIcon fontSize="small" />,
  'sample-food': <CameraAltIcon fontSize="small" />,
  'district-nutrition-plan': <LibraryIcon fontSize="small" />,
  'district-nutrition': <LibraryIcon fontSize="small" />,
  'report': <AssessmentIcon fontSize="small" />,
  'menu-review': <GradingIcon fontSize="small" />,
  
  // Assets
  'assets': <InventoryIcon fontSize="small" />,
  'asset-allocation': <AssignmentIcon fontSize="small" />,
  'asset-incidents': <ReportProblemIcon fontSize="small" />,
  'room-assets': <MeetingRoomIcon fontSize="small" />,
  'purchase-requests': <InventoryIcon fontSize="small" />,
  'committee': <PeopleIcon fontSize="small" />,
  'minutes': <DescriptionIcon fontSize="small" />,
  
  // CMS & Public Info
  'public-info': <PublicIcon fontSize="small" />,
  'banners': <BannerIcon fontSize="small" />,
  'blogs': <BlogIcon fontSize="small" />,
  'blog-categories': <CategoryIcon fontSize="small" />,
  'documents': <FolderIcon fontSize="small" />,
  'image-library': <PhotoLibraryIcon fontSize="small" />,
  'video-library': <VideoLibraryIcon fontSize="small" />,
  'contacts': <ContactIcon fontSize="small" />,
  'qa': <QaIcon fontSize="small" />,

  // Teacher specific
  'classes-teacher': <ClassIcon fontSize="small" />,
  'students-teacher': <PeopleIcon fontSize="small" />,
  'evaluation-teacher': <GradingIcon fontSize="small" />,
  'contact-book': <MenuBookIcon fontSize="small" />,
  'class-assets': <InventoryIcon fontSize="small" />,
  'asset-incidents-teacher': <ReportProblemIcon fontSize="small" />,

  // Medical & Health
  'health-records': <HealthIcon fontSize="small" />,
  'health-incidents': <ReportProblemIcon fontSize="small" />,
  'health-reports': <AnalyticsIcon fontSize="small" />,
  'health-list': <ListIcon fontSize="small" />,
  'follow-up': <TimelineIcon fontSize="small" />,
  'health': <MedicalIcon fontSize="small" />,
  
  // Kitchen extra
  'meal-photos': <PhotoCameraIcon fontSize="small" />,
  'meal-feedback': <FeedbackIcon fontSize="small" />,
};

/* ── Sidebar content (kết hợp các shared components) ── */
function SidebarContent({
  menuItems, activeKey, onMenuSelect, onLogout, onViewProfile,
  userName, userAvatar, userRole, collapsed, onToggleCollapse,
  loading,
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
        loading={loading}
      />
      <SidebarUserSection
        collapsed={collapsed}
        userName={userName}
        userAvatar={userAvatar}
        userRole={userRole}
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
  userRole,
  onViewProfile,
  onMenuSelect,
  children,
}) {
  const { user, logout, isInitializing } = useAuth();
  const theme = useTheme();
  const appMenu = useAppMenu();

  // Use hook values if props are missing
  const effectiveMenuItems = (menuItems && menuItems.length > 0) ? menuItems : appMenu.menuItems;
  const effectiveActiveKey = activeKey || appMenu.activeKey;
  const effectiveOnMenuSelect = onMenuSelect || appMenu.handleMenuSelect;

  // Fallback to context user info if props are missing
  const displayUserName = userName || user?.fullName || user?.username || 'Người dùng';
  const displayUserAvatar = userAvatar || user?.avatarUrl;
  const displayUserRole = userRole || (user?.roles?.[0]?.roleName || user?.roles?.[0]);
  const handleLogout = onLogout || logout;

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const drawerWidth = isMobile ? DRAWER_FULL : (collapsed ? DRAWER_MINI : DRAWER_FULL);

  const findActiveItem = (items, key) => {
    for (const item of items) {
      if (item.key === key) return item;
      if (item.children) {
        const found = findActiveItem(item.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  const activeItem = findActiveItem(effectiveMenuItems, effectiveActiveKey);
  const activeIcon = activeItem?.icon || KEY_ICONS[effectiveActiveKey];

  const handleMenuSelect = (key) => {
    setMobileOpen(false);
    if (effectiveOnMenuSelect) effectiveOnMenuSelect(key);
  };

  const sharedSidebarProps = {
    menuItems: effectiveMenuItems, 
    activeKey: effectiveActiveKey,
    onMenuSelect: handleMenuSelect,
    onLogout: () => { setMobileOpen(false); if (handleLogout) handleLogout(); },
    onViewProfile: onViewProfile ? () => { setMobileOpen(false); onViewProfile(); } : null,
    userName: displayUserName, 
    userAvatar: displayUserAvatar, 
    userRole: displayUserRole,
    collapsed: isMobile ? false : collapsed,
    onToggleCollapse: () => setCollapsed(!collapsed),
    loading: isInitializing,
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Sidebar for Desktop */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          <SidebarContent {...sharedSidebarProps} />
        </Drawer>
      )}

      {/* Sidebar for Mobile */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_FULL,
              boxSizing: 'border-box',
            },
          }}
        >
          <SidebarContent {...sharedSidebarProps} />
        </Drawer>
      )}

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
        <DashboardAppBar 
          title={activeItem?.label || title}
          icon={activeIcon}
          onMenuClick={() => setMobileOpen(true)}
          isMobile={isMobile}
        />
        
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2, md: 3 },
            width: '100%',
            overflowY: 'auto',
            bgcolor: 'transparent'
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default RoleLayout;
