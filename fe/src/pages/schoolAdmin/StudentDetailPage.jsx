import {
  Assessment as AssessmentIcon,
  ArrowBack as BackIcon,
  CalendarMonth as CalendarIcon,
  Celebration as CelebrationIcon,
  MonitorHeart as HealthIcon,
  LocalHospital as HospitalIcon,
  EditNote as NoteTabIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS, get, patch } from '../../service/api';

// ── helpers ─────────────────────────────────────────────────────
function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years === 0) return `${months} tháng`;
  if (months === 0) return `${years} tuổi`;
  return `${years} tuổi ${months} tháng`;
}
function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('vi-VN'); }
function genderLabel(g) { if (g === 'male') return 'Nam'; if (g === 'female') return 'Nữ'; return 'Khác'; }
function initials(n) { return n ? n.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() : '?'; }

// ── Timeline Item Component ────────────────────────────────────────
const TimelineItem = ({ event }) => {
  const cfg = {
    promotion: { icon: <SchoolIcon />, color: '#6366f1', bg: '#eef2ff' },
    health: { icon: <HospitalIcon />, color: '#0891b2', bg: '#ecfeff' },
    note: { icon: <NoteTabIcon />, color: '#d97706', bg: '#fffbeb' },
    graduation: { icon: <CelebrationIcon />, color: '#e11d48', bg: '#fff1f2' },
    assessment: { icon: <AssessmentIcon />, color: '#16a34a', bg: '#f0fdf4' },
    attendance: { icon: <CalendarIcon />, color: '#4b5563', bg: '#f3f4f6' },
  }[event.type] || { icon: <NoteTabIcon />, color: '#4b5563', bg: '#f3f4f6' };

  return (
    <Box sx={{ position: 'relative', pl: 6, pb: 4, '&:last-child': { pb: 0 } }}>
      {/* Vertical Line */}
      <Box sx={{
        position: 'absolute', left: 24, top: 40, bottom: 0, width: 2,
        bgcolor: '#f1f5f9', zIndex: 0,
        display: 'block', content: '""'
      }} />

      {/* Icon Node */}
      <Box sx={{
        position: 'absolute', left: 8, top: 0, width: 34, height: 34,
        borderRadius: '50%', bgcolor: cfg.bg, color: cfg.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '4px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        zIndex: 1
      }}>
        {cfg.icon}
      </Box>

      <Box>
        <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          {fmtDate(event.date)}
        </Typography>
        <Paper elevation={0} sx={{ mt: 1, p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.primary" mb={0.5}>
            {event.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {event.content}
          </Typography>
          {event.metadata && (
            <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap">
              {Object.entries(event.metadata).map(([k, v]) => (
                <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
              ))}
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

// ── TabTimeline ────────────────────────────────────────────────────
function TabTimeline({ student, studentId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would be a single API call for timeline data
    // For now, we simulate by fetching and merging
    const load = async () => {
      setLoading(true);
      try {
        const [healthRes, notesRes, evalRes] = await Promise.all([
          get(ENDPOINTS.STUDENTS.ADMIN_HEALTH_LATEST(studentId)).catch(() => ({})),
          get(ENDPOINTS.STUDENTS.ADMIN_NOTES(studentId)).catch(() => ({ data: [] })),
          get(ENDPOINTS.STUDENTS.ADMIN_EVALUATIONS(studentId)).catch(() => ({ data: [] })),
        ]);

        const timeline = [];

        // Add Mock Academic Milestones
        if (student.classId) {
          timeline.push({
            id: 'milestone-1',
            type: 'promotion',
            date: student.createdAt || new Date(),
            title: `Nhập học - Khối ${student.classId.className?.split(' ')[0]}`,
            content: `Bắt đầu hành trình tại trường tại lớp ${student.classId.className}.`
          });
        }

        // Add Health Milestone
        if (healthRes.data) {
          timeline.push({
            id: 'health-1',
            type: 'health',
            date: healthRes.data.checkDate,
            title: 'Khám sức khỏe định kỳ',
            content: `Cân nặng: ${healthRes.data.weight}kg, Chiều cao: ${healthRes.data.height}cm. Tình trạng chung: ${healthRes.data.generalStatus}.`,
            metadata: { BMI: (healthRes.data.weight / ((healthRes.data.height / 100) ** 2)).toFixed(1) }
          });
        }

        // Add Teacher Notes
        (notesRes.data || []).forEach(n => {
          timeline.push({
            id: n._id,
            type: 'note',
            date: n.createdAt,
            title: 'Nhận xét từ giáo viên',
            content: n.content
          });
        });

        // Add Academic Evaluations
        (evalRes.data || []).forEach(e => {
          if (e.academicEvaluation || e.evaluationNote) {
            timeline.push({
              id: e._id,
              type: 'assessment',
              date: e.updatedAt || e.createdAt,
              title: `Đánh giá định kỳ - ${e.academicYearId?.yearName || 'Năm học'}`,
              content: e.evaluationNote || (e.academicEvaluation ? `Kết quả: ${e.academicEvaluation.toUpperCase()}` : 'Chưa có nhận xét chi tiết.'),
              metadata: e.academicEvaluation ? { 'Kết quả': e.academicEvaluation } : null
            });
          }
        });

        // Sort by date descending
        setEvents(timeline.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId, student]);

  if (loading) return <Box sx={{ p: 4 }}><CircularProgress /></Box>;
  if (events.length === 0) return <Typography sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>Chưa có dấu mốc nào ghi nhận.</Typography>;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 2 }}>
      {events.map(event => (
        <TimelineItem key={event.id} event={event} />
      ))}
    </Box>
  );
}

// ── TabHoSo ──────────────────────────────────────────────────────
function TabHoSo({ student }) {
  const parentRoles = (student.parentId?.roles || []).map(r => r.roleName || r);
  const [isHeadParent, setIsHeadParent] = useState(parentRoles.includes('HeadParent'));
  const [toggling, setToggling] = useState(false);

  const handleToggleHeadParent = async () => {
    if (!student.parentId?._id) return;
    setToggling(true);
    try {
      const res = await patch(`/school-admin/parents/${student.parentId._id}/toggle-headparent`);
      setIsHeadParent(res.isHeadParent);
      toast.success(res.message || 'Cập nhật thành công');
    } catch (e) {
      toast.error(e?.message || 'Cập nhật thất bại');
    } finally {
      setToggling(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', p: 3, height: '100%' }}>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#fff1f2', color: '#e11d48', display: 'flex' }}>
              <PersonIcon />
            </Box>
            <Typography variant="subtitle1" fontWeight={800}>Thông tin cơ bản</Typography>
          </Stack>
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary" display="block">Họ và tên</Typography><Typography variant="body2" fontWeight={700}>{student.fullName}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary" display="block">Ngày sinh</Typography><Typography variant="body2" fontWeight={700}>{fmtDate(student.dateOfBirth)}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary" display="block">Giới tính</Typography><Typography variant="body2" fontWeight={700}>{genderLabel(student.gender)}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary" display="block">Lớp hiện tại</Typography><Typography variant="body2" fontWeight={700} color="primary">{student.classId?.className || '—'}</Typography></Grid>
            </Grid>
            <Divider />
            <Box><Typography variant="caption" color="text.secondary" display="block">Địa chỉ thường trú</Typography><Typography variant="body2" fontWeight={600}>{student.address || '—'}</Typography></Box>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', p: 3, height: '100%' }}>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#eff6ff', color: '#2563eb', display: 'flex' }}>
              <PeopleIcon />
            </Box>
            <Typography variant="subtitle1" fontWeight={800}>Thông tin liên hệ</Typography>
          </Stack>
          <Stack spacing={2.5}>
            <Box><Typography variant="caption" color="text.secondary" display="block">Họ tên Phụ huynh</Typography><Typography variant="body2" fontWeight={700}>{student.parentId?.fullName || '—'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary" display="block">Số điện thoại</Typography><Typography variant="body2" fontWeight={700} color="primary">{student.parentId?.phone || student.parentPhone || '—'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary" display="block">Email</Typography><Typography variant="body2" fontWeight={600}>{student.parentId?.email || '—'}</Typography></Box>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}

// ── TabSucKhoe ───────────────────────────────────────────────────
function TabSucKhoe({ studentId }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    get(ENDPOINTS.STUDENTS.ADMIN_HEALTH_LATEST(studentId)).then(res => setHealth(res.data)).finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <Skeleton variant="rounded" height={200} sx={{ borderRadius: 4 }} />;
  if (!health) return <Typography sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>Chưa có hồ sơ sức khỏe.</Typography>;

  return (
    <Box>
      <Grid container spacing={2} mb={3}>
        {[{ l: 'Cân nặng', v: health.weight, u: 'kg', c: '#16a34a' }, { l: 'Chiều cao', v: health.height, u: 'cm', c: '#0891b2' }, { l: 'Nhiệt độ', v: health.temperature, u: '°C', c: '#dc2626' }].map(i => (
          <Grid item xs={4} key={i.l}>
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">{i.l}</Typography>
              <Typography variant="h5" fontWeight={800} color={i.c}>{i.v}{i.u}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={800} mb={2}>Đánh giá chuyên khoa</Typography>
        <Stack spacing={2}>
          <Box><Typography variant="caption" color="text.secondary">Tình trạng chung</Typography><Typography variant="body2" fontWeight={600}>{health.generalStatus}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Ghi chú từ nhân viên y tế</Typography><Typography variant="body2">{health.notes || 'Không có ghi chú'}</Typography></Box>
        </Stack>
      </Paper>
    </Box>
  );
}

// ── TabDanhGia ───────────────────────────────────────────────────
function TabDanhGia({ studentId }) {
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    get(ENDPOINTS.STUDENTS.ADMIN_EVALUATIONS(studentId))
      .then(res => setEvals(res.data || []))
      .catch(() => setEvals([]))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (evals.length === 0) return <Typography sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>Chưa có đánh giá học tập nào.</Typography>;

  return (
    <Stack spacing={2} sx={{ maxWidth: 800, mx: 'auto' }}>
      {evals.map(e => (
        <Paper key={e._id} elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', p: 3, bgcolor: '#fff' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color="primary.main">{e.academicYearId?.yearName || 'Năm học'}</Typography>
              <Typography variant="caption" color="text.secondary">{e.gradeId?.gradeName || ''} · {e.classId?.className || ''}</Typography>
            </Box>
            {e.academicEvaluation && (
              <Chip 
                label={e.academicEvaluation.toUpperCase()} 
                color={e.academicEvaluation === 'đạt' ? 'success' : 'warning'} 
                size="small" 
                sx={{ fontWeight: 800, borderRadius: 1.5 }}
              />
            )}
          </Stack>
          <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.primary', bgcolor: '#f8fafc', p: 2, borderRadius: 3 }}>
            {e.evaluationNote || 'Chưa có nhận xét chi tiết.'}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5, textAlign: 'right' }}>
            Cập nhật: {fmtDate(e.updatedAt || e.createdAt)}
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}

// ── Main StudentDetailPage ───────────────────────────────────────
export default function StudentDetailPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (isInitializing || !user) return;
    setLoading(true);
    get(ENDPOINTS.STUDENTS.DETAIL(studentId))
      .then(res => setStudent(res.data))
      .finally(() => setLoading(false));
  }, [studentId, user, isInitializing]);

  const TABS = [
    { label: 'Sổ liên lạc (Timeline)', icon: <TimelineIcon /> },
    { label: 'Thông tin hồ sơ', icon: <PersonIcon /> },
    { label: 'Y tế & Sức khỏe', icon: <HealthIcon /> },
    { label: 'Đánh giá học tập', icon: <AssessmentIcon /> },
  ];

  return (
    <Box>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={3} sx={{ cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'primary.main' } }} onClick={() => navigate(-1)}>
          <BackIcon fontSize="small" />
          <Typography variant="body2" fontWeight={600}>Quay lại</Typography>
        </Stack>

        {loading ? (
          <Skeleton variant="rounded" height={600} sx={{ borderRadius: 4 }} />
        ) : student ? (
          <Box>
            {/* Header Card */}
            <Paper elevation={0} sx={{
              p: 3, mb: 3, borderRadius: 5, border: '1px solid', borderColor: 'divider',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white',
              boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.2)'
            }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                <Avatar src={student.avatar} sx={{ width: 80, height: 80, border: '4px solid rgba(255,255,255,0.3)', bgcolor: 'white', color: '#4f46e5', fontWeight: 900, fontSize: 24 }}>
                  {initials(student.fullName)}
                </Avatar>
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flex: 1 }}>
                  <Typography variant="h5" fontWeight={900}>{student.fullName}</Typography>
                  <Stack direction="row" spacing={1} justifyContent={{ xs: 'center', sm: 'flex-start' }} mt={0.5} alignItems="center">
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>{calcAge(student.dateOfBirth)} · {genderLabel(student.gender)}</Typography>
                    <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)', height: 12, my: 'auto' }} />
                    <Typography variant="body2" fontWeight={700}>{student.classId?.className || 'Chưa xếp lớp'}</Typography>
                  </Stack>
                </Box>
                <Stack spacing={1} alignItems={{ xs: 'center', sm: 'flex-end' }}>
                  <Chip label={student.status === 'active' ? 'Đang theo học' : 'Nghỉ học'} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 800, backdropFilter: 'blur(4px)' }} />
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>MSHS: {student.studentCode || student._id.slice(-6).toUpperCase()}</Typography>
                </Stack>
              </Stack>
            </Paper>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider', '& .MuiTab-root': { textTransform: 'none', fontWeight: 800, minHeight: 48 }, '& .Mui-selected': { color: '#4f46e5' } }}>
              {TABS.map(t => <Tab key={t.label} label={t.label} icon={t.icon} iconPosition="start" />)}
            </Tabs>

            <Box sx={{ minHeight: 400 }}>
              {tab === 0 && <TabTimeline student={student} studentId={studentId} />}
              {tab === 1 && <TabHoSo student={student} />}
              {tab === 2 && <TabSucKhoe studentId={studentId} />}
              {tab === 3 && <TabDanhGia studentId={studentId} />}
            </Box>
          </Box>
        ) : <Alert severity="error">Không tìm thấy thông tin học sinh.</Alert>}
      </Box>
    </Box>
  );
}
