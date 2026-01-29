import { createContext, useContext, useState } from 'react';
import { get, ENDPOINTS } from '../service/api';

const SchoolAdminContext = createContext(null);

export const useSchoolAdmin = () => {
  const context = useContext(SchoolAdminContext);
  if (!context) {
    throw new Error('useSchoolAdmin must be used within SchoolAdminProvider');
  }
  return context;
};

export const SchoolAdminProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get dashboard data
  const getDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.SCHOOL_ADMIN.DASHBOARD);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Không tải được dữ liệu school admin';
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
    <SchoolAdminContext.Provider value={value}>
      {children}
    </SchoolAdminContext.Provider>
  );
};

export default SchoolAdminContext;
