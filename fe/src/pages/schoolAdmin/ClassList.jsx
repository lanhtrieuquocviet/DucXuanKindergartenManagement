import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Grid,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Class as ClassIcon,
  ArrowBack as ArrowBackIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

// Sub-components
import GradeCard from './ClassManagement/GradeCard';
import StudentSummary from './ClassManagement/StudentSummary';
import ClassTable from './ClassManagement/ClassTable';
import GradeDialog from './ClassManagement/GradeDialog';
import ClassDialog from './ClassManagement/ClassDialog';

export default function ClassList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, isInitializing } = useAuth();

  // Data State
  const [classes, setClasses] = useState([]);
  const [gradeList, setGradeList] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter State
  const [gradeSearchTerm, setGradeSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [classSearchTerm, setClassSearchTerm] = useState('');

  // Dialog States
  const [gradeDialog, setGradeDialog] = useState({ open: false, mode: 'create', data: null });
  const [gradeForm, setGradeForm] = useState({ gradeName: '', description: '', maxClasses: 10, ageRange: '', headTeacherId: '', staticBlockId: '' });
  const [gradeErrors, setGradeErrors] = useState({});
  const [gradeSubmitting, setGradeSubmitting] = useState(false);

  const [classDialog, setClassDialog] = useState({ open: false, mode: 'create', data: null });
  const [classForm, setClassForm] = useState({ className: '', gradeId: '', maxStudents: '', teacherIds: [], roomId: '' });
  const [classErrors, setClassErrors] = useState({});
  const [classLoading, setClassLoading] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState({ type: null, target: null, loading: false });

  // Shared Data for Dialogs
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [staticBlocks, setStaticBlocks] = useState([]);
  const [teacherAvail, setTeacherAvail] = useState([]);
  const [teacherAvailLoading, setTeacherAvailLoading] = useState(false);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    refreshAll();
  }, [user, isInitializing]); // eslint-disable-line

  useEffect(() => {
    const gradeId = searchParams.get('gradeId');
    if (!gradeId || gradeList.length === 0) return;
    const found = gradeList.find(g => g._id === gradeId);
    if (found) setSelectedGrade(found);
  }, [gradeList, searchParams]);

  // Fetch teacher availability when className/classId changes
  useEffect(() => {
    if (!classDialog.open) return;
    const timer = setTimeout(async () => {
      setTeacherAvailLoading(true);
      try {
        const params = new URLSearchParams();
        if (classForm.className.trim()) params.set('className', classForm.className.trim());
        if (classDialog.mode === 'edit' && classDialog.data?._id) params.set('excludeClassId', classDialog.data._id);
        const res = await get(`${ENDPOINTS.SCHOOL_ADMIN.TEACHER_AVAILABILITY}?${params.toString()}`);
        setTeacherAvail(res.data || []);
      } catch (_) {
        setTeacherAvail([]);
      } finally {
        setTeacherAvailLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [classForm.className, classDialog.open, classDialog.mode, classDialog.data]);

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const refreshAll = () => {
    fetchClasses();
    fetchGrades();
    fetchStudents();
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await get(ENDPOINTS.CLASSES.LIST);
      setClasses(res.data || []);
      setActiveAcademicYear(res.academicYear || null);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách lớp học');
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      const res = await get(ENDPOINTS.GRADES.LIST);
      setGradeList(res.data || []);
    } catch (_) {}
  };

  const fetchStudents = async () => {
    try {
      const res = await get(ENDPOINTS.STUDENTS.LIST);
      setAllStudents(res.data || []);
    } catch (_) {}
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleOpenGradeDialog = async (mode, data = null) => {
    setGradeErrors({});
    setGradeForm(data ? {
      gradeName: data.gradeName,
      description: data.description || '',
      maxClasses: data.maxClasses ?? 10,
      ageRange: data.ageRange || '',
      headTeacherId: data.headTeacherId?._id || data.headTeacherId || '',
      staticBlockId: data.staticBlockId?._id || data.staticBlockId || '',
    } : { gradeName: '', description: '', maxClasses: 10, ageRange: '', headTeacherId: '', staticBlockId: '' });
    setGradeDialog({ open: true, mode, data });

    if (teachers.length === 0) get(ENDPOINTS.SCHOOL_ADMIN.TEACHERS).then(res => setTeachers(res.data || []));
    if (staticBlocks.length === 0) get(ENDPOINTS.STATIC_BLOCKS.LIST).then(res => setStaticBlocks(res.data || []));
  };

  const handleGradeSubmit = async () => {
    try {
      setGradeSubmitting(true);
      if (gradeDialog.mode === 'create') {
        await post(ENDPOINTS.GRADES.CREATE, gradeForm);
      } else {
        await put(ENDPOINTS.GRADES.UPDATE(gradeDialog.data._id), gradeForm);
      }
      setGradeDialog({ open: false, mode: 'create', data: null });
      fetchGrades();
    } catch (err) {
      setGradeErrors({ submit: err.data?.message || err.message });
    } finally {
      setGradeSubmitting(false);
    }
  };

  const handleOpenClassDialog = (mode, data = null) => {
    setClassErrors({});
    setClassForm(data ? {
      className: data.className || '',
      gradeId: data.gradeId?._id || data.gradeId || '',
      maxStudents: data.maxStudents || '',
      teacherIds: (data.teacherIds || []).map(t => t._id || t),
      roomId: data.roomId?._id || data.roomId || '',
    } : {
      className: '',
      gradeId: selectedGrade?._id || '',
      maxStudents: '',
      teacherIds: [],
      roomId: '',
    });
    setClassDialog({ open: true, mode, data });

    if (teachers.length === 0) get(ENDPOINTS.SCHOOL_ADMIN.TEACHERS).then(res => setTeachers(res.data || []));
    if (rooms.length === 0) get(ENDPOINTS.SCHOOL_ADMIN.CLASSROOMS).then(res => setRooms(res.data || []));
  };

  const handleClassSubmit = async () => {
    try {
      setClassLoading(true);
      const payload = {
        ...classForm,
        className: classForm.className.trim(),
        maxStudents: classForm.maxStudents ? Number(classForm.maxStudents) : 0,
      };
      if (classDialog.mode === 'create') {
        await post(ENDPOINTS.CLASSES.CREATE, payload);
      } else {
        await put(ENDPOINTS.CLASSES.UPDATE(classDialog.data._id), payload);
      }
      setClassDialog({ open: false, mode: 'create', data: null });
      fetchClasses();
    } catch (err) {
      setClassErrors({ submit: err.data?.message || err.message });
    } finally {
      setClassLoading(false);
    }
  };

  const handleDelete = async () => {
    const { type, target } = deleteDialog;
    try {
      setDeleteDialog(prev => ({ ...prev, loading: true }));
      if (type === 'grade') {
        await del(ENDPOINTS.GRADES.DELETE(target._id));
        if (selectedGrade?._id === target._id) setSelectedGrade(null);
        fetchGrades();
      } else {
        await del(ENDPOINTS.CLASSES.DELETE(target._id));
        fetchClasses();
      }
      setDeleteDialog({ type: null, target: null, loading: false });
    } catch (err) {
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // ── Computed ───────────────────────────────────────────────────────────────
  const classCountByGrade = useMemo(() => {
    const map = {};
    classes.forEach(c => {
      const id = String(c.gradeId?._id || c.gradeId || '');
      map[id] = (map[id] || 0) + 1;
    });
    return map;
  }, [classes]);

  const filteredGrades = useMemo(() => {
    const term = gradeSearchTerm.toLowerCase();
    return gradeList.filter(g => 
      g.gradeName.toLowerCase().includes(term) || 
      (g.description || '').toLowerCase().includes(term)
    );
  }, [gradeList, gradeSearchTerm]);

  const filteredClasses = useMemo(() => {
    if (!selectedGrade) return [];
    return classes.filter(c => {
      const gId = String(c.gradeId?._id || c.gradeId || '');
      const matchesGrade = gId === String(selectedGrade._id);
      const matchesSearch = c.className.toLowerCase().includes(classSearchTerm.toLowerCase());
      return matchesGrade && matchesSearch;
    });
  }, [classes, selectedGrade, classSearchTerm]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Paper
          elevation={0}
          sx={{ 
            mb: 4, p: { xs: 3, sm: 4 }, 
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
            borderRadius: 4, position: 'relative',
            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)', color: '#fff',
            overflow: 'hidden'
          }}
        >
          {activeAcademicYear && (
            <Chip
              label={`Năm học: ${activeAcademicYear.yearName}`}
              size="small"
              sx={{ 
                position: { xs: 'relative', sm: 'absolute' }, 
                top: { sm: 20 }, 
                right: { sm: 24 }, 
                mb: { xs: 2, sm: 0 },
                display: 'inline-flex',
                bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', 
                fontWeight: 700, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.3)'
              }}
            />
          )}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            alignItems={{ xs: 'flex-start', sm: 'center' }} 
            spacing={{ xs: 2, sm: 3 }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              {selectedGrade && (
                <IconButton
                  size="small"
                  onClick={() => setSelectedGrade(null)}
                  sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                >
                  <ArrowBackIcon />
                </IconButton>
              )}
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 } }}>
                <ClassIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
              </Avatar>
            </Stack>
            
            <Box>
              <Stack direction="row" alignItems="center" flexWrap="wrap" spacing={1}>
                <Typography
                  variant="h4"
                  sx={{ 
                    fontWeight: 900, cursor: selectedGrade ? 'pointer' : 'default',
                    fontSize: { xs: '1.5rem', sm: '2.125rem' },
                    color: selectedGrade ? 'rgba(255,255,255,0.7)' : '#fff'
                  }}
                  onClick={() => selectedGrade && setSelectedGrade(null)}
                >
                  Danh sách khối & lớp
                </Typography>
                {selectedGrade && (
                  <>
                    <ChevronRightIcon sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: 24, sm: 32 } }} />
                    <Typography variant="h4" sx={{ fontWeight: 900, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                      Khối {selectedGrade.gradeName}
                    </Typography>
                  </>
                )}
              </Stack>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5, fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                {selectedGrade 
                  ? `${filteredClasses.length} lớp học đang hoạt động trong khối ${selectedGrade.gradeName}`
                  : `${gradeList.length} khối lớp · ${classes.length} lớp học trên toàn trường`}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        {!selectedGrade ? (
          <Box>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              mb={4} 
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <TextField
                placeholder="Tìm khối lớp, độ tuổi..."
                size="small"
                value={gradeSearchTerm}
                onChange={e => setGradeSearchTerm(e.target.value)}
                sx={{ 
                  width: { xs: '100%', sm: 320 }, 
                  bgcolor: '#fff', 
                  '& .MuiOutlinedInput-root': { borderRadius: 3 } 
                }}
              />
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />} 
                onClick={refreshAll} 
                sx={{ borderRadius: 2, fontWeight: 600, py: 1 }}
              >
                Tải lại
              </Button>
              <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />
              <Button 
                variant="contained" 
                color="inherit" 
                onClick={() => navigate('/school-admin/static-blocks')} 
                sx={{ borderRadius: 2, fontWeight: 600, py: 1 }}
              >
                Cài đặt loại Khối
              </Button>
              <Button 
                variant="contained" 
                onClick={() => handleOpenGradeDialog('create')} 
                sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#2563eb', py: 1 }}
              >
                Thêm khối lớp
              </Button>
            </Stack>

            {loading ? (
              <Box sx={{ py: 12, textAlign: 'center' }}><CircularProgress size={40} thickness={4} /></Box>
            ) : (
            <Box 
              sx={{ 
                overflowX: { xs: 'auto', xl: 'visible' }, 
                pb: 2, 
                display: 'block', // Always block container, use flex on the Grid
                '&::-webkit-scrollbar': { height: 6 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 3 }
              }}
            >
              <Grid 
                container 
                spacing={3} 
                sx={{ 
                  flexWrap: { xs: 'nowrap', xl: 'wrap' }, 
                  width: '100%',
                  display: 'flex'
                }}
              >
                {filteredGrades.map((g, idx) => (
                  <GradeCard 
                    key={g._id} 
                    grade={g} 
                    index={idx} 
                    classCount={classCountByGrade[g._id] || 0}
                    onSelect={setSelectedGrade}
                  />
                ))}
              </Grid>
            </Box>
            )}

            <StudentSummary 
              students={allStudents} 
              activeAcademicYear={activeAcademicYear} 
              onRefresh={fetchStudents}
              loading={loading}
            />
          </Box>
        ) : (
          <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc' }}>
              <Stack 
                direction={{ xs: 'column', md: 'row' }} 
                spacing={2} 
                justifyContent="space-between" 
                alignItems={{ xs: 'stretch', md: 'center' }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <TextField
                    placeholder="Tìm tên lớp..."
                    size="small"
                    value={classSearchTerm}
                    onChange={e => setClassSearchTerm(e.target.value)}
                    sx={{ width: { xs: '100%', sm: 240 }, bgcolor: '#fff' }}
                  />
                  <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchClasses} sx={{ borderRadius: 2, py: 1 }}>Tải lại</Button>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: { xs: 1, md: 0 } }}>
                  <Button variant="outlined" color="primary" onClick={() => handleOpenGradeDialog('edit', selectedGrade)} sx={{ borderRadius: 2, fontWeight: 600, py: 1 }}>Sửa cấu hình khối</Button>
                  <Button variant="contained" onClick={() => handleOpenClassDialog('create')} sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#2563eb', py: 1 }}>Thêm lớp học</Button>
                </Stack>
              </Stack>
            </Box>

            <ClassTable 
              classes={filteredClasses}
              loading={loading}
              onViewStudents={(id) => navigate(`/school-admin/classes/${id}/students`)}
              onEdit={(cls) => handleOpenClassDialog('edit', cls)}
              onDelete={(cls) => setDeleteDialog({ type: 'class', target: cls, loading: false })}
              onAdd={() => handleOpenClassDialog('create')}
            />
          </Paper>
        )}
      </Box>

      {/* Dialogs */}
      <GradeDialog 
        {...gradeDialog}
        form={gradeForm}
        setForm={setGradeForm}
        errors={gradeErrors}
        submitting={gradeSubmitting}
        onSubmit={handleGradeSubmit}
        staticBlocks={staticBlocks}
        teachers={teachers}
        onClose={() => setGradeDialog({ open: false, mode: 'create', data: null })}
      />

      <ClassDialog 
        {...classDialog}
        form={classForm}
        setForm={setClassForm}
        errors={classErrors}
        loading={classLoading}
        fetchingData={loading}
        onSubmit={handleClassSubmit}
        grades={gradeList}
        rooms={rooms}
        academicYear={activeAcademicYear}
        noActiveYear={!activeAcademicYear && !loading}
        teacherAvailability={teacherAvail}
        teacherAvailLoading={teacherAvailLoading}
        onNavigateToYearSetup={() => navigate('/school-admin/academic-years')}
        onClose={() => setClassDialog({ open: false, mode: 'create', data: null })}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog.type} onClose={() => !deleteDialog.loading && setDeleteDialog({ type: null, target: null, loading: false })}>
        <DialogTitle sx={{ fontWeight: 800 }}>Xác nhận xóa</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Bạn có chắc chắn muốn xóa {deleteDialog.type === 'grade' ? 'khối lớp' : 'lớp học'} 
            <strong> {deleteDialog.target?.gradeName || deleteDialog.target?.className}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteDialog({ type: null, target: null, loading: false })} disabled={deleteDialog.loading}>Hủy bỏ</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleteDialog.loading} sx={{ borderRadius: 2, fontWeight: 700 }}>
            {deleteDialog.loading ? <CircularProgress size={18} color="inherit" /> : 'Xác nhận xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
