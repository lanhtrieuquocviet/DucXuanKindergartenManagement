import {
  Boy as BoyIcon,
  Cake as CakeIcon,
  Class as ClassIcon,
  Girl as GirlIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Chip,
  FormControl,
  Grid,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS, get } from '../../service/api';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years--;
  return years >= 0 ? `${years} tuổi` : null;
}

function StudentCard({ student, loading }) {
  if (loading) {
    return (
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Skeleton variant="circular" width={52} height={52} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="60%" height={20} />
            <Skeleton width="40%" height={16} sx={{ mt: 0.5 }} />
            <Skeleton width="80%" height={16} sx={{ mt: 0.5 }} />
          </Box>
        </Box>
      </Paper>
    );
  }

  const isMale = student.gender === 'male';
  const genderColor = isMale ? '#0ea5e9' : '#ec4899';
  const genderBg = isMale ? '#e0f2fe' : '#fce7f3';
  const initial = (student.fullName || '?')[0].toUpperCase();
  const age = calcAge(student.dateOfBirth);
  const parent = student.parentId || null;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        p: 2,
        transition: 'all 0.2s',
        '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.08)', transform: 'translateY(-2px)', borderColor: 'primary.light' },
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Avatar
          src={student.avatar || student.faceImageUrl}
          sx={{
            width: 52, height: 52, fontWeight: 700, fontSize: 20,
            bgcolor: genderBg, color: genderColor,
            border: `2px solid ${genderColor}30`,
            flexShrink: 0,
          }}
        >
          {initial}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ flex: 1 }}>
              {student.fullName || '—'}
            </Typography>
            <Box sx={{ color: genderColor, display: 'flex' }}>
              {isMale ? <BoyIcon sx={{ fontSize: 18 }} /> : <GirlIcon sx={{ fontSize: 18 }} />}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <CakeIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">
              {fmtDate(student.dateOfBirth)}{age ? ` · ${age}` : ''}
            </Typography>
          </Box>

          {parent && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mt: 0.75, pt: 0.75, borderTop: '1px dashed', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PersonIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary" noWrap>
                  {parent.fullName || parent.name || '—'}
                </Typography>
              </Box>
              {(parent.phone || parent.phoneNumber) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary">
                    {parent.phone || parent.phoneNumber}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

export default function TeacherMyClass() {
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();

  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }

    const init = async () => {
      try {
        const res = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.LIST);
        if (res.data?.length) {
          setAcademicYears(res.data);
          const current = res.data.find(y => y.status === 'active') || res.data[0];
          setSelectedYearId(current._id);
          await fetchStudents('', current._id);
        }
      } catch (_) {
        setLoading(false);
      }
    };
    init();
  }, [isInitializing, user]); // eslint-disable-line

  const fetchStudents = async (classId = '', yearId = selectedYearId) => {
    setLoading(true);
    try {
      let query = yearId ? `?academicYearId=${yearId}` : '';
      if (classId) query += `${query ? '&' : '?'}classId=${classId}`;
      const res = await get(`${ENDPOINTS.TEACHER.MY_STUDENTS}${query}`);
      setStudents(res.data || []);
      if (res.classes) {
        setClasses(res.classes);
        if (!classId && res.classes.length > 0) setSelectedClassId(res.classes[0]._id);
      }
    } catch (_) {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const activeClass = classes.find(c => c._id === selectedClassId) || classes[0];
  const displayedStudents = loading
    ? Array(6).fill(null)
    : selectedClassId
      ? students.filter(s => String(s.classId?._id) === String(selectedClassId))
      : students;

  const activeYear = academicYears.find(y => String(y._id) === String(selectedYearId));

  return (
    <Box>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 3, borderRadius: 3, overflow: 'hidden',
          background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
          color: 'white',
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />
        <Box sx={{ position: 'absolute', right: 80, bottom: -30, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
        <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 2.5, md: 3 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 52, height: 52, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClassIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {activeClass ? activeClass.className : 'Lớp phụ trách'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {activeClass?.gradeName || activeClass?.grade?.gradeName || ''}{activeYear ? ` · ${activeYear.yearName}` : ''}
              </Typography>
            </Box>
          </Box>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={selectedYearId}
              onChange={(e) => {
                setSelectedYearId(e.target.value);
                setSelectedClassId('');
                fetchStudents('', e.target.value);
              }}
              displayEmpty
              sx={{
                color: 'white', bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2,
                '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                '.MuiSelect-icon': { color: 'white' }, fontSize: '0.875rem', fontWeight: 600,
              }}
              renderValue={(v) => {
                const y = academicYears.find(ay => String(ay._id) === String(v));
                return y ? y.yearName : 'Năm học';
              }}
            >
              {academicYears.map(y => (
                <MenuItem key={y._id} value={y._id}>
                  {y.yearName} {y.status === 'active' && <Chip label="Hiện tại" size="small" color="primary" sx={{ ml: 1, height: 20 }} />}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Class tabs */}
      {classes.length > 1 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
          {classes.map(c => (
            <Chip
              key={c._id}
              label={c.className}
              icon={<SchoolIcon />}
              onClick={() => {
                setSelectedClassId(c._id);
                fetchStudents(c._id, selectedYearId);
              }}
              color={selectedClassId === c._id ? 'primary' : 'default'}
              variant={selectedClassId === c._id ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Box>
      )}

      {/* Stats row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          {
            label: 'Tổng học sinh',
            value: loading ? '—' : displayedStudents.length,
            icon: <PeopleIcon />, color: '#6366f1', bg: '#eef2ff',
          },
          {
            label: 'Nam',
            value: loading ? '—' : displayedStudents.filter(s => s?.gender === 'male').length,
            icon: <BoyIcon />, color: '#0ea5e9', bg: '#e0f2fe',
          },
          {
            label: 'Nữ',
            value: loading ? '—' : displayedStudents.filter(s => s?.gender === 'female').length,
            icon: <GirlIcon />, color: '#ec4899', bg: '#fce7f3',
          },
        ].map(item => (
          <Paper
            key={item.label}
            elevation={0}
            sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', p: 2, display: 'flex', alignItems: 'center', gap: 1.5, flex: '1 1 120px' }}
          >
            <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.icon}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: item.color, lineHeight: 1 }}>{item.value}</Typography>
              <Typography variant="caption" color="text.secondary">{item.label}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Student grid */}
      <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PeopleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
        <Typography variant="subtitle2" fontWeight={700}>Danh sách học sinh</Typography>
        {!loading && (
          <Chip label={`${displayedStudents.length} học sinh`} size="small" color="primary" variant="outlined" sx={{ ml: 'auto', height: 22, fontSize: 11 }} />
        )}
      </Box>

      {!loading && displayedStudents.length === 0 ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}>
          <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">Chưa có học sinh trong lớp này</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {(loading ? Array(6).fill(null) : displayedStudents).map((student, idx) => (
            <Grid key={student?._id || idx} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <StudentCard student={student || {}} loading={loading} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
