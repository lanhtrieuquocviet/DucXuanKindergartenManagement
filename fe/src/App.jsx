import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/Homepage';
import About from './pages/About';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';

import SystemAdminDashboard from './pages/systemAdmin/AdminDashboard';
import ManagePermission from './pages/systemAdmin/ManagePermission';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import SchoolAdminDashboard from './pages/schoolAdmin/SchoolAdminDashboard';
import Contact from './pages/Contact';
import Profile from './pages/Profile';

function AppContent() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        {/* 404 route phải ở cuối cùng */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </>
  );
}
function App() {
  return (
    <Router>
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
        <Route path="/system-admin" element={<SystemAdminDashboard />} />
        <Route path="/system-admin/managepermitsion" element={<ManagePermission />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/school-admin" element={<SchoolAdminDashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;





