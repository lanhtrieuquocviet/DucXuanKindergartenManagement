import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { get, post, put, del, ENDPOINTS } from '../../service/api';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Stack,
  Chip,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Class as ClassIcon,
  WarningAmber as WarningAmberIcon,
  Delete as DeleteIcon,
  Layers as LayersIcon,
} from '@mui/icons-material';

function ClassList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Create class dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [fetchingDialogData, setFetchingDialogData] = useState(false);
  const [dialogError, setDialogError] = useState(null);
  const [noActiveYear, setNoActiveYear] = useState(false);
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null);
  const [grades, setGrades] = useState([]);
  const [form, setForm] = useState({ className: '', gradeId: '', maxStudents: '' });
  const [formErrors, setFormErrors] = useState({});

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Grade CRUD state
  const [gradeList, setGradeList] = useState([]);
  const [gradeLoading, setGradeLoading] = useState(false);
  const [gradeError, setGradeError] = useState(null);
  const [gradeDialog, setGradeDialog] = useState({ open: false, mode: 'create', data: null });
  const [gradeForm, setGradeForm] = useState({ gradeName: '', description: '' });
  const [gradeFormErrors, setGradeFormErrors] = useState({});
  const [gradeSubmitting, setGradeSubmitting] = useState(false);
  const [gradeDeleteConfirm, setGradeDeleteConfirm] = useState(null);

  const navigate = useNavigate();
  const { user, hasRole, logout, isInitializing } = useAuth();

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (!hasRole('SchoolAdmin') && !hasRole('SystemAdmin')) {
      navigate('/', { replace: true });
      return;
    }

    fetchClasses();
    fetchGradeList();
  }, [navigate, user, hasRole, isInitializing]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.CLASSES.LIST);
      console.log('=== FRONTEND DEBUG: fetchClasses ===');
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      console.log('Data length:', response.data ? response.data.length : 'null');
      console.log('=== END DEBUG ===');
      setClasses(response.data || []);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách lớp học');
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGradeList = async () => {
    try {
      setGradeLoading(true);
      setGradeError(null);
      const res = await get(ENDPOINTS.GRADES.LIST);
      setGradeList(res.data || []);
    } catch (err) {
      setGradeError(err.message || 'Lỗi khi tải danh sách khối lớp');
    } finally {
      setGradeLoading(false);
    }
  };

  const openGradeDialog = (mode, data = null) => {
    setGradeFormErrors({});
    setGradeForm(data ? { gradeName: data.gradeName, description: data.description || '' } : { gradeName: '', description: '' });
    setGradeDialog({ open: true, mode, data });
  };

  const validateGradeForm = () => {
    const errs = {};
    if (!gradeForm.gradeName.trim()) {
      errs.gradeName = 'Tên khối lớp không được để trống';
    } else if (gradeForm.gradeName.trim().length > 10) {
      errs.gradeName = 'Tên khối lớp không được quá 10 ký tự';
    }
    if (gradeForm.description.trim().length > 50) {
      errs.description = 'Mô tả không được quá 50 ký tự';
    }
    setGradeFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGradeSubmit = async () => {
    if (!validateGradeForm()) return;
    try {
      setGradeSubmitting(true);
      if (gradeDialog.mode === 'create') {
        await post(ENDPOINTS.GRADES.CREATE, gradeForm);
      } else {
        await put(ENDPOINTS.GRADES.UPDATE(gradeDialog.data._id), gradeForm);
      }
      setGradeDialog({ open: false, mode: 'create', data: null });
      fetchGradeList();
    } catch (err) {
      setGradeFormErrors({ submit: err.data?.message || err.message || 'Lỗi khi lưu khối lớp' });
    } finally {
      setGradeSubmitting(false);
    }
  };

  const handleGradeDelete = async () => {
    if (!gradeDeleteConfirm) return;
    try {
      setGradeSubmitting(true);
      await del(ENDPOINTS.GRADES.DELETE(gradeDeleteConfirm._id));
      setGradeDeleteConfirm(null);
      fetchGradeList();
    } catch (err) {
      setGradeError(err.data?.message || err.message || 'Lỗi khi xóa khối lớp');
      setGradeDeleteConfirm(null);
    } finally {
      setGradeSubmitting(false);
    }
  };

  const openCreateDialog = async () => {
    setDialogError(null);
    setNoActiveYear(false);
    setForm({ className: '', gradeId: '', maxStudents: '' });
    setFormErrors({});
    setCurrentAcademicYear(null);
    setGrades([]);
    setDialogOpen(true);
    setFetchingDialogData(true);
    try {
      const [yearRes, gradesRes] = await Promise.all([
        get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT),
        get(ENDPOINTS.CLASSES.GRADES),
      ]);
      const year = yearRes.data || null;
      setCurrentAcademicYear(year);
      setGrades(gradesRes.data || []);
      if (!year) {
        setNoActiveYear(true);
      }
    } catch (err) {
      setDialogError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setFetchingDialogData(false);
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!form.className.trim()) {
      errs.className = 'Tên lớp không được để trống';
    } else if (form.className.trim().length > 10) {
      errs.className = 'Tên lớp không được quá 10 ký tự';
    }
    if (!form.gradeId) errs.gradeId = 'Vui lòng chọn khối lớp';
    if (form.maxStudents !== '') {
      const val = Number(form.maxStudents);
      if (isNaN(val) || val < 0) {
        errs.maxStudents = 'Sĩ số không hợp lệ';
      } else if (val > 30) {
        errs.maxStudents = 'Sĩ số tối đa không được vượt quá 30';
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateClass = async () => {
    if (!validateForm()) return;
    try {
      setDialogLoading(true);
      setDialogError(null);
      await post(ENDPOINTS.CLASSES.CREATE, {
        className: form.className.trim(),
        gradeId: form.gradeId,
        maxStudents: form.maxStudents !== '' ? Number(form.maxStudents) : 0,
      });
      setDialogOpen(false);
      fetchClasses();
    } catch (err) {
      const msg = err.data?.message || err.message || 'Lỗi khi tạo lớp học';
      const code = err.data?.code;
      if (code === 'NO_ACTIVE_ACADEMIC_YEAR') {
        setCurrentAcademicYear(null);
        setNoActiveYear(true);
      }
      setDialogError(msg);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const handleViewStudents = (classId) => {
    navigate(`/school-admin/classes/${classId}/students`);
  };

  const handleMenuSelect = (key) => {
    if (key === 'classes') {
      return;
    }
    if (key === 'academic-years' || key === 'academic-plan') {
      navigate('/school-admin/academic-years');
      return;
    }
    if (key === 'academic-classes') {
      navigate('/school-admin/classes');
      return;
    }
    if (key === 'academic-students') {
      navigate('/school-admin/students');
      return;
    }
    if (key === "menu") {
      navigate("/school-admin/menus");
      return;
    }
    if (key === 'students') {
      navigate('/school-admin/students');
      return;
    }
    if (key === 'contacts') {
      navigate('/school-admin/contacts');
      return;
    }
    if (key === 'overview') {
      navigate('/school-admin');
      return;
    }
    if (key === 'qa') {
      navigate('/school-admin/qa');
      return;
    }
    if (key === 'blogs') {
      navigate('/school-admin/blogs');
      return;
    }
    if (key === 'documents') {
      navigate('/school-admin/documents');
      return;
    }
    if (key === 'public-info') {
      navigate('/school-admin/public-info');
      return;
    }
    if (key === 'attendance') {
      navigate('/school-admin/attendance/overview');
      return;
    }
  };

  // Render menu khác nhau tùy theo role
  const getMenuItems = () => {
    if (hasRole('SystemAdmin')) {
      return [
        { key: 'overview', label: 'Tổng quan hệ thống' },
        { key: 'schools', label: 'Quản lý trường' },
        { key: 'accounts', label: 'Quản lý tài khoản' },
        { key: 'classes', label: 'Lớp học (toàn hệ thống)' },
        { key: 'roles', label: 'Phân quyền & vai trò' },
        { key: 'reports', label: 'Báo cáo tổng hợp' },
      ];
    }
    // Default menu cho SchoolAdmin
    return [
      { key: "overview", label: "Tổng quan trường" },
      {
        key: "academic-years",
        label: "Quản lý năm học",
        children: [
          { key: "academic-plan", label: "Thiết lập kế hoạch" },
          { key: "academic-classes", label: "Danh sách lớp học" },
          { key: "academic-students", label: "Danh sách trẻ" },
          { key: 'academic-curriculum', label: 'Chương trình giáo dục' },
          { key: 'academic-schedule', label: 'Thời khóa biểu' },
          { key: 'academic-report', label: 'Báo cáo & thống kê' },
        ],
      },
      { key: "classes", label: "Lớp học" },
      { key: "menu", label: "Quản lý thực đơn" },
      { key: "teachers", label: "Giáo viên" },
      { key: "students", label: "Học sinh & phụ huynh" },
      { key: "assets", label: "Quản lý tài sản" },
      { key: "reports", label: "Báo cáo của trường" },
      { key: "contacts", label: "Liên hệ" },
      { key: "qa", label: "Câu hỏi" },
      { key: "blogs", label: "Quản lý blog" },
      { key: "documents", label: "Quản lý tài liệu" },
      { key: "public-info", label: "Thông tin công khai" },
      { key: "attendance", label: "Quản lý điểm danh" },
    ];
  };

  // Lọc danh sách lớp theo từ khóa tìm kiếm
  const filteredClasses = classes.filter((cls) =>
    cls.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClasses = classes.length;
  const activeClasses = classes.filter((c) => c.className).length;
  const totalCapacity = classes.reduce((sum, c) => sum + (c.maxStudents || 0), 0);

  return (
    <RoleLayout
      title="Quản lý Lớp Học"
      description="Xem danh sách tất cả lớp học, quản lý thông tin chi tiết và học sinh."
      menuItems={getMenuItems()}
      activeKey="classes"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
      userName={user?.fullName || user?.username || 'Admin'}
      userAvatar={user?.avatar}
    >
      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Header gradient banner */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          borderRadius: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <ClassIcon sx={{ color: 'white', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight={700} color="white">
              Danh sách lớp học
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.8)" mt={0.25}>
              Xem danh sách tất cả lớp học, quản lý thông tin chi tiết và học sinh.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Main card */}
      <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<ClassIcon fontSize="small" />} iconPosition="start" label="Lớp học" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }} />
          <Tab icon={<LayersIcon fontSize="small" />} iconPosition="start" label="Khối lớp" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* ===== TAB 0: CLASSES ===== */}
          {activeTab === 0 && (
            <>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                alignItems={{ xs: 'flex-start', md: 'center' }}
                justifyContent="space-between"
                spacing={2}
                mb={3}
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                    Danh sách lớp học
                  </Typography>
                  <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary">Tổng lớp:</Typography>
                    <Typography variant="caption" fontWeight={700} color="text.primary">{totalClasses}</Typography>
                    <Typography variant="caption" color="text.disabled">•</Typography>
                    <Typography variant="caption" color="text.secondary">Sức chứa tổng:</Typography>
                    <Typography variant="caption" fontWeight={700} color="text.primary">{totalCapacity}</Typography>
                  </Stack>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
                  <TextField
                    size="small"
                    placeholder="Tìm kiếm tên lớp..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ minWidth: 220 }}
                  />
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<RefreshIcon />}
                    onClick={fetchClasses}
                    sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}
                  >
                    Tải lại
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreateDialog}
                    sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, borderRadius: 1.5, textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    Thêm lớp
                  </Button>
                </Stack>
              </Stack>

              {loading ? (
                <Stack alignItems="center" justifyContent="center" spacing={1.5} py={6}>
                  <CircularProgress size={32} thickness={4} sx={{ color: '#6366f1' }} />
                  <Typography variant="body2" color="text.secondary">Đang tải danh sách...</Typography>
                </Stack>
              ) : filteredClasses.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" py={6}>
                  <Typography variant="body2" color="text.secondary">Không tìm thấy lớp học nào</Typography>
                </Stack>
              ) : (
                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>Tên lớp</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>Khối lớp</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>Năm học</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>Sức chứa</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>Giáo viên</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredClasses.map((cls, index) => (
                        <TableRow key={cls._id || index} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} color="text.primary">{cls.className}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{cls.gradeId?.gradeName || 'N/A'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{cls.academicYearId?.yearName || 'N/A'}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={cls.maxStudents || 0} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.75rem', borderColor: 'grey.400', color: 'text.primary' }} />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600} color="text.primary">{cls.teacherIds?.length || 0}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<VisibilityIcon sx={{ fontSize: '0.875rem !important' }} />}
                                onClick={() => handleViewStudents(cls._id)}
                                sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1', boxShadow: 'none', '&:hover': { bgcolor: 'rgba(99,102,241,0.2)', boxShadow: 'none' }, borderRadius: 1.5, textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, py: 0.5 }}
                              >
                                Xem học sinh
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<EditIcon sx={{ fontSize: '0.875rem !important' }} />}
                                sx={{ bgcolor: 'grey.100', color: 'text.secondary', boxShadow: 'none', '&:hover': { bgcolor: 'grey.200', boxShadow: 'none' }, borderRadius: 1.5, textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, py: 0.5 }}
                              >
                                Sửa
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {/* ===== TAB 1: GRADES ===== */}
          {activeTab === 1 && (
            <>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} color="text.primary">Danh sách khối lớp</Typography>
                  <Typography variant="caption" color="text.secondary">Tổng: {gradeList.length} khối</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<RefreshIcon />}
                    onClick={fetchGradeList}
                    sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 500 }}
                  >
                    Tải lại
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => openGradeDialog('create')}
                    sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                  >
                    Thêm khối lớp
                  </Button>
                </Stack>
              </Stack>

              {gradeError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGradeError(null)}>{gradeError}</Alert>}

              {gradeLoading ? (
                <Stack alignItems="center" py={6}>
                  <CircularProgress size={32} thickness={4} sx={{ color: '#6366f1' }} />
                </Stack>
              ) : gradeList.length === 0 ? (
                <Stack alignItems="center" py={6}>
                  <Typography variant="body2" color="text.secondary">Chưa có khối lớp nào. Nhấn "Thêm khối lớp" để bắt đầu.</Typography>
                </Stack>
              ) : (
                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Tên khối lớp</TableCell>
                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Mô tả</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, py: 1.5 }}>Số lớp</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, py: 1.5 }}>Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gradeList.map((g) => (
                        <TableRow key={g._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{g.gradeName}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{g.description || '—'}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={g.classList?.length || 0} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.75rem', borderColor: 'grey.400' }} />
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="Sửa">
                                <IconButton size="small" color="primary" onClick={() => openGradeDialog('edit', g)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Xóa">
                                <IconButton size="small" color="error" onClick={() => setGradeDeleteConfirm(g)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Box>
      </Paper>

      {/* Grade Create/Edit Dialog */}
      <Dialog open={gradeDialog.open} onClose={() => setGradeDialog({ open: false, mode: 'create', data: null })} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {gradeDialog.mode === 'create' ? 'Thêm khối lớp mới' : 'Chỉnh sửa khối lớp'}
        </DialogTitle>
        <DialogContent dividers>
          {gradeFormErrors.submit && <Alert severity="error" sx={{ mb: 2 }}>{gradeFormErrors.submit}</Alert>}
          <Stack spacing={2.5} mt={0.5}>
            <TextField
              label="Tên khối lớp"
              required
              fullWidth
              size="small"
              value={gradeForm.gradeName}
              onChange={(e) => setGradeForm((f) => ({ ...f, gradeName: e.target.value }))}
              error={!!gradeFormErrors.gradeName}
              helperText={gradeFormErrors.gradeName || `${gradeForm.gradeName.length}/10 ký tự`}
              inputProps={{ maxLength: 10 }}
            />
            <TextField
              label="Mô tả"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={gradeForm.description}
              onChange={(e) => setGradeForm((f) => ({ ...f, description: e.target.value }))}
              error={!!gradeFormErrors.description}
              helperText={gradeFormErrors.description || `${gradeForm.description.length}/50 ký tự`}
              inputProps={{ maxLength: 50 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setGradeDialog({ open: false, mode: 'create', data: null })} color="inherit" disabled={gradeSubmitting}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleGradeSubmit}
            disabled={gradeSubmitting}
            sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, textTransform: 'none', fontWeight: 600 }}
          >
            {gradeSubmitting ? <CircularProgress size={18} color="inherit" /> : (gradeDialog.mode === 'create' ? 'Tạo' : 'Lưu')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Grade Delete Confirm Dialog */}
      <Dialog open={!!gradeDeleteConfirm} onClose={() => setGradeDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>Bạn chắc chắn muốn xóa khối lớp <strong>{gradeDeleteConfirm?.gradeName}</strong>?</Typography>
          <Typography variant="caption" color="text.secondary">Chỉ có thể xóa khi không có lớp học nào thuộc khối này.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setGradeDeleteConfirm(null)} color="inherit" disabled={gradeSubmitting}>Hủy</Button>
          <Button variant="contained" color="error" onClick={handleGradeDelete} disabled={gradeSubmitting} sx={{ textTransform: 'none', fontWeight: 600 }}>
            {gradeSubmitting ? <CircularProgress size={18} color="inherit" /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Create Class Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Tạo lớp học mới</DialogTitle>
        <DialogContent dividers>
          {/* Loading */}
          {fetchingDialogData && (
            <Stack alignItems="center" py={3}>
              <CircularProgress size={28} />
            </Stack>
          )}

          {/* No active academic year warning */}
          {!fetchingDialogData && noActiveYear && (
            <Alert
              severity="warning"
              icon={<WarningAmberIcon />}
              sx={{ mb: 2 }}
              action={
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => { setDialogOpen(false); navigate('/school-admin/academic-years'); }}
                >
                  Tạo năm học
                </Button>
              }
            >
              Chưa có năm học đang hoạt động. Vui lòng tạo năm học mới trước khi tạo lớp.
            </Alert>
          )}

          {/* Error (fetch failure or submit error) */}
          {!fetchingDialogData && dialogError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dialogError}
            </Alert>
          )}

          {/* Active academic year info */}
          {!fetchingDialogData && currentAcademicYear && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Lớp sẽ được tạo trong năm học: <strong>{currentAcademicYear.yearName}</strong>
            </Alert>
          )}

          {/* Form — only show when we have academic year */}
          {!fetchingDialogData && currentAcademicYear && (
            <Stack spacing={2.5} mt={1}>
              <TextField
                label="Tên lớp"
                required
                fullWidth
                size="small"
                value={form.className}
                onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))}
                error={!!formErrors.className}
                helperText={formErrors.className || `${form.className.length}/10 ký tự`}
                inputProps={{ maxLength: 10 }}
              />
              <FormControl fullWidth size="small" required error={!!formErrors.gradeId}>
                <InputLabel>Khối lớp</InputLabel>
                <Select
                  label="Khối lớp"
                  value={form.gradeId}
                  onChange={(e) => setForm((f) => ({ ...f, gradeId: e.target.value }))}
                >
                  {grades.map((g) => (
                    <MenuItem key={g._id} value={g._id}>{g.gradeName}</MenuItem>
                  ))}
                </Select>
                {formErrors.gradeId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                    {formErrors.gradeId}
                  </Typography>
                )}
              </FormControl>
              <TextField
                label="Sĩ số tối đa"
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 0, max: 30 }}
                value={form.maxStudents}
                onChange={(e) => setForm((f) => ({ ...f, maxStudents: e.target.value }))}
                error={!!formErrors.maxStudents}
                helperText={formErrors.maxStudents || 'Tối đa 30 học sinh'}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={dialogLoading}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateClass}
            disabled={dialogLoading || fetchingDialogData || !currentAcademicYear}
            sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, textTransform: 'none', fontWeight: 600 }}
          >
            {dialogLoading ? <CircularProgress size={18} color="inherit" /> : 'Tạo lớp'}
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}

export default ClassList;
