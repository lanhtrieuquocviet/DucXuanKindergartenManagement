/**
 * API Service - Chỉ định nghĩa endpoints và HTTP methods
 * Logic xử lý được thực hiện trong Context
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Lấy access token từ localStorage
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Lấy refresh token từ localStorage
 */
export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

let authFailureHandler = null;

export const setAuthFailureHandler = (handler) => {
  authFailureHandler = handler;
};

const triggerAuthFailureHandler = (payload) => {
  if (typeof authFailureHandler === 'function') {
    try {
      authFailureHandler(payload);
    } catch (handlerError) {
      // eslint-disable-next-line no-console
      console.error('Auth failure handler error:', handlerError);
    }
  }
};

/**
 * Xử lý response từ API (không retry)
 */
const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || `HTTP error! status: ${response.status}`);
    error.status = response.status;
    error.data = data;

    if (
      response.status === 401 ||
      (response.status === 403 && /khóa/i.test(data.message || ''))
    ) {
      triggerAuthFailureHandler({ status: response.status, message: data.message });
    }

    throw error;
  }

  return data;
};

/**
 * Singleton promise để tránh gọi refresh nhiều lần đồng thời
 */
let refreshPromise = null;

/**
 * Gọi API refresh token, cập nhật localStorage, trả về access token mới
 * Nếu thất bại → trigger force logout
 */
const doRefreshToken = async () => {
  const storedRefreshToken = getRefreshToken();
  if (!storedRefreshToken) {
    triggerAuthFailureHandler({ status: 401, message: 'Phiên đăng nhập đã hết hạn' });
    throw new Error('Không có refresh token');
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: storedRefreshToken }),
  });

  if (!response.ok) {
    triggerAuthFailureHandler({ status: 401, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
    throw new Error('Refresh token thất bại');
  }

  const data = await response.json();
  const { token: newAccessToken, refreshToken: newRefreshToken } = data.data;
  localStorage.setItem('token', newAccessToken);
  localStorage.setItem('refreshToken', newRefreshToken);
  return newAccessToken;
};

/**
 * Wrapper fetch có tự động refresh khi gặp 401
 * @param {string} url
 * @param {RequestInit} fetchOptions
 * @param {boolean} skipRefresh - true khi đây là request đã được retry, tránh vòng lặp
 */
const fetchWithRefresh = async (url, fetchOptions, skipRefresh = false) => {
  let response = await fetch(url, fetchOptions);

  // Nếu 401 và được phép retry → thử refresh token
  if (response.status === 401 && !skipRefresh && fetchOptions.headers?.Authorization) {
    try {
      if (!refreshPromise) {
        refreshPromise = doRefreshToken().finally(() => { refreshPromise = null; });
      }
      const newToken = await refreshPromise;

      // Retry request gốc với token mới
      const retryOptions = {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          Authorization: `Bearer ${newToken}`,
        },
      };
      response = await fetch(url, retryOptions);
    } catch {
      // doRefreshToken đã trigger authFailureHandler, ném lỗi để dừng
      const error = new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      error.status = 401;
      throw error;
    }
  }

  return handleResponse(response);
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
  return fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: getHeaders(includeAuth, customHeaders),
  });
};

/**
 * POST request
 */
export const post = async (endpoint, body, options = {}) => {
  const { includeAuth = true, headers: customHeaders = {} } = options;
  return fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getHeaders(includeAuth, customHeaders),
    body: JSON.stringify(body),
  });
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
  return fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });
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
  return fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers,
    body: formData,
  });
};

/**
 * PUT request
 */
export const put = async (endpoint, body, options = {}) => {
  const { includeAuth = true, headers: customHeaders = {} } = options;
  return fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: getHeaders(includeAuth, customHeaders),
    body: JSON.stringify(body),
  });
};

/**
 * PATCH request
 */
export const patch = async (endpoint, body, options = {}) => {
  const { includeAuth = true, headers: customHeaders = {} } = options;
  return fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: getHeaders(includeAuth, customHeaders),
    body: JSON.stringify(body),
  });
};

/**
 * DELETE request
 */
export const del = async (endpoint, options = {}) => {
  const { includeAuth = true, headers: customHeaders = {} } = options;
  return fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getHeaders(includeAuth, customHeaders),
  });
};

// ============================================
// Endpoints Definition
// ============================================

