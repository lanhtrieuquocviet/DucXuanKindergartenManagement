import { createContext, useContext, useState } from 'react';
import { get, ENDPOINTS } from '../service/api';

const TeacherContext = createContext(null);

export const useTeacher = () => {
  const context = useContext(TeacherContext);
  if (!context) {
    throw new Error('useTeacher must be used within TeacherProvider');
  }
  return context;
};

export const TeacherProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get dashboard data
  const getDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.TEACHER.DASHBOARD);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Không tải được dữ liệu teacher';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    loading,
    error,
    getDashboard,
    setError,
  };

  return (
    <TeacherContext.Provider value={value}>
      {children}
    </TeacherContext.Provider>
  );
};

export default TeacherContext;
