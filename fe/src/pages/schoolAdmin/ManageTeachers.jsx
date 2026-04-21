import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { get, post, put, del, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';

// Sub-components
import TeacherFilter from './TeacherManagement/TeacherFilter';
import TeacherTable from './TeacherManagement/TeacherTable';
import AddTeacherDialog from './TeacherManagement/AddTeacherDialog';
import EditTeacherDialog from './TeacherManagement/EditTeacherDialog';

const EMPLOYMENT_OPTIONS = [
  { value: 'contract', label: 'Giáo viên hợp đồng' },
  { value: 'permanent', label: 'Giáo viên biên chế' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
];

const EMPTY_CREATE = {
  username: '',
  password: '',
  fullName: '',
  email: '',
  phone: '',
  degree: '',
  hireDate: '',
  employmentType: 'contract',
  gender: 'male',
};

const EMPTY_EDIT = {
  fullName: '',
  email: '',
  phone: '',
  degree: '',
  hireDate: '',
  employmentType: 'contract',
  status: 'active',
  gender: 'male',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ManageTeachers({ isEmbedded = false }) {
  const navigate = useNavigate();
  const { user, hasRole, isInitializing } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [createErrors, setCreateErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [usernameGenerating, setUsernameGenerating] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    if (isEmbedded) {
      fetchTeachers();
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
    fetchTeachers();
  }, [user, isInitializing, isEmbedded]); // eslint-disable-line

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.TEACHERS);
      setTeachers(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.data?.message || err.message || 'Lỗi khi tải danh sách giáo viên');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateUsername = async () => {
    try {
      setUsernameGenerating(true);
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.GENERATE_USERNAME + '?role=Teacher');
      if (res.status === 'success') {
        setCreateForm((p) => ({ ...p, username: res.data.username, password: res.data.username }));
      }
    } catch {
      /* ignore */
    } finally {
      setUsernameGenerating(false);
    }
  };

  const handleMigrate = async () => {
    try {
      setLoading(true);
      await post(ENDPOINTS.SCHOOL_ADMIN.MIGRATE_TEACHERS);
      fetchTeachers();
    } catch (err) {
      setError(err.data?.message || err.message || 'Lỗi khi đồng bộ giáo viên');
      setLoading(false);
    }
  };

  const validateCreate = () => {
    const e = {};
    if (!createForm.username) e.username = 'Thiếu tài khoản';
    if (!createForm.password) e.password = 'Thiếu mật khẩu';
    if (!createForm.fullName?.trim()) e.fullName = 'Nhập họ tên';
    if (!createForm.email?.trim() || !EMAIL_RE.test(createForm.email)) e.email = 'Email không hợp lệ';
    if (!createForm.phone?.trim()) e.phone = 'Nhập SĐT';
    setCreateErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validateCreate()) return;
    try {
      setCreateLoading(true);
      setCreateError(null);
      await post(ENDPOINTS.SCHOOL_ADMIN.TEACHERS, createForm);
      setCreateOpen(false);
      fetchTeachers();
    } catch (err) {
      setCreateError(err.data?.message || err.message || 'Lỗi khi tạo giáo viên');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (t) => {
    setEditTarget(t);
    setEditForm({
      fullName: t.fullName || '',
      email: t.email || '',
      phone: t.phone || '',
      degree: t.degree || '',
      hireDate: t.hireDate ? new Date(t.hireDate).toISOString().split('T')[0] : '',
      employmentType: t.employmentType || 'contract',
      status: t.status || 'active',
      gender: t.gender || 'male',
    });
    setEditErrors({});
    setEditError(null);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    const e = {};
    if (!editForm.fullName?.trim()) e.fullName = 'Nhập họ tên';
    if (!editForm.email?.trim() || !EMAIL_RE.test(editForm.email)) e.email = 'Email không hợp lệ';
    if (!editForm.phone?.trim()) e.phone = 'Nhập SĐT';
    if (Object.keys(e).length > 0) {
      setEditErrors(e);
      return;
    }

    try {
      setEditLoading(true);
      setEditError(null);
      await put(ENDPOINTS.SCHOOL_ADMIN.TEACHER_UPDATE(editTarget._id), editForm);
      setEditOpen(false);
      fetchTeachers();
    } catch (err) {
      setEditError(err.data?.message || err.message || 'Lỗi khi cập nhật giáo viên');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await del(ENDPOINTS.SCHOOL_ADMIN.TEACHER_DELETE(deleteTarget._id));
      setDeleteTarget(null);
      fetchTeachers();
    } catch (err) {
      setDeleteError(err.data?.message || err.message || 'Lỗi khi xóa giáo viên');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = teachers.filter((t) => {
    const s = search.toLowerCase();
    return (
      (t.fullName || '').toLowerCase().includes(s) ||
      (t.email || '').toLowerCase().includes(s) ||
      (t.phone || '').includes(s)
    );
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  const content = (
    <Box sx={{ p: isEmbedded ? 0 : { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
        <TeacherFilter
          search={search}
          setSearch={setSearch}
          onMigrate={handleMigrate}
          onAddTeacher={() => {
            setCreateForm(EMPTY_CREATE);
            setCreateErrors({});
            setCreateError(null);
            setCreateOpen(true);
            handleGenerateUsername();
          }}
          totalCount={filtered.length}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {search ? 'Không tìm thấy giáo viên phù hợp' : 'Chưa có giáo viên nào'}
              </Typography>
            </Box>
          ) : (
            <TeacherTable
              teachers={paginated}
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              onEdit={handleOpenEdit}
              onDelete={setDeleteTarget}
            />
          )}
        </Paper>
    </Box>
  );

  const dialogs = (
    <>
      <AddTeacherDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        form={createForm}
        setForm={setCreateForm}
        errors={createErrors}
        loading={createLoading}
        error={createError}
        setError={setCreateError}
        onGenerateUsername={handleGenerateUsername}
        usernameGenerating={usernameGenerating}
        onSubmit={handleCreate}
        EMPLOYMENT_OPTIONS={EMPLOYMENT_OPTIONS}
        GENDER_OPTIONS={GENDER_OPTIONS}
      />

      <EditTeacherDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        form={editForm}
        setForm={setEditForm}
        errors={editErrors}
        loading={editLoading}
        error={editError}
        setError={setEditError}
        onSubmit={handleEdit}
        EMPLOYMENT_OPTIONS={EMPLOYMENT_OPTIONS}
        GENDER_OPTIONS={GENDER_OPTIONS}
      />

      <Dialog open={!!deleteTarget} onClose={() => !deleteLoading && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Xóa giáo viên</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setDeleteError(null)}>
              {deleteError}
            </Alert>
          )}
          <Typography variant="body2">
            Bạn có chắc muốn xóa giáo viên <strong>{deleteTarget?.fullName}</strong>? Tài khoản sẽ bị vô hiệu hóa, không
            thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit" disabled={deleteLoading}>
            Hủy
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading ? <CircularProgress size={18} color="inherit" /> : 'Xóa'}
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
      activeKey="teachers"
      onMenuSelect={handleMenuSelect}
      onLogout={() => {}}
      onViewProfile={() => navigate('/profile')}
      userName={user?.fullName || user?.username || 'Admin'}
      userRole="SchoolAdmin"
      pageTitle="Giáo viên"
    >
      {content}
      {dialogs}
    </RoleLayout>
  );
}
