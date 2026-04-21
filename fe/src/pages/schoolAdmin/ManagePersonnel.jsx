import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Alert,
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { toast } from 'react-toastify';

import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { get, post, put, del, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';

// Sub-components
import PersonnelFilter from './PersonnelManagement/PersonnelFilter';
import PersonnelTable from './PersonnelManagement/PersonnelTable';
import AddStaffDialog from './StaffManagement/AddStaffDialog'; // We can reuse and adapt
import EditStaffDialog from './StaffManagement/EditStaffDialog';

const ROLE_OPTIONS = [
  { value: 'SchoolAdmin', label: 'Quản trị viên' },
  { value: 'Teacher', label: 'Giáo viên' },
  { value: 'KitchenStaff', label: 'Nhân viên bếp' },
  { value: 'MedicalStaff', label: 'Nhân viên y tế' },
  { value: 'HeadTeacher', label: 'Tổ trưởng' },
];

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
  roleName: 'Teacher', // Default role for new users
};

export default function ManagePersonnel() {
  const navigate = useNavigate();
  const { user, hasRole, isInitializing } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    fetchPersonnel();
  }, [user, isInitializing]); // eslint-disable-line

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      // We can pass filters to the backend if the list is huge, 
      // but for now, the aggregation returns all staff for the school.
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.STAFF_USERS);
      setPersonnel(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.data?.message || err.message || 'Lỗi khi tải danh sách nhân sự');
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
      await post('/school-admin/users', formAdd);
      setOpenAdd(false);
      toast.success('Thêm nhân sự thành công');
      fetchPersonnel();
    } catch (err) {
      setAddError(err.data?.message || err.message || 'Lỗi khi thêm nhân sự');
    } finally {
      setAddLoading(false);
    }
  };

  const handleOpenEdit = (item) => {
    setFormEdit({
      ...EMPTY_FORM,
      userId: item._id,
      fullName: item.fullName || '',
      email: item.email || '',
      phone: item.phone || '',
      username: item.username || '',
      status: item.status || 'active',
      roleName: (item.roleNames || '').split(',')[0].trim() || 'Teacher',
      position: item.position || '',
    });
    setEditError(null);
    setOpenEdit(true);
  };

  const handleEdit = async () => {
    try {
      setEditLoading(true);
      setEditError(null);
      await put(`/school-admin/staff-members/${formEdit.userId}`, formEdit);
      setOpenEdit(false);
      toast.success('Cập nhật thành công');
      fetchPersonnel();
    } catch (err) {
      setEditError(err.data?.message || err.message || 'Lỗi khi cập nhật');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await del(`/school-admin/staff-members/${deleteTarget._id}`);
      setDeleteTarget(null);
      toast.success('Đã xóa nhân sự');
      fetchPersonnel();
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = debouncedSearch.toLowerCase();
    return personnel.filter((item) => {
      const matchSearch =
        (item.fullName || '').toLowerCase().includes(s) ||
        (item.phone || '').includes(s) ||
        (item.email || '').toLowerCase().includes(s) ||
        (item.username || '').toLowerCase().includes(s);
      
      const matchRole = !roleFilter || (item.roleNames || '').includes(roleFilter);
      
      return matchSearch && matchRole;
    });
  }, [personnel, debouncedSearch, roleFilter]);

  return (
    <RoleLayout
      menuItems={menuItems}
      activeKey="personnel"
      onMenuSelect={handleMenuSelect}
      onLogout={() => {}}
      onViewProfile={() => navigate('/profile')}
      userName={user?.fullName || user?.username || 'Admin'}
      userRole="SchoolAdmin"
      pageTitle="Quản lý nhân sự"
    >
      <Box sx={{ p: { xs: 1, md: 1 }, maxWidth: 1200, mx: 'auto' }}>
        <PersonnelFilter
          search={search}
          setSearch={setSearch}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          onAdd={() => {
            setFormAdd(EMPTY_FORM);
            setAddError(null);
            setOpenAdd(true);
          }}
          totalCount={filtered.length}
          ROLE_OPTIONS={ROLE_OPTIONS}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 3, 
            overflow: 'hidden', 
            border: '1px solid', 
            borderColor: 'divider',
            bgcolor: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          {loading ? (
            <Box sx={{ py: 12, textAlign: 'center' }}>
              <CircularProgress size={40} thickness={4} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontWeight: 500 }}>
                Đang tổng hợp dữ liệu nhân sự...
              </Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ py: 12, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {search || roleFilter ? 'Không tìm thấy nhân sự phù hợp' : 'Chưa có dữ liệu nhân sự'}
              </Typography>
            </Box>
          ) : (
            <PersonnelTable 
              data={filtered} 
              onEdit={handleOpenEdit} 
              onDelete={setDeleteTarget} 
            />
          )}
        </Paper>
      </Box>

      {/* Reusing and adapting the dialogs */}
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
        <DialogTitle sx={{ fontWeight: 800 }}>Xác nhận xóa nhân sự</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc muốn xóa <strong>{deleteTarget?.fullName}</strong>? 
            Mọi dữ liệu liên quan đến tài khoản này sẽ bị vô hiệu hóa.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
            Hủy bỏ
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDelete} 
            disabled={deleteLoading}
            sx={{ borderRadius: 2 }}
          >
            {deleteLoading ? <CircularProgress size={18} color="inherit" /> : 'Xác nhận xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}
