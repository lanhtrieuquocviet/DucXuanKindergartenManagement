import { Layers as LayersIcon } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Grid,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { memo } from 'react';

const GRADE_COLORS = [
  { header: '#0891b2', light: '#cffafe' },
  { header: '#2563eb', light: '#dbeafe' },
  { header: '#f59e0b', light: '#fef9c3' },
  { header: '#16a34a', light: '#dcfce7' },
  { header: '#dc2626', light: '#fee2e2' },
  { header: '#0284c7', light: '#e0f2fe' },
];

const GradeCard = memo(({ grade, index, classCount, onSelect }) => {
  const color = GRADE_COLORS[index % GRADE_COLORS.length];

  const getGradeAgeLabel = (g) => {
    if (g?.ageLabel) return g.ageLabel;
    const minAge = Number(g?.minAge || 0);
    const maxAge = Number(g?.maxAge || 0);
    if (minAge > 0 && maxAge > 0) return `${minAge} - ${maxAge}`;
    if (minAge > 0) return `${minAge}+`;
    if (maxAge > 0) return `0 - ${maxAge}`;
    return 'Chưa cập nhật';
  };

  const ageLabel = getGradeAgeLabel(grade);

  return (
    <Grid item xs={12} sm={6} md={6} lg={4} sx={{ display: 'flex', flexShrink: 0, minWidth: { xs: 240, sm: 280, lg: 300 } }}>
      <Paper
        elevation={2}
        onClick={() => onSelect(grade)}
        sx={{
          borderRadius: 5,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          width: '100%',
          minHeight: { xs: 280, md: 320 },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: `0 20px 25px -5px ${color.header}22, 0 10px 10px -5px ${color.header}11`,
            borderColor: color.header,
          },
        }}
      >
        <Box
          sx={{
            background: `linear-gradient(135deg, ${color.header} 0%, ${color.header}cc 100%)`,
            px: 3,
            py: { xs: 2, md: 2.5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            textAlign: 'center',
            flexShrink: 0,
            borderBottom: '4px solid rgba(0,0,0,0.05)',
            borderTopLeftRadius: 'inherit',
            borderTopRightRadius: 'inherit'
          }}
        >
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.25)', width: { xs: 40, md: 56 }, height: { xs: 40, md: 56 }, mb: 1.5, border: '2px solid rgba(255,255,255,0.5)' }}>
            <LayersIcon sx={{ fontSize: { xs: 24, md: 32 } }} />
          </Avatar>
          <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1.1, mb: 0.75, fontSize: { xs: '1.25rem', md: '1.5rem' }, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {grade.gradeName}
          </Typography>
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', px: 2, py: 0.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.3)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
              Độ tuổi: {ageLabel}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 1.5, md: 2 }, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={6}>
              <Box sx={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', p: 2, borderRadius: 4, bgcolor: '#f8fafc', border: '1px solid', borderColor: '#e2e8f0',
                height: '100%'
              }}>
                <Typography variant="caption" color="text.disabled" display="block" sx={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, mb: 0.5, letterSpacing: '0.05em' }}>Lớp học</Typography>
                <Typography variant="h4" fontWeight={900} color="text.primary" sx={{ lineHeight: 1 }}>
                  {classCount}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', p: 2, borderRadius: 4, bgcolor: '#f8fafc', border: '1px solid', borderColor: '#e2e8f0',
                height: '100%'
              }}>
                <Typography variant="caption" color="text.disabled" display="block" sx={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, mb: 0.5, letterSpacing: '0.05em' }}>Tổng trẻ</Typography>
                <Typography variant="h4" fontWeight={900} color="text.primary" sx={{ lineHeight: 1 }}>
                  {grade.totalStudents ?? 0}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ textAlign: 'center', my: 1.5 }}>
            <Typography variant="caption" color="text.disabled" display="block" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', mb: 0.5 }}>Tổ trưởng khối</Typography>
            <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
              <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: color.header, fontWeight: 900, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {grade.headTeacher?.fullName?.charAt(0) || '?'}
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ color: 'text.primary' }}>
                {grade.headTeacher?.fullName || 'Chưa phân công'}
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ mt: 'auto', pt: 1 }}>
            <Box 
              sx={{ 
                p: 1.5, bgcolor: color.header, color: '#fff',
                textAlign: 'center', fontWeight: 900, borderRadius: 3,
                fontSize: { xs: '0.85rem', md: '0.9rem' },
                boxShadow: `0 4px 12px ${color.header}44`,
                transition: 'all 0.2s ease',
                '&:active': { transform: 'scale(0.98)' }
              }}
            >
              XEM CHI TIẾT KHỐI
            </Box>
          </Box>
        </Box>
      </Paper>
    </Grid>
  );
});

export default GradeCard;
