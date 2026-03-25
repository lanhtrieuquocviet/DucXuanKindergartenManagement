import { useEffect, useState, useMemo } from 'react';
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
  IconButton,
  Tooltip,
  Avatar,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Grid,
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
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

// ── colour palette per grade index ────────────────────────────────────────────
const GRADE_COLORS = [
  { header: '#7c3aed', light: '#ede9fe' },
  { header: '#2563eb', light: '#dbeafe' },
  { header: '#f59e0b', light: '#fef9c3' },
  { header: '#16a34a', light: '#dcfce7' },
  { header: '#dc2626', light: '#fee2e2' },
  { header: '#0284c7', light: '#e0f2fe' },
];

// ── TeacherSelect phải đặt ngoài ClassList để tránh unmount khi re-render ──────
function TeacherSelect({ availability, value, onChange, error, helperText, loading }) {
  const all       = availability || [];
  const available = all.filter(t => !t.inCurrentYear && !t.maxYearsReached && !value.includes(t._id));
  const selected  = all.filter(t => value.includes(t._id));
  const inYear    = all.filter(t => t.inCurrentYear  && !value.includes(t._id));
  const maxYears  = all.filter(t => t.maxYearsReached && !t.inCurrentYear && !value.includes(t._id));

  // Xây dựng danh sách children dạng phẳng (flat) để MUI Select xử lý đúng
  const menuItems = [];

  if (loading) {
    menuItems.push(<MenuItem key="__loading" disabled><em>Đang tải...</em></MenuItem>);
  } else if (all.length === 0) {
    menuItems.push(<MenuItem key="__empty" disabled><em>Không có giáo viên nào</em></MenuItem>);
  } else {
    // Đang được chọn
    selected.forEach(t => {
      menuItems.push(
        <MenuItem key={t._id} value={t._id}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pointerEvents: 'none' }}>
            <Checkbox checked size="small" onChange={() => {}} sx={{ p: 0.5 }} />
            <Avatar sx={{ width: 26, height: 26, mx: 1, bgcolor: '#ede9fe', color: '#7c3aed', fontSize: '0.75rem', fontWeight: 700 }}>
              {t.fullName?.charAt(0)}
            </Avatar>
            <ListItemText
              primary={t.fullName}
              secondary={`${t.email}${t.yearsInClass > 0 ? ` · ${t.yearsInClass}/2 năm dạy lớp này` : ''}`}
            />
          </Box>
        </MenuItem>
      );
    });

    // Divider "Có thể chọn"
    if (selected.length > 0 && available.length > 0) {
      menuItems.push(
        <MenuItem key="__div_available" disabled sx={{ fontSize: '0.72rem', color: 'text.disabled', py: 0.3, minHeight: 'unset', opacity: 1 }}>
          — Có thể chọn —
        </MenuItem>
      );
    }

    // Khả dụng
    available.forEach(t => {
      menuItems.push(
        <MenuItem key={t._id} value={t._id}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pointerEvents: 'none' }}>
            <Checkbox checked={false} size="small" onChange={() => {}} sx={{ p: 0.5 }} />
            <Avatar sx={{ width: 26, height: 26, mx: 1, bgcolor: '#ede9fe', color: '#7c3aed', fontSize: '0.75rem', fontWeight: 700 }}>
              {t.fullName?.charAt(0)}
            </Avatar>
            <ListItemText
              primary={t.fullName}
              secondary={`${t.email}${t.yearsInClass > 0 ? ` · ${t.yearsInClass}/2 năm dạy lớp này` : ''}`}
            />
          </Box>
        </MenuItem>
      );
    });

    // Đã có lớp trong năm
    if (inYear.length > 0) {
      menuItems.push(
        <MenuItem key="__div_inyear" disabled sx={{ fontSize: '0.72rem', color: 'text.disabled', py: 0.3, minHeight: 'unset', opacity: 1 }}>
          — Đã phụ trách lớp khác năm nay —
        </MenuItem>
      );
      inYear.forEach(t => {
        menuItems.push(
          <MenuItem key={t._id} value={t._id} disabled sx={{ opacity: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Avatar sx={{ width: 26, height: 26, mx: 1, bgcolor: '#f3f4f6', color: '#9ca3af', fontSize: '0.75rem', fontWeight: 700 }}>
                {t.fullName?.charAt(0)}
              </Avatar>
              <ListItemText primary={t.fullName} secondary={`Đang dạy lớp: ${t.inCurrentYear}`} />
            </Box>
          </MenuItem>
        );
      });
    }

    // Đã đủ 2 năm
    if (maxYears.length > 0) {
      menuItems.push(
        <MenuItem key="__div_maxyears" disabled sx={{ fontSize: '0.72rem', color: 'text.disabled', py: 0.3, minHeight: 'unset', opacity: 1 }}>
          — Đã dạy lớp này đủ 2 năm —
        </MenuItem>
      );
      maxYears.forEach(t => {
        menuItems.push(
          <MenuItem key={t._id} value={t._id} disabled sx={{ opacity: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Avatar sx={{ width: 26, height: 26, mx: 1, bgcolor: '#f3f4f6', color: '#9ca3af', fontSize: '0.75rem', fontWeight: 700 }}>
                {t.fullName?.charAt(0)}
              </Avatar>
              <ListItemText primary={t.fullName} secondary="Đã phụ trách lớp này 2 năm (tối đa)" />
            </Box>
          </MenuItem>
        );
      });
    }
  }

  return (
    <FormControl fullWidth size="small" error={!!error} required>
      <InputLabel>Giáo viên phụ trách (bắt buộc 2)</InputLabel>
      <Select
        multiple
        label="Giáo viên phụ trách (bắt buộc 2)"
        value={value}
        onChange={(e) => { if (e.target.value.length <= 2) onChange(e.target.value); }}
        input={<OutlinedInput label="Giáo viên phụ trách (bắt buộc 2)" />}
        renderValue={(sel) => all.filter(t => sel.includes(t._id)).map(t => t.fullName).join(', ')}
      >
        {menuItems}
      </Select>
      {error && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>{error}</Typography>}
      {helperText && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>{helperText}</Typography>}
    </FormControl>
  );
}

function ClassList() {
  const [classes, setClasses] = useState([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Drill-down state: null = grade list, object = selected grade
  const [selectedGrade, setSelectedGrade] = useState(null);

  // Teachers & Rooms list (shared by create + edit dialog)
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Teacher availability (theo nghiệp vụ 3 rule)
  const [createAvailability, setCreateAvailability] = useState([]);
  const [createAvailLoading, setCreateAvailLoading] = useState(false);
  const [editAvailability, setEditAvailability] = useState([]);
  const [editAvailLoading, setEditAvailLoading] = useState(false);

  // Create class dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [fetchingDialogData, setFetchingDialogData] = useState(false);
  const [dialogError, setDialogError] = useState(null);
  const [noActiveYear, setNoActiveYear] = useState(false);
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null);
  const [grades, setGrades] = useState([]);
  const [form, setForm] = useState({ className: '', gradeId: '', maxStudents: '', teacherIds: [], roomId: '' });
  const [formErrors, setFormErrors] = useState({});

  // Edit class dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogLoading, setEditDialogLoading] = useState(false);
  const [editFetchingData, setEditFetchingData] = useState(false);
  const [editDialogError, setEditDialogError] = useState(null);
  const [editForm, setEditForm] = useState({ className: '', gradeId: '', maxStudents: '', teacherIds: [], roomId: '' });
  const [editFormErrors, setEditFormErrors] = useState({});
  const [editClassId, setEditClassId] = useState(null);

  // Delete class state
  const [classDeleteConfirm, setClassDeleteConfirm] = useState(null);
  const [classDeleteLoading, setClassDeleteLoading] = useState(false);

  // Grade CRUD state
  const [gradeList, setGradeList] = useState([]);
  const [gradeLoading, setGradeLoading] = useState(false);
  const [gradeError, setGradeError] = useState(null);
  const [gradeSearchTerm, setGradeSearchTerm] = useState('');
  const [gradeDialog, setGradeDialog] = useState({ open: false, mode: 'create', data: null });
  const [gradeForm, setGradeForm] = useState({ gradeName: '', description: '', maxClasses: 10, minAge: '', maxAge: '' });
  const [gradeFormErrors, setGradeFormErrors] = useState({});
  const [gradeSubmitting, setGradeSubmitting] = useState(false);
  const [gradeDeleteConfirm, setGradeDeleteConfirm] = useState(null);

  const navigate = useNavigate();
  const { user, hasRole, logout, isInitializing } = useAuth();

  // ── fetch teacher availability when className changes (create dialog) ────────
  useEffect(() => {
    if (!dialogOpen) return;
    let cancelled = false;
    const fetchAvail = async () => {
      setCreateAvailLoading(true);
      try {
        const params = form.className.trim() ? `?className=${encodeURIComponent(form.className.trim())}` : '';
        const res = await get(`${ENDPOINTS.SCHOOL_ADMIN.TEACHER_AVAILABILITY}${params}`);
        if (!cancelled) setCreateAvailability(res.data || []);
      } catch (_) {
        if (!cancelled) setCreateAvailability([]);
      } finally {
        if (!cancelled) setCreateAvailLoading(false);
      }
    };
    const timer = setTimeout(fetchAvail, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [form.className, dialogOpen]);

  // ── fetch teacher availability when className changes (edit dialog) ───────────
  useEffect(() => {
    if (!editDialogOpen) return;
    let cancelled = false;
    const fetchAvail = async () => {
      setEditAvailLoading(true);
      try {
        const cn = editForm.className.trim();
        const params = new URLSearchParams();
        if (cn) params.set('className', cn);
        if (editClassId) params.set('excludeClassId', editClassId);
        const qs = params.toString() ? `?${params.toString()}` : '';
        const res = await get(`${ENDPOINTS.SCHOOL_ADMIN.TEACHER_AVAILABILITY}${qs}`);
        if (!cancelled) setEditAvailability(res.data || []);
      } catch (_) {
        if (!cancelled) setEditAvailability([]);
      } finally {
        if (!cancelled) setEditAvailLoading(false);
      }
    };
    const timer = setTimeout(fetchAvail, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [editForm.className, editDialogOpen, editClassId]);

  // ── auth guard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    if (!hasRole('SchoolAdmin') && !hasRole('SystemAdmin')) { navigate('/', { replace: true }); return; }
    fetchClasses();
    fetchGradeList();
  }, [navigate, user, hasRole, isInitializing]);

  // ── data fetching ─────────────────────────────────────────────────────────────
  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(ENDPOINTS.CLASSES.LIST);
      setClasses(response.data || []);
      setActiveAcademicYear(response.academicYear || null);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách lớp học');
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

  // ── grade CRUD ────────────────────────────────────────────────────────────────
  const openGradeDialog = (mode, data = null) => {
    setGradeFormErrors({});
    setGradeForm(data
      ? { gradeName: data.gradeName, description: data.description || '', maxClasses: data.maxClasses ?? 10, minAge: data.minAge || '', maxAge: data.maxAge || '' }
      : { gradeName: '', description: '', maxClasses: 10, minAge: '', maxAge: '' }
    );
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
    const mc = Number(gradeForm.maxClasses);
    if (!Number.isInteger(mc) || mc < 1 || mc > 10) {
      errs.maxClasses = 'Số lớp tối đa phải từ 1 đến 10';
    }
    const minA = gradeForm.minAge !== '' ? Number(gradeForm.minAge) : null;
    const maxA = gradeForm.maxAge !== '' ? Number(gradeForm.maxAge) : null;
    if (minA !== null && (isNaN(minA) || minA < 0)) errs.minAge = 'Độ tuổi không hợp lệ';
    if (maxA !== null && (isNaN(maxA) || maxA < 0)) errs.maxAge = 'Độ tuổi không hợp lệ';
    if (minA !== null && maxA !== null && minA >= maxA) errs.maxAge = 'Tuổi tối đa phải lớn hơn tuổi tối thiểu';
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
        // Sync selectedGrade name if we edited the active grade
        if (selectedGrade && selectedGrade._id === gradeDialog.data._id) {
          setSelectedGrade(prev => ({ ...prev, gradeName: gradeForm.gradeName, description: gradeForm.description }));
        }
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
      // If we deleted the active grade, go back to grade list
      if (selectedGrade && selectedGrade._id === gradeDeleteConfirm._id) {
        setSelectedGrade(null);
      }
      setGradeDeleteConfirm(null);
      fetchGradeList();
    } catch (err) {
      setGradeError(err.data?.message || err.message || 'Lỗi khi xóa khối lớp');
      setGradeDeleteConfirm(null);
    } finally {
      setGradeSubmitting(false);
    }
  };

  // ── create class dialog ───────────────────────────────────────────────────────
  const openCreateDialog = async (presetGradeId = '') => {
    setDialogError(null);
    setNoActiveYear(false);
    setForm({ className: '', gradeId: presetGradeId, maxStudents: '', teacherIds: [], roomId: '' });
    setFormErrors({});
    setCurrentAcademicYear(null);
    setGrades([]);
    setDialogOpen(true);
    setFetchingDialogData(true);
    try {
      const [yearRes, gradesRes, teachersRes, roomsRes] = await Promise.allSettled([
        get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT),
        get(ENDPOINTS.CLASSES.GRADES),
        get(ENDPOINTS.SCHOOL_ADMIN.TEACHERS),
        get(ENDPOINTS.SCHOOL_ADMIN.CLASSROOMS),
      ]);
      const year = yearRes.status === 'fulfilled' ? (yearRes.value?.data || null) : null;
      setCurrentAcademicYear(year);
      setGrades(gradesRes.status === 'fulfilled' ? (gradesRes.value?.data || []) : []);
      setTeachers(teachersRes.status === 'fulfilled' ? (teachersRes.value?.data || []) : []);
      setRooms(roomsRes.status === 'fulfilled' ? (roomsRes.value?.data || []) : []);
      if (!year) setNoActiveYear(true);
      if (teachersRes.status === 'rejected') console.error('Lấy giáo viên thất bại:', teachersRes.reason);
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
      if (isNaN(val) || val < 0) errs.maxStudents = 'Sĩ số không hợp lệ';
      else if (val > 30) errs.maxStudents = 'Sĩ số tối đa không được vượt quá 30';
    }
    if (form.teacherIds.length !== 2) errs.teacherIds = 'Bắt buộc chọn đúng 2 giáo viên phụ trách';
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
        teacherIds: form.teacherIds,
        roomId: form.roomId || null,
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

  // ── edit class dialog ─────────────────────────────────────────────────────────
  const openEditDialog = async (cls) => {
    setEditDialogError(null);
    setEditFormErrors({});
    setEditClassId(cls._id);
    setEditForm({
      className: cls.className || '',
      gradeId: cls.gradeId?._id || cls.gradeId || '',
      maxStudents: cls.maxStudents || '',
      teacherIds: (cls.teacherIds || []).map(t => t._id || t),
      roomId: cls.roomId?._id || cls.roomId || '',
    });
    setEditDialogOpen(true);
    setEditFetchingData(true);
    try {
      const [gradesRes, teachersRes, roomsRes] = await Promise.allSettled([
        get(ENDPOINTS.CLASSES.GRADES),
        get(ENDPOINTS.SCHOOL_ADMIN.TEACHERS),
        get(ENDPOINTS.SCHOOL_ADMIN.CLASSROOMS),
      ]);
      setGrades(gradesRes.status === 'fulfilled' ? (gradesRes.value?.data || []) : []);
      setTeachers(teachersRes.status === 'fulfilled' ? (teachersRes.value?.data || []) : []);
      setRooms(roomsRes.status === 'fulfilled' ? (roomsRes.value?.data || []) : []);
      if (teachersRes.status === 'rejected') console.error('Lấy giáo viên thất bại:', teachersRes.reason);
    } catch (err) {
      setEditDialogError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setEditFetchingData(false);
    }
  };

  const validateEditForm = () => {
    const errs = {};
    if (!editForm.className.trim()) {
      errs.className = 'Tên lớp không được để trống';
    } else if (editForm.className.trim().length > 10) {
      errs.className = 'Tên lớp không được quá 10 ký tự';
    }
    if (!editForm.gradeId) errs.gradeId = 'Vui lòng chọn khối lớp';
    if (editForm.maxStudents !== '') {
      const val = Number(editForm.maxStudents);
      if (isNaN(val) || val < 0) errs.maxStudents = 'Sĩ số không hợp lệ';
      else if (val > 30) errs.maxStudents = 'Sĩ số tối đa không được vượt quá 30';
    }
    if (editForm.teacherIds.length !== 2) errs.teacherIds = 'Bắt buộc chọn đúng 2 giáo viên phụ trách';
    setEditFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdateClass = async () => {
    if (!validateEditForm()) return;
    try {
      setEditDialogLoading(true);
      setEditDialogError(null);
      await put(ENDPOINTS.CLASSES.UPDATE(editClassId), {
        className: editForm.className.trim(),
        gradeId: editForm.gradeId,
        maxStudents: editForm.maxStudents !== '' ? Number(editForm.maxStudents) : 0,
        teacherIds: editForm.teacherIds,
        roomId: editForm.roomId || null,
      });
      setEditDialogOpen(false);
      fetchClasses();
    } catch (err) {
      setEditDialogError(err.data?.message || err.message || 'Lỗi khi cập nhật lớp học');
    } finally {
      setEditDialogLoading(false);
    }
  };

  // ── delete class ──────────────────────────────────────────────────────────────
  const handleDeleteClass = async () => {
    if (!classDeleteConfirm) return;
    try {
      setClassDeleteLoading(true);
      await del(ENDPOINTS.CLASSES.DELETE(classDeleteConfirm._id));
      setClassDeleteConfirm(null);
      fetchClasses();
    } catch (err) {
      setError(err.data?.message || err.message || 'Lỗi khi xóa lớp học');
      setClassDeleteConfirm(null);
    } finally {
      setClassDeleteLoading(false);
    }
  };

  // ── navigation ────────────────────────────────────────────────────────────────
  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };
  const handleViewProfile = () => navigate('/profile');
  const handleViewStudents = (classId) => navigate(`/school-admin/classes/${classId}/students`);

  const handleMenuSelect = async (key) => {
    if (key === 'classes') {
      return;
    }
    if (key === 'academic-report') {
      try {
        const resp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT);
        const yearId = resp?.status === 'success' ? resp?.data?._id : null;
        if (yearId) navigate(`/school-admin/academic-years/${yearId}/report`);
        else navigate('/school-admin/academic-years');
      } catch (_) {
        navigate('/school-admin/academic-years');
      }
      return;
    }
    const routes = {
      'academic-years': '/school-admin/academic-years',
      'academic-year-setup': '/school-admin/academic-years',
      'academic-curriculum': '/school-admin/curriculum',
      'academic-schedule': '/school-admin/timetable',
      'academic-plan': '/school-admin/classes',
      'academic-students': '/school-admin/class-list',
      teachers: '/school-admin/teachers',
      menu: '/school-admin/menus',
      'meal-management': '/school-admin/meal-management',
      students: '/school-admin/students',
      contacts: '/school-admin/contacts',
      overview: '/school-admin',
      qa: '/school-admin/qa',
      blogs: '/school-admin/blogs',
      documents: '/school-admin/documents',
      'public-info': '/school-admin/public-info',
      attendance: '/school-admin/attendance/overview',
    };
    if (routes[key]) navigate(routes[key]);
  };

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
    return [
      { key: 'overview', label: 'Tổng quan trường' },
      {
        key: 'academic-years',
        label: 'Quản lý năm học',
        children: [
          { key: 'academic-year-setup', label: 'Thiết lập năm học' },
          { key: 'academic-plan', label: 'Thiết lập kế hoạch' },
            { key: 'academic-schedule', label: 'Thời gian biểu' },
          { key: 'academic-report', label: 'Báo cáo & thống kê' },
        ],
      },
      { key: 'classes', label: 'Lớp học' },
      { key: 'menu', label: 'Quản lý thực đơn' },
      { key: 'meal-management', label: 'Quản lý bữa ăn' },
      { key: 'teachers', label: 'Giáo viên' },
      { key: 'students', label: 'Học sinh & phụ huynh' },
      { key: 'assets', label: 'Quản lý tài sản' },
      { key: 'reports', label: 'Báo cáo của trường' },
      { key: 'contacts', label: 'Liên hệ' },
      { key: 'qa', label: 'Câu hỏi' },
      { key: 'blogs', label: 'Quản lý blog' },
      { key: 'documents', label: 'Quản lý tài liệu' },
      { key: 'public-info', label: 'Thông tin công khai' },
      { key: 'attendance', label: 'Quản lý điểm danh' },
    ];
  };

  // ── computed ──────────────────────────────────────────────────────────────────
  const classesInSelectedGrade = useMemo(() => {
    if (!selectedGrade) return [];
    return classes.filter(c => {
      const gId = c.gradeId?._id || c.gradeId;
      return String(gId) === String(selectedGrade._id);
    });
  }, [classes, selectedGrade]);

  const filteredClassesInGrade = useMemo(
    () => classesInSelectedGrade.filter(c =>
      c.className.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [classesInSelectedGrade, searchTerm]
  );

  const classCountByGrade = useMemo(() => {
    const map = {};
    classes.forEach(c => {
      const gId = String(c.gradeId?._id || c.gradeId || '');
      map[gId] = (map[gId] || 0) + 1;
    });
    return map;
  }, [classes]);

  // ── occupied teacher IDs (teachers already assigned to a class this year) ─────
  const occupiedTeacherIds = useMemo(() => {
    const ids = new Set();
    classes.forEach(cls => (cls.teacherIds || []).forEach(t => ids.add(t._id || t)));
    return ids;
  }, [classes]);


  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <RoleLayout
      title="Quản lý Lớp Học"
      description="Quản lý khối lớp và danh sách lớp học."
      menuItems={getMenuItems()}
      activeKey="classes"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
      userName={user?.fullName || user?.username || 'Admin'}
      userAvatar={user?.avatar}
    >
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* ── Header gradient banner ──────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', borderRadius: 2, position: 'relative' }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          {activeAcademicYear && (
            <Chip
              label={`Năm học: ${activeAcademicYear.yearName}`}
              size="small"
              sx={{ position: 'absolute', top: 12, right: 16, bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 600, fontSize: '0.72rem', border: '1px solid rgba(255,255,255,0.3)' }}
            />
          )}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            {selectedGrade && (
              <IconButton
                size="small"
                onClick={() => { setSelectedGrade(null); setSearchTerm(''); }}
                sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            )}
            <ClassIcon sx={{ color: 'white', fontSize: 28 }} />
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography
                  variant="body2"
                  sx={{ color: selectedGrade ? 'rgba(255,255,255,0.65)' : 'white', fontWeight: selectedGrade ? 400 : 700, cursor: selectedGrade ? 'pointer' : 'default', '&:hover': selectedGrade ? { color: '#fff' } : {} }}
                  onClick={() => selectedGrade && (setSelectedGrade(null), setSearchTerm(''))}
                >
                  Danh sách khối lớp
                </Typography>
                {selectedGrade && (
                  <>
                    <ChevronRightIcon sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }} />
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 700 }}>
                      Khối {selectedGrade.gradeName}
                    </Typography>
                  </>
                )}
              </Stack>
              <Typography variant="caption" color="rgba(255,255,255,0.75)" mt={0.25}>
                {selectedGrade
                  ? `${classesInSelectedGrade.length} lớp học thuộc khối ${selectedGrade.gradeName}`
                  : `${gradeList.length} khối lớp · ${classes.length} lớp học`}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* GRADE LIST VIEW                                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {!selectedGrade && (
        <Box>
          {/* ── Toolbar ─────────────────────────────────────────────────── */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} mb={2.5}>
            <TextField
              placeholder="Tìm theo tên khối, độ tuổi"
              size="small"
              value={gradeSearchTerm}
              onChange={e => setGradeSearchTerm(e.target.value)}
              sx={{ flex: 1, maxWidth: 320, bgcolor: '#fff', borderRadius: 1.5 }}
            />
            <Stack direction="row" spacing={1} ml="auto">
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<RefreshIcon />}
                onClick={() => { fetchGradeList(); fetchClasses(); }}
                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 500 }}
              >
                Tải lại
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => openGradeDialog('create')}
                sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
              >
                Thêm khối mới
              </Button>
            </Stack>
          </Stack>

          {gradeError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGradeError(null)}>{gradeError}</Alert>}

          {gradeLoading || loading ? (
            <Stack alignItems="center" py={8}>
              <CircularProgress size={32} sx={{ color: '#6366f1' }} />
              <Typography variant="body2" color="text.secondary" mt={1.5}>Đang tải...</Typography>
            </Stack>
          ) : gradeList.length === 0 ? (
            <Stack alignItems="center" py={8} spacing={1}>
              <LayersIcon sx={{ fontSize: 48, color: 'grey.300' }} />
              <Typography variant="body2" color="text.secondary">Chưa có khối lớp nào.</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => openGradeDialog('create')}
                size="small"
                sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, mt: 1, textTransform: 'none' }}
              >
                Tạo khối lớp đầu tiên
              </Button>
            </Stack>
          ) : (
            <Grid container spacing={2.5}>
              {gradeList
                .filter(g => {
                  const term = gradeSearchTerm.toLowerCase();
                  if (!term) return true;
                  const ageLabel = g.minAge || g.maxAge
                    ? `${g.minAge || 0} ${g.maxAge || 0} tháng`
                    : '';
                  return (
                    g.gradeName.toLowerCase().includes(term) ||
                    (g.description || '').toLowerCase().includes(term) ||
                    ageLabel.includes(term)
                  );
                })
                .map((g, idx) => {
                  const color = GRADE_COLORS[idx % GRADE_COLORS.length];
                  const classCount = classCountByGrade[String(g._id)] || 0;
                  const ageLabel = g.minAge || g.maxAge
                    ? `${g.minAge || 0} – ${g.maxAge || 0} tháng`
                    : 'Chưa cập nhật';
                  const teacherNames = (g.teacherNames || []).slice(0, 4);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={g._id}>
                      <Paper
                        elevation={2}
                        sx={{
                          borderRadius: 2,
                          overflow: 'hidden',
                          transition: 'transform 0.18s, box-shadow 0.18s',
                          '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 },
                        }}
                      >
                        {/* Colored header */}
                        <Box
                          sx={{
                            bgcolor: color.header,
                            px: 2.5,
                            py: 1.75,
                            cursor: 'pointer',
                          }}
                          onClick={() => { setSelectedGrade(g); setSearchTerm(''); }}
                        >
                          <Typography variant="h6" fontWeight={700} color="#fff" noWrap>
                            Khối {g.gradeName}
                          </Typography>
                        </Box>

                        {/* Body */}
                        <Box
                          sx={{ px: 2.5, py: 2, bgcolor: '#fff', cursor: 'pointer' }}
                          onClick={() => { setSelectedGrade(g); setSearchTerm(''); }}
                        >
                          <Stack spacing={0.75}>
                            <Stack direction="row" spacing={0.5}>
                              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90 }}>Độ tuổi:</Typography>
                              <Typography variant="body2" fontWeight={600}>{ageLabel}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.5}>
                              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90 }}>Số lớp:</Typography>
                              <Typography variant="body2" fontWeight={600}>{classCount}/{g.maxClasses ?? 10}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.5}>
                              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90 }}>Tổng số trẻ:</Typography>
                              <Typography variant="body2" fontWeight={600}>{g.totalStudents ?? 0}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.5} alignItems="flex-start">
                              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90, flexShrink: 0 }}>Giáo viên:</Typography>
                              <Typography variant="body2" fontWeight={600} sx={{ color: teacherNames.length ? 'text.primary' : 'text.disabled' }}>
                                {teacherNames.length
                                  ? teacherNames.join(', ') + (g.teacherNames?.length > 4 ? '...' : '')
                                  : 'Chưa phân công'}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Box>

                        {/* Footer */}
                        <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#fff', borderTop: '1px solid', borderColor: 'divider' }}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => { setSelectedGrade(g); setSearchTerm(''); }}
                              sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#2563eb', color: '#2563eb', '&:hover': { borderColor: '#1d4ed8', bgcolor: '#eff6ff' }, borderRadius: 1.5, fontSize: '0.8rem' }}
                            >
                              Quản lý lớp →
                            </Button>
                            <Stack direction="row" spacing={0.5} onClick={e => e.stopPropagation()}>
                              <Tooltip title="Chỉnh sửa">
                                <IconButton
                                  size="small"
                                  onClick={() => openGradeDialog('edit', g)}
                                  sx={{ bgcolor: '#fef3c7', color: '#d97706', '&:hover': { bgcolor: '#fde68a' }, borderRadius: 1 }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Xóa">
                                <IconButton
                                  size="small"
                                  onClick={() => setGradeDeleteConfirm(g)}
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
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* CLASSES IN GRADE VIEW                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {selectedGrade && (
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* Sub-header */}
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" spacing={1.5}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 32, height: 32, borderRadius: 1.5,
                      bgcolor: GRADE_COLORS[gradeList.findIndex(g => g._id === selectedGrade._id) % GRADE_COLORS.length]?.bg || '#ede9fe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <LayersIcon sx={{ fontSize: 18, color: GRADE_COLORS[gradeList.findIndex(g => g._id === selectedGrade._id) % GRADE_COLORS.length]?.icon || '#7c3aed' }} />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Khối {selectedGrade.gradeName}
                  </Typography>
                  <Chip label={`${classesInSelectedGrade.length}/${selectedGrade.maxClasses ?? 10} lớp`} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                </Stack>
                {selectedGrade.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 5 }}>
                    {selectedGrade.description}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  placeholder="Tìm tên lớp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ minWidth: 200 }}
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
                  onClick={() => openCreateDialog(selectedGrade._id)}
                  sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, borderRadius: 1.5, textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  Thêm lớp
                </Button>
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ p: 3 }}>
            {loading ? (
              <Stack alignItems="center" py={6}>
                <CircularProgress size={32} sx={{ color: '#6366f1' }} />
                <Typography variant="body2" color="text.secondary" mt={1.5}>Đang tải...</Typography>
              </Stack>
            ) : filteredClassesInGrade.length === 0 ? (
              <Stack alignItems="center" py={8} spacing={1}>
                <ClassIcon sx={{ fontSize: 48, color: 'grey.300' }} />
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'Không tìm thấy lớp nào' : `Chưa có lớp nào trong khối ${selectedGrade.gradeName}`}
                </Typography>
                {!searchTerm && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    size="small"
                    onClick={() => openCreateDialog(selectedGrade._id)}
                    sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, mt: 1, textTransform: 'none' }}
                  >
                    Tạo lớp đầu tiên
                  </Button>
                )}
              </Stack>
            ) : (
              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Tên lớp</TableCell>
                      <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Năm học</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, py: 1.5 }}>Sĩ số tối đa</TableCell>
                      <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Giáo viên</TableCell>
                      <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Phòng học</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, py: 1.5 }}>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredClassesInGrade.map((cls) => (
                      <TableRow key={cls._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{cls.className}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{cls.academicYearId?.yearName || 'N/A'}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={cls.maxStudents || 0} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.75rem', borderColor: 'grey.400' }} />
                        </TableCell>
                        <TableCell>
                          {cls.teacherIds?.length > 0 ? (
                            <Stack spacing={0.25}>
                              {cls.teacherIds.map((t, i) => (
                                <Stack key={t._id || i} direction="row" alignItems="center" spacing={0.5}>
                                  <PersonIcon sx={{ fontSize: 13, color: '#7c3aed' }} />
                                  <Typography variant="caption" fontWeight={500}>{t.userId?.fullName || t.fullName || t}</Typography>
                                </Stack>
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.disabled">Chưa có</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {cls.roomId ? (
                            <Stack spacing={0}>
                              <Typography variant="caption" fontWeight={600}>{cls.roomId.roomName}</Typography>
                              <Typography variant="caption" color="text.secondary">Tầng {cls.roomId.floor}</Typography>
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.disabled">Chưa có</Typography>
                          )}
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
                              onClick={() => openEditDialog(cls)}
                              sx={{ bgcolor: 'grey.100', color: 'text.secondary', boxShadow: 'none', '&:hover': { bgcolor: 'grey.200', boxShadow: 'none' }, borderRadius: 1.5, textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, py: 0.5 }}
                            >
                              Sửa
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<DeleteIcon sx={{ fontSize: '0.875rem !important' }} />}
                              onClick={() => setClassDeleteConfirm(cls)}
                              sx={{ bgcolor: 'rgba(220,38,38,0.08)', color: '#dc2626', boxShadow: 'none', '&:hover': { bgcolor: 'rgba(220,38,38,0.18)', boxShadow: 'none' }, borderRadius: 1.5, textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, py: 0.5 }}
                            >
                              Xóa
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Paper>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* DIALOGS                                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

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
            <TextField
              label="Số lớp tối đa"
              required
              fullWidth
              size="small"
              type="number"
              value={gradeForm.maxClasses}
              onChange={(e) => setGradeForm((f) => ({ ...f, maxClasses: e.target.value }))}
              error={!!gradeFormErrors.maxClasses}
              helperText={gradeFormErrors.maxClasses || 'Tối đa 10 lớp trong một khối'}
              inputProps={{ min: 1, max: 10 }}
            />
            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Độ tuổi tối thiểu (tháng)"
                fullWidth
                size="small"
                type="number"
                value={gradeForm.minAge}
                onChange={(e) => setGradeForm((f) => ({ ...f, minAge: e.target.value }))}
                error={!!gradeFormErrors.minAge}
                helperText={gradeFormErrors.minAge || 'Ví dụ: 18'}
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Độ tuổi tối đa (tháng)"
                fullWidth
                size="small"
                type="number"
                value={gradeForm.maxAge}
                onChange={(e) => setGradeForm((f) => ({ ...f, maxAge: e.target.value }))}
                error={!!gradeFormErrors.maxAge}
                helperText={gradeFormErrors.maxAge || 'Ví dụ: 36'}
                inputProps={{ min: 0 }}
              />
            </Stack>
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
          {fetchingDialogData && (
            <Stack alignItems="center" py={3}><CircularProgress size={28} /></Stack>
          )}
          {!fetchingDialogData && noActiveYear && (
            <Alert
              severity="warning"
              icon={<WarningAmberIcon />}
              sx={{ mb: 2 }}
              action={
                <Button size="small" color="inherit" onClick={() => { setDialogOpen(false); navigate('/school-admin/academic-years'); }}>
                  Tạo năm học
                </Button>
              }
            >
              Chưa có năm học đang hoạt động. Vui lòng tạo năm học mới trước khi tạo lớp.
            </Alert>
          )}
          {!fetchingDialogData && dialogError && (
            <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>
          )}
          {!fetchingDialogData && currentAcademicYear && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Lớp sẽ được tạo trong năm học: <strong>{currentAcademicYear.yearName}</strong>
            </Alert>
          )}
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
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>{formErrors.gradeId}</Typography>
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
              <TeacherSelect
                availability={createAvailability}
                loading={createAvailLoading}
                value={form.teacherIds}
                onChange={(val) => setForm(f => ({ ...f, teacherIds: val }))}
                error={formErrors.teacherIds}
                helperText={`Đã chọn: ${form.teacherIds.length}/2 giáo viên (bắt buộc chọn đủ 2)`}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Phòng học</InputLabel>
                <Select
                  label="Phòng học"
                  value={form.roomId}
                  onChange={(e) => setForm(f => ({ ...f, roomId: e.target.value }))}
                >
                  <MenuItem value=""><em>Chưa chọn phòng</em></MenuItem>
                  {rooms.map(r => {
                    const occupied = r.occupiedByClass && r.occupiedByClass !== form.className;
                    const unavailable = r.status !== 'available';
                    const disabled = !!occupied || unavailable;
                    const label = occupied
                      ? ` (Đang dùng bởi lớp ${r.occupiedByClass})`
                      : r.status === 'in_use' ? ' (Đang sử dụng)'
                      : r.status === 'maintenance' ? ' (Bảo trì)'
                      : '';
                    return (
                      <MenuItem key={r._id} value={r._id} disabled={disabled}>
                        {r.roomName} — Tầng {r.floor}{label}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={dialogLoading}>Hủy</Button>
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

      {/* Edit Class Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Chỉnh sửa lớp học</DialogTitle>
        <DialogContent dividers>
          {editFetchingData && (
            <Stack alignItems="center" py={3}><CircularProgress size={28} /></Stack>
          )}
          {editDialogError && <Alert severity="error" sx={{ mb: 2 }}>{editDialogError}</Alert>}
          {!editFetchingData && (
            <Stack spacing={2.5} mt={1}>
              <TextField
                label="Tên lớp"
                required
                fullWidth
                size="small"
                value={editForm.className}
                onChange={(e) => setEditForm((f) => ({ ...f, className: e.target.value }))}
                error={!!editFormErrors.className}
                helperText={editFormErrors.className || `${editForm.className.length}/10 ký tự`}
                inputProps={{ maxLength: 10 }}
              />
              <FormControl fullWidth size="small" required error={!!editFormErrors.gradeId}>
                <InputLabel>Khối lớp</InputLabel>
                <Select
                  label="Khối lớp"
                  value={editForm.gradeId}
                  onChange={(e) => setEditForm((f) => ({ ...f, gradeId: e.target.value }))}
                >
                  {grades.map((g) => (
                    <MenuItem key={g._id} value={g._id}>{g.gradeName}</MenuItem>
                  ))}
                </Select>
                {editFormErrors.gradeId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>{editFormErrors.gradeId}</Typography>
                )}
              </FormControl>
              <TextField
                label="Sĩ số tối đa"
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 0, max: 30 }}
                value={editForm.maxStudents}
                onChange={(e) => setEditForm((f) => ({ ...f, maxStudents: e.target.value }))}
                error={!!editFormErrors.maxStudents}
                helperText={editFormErrors.maxStudents || 'Tối đa 30 học sinh'}
              />
              <TeacherSelect
                availability={editAvailability}
                loading={editAvailLoading}
                value={editForm.teacherIds}
                onChange={(val) => setEditForm(f => ({ ...f, teacherIds: val }))}
                error={editFormErrors.teacherIds}
                helperText={`Đã chọn: ${editForm.teacherIds.length}/2 giáo viên`}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Phòng học</InputLabel>
                <Select
                  label="Phòng học"
                  value={editForm.roomId}
                  onChange={(e) => setEditForm(f => ({ ...f, roomId: e.target.value }))}
                >
                  <MenuItem value=""><em>Chưa chọn phòng</em></MenuItem>
                  {rooms.map(r => {
                    const occupied = r.occupiedByClass && r.occupiedByClass !== editForm.className;
                    const unavailable = r.status !== 'available';
                    const disabled = !!occupied || unavailable;
                    const label = occupied
                      ? ` (Đang dùng bởi lớp ${r.occupiedByClass})`
                      : r.status === 'in_use' ? ' (Đang sử dụng)'
                      : r.status === 'maintenance' ? ' (Bảo trì)'
                      : '';
                    return (
                      <MenuItem key={r._id} value={r._id} disabled={disabled}>
                        {r.roomName} — Tầng {r.floor}{label}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit" disabled={editDialogLoading}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleUpdateClass}
            disabled={editDialogLoading || editFetchingData}
            sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, textTransform: 'none', fontWeight: 600 }}
          >
            {editDialogLoading ? <CircularProgress size={18} color="inherit" /> : 'Lưu thay đổi'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Class Confirm Dialog */}
      <Dialog open={!!classDeleteConfirm} onClose={() => setClassDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xóa lớp học</DialogTitle>
        <DialogContent>
          <Typography>Bạn chắc chắn muốn xóa lớp <strong>{classDeleteConfirm?.className}</strong>?</Typography>
          <Typography variant="caption" color="text.secondary">Chỉ có thể xóa khi lớp không có học sinh nào.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setClassDeleteConfirm(null)} color="inherit" disabled={classDeleteLoading}>Hủy</Button>
          <Button variant="contained" color="error" onClick={handleDeleteClass} disabled={classDeleteLoading} sx={{ textTransform: 'none', fontWeight: 600 }}>
            {classDeleteLoading ? <CircularProgress size={18} color="inherit" /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}

export default ClassList;
