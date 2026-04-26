import {
  AddCircle as AddIcon,
  AdminPanelSettings as AdminIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

/**
 * Chuyển đổi tên role từ database sang tiếng Việt
 */
export const getRoleDisplayName = (roleName) => {
  const mapping = {
    'SystemAdmin': 'Quản trị hệ thống',
    'SchoolAdmin': 'Ban Giám Hiệu',
    'Teacher': 'Giáo viên',
    'HeadTeacher': 'Tổ trưởng chuyên môn',
    'Parent': 'Phụ huynh',
    'HeadParent': 'Trưởng ban phụ huynh',
    'KitchenStaff': 'Nhân viên nhà bếp',
    'MedicalStaff': 'Nhân viên y tế',
    'InventoryStaff': 'Nhân viên kho'
  };
  return mapping[roleName] || roleName;
};

export const COMMON_ACTIONS = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE', 'EXPORT', 'APPROVE', 'REJECT', 'ASSIGN'];

export const ACTION_COLORS = {
  VIEW: { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669', icon: <VisibilityIcon sx={{ fontSize: 14 }} /> },
  CREATE: { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', icon: <AddIcon sx={{ fontSize: 14 }} /> },
  UPDATE: { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706', icon: <EditIcon sx={{ fontSize: 14 }} /> },
  DELETE: { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', icon: <DeleteIcon sx={{ fontSize: 14 }} /> },
  MANAGE: { bg: 'rgba(139, 92, 246, 0.1)', text: '#7c3aed', icon: <AdminIcon sx={{ fontSize: 14 }} /> },
  DEFAULT: { bg: 'rgba(107, 114, 128, 0.1)', text: '#4b5563', icon: <InfoIcon sx={{ fontSize: 14 }} /> },
};

export const getActionStyle = (code) => {
  const action = code.split('_')[0];
  return ACTION_COLORS[action] || ACTION_COLORS.DEFAULT;
};

// Nhóm quyền liên quan mặc định theo tên role
export const ROLE_RELEVANT_GROUPS = {
  Teacher: ['Điểm danh', 'Báo cáo', 'Tài sản & Mua sắm', 'Học sinh'],
  HeadTeacher: ['Điểm danh', 'Báo cáo', 'Tài sản & Mua sắm', 'Lớp học', 'Học sinh'],
  KitchenStaff: ['Bếp & Thực phẩm', 'Báo cáo', 'Thực đơn'],
  InventoryStaff: ['Tài sản & Mua sắm', 'Kho hàng'],
  MedicalStaff: ['Y tế', 'Học sinh'],
  HeadParent: ['Bếp & Thực phẩm', 'Báo cáo'],
  SchoolAdmin: null,
};

export function groupByField(permissions) {
  const groups = {};
  permissions.forEach((perm) => {
    const key = perm.group || 'Chưa phân nhóm';
    if (!groups[key]) groups[key] = [];
    groups[key].push(perm);
  });
  return groups;
}
