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
  const [selectedTerm, setSelectedTerm] = useState(1);
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
    if (!selectedClass || !selectedTerm || !academicYear) return;
    setLoading(true);
    try {
      const resp = await get(`${ENDPOINTS.TEACHER.CLASS_ASSESSMENTS}?classId=${selectedClass}&term=${selectedTerm}&academicYearId=${academicYear._id}`);
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
  }, [selectedClass, selectedTerm, academicYear]);

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

        // Tự động tính overallResult (Đạt nếu tất cả tiêu chí đạt)
        const allPassed = updatedResults.every(r => r.isPassed);

        return {
          ...st,
          assessment: {
            ...(st.assessment || {}),
            results: updatedResults,
            overallResult: allPassed ? 'Đạt' : 'Chưa đạt'
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
        term: selectedTerm,
        templateId: data.template._id,
        results: st.assessment?.results || data.template.criteria.map(c => ({ criterionName: c.name, isPassed: false })),
        overallResult: st.assessment?.overallResult || 'Chưa đạt',
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



  return (
    <Box p={2}>
      <Box p={2}>
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Kỳ học</InputLabel>
                <Select
                  value={selectedTerm}
                  label="Kỳ học"
                  onChange={(e) => setSelectedTerm(e.target.value)}
                >
                  <MenuItem value={1}>Học kỳ 1</MenuItem>
                  <MenuItem value={2}>Học kỳ 2</MenuItem>
                </Select>
              </FormControl>
              <Box flex={1} />
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveAll}
                disabled={saving || !data.template}
              >
                {saving ? 'Đang lưu...' : 'Lưu tất cả'}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {!loading && academicYear && classes.length === 0 && (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Bạn chưa được phân công phụ trách lớp nào trong năm học <strong>{academicYear.yearName}</strong>.
          </Alert>
        )}

        {!loading && academicYear && classes.length > 0 && !data.template && (
          <Alert severity="warning" sx={{ borderRadius: 3 }}>
            Chưa có mẫu đánh giá được thiết lập cho năm học <strong>{academicYear.yearName}</strong>. 
            Vui lòng liên hệ Admin để tạo form mẫu.
          </Alert>
        )}

        {!loading && !academicYear && (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Đang tải thông tin năm học...
          </Alert>
        )}

        {loading ? (
          <Stack spacing={2}>
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2 }} />)}
          </Stack>
        ) : data.template && (
          <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell width={50} sx={{ fontWeight: 'bold' }}>STT</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Học sinh</TableCell>
                  {data.template.criteria.map((c, i) => (
                    <TableCell key={i} align="center" sx={{ fontWeight: 'bold', maxWidth: 100 }}>
                      <Tooltip title={c.description || 'Không có mô tả'} arrow>
                        <Typography variant="caption" fontWeight="bold" sx={{ cursor: 'help', borderBottom: '1px dotted grey' }}>
                          {c.name}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Đánh giá chung</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ghi chú</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.students.map((st, idx) => (
                  <TableRow key={st._id} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{st.fullName}</TableCell>
                    {data.template.criteria.map((c, i) => {
                      const res = st.assessment?.results?.find(r => r.criterionName === c.name);
                      const isPassed = res ? res.isPassed : false;
                      return (
                        <TableCell key={i} align="center">
                          <Checkbox
                            size="small"
                            checked={isPassed}
                            onChange={() => handleToggleResult(st._id, c.name)}
                            icon={<CancelIcon color="disabled" fontSize="small" />}
                            checkedIcon={<CheckIcon color="success" fontSize="small" />}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell align="center">
                      <Chip
                        label={st.assessment?.overallResult || 'Chưa đạt'}
                        size="small"
                        color={st.assessment?.overallResult === 'Đạt' ? 'success' : 'default'}
                        variant={st.assessment?.overallResult === 'Đạt' ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 'bold', fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Ghi chú..."
                        variant="standard"
                        value={st.assessment?.notes || ''}
                        onChange={(e) => handleNoteChange(st._id, e.target.value)}
                        InputProps={{ disableUnderline: true, sx: { fontSize: 13 } }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}
