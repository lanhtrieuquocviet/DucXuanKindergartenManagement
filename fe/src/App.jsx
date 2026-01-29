import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/Homepage';
import About from './pages/About';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import SystemAdminDashboard from './pages/systemAdmin/AdminDashboard';
import ManageRoles from './pages/systemAdmin/ManageRoles';
import ManagePermissions from './pages/systemAdmin/ManagePermissions';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import SchoolAdminDashboard from './pages/schoolAdmin/SchoolAdminDashboard';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import { AuthProvider } from './context/AuthContext';
import { SystemAdminProvider } from './context/SystemAdminContext';
import { SchoolAdminProvider } from './context/SchoolAdminContext';
import { TeacherProvider } from './context/TeacherContext';
import SimpleLayout from './layouts/SimpleLayout';

function AppContent() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
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
            element={(
              <MainLayout>
                <AppContent />
              </MainLayout>
            )}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/system-admin"
            element={(
              <SystemAdminProvider>
                <SystemAdminDashboard />
              </SystemAdminProvider>
            )}
          />
          <Route
            path="/system-admin/manage-roles"
            element={(
              <SystemAdminProvider>
                <ManageRoles />
              </SystemAdminProvider>
            )}
          />
          <Route
            path="/system-admin/manage-permissions"
            element={(
              <SystemAdminProvider>
                <ManagePermissions />
              </SystemAdminProvider>
            )}
          />
          <Route
            path="/teacher"
            element={(
              <TeacherProvider>
                <TeacherDashboard />
              </TeacherProvider>
            )}
          />
          <Route
            path="/school-admin"
            element={(
              <SchoolAdminProvider>
                <SchoolAdminDashboard />
              </SchoolAdminProvider>
            )}
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
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
