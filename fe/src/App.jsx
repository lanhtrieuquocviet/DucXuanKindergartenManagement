import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/Homepage';
import About from './pages/About';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import SystemAdminDashboard from './pages/systemAdmin/AdminDashboard';
import ManageAccounts from './pages/systemAdmin/ManageAccounts';
import ManageRoles from './pages/systemAdmin/ManageRoles';
import ManagePermissions from './pages/systemAdmin/ManagePermissions';
import SystemLogs from './pages/systemAdmin/SystemLogs';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import ContactBook from './pages/teacher/ContactBook';
import ContactBookDetail from './pages/teacher/ContactBookDetail';
import TeacherStudents from './pages/teacher/TeacherStudents';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentContactBook from './pages/student/StudentContactBook';
import PickupRegistration from './pages/student/PickupRegistration';
import TodayAttendance from './pages/student/TodayAttendance';
import AttendanceReport from './pages/student/AttendanceReport';
import SchoolAdminDashboard from './pages/schoolAdmin/SchoolAdminDashboard';
import SchoolNurseDashboard from './pages/schoolNurse/SchoolNurseDashboard';
import HealthCheckList from './pages/schoolNurse/HealthCheckList';
import HealthCheckForm from './pages/schoolNurse/HealthCheckForm';
import FollowUpManagement from './pages/schoolNurse/FollowUpManagement';
import HealthReports from './pages/schoolNurse/HealthReports';
import ClassList from './pages/schoolAdmin/ClassList';
import StudentInClass from './pages/schoolAdmin/StudentInClass';
import ManageStudents from './pages/schoolAdmin/ManageStudents';
import StudentHealthReport from './pages/schoolAdmin/StudentHealthReport';
import ManageTeachers from './pages/schoolAdmin/ManageTeachers';
import ManageStaff from './pages/schoolAdmin/ManageStaff';
import ContactList from './pages/schoolAdmin/ContactList';
import QaList from './pages/schoolAdmin/QaList';
import AttendanceOverview from './pages/schoolAdmin/AttendanceOverview';
import ClassAttendanceDetail from './pages/schoolAdmin/ClassAttendanceDetail';
import StudentAttendanceDetail from './pages/schoolAdmin/StudentAttendanceDetail';
import StudentAttendanceHistory from './pages/schoolAdmin/StudentAttendanceHistory';
import ExportAttendanceReport from './pages/schoolAdmin/ExportAttendanceReport';
import ManageBlogs from './pages/schoolAdmin/ManageBlogs';
import ManageBlogCategories from './pages/schoolAdmin/ManageBlogCategories';
import ManageDocuments from './pages/schoolAdmin/ManageDocuments';
import ManageFiles from './pages/schoolAdmin/ManageFiles';
import ManageImageLibrary from './pages/schoolAdmin/ManageImageLibrary';
import ManageVideoLibrary from './pages/schoolAdmin/ManageVideoLibrary';
import BlogDetail from './pages/schoolAdmin/BlogDetail';
import DocumentDetail from './pages/schoolAdmin/DocumentDetail';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import { AuthProvider } from './context/AuthContext';
import { SystemAdminProvider } from './context/SystemAdminContext';
import { SchoolAdminProvider } from './context/SchoolAdminContext';
import { SchoolNurseProvider } from './context/SchoolNurseContext';
import { TeacherProvider } from './context/TeacherContext';
import SimpleLayout from './layouts/SimpleLayout';
import QnAPage from './pages/QuesAndAn/QnAPage';
import PublicInfoPage from './pages/PublicInformation/PublicInfoPage';
import IntroductionSchool from './pages/Introduce/IntroductionSchool';
import TeacherTeam from './pages/Introduce/TeacherTeam';
import Facilities from './pages/Introduce/Facilities';
import StudySchedule from './pages/Introduce/StudySchedule';
import BoardOfDirectors from './pages/Introduce/BoardOfDirectors';
import AdministrativeOffice from './pages/Introduce/AdministrativeOffice';
import ParentsCouncil from './pages/Introduce/ParentsCouncil';
import ProfessionalGroup from './pages/Introduce/ProfessionalGroup';
import NewsPage from './pages/News/NewsPage';
import NewsDetail from './pages/News/NewsDetail';
import SearchResults from './pages/SearchResults';
import LegalDocuments from './pages/Document/LegalDocuments';
import DepartmentDocuments from './pages/Document/DepartmentDocuments';
import PublicDocumentDetail from './pages/Document/DocumentDetail';
import WeeklyMenu from './pages/Library/WeeklyMenu';
import WeeklyProgram from './pages/Library/WeeklyProgram';
import PhotoGallery from './pages/Library/PhotoGallery';
import VideoGallery from './pages/Library/VideoGallery';
import DocumentLibrary from './pages/Library/DocumentLibrary';
import Schedule from './pages/Library/Schedule';
import LessonPlan from './pages/Library/LessonPlan';
import ExperienceSharing from './pages/Library/ExperienceSharing';
import ThingsToKnow from './pages/Library/ThingsToKnow';
import PoetryMusic from './pages/Library/PoetryMusic';
import RelaxPage from './pages/Library/RelaxPage';
import PublicInformationDetail from './pages/PublicInformation/PublicInformationDetail';
import PublicInfoDetail from './pages/PublicInformation/PublicInfoDetail';
import ManagePublicInfo from './pages/schoolAdmin/ManagePublicInfo';
import ManageBanners from './pages/schoolAdmin/ManageBanners';
import ManagePurchaseRequests from './pages/schoolAdmin/ManagePurchaseRequests';
import PickupRequest from './pages/teacher/PickupRequest';
import TeacherAssetInspection from './pages/teacher/TeacherAssetInspection';
import TeacherPurchaseRequest from './pages/teacher/TeacherPurchaseRequest';
import TeacherClassAssets from './pages/teacher/TeacherClassAssets';
import HeadTeacherPurchaseRequests from './pages/teacher/HeadTeacherPurchaseRequests';
import KitchenLayout from './pages/kitchenStaff/KitchenLayout';
import KitchenDashboard from './pages/kitchenStaff/KitchenDashboard';
import MenuManagement from './pages/kitchenStaff/MenuManagement';
import MenuDetail from './pages/kitchenStaff/MenuDetails';
import CreateMenu from './components/CreateMenu';
import FoodManagement from './pages/kitchenStaff/FoodManagemet';
import IngredientManagement from './pages/kitchenStaff/IngredientManagement';
import MealManagement from './pages/kitchenStaff/MealManagement';
import MealHeadcount from './pages/kitchenStaff/MealHeadcount';
import UploadSampleFood from './pages/kitchenStaff/UploadSampleFood';
import MenuReport from './pages/kitchenStaff/MenuReport';
import MenuSchoolAdmin from './pages/schoolAdmin/MenuSchoolAdmin';
import MenuDetailSchoolAdmin from './pages/schoolAdmin/MenuDetailSchoolAdmin';
import MenuStudent from './pages/student/MenuStudent';
import MenuDetailStudent from './pages/student/MenuDetailStudent';
import MealPhotosStudent from './pages/student/MealPhotosStudent';
import ManageAcademicYears from './pages/schoolAdmin/ManageAcademicYears';
import AcademicYearDetail from './pages/schoolAdmin/AcademicYearDetail';
import AcademicYearReport from './pages/schoolAdmin/AcademicYearReport';
import MealManagementSchoolAdmin from './pages/schoolAdmin/MealManagementSchoolAdmin';
import AcademicYearPlan from './pages/schoolAdmin/AcademicYearPlan';
import AcademicEventSetup from './pages/schoolAdmin/AcademicEventSetup';
import CurriculumPage from './pages/schoolAdmin/CurriculumPage';
import ClassListOverview from './pages/schoolAdmin/ClassListOverview';
import TimetableActivitiesPage from './pages/schoolAdmin/TimetableActivitiesPage';
import FaceAttendancePage from './pages/schoolAdmin/FaceAttendancePage';
import ManageAssets from './pages/schoolAdmin/ManageAssets';
import ManageAssetAllocation from './pages/schoolAdmin/ManageAssetAllocation';
import ManageCommittee from './pages/schoolAdmin/ManageCommittee';
import ManageMinutes from './pages/schoolAdmin/ManageMinutes';
import ProtectedRoute from './components/ProtectedRoute';
import StudentHealthManagement from './pages/medicalStaff/StudentHealthManagement';
import StudentDetailPage from './pages/schoolAdmin/StudentDetailPage';


function AppContent() {
  return (
    <>
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
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
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
            path="/teacher/purchase-request"
            element={
              <ProtectedRoute>
                <TeacherProvider>
                  <TeacherPurchaseRequest />
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
            path="/teacher/manage-purchase-requests"
            element={
              <ProtectedRoute>
                <TeacherProvider>
                  <HeadTeacherPurchaseRequests />
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
            path="/school-admin/teachers"
            element={
              <ProtectedRoute>
                <ManageTeachers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/school-admin/staff"
            element={
              <ProtectedRoute>
                <SchoolAdminProvider>
                  <ManageStaff />
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
            path="/medical-staff/health"
            element={
              <ProtectedRoute>
                <StudentHealthManagement />
              </ProtectedRoute>
            }
          />

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
      </AuthProvider>
    </Router>
  );
}

export default App;
