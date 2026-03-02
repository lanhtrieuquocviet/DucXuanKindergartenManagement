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
import StudentDashboard from './pages/student/StudentDashboard';
import PickupRegistration from './pages/student/PickupRegistration';
import TodayAttendance from './pages/student/TodayAttendance';
import AttendanceReport from './pages/student/AttendanceReport';
import SchoolAdminDashboard from './pages/schoolAdmin/SchoolAdminDashboard';
import ClassList from './pages/schoolAdmin/ClassList';
import StudentInClass from './pages/schoolAdmin/StudentInClass';
import ContactList from './pages/schoolAdmin/ContactList';
import QaList from './pages/schoolAdmin/QaList';
import AttendanceOverview from './pages/schoolAdmin/AttendanceOverview';
import ClassAttendanceDetail from './pages/schoolAdmin/ClassAttendanceDetail';
import StudentAttendanceDetail from './pages/schoolAdmin/StudentAttendanceDetail';
import StudentAttendanceHistory from './pages/schoolAdmin/StudentAttendanceHistory';
import ExportAttendanceReport from './pages/schoolAdmin/ExportAttendanceReport';
import ManageBlogs from './pages/schoolAdmin/ManageBlogs';
import ManageDocuments from './pages/schoolAdmin/ManageDocuments';
import BlogDetail from './pages/schoolAdmin/BlogDetail';
import DocumentDetail from './pages/schoolAdmin/DocumentDetail';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import { AuthProvider } from './context/AuthContext';
import { SystemAdminProvider } from './context/SystemAdminContext';
import { SchoolAdminProvider } from './context/SchoolAdminContext';
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
import SchoolNews from './pages/News/SchoolNews';
import SearchResults from './pages/SearchResults';
import Notifications from './pages/News/Notifications';
import DepartmentNews from './pages/News/DepartmentNews';
import DepartmentNotifications from './pages/News/DepartmentNotifications';
import ExtracurricularActivities from './pages/News/ExtracurricularActivities';
import LegalDocuments from './pages/Document/LegalDocuments';
import DepartmentDocuments from './pages/Document/DepartmentDocuments';
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
import PickupRequest from './pages/teacher/PickupRequest';

