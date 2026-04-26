import { get, post, patch, put, del } from './api';

/**
 * Service quản lý Cơ sở vật chất & Tài sản
 */
const facilityService = {
  // --- Asset Types (Danh mục loại tài sản) ---
  getAssetTypes: () => get('/school-admin/facilities/asset-types'),
  createAssetType: (data) => post('/school-admin/facilities/asset-types', data),
  updateAssetType: (id, data) => put(`/school-admin/facilities/asset-types/${id}`, data),
  deleteAssetType: (id) => del(`/school-admin/facilities/asset-types/${id}`),

  // --- Warehouses (Kho tổng) ---
  getWarehouses: () => get('/school-admin/facilities/warehouses'),

  // --- Locations & Allocation (Vị trí & Phân bổ) ---
  getLocations: () => get('/school-admin/facilities/locations'),
  createLocation: (data) => post('/school-admin/facilities/locations', data),
  updateLocation: (id, data) => put(`/school-admin/facilities/locations/${id}`, data),
  deleteLocation: (id) => del(`/school-admin/facilities/locations/${id}`),
  
  getAssetsByLocation: (locationId) => get(`/school-admin/facilities/assets?locationId=${locationId}`),
  allocateAssets: (data) => post('/school-admin/facilities/assets/allocate', data),

  // --- Handovers (Bàn giao) ---
  getHandovers: () => get('/school-admin/facilities/handovers'),
  createHandover: (data) => post('/school-admin/facilities/handovers', data),
  approveHandover: (id) => patch(`/school-admin/facilities/handovers/${id}/approve`),

  // --- Inventories (Kiểm kê) ---
  getInventories: () => get('/school-admin/facilities/inventories'),
  createInventory: (data) => post('/school-admin/facilities/inventories', data),
  approveInventory: (id) => patch(`/school-admin/facilities/inventories/${id}/approve`),

  // --- Issues (Sự cố & Hư hỏng) ---
  getIssues: () => get('/school-admin/facilities/issues'),
  updateIssueStatus: (id, status) => patch(`/school-admin/facilities/issues/${id}/status`, { status }),

  // --- General Data needed for Facilities ---
  getStaffs: () => get('/school-admin/staff'),
};

export default facilityService;
