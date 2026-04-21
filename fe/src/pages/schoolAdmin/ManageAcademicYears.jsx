import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { get, patch, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';
import AcademicYearWizard from './AcademicYearWizard/WizardContainer';
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
} from '@mui/icons-material';

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN');
}

function normalizeGradeLabel(name) {
  return String(name || '')
    .replace(/\u2013|\u2014/g, '-')
    .toLowerCase();
}

function hasGraduationAgeBandFromNumbers(minAge, maxAge) {
  const min = Number(minAge);
  const max = Number(maxAge);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
  return min >= 5 && max >= 6;
}

/**
 * Khối năm cuối (được tick tốt nghiệp): ưu tiên cờ từ API theo min/max tuổi Grade;
 * không phụ thuộc tên "Khối chồi" / "Khối lá". Fallback: tên khối có chuỗi 5-6 (dữ liệu cũ).
 */
function isFinishRowSelectable(s) {
  if (typeof s.canChooseGraduation === 'boolean') return s.canChooseGraduation;
  if (hasGraduationAgeBandFromNumbers(s.gradeMinAge, s.gradeMaxAge)) return true;
  return normalizeGradeLabel(s.gradeName).includes('5-6');
}

function ManageAcademicYears() {
  const [currentYear, setCurrentYear] = useState(null);
  const [years, setYears] = useState([]);
  const [archiveYear, setArchiveYear] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);



  // --- Kết thúc năm học: tick = tốt nghiệp (chỉ khối năm cuối theo tuổi cấu hình); API selectedStudentIds = id tốt nghiệp ---
  const [openFinish, setOpenFinish] = useState(false);
  const [finishStudents, setFinishStudents] = useState([]);
  const [finishLoading, setFinishLoading] = useState(false);
  const [graduateMarkedIds, setGraduateMarkedIds] = useState(new Set());
  const [finishGradeFilter, setFinishGradeFilter] = useState('');
  const [finishClassFilter, setFinishClassFilter] = useState('');
  // --- Wizard tạo năm học mới ---
  const [openWizard, setOpenWizard] = useState(false);

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
    setFinishGradeFilter('');
    setFinishClassFilter('');
    setGraduateMarkedIds(new Set());
    try {
      const resp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.STUDENTS(currentYear._id));
      if (resp?.status === 'success' && Array.isArray(resp.data)) {
        setFinishStudents(resp.data);
        
        // --- LOGIC HỢP LÝ: Tự động đề xuất dựa trên đánh giá ---
        const autoGraduateIds = new Set();
        resp.data.forEach(s => {
          if (isFinishRowSelectable(s)) {
            // Nếu là khối năm cuối và đã Đạt -> Tự động đánh dấu tốt nghiệp
            if (s.evaluation?.academicEvaluation === 'đạt') {
              autoGraduateIds.add(s._id);
            }
          }
        });
        setGraduateMarkedIds(autoGraduateIds);
      }
    } catch (err) {
      console.error('Error loading students for finish:', err);
    } finally {
      setFinishLoading(false);
    }
  };

  const handleToggleGraduateMark = (id) => {
    const row = finishStudents.find((s) => String(s._id) === String(id));
    if (!row || !isFinishRowSelectable(row)) return;
    setGraduateMarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAllGraduateMarks = () => {
    const visibleSelectable = filteredFinishStudents.filter(isFinishRowSelectable);
    const ids = visibleSelectable.map((s) => s._id);
    setGraduateMarkedIds((prev) => {
      const allVisibleMarked = ids.length > 0 && ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allVisibleMarked) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleConfirmFinish = async () => {
    if (!currentYear) return;

    // Kiểm tra xem còn học sinh chưa đánh giá không
    const unEvaluatedCount = finishStudents.filter(s => !s.evaluation?.academicEvaluation).length;
    if (unEvaluatedCount > 0) {
      if (!window.confirm(`Còn ${unEvaluatedCount} học sinh chưa có kết quả đánh giá cuối năm. Bạn có chắc chắn muốn kết thúc năm học không?`)) {
        return;
      }
    }

    try {
      const graduateIds = finishStudents
        .filter((s) => isFinishRowSelectable(s) && graduateMarkedIds.has(s._id))
        .map((s) => String(s._id));

      const resp = await patch(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.FINISH(currentYear._id), {
        selectedStudentIds: graduateIds
      });
      if (resp?.status === 'success') {
        const updated = resp.data;
        setCurrentYear(updated);
        setYears((prev) => prev.map((y) => (y._id === updated._id ? updated : y)));
        setOpenFinish(false);
        toast.success(`Đã kết thúc năm học thành công.`);
      }
    } catch (error) {
      console.error('Error finishing academic year:', error);
      toast.error('Không thể kết thúc năm học');
    }
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

  const filteredFinishStudents = useMemo(() => {
    const g = finishGradeFilter.trim();
    const c = finishClassFilter.trim();
    return finishStudents.filter((s) => {
      const gn = (s.gradeName || '').trim();
      const cn = (s.className || '').trim();
      if (g && gn !== g) return false;
      if (c && cn !== c) return false;
      return true;
    });
  }, [finishStudents, finishGradeFilter, finishClassFilter]);

  const finishGradeOptions = useMemo(() => {
    const set = new Set(finishStudents.map((s) => (s.gradeName || '').trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [finishStudents]);

  const finishClassOptions = useMemo(() => {
    const pool = finishGradeFilter.trim()
      ? finishStudents.filter((s) => (s.gradeName || '').trim() === finishGradeFilter.trim())
      : finishStudents;
    const set = new Set(pool.map((s) => (s.className || '').trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [finishStudents, finishGradeFilter]);

  const visibleSelectableFinish = useMemo(
    () => filteredFinishStudents.filter(isFinishRowSelectable),
    [filteredFinishStudents],
  );

  const allSelected =
    visibleSelectableFinish.length > 0 &&
    visibleSelectableFinish.every((s) => graduateMarkedIds.has(s._id));
  const someSelected =
    visibleSelectableFinish.some((s) => graduateMarkedIds.has(s._id)) && !allSelected;

  const finishSelectableTotal = useMemo(
    () => finishStudents.filter(isFinishRowSelectable).length,
    [finishStudents],
  );
  const graduateTickCount = useMemo(
    () =>
      finishStudents.reduce(
        (n, s) => n + (isFinishRowSelectable(s) && graduateMarkedIds.has(s._id) ? 1 : 0),
        0,
      ),
    [finishStudents, graduateMarkedIds],
  );

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
              onClick={() => setOpenWizard(true)}
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
              Kết thúc năm học — Xử lý học sinh theo khối lớp
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.25 }}>
              • Hệ thống tự động đề xuất <strong>Tốt nghiệp</strong> cho trẻ khối năm cuối có kết quả <strong>Đạt</strong>.<br/>
              • Trẻ <strong>Chưa đạt</strong> hoặc <strong>Chưa đánh giá</strong> sẽ mặc định <strong>Học tiếp</strong> (ở lại lớp hoặc chuyển khối tùy cấu hình).
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
              <>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  sx={{ px: 2, py: 1.5, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, flexShrink: 0 }}>
                    Lọc danh sách xét duyệt:
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                    <InputLabel>Khối</InputLabel>
                    <Select
                      label="Khối"
                      value={finishGradeFilter}
                      onChange={(e) => {
                        setFinishGradeFilter(e.target.value);
                        setFinishClassFilter('');
                      }}
                    >
                      <MenuItem value="">
                        <em>Tất cả khối</em>
                      </MenuItem>
                      {finishGradeOptions.map((name) => (
                        <MenuItem key={name} value={name}>
                          {name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                    <InputLabel>Lớp</InputLabel>
                    <Select
                      label="Lớp"
                      value={finishClassFilter}
                      onChange={(e) => setFinishClassFilter(e.target.value)}
                      disabled={finishClassOptions.length === 0}
                    >
                      <MenuItem value="">
                        <em>Tất cả lớp{finishGradeFilter.trim() ? ' (theo khối đã chọn)' : ''}</em>
                      </MenuItem>
                      {finishClassOptions.map((name) => (
                        <MenuItem key={name} value={name}>
                          {name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
                {filteredFinishStudents.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center', px: 2 }}>
                    <Typography color="text.secondary">
                      Không có học sinh nào khớp bộ lọc khối / lớp. Hãy đổi bộ lọc hoặc chọn &quot;Tất cả&quot; để xem lại danh sách.
                    </Typography>
                  </Box>
                ) : (
                <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ bgcolor: '#f9fafb' }}>
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={handleToggleAllGraduateMarks}
                        icon={<CheckBoxBlankIcon />}
                        checkedIcon={<CheckBoxIcon />}
                      />
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 700 }}>Học sinh</TableCell>
                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 700 }}>Lớp</TableCell>
                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 700 }}>Kết quả Đánh giá</TableCell>
                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 700 }}>Xử lý Cuối năm</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFinishStudents.map((s) => (
                    <TableRow
                      key={s._id}
                      hover
                      selected={isFinishRowSelectable(s) && graduateMarkedIds.has(s._id)}
                      sx={{
                        cursor: isFinishRowSelectable(s) ? 'pointer' : 'default',
                        bgcolor: s.needsSpecialAttention ? '#fffbeb' : 'inherit',
                      }}
                    >
                      <TableCell padding="checkbox">
                        {isFinishRowSelectable(s) ? (
                            <Checkbox
                              checked={graduateMarkedIds.has(s._id)}
                              onChange={() => handleToggleGraduateMark(s._id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <Box sx={{ width: 24, height: 24 }} />
                          )}
                      </TableCell>
                      <TableCell onClick={() => isFinishRowSelectable(s) && handleToggleGraduateMark(s._id)}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar src={s.avatar} sx={{ width: 32, height: 32, fontSize: 13, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); navigate(`/school-admin/students/${s._id}/detail`); }}>
                            {s.fullName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600} 
                              sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}
                              onClick={(e) => { e.stopPropagation(); navigate(`/school-admin/students/${s._id}/detail`); }}
                            >
                              {s.fullName}
                            </Typography>
                            {s.needsSpecialAttention && (
                              <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
                                <WarningIcon sx={{ fontSize: 12, mr: 0.25, verticalAlign: 'middle' }} />
                                Cần chú ý đặc biệt
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell><Typography variant="body2">{s.className || '—'}</Typography></TableCell>
                      <TableCell>
                        {s.evaluation?.academicEvaluation ? (
                          <Chip
                            size="small"
                            label={s.evaluation.academicEvaluation === 'đạt' ? 'Đạt (Đủ điều kiện)' : 'Chưa đạt'}
                            color={s.evaluation.academicEvaluation === 'đạt' ? 'success' : 'error'}
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                          />
                        ) : (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <WarningIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                            <Typography variant="caption" color="#b45309" fontWeight={600}>Chưa đánh giá</Typography>
                          </Stack>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          if (!isFinishRowSelectable(s)) {
                            return (
                              <Chip label="Lên lớp (Tự động)" size="small" sx={{ bgcolor: '#eef2ff', color: '#4f46e5', fontWeight: 700 }} />
                            );
                          }
                          const isGrad = graduateMarkedIds.has(s._id);
                          const evalStatus = s.evaluation?.academicEvaluation;
                          
                          if (isGrad) return <Chip label="Tốt nghiệp" color="error" size="small" sx={{ fontWeight: 700 }} />;
                          
                          return (
                            <Chip 
                              label={evalStatus === 'chưa đạt' ? 'Ở lại lớp' : 'Học tiếp'} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontWeight: 700, borderColor: evalStatus === 'chưa đạt' ? '#ef4444' : '#4f46e5', color: evalStatus === 'chưa đạt' ? '#ef4444' : '#4f46e5' }} 
                            />
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Box>
            <Typography variant="body2" color="text.secondary">
              Khối <strong>năm cuối</strong>: <strong>{graduateTickCount}</strong> em tốt nghiệp · <strong>{finishSelectableTotal - graduateTickCount}</strong> em học tiếp/ở lại lớp
            </Typography>
            {finishStudents.some(s => !s.evaluation?.academicEvaluation) && (
              <Typography variant="caption" color="error.main" fontWeight={700} display="block">
                ⚠️ Cảnh báo: Còn học sinh chưa được đánh giá định kỳ cuối năm.
              </Typography>
            )}
            </Box>
            <Stack direction="row" spacing={1.5}>
              <Button onClick={() => setOpenFinish(false)} sx={{ textTransform: 'none' }}>Hủy</Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleConfirmFinish}
                sx={{ textTransform: 'none', fontWeight: 700, px: 4 }}
              >
                Xác nhận kết thúc năm học
              </Button>
            </Stack>
          </DialogActions>
        </Dialog>
      </Stack>


      {/* ======== Wizard: Thiết lập năm học mới ======== */}
      <AcademicYearWizard
        open={openWizard}
        onClose={() => setOpenWizard(false)}
        onSuccess={() => {
          get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.LIST).then(resp => {
            if (resp?.status === 'success') setYears(Array.isArray(resp.data) ? resp.data : []);
          });
          get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT).then(resp => {
            if (resp?.status === 'success') setCurrentYear(resp.data || null);
          });
        }}
      />
    </RoleLayout>
  );
}

export default ManageAcademicYears;