function AppContent() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
        {/* Thông tin công khai */}
        <Route path="/public-information" element={<PublicInfoPage />} />
        
        <Route path="/public-information/:slug/:year" element={<PublicInformationDetail />} />

        <Route path="/introduce-school" element={<IntroductionSchool />} />

        <Route path="/teacher-team" element={<TeacherTeam />} />

        <Route path="/facilities" element={<Facilities />} />

        <Route path="/study-schedule" element={<StudySchedule />} />

        <Route path="/board-of-directors" element={<BoardOfDirectors />} />

        <Route path="/professional-group" element={<ProfessionalGroup />} /> 

        <Route path="/administrative-staff" element={<AdministrativeOffice />} />

        <Route path="/parent-council" element={<ParentsCouncil />} />

        <Route path="/school-news" element={<SchoolNews />} /> 
        <Route path="/search" element={<SearchResults />} />

        <Route path="/notifications-news" element={<Notifications />} />

        <Route path="/department-news" element={<DepartmentNews />} />

        <Route path="/department-notifications" element={<DepartmentNotifications />} />

        <Route path="/extracurricular-activities" element={<ExtracurricularActivities />} />

        <Route path="/legal-documents" element={<LegalDocuments />} />

        <Route path="/department-documents" element={<DepartmentDocuments />} />

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
              <SystemAdminProvider>
                <SystemAdminDashboard />
              </SystemAdminProvider>
            }
          />
          <Route
            path="/system-admin/manage-accounts"
            element={
              <SystemAdminProvider>
                <ManageAccounts />
              </SystemAdminProvider>
            }
          />
          <Route
            path="/system-admin/manage-roles"
            element={
              <SystemAdminProvider>
                <ManageRoles />
              </SystemAdminProvider>
            }
          />
          <Route
            path="/system-admin/manage-permissions"
            element={
              <SystemAdminProvider>
                <ManagePermissions />
              </SystemAdminProvider>
            }
          />
          <Route
            path="/system-admin/system-logs"
            element={
              <SystemAdminProvider>
                <SystemLogs />
              </SystemAdminProvider>
            }
          />
          <Route
            path="/system-admin/classes"
            element={
              <SystemAdminProvider>
                <ClassList />
              </SystemAdminProvider>
            }
          />
          <Route
            path="/system-admin/classes/:classId/students"
            element={
              <SystemAdminProvider>
                <StudentInClass />
              </SystemAdminProvider>
            }
          />
          <Route
            path="/teacher"
            element={
              <TeacherProvider>
                <TeacherDashboard />
              </TeacherProvider>
            }
          />
          <Route
            path="/teacher/attendance"
            element={
              <TeacherProvider>
                <TeacherAttendance />
              </TeacherProvider>
            }
          />
          <Route
            path="/teacher/pickup-approval"
            element={
              <TeacherProvider>
                <PickupRequest />
              </TeacherProvider>
            }
          />
          <Route
            path="/teacher/attendance/:classId"
            element={
              <TeacherProvider>
                <TeacherAttendance />
              </TeacherProvider>
            }
          />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/pickup" element={<PickupRegistration />} />
          <Route
            path="/student/attendance/today"
            element={<TodayAttendance />}
          />
          <Route
            path="/student/attendance/report"
            element={<AttendanceReport />}
          />
          <Route
            path="/school-admin"
            element={
              <SchoolAdminProvider>
                <SchoolAdminDashboard />
              </SchoolAdminProvider>
            }
          />
          <Route
            path="/school-admin/classes"
            element={
              <SchoolAdminProvider>
                <ClassList />
              </SchoolAdminProvider>
            }
          />
          <Route
            path="/school-admin/classes/:classId/students"
            element={
              <SchoolAdminProvider>
                <StudentInClass />
              </SchoolAdminProvider>
            }
          />
          <Route
            path="/school-admin/contacts"
            element={
              <SchoolAdminProvider>
                <ContactList />
              </SchoolAdminProvider>
            }
          />
          <Route
            path="/school-admin/qa"
            element={
              <SchoolAdminProvider>
                <QaList />
              </SchoolAdminProvider>
            }
          />
          <Route
            path="/school-admin/attendance/overview"
            element={
              <SchoolAdminProvider>
                <AttendanceOverview />
              </SchoolAdminProvider>
            }
          />
          <Route
            path="/school-admin/classes/:classId/attendance"
            element={
              <SchoolAdminProvider>
                <ClassAttendanceDetail />
              </SchoolAdminProvider>
            }
          />
          <Route
            path="/school-admin/students/:studentId/attendance"
            element={
              <SchoolAdminProvider>
                <StudentAttendanceDetail />
              </SchoolAdminProvider>
            }
          />
          <Route
            path="/school-admin/students/:studentId/attendance/history"
            element={
              <SchoolAdminProvider>
                <StudentAttendanceHistory />
              </SchoolAdminProvider>
            }
          />
          <Route
            path="/school-admin/attendance/export"
            element={
              <SchoolAdminProvider>
                <ExportAttendanceReport />
              </SchoolAdminProvider>
            }
          />
          <Route
            path="/school-admin/blogs"
            element={
              <SchoolAdminProvider>
                <ManageBlogs />
              </SchoolAdminProvider>
            }
          />
          <Route
            path="/school-admin/blogs/:blogId"
            element={
              <SchoolAdminProvider>
                <BlogDetail />
              </SchoolAdminProvider>
            }
          />
          <Route
            path="/school-admin/manage-blogs"
            element={
              <SchoolAdminProvider>
                <ManageBlogs />
              </SchoolAdminProvider>
            }
          />
          <Route
            path="/school-admin/documents"
            element={
              <SchoolAdminProvider>
                <ManageDocuments />
              </SchoolAdminProvider>
            }
          />
          <Route
            path="/school-admin/documents/:documentId"
            element={
              <SchoolAdminProvider>
                <DocumentDetail />
              </SchoolAdminProvider>
            }
          />
          <Route path="/profile" element={<Profile />} />

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
