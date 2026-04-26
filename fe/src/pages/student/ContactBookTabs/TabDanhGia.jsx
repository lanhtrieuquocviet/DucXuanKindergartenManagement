import { useEffect, useState } from 'react';
import { Box, Stack, Typography, Paper, Chip, Skeleton } from '@mui/material';
import { 
  School as SchoolIcon 
} from '@mui/icons-material';
import { get, ENDPOINTS } from '../../../service/api';

export default function TabDanhGia({ studentId }) {
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

  if (loading) return <Stack spacing={1.5}>{[1,2].map(i => <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: 3 }} />)}</Stack>;
  if (evals.length === 0) return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}>
      <SchoolIcon sx={{ fontSize: 44, color: 'grey.300', mb: 1 }} />
      <Typography color="text.secondary" variant="body2">Chưa có đánh giá học tập nào.</Typography>
    </Paper>
  );

  return (
    <Stack spacing={2}>
      {evals.map(e => (
        <Paper key={e._id} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2.5, bgcolor: '#fff' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="primary.main">{e.academicYearId?.yearName || 'Năm học'}</Typography>
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
          <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.primary', bgcolor: '#f8fafc', p: 2, borderRadius: 2 }}>
            {e.evaluationNote || 'Chưa có nhận xét chi tiết.'}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1, textAlign: 'right' }}>
            Cập nhật: {new Date(e.updatedAt || e.createdAt).toLocaleDateString('vi-VN')}
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}
