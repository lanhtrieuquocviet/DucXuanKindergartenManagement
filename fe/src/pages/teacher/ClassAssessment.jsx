import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  TextField,
  Chip,
  Skeleton,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Assignment as AssessmentIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { get, post, ENDPOINTS } from '../../service/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ClassAssessment() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('semester_1');
  const [academicYear, setAcademicYear] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ template: null, students: [] });

  const loadInitialData = useCallback(async () => {
    try {
      const [yearResp, teacherResp] = await Promise.all([
        get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT),
        get(ENDPOINTS.TEACHER.DASHBOARD),
      ]);

      if (yearResp?.status === 'success') {
        setAcademicYear(yearResp.data);
      }

      if (teacherResp?.status === 'success') {
        const teacherClasses = teacherResp.data.classes || [];
        setClasses(teacherClasses);
        if (teacherClasses.length > 0) {
          setSelectedClass(teacherClasses[0]._id);
        }
      }
    } catch (error) {
      toast.error('Lỗi tải thông tin ban đầu');
    }
  }, []);

  const loadAssessments = useCallback(async () => {
    if (!selectedClass || !selectedPeriod || !academicYear) return;
    setLoading(true);
    try {
      const resp = await get(`${ENDPOINTS.TEACHER.CLASS_ASSESSMENTS}?classId=${selectedClass}&period=${selectedPeriod}&academicYearId=${academicYear._id}`);
      if (resp?.status === 'success') {
        setData(resp.data);
      } else if (resp?.status === 'no_template') {
        setData({ template: null, students: [] });
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedPeriod, academicYear]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  const handleToggleResult = (studentId, criterionName) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(st => {
        if (String(st._id) !== String(studentId)) return st;
        
        const currentResults = st.assessment?.results || prev.template.criteria.map(c => ({ criterionName: c.name, isPassed: false }));
        const updatedResults = currentResults.map(r => 
          r.criterionName === criterionName ? { ...r, isPassed: !r.isPassed } : r
        );

        const allPassed = updatedResults.every(r => r.isPassed);
        const overallResult = allPassed ? 'Đạt' : 'Chưa đạt';
        
        // Tự động gán promotionStatus dựa trên overallResult khi đánh giá cuối năm
        let promotionStatus = st.assessment?.promotionStatus || 'promoted';
        if (selectedPeriod === 'semester_2') {
          promotionStatus = overallResult === 'Đạt' ? 'promoted' : 'retained';
        }

        return {
          ...st,
          assessment: {
            ...(st.assessment || {}),
            results: updatedResults,
            overallResult,
            promotionStatus
          }
        };
      })
    }));
  };

  const handlePromotionStatusChange = (studentId, status) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(st => {
        if (String(st._id) !== String(studentId)) return st;
        return {
          ...st,
          assessment: {
            ...(st.assessment || {}),
            promotionStatus: status
          }
        };
      })
    }));
  };

  const handleNoteChange = (studentId, value) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(st => {
        if (String(st._id) !== String(studentId)) return st;
        return {
          ...st,
          assessment: {
            ...(st.assessment || {}),
            notes: value
          }
        };
      })
    }));
  };

  const handleSaveAll = async () => {
    if (!data.template) return;
    setSaving(true);
    try {
      const assessmentsToSave = data.students.map(st => ({
        studentId: st._id,
        classId: selectedClass,
        academicYearId: academicYear._id,
        period: selectedPeriod,
        templateId: data.template._id,
        results: st.assessment?.results || data.template.criteria.map(c => ({ criterionName: c.name, isPassed: false })),
        overallResult: st.assessment?.overallResult || 'Chưa đạt',
        promotionStatus: st.assessment?.promotionStatus || (selectedPeriod === 'semester_2' ? 'retained' : 'promoted'),
        notes: st.assessment?.notes || '',
      }));

      const resp = await post(ENDPOINTS.TEACHER.BULK_ASSESSMENTS, { assessments: assessmentsToSave });
      if (resp?.status === 'success') {
        toast.success('Đã lưu tất cả đánh giá');
        loadAssessments();
      }
    } catch (error) {
      toast.error('Lỗi khi lưu đánh giá');
    } finally {
      setSaving(false);
    }
  };

  const selectedClassDoc = classes.find(c => c._id === selectedClass);
  const periodLabel = {
    early_year: 'ĐẦU NĂM',
    semester_1: 'CUỐI HỌC KỲ 1',
    semester_2: 'CUỐI NĂM HỌC'
  }[selectedPeriod];

  // Tính toán % cho dòng tổng
  const calculatePercentage = (criterionName) => {
    if (!data.students.length) return '0%';
    const passedCount = data.students.filter(st => 
      st.assessment?.results?.find(r => r.criterionName === criterionName)?.isPassed
    ).length;
    return Math.round((passedCount / data.students.length) * 100) + '%';
  };

  const calculateOverallPercentage = () => {
    if (!data.students.length) return '0%';
    const passedCount = data.students.filter(st => st.assessment?.overallResult === 'Đạt').length;
    return Math.round((passedCount / data.students.length) * 100) + '%';
  };

  return (
    <Box p={2}>
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Chọn lớp</InputLabel>
              <Select
                value={selectedClass}
                label="Chọn lớp"
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                {classes.map(c => <MenuItem key={c._id} value={c._id}>{c.className}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Giai đoạn đánh giá</InputLabel>
              <Select
                value={selectedPeriod}
                label="Giai đoạn đánh giá"
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <MenuItem value="early_year">Đánh giá đầu năm</MenuItem>
                <MenuItem value="semester_1">Đánh giá cuối Kỳ 1</MenuItem>
                <MenuItem value="semester_2">Đánh giá cuối năm học</MenuItem>
              </Select>
            </FormControl>
            <Box flex={1} />
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveAll}
              disabled={saving || !data.template}
              sx={{ borderRadius: 2, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
            >
              {saving ? 'Đang lưu...' : 'Lưu tất cả'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {!loading && academicYear && classes.length > 0 && data.template && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e0e0e0', bgcolor: '#fff' }}>
          {/* Header style like reference image */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle2" fontWeight={700}>TRƯỜNG MẦM NON ĐỨC XUÂN</Typography>
                <Typography variant="body2" fontWeight={700}>LỚP {selectedClassDoc?.className?.toUpperCase() || '...'}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="h6" fontWeight={800}>DANH SÁCH ĐÁNH GIÁ {periodLabel}</Typography>
                <Typography variant="subtitle1" fontWeight={700}>NĂM HỌC {academicYear?.yearName}</Typography>
              </Box>
              <Box sx={{ width: 200 }} /> {/* Spacer */}
            </Stack>
          </Box>

          <TableContainer>
            <Table size="small" sx={{ 
              border: '1px solid black',
              '& .MuiTableCell-root': { 
                border: '1px solid black',
                padding: '4px 8px',
                fontSize: '0.85rem',
                color: 'black'
              } 
            }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>STT</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Họ và tên</TableCell>
                  {data.template.criteria.map((c, i) => (
                    <TableCell key={i} align="center" sx={{ fontWeight: 800, width: 80 }}>
                      <Typography variant="caption" fontWeight={800} sx={{ lineHeight: 1.2, display: 'block' }}>
                        {c.name}
                      </Typography>
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#f9fafb' }}>Đạt</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#f9fafb' }}>Chưa đạt</TableCell>
                  {selectedPeriod === 'semester_2' && (
                    <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#fffde7', color: '#f57c00' }}>Trạng thái cuối năm</TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 800 }}>Ghi chú</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.students.map((st, idx) => (
                  <TableRow key={st._id}>
                    <TableCell align="center">{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {st.fullName}
                      {!st.assessment && (
                        <Chip label="Chưa đánh giá" size="small" color="error" variant="outlined" 
                          sx={{ height: 16, fontSize: '0.6rem', ml: 1, borderStyle: 'dashed' }} 
                        />
                      )}
                    </TableCell>
                    {data.template.criteria.map((c, i) => {
                      const res = st.assessment?.results?.find(r => r.criterionName === c.name);
                      const isPassed = res ? res.isPassed : false;
                      return (
                        <TableCell key={i} align="center" 
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f0f9ff' } }}
                          onClick={() => handleToggleResult(st._id, c.name)}
                        >
                          {isPassed ? (
                            <Typography sx={{ color: 'red', fontWeight: 900, fontSize: '1.2rem' }}>+</Typography>
                          ) : ' '}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center" sx={{ bgcolor: '#f9fafb' }}>
                      {st.assessment?.overallResult === 'Đạt' && (
                        <Typography sx={{ color: 'red', fontWeight: 900, fontSize: '1.2rem' }}>+</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: '#f9fafb' }}>
                      {st.assessment?.overallResult === 'Chưa đạt' && (
                         <Typography sx={{ color: 'black', fontWeight: 900, fontSize: '1.2rem' }}>-</Typography>
                      )}
                    </TableCell>
                    {selectedPeriod === 'semester_2' && (
                      <TableCell align="center" sx={{ bgcolor: '#fffde7' }}>
                        <Select
                          size="small"
                          value={st.assessment?.promotionStatus || 'promoted'}
                          onChange={(e) => handlePromotionStatusChange(st._id, e.target.value)}
                          variant="standard"
                          disableUnderline
                          sx={{ fontSize: '0.8rem', fontWeight: 600, color: st.assessment?.promotionStatus === 'retained' ? 'error.main' : 'primary.main' }}
                        >
                          <MenuItem value="promoted" sx={{ fontSize: '0.8rem' }}>Lên lớp</MenuItem>
                          <MenuItem value="retained" sx={{ fontSize: '0.8rem' }}>Ở lại lớp</MenuItem>
                          <MenuItem value="graduated" sx={{ fontSize: '0.8rem' }}>Tốt nghiệp</MenuItem>
                        </Select>
                      </TableCell>
                    )}
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        variant="standard"
                        value={st.assessment?.notes || ''}
                        onChange={(e) => handleNoteChange(st._id, e.target.value)}
                        InputProps={{ disableUnderline: true, sx: { fontSize: '0.8rem' } }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {/* Tổng dòng Footer */}
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell colSpan={2} align="center" sx={{ fontWeight: 800 }}>Tổng</TableCell>
                  {data.template.criteria.map((c, i) => (
                    <TableCell key={i} align="center" sx={{ fontWeight: 800 }}>
                      {calculatePercentage(c.name)}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#f9fafb' }}>
                    {calculateOverallPercentage()}
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#f9fafb' }} />
                  {selectedPeriod === 'semester_2' && (
                    <TableCell align="center" sx={{ bgcolor: '#fffde7' }} />
                  )}
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
             <Button variant="outlined" onClick={() => window.print()} startIcon={<AssessmentIcon />}>In báo cáo</Button>
          </Box>
        </Paper>
      )}

      {!loading && !data.template && academicYear && (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <AssessmentIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">Chưa có mẫu đánh giá được thiết lập cho <strong>{periodLabel}</strong></Typography>
          <Typography variant="body2" color="text.disabled">Vui lòng liên hệ School Admin để thiết lập bộ tiêu chí đánh giá.</Typography>
        </Box>
      )}

      {loading && (
        <Stack spacing={2}>
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />)}
        </Stack>
      )}
    </Box>
  );
}
