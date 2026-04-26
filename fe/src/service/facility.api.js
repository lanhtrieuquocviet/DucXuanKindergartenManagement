import { get, post, patch, put, del } from './api';

/**
 * Service quản lý Cơ sở vật chất & Tài sản
 */
const facilityService = {
  // --- Asset Types (Danh mục loại tài sản) ---
  getAssetTypes: () => get('/api/school-admin/facilities/asset-types'),
  createAssetType: (data) => post('/api/school-admin/facilities/asset-types', data),
  updateAssetType: (id, data) => put(`/api/school-admin/facilities/asset-types/${id}`, data),
  deleteAssetType: (id) => del(`/api/school-admin/facilities/asset-types/${id}`),

  // --- Warehouses (Kho tổng) ---
  getWarehouses: () => get('/api/school-admin/facilities/warehouses'),

  // --- Locations & Allocation (Vị trí & Phân bổ) ---
  getLocations: () => get('/api/school-admin/facilities/locations'),
  getAssetsByLocation: (locationId) => get(`/api/school-admin/facilities/assets?locationId=${locationId}`),
  allocateAssets: (data) => post('/api/school-admin/facilities/assets/allocate', data),

  // --- Handovers (Bàn giao) ---
  getHandovers: () => get('/api/school-admin/facilities/handovers'),
  createHandover: (data) => post('/api/school-admin/facilities/handovers', data),
  approveHandover: (id) => patch(`/api/school-admin/facilities/handovers/${id}/approve`),

  // --- Inventories (Kiểm kê) ---
  getInventories: () => get('/api/school-admin/facilities/inventories'),
  createInventory: (data) => post('/api/school-admin/facilities/inventories', data),
  approveInventory: (id) => patch(`/api/school-admin/facilities/inventories/${id}/approve`),

  // --- Issues (Sự cố & Hư hỏng) ---
  getIssues: () => get('/api/school-admin/facilities/issues'),
  updateIssueStatus: (id, status) => patch(`/api/school-admin/facilities/issues/${id}/status`, { status }),

  // --- General Data needed for Facilities ---
  getStaffs: () => get('/api/school-admin/personnel'),
};

export default facilityService;
