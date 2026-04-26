import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { get, ENDPOINTS } from '../../../../service/api';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

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

  if (loading) return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <CircularProgress size={32} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Đang tải đánh giá...
      </Typography>
    </Box>
  );

  if (evals.length === 0) return (
    <Box sx={{ p: 6, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 4, border: '1px dashed', borderColor: 'divider' }}>
      <Typography color="text.secondary">Chưa có đánh giá học tập nào cho học sinh này.</Typography>
    </Box>
  );

  return (
    <Stack spacing={2.5}>
      <Typography variant="subtitle1" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssessmentIcon color="primary" />
        Lịch sử đánh giá định kỳ
      </Typography>
      
      {evals.map(e => (
        <Paper 
          key={e._id} 
          elevation={0} 
          sx={{ 
            borderRadius: 4, 
            border: '1px solid', 
            borderColor: 'divider', 
            p: 3, 
            bgcolor: '#fff',
            transition: 'all 0.2s',
            '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: 'primary.light' }
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                {e.academicYearId?.yearName || 'Năm học'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {e.gradeId?.gradeName || 'Khối'} · {e.classId?.className || 'Lớp'}
              </Typography>
            </Box>
            {e.academicEvaluation && (
              <Chip 
                label={e.academicEvaluation.toUpperCase()} 
                color={e.academicEvaluation === 'đạt' ? 'success' : 'warning'} 
                size="small" 
                sx={{ 
                  fontWeight: 900, 
                  borderRadius: 1.5,
                  px: 1,
                  height: 24,
                  fontSize: '0.65rem'
                }}
              />
            )}
          </Stack>
          
          <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
          
          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 3, border: '1px solid', borderColor: 'grey.100' }}>
            <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.primary', whiteSpace: 'pre-line' }}>
              {e.evaluationNote || 'Chưa có nhận xét chi tiết từ giáo viên.'}
            </Typography>
          </Box>
          
          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
            <Typography variant="caption" color="text.disabled">
              Mã đánh giá: {e._id.slice(-8).toUpperCase()}
            </Typography>
            <Typography variant="caption" color="text.disabled" fontWeight={600}>
              Ngày cập nhật: {fmtDate(e.updatedAt || e.createdAt)}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
