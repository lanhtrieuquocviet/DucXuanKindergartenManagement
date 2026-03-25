import api from "./api";

// Get all health check records
export const getHealthCheckRecords = (params) => {
  return api.get("/health/records", { params });
};

// Get health statistics
export const getHealthStatistics = (params) => {
  return api.get("/health/statistics", { params });
};

// Get specific health check record
export const getHealthCheckById = (id) => {
  return api.get(`/health/record/${id}`);
};

// Get all health records for a student
export const getStudentHealthHistory = (studentId) => {
  return api.get(`/health/student/${studentId}`);
};

// Create new health check record
export const createHealthCheck = (data) => {
  return api.post("/health/record", data);
};

// Update health check record
export const updateHealthCheck = (id, data) => {
  return api.put(`/health/record/${id}`, data);
};

// Delete health check record
export const deleteHealthCheck = (id) => {
  return api.delete(`/health/record/${id}`);
};

// Export health records for reporting
export const exportHealthRecords = (params) => {
  return api.get("/health/export/records", { params });
};
