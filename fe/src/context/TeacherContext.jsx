import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { get, ENDPOINTS } from '../service/api';

const TeacherContext = createContext(null);

export const useTeacher = () => {
  const context = useContext(TeacherContext);
  if (!context) {
    throw new Error('useTeacher must be used within TeacherProvider');
  }
  return context;
};

export const TeacherProvider = ({
  children,
  onError,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCommitteeMember, setIsCommitteeMember] = useState(false);

  useEffect(() => {
    get(ENDPOINTS.TEACHER.ASSET_COMMITTEE_IS_MEMBER)
      .then(res => setIsCommitteeMember(res?.data?.isMember === true))
      .catch(() => setIsCommitteeMember(false));
  }, []);

  // Sử dụng useRef để lưu trữ callback functions, tránh thay đổi kích thước mảng dependencies
  const onErrorRef = useRef(onError);
  const onSuccessRef = useRef(onSuccess);

  // Cập nhật ref khi prop thay đổi
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // Get dashboard data
  const getDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.TEACHER.DASHBOARD);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Không tải được dữ liệu teacher';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    loading,
    error,
    getDashboard,
    setError,
    isCommitteeMember,
  };

  return (
    <TeacherContext.Provider value={value}>
      {children}
    </TeacherContext.Provider>
  );
};

export default TeacherContext;
