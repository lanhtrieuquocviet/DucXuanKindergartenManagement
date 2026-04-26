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
} from '@mui/icons-material';
import { Box, Drawer, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { CurrencyIcon } from 'lucide-react';
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
  
  // Academic & Classes
  'academic-management': <CalendarIcon fontSize="small" />,
  'teacher-class-group': <ClassIcon fontSize="small" />,
  'academic-years': <CalendarIcon fontSize="small" />,
  'academic-plan': <PlanIcon fontSize="small" />,
  'academic-events': <EventNoteIcon fontSize="small" />,
  'academic-schedule': <ScheduleIcon fontSize="small" />,
  'academic-report': <AssessmentIcon fontSize="small" />,
  
  // Classes & Students
  classes: <ClassIcon fontSize="small" />,
  'classes-admin': <ClassIcon fontSize="small" />,
  'classes-teacher': <ClassIcon fontSize="small" />,
  'teacher-students': <PeopleIcon fontSize="small" />,
  'students-admin': <PeopleIcon fontSize="small" />,
  'assessment-templates': <DescriptionIcon fontSize="small" />,
  'static-blocks': <LayersIcon fontSize="small" />,
  'blog-categories': <CategoryIcon fontSize="small" />,
  'grades': <ClassIcon fontSize="small" />,
  
  // Personnel
  personnel: <BadgeIcon fontSize="small" />,
  'personnel-management': <PeopleIcon fontSize="small" />,
  'staff-positions': <BadgeIcon fontSize="small" />,
  
  // Attendance
  'attendance-management': <ChecklistIcon fontSize="small" />,
  'attendance-overview': <AttendanceIcon fontSize="small" />,
  'attendance-teacher': <ChecklistIcon fontSize="small" />,
  'face-attendance': <FaceIcon fontSize="small" />,
  'pickup-management': <DirectionsCarIcon fontSize="small" />,
  
  // Health
  'health-medical': <ShieldIcon fontSize="small" />,
  'health-records': <ChecklistIcon fontSize="small" />,
  
  // Nutrition & Food
  'food-nutrition': <RestaurantIcon fontSize="small" />,
  'menu-admin': <MenuBookIcon fontSize="small" />,
  'menu-kitchen': <RestaurantIcon fontSize="small" />,
  'meal-photos': <CameraAltIcon fontSize="small" />,
  'food-list': <MealIcon fontSize="small" />,
  'review-menu': <GradingIcon fontSize="small" />,
  
  // Assets
  'assets-management': <InventoryIcon fontSize="small" />,
  'assets-list': <ListIcon fontSize="small" />,
  'asset-inspection': <ChecklistIcon fontSize="small" />,
  'purchase-requests': <CurrencyIcon size={18} />,
  'asset-handover': <AssignmentIcon fontSize="small" />,
  'asset-issues': <ReportProblemIcon fontSize="small" />,
  'room-assets': <MeetingRoomIcon fontSize="small" />,
  
  // CMS & Public Info
  'cms-management': <PublicIcon fontSize="small" />,
  'public-info': <InfoIcon fontSize="small" />,
  blogs: <BlogIcon fontSize="small" />,
  banners: <BannerIcon fontSize="small" />,
  documents: <FolderIcon fontSize="small" />,
  contacts: <ContactIcon fontSize="small" />,
  'image-library': <PhotoLibraryIcon fontSize="small" />,
  
  // Reports
  'reports-management': <AssessmentIcon fontSize="small" />,
  'teacher-report': <AssignmentTurnedInIcon fontSize="small" />,
  'head-teacher-report': <GradingIcon fontSize="small" />,
  
  // System
  'system-management': <SettingsIcon fontSize="small" />,
  'system-dashboard': <DashboardIcon fontSize="small" />,
  'user-management': <PersonIcon fontSize="small" />,
  'role-management': <RolesIcon fontSize="small" />,
  'permission-management': <ShieldIcon fontSize="small" />,
  'system-logs': <BarChartIcon fontSize="small" />,
  system_logs: <BarChartIcon fontSize="small" />,
  logs: <BarChartIcon fontSize="small" />,
  bpm: <AccountTreeIcon fontSize="small" />,
  bpm_workflows: <AccountTreeIcon fontSize="small" />,
  manage_accounts: <PersonIcon fontSize="small" />,
  accounts: <PersonIcon fontSize="small" />,
  manage_permissions: <ShieldIcon fontSize="small" />,
  permissions: <ShieldIcon fontSize="small" />,
  manage_roles: <RolesIcon fontSize="small" />,
  roles: <RolesIcon fontSize="small" />,
  system_dashboard: <DashboardIcon fontSize="small" />,
  dashboard: <DashboardIcon fontSize="small" />,
  job_positions: <BadgeIcon fontSize="small" />,
  'job-positions': <BadgeIcon fontSize="small" />,

  // Dynamic Groups from DB
  'group-Học vụ': <CalendarIcon fontSize="small" />,
  'group-Điểm danh': <ChecklistIcon fontSize="small" />,
  'group-Học sinh & Lớp học': <ClassIcon fontSize="small" />,
  'group-Y tế': <ShieldIcon fontSize="small" />,
  'group-Bếp & Thực phẩm': <RestaurantIcon fontSize="small" />,
  'group-Nội dung & Truyền thông': <PublicIcon fontSize="small" />,
  'group-Tài sản & Mua sắm': <InventoryIcon fontSize="small" />,
  'group-Báo cáo': <AssessmentIcon fontSize="small" />,
  'group-Hệ thống': <SettingsIcon fontSize="small" />,
  'group-Quản trị hệ thống': <SecurityIcon fontSize="small" />,
  'group-Danh mục': <CategoryIcon fontSize="small" />,

  // Teacher specific aliases or keys
  evaluation: <GradingIcon fontSize="small" />,
  'contact-book': <MenuBookIcon fontSize="small" />,
  'class-assets': <InventoryIcon fontSize="small" />,
  'leave-requests': <EventBusyIcon fontSize="small" />,

  // Permission Codes Mapping
  MANAGE_ACADEMIC_YEAR: <CalendarIcon fontSize="small" />,
  MANAGE_CURRICULUM: <ScheduleIcon fontSize="small" />,
  MANAGE_STUDENT: <PeopleIcon fontSize="small" />,
  MANAGE_CLASS: <ClassIcon fontSize="small" />,
  MANAGE_GRADE: <ClassIcon fontSize="small" />,
  MANAGE_TEACHER: <PeopleIcon fontSize="small" />,
  VIEW_ATTENDANCE: <AttendanceIcon fontSize="small" />,
  REGISTER_FACE: <FaceIcon fontSize="small" />,
  MANAGE_HEALTH: <ShieldIcon fontSize="small" />,
  MANAGE_HEALTH_INCIDENTS: <ReportProblemIcon fontSize="small" />,
  APPROVE_MENU: <GradingIcon fontSize="small" />,
  MANAGE_ASSET: <InventoryIcon fontSize="small" />,
  MANAGE_PURCHASE_REQUEST: <CurrencyIcon size={18} />,
  MANAGE_INSPECTION: <ChecklistIcon fontSize="small" />,
  VIEW_REPORT: <AssessmentIcon fontSize="small" />,
  MANAGE_STATIC_BLOCK: <LayersIcon fontSize="small" />,
  ACCESS_INVENTORY: <InventoryIcon fontSize="small" />,
  MANAGE_HANDOVER: <AssignmentIcon fontSize="small" />,
  MANAGE_ASSET_ISSUES: <ReportProblemIcon fontSize="small" />,
  MANAGE_ROOM_ASSETS: <MeetingRoomIcon fontSize="small" />,
  MANAGE_STAFF_POSITION: <BadgeIcon fontSize="small" />,
  MANAGE_ACADEMIC_PLAN: <PlanIcon fontSize="small" />,
  MANAGE_ACADEMIC_EVENTS: <EventNoteIcon fontSize="small" />,
  MANAGE_VIDEOS: <VideoLibraryIcon fontSize="small" />,
  MANAGE_DOCUMENTS: <FolderIcon fontSize="small" />,
  MANAGE_DOCUMENT: <FolderIcon fontSize="small" />,
  MANAGE_QA: <QaIcon fontSize="small" />,
  MANAGE_CONTACT: <ContactIcon fontSize="small" />,
  MANAGE_BANNER: <BannerIcon fontSize="small" />,
  MANAGE_BLOG: <BlogIcon fontSize="small" />,
  MANAGE_BLOG_CATEGORY: <CategoryIcon fontSize="small" />,
  MANAGE_PUBLIC_INFO: <InfoIcon fontSize="small" />,
  MANAGE_IMAGE_LIBRARY: <PhotoLibraryIcon fontSize="small" />,
  SCHOOL_ADMIN_DISTRICT_NUTRITION: <LibraryIcon fontSize="small" />,
  MANAGE_INGREDIENTS: <RestaurantIcon fontSize="small" />,
  KITCHEN_DISTRICT_NUTRITION: <LibraryIcon fontSize="small" />,
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
    onToggleCollapse: () => setCollapsed((p) => !p),
    loading: isInitializing,
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
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh',
          transition: 'all 0.22s ease',
          width: isMobile ? '100%' : { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <DashboardAppBar
          isMobile={isMobile}
          onOpenMobile={() => setMobileOpen(true)}
          title={title}
          description={description}
          activeIcon={activeIcon}
          userName={displayUserName}
          userAvatar={displayUserAvatar}
          onViewProfile={onViewProfile}
          onLogout={handleLogout}
        />

        {/* Page content */}
        <Box component="main" sx={{ flex: 1, overflow: 'auto', width: '100%' }}>
          <Box 
            sx={{ 
              px: { xs: 2, sm: 3, md: 4 }, 
              py: { xs: 2.5, md: 3 }, 
              width: '100%', 
              maxWidth: 'none',
              boxSizing: 'border-box'
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default RoleLayout;