export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
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
    ATTENDANCE_EXPORT_DATA: "/school-admin/attendance/export-data",
    BLOGS: "/school-admin/blogs",
    BLOG_DETAIL: (blogId) => `/school-admin/blogs/${blogId}`,
    BLOG_CATEGORIES: "/school-admin/blog-categories",
    BLOG_CATEGORY_DETAIL: (id) => `/school-admin/blog-categories/${id}`,
    DOCUMENTS: "/school-admin/documents",
    DOCUMENT_DETAIL: (documentId) => `/school-admin/documents/${documentId}`,
    IMAGE_LIBRARY: "/school-admin/image-library",
    IMAGE_LIBRARY_DETAIL: (id) => `/school-admin/image-library/${id}`,
    VIDEO_LIBRARY: "/school-admin/video-library",
    VIDEO_LIBRARY_DETAIL: (id) => `/school-admin/video-library/${id}`,
    PUBLIC_INFOS: "/school-admin/public-info",
    PUBLIC_INFO_DETAIL: (id) => `/school-admin/public-info/${id}`,
    BANNERS: '/school-admin/banners',
    BANNER_DETAIL: (id) => `/school-admin/banners/${id}`,
    ACADEMIC_YEARS: {
      LIST: "/school-admin/academic-years",
      CURRENT: "/school-admin/academic-years/current",
      PATCH_CURRENT_TIMETABLE_SEASON: "/school-admin/academic-years/current/timetable-season",
      CREATE: "/school-admin/academic-years",
      FINISH: (id) => `/school-admin/academic-years/${id}/finish`,
      HISTORY: "/school-admin/academic-years/history",
      CLASSES: (yearId) => `/school-admin/academic-years/${yearId}/classes`,
      STUDENTS: (yearId) => `/school-admin/academic-years/${yearId}/students`,
    },
    ACADEMIC_PLAN: {
      LIST_TOPICS: (yearId, gradeId) => {
        const q = new URLSearchParams();
        if (yearId) q.set('yearId', yearId);
        if (gradeId) q.set('gradeId', gradeId);
        const query = q.toString();
        return query ? `/school-admin/academic-plan/topics?${query}` : '/school-admin/academic-plan/topics';
      },
      CREATE_TOPIC: '/school-admin/academic-plan/topics',
      UPDATE_TOPIC: (id) => `/school-admin/academic-plan/topics/${id}`,
      DELETE_TOPIC: (id) => `/school-admin/academic-plan/topics/${id}`,
    },
    ACADEMIC_EVENTS: {
      GET: (yearId) => (yearId ? `/school-admin/academic-events?yearId=${yearId}` : '/school-admin/academic-events'),
      UPSERT: '/school-admin/academic-events',
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
      DELETE: (id, yearId) =>
        yearId ? `/school-admin/timetable/${id}?yearId=${yearId}` : `/school-admin/timetable/${id}`,
    },
    TIMETABLE_ACTIVITIES: {
      LIST: (yearId) => (yearId ? `/school-admin/timetable/activities?yearId=${yearId}` : "/school-admin/timetable/activities"),
      CREATE: "/school-admin/timetable/activities",
      UPDATE: (id) => `/school-admin/timetable/activities/${id}`,
    },
    STAFF: "/school-admin/staff",
    STAFF_USERS: "/school-admin/staff-users",
    STAFF_MEMBERS: "/school-admin/staff-members",
    STAFF_MEMBER: (id) => `/school-admin/staff-members/${id}`,
    TEACHERS: "/school-admin/teachers",
    TEACHER_AVAILABILITY: "/school-admin/teachers/availability",
    TEACHER_CHECK_USERNAME: "/school-admin/teachers/check-username",
    TEACHER_GENERATE_USERNAME: "/school-admin/teachers/generate-username",
    TEACHER_UPDATE: (id) => `/school-admin/teachers/${id}`,
    TEACHER_DELETE: (id) => `/school-admin/teachers/${id}`,
    TEACHER_MIGRATE: "/school-admin/teachers/migrate",
    CLASSROOMS: "/school-admin/classrooms",
    CLASSROOM_UPDATE: (id) => `/school-admin/classrooms/${id}`,
    CLASSROOM_DELETE: (id) => `/school-admin/classrooms/${id}`,
    // Asset Inspection
    ASSET_COMMITTEES: "/school-admin/asset-committees",
    ASSET_COMMITTEE_DETAIL: (id) => `/school-admin/asset-committees/${id}`,
    ASSET_COMMITTEE_END: (id) => `/school-admin/asset-committees/${id}/end`,
    ASSET_MINUTES: "/school-admin/asset-minutes",
    ASSET_MINUTES_DETAIL: (id) => `/school-admin/asset-minutes/${id}`,
    ASSET_MINUTES_EXPORT_WORD: (id) => `/school-admin/asset-minutes/${id}/export-word`,
    ASSET_MINUTES_APPROVE: (id) => `/school-admin/asset-minutes/${id}/approve`,
    ASSET_MINUTES_REJECT: (id) => `/school-admin/asset-minutes/${id}/reject`,
    // Asset CRUD
    ASSETS: "/school-admin/assets",
    ASSETS_BULK: "/school-admin/assets/bulk",
    // Asset Allocations (Biên bản bàn giao tài sản)
    ASSET_ALLOCATIONS: "/school-admin/asset-allocations",
    ASSET_ALLOCATIONS_CLASSES: "/school-admin/asset-allocations/classes",
    ASSET_ALLOCATIONS_TEMPLATE: "/school-admin/asset-allocations/template",
    ASSET_ALLOCATIONS_PARSE_WORD: "/school-admin/asset-allocations/parse-word",
    ASSET_ALLOCATIONS_PARSE_EXCEL: "/school-admin/asset-allocations/parse-excel",
    ASSET_ALLOCATION_DETAIL: (id) => `/school-admin/asset-allocations/${id}`,
    ASSET_ALLOCATION_EXPORT_WORD: (id) => `/school-admin/asset-allocations/${id}/export-word`,
    ASSET_ALLOCATION_TRANSFER: (id) => `/school-admin/asset-allocations/${id}/transfer`,
    PURCHASE_REQUESTS: "/school-admin/purchase-requests",
    PURCHASE_REQUEST_APPROVE: (id) => `/school-admin/purchase-requests/${id}/approve`,
    PURCHASE_REQUEST_REJECT: (id) => `/school-admin/purchase-requests/${id}/reject`,
    ASSET_DETAIL: (id) => `/school-admin/assets/${id}`,
  },
  // Contact (public)
  CONTACT: {
    SUBMIT: "/contact",
  },
  BANNERS: {
    HOMEPAGE: '/banners/homepage',
  },
  // Q&A (public)
  QA: {
    QUESTIONS: "/qa/questions",
    QUESTION_ANSWERS: (id) => `/qa/questions/${id}/answers`,
  },
  // Teacher
  TEACHER: {
    DASHBOARD: "/teacher/dashboard",
    ASSET_COMMITTEES: "/teacher/asset-committees",
    ASSET_COMMITTEE_IS_MEMBER: "/teacher/asset-committees/is-member",
    ASSET_MINUTES: "/teacher/asset-minutes",
    ASSET_MINUTES_DETAIL: (id) => `/teacher/asset-minutes/${id}`,
    ASSET_MINUTES_EXPORT_WORD: (id) => `/teacher/asset-minutes/${id}/export-word`,
    ASSET_ALLOCATIONS_ACTIVE: "/teacher/asset-allocations/active",
    ATTENDANCES: "/teacher/attendances",
    ATTENDANCE_BY_CLASS: (classId) => `/teacher/attendances/class/${classId}`,
    ATTENDANCE_BY_CLASS_DATE: (classId, date) =>
      `/teacher/attendances/class/${classId}/date/${date}`,
    MY_CLASSES: "/teacher/my-classes",
    PURCHASE_REQUESTS: "/teacher/purchase-requests",
    PURCHASE_REQUEST_DETAIL: (id) => `/teacher/purchase-requests/${id}`,
    MY_ASSET_ALLOCATION: "/teacher/asset-allocations",
    ASSET_ALLOCATION_CONFIRM: (id) => `/teacher/asset-allocations/${id}/confirm`,
    // Danh sách học sinh
    MY_STUDENTS: '/teacher/students',
    CHANGE_REQUESTS: (studentId) => `/teacher/students/${studentId}/change-requests`,
    // Sổ liên lạc
    CONTACT_BOOK_CLASSES: '/teacher/contact-book',
    CONTACT_BOOK_STUDENTS: (classId) => `/teacher/contact-book/${classId}/students`,
    CONTACT_BOOK_ATTENDANCE: (classId, studentId) => `/teacher/contact-book/${classId}/students/${studentId}/attendance`,
    CONTACT_BOOK_HEALTH: (classId, studentId) => `/teacher/contact-book/${classId}/students/${studentId}/health`,
    CONTACT_BOOK_NOTES: (classId, studentId) => `/teacher/contact-book/${classId}/students/${studentId}/notes`,
    CONTACT_BOOK_NOTE_DELETE: (classId, studentId, noteId) => `/teacher/contact-book/${classId}/students/${studentId}/notes/${noteId}`,
    CONTACT_BOOK_TODAY_MENU: '/teacher/contact-book/today-menu',
    UPLOAD_NOTE_IMAGE: '/cloudinary/upload-note-image',
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
    ORGANIZATION_STRUCTURE: "/public-info/organization-structure",
  },
  IMAGE_LIBRARY: {
    LIST: "/image-library",
  },
  VIDEO_LIBRARY: {
    LIST: "/video-library",
  },
  // Thời khóa biểu công khai (không cần đăng nhập)
  TIMETABLE_PUBLIC: (yearId) => (yearId ? `/timetable?yearId=${yearId}` : "/timetable"),
  // Students
  STUDENTS: {
    LIST: "/students",
    DETAIL: (studentId) => `/students/${studentId}`,
    CREATE: "/students",
    CREATE_WITH_PARENT: "/students/with-parent",
    CHECK_USERNAME: "/students/check-username",
    GENERATE_USERNAME: "/students/generate-username",
    HEALTH_OVERVIEW: "/school-admin/students/health-overview",
    HEALTH_IMPORT: "/school-admin/students/health-import",
    HEALTH_CLASSES: "/school-admin/students/health-classes",
    HEALTH_RECORD_CREATE: "/school-admin/students/health-record",
    HEALTH_RECORD_UPDATE: (id) => `/school-admin/students/health-record/${id}`,
    HEALTH_RECORD_DELETE: (id) => `/school-admin/students/health-record/${id}`,
    CHANGE_REQUESTS: "/school-admin/students/change-requests",
    CHANGE_REQUESTS_PENDING_MAP: "/school-admin/students/change-requests/pending-map",
    CHANGE_REQUEST_RESOLVE: (id) => `/school-admin/students/change-requests/${id}/resolve`,
    // School admin student contact book endpoints
    ADMIN_HEALTH_LATEST: (studentId) => `/school-admin/students/${studentId}/health-latest`,
    ADMIN_ATTENDANCE_MONTHLY: (studentId) => `/school-admin/students/${studentId}/attendance-monthly`,
    ADMIN_NOTES: (studentId) => `/school-admin/students/${studentId}/notes`,
    ADMIN_NOTE_DELETE: (studentId, noteId) => `/school-admin/students/${studentId}/notes/${noteId}`,
    ADMIN_TODAY_MENU: '/school-admin/students/contact-book/today-menu',
    // Sổ liên lạc phụ huynh/học sinh
    CONTACT_BOOK_MY:         '/students/contact-book/my',
    CONTACT_BOOK_HEALTH:     '/students/contact-book/health',
    CONTACT_BOOK_ATTENDANCE: '/students/contact-book/attendance',
    CONTACT_BOOK_NOTES:      '/students/contact-book/notes',
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
    UPLOAD_PURCHASE_IMAGE: "/cloudinary/upload-purchase-image",
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
    PUBLIC_MENUS: "/menus/public",
    PUBLIC_MENU_DETAIL: (id) => `/menus/public/${id}`,
    MENUS: "/menus",
    NUTRITION_PLAN: "/menus/nutrition-plan",
    CREATE_MENU: "/menus",
    MENU_DETAIL: (id) => `/menus/${id}`,
    UPDATE_MENU: (id) => `/menus/${id}`,
    DELETE_MENU: (id) => `/menus/${id}`,
    SUBMIT_MENU: (id) => `/menus/${id}/submit`,
    APPROVE_MENU: (id) => `/menus/${id}/approve`,
    REJECT_MENU: (id) => `/menus/${id}/reject`,
    DISTRICT_NUTRITION_PLANS: "/menus/district-nutrition-plans",
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
