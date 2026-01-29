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
    LOGIN: '/auth/login',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  // System Admin
  SYSTEM_ADMIN: {
    DASHBOARD: '/system-admin/dashboard',
    USERS: '/system-admin/users',
    ROLES: '/system-admin/roles',
    UPDATE_USER_ROLES: (userId) => `/system-admin/users/${userId}/roles`,
  },
  // School Admin
  SCHOOL_ADMIN: {
    DASHBOARD: '/school-admin/dashboard',
  },
  // Teacher
  TEACHER: {
    DASHBOARD: '/teacher/dashboard',
  },
};

export default {
  get,
  post,
  put,
  delete: del,
  getToken,
  ENDPOINTS,
};
