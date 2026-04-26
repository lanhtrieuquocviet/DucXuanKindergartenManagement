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

import { useAuth } from '../../context/AuthContext';
import { get, post, put, del, ENDPOINTS } from '../../service/api';

// Sub-components
import PersonnelFilter from './PersonnelManagement/PersonnelFilter';
import PersonnelTable from './PersonnelManagement/PersonnelTable';
import AddStaffDialog from './StaffManagement/AddStaffDialog';
import EditStaffDialog from './StaffManagement/EditStaffDialog';
import SuccessAccountDialog from '../../components/SuccessAccountDialog';

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
  roleName: null, 
};

export default function ManagePersonnel() {
  const navigate = useNavigate();
  
  // State cho Success Popup
  const [successData, setSuccessData] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const { user, isInitializing } = useAuth();

  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Job positions from DB
  const [jobPositions, setJobPositions] = useState([]);
  const [positionMap, setPositionMap] = useState({});
  const [positionsLoading, setPositionsLoading] = useState(true);
  const [roleOptions, setRoleOptions] = useState([]);

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

  const fetchJobPositions = async () => {
    try {
      setPositionsLoading(true);
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.JOB_POSITIONS.LIST);
      const data = res.data || [];
      setJobPositions(data.map(p => p.title));
      
      const pMap = {};
      const rOpts = new Map();
      
      data.forEach(p => {
        pMap[p.title] = p.roleName;
        if (p.roleName) {
          // Map label cho role dựa trên title chức vụ tiêu biểu
          if (!rOpts.has(p.roleName)) {
            rOpts.set(p.roleName, { value: p.roleName, label: p.title });
          }
        }
      });
      
      setPositionMap(pMap);
      setRoleOptions(Array.from(rOpts.values()));

      // Set default position for form if it's currently empty
      if (data.length > 0) {
        const teacherPos = data.find(p => p.roleName === 'Teacher') || data[0];
        setFormAdd(prev => ({
          ...prev,
          position: teacherPos.title,
          roleName: teacherPos.roleName
        }));
      }
    } catch (err) {
      console.error('Lỗi khi tải danh mục chức vụ:', err);
    } finally {
      setPositionsLoading(false);
    }
  };

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.STAFF_USERS);
      setPersonnel(res.data || []);
    } catch (err) {
      setError(err.data?.message || err.message || 'Lỗi khi tải danh sách nhân sự');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    fetchJobPositions();
    fetchPersonnel();
  }, [user, isInitializing]); // eslint-disable-line

  const handleAdd = async () => {
    if (formAdd.password !== formAdd.confirmPassword) {
      setAddError('Mật khẩu xác nhận không khớp');
      return;
    }
    try {
      setAddLoading(true);
      setAddError(null);
      const res = await post('/school-admin/users', formAdd);
      
      setFormAdd(EMPTY_FORM);
      setOpenAdd(false);
      fetchPersonnel();

      // Nếu có mật khẩu tự sinh (tài khoản mới) thì hiện Popup
      if (res.data?.generatedPassword) {
        setSuccessData({
          username: res.data.username,
          generatedPassword: res.data.generatedPassword,
          fullName: res.data.fullName,
          phone: res.data.phone || res.data.username,
        });
        setShowSuccessDialog(true);
      } else {
        toast.success('Thêm nhân sự thành công');
      }
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
    const s = debouncedSearch.trim().toLowerCase();
    return personnel.filter((item) => {
      const fullName = (item.fullName || '').toLowerCase();
      const phone = (item.phone || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      const username = (item.username || '').toLowerCase();
      
      const matchSearch = !s || 
        fullName.includes(s) ||
        phone.includes(s) ||
        email.includes(s) ||
        username.includes(s);
      
      const matchRole = !roleFilter || (item.roleNames || '').includes(roleFilter);
      
      return matchSearch && matchRole;
    });
  }, [personnel, debouncedSearch, roleFilter]);

  return (
    <Box>
      <Box sx={{ p: { xs: 1, md: 1 }, maxWidth: 1200, mx: 'auto' }}>
        <PersonnelFilter
          search={search}
          setSearch={setSearch}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          onAdd={() => {
            // Tìm chức vụ mặc định (ưu tiên Giáo viên hoặc cái đầu tiên có Role)
            const defaultPos = jobPositions.find(p => positionMap[p] === 'Teacher') || jobPositions[0] || '';
            const defaultRole = positionMap[defaultPos] || null;
            
            setFormAdd({
              ...EMPTY_FORM,
              position: defaultPos,
              roleName: defaultRole
            });
            setAddError(null);
            setOpenAdd(true);
          }}
          totalCount={filtered.length}
          ROLE_OPTIONS={roleOptions}
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
        POSITION_OPTIONS={jobPositions}
        POSITION_MAP={positionMap}
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
        POSITION_OPTIONS={jobPositions}
        POSITION_MAP={positionMap}
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
      <SuccessAccountDialog 
        open={showSuccessDialog} 
        onClose={() => setShowSuccessDialog(false)} 
        data={successData} 
        roleName="Giáo viên/Nhân viên"
      />
    </Box>
  );
}
