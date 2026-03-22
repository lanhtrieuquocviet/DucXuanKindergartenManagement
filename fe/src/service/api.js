/**
 * API Service - Chỉ định nghĩa endpoints và HTTP methods
 * Logic xử lý được thực hiện trong Context
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Lấy token từ localStorage
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Xử lý response từ API
 */
const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || `HTTP error! status: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/**
 * Tạo headers với token nếu có
 */
const getHeaders = (includeAuth = true, customHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

/**
 * GET request
 */
export const get = async (endpoint, options = {}) => {
  const { includeAuth = true, headers: customHeaders = {} } = options;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: getHeaders(includeAuth, customHeaders),
  });

  return handleResponse(response);
};

/**
 * POST request
 */
export const post = async (endpoint, body, options = {}) => {
  const { includeAuth = true, headers: customHeaders = {} } = options;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getHeaders(includeAuth, customHeaders),
    body: JSON.stringify(body),
  });

  return handleResponse(response);
};

/**
 * POST FormData (multipart) - dùng cho upload file
 */
export const postFormData = async (endpoint, formData, options = {}) => {
  const { includeAuth = true } = options;
  const headers = {};
  if (includeAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return handleResponse(response);
};

/**
 * PUT FormData (multipart) - dùng cho upload file
 */
export const putFormData = async (endpoint, formData, options = {}) => {
  const { includeAuth = true } = options;
  const headers = {};
  if (includeAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers,
    body: formData,
  });

  return handleResponse(response);
};

/**
 * PUT request
 */
export const put = async (endpoint, body, options = {}) => {
  const { includeAuth = true, headers: customHeaders = {} } = options;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: getHeaders(includeAuth, customHeaders),
    body: JSON.stringify(body),
  });

  return handleResponse(response);
};

/**
 * PATCH request
 */
export const patch = async (endpoint, body, options = {}) => {
  const { includeAuth = true, headers: customHeaders = {} } = options;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: getHeaders(includeAuth, customHeaders),
    body: JSON.stringify(body),
  });

  return handleResponse(response);
};

/**
 * DELETE request
 */
export const del = async (endpoint, options = {}) => {
  const { includeAuth = true, headers: customHeaders = {} } = options;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getHeaders(includeAuth, customHeaders),
  });

  return handleResponse(response);
};

// ============================================
// Endpoints Definition
// ============================================

export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
    ME_STUDENT: "/auth/me/student",
    MY_CHILDREN: "/auth/me/children",
    CHANGE_PASSWORD: "/auth/change-password",
    FORGOT_PASSWORD_VERIFY_ACCOUNT: "/auth/forgot-password/verify-account",
    FORGOT_PASSWORD_VERIFY_OTP: "/auth/forgot-password/verify-otp",
    FORGOT_PASSWORD_RESET: "/auth/forgot-password/reset",
  },
  // System Admin
  SYSTEM_ADMIN: {
    DASHBOARD: "/system-admin/dashboard",
    USERS: "/system-admin/users",
    CREATE_USER: "/system-admin/users",
    UPDATE_USER: (userId) => `/system-admin/users/${userId}`,
    DELETE_USER: (userId) => `/system-admin/users/${userId}`,
    ROLES: "/system-admin/roles",
    CREATE_ROLE: "/system-admin/roles",
    UPDATE_ROLE: (roleId) => `/system-admin/roles/${roleId}`,
    DELETE_ROLE: (roleId) => `/system-admin/roles/${roleId}`,
    UPDATE_USER_ROLES: (userId) => `/system-admin/users/${userId}/roles`,
    PERMISSIONS: "/system-admin/permissions",
    CREATE_PERMISSION: "/system-admin/permissions",
    UPDATE_PERMISSION: (permissionId) =>
      `/system-admin/permissions/${permissionId}`,
    DELETE_PERMISSION: (permissionId) =>
      `/system-admin/permissions/${permissionId}`,
    UPDATE_ROLE_PERMISSIONS: (roleId) =>
      `/system-admin/roles/${roleId}/permissions`,
    SYSTEM_LOGS: "/system-admin/system-logs",
  },
  // School Admin
  SCHOOL_ADMIN: {
    DASHBOARD: "/school-admin/dashboard",
    CONTACTS: "/school-admin/contacts",
    CONTACT_REPLY: (id) => `/school-admin/contacts/${id}/reply`,
    CONTACT_CLEAR_REPLY: (id) => `/school-admin/contacts/${id}/clear-reply`,
    CONTACT_RESEND_EMAIL: (id) => `/school-admin/contacts/${id}/resend-email`,
    QA_QUESTIONS: "/school-admin/qa/questions",
    QA_QUESTION_DETAIL: (id) => `/school-admin/qa/questions/${id}`,
    QA_QUESTION_ANSWERS: (id) => `/school-admin/qa/questions/${id}/answers`,
    QA_QUESTION_ANSWER_DETAIL: (id, answerIndex) =>
      `/school-admin/qa/questions/${id}/answers/${answerIndex}`,
    ATTENDANCE_OVERVIEW: "/school-admin/attendance/overview",
    CLASS_ATTENDANCE_DETAIL: (classId) =>
      `/school-admin/classes/${classId}/attendance`,
    STUDENT_ATTENDANCE_DETAIL: (studentId) =>
      `/school-admin/students/${studentId}/attendance`,
    STUDENT_ATTENDANCE_HISTORY: (studentId) =>
      `/school-admin/students/${studentId}/attendance/history`,
    BLOGS: "/school-admin/blogs",
    BLOG_DETAIL: (blogId) => `/school-admin/blogs/${blogId}`,
    BLOG_CATEGORIES: "/school-admin/blog-categories",
    BLOG_CATEGORY_DETAIL: (id) => `/school-admin/blog-categories/${id}`,
    DOCUMENTS: "/school-admin/documents",
    DOCUMENT_DETAIL: (documentId) => `/school-admin/documents/${documentId}`,
    PUBLIC_INFOS: "/school-admin/public-info",
    PUBLIC_INFO_DETAIL: (id) => `/school-admin/public-info/${id}`,
    ACADEMIC_YEARS: {
      LIST: "/school-admin/academic-years",
      CURRENT: "/school-admin/academic-years/current",
      CREATE: "/school-admin/academic-years",
      FINISH: (id) => `/school-admin/academic-years/${id}/finish`,
      HISTORY: "/school-admin/academic-years/history",
      CLASSES: (yearId) => `/school-admin/academic-years/${yearId}/classes`,
    },
    CURRICULUM: {
      LIST: (yearId) => (yearId ? `/school-admin/curriculum?yearId=${yearId}` : "/school-admin/curriculum"),
      CREATE: "/school-admin/curriculum",
      UPDATE: (id) => `/school-admin/curriculum/${id}`,
      DELETE: (id) => `/school-admin/curriculum/${id}`,
    },
    TIMETABLE: {
      LIST: (yearId) => (yearId ? `/school-admin/timetable?yearId=${yearId}` : "/school-admin/timetable"),
      UPSERT: "/school-admin/timetable",
    },
    TIMETABLE_ACTIVITIES: {
      LIST: (yearId) => (yearId ? `/school-admin/timetable/activities?yearId=${yearId}` : "/school-admin/timetable/activities"),
      CREATE: "/school-admin/timetable/activities",
      UPDATE: (id) => `/school-admin/timetable/activities/${id}`,
    },
    TEACHERS: "/school-admin/teachers",
    TEACHER_AVAILABILITY: "/school-admin/teachers/availability",
    TEACHER_UPDATE: (id) => `/school-admin/teachers/${id}`,
    TEACHER_DELETE: (id) => `/school-admin/teachers/${id}`,
    TEACHER_MIGRATE: "/school-admin/teachers/migrate",
    CLASSROOMS: "/school-admin/classrooms",
    CLASSROOM_UPDATE: (id) => `/school-admin/classrooms/${id}`,
    CLASSROOM_DELETE: (id) => `/school-admin/classrooms/${id}`,
  },
  // Contact (public)
  CONTACT: {
    SUBMIT: "/contact",
  },
  // Q&A (public)
  QA: {
    QUESTIONS: "/qa/questions",
    QUESTION_ANSWERS: (id) => `/qa/questions/${id}/answers`,
  },
  // Teacher
  TEACHER: {
    DASHBOARD: "/teacher/dashboard",
    ATTENDANCES: "/teacher/attendances",
    ATTENDANCE_BY_CLASS: (classId) => `/teacher/attendances/class/${classId}`,
    ATTENDANCE_BY_CLASS_DATE: (classId, date) =>
      `/teacher/attendances/class/${classId}/date/${date}`,
  },
  // Classes
  CLASSES: {
    LIST: "/classes",
    GRADES: "/classes/grades",
    DETAIL: (classId) => `/classes/${classId}`,
    STUDENTS: (classId) => `/classes/${classId}/students`,
    CREATE: "/classes",
    UPDATE: (classId) => `/classes/${classId}`,
    DELETE: (classId) => `/classes/${classId}`,
    ADD_STUDENTS: (classId) => `/classes/${classId}/students`,
    REMOVE_STUDENT: (classId, studentId) => `/classes/${classId}/students/${studentId}`,
  },
  // Grades management (SchoolAdmin)
  GRADES: {
    LIST: "/grades",
    CREATE: "/grades",
    UPDATE: (id) => `/grades/${id}`,
    DELETE: (id) => `/grades/${id}`,
  },
  // Blogs (public)
  BLOGS: {
    PUBLISHED: "/blogs/published",
    CATEGORIES: "/blogs/categories",
    DETAIL: (id) => `/blogs/${id}`,
  },
  // Documents (public)
  DOCUMENTS: {
    PUBLISHED: "/documents/published",
    DETAIL: (id) => `/documents/${id}`,
  },
  // Public Info (public)
  PUBLIC_INFO: {
    LIST: "/public-info",
    DETAIL: (id) => `/public-info/${id}`,
  },
  // Thời khóa biểu công khai (không cần đăng nhập)
  TIMETABLE_PUBLIC: (yearId) => (yearId ? `/timetable?yearId=${yearId}` : "/timetable"),
  // Students
  STUDENTS: {
    LIST: "/students",
    DETAIL: (studentId) => `/students/${studentId}`,
    CREATE: "/students",
    CREATE_WITH_PARENT: "/students/with-parent",
    UPDATE: (studentId) => `/students/${studentId}`,
    DELETE: (studentId) => `/students/${studentId}`,
    ATTENDANCE_CHECKIN: "/students/attendance",
    ATTENDANCE_CHECKOUT: "/students/attendance/checkout",
    ATTENDANCE_LIST: "/students/attendance",
  },
  // Cloudinary
  CLOUDINARY: {
    MEDIA_LIBRARY_SIGNATURE: "/cloudinary/media-library-signature",
    UPLOAD_AVATAR: "/cloudinary/upload-avatar",
    UPLOAD_BLOG_IMAGE: "/cloudinary/upload-blog-image",
    UPLOAD_BLOG_FILE: "/cloudinary/upload-blog-file",
    UPLOAD_KITCHEN_IMAGE: "/cloudinary/upload-kitchen-image",
  },
  // Meal Photos (Kitchen Staff)
  MEAL_PHOTOS: {
    GET: "/meal-photos",
    UPSERT: "/meal-photos",
    UPSERT_MEAL_ENTRY: "/meal-photos/meal-entry",
    UPSERT_SAMPLE_ENTRY: "/meal-photos/sample-entry",
    REVIEW_SAMPLE_ENTRY: "/meal-photos/sample-entry/review",
    ATTENDANCE_SUMMARY: "/meal-photos/attendance-summary",
    REQUEST_EDIT: "/meal-photos/edit-request",
    APPROVE_EDIT_REQUEST: "/meal-photos/edit-request/approve",
  },
  // Notifications (Parent)
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },
  // OTP
  OTP: {
    SEND: "/otp/send",
    VERIFY: "/otp/verify",
    PENDING: (studentId) => `/otp/pending/${studentId}`,
  },
  //Pickup
  PICKUP: {
    CREATE: "/pickup/requests",
    MY_REQUESTS: "/pickup/my-requests",
    REQUESTS: "/pickup/requests",
    UPDATE_STATUS: "/pickup/requests/status",
    APPROVED_BY_STUDENT: (studentId) => `/pickup/requests/student/${studentId}`,
    UPDATE: (id) => `/pickup/requests/${id}`,
    DELETE: (id) => `/pickup/requests/${id}`,
  },
  // Kitchen
  KITCHEN: {
    MENUS: "/menus",
    CREATE_MENU: "/menus",
    MENU_DETAIL: (id) => `/menus/${id}`,
    UPDATE_MENU: (id) => `/menus/${id}`,
    DELETE_MENU: (id) => `/menus/${id}`,
    SUBMIT_MENU: (id) => `/menus/${id}/submit`,
    APPROVE_MENU: (id) => `/menus/${id}/approve`,
    REJECT_MENU: (id) => `/menus/${id}/reject`,
  },
};

export default {
  get,
  post,
  postFormData,
  putFormData,
  put,
  patch,
  delete: del,
  getToken,
  ENDPOINTS,
};
