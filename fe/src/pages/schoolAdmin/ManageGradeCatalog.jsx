import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { del, get, post, put, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Layers as LayersIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const GRADE_COLORS = [
  { header: '#0891b2', light: '#cffafe' },
  { header: '#2563eb', light: '#dbeafe' },
  { header: '#f59e0b', light: '#fef9c3' },
  { header: '#16a34a', light: '#dcfce7' },
  { header: '#dc2626', light: '#fee2e2' },
  { header: '#0284c7', light: '#e0f2fe' },
];

const EMPTY_FORM = {
  gradeName: '',
  description: '',
  maxClasses: 10,
  minAge: '',
  maxAge: '',
  headTeacherId: '',
  staticBlockId: '',
};

function getAgeLabel(grade) {
  if (grade?.ageLabel) return grade.ageLabel;
  const minAge = Number(grade?.minAge || 0);
  const maxAge = Number(grade?.maxAge || 0);

  if (minAge > 0 && maxAge > 0) return `${minAge} - ${maxAge}`;
  if (minAge > 0) return `${minAge}+`;
  if (maxAge > 0) return `0 - ${maxAge}`;
  return 'Chưa cập nhật';
}

function ManageGradeCatalog() {
  const navigate = useNavigate();
  const { user, hasRole, logout, isInitializing } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [staticBlocks, setStaticBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [staticBlocksLoading, setStaticBlocksLoading] = useState(false);
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!hasRole('SchoolAdmin') && !hasRole('SystemAdmin')) {
      navigate('/', { replace: true });
      return;
    }
    fetchData();
  }, [hasRole, isInitializing, navigate, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [gradesRes, classesRes, currentYearRes] = await Promise.all([
        get(ENDPOINTS.GRADES.LIST),
        get(ENDPOINTS.CLASSES.LIST),
        get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT),
      ]);
      setGrades(Array.isArray(gradesRes?.data) ? gradesRes.data : []);
      setClasses(Array.isArray(classesRes?.data) ? classesRes.data : []);
      setCurrentAcademicYear(currentYearRes?.data || null);
    } catch (err) {
      setError(err.message || 'Không thể tải danh mục khối lớp');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      setTeachersLoading(true);
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.TEACHERS);
      setTeachers(Array.isArray(res?.data) ? res.data : []);
    } catch (_) {
      setTeachers([]);
    } finally {
      setTeachersLoading(false);
    }
  };

  const fetchStaticBlocks = async () => {
    try {
      setStaticBlocksLoading(true);
      const res = await get(`${ENDPOINTS.STATIC_BLOCKS.LIST}?status=active`);
      setStaticBlocks(Array.isArray(res?.data) ? res.data : []);
    } catch (_) {
      setStaticBlocks([]);
    } finally {
      setStaticBlocksLoading(false);
    }
  };

  const handleOpenDialog = async (mode, grade = null) => {
    setFormErrors({});
    setDialog({ open: true, mode, data: grade });
    setForm(
      grade
        ? {
            gradeName: grade.gradeName || '',
            description: grade.description || '',
            maxClasses: grade.maxClasses ?? 10,
            minAge: grade.minAge || '',
            maxAge: grade.maxAge || '',
            headTeacherId: grade.headTeacherId?._id || grade.headTeacherId || '',
            staticBlockId: grade.staticBlockId?._id || grade.staticBlockId || '',
          }
        : EMPTY_FORM
    );

    if (teachers.length === 0) {
      await fetchTeachers();
    }
    if (staticBlocks.length === 0) {
      await fetchStaticBlocks();
    }
  };

  const availableStaticBlocks = useMemo(() => {
    const usedBlockIds = new Set(grades.map((item) => String(item.staticBlockId?._id || item.staticBlockId || '')));
    if (dialog.mode === 'edit' && dialog.data?.staticBlockId) {
      usedBlockIds.delete(String(dialog.data.staticBlockId?._id || dialog.data.staticBlockId));
    }
    return staticBlocks.filter((block) => !usedBlockIds.has(String(block._id)));
  }, [dialog.data, dialog.mode, grades, staticBlocks]);

  useEffect(() => {
    if (dialog.mode !== 'create' || !form.staticBlockId) return;
    const selected = staticBlocks.find((item) => String(item._id) === String(form.staticBlockId));
    if (!selected) return;
    setForm((prev) => ({
      ...prev,
      gradeName: selected.name || '',
      description: selected.description || '',
      maxClasses: selected.maxClasses ?? 10,
      minAge: selected.minAge ?? '',
      maxAge: selected.maxAge ?? '',
    }));
  }, [dialog.mode, form.staticBlockId, staticBlocks]);

  const validateForm = () => {
    const nextErrors = {};
    if (!form.staticBlockId) {
      nextErrors.staticBlockId = 'Danh mục khối là bắt buộc';
    }
    if (dialog.mode !== 'create') {
      if (!form.gradeName.trim()) {
        nextErrors.gradeName = 'Tên khối lớp không được để trống';
      } else if (form.gradeName.trim().length > 10) {
        nextErrors.gradeName = 'Tên khối lớp không được quá 10 ký tự';
      }
      if (form.description.trim().length > 50) {
        nextErrors.description = 'Mô tả không được quá 50 ký tự';
      }
    }

    const maxClasses = Number(form.maxClasses);
    if (dialog.mode !== 'create' && (!Number.isInteger(maxClasses) || maxClasses < 1 || maxClasses > 10)) {
      nextErrors.maxClasses = 'Số lớp tối đa phải từ 1 đến 10';
    }

    const minAge = form.minAge !== '' ? Number(form.minAge) : null;
    const maxAge = form.maxAge !== '' ? Number(form.maxAge) : null;
    if (minAge !== null && (Number.isNaN(minAge) || minAge < 0)) {
      nextErrors.minAge = 'Độ tuổi tối thiểu không hợp lệ';
    }
    if (maxAge !== null && (Number.isNaN(maxAge) || maxAge < 0)) {
      nextErrors.maxAge = 'Độ tuổi tối đa không hợp lệ';
    }
    if (minAge !== null && maxAge !== null && minAge >= maxAge) {
      nextErrors.maxAge = 'Tuổi tối đa phải lớn hơn tuổi tối thiểu';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      if (dialog.mode === 'create') {
        await post(ENDPOINTS.GRADES.CREATE, form);
      } else {
        await put(ENDPOINTS.GRADES.UPDATE(dialog.data._id), {
          maxClasses: form.maxClasses,
          headTeacherId: form.headTeacherId,
        });
      }
      setDialog({ open: false, mode: 'create', data: null });
      setForm(EMPTY_FORM);
      await fetchData();
    } catch (err) {
      setFormErrors({
        submit: err.data?.message || err.message || 'Không thể lưu khối lớp',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setSubmitting(true);
      await del(ENDPOINTS.GRADES.DELETE(deleteConfirm._id));
      setDeleteConfirm(null);
      await fetchData();
    } catch (err) {
      setError(err.data?.message || err.message || 'Không thể xóa khối lớp');
      setDeleteConfirm(null);
    } finally {
      setSubmitting(false);
    }
  };

  const classCountByGrade = useMemo(() => {
    const result = {};
    classes.forEach((item) => {
      const gradeId = String(item.gradeId?._id || item.gradeId || '');
      result[gradeId] = (result[gradeId] || 0) + 1;
    });
    return result;
  }, [classes]);

  const filteredGrades = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return grades;

    return grades.filter((item) =>
      [item.gradeName, item.description, getAgeLabel(item)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [grades, searchTerm]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  return (
    <RoleLayout
      title="Quản lý danh mục khối"
      description="Quản lý danh mục khối lớp và cấu hình cơ bản cho từng khối."
      menuItems={menuItems}
      activeKey="classes"
      onLogout={handleLogout}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
      userName={user?.fullName || user?.username || 'Admin'}
      userAvatar={user?.avatar}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <LayersIcon sx={{ color: '#fff', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight={700} color="#fff">
                Danh mục khối lớp
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                {grades.length} khối lớp trong hệ thống
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/school-admin/classes')}
            sx={{
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.45)',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
            }}
          >
            Quay lại quản lý lớp
          </Button>
        </Stack>
      </Paper>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} mb={2.5}>
        <TextField
          placeholder="Tìm theo tên khối, độ tuổi"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1, maxWidth: 320, bgcolor: '#fff', borderRadius: 1.5 }}
        />
        <Stack direction="row" spacing={1} ml="auto">
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 500 }}
          >
            Tải lại
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('create')}
            disabled={!currentAcademicYear}
            sx={{
              bgcolor: '#16a34a',
              '&:hover': { bgcolor: '#15803d' },
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Thêm khối mới
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Stack alignItems="center" py={8}>
          <CircularProgress size={32} sx={{ color: '#2563eb' }} />
          <Typography variant="body2" color="text.secondary" mt={1.5}>
            Đang tải...
          </Typography>
        </Stack>
      ) : filteredGrades.length === 0 ? (
        <Stack alignItems="center" py={8} spacing={1}>
          <LayersIcon sx={{ fontSize: 48, color: 'grey.300' }} />
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Không tìm thấy khối lớp phù hợp.' : 'Chưa có khối lớp nào.'}
          </Typography>
          {!searchTerm && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
              size="small"
              sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, mt: 1, textTransform: 'none' }}
            >
              Tạo khối lớp đầu tiên
            </Button>
          )}
        </Stack>
      ) : (
        <Grid container spacing={2.5}>
          {filteredGrades.map((grade, index) => {
            const color = GRADE_COLORS[index % GRADE_COLORS.length];
            const classCount = classCountByGrade[String(grade._id)] || 0;
            const ageLabel = getAgeLabel(grade);
            return (
              <Grid item xs={12} sm={6} md={4} key={grade._id}>
                <Paper
                  elevation={2}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'transform 0.18s, box-shadow 0.18s',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 },
                  }}
                >
                  <Box sx={{ bgcolor: color.header, px: 2.5, py: 1.75 }}>
                    <Typography variant="h6" fontWeight={700} color="#fff" noWrap>
                      {grade.gradeName}
                    </Typography>
                  </Box>

                  <Box sx={{ px: 2.5, py: 2, bgcolor: '#fff' }}>
                    <Stack spacing={0.75}>
                      <Stack direction="row" spacing={0.5}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90 }}>
                          Độ tuổi:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {ageLabel}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90 }}>
                          Số lớp:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {classCount}/{grade.maxClasses ?? 10}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90 }}>
                          Tổng số trẻ:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {grade.totalStudents ?? 0}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90 }}>
                          Tổ trưởng:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {grade.headTeacher?.fullName || 'Chưa phân công'}
                        </Typography>
                      </Stack>
                      {grade.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ pt: 0.5 }}>
                          {grade.description}
                        </Typography>
                      )}
                    </Stack>
                  </Box>

                  <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#fff', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/school-admin/classes?gradeId=${grade._id}`)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: '#2563eb',
                          color: '#2563eb',
                          '&:hover': { borderColor: '#1d4ed8', bgcolor: '#eff6ff' },
                          borderRadius: 1.5,
                          fontSize: '0.8rem',
                        }}
                      >
                        Quản lý lớp
                      </Button>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('edit', grade)}
                            sx={{ bgcolor: '#fef3c7', color: '#d97706', '&:hover': { bgcolor: '#fde68a' }, borderRadius: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteConfirm(grade)}
                            sx={{ bgcolor: '#fee2e2', color: '#dc2626', '&:hover': { bgcolor: '#fecaca' }, borderRadius: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, mode: 'create', data: null })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {dialog.mode === 'create' ? 'Thêm khối lớp mới' : 'Chỉnh sửa khối lớp'}
        </DialogTitle>
        <DialogContent dividers>
          {formErrors.submit && <Alert severity="error" sx={{ mb: 2 }}>{formErrors.submit}</Alert>}
          <Stack spacing={2.5} mt={0.5}>
            {dialog.mode === 'create' && (
              <Alert severity={currentAcademicYear ? 'info' : 'warning'}>
                {currentAcademicYear
                  ? `Khởi tạo cho năm học đang hoạt động: ${currentAcademicYear.yearName}`
                  : 'Chưa có năm học đang hoạt động. Vui lòng tạo năm học trước khi khởi tạo khối.'}
              </Alert>
            )}
            <FormControl size="small" fullWidth>
              <InputLabel>Danh mục khối *</InputLabel>
              <Select
                label="Danh mục khối *"
                value={form.staticBlockId}
                onChange={(e) => setForm((prev) => ({ ...prev, staticBlockId: e.target.value }))}
                disabled={staticBlocksLoading || dialog.mode === 'edit'}
              >
                <MenuItem value=""><em>— Chọn danh mục khối —</em></MenuItem>
                {(dialog.mode === 'create' ? availableStaticBlocks : staticBlocks).map(block => (
                  <MenuItem key={block._id} value={block._id}>
                    {block.name} ({getAgeLabel(block)})
                  </MenuItem>
                ))}
              </Select>
              {formErrors.staticBlockId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>{formErrors.staticBlockId}</Typography>
              )}
              {dialog.mode === 'create' && !staticBlocksLoading && availableStaticBlocks.length === 0 && (
                <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, ml: 1.75 }}>
                  Tất cả danh mục khối đã được khởi tạo trong năm học hiện tại.
                </Typography>
              )}
            </FormControl>
            <TextField
              label="Tên khối lớp"
              required
              fullWidth
              size="small"
              value={form.gradeName}
              onChange={(e) => setForm((prev) => ({ ...prev, gradeName: e.target.value }))}
              error={!!formErrors.gradeName}
              helperText={
                dialog.mode === 'edit'
                  ? 'Tên khối lớp không được chỉnh sửa sau khi tạo'
                  : formErrors.gradeName || `${form.gradeName.length}/10 ký tự`
              }
              inputProps={{ maxLength: 10 }}
              disabled
            />
            <TextField
              label="Mô tả"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              error={!!formErrors.description}
              helperText={
                dialog.mode === 'edit'
                  ? 'Mô tả chỉ được thiết lập khi tạo khối'
                  : formErrors.description || `${form.description.length}/50 ký tự`
              }
              inputProps={{ maxLength: 50 }}
              disabled
            />
            <TextField
              label="Số lớp tối đa"
              required
              fullWidth
              size="small"
              type="number"
              value={form.maxClasses}
              onChange={(e) => setForm((prev) => ({ ...prev, maxClasses: e.target.value }))}
              error={!!formErrors.maxClasses}
              helperText={
                dialog.mode === 'create'
                  ? 'Tự động lấy từ danh mục khối đã chọn'
                  : formErrors.maxClasses || 'Tối đa 10 lớp trong một khối'
              }
              inputProps={{ min: 1, max: 10 }}
              disabled={dialog.mode === 'create'}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Tuổi tối thiểu"
                fullWidth
                size="small"
                type="number"
                value={form.minAge}
                onChange={(e) => setForm((prev) => ({ ...prev, minAge: e.target.value }))}
                error={!!formErrors.minAge}
                helperText={dialog.mode === 'edit' ? 'Không chỉnh sửa ở chế độ này' : formErrors.minAge || 'Không bắt buộc'}
                inputProps={{ min: 1 }}
                disabled
              />
              <TextField
                label="Tuổi tối đa"
                fullWidth
                size="small"
                type="number"
                value={form.maxAge}
                onChange={(e) => setForm((prev) => ({ ...prev, maxAge: e.target.value }))}
                error={!!formErrors.maxAge}
                helperText={dialog.mode === 'edit' ? 'Không chỉnh sửa ở chế độ này' : formErrors.maxAge || 'Không bắt buộc'}
                inputProps={{ max: 6 }}
                disabled
              />
            </Stack>
            <FormControl size="small" fullWidth>
              <InputLabel>Tổ trưởng khối</InputLabel>
              <Select
                label="Tổ trưởng khối"
                value={form.headTeacherId}
                onChange={(e) => setForm((prev) => ({ ...prev, headTeacherId: e.target.value }))}
                disabled={teachersLoading}
              >
                <MenuItem value="">
                  <em>Chưa phân công</em>
                </MenuItem>
                {teachers
                  .filter((teacher) => teacher.status === 'active')
                  .map((teacher) => (
                    <MenuItem key={teacher._id} value={teacher._id}>
                      {teacher.fullName}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialog({ open: false, mode: 'create', data: null })} color="inherit" disabled={submitting}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              submitting ||
              (dialog.mode === 'create' && (!currentAcademicYear || availableStaticBlocks.length === 0))
            }
            sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, textTransform: 'none', fontWeight: 600 }}
          >
            {submitting ? <CircularProgress size={18} color="inherit" /> : dialog.mode === 'create' ? 'Tạo' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn chắc chắn muốn xóa khối lớp <strong>{deleteConfirm?.gradeName}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Chỉ có thể xóa khi không có lớp học nào thuộc khối này.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)} color="inherit" disabled={submitting}>
            Hủy
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 600 }}>
            {submitting ? <CircularProgress size={18} color="inherit" /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}

export default ManageGradeCatalog;
