import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  get,
  post,
  patch,
  put,
  del,
  ENDPOINTS,
} from '../service/api';

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

  /** Danh sách tất cả học sinh (có thể lọc theo classId) - dùng cho trang Phụ huynh & học sinh */
  const getAllStudents = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const search = new URLSearchParams(params).toString();
      const endpoint = search ? `${ENDPOINTS.STUDENTS.LIST}?${search}` : ENDPOINTS.STUDENTS.LIST;
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

  /** Tạo tài khoản phụ huynh + học sinh (parentId = _id User) */
  const createStudentWithParent = useCallback(async (payload) => {
    try {
      setLoading(true);
      setError(null);
      const response = await post(ENDPOINTS.STUDENTS.CREATE_WITH_PARENT, payload);
      if (onSuccessRef.current) onSuccessRef.current({ student: response.data });
      return response;
    } catch (err) {
      const errorMessage = err?.data?.message || err.message || 'Tạo phụ huynh và học sinh thất bại';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Cập nhật học sinh (và thông tin phụ huynh nếu gửi parentFullName, parentEmail, parentPhone) */
  const updateStudent = useCallback(async (studentId, payload) => {
    try {
      setLoading(true);
      setError(null);
      const response = await put(ENDPOINTS.STUDENTS.UPDATE(studentId), payload);
      if (onSuccessRef.current) onSuccessRef.current({ student: response.data });
      return response;
    } catch (err) {
      const errorMessage = err?.data?.message || err.message || 'Cập nhật thất bại';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Xóa học sinh */
  const deleteStudent = useCallback(async (studentId) => {
    try {
      setLoading(true);
      setError(null);
      await del(ENDPOINTS.STUDENTS.DELETE(studentId));
      if (onSuccessRef.current) onSuccessRef.current({ studentId });
    } catch (err) {
      const errorMessage = err?.data?.message || err.message || 'Xóa học sinh thất bại';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // ==== BLOGS CRUD (SchoolAdmin only, permission-based tại backend) ====
  const getBlogs = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const search = new URLSearchParams(params).toString();
      const endpoint = search
        ? `${ENDPOINTS.SCHOOL_ADMIN.BLOGS}?${search}`
        : ENDPOINTS.SCHOOL_ADMIN.BLOGS;
      const response = await get(endpoint);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Không tải được danh sách blog';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBlog = useCallback(async (payload) => {
    try {
      setError(null);
      const response = await post(ENDPOINTS.SCHOOL_ADMIN.BLOGS, payload);
      if (onSuccessRef.current) onSuccessRef.current(response.data);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Tạo blog thất bại';
      setError(errorMessage);
      if (onErrorRef.current) onErrorRef.current(err);
      throw new Error(errorMessage);
    }
  }, []);

  const updateBlog = useCallback(async (blogId, payload) => {
    try {
      console.log('context.updateBlog payload', blogId, payload);
      setError(null);
      const response = await put(ENDPOINTS.SCHOOL_ADMIN.BLOG_DETAIL(blogId), payload);
      if (onSuccessRef.current) onSuccessRef.current(response.data);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Cập nhật blog thất bại';
      setError(errorMessage);
      if (onErrorRef.current) onErrorRef.current(err);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteBlog = useCallback(async (blogId) => {
    try {
      setError(null);
      const response = await del(ENDPOINTS.SCHOOL_ADMIN.BLOG_DETAIL(blogId));
      if (onSuccessRef.current) onSuccessRef.current({ id: blogId });
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Xóa blog thất bại';
      setError(errorMessage);
      if (onErrorRef.current) onErrorRef.current(err);
      throw new Error(errorMessage);
    }
  }, []);

  // ==== BLOG CATEGORIES CRUD (requires MANAGE_BLOG_CATEGORY permission) ====
  const getBlogCategoriesAdmin = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.SCHOOL_ADMIN.BLOG_CATEGORIES);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Không tải được danh mục blog';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBlogCategory = useCallback(async (payload) => {
    try {
      setError(null);
      const response = await post(ENDPOINTS.SCHOOL_ADMIN.BLOG_CATEGORIES, payload);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Tạo danh mục thất bại';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateBlogCategory = useCallback(async (id, payload) => {
    try {
      setError(null);
      const response = await put(ENDPOINTS.SCHOOL_ADMIN.BLOG_CATEGORY_DETAIL(id), payload);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Cập nhật danh mục thất bại';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteBlogCategory = useCallback(async (id) => {
    try {
      setError(null);
      const response = await del(ENDPOINTS.SCHOOL_ADMIN.BLOG_CATEGORY_DETAIL(id));
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Xóa danh mục thất bại';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // ==== Q&A (SchoolAdmin) ====
  const getQaQuestions = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const search = new URLSearchParams(params).toString();
      const endpoint = search
        ? `${ENDPOINTS.SCHOOL_ADMIN.QA_QUESTIONS}?${search}`
        : ENDPOINTS.SCHOOL_ADMIN.QA_QUESTIONS;
      const response = await get(endpoint);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Không tải được danh sách câu hỏi';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuestion = useCallback(async (questionId, payload) => {
    try {
      setError(null);
      const response = await patch(ENDPOINTS.SCHOOL_ADMIN.QA_QUESTION_DETAIL(questionId), payload);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Cập nhật câu hỏi thất bại';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteQuestion = useCallback(async (questionId) => {
    try {
      setError(null);
      const response = await del(ENDPOINTS.SCHOOL_ADMIN.QA_QUESTION_DETAIL(questionId));
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Xóa câu hỏi thất bại';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const answerQuestion = useCallback(async (questionId, content, authorName) => {
    try {
      setError(null);
      const response = await post(ENDPOINTS.SCHOOL_ADMIN.QA_QUESTION_ANSWERS(questionId), {
        content,
        authorName,
      });
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Gửi trả lời thất bại';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateAnswer = useCallback(async (questionId, answerIndex, content, authorName) => {
    try {
      setError(null);
      const response = await patch(
        ENDPOINTS.SCHOOL_ADMIN.QA_QUESTION_ANSWER_DETAIL(questionId, answerIndex),
        {
          content,
          authorName,
        }
      );
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Cập nhật câu trả lời thất bại';
      setError(errorMessage);
      throw new Error(errorMessage);
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
    getAllStudents,
    createStudentWithParent,
    updateStudent,
    deleteStudent,
    getBlogs,
    createBlog,
    updateBlog,
    deleteBlog,
    getBlogCategoriesAdmin,
    createBlogCategory,
    updateBlogCategory,
    deleteBlogCategory,
    getQaQuestions,
    updateQuestion,
    deleteQuestion,
    answerQuestion,
    updateAnswer,
    setError,
  };

  return (
    <SchoolAdminContext.Provider value={value}>
      {children}
    </SchoolAdminContext.Provider>
  );
};

export default SchoolAdminContext;
