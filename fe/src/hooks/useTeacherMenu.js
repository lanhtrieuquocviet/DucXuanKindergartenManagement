import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useTeacherMenu = () => {
  const { hasPermission, hasRole, isInitializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = useMemo(() => {
    if (isInitializing) return [];
    const items = [
      { key: 'classes-teacher', label: 'Lớp phụ trách', path: '/teacher', permission: 'VIEW_TEACHER_DASHBOARD' },
      { key: 'students-teacher', label: 'Danh sách học sinh', path: '/teacher/students', permission: 'VIEW_TEACHER_STUDENTS' },
      { key: 'evaluation-teacher', label: 'Đánh giá học sinh', path: '/teacher/evaluation', permission: 'MANAGE_TEACHER_EVALUATION' },
      { 
        key: 'attendance', 
        label: 'Điểm danh', 
        path: '/teacher/attendance', 
        permission: 'MANAGE_ATTENDANCE' 
      },
      { 
        key: 'pickup-approval', 
        label: 'Đơn đăng ký đưa đón', 
        path: '/teacher/pickup-approval', 
        permission: 'MANAGE_PICKUP' 
      },
      { 
        key: 'leave-requests', 
        label: 'Danh sách đơn xin nghỉ', 
        path: '/teacher/leave-requests', 
        permission: 'MANAGE_ATTENDANCE' 
      },
      { key: 'contact-book', label: 'Sổ liên lạc', path: '/teacher/contact-book', permission: 'MANAGE_TEACHER_CONTACT_BOOK' },
      

      { 
        key: 'asset-incidents-teacher', 
        label: 'Báo cáo sự cố CSVC', 
        path: '/teacher/asset-incidents', 
        permission: 'MANAGE_ASSET' 
      },
      { 
        key: 'class-assets', 
        label: 'Tài sản lớp', 
        path: '/teacher/class-assets', 
        permission: 'MANAGE_ASSET' 
      },
    ];

    return items.filter((item) => {
      if (item.permission && !hasPermission(item.permission)) return false;
      return true;
    });
  }, [hasPermission, hasRole, isInitializing]);

  const activeKey = useMemo(() => {
    const path = location.pathname;
    const found = menuItems.find(item => path.startsWith(item.path));
    if (found) return found.key;
    return 'classes';
  }, [location.pathname, menuItems]);

  const handleMenuSelect = (key) => {
    const found = menuItems.find(item => item.key === key);
    if (found) navigate(found.path);
  };

  return {
    menuItems,
    activeKey,
    handleMenuSelect,
  };
};
