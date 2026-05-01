import { useState, useEffect, useCallback } from 'react';
import { 
  Box, Stack, Typography, Select, MenuItem, Alert, Paper, 
  FormControl, FormControlLabel, Radio, TextField, Button, 
  Checkbox, List, ListItem, ListItemText, Skeleton 
} from '@mui/material';
import { get, put, ENDPOINTS } from '../../../service/api';
import { toast } from 'react-toastify';

export default function TabDanhGia({ studentId, classId, academicYearId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState('semester_1');
  const [template, setTemplate] = useState(null);
  const [results, setResults] = useState([]); 
  const [overall, setOverall] = useState('Đạt');
  const [note, setNote] = useState('');
  const [showCriteria, setShowCriteria] = useState(false);
  const [error, setError] = useState(null);

  const fetchEval = useCallback(async () => {
    // Nếu chưa có academicYearId, chúng ta không thể fetch. 
    // Tuy nhiên, ContactBookDetail cần fetch xong class mới có academicYearId.
    if (!academicYearId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await get(`${ENDPOINTS.TEACHER.STUDENT_EVALUATION(studentId)}?period=${period}&academicYearId=${academicYearId}`);
      
      if (res.status === 'success') {
        const { template: t, assessment: a } = res.data;
        setTemplate(t);
        if (a) {
          setResults(a.results || []);
          setOverall(a.overallResult || 'Đạt');
          setNote(a.notes || '');
        } else {
          // Khởi tạo results từ criteria nếu chưa có bản đánh giá
          const initialResults = (t?.criteria || []).map(c => ({ 
            criterionName: c.name, 
            isPassed: false 
          }));
          setResults(initialResults);
          setOverall('Chưa đạt');
          setNote('');
        }
      } else if (res.status === 'no_template') {
        setTemplate(null);
        setError(res.message || 'Chưa có mẫu đánh giá cho kỳ này.');
      } else {
        setError(res.message || 'Không thể tải dữ liệu đánh giá.');
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [studentId, period, academicYearId]);

  useEffect(() => {
    fetchEval();
  }, [fetchEval]);

  const handleSave = async () => {
    if (!template) return;
    setSaving(true);
    try {
      const assessmentToSave = {
        studentId, 
        classId, 
        academicYearId, 
        period,
        templateId: template._id,
        results,
        overallResult: overall,
        notes: note.trim(),
      };
      
      // Backend updateStudentEvaluation (assessmentCtrl.saveBulkAssessments)
      // mong muốn { assessments: [ ... ] }
      await put(ENDPOINTS.TEACHER.STUDENT_EVALUATION(studentId), { 
        assessments: [assessmentToSave] 
      });
      
      toast.success('Đã lưu đánh giá');
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !template) {
    return (
      <Box sx={{ py: 4 }}>
        <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3, mb: 2 }} />
        <Skeleton variant="rounded" height={60} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (error && !template) {
    return <Alert severity="info" sx={{ borderRadius: 2 }}>{error}</Alert>;
  }

  if (!template) {
    return <Alert severity="info" sx={{ borderRadius: 2 }}>Chưa có mẫu đánh giá cho giai đoạn này.</Alert>;
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary">Giai đoạn đánh giá</Typography>
        <Select
          size="small"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          sx={{ minWidth: 180, height: 32, borderRadius: 2, fontSize: '0.8rem' }}
        >
          <MenuItem value="early_year">Đầu năm</MenuItem>
          <MenuItem value="semester_1">Cuối Kỳ 1</MenuItem>
          <MenuItem value="semester_2">Cuối năm học</MenuItem>
        </Select>
      </Stack>

      <Stack spacing={2}>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
          <Stack spacing={2}>
            <FormControl component="fieldset">
              <Typography variant="body2" fontWeight={700} mb={1}>Kết quả tổng quan</Typography>
              <Stack direction="row" spacing={3}>
                <FormControlLabel
                  control={<Radio size="small" checked={overall === 'Đạt'} 
                    onChange={() => {
                      setOverall('Đạt');
                      setResults(results.map(r => ({ ...r, isPassed: true })));
                    }} 
                    color="success" 
                  />}
                  label={<Typography variant="body2" fontWeight={600} color="success.main">Đạt yêu cầu</Typography>}
                />
                <FormControlLabel
                  control={<Radio size="small" checked={overall === 'Chưa đạt'} 
                    onChange={() => {
                      setOverall('Chưa đạt');
                      setResults(results.map(r => ({ ...r, isPassed: false })));
                    }} 
                    color="error" 
                  />}
                  label={<Typography variant="body2" fontWeight={600} color="error.main">Chưa đạt</Typography>}
                />
              </Stack>
            </FormControl>

            <TextField
              label="Ghi chú & Nhận xét" fullWidth multiline minRows={2}
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="Nhập nhận xét nhanh..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button 
                size="small" 
                onClick={() => setShowCriteria(!showCriteria)}
                sx={{ textTransform: 'none', color: '#64748b', fontSize: '0.75rem' }}
              >
                {showCriteria ? '— Thu gọn tiêu chí' : '+ Xem chi tiết tiêu chí'}
              </Button>
              <Button
                variant="contained" size="small" onClick={handleSave} disabled={saving}
                sx={{ bgcolor: '#0891b2', '&:hover': { bgcolor: '#0e7490' }, borderRadius: 2, px: 3, fontWeight: 700, textTransform: 'none' }}
              >
                {saving ? 'Đang lưu...' : 'Lưu nhanh'}
              </Button>
            </Box>
          </Stack>
        </Paper>

        {showCriteria && (
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#f8fafc' }}>
            <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #e2e8f0', bgcolor: '#f1f5f9' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">DANH SÁCH TIÊU CHÍ</Typography>
            </Box>
            <List disablePadding>
              {(template.criteria || []).map((c, idx) => {
                const res = results.find(r => r.criterionName === c.name);
                const isPassed = res ? res.isPassed : false;
                return (
                  <ListItem key={idx} divider={idx < template.criteria.length - 1} sx={{ py: 0.5, px: 2 }}>
                    <ListItemText 
                      primary={<Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{c.name}</Typography>}
                    />
                    <Checkbox 
                      size="small" checked={isPassed} 
                      onChange={(e) => {
                        const updated = results.map(r => r.criterionName === c.name ? { ...r, isPassed: e.target.checked } : r);
                        setResults(updated);
                        
                        // Tự động cập nhật trạng thái tổng quan
                        const allPassed = updated.every(r => r.isPassed);
                        setOverall(allPassed ? 'Đạt' : 'Chưa đạt');
                      }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
