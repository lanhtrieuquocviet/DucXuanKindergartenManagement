import { lazy, Suspense } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { SchoolAdminProvider } from './context/SchoolAdminContext';
import { SchoolNurseProvider } from './context/SchoolNurseContext';
import { SystemAdminProvider } from './context/SystemAdminContext';
import { TeacherProvider } from './context/TeacherContext';
import MainLayout from './layouts/MainLayout';
import SimpleLayout from './layouts/SimpleLayout';
import RoleLayout from './layouts/RoleLayout';
import { Outlet } from 'react-router-dom';

// Lazy load components
const HomePage = lazy(() => import('./pages/Homepage'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const SystemAdminDashboard = lazy(() => import('./pages/systemAdmin/AdminDashboard'));
const ManageAccounts = lazy(() => import('./pages/systemAdmin/ManageAccounts'));
const ManageRoles = lazy(() => import('./pages/systemAdmin/ManageRoles'));
const ManagePermissions = lazy(() => import('./pages/systemAdmin/ManagePermissions'));
const ManageJobPositions = lazy(() => import('./pages/systemAdmin/ManageJobPositions'));
const SystemLogs = lazy(() => import('./pages/systemAdmin/SystemLogs'));
const BPMDashboard = lazy(() => import('./pages/systemAdmin/BPMDashboard'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const TeacherAttendance = lazy(() => import('./pages/teacher/TeacherAttendance'));
const ContactBook = lazy(() => import('./pages/teacher/ContactBook'));
const ContactBookDetail = lazy(() => import('./pages/teacher/ContactBookDetail'));
const TeacherStudents = lazy(() => import('./pages/teacher/TeacherStudents'));
const TeacherEvaluation = lazy(() => import('./pages/teacher/TeacherEvaluation'));
const ClassAssessment = lazy(() => import('./pages/teacher/ClassAssessment'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentContactBook = lazy(() => import('./pages/student/StudentContactBook'));
const PickupRegistration = lazy(() => import('./pages/student/PickupRegistration'));
const LeaveRequest = lazy(() => import('./pages/student/LeaveRequest'));
const TodayAttendance = lazy(() => import('./pages/student/TodayAttendance'));
const AttendanceReport = lazy(() => import('./pages/student/AttendanceReport'));
const SchoolAdminDashboard = lazy(() => import('./pages/schoolAdmin/SchoolAdminDashboard'));
const SchoolNurseDashboard = lazy(() => import('./pages/schoolNurse/SchoolNurseDashboard'));
const HealthCheckList = lazy(() => import('./pages/schoolNurse/HealthCheckList'));
const HealthCheckForm = lazy(() => import('./pages/schoolNurse/HealthCheckForm'));
const FollowUpManagement = lazy(() => import('./pages/schoolNurse/FollowUpManagement'));
const HealthReports = lazy(() => import('./pages/schoolNurse/HealthReports'));
const ClassList = lazy(() => import('./pages/schoolAdmin/ClassList'));
const ManageGradeCatalog = lazy(() => import('./pages/schoolAdmin/ManageGradeCatalog'));
const ManageStaticBlockCatalog = lazy(() => import('./pages/schoolAdmin/ManageStaticBlockCatalog'));
const StudentInClass = lazy(() => import('./pages/schoolAdmin/StudentInClass'));
const ManageStudents = lazy(() => import('./pages/schoolAdmin/ManageStudents'));
const StudentHealthReport = lazy(() => import('./pages/schoolAdmin/StudentHealthReport'));
const ManageTeachers = lazy(() => import('./pages/schoolAdmin/ManageTeachers'));
const ManageStaff = lazy(() => import('./pages/schoolAdmin/ManageStaff'));
const ManagePersonnel = lazy(() => import('./pages/schoolAdmin/ManagePersonnel'));
const ContactList = lazy(() => import('./pages/schoolAdmin/ContactList'));
const QaList = lazy(() => import('./pages/schoolAdmin/QaList'));
const AttendanceOverview = lazy(() => import('./pages/schoolAdmin/AttendanceOverview'));
const ClassAttendanceDetail = lazy(() => import('./pages/schoolAdmin/ClassAttendanceDetail'));
const StudentAttendanceDetail = lazy(() => import('./pages/schoolAdmin/StudentAttendanceDetail'));
const StudentAttendanceHistory = lazy(() => import('./pages/schoolAdmin/StudentAttendanceHistory'));
const ExportAttendanceReport = lazy(() => import('./pages/schoolAdmin/ExportAttendanceReport'));
const ManageBlogs = lazy(() => import('./pages/schoolAdmin/ManageBlogs'));
const ManageBlogCategories = lazy(() => import('./pages/schoolAdmin/ManageBlogCategories'));
const ManageDocuments = lazy(() => import('./pages/schoolAdmin/ManageDocuments'));
const ManageFiles = lazy(() => import('./pages/schoolAdmin/ManageFiles'));
const ManageImageLibrary = lazy(() => import('./pages/schoolAdmin/ManageImageLibrary'));
const ManageVideoLibrary = lazy(() => import('./pages/schoolAdmin/ManageVideoLibrary'));
const BlogDetail = lazy(() => import('./pages/schoolAdmin/BlogDetail'));
const DocumentDetail = lazy(() => import('./pages/schoolAdmin/DocumentDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const Profile = lazy(() => import('./pages/Profile'));
const ManagePurchaseRequests = lazy(() => import('./pages/schoolAdmin/ManagePurchaseRequests'));
const PickupRequest = lazy(() => import('./pages/teacher/PickupRequest'));
const TeacherAssetInspection = lazy(() => import('./pages/teacher/TeacherAssetInspection'));
const TeacherClassAssets = lazy(() => import('./pages/teacher/TeacherClassAssets'));
const TeacherAssetIncidents = lazy(() => import('./pages/teacher/TeacherAssetIncidents'));
const HeadTeacherAssetIncidents = lazy(() => import('./pages/teacher/HeadTeacherAssetIncidents'));
const TeacherLeaveRequests = lazy(() => import('./pages/teacher/TeacherLeaveRequests'));
const KitchenDashboard = lazy(() => import('./pages/kitchenStaff/KitchenDashboard'));
const MenuManagement = lazy(() => import('./pages/kitchenStaff/MenuManagement'));
const MenuDetail = lazy(() => import('./pages/kitchenStaff/MenuDetails'));
const CreateMenu = lazy(() => import('./components/CreateMenu'));
const FoodManagement = lazy(() => import('./pages/kitchenStaff/FoodManagemet'));
const IngredientManagement = lazy(() => import('./pages/kitchenStaff/IngredientManagement'));
const MealManagement = lazy(() => import('./pages/kitchenStaff/MealManagement'));
const MealHeadcount = lazy(() => import('./pages/kitchenStaff/MealHeadcount'));
const UploadSampleFood = lazy(() => import('./pages/kitchenStaff/UploadSampleFood'));
const MenuReport = lazy(() => import('./pages/kitchenStaff/MenuReport'));
const DistrictNutritionKitchen = lazy(() => import('./pages/kitchenStaff/DistrictNutritionKitchen'));
const MenuSchoolAdmin = lazy(() => import('./pages/schoolAdmin/MenuSchoolAdmin'));
const MenuDetailSchoolAdmin = lazy(() => import('./pages/schoolAdmin/MenuDetailSchoolAdmin'));
const MenuStudent = lazy(() => import('./pages/student/MenuStudent'));
const MenuDetailStudent = lazy(() => import('./pages/student/MenuDetailStudent'));
const MealPhotosStudent = lazy(() => import('./pages/student/MealPhotosStudent'));
const ManageAcademicYears = lazy(() => import('./pages/schoolAdmin/ManageAcademicYears'));
const AcademicYearDetail = lazy(() => import('./pages/schoolAdmin/AcademicYearDetail'));
const AcademicYearReport = lazy(() => import('./pages/schoolAdmin/AcademicYearReport'));
const MealManagementSchoolAdmin = lazy(() => import('./pages/schoolAdmin/MealManagementSchoolAdmin'));
const DistrictNutritionPlanSchoolAdmin = lazy(() => import('./pages/schoolAdmin/DistrictNutritionPlanSchoolAdmin'));
const AcademicYearPlan = lazy(() => import('./pages/schoolAdmin/AcademicYearPlan'));
const AcademicEventSetup = lazy(() => import('./pages/schoolAdmin/AcademicEventSetup'));
const CurriculumPage = lazy(() => import('./pages/schoolAdmin/CurriculumPage'));
const ClassListOverview = lazy(() => import('./pages/schoolAdmin/ClassListOverview'));
const TimetableActivitiesPage = lazy(() => import('./pages/schoolAdmin/TimetableActivitiesPage'));
const ManageFacilityCategories = lazy(() => import('./pages/schoolAdmin/CategoryManagement/ManageFacilityCategories'));
const ManageAssetCategories = lazy(() => import('./pages/schoolAdmin/CategoryManagement/ManageAssetCategories'));
const ManageIngredientCategories = lazy(() => import('./pages/schoolAdmin/CategoryManagement/ManageIngredientCategories'));
const ManageStaffPositions = lazy(() => import('./pages/schoolAdmin/StaffManagement/ManageStaffPositions'));
const FaceAttendancePage = lazy(() => import('./pages/schoolAdmin/FaceAttendancePage'));
const ManageAssets = lazy(() => import('./pages/schoolAdmin/ManageAssets'));
const ManageAssetAllocation = lazy(() => import('./pages/schoolAdmin/ManageAssetAllocation'));
const ManageAssetIncidents = lazy(() => import('./pages/schoolAdmin/ManageAssetIncidents'));
const ManageRoomAssets = lazy(() => import('./pages/schoolAdmin/ManageRoomAssets'));
const ManageCommittee = lazy(() => import('./pages/schoolAdmin/ManageCommittee'));
const ManageMinutes = lazy(() => import('./pages/schoolAdmin/ManageMinutes'));
const ManageAssessmentTemplates = lazy(() => import('./pages/schoolAdmin/ManageAssessmentTemplates'));
const MedicalStaffDashboard = lazy(() => import('./pages/medicalStaff/MedicalStaffDashboard'));
const StudentHealthManagement = lazy(() => import('./pages/medicalStaff/StudentHealthManagement'));
const StudentHealthHistory = lazy(() => import('./pages/medicalStaff/StudentHealthHistory'));
const HealthIncidentPage = lazy(() => import('./pages/medicalStaff/HealthIncidentPage'));
const StudentDetailPage = lazy(() => import('./pages/schoolAdmin/StudentDetailPage'));
const MenuHeadParent = lazy(() => import('./pages/headParent/MenuHeadParent'));
const MenuDetailHeadParent = lazy(() => import('./pages/headParent/MenuDetailHeadParent'));
const IntroductionSchool = lazy(() => import('./pages/Introduce/IntroductionSchool'));
const TeacherTeam = lazy(() => import('./pages/Introduce/TeacherTeam'));
const Facilities = lazy(() => import('./pages/Introduce/Facilities'));
const StudySchedule = lazy(() => import('./pages/Introduce/StudySchedule'));
const BoardOfDirectors = lazy(() => import('./pages/Introduce/BoardOfDirectors'));
const ProfessionalGroup = lazy(() => import('./pages/Introduce/ProfessionalGroup'));
const AdministrativeOffice = lazy(() => import('./pages/Introduce/AdministrativeOffice'));
const ParentsCouncil = lazy(() => import('./pages/Introduce/ParentsCouncil'));
const NewsPage = lazy(() => import('./pages/News/NewsPage'));
const NewsDetail = lazy(() => import('./pages/News/NewsDetail'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const LegalDocuments = lazy(() => import('./pages/Document/LegalDocuments'));
const DepartmentDocuments = lazy(() => import('./pages/Document/DepartmentDocuments'));
const PublicDocumentDetail = lazy(() => import('./pages/Document/DocumentDetail'));
const WeeklyProgram = lazy(() => import('./pages/Library/WeeklyProgram'));
const WeeklyMenu = lazy(() => import('./pages/Library/WeeklyMenu'));
const PhotoGallery = lazy(() => import('./pages/Library/PhotoGallery'));
const VideoGallery = lazy(() => import('./pages/Library/VideoGallery'));
const DocumentLibrary = lazy(() => import('./pages/Library/DocumentLibrary'));
const Schedule = lazy(() => import('./pages/Library/Schedule'));
const LessonPlan = lazy(() => import('./pages/Library/LessonPlan'));
const ExperienceSharing = lazy(() => import('./pages/Library/ExperienceSharing'));
const ThingsToKnow = lazy(() => import('./pages/Library/ThingsToKnow'));
const PoetryMusic = lazy(() => import('./pages/Library/PoetryMusic'));
const RelaxPage = lazy(() => import('./pages/Library/RelaxPage'));
const ManagePublicInfo = lazy(() => import('./pages/schoolAdmin/ManagePublicInfo'));
const ManageBanners = lazy(() => import('./pages/schoolAdmin/ManageBanners'));
const QnAPage = lazy(() => import('./pages/QuesAndAn/QnAPage'));
const PublicInformationDetail = lazy(() => import('./pages/PublicInformation/PublicInformationDetail'));
const PublicInfoDetail = lazy(() => import('./pages/PublicInformation/PublicInfoDetail'));
const PublicInfoPage = lazy(() => import('./pages/PublicInformation/PublicInfoPage'));

// Facility Management
const FacilityDashboard = lazy(() => import('./pages/schoolAdmin/FacilityManagement/FacilityDashboard'));
const FacilityInventory = lazy(() => import('./pages/schoolAdmin/FacilityManagement/FacilityInventory'));
const FacilityHandover = lazy(() => import('./pages/schoolAdmin/FacilityManagement/FacilityHandover'));
const FacilityIssues = lazy(() => import('./pages/schoolAdmin/FacilityManagement/FacilityIssues'));
const RoomAssets = lazy(() => import('./pages/schoolAdmin/FacilityManagement/RoomAssets'));



const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-white/50 backdrop-blur-sm">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
  </div>
);

function AppContent() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
        {/* Thông tin công khai */}
        <Route path="/public-information" element={<PublicInfoPage />} />
        <Route path="/public-information/:slug/:year" element={<PublicInformationDetail />} />
        <Route path="/public-info/:id" element={<PublicInfoDetail />} />

        <Route path="/introduce-school" element={<IntroductionSchool />} />

        <Route path="/teacher-team" element={<TeacherTeam />} />

        <Route path="/facilities" element={<Facilities />} />

        <Route path="/study-schedule" element={<StudySchedule />} />

        <Route path="/board-of-directors" element={<BoardOfDirectors />} />

        <Route path="/professional-group" element={<ProfessionalGroup />} />

        <Route path="/administrative-staff" element={<AdministrativeOffice />} />

        <Route path="/parent-council" element={<ParentsCouncil />} />

        <Route path="/school-news" element={<NewsPage categoryName="Bản tin trường" />} />
        <Route path="/search" element={<SearchResults />} />

        <Route path="/notifications-news" element={<NewsPage categoryName="Thông báo" />} />

        <Route path="/department-news" element={<NewsPage categoryName="Tin tức từ Phòng" />} />

        <Route path="/department-notifications" element={<NewsPage categoryName="Thông báo từ Phòng" />} />

        <Route path="/extracurricular-activities" element={<NewsPage categoryName="Hoạt động ngoại khóa" />} />

        <Route path="/news/:blogId" element={<NewsDetail />} />

        <Route path="/legal-documents" element={<LegalDocuments />} />

        <Route path="/department-documents" element={<DepartmentDocuments />} />

        <Route path="/documents/:documentId" element={<PublicDocumentDetail />} />

        <Route path="/weekly-program" element={<WeeklyProgram />} />

        <Route path="/weekly-menu" element={<WeeklyMenu />} />

        <Route path="/photo-gallery" element={<PhotoGallery />} />

        <Route path="/video-gallery" element={<VideoGallery />} />

        <Route path="/document-library" element={<DocumentLibrary />} />

        <Route path="/schedule" element={<Schedule />} />

        <Route path="/lesson-plan" element={<LessonPlan />} />

        <Route path="/experience-sharing" element={<ExperienceSharing />} />

        <Route path="/things-to-know" element={<ThingsToKnow />} />

        <Route path="/poetry-music" element={<PoetryMusic />} />

        <Route path="/relax-page" element={<RelaxPage />} />

        {/* 404 route phải ở cuối cùng */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Trang login / forgot-password KHÔNG dùng MainLayout */}
            <Route
              path="/*"
              element={
                <MainLayout>
                  <AppContent />
                </MainLayout>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            {/* System Admin Routes */}
            <Route
              path="/system-admin"
              element={
                <ProtectedRoute>
                  <SystemAdminProvider>
                    <RoleLayout title="Quản trị hệ thống" description="Cấu hình hệ thống, tài khoản và phân quyền">
                      <Outlet />
                    </RoleLayout>
                  </SystemAdminProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<SystemAdminDashboard />} />
              <Route path="manage-accounts" element={<ManageAccounts />} />
              <Route path="manage-roles" element={<ManageRoles />} />
              <Route path="manage-permissions" element={<ManagePermissions />} />
              <Route path="job-positions" element={<ManageJobPositions />} />
              <Route path="system-logs" element={<SystemLogs />} />
              <Route path="bpm" element={<BPMDashboard />} />
              <Route path="classes" element={<ClassList />} />
              <Route path="classes/:classId/students" element={<StudentInClass />} />
            </Route>
            {/* Teacher Staff */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute>
                  <TeacherProvider>
                    <RoleLayout title="Giáo viên" description="Quản lý lớp học và học sinh">
                      <Outlet />
                    </RoleLayout>
                  </TeacherProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<TeacherDashboard />} />
              <Route path="students" element={<TeacherStudents />} />
              <Route path="evaluation" element={<ClassAssessment />} />
              <Route path="contact-book" element={<ContactBook />} />
              <Route path="contact-book/:classId" element={<ContactBookDetail />} />
              <Route path="attendance" element={<TeacherAttendance />} />
              <Route path="attendance/:classId" element={<TeacherAttendance />} />
              <Route path="pickup-approval" element={<PickupRequest />} />
              <Route path="asset-inspection" element={<TeacherAssetInspection />} />
              <Route path="asset-incidents" element={<TeacherAssetIncidents />} />
              <Route path="class-assets" element={<TeacherClassAssets />} />
              <Route path="manage-asset-incidents" element={<HeadTeacherAssetIncidents />} />
              <Route path="leave-requests" element={<TeacherLeaveRequests />} />
            </Route>
            {/* Kitchen Staff */}
            <Route
              path="/kitchen"
              element={
                <ProtectedRoute>
                  <RoleLayout title="Quản lý nhà bếp" description="Hệ thống quản lý thực đơn và dinh dưỡng">
                    <Outlet />
                  </RoleLayout>
                </ProtectedRoute>
              }
            >
              <Route index element={<KitchenDashboard />} />
              <Route path="menus" element={<MenuManagement />} />
              <Route path="menus/:id" element={<MenuDetail />} />
              <Route path="menus/create" element={<CreateMenu />} />
              <Route path="foods" element={<FoodManagement />} />
              <Route path="ingredients" element={<IngredientManagement />} />
              <Route path="district-nutrition" element={<DistrictNutritionKitchen />} />
              <Route path="meal-management" element={<MealManagement />} />
              <Route path="headcount" element={<MealHeadcount />} />
              <Route path="sample-food" element={<UploadSampleFood />} />
              <Route path="report" element={<MenuReport />} />
            </Route>
            <Route path="/student" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/pickup" element={<ProtectedRoute><PickupRegistration /></ProtectedRoute>} />
            <Route path="/student/leave-request" element={<ProtectedRoute><LeaveRequest /></ProtectedRoute>} />
            <Route path="/student/menus" element={<ProtectedRoute><MenuStudent /></ProtectedRoute>} />
            <Route path="/student/menus/:id" element={<ProtectedRoute><MenuDetailStudent /></ProtectedRoute>} />
            <Route path="/student/attendance/today" element={<ProtectedRoute><TodayAttendance /></ProtectedRoute>} />
            <Route path="/student/attendance/report" element={<ProtectedRoute><AttendanceReport /></ProtectedRoute>} />
            <Route path="/student/meal-photos" element={<ProtectedRoute><MealPhotosStudent /></ProtectedRoute>} />
            <Route path="/student/contact-book" element={<ProtectedRoute><StudentContactBook /></ProtectedRoute>} />
            <Route
              path="/school-admin"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <RoleLayout title="Quản trị trường học" description="Quản lý toàn diện hoạt động của nhà trường">
                      <Outlet />
                    </RoleLayout>
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<SchoolAdminDashboard />} />
              <Route path="class-list" element={<ClassListOverview />} />
              <Route path="classes" element={<ClassList />} />
              <Route path="grades" element={<ManageGradeCatalog />} />
              <Route path="static-blocks" element={<ManageStaticBlockCatalog />} />
              <Route path="classes/:classId/students" element={<StudentInClass />} />
              <Route path="students" element={<ManageStudents />} />
              <Route path="assessment-templates" element={<ManageAssessmentTemplates />} />
              <Route path="students/:studentId/detail" element={<StudentDetailPage />} />
              <Route path="staff-positions" element={<ManageStaffPositions />} />
              <Route path="staff" element={<ManagePersonnel />} />
              <Route path="contacts" element={<ContactList />} />
              <Route path="qa" element={<QaList />} />
              <Route path="attendance/overview" element={<AttendanceOverview />} />
              <Route path="classes/:classId/attendance" element={<ClassAttendanceDetail />} />
              <Route path="students/:studentId/attendance" element={<StudentAttendanceDetail />} />
              <Route path="students/:studentId/attendance/history" element={<StudentAttendanceHistory />} />
              <Route path="attendance/export" element={<ExportAttendanceReport />} />
              <Route path="blogs" element={<ManageBlogs />} />
              <Route path="blogs/:blogId" element={<BlogDetail />} />
              <Route path="manage-blogs" element={<ManageBlogs />} />
              <Route path="blog-categories" element={<ManageBlogCategories />} />
              <Route path="documents" element={<ManageDocuments />} />
              <Route path="files" element={<ManageFiles />} />
              <Route path="image-library" element={<ManageImageLibrary />} />
              <Route path="video-library" element={<ManageVideoLibrary />} />
              <Route path="documents/:documentId" element={<DocumentDetail />} />
              <Route path="menus" element={<MenuSchoolAdmin />} />
              <Route path="menus/:id" element={<MenuDetailSchoolAdmin />} />
              <Route path="meal-management" element={<MealManagementSchoolAdmin />} />
              <Route path="district-nutrition-plan" element={<DistrictNutritionPlanSchoolAdmin />} />
              <Route path="public-info" element={<ManagePublicInfo />} />
              <Route path="banners" element={<ManageBanners />} />
              <Route path="curriculum" element={<CurriculumPage />} />
              <Route path="timetable" element={<TimetableActivitiesPage />} />
              <Route path="academic-years" element={<ManageAcademicYears />} />
              <Route path="academic-years/:yearId" element={<AcademicYearDetail />} />
              <Route path="academic-years/:yearId/report" element={<AcademicYearReport />} />
              <Route path="academic-report" element={<AcademicYearReport />} />
              <Route path="face-attendance" element={<FaceAttendancePage />} />
              <Route path="facilities" element={<FacilityDashboard />} />
              <Route path="facilities/inventory" element={<FacilityInventory />} />
              <Route path="facilities/handover" element={<FacilityHandover />} />
              <Route path="facilities/issues" element={<FacilityIssues />} />
              <Route path="facilities/room-based" element={<RoomAssets />} />
              <Route path="assets" element={<ManageAssets />} />
              <Route path="room-assets" element={<ManageRoomAssets />} />
              <Route path="asset-allocation" element={<ManageAssetAllocation />} />
              <Route path="asset-incidents" element={<ManageAssetIncidents />} />
              <Route path="purchase-requests" element={<ManagePurchaseRequests />} />
              <Route path="committee" element={<ManageCommittee />} />
              <Route path="minutes" element={<ManageMinutes />} />
              <Route path="academic-plan" element={<AcademicYearPlan />} />
              <Route path="academic-events" element={<AcademicEventSetup />} />
            </Route>
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* School Nurse Routes */}
            <Route
              path="/school-nurse"
              element={
                <ProtectedRoute>
                  <SchoolNurseProvider>
                    <RoleLayout title="Y tế học đường" description="Theo dõi sức khỏe và quản lý y tế học sinh">
                      <Outlet />
                    </RoleLayout>
                  </SchoolNurseProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<SchoolNurseDashboard />} />
              <Route path="health-list" element={<HealthCheckList />} />
              <Route path="health-create" element={<HealthCheckForm />} />
              <Route path="health-create/:id" element={<HealthCheckForm />} />
              <Route path="follow-up" element={<FollowUpManagement />} />
              <Route path="health-reports" element={<HealthReports />} />
            </Route>

            {/* Medical Staff Routes */}
            <Route
              path="/medical-staff"
              element={
                <ProtectedRoute>
                  <RoleLayout title="Nhân viên y tế" description="Ghi nhận và xử lý các vấn đề sức khỏe học đường">
                    <Outlet />
                  </RoleLayout>
                </ProtectedRoute>
              }
            >
              <Route index element={<MedicalStaffDashboard />} />
              <Route path="health" element={<StudentHealthManagement />} />
              <Route path="health/:studentId/history" element={<StudentHealthHistory />} />
              <Route path="incidents" element={<HealthIncidentPage />} />
            </Route>

            {/* HeadParent */}
            <Route
              path="/head-parent"
              element={
                <ProtectedRoute>
                  <RoleLayout title="Hội trưởng phụ huynh" description="Xem xét và cho ý kiến về thực đơn nhà trường">
                    <Outlet />
                  </RoleLayout>
                </ProtectedRoute>
              }
            >
              <Route path="menus" element={<MenuHeadParent />} />
              <Route path="menus/:id" element={<MenuDetailHeadParent />} />
            </Route>

            <Route
              path="/contact"
              element={
                <SimpleLayout>
                  <Contact />
                </SimpleLayout>
              }
            />

            <Route
              path="/qa"
              element={
                <SimpleLayout>
                  <QnAPage />
                </SimpleLayout>
              }
            />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
