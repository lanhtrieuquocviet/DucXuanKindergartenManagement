import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { get, post, patch, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Avatar,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Archive as ArchiveIcon,
  Add as AddIcon,
  Search as SearchIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxBlankIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN');
}

function ManageAcademicYears() {
  const [currentYear, setCurrentYear] = useState(null);
  const [years, setYears] = useState([]);
  const [archiveYear, setArchiveYear] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // --- Tạo năm học mới ---
  const [openCreate, setOpenCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', startDate: '', endDate: '', termCount: 2,
    term1StartDate: '', term1EndDate: '',
    term2StartDate: '', term2EndDate: '',
    description: '',
  });
  const [createErrors, setCreateErrors] = useState({});

  // --- Kết thúc năm học + chọn học sinh chuyển tiếp ---
  const [openFinish, setOpenFinish] = useState(false);
  const [finishStudents, setFinishStudents] = useState([]);
  const [finishLoading, setFinishLoading] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  // Lưu lại khi đã confirm kết thúc, dùng khi tạo năm mới
  const [carryOverStudentIds, setCarryOverStudentIds] = useState([]);

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };
  const handleViewProfile = () => navigate('/profile');
  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);
  const userName = user?.fullName || user?.username || 'School Admin';
  const canCreateNewYear = !currentYear || currentYear.status !== 'active';

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const [currentResp, listResp] = await Promise.all([
          get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT),
          get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.LIST),
        ]);
        if (currentResp?.status === 'success') setCurrentYear(currentResp.data || null);
        if (listResp?.status === 'success') {
          const list = Array.isArray(listResp.data) ? listResp.data : [];
          setYears(list);
          if (!archiveYear && list.length > 0) {
            const inactive = list.find((y) => y.status !== 'active');
            setArchiveYear(inactive?._id || list[0]._id);
          }
        }
      } catch (error) {
        console.error('Error fetching academic years:', error);
      }
    };
    fetchYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============ Finish year dialog ============
  const handleOpenFinish = async () => {
    if (!currentYear || currentYear.status !== 'active') return;
    setOpenFinish(true);
    setFinishLoading(true);
    setFinishStudents([]);
    setSelectedStudentIds(new Set());
    try {
      const resp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.STUDENTS(currentYear._id));
      if (resp?.status === 'success' && Array.isArray(resp.data)) {
        setFinishStudents(resp.data);
        // Mặc định chọn tất cả học sinh không có ghi chú đặc biệt
        // Học sinh có ghi chú đặc biệt để người dùng tự quyết định
        const defaultSelected = resp.data
          .filter(s => !s.needsSpecialAttention)
          .map((s) => s._id);
        setSelectedStudentIds(new Set(defaultSelected));
      }
    } catch (err) {
      console.error('Error loading students for finish:', err);
    } finally {
      setFinishLoading(false);
    }
  };

  const handleToggleStudent = (id) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    const normalStudents = finishStudents.filter(s => !s.needsSpecialAttention);
    const specialStudents = finishStudents.filter(s => s.needsSpecialAttention);

    if (selectedStudentIds.size === finishStudents.length) {
      // Nếu đã chọn tất cả, bỏ chọn tất cả
      setSelectedStudentIds(new Set());
    } else if (selectedStudentIds.size === normalStudents.length && specialStudents.length > 0) {
      // Nếu chỉ chọn học sinh bình thường, chọn thêm học sinh đặc biệt
      setSelectedStudentIds(new Set(finishStudents.map((s) => s._id)));
    } else {
      // Chọn tất cả học sinh bình thường
      setSelectedStudentIds(new Set(normalStudents.map((s) => s._id)));
    }
  };

  const handleConfirmFinish = async () => {
    if (!currentYear) return;
    try {
      const selectedIds = Array.from(selectedStudentIds);
      const resp = await patch(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.FINISH(currentYear._id), {
        selectedStudentIds: selectedIds
      });
      if (resp?.status === 'success') {
        const updated = resp.data;
        setCurrentYear(updated);
        setYears((prev) => prev.map((y) => (y._id === updated._id ? updated : y)));
        setCarryOverStudentIds(selectedIds);
        setOpenFinish(false);
        toast.success(
          `Đã kết thúc năm học. ${selectedIds.length} học sinh sẽ được chuyển tiếp sang năm học mới. ${updated.graduatedCount || 0} học sinh đã tốt nghiệp.`,
        );
      }
    } catch (error) {
      console.error('Error finishing academic year:', error);
      toast.error('Không thể kết thúc năm học');
    }
  };

  // ============ Create year dialog ============
  const handleOpenCreate = () => {
    if (!canCreateNewYear) return;
    setCreateForm({
      name: '', startDate: '', endDate: '', termCount: 2,
      term1StartDate: '', term1EndDate: '',
      term2StartDate: '', term2EndDate: '',
      description: '',
    });
    setCreateErrors({});
    setOpenCreate(true);
  };

  const handleSubmitCreate = () => {
    if (!canCreateNewYear) return;
    const errors = {};
    if (!createForm.name.trim())          errors.name = 'Vui lòng nhập tên năm học';
    if (!createForm.startDate)            errors.startDate = 'Vui lòng chọn ngày bắt đầu';
    if (!createForm.endDate)              errors.endDate = 'Vui lòng chọn ngày kết thúc';
    if (!createForm.term1StartDate)       errors.term1StartDate = 'Vui lòng chọn ngày bắt đầu kỳ 1';
    if (!createForm.term1EndDate)         errors.term1EndDate = 'Vui lòng chọn ngày kết thúc kỳ 1';
    if (!createForm.term2StartDate)       errors.term2StartDate = 'Vui lòng chọn ngày bắt đầu kỳ 2';
    if (!createForm.term2EndDate)         errors.term2EndDate = 'Vui lòng chọn ngày kết thúc kỳ 2';
    if (!createForm.description.trim())   errors.description = 'Vui lòng nhập mô tả / mục tiêu năm học';

    if (createForm.startDate && createForm.endDate) {
      if (new Date(createForm.startDate) >= new Date(createForm.endDate))
        errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    if (createForm.startDate && createForm.endDate) {
      const yearStart = new Date(createForm.startDate);
      const yearEnd = new Date(createForm.endDate);
      const termDateChecks = [
        ['term1StartDate', createForm.term1StartDate, 'Ngày bắt đầu kỳ 1'],
        ['term1EndDate', createForm.term1EndDate, 'Ngày kết thúc kỳ 1'],
        ['term2StartDate', createForm.term2StartDate, 'Ngày bắt đầu kỳ 2'],
        ['term2EndDate', createForm.term2EndDate, 'Ngày kết thúc kỳ 2'],
      ];
      termDateChecks.forEach(([field, value, label]) => {
        if (!value) return;
        const dateValue = new Date(value);
        if (dateValue < yearStart || dateValue > yearEnd) {
          errors[field] = `${label} phải nằm trong khoảng thời gian năm học`;
        }
      });
    }
    if (createForm.term1StartDate && createForm.term1EndDate) {
      if (new Date(createForm.term1StartDate) >= new Date(createForm.term1EndDate))
        errors.term1EndDate = 'Ngày kết thúc kỳ 1 phải sau ngày bắt đầu kỳ 1';
    }
    if (createForm.term2StartDate && createForm.term2EndDate) {
      if (new Date(createForm.term2StartDate) >= new Date(createForm.term2EndDate))
        errors.term2EndDate = 'Ngày kết thúc kỳ 2 phải sau ngày bắt đầu kỳ 2';
    }
    if (createForm.term1EndDate && createForm.term2StartDate) {
      if (new Date(createForm.term1EndDate) > new Date(createForm.term2StartDate))
        errors.term2StartDate = 'Kỳ 2 không thể bắt đầu trước khi kết thúc kỳ 1';
    }

    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      yearName: createForm.name.trim(),
      startDate: createForm.startDate,
      endDate: createForm.endDate,
      termCount: 2,
      term1StartDate: createForm.term1StartDate,
      term1EndDate: createForm.term1EndDate,
      term2StartDate: createForm.term2StartDate,
      term2EndDate: createForm.term2EndDate,
      description: createForm.description.trim(),
      carryOverStudentIds,
    };

    post(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CREATE, payload)
      .then((resp) => {
        if (resp?.status === 'success') {
          const newYear = resp.data;
          setCurrentYear(newYear);
          setYears((prev) => [newYear, ...prev]);
          setCarryOverStudentIds([]);
          setOpenCreate(false);
          const count = resp.carryOverCount ?? carryOverStudentIds.length;
          toast.success(
            count > 0
              ? `Tạo năm học mới thành công. Đã chuyển tiếp ${count} học sinh.`
              : 'Tạo năm học mới thành công.',
          );
        }
      })
      .catch((error) => {
        console.error('Error creating academic year:', error);
        setCreateErrors((prev) => ({
          ...prev,
          api: error.message || 'Không thể tạo năm học mới',
        }));
      });
  };

  const handleSearchHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistory([]);
      let endpoint = ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.HISTORY;
      if (archiveYear) {
        const params = new URLSearchParams();
        params.set('yearId', archiveYear);
        endpoint = `${endpoint}?${params.toString()}`;
      }
      const resp = await get(endpoint);
      if (resp?.status === 'success' && Array.isArray(resp.data)) setHistory(resp.data);
    } catch (error) {
      console.error('Error loading academic year history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const allSelected = finishStudents.length > 0 && selectedStudentIds.size === finishStudents.length;
  const someSelected = selectedStudentIds.size > 0 && !allSelected;

  return (
    <RoleLayout
      title="Thiết lập Năm học"
      description="Tổng quan năm học đang hoạt động, và tra cứu lịch sử các năm học trước."
      menuItems={menuItems}
      activeKey="academic-year-setup"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
      <Stack spacing={3}>
        {/* Header card */}
        <Paper
          elevation={0}
          sx={{
            p: 3, borderRadius: 2,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.8 }}>
                MamNon DX &gt; Ban Giám Hiệu &gt; Thiết lập Năm học
              </Typography>
              <Typography variant="h6" fontWeight={700} mt={0.5}>
                {currentYear?.yearName || 'Chưa có năm học đang hoạt động'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }} mt={0.5}>
                Tổng quan năm học đang hoạt động. Bạn có thể thiết lập kế hoạch chi tiết ở các menu bên trái.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                bgcolor: 'white', color: '#4f46e5', fontWeight: 600,
                textTransform: 'none', borderRadius: 2,
                '&:hover': { bgcolor: '#e5e7ff' },
              }}
              disabled={!canCreateNewYear}
              onClick={handleOpenCreate}
            >
              Tạo năm học mới
            </Button>
          </Stack>
        </Paper>

        {/* Current year card */}
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{ width: 56, height: 56, borderRadius: 2, background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <CalendarIcon />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Năm học hiện tại</Typography>
              <Typography variant="h6" fontWeight={700} color="text.primary" mt={0.5}>
                {currentYear?.yearName || 'Chưa có năm học đang hoạt động'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {currentYear
                  ? `Bắt đầu: ${formatDate(currentYear.startDate)} – Kết thúc: ${formatDate(currentYear.endDate)}`
                  : 'Chưa thiết lập thời gian năm học'}
              </Typography>
              {carryOverStudentIds.length > 0 && (
                <Chip
                  size="small"
                  label={`${carryOverStudentIds.length} học sinh sẽ được chuyển tiếp`}
                  color="info"
                  sx={{ mt: 1, fontWeight: 600 }}
                />
              )}
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label={currentYear?.status === 'active' ? 'Đang hoạt động' : 'Đã kết thúc'}
              color={currentYear?.status === 'active' ? 'success' : 'default'}
              sx={{ fontWeight: 600 }}
            />
            <Button
              variant="outlined"
              color="error"
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              disabled={!currentYear || currentYear.status !== 'active'}
              onClick={handleOpenFinish}
            >
              Kết thúc năm học
            </Button>
          </Stack>
        </Paper>

        {/* Archive section */}
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
            <ArchiveIcon sx={{ color: '#6b7280' }} />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Lưu trữ &amp; Lịch sử năm học</Typography>
              <Typography variant="body2" color="text.secondary">
                Tra cứu dữ liệu cũ hoặc phân tích xu hướng phát triển qua các năm học.
              </Typography>
            </Box>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Năm học</InputLabel>
              <Select label="Năm học" value={archiveYear} onChange={(e) => setArchiveYear(e.target.value)}>
                {years.filter((y) => y.status !== 'active').map((y) => (
                  <MenuItem key={y._id} value={y._id}>{y.yearName} (đã kết thúc)</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
              onClick={handleSearchHistory}
            >
              Tra cứu
            </Button>
          </Stack>

          {historyLoading && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Đang tải kết quả tra cứu...</Typography>
            </Box>
          )}

          {!historyLoading && history.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Kết quả tìm kiếm</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
                {history.map((item) => (
                  <Paper key={item._id} elevation={0} sx={{ flex: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 2.5, backgroundColor: 'grey.50' }}>
                    <Typography variant="subtitle1" fontWeight={700}>{item.yearName}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Thời gian: {formatDate(item.startDate)} – {formatDate(item.endDate)}
                    </Typography>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Số lớp / Số trẻ</Typography>
                        <Typography variant="body2" fontWeight={600}>{item.classCount} lớp | {item.studentCount} trẻ</Typography>
                      </Stack>
                    </Stack>
                    <Box sx={{ mt: 2 }}>
                      <Button size="small" variant="contained" sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#e0f2fe', color: '#0369a1', '&:hover': { bgcolor: '#bae6fd' } }}
                        onClick={() => navigate(`/school-admin/academic-years/${item._id}`)}>
                        Tra cứu chi tiết năm học
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}
        </Paper>

        {/* ======== Dialog: Kết thúc năm học ======== */}
        <Dialog open={openFinish} onClose={() => setOpenFinish(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 1.5, background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', color: 'white' }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Kết thúc năm học — Chọn học sinh chuyển tiếp
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.25 }}>
              Chọn những học sinh sẽ được chuyển tiếp sang năm học mới. Học sinh không được chọn sẽ có trạng thái "Đã tốt nghiệp".
              Học sinh có ghi chú đặc biệt được đánh dấu màu vàng — hãy xem xét kỹ trước khi quyết định.
            </Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0 }}>
            {finishLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : finishStudents.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color="text.secondary">Không có học sinh nào trong năm học này.</Typography>
              </Box>
            ) : (
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ bgcolor: '#f9fafb' }}>
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={handleToggleAll}
                        icon={<CheckBoxBlankIcon />}
                        checkedIcon={<CheckBoxIcon />}
                      />
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 700 }}>Học sinh</TableCell>
                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 700 }}>Lớp</TableCell>
                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 700 }}>Ngày sinh</TableCell>
                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 700 }}>Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {finishStudents.map((s) => (
                    <TableRow
                      key={s._id}
                      hover
                      selected={selectedStudentIds.has(s._id)}
                      onClick={() => handleToggleStudent(s._id)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: s.needsSpecialAttention ? '#fffbeb' : 'inherit',
                        '&:hover': {
                          bgcolor: s.needsSpecialAttention ? '#fef3c7' : '#f9fafb'
                        }
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={selectedStudentIds.has(s._id)} onChange={() => handleToggleStudent(s._id)} onClick={(e) => e.stopPropagation()} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar src={s.avatar} sx={{ width: 32, height: 32, fontSize: 13 }}>
                            {s.fullName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{s.fullName}</Typography>
                            {s.needsSpecialAttention && s.specialNote && (
                              <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.25 }}>
                                <WarningIcon sx={{ fontSize: 12, mr: 0.25, verticalAlign: 'middle' }} />
                                {s.specialNote}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell><Typography variant="body2">{s.className || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('vi-VN') : '—'}</Typography></TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip
                            size="small"
                            label={
                              s.status === 'active' ? 'Đang học' :
                              s.status === 'graduated' ? 'Đã tốt nghiệp' :
                              'Nghỉ học'
                            }
                            color={
                              s.status === 'active' ? 'success' :
                              s.status === 'graduated' ? 'primary' :
                              'default'
                            }
                          />
                          {s.needsSpecialAttention && (
                            <InfoIcon sx={{ fontSize: 16, color: 'warning.main' }} titleAccess="Học sinh cần chú ý đặc biệt" />
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Đã chọn <strong>{selectedStudentIds.size}</strong> / {finishStudents.length} học sinh
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <Button onClick={() => setOpenFinish(false)} sx={{ textTransform: 'none' }}>Hủy</Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleConfirmFinish}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Xác nhận kết thúc năm học
              </Button>
            </Stack>
          </DialogActions>
        </Dialog>

        {/* ======== Dialog: Tạo năm học mới ======== */}
        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ pb: 2, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white' }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AddIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Tạo năm học mới</Typography>
                {carryOverStudentIds.length > 0 && (
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {carryOverStudentIds.length} học sinh sẽ được chuyển tiếp tự động
                  </Typography>
                )}
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 2 }} dividers>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="primary" fontWeight={700} gutterBottom>Thông tin năm học</Typography>
                <TextField label="Tên năm học *" placeholder="Ví dụ: 2025 – 2026" fullWidth size="small"
                  value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  error={!!createErrors.name} helperText={createErrors.name} />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="primary" fontWeight={700} gutterBottom>Thời gian &amp; Cấu trúc kỳ</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField label="Ngày bắt đầu *" type="date" InputLabelProps={{ shrink: true }} fullWidth size="small"
                    value={createForm.startDate} onChange={(e) => setCreateForm((p) => ({ ...p, startDate: e.target.value }))}
                    error={!!createErrors.startDate} helperText={createErrors.startDate} />
                  <TextField label="Ngày kết thúc *" type="date" InputLabelProps={{ shrink: true }} fullWidth size="small"
                    value={createForm.endDate} onChange={(e) => setCreateForm((p) => ({ ...p, endDate: e.target.value }))}
                    inputProps={{ min: createForm.startDate || undefined }}
                    error={!!createErrors.endDate} helperText={createErrors.endDate} />
                </Stack>

                <FormControl size="small" sx={{ mt: 2, minWidth: 200 }}>
                  <InputLabel>Số lượng kỳ/học kỳ *</InputLabel>
                  <Select label="Số lượng kỳ/học kỳ *" value={createForm.termCount} disabled>
                    <MenuItem value={2}>2 kỳ</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="primary" fontWeight={700} gutterBottom>Chi tiết thời gian từng kỳ học</Typography>
                  <Stack spacing={2}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle2" fontWeight={700} mb={1}>Kỳ 1</Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField label="Ngày bắt đầu kỳ 1 *" type="date" InputLabelProps={{ shrink: true }} fullWidth size="small"
                          value={createForm.term1StartDate} onChange={(e) => setCreateForm((p) => ({ ...p, term1StartDate: e.target.value }))}
                          inputProps={{
                            min: createForm.startDate || undefined,
                            max: createForm.endDate || undefined,
                          }}
                          error={!!createErrors.term1StartDate} helperText={createErrors.term1StartDate} />
                        <TextField label="Ngày kết thúc kỳ 1 *" type="date" InputLabelProps={{ shrink: true }} fullWidth size="small"
                          value={createForm.term1EndDate} onChange={(e) => setCreateForm((p) => ({ ...p, term1EndDate: e.target.value }))}
                          inputProps={{
                            min: createForm.term1StartDate || createForm.startDate || undefined,
                            max: createForm.endDate || undefined,
                          }}
                          error={!!createErrors.term1EndDate} helperText={createErrors.term1EndDate} />
                      </Stack>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle2" fontWeight={700} mb={1}>Kỳ 2</Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField label="Ngày bắt đầu kỳ 2 *" type="date" InputLabelProps={{ shrink: true }} fullWidth size="small"
                          value={createForm.term2StartDate} onChange={(e) => setCreateForm((p) => ({ ...p, term2StartDate: e.target.value }))}
                          inputProps={{
                            min: createForm.startDate || undefined,
                            max: createForm.endDate || undefined,
                          }}
                          error={!!createErrors.term2StartDate} helperText={createErrors.term2StartDate} />
                        <TextField label="Ngày kết thúc kỳ 2 *" type="date" InputLabelProps={{ shrink: true }} fullWidth size="small"
                          value={createForm.term2EndDate} onChange={(e) => setCreateForm((p) => ({ ...p, term2EndDate: e.target.value }))}
                          inputProps={{
                            min: createForm.term2StartDate || createForm.startDate || undefined,
                            max: createForm.endDate || undefined,
                          }}
                          error={!!createErrors.term2EndDate} helperText={createErrors.term2EndDate} />
                      </Stack>
                    </Paper>
                  </Stack>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="primary" fontWeight={700} gutterBottom>Kế hoạch tổng thể</Typography>
                <TextField
                  label="Mô tả ngắn gọn / Mục tiêu năm học"
                  placeholder="Ví dụ: Tập trung phát triển kỹ năng mềm..."
                  fullWidth size="small" multiline minRows={3}
                  value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  error={!!createErrors.description} helperText={createErrors.description} />
              </Box>

              {carryOverStudentIds.length > 0 && (
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <Typography variant="body2" color="primary" fontWeight={700}>
                    ✓ {carryOverStudentIds.length} học sinh được chuyển tiếp từ năm học cũ sẽ tự động được thêm vào năm học mới này.
                  </Typography>
                </Paper>
              )}

              {createErrors.api && (
                <Typography variant="body2" color="error">{createErrors.api}</Typography>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenCreate(false)} sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#f3f4f6', color: '#6b7280', '&:hover': { bgcolor: '#e5e7eb' } }}>
              Hủy
            </Button>
            <Button variant="contained" onClick={handleSubmitCreate} disabled={!canCreateNewYear}
              sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
              Tạo năm học
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </RoleLayout>
  );
}

export default ManageAcademicYears;
