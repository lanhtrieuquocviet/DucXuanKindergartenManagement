import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Button, Stack, Paper, Grid, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Checkbox, IconButton, Avatar, Fade, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Archive as ArchiveIcon,
  Add as AddIcon,
  Search as SearchIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxBlankIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  AutoFixHigh as MagicIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { get, post, put, patch, ENDPOINTS } from '../../service/api';
import AcademicYearWizard from './AcademicYearWizard/WizardContainer';
import { toast } from 'react-toastify';

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN');
}

const ManageAcademicYears = () => {
  const navigate = useNavigate();
  const [years, setYears] = useState([]);
  const [currentYear, setCurrentYear] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // --- Finish Year States ---
  const [openFinish, setOpenFinish] = useState(false);
  const [finishStudents, setFinishStudents] = useState([]);
  const [graduateMarkedIds, setGraduateMarkedIds] = useState(new Set());
  const [dropoutMarkedIds, setDropoutMarkedIds] = useState(new Set());
  const [finishGradeFilter, setFinishGradeFilter] = useState('');
  const [finishClassFilter, setFinishClassFilter] = useState('');
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  
  // --- Wizard States ---
  const [openWizard, setOpenWizard] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [editForm, setEditForm] = useState({
    yearName: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [finishErrorDetails, setFinishErrorDetails] = useState(null);
  
  // --- Express Setup States ---
  const [openExpress, setOpenExpress] = useState(false);
  const [expressForm, setExpressForm] = useState({
    yearName: '',
    startDate: '',
    endDate: '',
    description: 'Thiết lập tự động từ năm học cũ.'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listResp, currentResp] = await Promise.all([
        get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.LIST),
        get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT)
      ]);

      if (listResp?.status === 'success') setYears(Array.isArray(listResp.data) ? listResp.data : []);
      if (currentResp?.status === 'success') setCurrentYear(currentResp.data || null);

      if (currentResp?.data) {
        const studentsResp = await get(ENDPOINTS.SCHOOL_ADMIN.STUDENTS.LIST_BY_YEAR(currentResp.data._id));
        if (studentsResp?.status === 'success') {
          setFinishStudents(studentsResp.data || []);
          // Default: mark all eligible seniors for graduation
          const seniors = (studentsResp.data || []).filter(isFinishRowSelectable);
          setGraduateMarkedIds(new Set(seniors.map(s => s._id)));
        }
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFinishRowSelectable = (student) => {
    if (!currentYear) return false;
    const canGraduate = student.canChooseGraduation;
    const isOldEnough = student.age >= 5; 
    return canGraduate || isOldEnough;
  };

  const handleToggleGraduateMark = (id) => {
    setGraduateMarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        setDropoutMarkedIds(dPrev => {
          const dNext = new Set(dPrev);
          dNext.delete(id);
          return dNext;
        });
      }
      return next;
    });
  };

  const handleToggleDropoutMark = (id) => {
    setDropoutMarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        setGraduateMarkedIds(gPrev => {
          const gNext = new Set(gPrev);
          gNext.delete(id);
          return gNext;
        });
      }
      return next;
    });
  };

  const handleOpenEdit = (year) => {
    setSelectedYear(year);
    setEditForm({
      yearName: year.yearName,
      startDate: year.startDate ? year.startDate.split('T')[0] : '',
      endDate: year.endDate ? year.endDate.split('T')[0] : '',
      description: year.description || ''
    });
    setOpenEdit(true);
  };

  const handleUpdateYear = async () => {
    if (!editForm.yearName || !editForm.startDate || !editForm.endDate) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setLoading(true);
    try {
      const response = await put(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.UPDATE(selectedYear._id), editForm);
      if (response.status === 'success') {
        toast.success('Cập nhật năm học thành công');
        setOpenEdit(false);
        fetchData();
      }
    } catch (error) {
      toast.error(error.message || 'Lỗi khi cập nhật năm học');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmFinish = async () => {
    try {
      const resp = await post(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.FINISH(currentYear._id), {
        graduatedStudentIds: Array.from(graduateMarkedIds),
        dropoutStudentIds: Array.from(dropoutMarkedIds)
      });

      if (resp?.status === 'success') {
        toast.success('Đã kết thúc năm học thành công.');
        setOpenFinish(false);
        fetchData();
      } else {
        if (resp?.code === 'MISSING_EVALUATIONS') {
          setFinishErrorDetails(resp.data);
          setOpenErrorDialog(true);
        } else {
          toast.error(resp?.message || 'Không thể kết thúc năm học. Vui lòng kiểm tra lại.');
        }
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ.');
    }
  };

  const handlePublishYear = async (yearId) => {
    if (!window.confirm('Bạn có chắc chắn muốn công bố năm học này? Hệ thống sẽ tự động kích hoạt lớp học và điều chuyển học sinh.')) return;
    setLoading(true);
    try {
      const resp = await patch(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.PUBLISH(yearId));
      if (resp?.status === 'success') {
        toast.success(resp.message || 'Công bố năm học thành công!');
        fetchData();
      } else {
        toast.error(resp?.message || 'Có lỗi xảy ra khi công bố năm học');
      }
    } catch (error) {
      toast.error(error.message || 'Lỗi khi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const filteredFinishStudents = useMemo(() => {
    return finishStudents.filter(s => {
      if (finishGradeFilter && s.gradeName !== finishGradeFilter) return false;
      if (finishClassFilter && s.className !== finishClassFilter) return false;
      if (showMissingOnly && s.evaluation?.academicEvaluation) return false;
      return true;
    });
  }, [finishStudents, finishGradeFilter, finishClassFilter, showMissingOnly]);

  const graduateTickCount = Array.from(graduateMarkedIds).length;

  const finishGradeOptions = useMemo(() => [...new Set(finishStudents.map(s => s.gradeName).filter(Boolean))], [finishStudents]);
  const finishClassOptions = useMemo(() => {
    let filtered = finishStudents;
    if (finishGradeFilter) filtered = filtered.filter(s => s.gradeName === finishGradeFilter);
    return [...new Set(filtered.map(s => s.className).filter(Boolean))];
  }, [finishStudents, finishGradeFilter]);

  const handleExpressSetup = async () => {
    if (!expressForm.yearName || !expressForm.startDate || !expressForm.endDate) {
      toast.error('Vui lòng điền đủ thông tin năm học mới');
      return;
    }
    setLoading(true);
    try {
      const resp = await post(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.EXPRESS_SETUP, { yearInfo: expressForm });
      if (resp?.status === 'success') {
        toast.success('🎉 Thiết lập nhanh thành công! Hệ thống đã tạo bản nháp năm học mới.');
        setOpenExpress(false);
        fetchData();
      } else {
        toast.error(resp?.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stack spacing={4}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <CalendarIcon sx={{ fontSize: 32, display: 'block' }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={900} color="#1e293b">Thiết lập Năm học</Typography>
              <Typography variant="body1" color="text.secondary">Tổng quan năm học hiện tại và lịch sử các năm học của trường</Typography>
            </Box>
          </Stack>
          
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {/* Nút Thiết lập nhanh: Chỉ hiện nếu chưa có bản nháp nào */}
              {!years.some(y => y.status === 'draft') && (
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  startIcon={<MagicIcon />}
                  onClick={() => {
                    // Tự động tính toán năm học kế tiếp dựa trên năm gần nhất
                    const lastYear = years.length > 0 ? years[0] : null;
                    let nextYearStart = new Date().getFullYear();
                    if (lastYear && lastYear.startDate) {
                      nextYearStart = new Date(lastYear.startDate).getFullYear() + 1;
                    }
                    
                    setExpressForm({
                      yearName: `Năm học ${nextYearStart}-${nextYearStart + 1}`,
                      startDate: `${nextYearStart}-09-01`,
                      endDate: `${nextYearStart + 1}-05-31`,
                      description: 'Thiết lập tự động từ cấu hình năm cũ.'
                    });
                    setOpenExpress(true);
                  }}
                  sx={{ 
                    borderRadius: 2, textTransform: 'none', fontWeight: 800, px: 3, 
                    border: '2px solid #8b5cf6', color: '#8b5cf6',
                    '&:hover': { border: '2px solid #7c3aed', bgcolor: 'rgba(139, 92, 246, 0.05)' }
                  }}
                >
                  Thiết lập nhanh năm học mới
                </Button>
              )}
              {currentYear && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenEdit(currentYear)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, borderColor: '#6366f1', color: '#6366f1', '&:hover': { borderColor: '#6366f1', bgcolor: 'rgba(99, 102, 241, 0.05)' } }}
                >
                  Sửa thông tin
                </Button>
              )}
              {currentYear ? (
                <Button 
                  variant="contained" 
                  color="error" 
                  startIcon={<ArchiveIcon />}
                  onClick={() => setOpenFinish(true)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
                >
                  Kết thúc năm học
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={() => setOpenWizard(true)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}
                >
                  Tạo năm học mới
                </Button>
              )}
            </Box>
        </Box>

        {currentYear && (
          <Fade in={true}>
            <Paper elevation={0} sx={{ 
              p: 4, 
              borderRadius: 4, 
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <Box sx={{ position: 'absolute', right: -20, top: -20, opacity: 0.1, transform: 'rotate(15deg)' }}>
                <CalendarIcon sx={{ fontSize: 200 }} />
              </Box>
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Stack spacing={1}>
                    <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 700, letterSpacing: 2 }}>NĂM HỌC HIỆN TẠI</Typography>
                    <Typography variant="h3" fontWeight={900}>{currentYear.yearName}</Typography>
                    <Stack direction="row" spacing={3} mt={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.2)' }}>
                          <PeopleIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Typography variant="subtitle2" fontWeight={700}>{currentYear.totalStudents || 0} học sinh</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.2)' }}>
                          <CalendarIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Typography variant="subtitle2" fontWeight={700}>{formatDate(currentYear.startDate)} — {formatDate(currentYear.endDate)}</Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 2.5, borderRadius: 3, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>Mục tiêu & Ghi chú</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>{currentYear.description || 'Chưa có mô tả cho năm học này.'}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Fade>
        )}

        <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={800}>Lịch sử các năm học</Typography>
            <TextField
              size="small"
              placeholder="Tìm kiếm năm học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} /> }}
              sx={{ width: 300 }}
            />
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 800 }}>Tên năm học</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Thời gian</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Sĩ số</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Số lớp</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {years.filter(y => y.yearName.toLowerCase().includes(search.toLowerCase())).map((year) => (
                  <TableRow key={year._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={700}>{year.yearName}</Typography>
                      {year.description && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 300 }}>{year.description}</Typography>}
                    </TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{formatDate(year.startDate)} - {formatDate(year.endDate)}</Typography></TableCell>
                    <TableCell><Chip label={`${year.totalStudents || 0} học sinh`} size="small" sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }} /></TableCell>
                    <TableCell><Chip label={`${year.classCount || 0} lớp`} size="small" sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }} /></TableCell>
                    <TableCell>
                      <Chip 
                        label={
                          year.status === 'active' ? 'Đang hoạt động' : 
                          year.status === 'draft' ? 'Bản nháp' : 'Đã kết thúc'
                        } 
                        color={
                          year.status === 'active' ? 'success' : 
                          year.status === 'draft' ? 'warning' : 'default'
                        } 
                        size="small" 
                        sx={{ fontWeight: 700 }} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                        {year.status === 'draft' && (
                          <Button 
                            size="small" 
                            variant="contained" 
                            color="success"
                            onClick={() => handlePublishYear(year._id)}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                          >
                            Công bố
                          </Button>
                        )}
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(year)} title="Sửa thông tin">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <Button size="small" variant="outlined" onClick={() => navigate(`/school-admin/academic-years/${year._id}`)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>Chi tiết</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Dialog open={openFinish} onClose={() => !loading && setOpenFinish(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
          <DialogTitle sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f1f5f9' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#fff1f2', color: '#e11d48', display: 'flex' }}><ArchiveIcon /></Box>
              <Box>
                <Typography variant="h6" fontWeight={800}>Kết thúc năm học {currentYear?.yearName}</Typography>
                <Typography variant="caption" color="text.secondary">Xác nhận danh sách tốt nghiệp và nghỉ học để lưu trữ dữ liệu năm học cũ.</Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <Stack direction="row" spacing={2} sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Khối lớp</InputLabel>
                <Select value={finishGradeFilter} label="Khối lớp" onChange={e => setFinishGradeFilter(e.target.value)}>
                  <MenuItem value=""><em>Tất cả khối</em></MenuItem>
                  {finishGradeOptions.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Lớp</InputLabel>
                <Select value={finishClassFilter} label="Lớp" onChange={e => setFinishClassFilter(e.target.value)}>
                  <MenuItem value=""><em>Tất cả lớp</em></MenuItem>
                  {finishClassOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <Box sx={{ ml: 'auto' }}>
                <Checkbox size="small" checked={showMissingOnly} onChange={e => setShowMissingOnly(e.target.checked)} color="error" />
                <Typography variant="caption" fontWeight={600} color={showMissingOnly ? "error.main" : "text.secondary"}>Chỉ hiện bé thiếu đánh giá</Typography>
              </Box>
            </Stack>

            {filteredFinishStudents.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}><Typography color="text.secondary">Không có dữ liệu phù hợp bộ lọc.</Typography></Box>
            ) : (
              <Box sx={{ maxHeight: '60vh', overflowY: 'auto', p: 2 }}>
                {(() => {
                  const groups = {};
                  filteredFinishStudents.forEach(s => {
                    const className = s.className || 'Chưa phân lớp';
                    if (!groups[className]) groups[className] = [];
                    groups[className].push(s);
                  });

                  return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0])).map(([className, studentsInClass]) => {
                    const selectableCount = studentsInClass.filter(isFinishRowSelectable).length;
                    const graduateMarkedInClass = studentsInClass.filter(s => graduateMarkedIds.has(s._id)).length;
                    const dropoutMarkedInClass = studentsInClass.filter(s => dropoutMarkedIds.has(s._id)).length;

                    return (
                      <Paper key={className} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, mb: 3, overflow: 'hidden' }}>
                        <Box sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <PeopleIcon sx={{ color: '#6366f1' }} />
                            <Box>
                              <Typography variant="subtitle1" fontWeight={900}>Lớp {className}</Typography>
                              <Typography variant="caption" color="text.secondary">{studentsInClass.length} học sinh</Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            {selectableCount > 0 && (
                              <Button size="small" variant="outlined" color="success" onClick={() => {
                                const ids = studentsInClass.filter(isFinishRowSelectable).map(s => s._id);
                                const allMarked = ids.every(id => graduateMarkedIds.has(id));
                                setGraduateMarkedIds(prev => {
                                  const next = new Set(prev);
                                  if (allMarked) ids.forEach(id => next.delete(id));
                                  else ids.forEach(id => next.add(id));
                                  return next;
                                });
                              }} sx={{ textTransform: 'none', fontWeight: 700 }}>
                                {graduateMarkedInClass === selectableCount ? 'Bỏ chọn TN' : 'Tốt nghiệp cả lớp'}
                              </Button>
                            )}
                            <Button size="small" variant="outlined" color="inherit" onClick={() => {
                              const ids = studentsInClass.map(s => s._id);
                              const allMarked = ids.every(id => dropoutMarkedIds.has(id));
                              setDropoutMarkedIds(prev => {
                                const next = new Set(prev);
                                if (allMarked) ids.forEach(id => next.delete(id));
                                else ids.forEach(id => next.add(id));
                                return next;
                              });
                            }} sx={{ textTransform: 'none', fontWeight: 700, color: '#64748b' }}>
                              {dropoutMarkedInClass === studentsInClass.length ? 'Bỏ chọn nghỉ' : 'Nghỉ học cả lớp'}
                            </Button>
                          </Stack>
                        </Box>
                        <Table size="small">
                          <TableHead><TableRow sx={{ bgcolor: '#fff' }}><TableCell sx={{ fontWeight: 800 }}>Học sinh</TableCell><TableCell sx={{ fontWeight: 800 }}>Đánh giá</TableCell><TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Tốt nghiệp</TableCell><TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Nghỉ học</TableCell></TableRow></TableHead>
                          <TableBody>
                            {studentsInClass.map(s => (
                              <TableRow key={s._id} hover>
                                <TableCell><Stack direction="row" spacing={1.5} alignItems="center"><Avatar src={s.avatar} sx={{ width: 32, height: 32 }}>{s.fullName?.[0]}</Avatar><Box><Typography variant="body2" fontWeight={700}>{s.fullName}</Typography></Box></Stack></TableCell>
                                <TableCell>{s.evaluation?.academicEvaluation ? <Chip label={s.evaluation.academicEvaluation.toUpperCase()} size="small" color={s.evaluation.academicEvaluation === 'đạt' ? 'success' : 'error'} sx={{ fontWeight: 800, fontSize: 10 }} /> : <Typography variant="caption" color="error" fontWeight={700}>Chưa đánh giá</Typography>}</TableCell>
                                <TableCell align="center">{isFinishRowSelectable(s) ? <Checkbox checked={graduateMarkedIds.has(s._id)} onChange={() => handleToggleGraduateMark(s._id)} disabled={dropoutMarkedIds.has(s._id)} color="success" /> : <Chip label="Học tiếp" size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: 10 }} />}</TableCell>
                                <TableCell align="center"><Checkbox checked={dropoutMarkedIds.has(s._id)} onChange={() => handleToggleDropoutMark(s._id)} color="error" /></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Paper>
                    );
                  });
                })()}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Khối <strong>năm cuối</strong>: <strong>{graduateTickCount}</strong> em tốt nghiệp</Typography>
            <Stack direction="row" spacing={1.5}>
              <Button onClick={() => setOpenFinish(false)} sx={{ textTransform: 'none' }}>Hủy</Button>
              <Button variant="contained" color="error" onClick={handleConfirmFinish} sx={{ textTransform: 'none', fontWeight: 700, px: 4 }}>Xác nhận kết thúc năm học</Button>
            </Stack>
          </DialogActions>
        </Dialog>

        <Dialog open={openErrorDialog} onClose={() => setOpenErrorDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'error.main' }}>
            <WarningIcon color="error" />
            <Typography variant="h6" fontWeight={700}>Chưa thể kết thúc năm học</Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body1" mb={2} fontWeight={600}>{finishErrorDetails?.message}</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Tổng số hồ sơ chưa cập nhật: <strong>{finishErrorDetails?.totalMissing}</strong> học sinh. Vui lòng yêu cầu giáo viên hoàn tất đánh giá định kỳ cuối năm học.</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}><Button variant="contained" fullWidth onClick={() => setOpenErrorDialog(false)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>Tôi đã hiểu</Button></DialogActions>
        </Dialog>

        <Dialog open={openEdit} onClose={() => !loading && setOpenEdit(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
          <DialogTitle sx={{ borderBottom: '1px solid #f1f5f9', fontWeight: 800 }}>Chỉnh sửa Năm học</DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Stack spacing={2.5}>
              <TextField
                label="Tên năm học *"
                fullWidth
                size="small"
                value={editForm.yearName}
                onChange={(e) => setEditForm({ ...editForm, yearName: e.target.value })}
                placeholder="Ví dụ: 2024-2025"
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Ngày bắt đầu *"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                />
                <TextField
                  label="Ngày kết thúc *"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              </Stack>
              <TextField
                label="Mô tả / Ghi chú"
                fullWidth
                multiline
                rows={3}
                size="small"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setOpenEdit(false)} disabled={loading} sx={{ textTransform: 'none', fontWeight: 700 }}>Hủy</Button>
            <Button 
              variant="contained" 
              onClick={handleUpdateYear} 
              disabled={loading}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogActions>
        </Dialog>

        <AcademicYearWizard
          open={openWizard}
          onClose={() => setOpenWizard(false)}
          onSuccess={() => { fetchData(); }}
        />

        {/* Express Setup Dialog */}
        <Dialog open={openExpress} onClose={() => !loading && setOpenExpress(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', 
            color: 'white', fontWeight: 800, py: 3 
          }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <MagicIcon />
              <Typography variant="h6" fontWeight={800}>Thiết lập siêu tốc (1-Click)</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Hệ thống sẽ tự động sao chép toàn bộ Khối, Lớp, Giáo viên từ năm cũ và thực hiện <strong>xếp lớp thông minh</strong> cho học sinh. Bản thảo sẽ được tạo ở trạng thái nháp.
            </Typography>
            <Stack spacing={2.5}>
              <TextField
                label="Tên năm học mới *"
                fullWidth size="small"
                value={expressForm.yearName}
                onChange={(e) => setExpressForm({ ...expressForm, yearName: e.target.value })}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Bắt đầu *" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }}
                  value={expressForm.startDate}
                  onChange={(e) => setExpressForm({ ...expressForm, startDate: e.target.value })}
                />
                <TextField
                  label="Kết thúc *" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }}
                  value={expressForm.endDate}
                  onChange={(e) => setExpressForm({ ...expressForm, endDate: e.target.value })}
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setOpenExpress(false)} disabled={loading} sx={{ textTransform: 'none' }}>Hủy</Button>
            <Button 
              variant="contained" 
              onClick={handleExpressSetup} 
              disabled={loading}
              sx={{ 
                borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 4,
                bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' }
              }}
            >
              {loading ? 'Đang xử lý...' : 'Bắt đầu thiết lập ngay'}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  );
};

export default ManageAcademicYears;
