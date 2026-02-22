import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { get, post, patch, ENDPOINTS } from '../service/api';

const SchoolAdminContext = createContext(null);

export const useSchoolAdmin = () => {
  const context = useContext(SchoolAdminContext);
  if (!context) {
    throw new Error('useSchoolAdmin must be used within SchoolAdminProvider');
  }
  return context;
};

export const SchoolAdminProvider = ({
  children,
  onError,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const response = await get(ENDPOINTS.SCHOOL_ADMIN.DASHBOARD);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Không tải được dữ liệu school admin';
      setError(errorMessage);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Danh sách liên hệ
  const getContacts = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const search = new URLSearchParams(params).toString();
      const endpoint = search ? `${ENDPOINTS.SCHOOL_ADMIN.CONTACTS}?${search}` : ENDPOINTS.SCHOOL_ADMIN.CONTACTS;
      const response = await get(endpoint);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Không tải được danh sách liên hệ';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Phản hồi liên hệ
  const replyContact = useCallback(async (contactId, reply) => {
    try {
      setError(null);
      const response = await patch(ENDPOINTS.SCHOOL_ADMIN.CONTACT_REPLY(contactId), { reply });
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Phản hồi thất bại';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Xóa phản hồi
  const clearReplyContact = useCallback(async (contactId) => {
    try {
      setError(null);
      const response = await patch(ENDPOINTS.SCHOOL_ADMIN.CONTACT_CLEAR_REPLY(contactId), {});
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Xóa phản hồi thất bại';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Gửi lại email phản hồi
  const resendReplyEmail = useCallback(async (contactId) => {
    try {
      setError(null);
      const response = await post(ENDPOINTS.SCHOOL_ADMIN.CONTACT_RESEND_EMAIL(contactId), {});
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Gửi lại email thất bại';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Lấy dữ liệu tổng quan điểm danh
  const getAttendanceOverview = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const search = new URLSearchParams(params).toString();
      const endpoint = search ? `${ENDPOINTS.SCHOOL_ADMIN.ATTENDANCE_OVERVIEW}?${search}` : ENDPOINTS.SCHOOL_ADMIN.ATTENDANCE_OVERVIEW;
      const response = await get(endpoint);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Không tải được dữ liệu điểm danh';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy chi tiết điểm danh của một lớp
  const getClassAttendanceDetail = useCallback(async (classId, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const search = new URLSearchParams(params).toString();
      const endpoint = search 
        ? `${ENDPOINTS.SCHOOL_ADMIN.CLASS_ATTENDANCE_DETAIL(classId)}?${search}` 
        : ENDPOINTS.SCHOOL_ADMIN.CLASS_ATTENDANCE_DETAIL(classId);
      const response = await get(endpoint);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Không tải được chi tiết điểm danh lớp';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy chi tiết điểm danh của một học sinh
  const getStudentAttendanceDetail = useCallback(async (studentId, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const search = new URLSearchParams(params).toString();
      const endpoint = search 
        ? `${ENDPOINTS.SCHOOL_ADMIN.STUDENT_ATTENDANCE_DETAIL(studentId)}?${search}` 
        : ENDPOINTS.SCHOOL_ADMIN.STUDENT_ATTENDANCE_DETAIL(studentId);
      const response = await get(endpoint);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Không tải được chi tiết điểm danh học sinh';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy lịch sử điểm danh của một học sinh
  const getStudentAttendanceHistory = useCallback(async (studentId, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const search = new URLSearchParams(params).toString();
      const endpoint = search 
        ? `${ENDPOINTS.SCHOOL_ADMIN.STUDENT_ATTENDANCE_HISTORY(studentId)}?${search}` 
        : ENDPOINTS.SCHOOL_ADMIN.STUDENT_ATTENDANCE_HISTORY(studentId);
      const response = await get(endpoint);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Không tải được lịch sử điểm danh học sinh';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy danh sách lớp
  const getClasses = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const search = new URLSearchParams(params).toString();
      const endpoint = search ? `${ENDPOINTS.CLASSES.LIST}?${search}` : ENDPOINTS.CLASSES.LIST;
      const response = await get(endpoint);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Không tải được danh sách lớp';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy danh sách học sinh trong lớp
  const getStudents = useCallback(async (classId, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const search = new URLSearchParams(params).toString();
      const endpoint = search 
        ? `${ENDPOINTS.CLASSES.STUDENTS(classId)}?${search}` 
        : ENDPOINTS.CLASSES.STUDENTS(classId);
      const response = await get(endpoint);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Không tải được danh sách học sinh';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    loading,
    error,
    getDashboard,
    getContacts,
    replyContact,
    clearReplyContact,
    resendReplyEmail,
    getAttendanceOverview,
    getClassAttendanceDetail,
    getStudentAttendanceDetail,
    getStudentAttendanceHistory,
    getClasses,
    getStudents,
    setError,
  };

  return (
    <SchoolAdminContext.Provider value={value}>
      {children}
    </SchoolAdminContext.Provider>
  );
};

export default SchoolAdminContext;
