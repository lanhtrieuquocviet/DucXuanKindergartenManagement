import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { toast } from 'react-toastify';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { get, post, put, del, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';

// Sub-components
import StaffFilter from './StaffManagement/StaffFilter';
import StaffTable from './StaffManagement/StaffTable';
import AddStaffDialog from './StaffManagement/AddStaffDialog';
import EditStaffDialog from './StaffManagement/EditStaffDialog';

const ROLE_TO_POSITION = {
  schooladmin: 'Ban Giám Hiệu',
  teacher: 'Giáo viên',
  kitchenstaff: 'Nhân viên nhà bếp',
  medicalstaff: 'Nhân viên y tế',
  headteacher: 'Tổ trưởng chuyên môn',
};

const ALLOWED_STAFF_ROLES = new Set([
  'schooladmin',
  'teacher',
  'kitchenstaff',
  'medicalstaff',
  'headteacher',
]);

const POSITION_OPTIONS = [
  'Ban Giám Hiệu',
  'Giáo viên',
  'Nhân viên văn phòng',
  'Nhân viên y tế',
  'Nhân viên nhà bếp',
  'Tổ trưởng chuyên môn',
];

const EMPTY_FORM = {
  username: '',
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  position: '',
  customPosition: '',
  phone: '',
  status: 'active',
  userId: null,
};

const splitRoleNames = (roleNames) =>
  String(roleNames || '')
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);

const normalizeRoleName = (roleName) =>
  String(roleName || '')
    .toLowerCase()
    .replace(/[\s_-]/g, '');

const getPositionFromRoleNames = (roleNames) => {
  const roles = splitRoleNames(roleNames);
  for (const role of roles) {
    const normalizedRole = normalizeRoleName(role);
    if (ALLOWED_STAFF_ROLES.has(normalizedRole) && ROLE_TO_POSITION[normalizedRole]) {
      return ROLE_TO_POSITION[normalizedRole];
    }
  }
  return null;
};

export default function ManageStaff({ isEmbedded = false }) {
  const navigate = useNavigate();
  const { user, hasRole, isInitializing } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [openAdd, setOpenAdd] = useState(false);
  const [formAdd, setFormAdd] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [formEdit, setFormEdit] = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (isEmbedded) {
      fetchStaff();
      return;
    }
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!hasRole('SchoolAdmin') && !hasRole('SystemAdmin')) {
      navigate('/', { replace: true });
      return;
    }
    fetchStaff();
  }, [user, isInitializing, isEmbedded]); // eslint-disable-line

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.STAFF);
      const items = (res.data || []).map((s) => ({
        ...s,
        position: s.position || getPositionFromRoleNames(s.roleNames) || 'Nhân viên',
      }));
      setStaff(items);
      setError(null);
    } catch (err) {
      setError(err.data?.message || err.message || 'Lỗi khi tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (formAdd.password !== formAdd.confirmPassword) {
      setAddError('Mật khẩu xác nhận không khớp');
      return;
    }
    try {
      setAddLoading(true);
      setAddError(null);
      const payload = { ...formAdd };
      if (payload.position === 'Other') payload.position = payload.customPosition;
      await post(ENDPOINTS.SCHOOL_ADMIN.STAFF, payload);
      setOpenAdd(false);
      toast.success('Thêm nhân viên thành công');
      fetchStaff();
    } catch (err) {
      setAddError(err.data?.message || err.message || 'Lỗi khi thêm nhân viên');
    } finally {
      setAddLoading(false);
    }
  };

  const handleOpenEdit = (item) => {
    const isOther = item.position && !POSITION_OPTIONS.includes(item.position);
    setFormEdit({
      ...EMPTY_FORM,
      userId: item._id,
      fullName: item.fullName || '',
      email: item.email || '',
      phone: item.phone || '',
      position: isOther ? 'Other' : (item.position || ''),
      customPosition: isOther ? item.position : '',
      status: item.status || 'active',
    });
    setEditError(null);
    setOpenEdit(true);
  };

  const handleEdit = async () => {
    try {
      setEditLoading(true);
      setEditError(null);
      const payload = { ...formEdit };
      if (payload.position === 'Other') payload.position = payload.customPosition;
      await put(ENDPOINTS.SCHOOL_ADMIN.STAFF_UPDATE(formEdit.userId), payload);
      setOpenEdit(false);
      toast.success('Cập nhật thành công');
      fetchStaff();
    } catch (err) {
      setEditError(err.data?.message || err.message || 'Lỗi khi cập nhật');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await del(ENDPOINTS.SCHOOL_ADMIN.STAFF_DELETE(deleteTarget._id));
      setDeleteTarget(null);
      toast.success('Đã xóa nhân viên');
      fetchStaff();
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return staff.filter(
      (item) =>
        (item.fullName || '').toLowerCase().includes(s) ||
        (item.phone || '').includes(s) ||
        (item.email || '').toLowerCase().includes(s)
    );
  }, [staff, search]);

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  const content = (
    <Box sx={{ p: isEmbedded ? 0 : { xs: 1, md: 2 }, maxWidth: 1200, mx: 'auto' }}>
        <StaffFilter
          search={search}
          setSearch={setSearch}
          onAddStaff={() => {
            setFormAdd(EMPTY_FORM);
            setAddError(null);
            setOpenAdd(true);
          }}
          totalCount={filtered.length}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          {loading ? (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Đang tải danh sách...
              </Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {search ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có nhân viên nào trong danh sách'}
              </Typography>
            </Box>
          ) : (
            <StaffTable staff={filtered} onEdit={handleOpenEdit} onDelete={setDeleteTarget} />
          )}
        </Paper>
      </Box>
  );

  const dialogs = (
    <>
      <AddStaffDialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        form={formAdd}
        setForm={setFormAdd}
        loading={addLoading}
        error={addError}
        setError={setAddError}
        onSubmit={handleAdd}
        POSITION_OPTIONS={POSITION_OPTIONS}
      />

      <EditStaffDialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        form={formEdit}
        setForm={setFormEdit}
        loading={editLoading}
        error={editError}
        setError={setEditError}
        onSubmit={handleEdit}
        POSITION_OPTIONS={POSITION_OPTIONS}
      />

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onClose={() => !deleteLoading && setDeleteTarget(null)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc muốn xóa nhân viên <strong>{deleteTarget?.fullName}</strong>? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
            Hủy
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading ? <CircularProgress size={18} color="inherit" /> : 'Xác nhận xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  if (isEmbedded) {
    return (
      <>
        {content}
        {dialogs}
      </>
    );
  }

  return (
    <RoleLayout
      menuItems={menuItems}
      activeKey="staff"
      onMenuSelect={handleMenuSelect}
      onLogout={() => {}}
      onViewProfile={() => navigate('/profile')}
      userName={user?.fullName || user?.username || 'Admin'}
      userRole="SchoolAdmin"
      pageTitle="Nhân viên"
    >
      {content}
      {dialogs}
    </RoleLayout>
  );
}
