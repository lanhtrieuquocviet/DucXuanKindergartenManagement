import { lazy, Suspense } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import CreateMenu from './components/CreateMenu';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { SchoolAdminProvider } from './context/SchoolAdminContext';
import { SchoolNurseProvider } from './context/SchoolNurseContext';
import { SystemAdminProvider } from './context/SystemAdminContext';
import { TeacherProvider } from './context/TeacherContext';
import MainLayout from './layouts/MainLayout';
import SimpleLayout from './layouts/SimpleLayout';
import DepartmentDocuments from './pages/Document/DepartmentDocuments';
import PublicDocumentDetail from './pages/Document/DocumentDetail';
import LegalDocuments from './pages/Document/LegalDocuments';
import AdministrativeOffice from './pages/Introduce/AdministrativeOffice';
import BoardOfDirectors from './pages/Introduce/BoardOfDirectors';
import Facilities from './pages/Introduce/Facilities';
import IntroductionSchool from './pages/Introduce/IntroductionSchool';
import ParentsCouncil from './pages/Introduce/ParentsCouncil';
import ProfessionalGroup from './pages/Introduce/ProfessionalGroup';
import StudySchedule from './pages/Introduce/StudySchedule';
import TeacherTeam from './pages/Introduce/TeacherTeam';
import DistrictNutritionKitchen from './pages/kitchenStaff/DistrictNutritionKitchen';
import FoodManagement from './pages/kitchenStaff/FoodManagemet';
import IngredientManagement from './pages/kitchenStaff/IngredientManagement';
import KitchenDashboard from './pages/kitchenStaff/KitchenDashboard';
import KitchenLayout from './pages/kitchenStaff/KitchenLayout';
import MealHeadcount from './pages/kitchenStaff/MealHeadcount';
import MealManagement from './pages/kitchenStaff/MealManagement';
import MenuDetail from './pages/kitchenStaff/MenuDetails';
import MenuManagement from './pages/kitchenStaff/MenuManagement';
import MenuReport from './pages/kitchenStaff/MenuReport';
import UploadSampleFood from './pages/kitchenStaff/UploadSampleFood';
import DocumentLibrary from './pages/Library/DocumentLibrary';
import ExperienceSharing from './pages/Library/ExperienceSharing';
import LessonPlan from './pages/Library/LessonPlan';
import PhotoGallery from './pages/Library/PhotoGallery';
import PoetryMusic from './pages/Library/PoetryMusic';
import RelaxPage from './pages/Library/RelaxPage';
import Schedule from './pages/Library/Schedule';
import ThingsToKnow from './pages/Library/ThingsToKnow';
import VideoGallery from './pages/Library/VideoGallery';
import WeeklyMenu from './pages/Library/WeeklyMenu';
import WeeklyProgram from './pages/Library/WeeklyProgram';
import NewsDetail from './pages/News/NewsDetail';
import NewsPage from './pages/News/NewsPage';
import PublicInfoDetail from './pages/PublicInformation/PublicInfoDetail';
import PublicInfoPage from './pages/PublicInformation/PublicInfoPage';
import PublicInformationDetail from './pages/PublicInformation/PublicInformationDetail';
import QnAPage from './pages/QuesAndAn/QnAPage';
import AcademicEventSetup from './pages/schoolAdmin/AcademicEventSetup';
import AcademicYearDetail from './pages/schoolAdmin/AcademicYearDetail';
import AcademicYearPlan from './pages/schoolAdmin/AcademicYearPlan';
import AcademicYearReport from './pages/schoolAdmin/AcademicYearReport';
import ClassListOverview from './pages/schoolAdmin/ClassListOverview';
import CurriculumPage from './pages/schoolAdmin/CurriculumPage';
import DistrictNutritionPlanSchoolAdmin from './pages/schoolAdmin/DistrictNutritionPlanSchoolAdmin';
import FaceAttendancePage from './pages/schoolAdmin/FaceAttendancePage';
import ManageAcademicYears from './pages/schoolAdmin/ManageAcademicYears';
import ManageAssetAllocation from './pages/schoolAdmin/ManageAssetAllocation';
import ManageAssetIncidents from './pages/schoolAdmin/ManageAssetIncidents';
import ManageAssets from './pages/schoolAdmin/ManageAssets';
import ManageBanners from './pages/schoolAdmin/ManageBanners';
import ManageCommittee from './pages/schoolAdmin/ManageCommittee';
import ManageMinutes from './pages/schoolAdmin/ManageMinutes';
import ManagePublicInfo from './pages/schoolAdmin/ManagePublicInfo';
import ManageRoomAssets from './pages/schoolAdmin/ManageRoomAssets';
import MealManagementSchoolAdmin from './pages/schoolAdmin/MealManagementSchoolAdmin';
import MenuDetailSchoolAdmin from './pages/schoolAdmin/MenuDetailSchoolAdmin';
import MenuSchoolAdmin from './pages/schoolAdmin/MenuSchoolAdmin';
import TimetableActivitiesPage from './pages/schoolAdmin/TimetableActivitiesPage';
import SearchResults from './pages/SearchResults';
import MealPhotosStudent from './pages/student/MealPhotosStudent';
import MenuDetailStudent from './pages/student/MenuDetailStudent';
import MenuStudent from './pages/student/MenuStudent';
import HeadTeacherAssetIncidents from './pages/teacher/HeadTeacherAssetIncidents';
import PickupRequest from './pages/teacher/PickupRequest';
import TeacherAssetIncidents from './pages/teacher/TeacherAssetIncidents';
import TeacherAssetInspection from './pages/teacher/TeacherAssetInspection';
import TeacherClassAssets from './pages/teacher/TeacherClassAssets';
import TeacherLeaveRequests from './pages/teacher/TeacherLeaveRequests';

// Lazy load components
const HomePage = lazy(() => import('./pages/Homepage'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const SystemAdminDashboard = lazy(() => import('./pages/systemAdmin/AdminDashboard'));
const ManageAccounts = lazy(() => import('./pages/systemAdmin/ManageAccounts'));
const ManageRoles = lazy(() => import('./pages/systemAdmin/ManageRoles'));
const ManagePermissions = lazy(() => import('./pages/systemAdmin/ManagePermissions'));
const SystemLogs = lazy(() => import('./pages/systemAdmin/SystemLogs'));
const BPMDashboard = lazy(() => import('./pages/systemAdmin/BPMDashboard'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const TeacherAttendance = lazy(() => import('./pages/teacher/TeacherAttendance'));
const ContactBook = lazy(() => import('./pages/teacher/ContactBook'));
const ContactBookDetail = lazy(() => import('./pages/teacher/ContactBookDetail'));
const TeacherStudents = lazy(() => import('./pages/teacher/TeacherStudents'));
const TeacherEvaluation = lazy(() => import('./pages/teacher/TeacherEvaluation'));
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
const MedicalStaffDashboard = lazy(() => import('./pages/medicalStaff/MedicalStaffDashboard'));
const StudentHealthManagement = lazy(() => import('./pages/medicalStaff/StudentHealthManagement'));
const StudentHealthHistory = lazy(() => import('./pages/medicalStaff/StudentHealthHistory'));
const HealthIncidentPage = lazy(() => import('./pages/medicalStaff/HealthIncidentPage'));
const StudentDetailPage = lazy(() => import('./pages/schoolAdmin/StudentDetailPage'));
const MenuHeadParent = lazy(() => import('./pages/headParent/MenuHeadParent'));
const MenuDetailHeadParent = lazy(() => import('./pages/headParent/MenuDetailHeadParent'));

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
            <Route
              path="/system-admin"
              element={
                <ProtectedRoute>
                  <SystemAdminProvider>
                    <SystemAdminDashboard />
                  </SystemAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/manage-accounts"
              element={
                <ProtectedRoute>
                  <SystemAdminProvider>
                    <ManageAccounts />
                  </SystemAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/manage-roles"
              element={
                <ProtectedRoute>
                  <SystemAdminProvider>
                    <ManageRoles />
                  </SystemAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/manage-permissions"
              element={
                <ProtectedRoute>
                  <SystemAdminProvider>
                    <ManagePermissions />
                  </SystemAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/system-logs"
              element={
                <ProtectedRoute>
                  <SystemAdminProvider>
                    <SystemLogs />
                  </SystemAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/bpm"
              element={
                <ProtectedRoute allowedRoles={['SystemAdmin', 'SchoolAdmin']}>
                  <SystemAdminProvider>
                    <BPMDashboard />
                  </SystemAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/classes"
              element={
                <ProtectedRoute>
                  <SystemAdminProvider>
                    <ClassList />
                  </SystemAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/classes/:classId/students"
              element={
                <ProtectedRoute>
                  <SystemAdminProvider>
                    <StudentInClass />
                  </SystemAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher"
              element={
                <ProtectedRoute>
                  <TeacherProvider>
                    <TeacherDashboard />
                  </TeacherProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/students"
              element={
                <ProtectedRoute>
                  <TeacherProvider>
                    <TeacherStudents />
                  </TeacherProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/evaluation"
              element={
                <ProtectedRoute>
                  <TeacherProvider>
                    <TeacherEvaluation />
                  </TeacherProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/contact-book"
              element={
                <ProtectedRoute>
                  <TeacherProvider>
                    <ContactBook />
                  </TeacherProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/contact-book/:classId"
              element={
                <ProtectedRoute>
                  <TeacherProvider>
                    <ContactBookDetail />
                  </TeacherProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/attendance"
              element={
                <ProtectedRoute>
                  <TeacherProvider>
                    <TeacherAttendance />
                  </TeacherProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/pickup-approval"
              element={
                <ProtectedRoute>
                  <TeacherProvider>
                    <PickupRequest />
                  </TeacherProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/asset-inspection"
              element={
                <ProtectedRoute>
                  <TeacherProvider>
                    <TeacherAssetInspection />
                  </TeacherProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/asset-incidents"
              element={
                <ProtectedRoute>
                  <TeacherProvider>
                    <TeacherAssetIncidents />
                  </TeacherProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/class-assets"
              element={
                <ProtectedRoute>
                  <TeacherProvider>
                    <TeacherClassAssets />
                  </TeacherProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/manage-asset-incidents"
              element={
                <ProtectedRoute>
                  <TeacherProvider>
                    <HeadTeacherAssetIncidents />
                  </TeacherProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/leave-requests"
              element={
                <ProtectedRoute>
                  <TeacherProvider>
                    <TeacherLeaveRequests />
                  </TeacherProvider>
                </ProtectedRoute>
              }
            />
            {/* Kitchen Staff */}
            <Route
              path="/kitchen"
              element={
                <ProtectedRoute>
                  <KitchenLayout />
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
            <Route
              path="/teacher/attendance/:classId"
              element={
                <ProtectedRoute>
                  <TeacherProvider>
                    <TeacherAttendance />
                  </TeacherProvider>
                </ProtectedRoute>
              }
            />
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
                    <SchoolAdminDashboard />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/class-list"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ClassListOverview />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/classes"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ClassList />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/grades"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageGradeCatalog />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/static-blocks"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageStaticBlockCatalog />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/classes/:classId/students"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <StudentInClass />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/students"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageStudents />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/students/:studentId/detail"
              element={
                <ProtectedRoute>
                  <StudentDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/students/health-report"
              element={
                <ProtectedRoute>
                  <StudentHealthReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/personnel"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManagePersonnel />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/teachers"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManagePersonnel />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/staff"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManagePersonnel />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/contacts"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ContactList />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/qa"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <QaList />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/attendance/overview"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <AttendanceOverview />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/classes/:classId/attendance"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ClassAttendanceDetail />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/students/:studentId/attendance"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <StudentAttendanceDetail />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/students/:studentId/attendance/history"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <StudentAttendanceHistory />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/attendance/export"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ExportAttendanceReport />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/blogs"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageBlogs />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/blogs/:blogId"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <BlogDetail />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/manage-blogs"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageBlogs />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/blog-categories"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageBlogCategories />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/documents"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageDocuments />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/files"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageFiles />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/image-library"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageImageLibrary />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/video-library"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageVideoLibrary />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/documents/:documentId"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <DocumentDetail />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/menus"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <MenuSchoolAdmin />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/menus/:id"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <MenuDetailSchoolAdmin />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/meal-management"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <MealManagementSchoolAdmin />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/district-nutrition-plan"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <DistrictNutritionPlanSchoolAdmin />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/public-info"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManagePublicInfo />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/banners"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageBanners />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/curriculum"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <CurriculumPage />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/timetable"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <TimetableActivitiesPage />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/academic-years"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageAcademicYears />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/academic-years/:yearId"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <AcademicYearDetail />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/academic-years/:yearId/report"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <AcademicYearReport />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/academic-report"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <AcademicYearReport />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/face-attendance"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <FaceAttendancePage />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/assets"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageAssets />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/room-assets"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageRoomAssets />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/asset-allocation"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageAssetAllocation />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/asset-incidents"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageAssetIncidents />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/purchase-requests"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManagePurchaseRequests />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/committee"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageCommittee />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/minutes"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <ManageMinutes />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/academic-plan"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <AcademicYearPlan />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-admin/academic-events"
              element={
                <ProtectedRoute>
                  <SchoolAdminProvider>
                    <AcademicEventSetup />
                  </SchoolAdminProvider>
                </ProtectedRoute>
              }
            />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* School Nurse Routes */}
            <Route
              path="/school-nurse"
              element={
                <ProtectedRoute>
                  <SchoolNurseProvider>
                    <SchoolNurseDashboard />
                  </SchoolNurseProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-nurse/health-list"
              element={
                <ProtectedRoute>
                  <SchoolNurseProvider>
                    <HealthCheckList />
                  </SchoolNurseProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-nurse/health-create"
              element={
                <ProtectedRoute>
                  <SchoolNurseProvider>
                    <HealthCheckForm />
                  </SchoolNurseProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-nurse/health-create/:id"
              element={
                <ProtectedRoute>
                  <SchoolNurseProvider>
                    <HealthCheckForm />
                  </SchoolNurseProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-nurse/follow-up"
              element={
                <ProtectedRoute>
                  <SchoolNurseProvider>
                    <FollowUpManagement />
                  </SchoolNurseProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-nurse/health-reports"
              element={
                <ProtectedRoute>
                  <SchoolNurseProvider>
                    <HealthReports />
                  </SchoolNurseProvider>
                </ProtectedRoute>
              }
            />

            {/* Medical Staff Routes */}
            <Route
              path="/medical-staff"
              element={
                <ProtectedRoute>
                  <MedicalStaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/medical-staff/health"
              element={
                <ProtectedRoute>
                  <StudentHealthManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/medical-staff/health/:studentId/history"
              element={
                <ProtectedRoute>
                  <StudentHealthHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/medical-staff/incidents"
              element={
                <ProtectedRoute>
                  <HealthIncidentPage />
                </ProtectedRoute>
              }
            />

            {/* HeadParent */}
            <Route path="/head-parent/menus" element={<ProtectedRoute><MenuHeadParent /></ProtectedRoute>} />
            <Route path="/head-parent/menus/:id" element={<ProtectedRoute><MenuDetailHeadParent /></ProtectedRoute>} />

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
