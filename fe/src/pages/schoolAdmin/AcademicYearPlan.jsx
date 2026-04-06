import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Autocomplete,
  Chip,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, post, patch, del, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';

function formatDateInput(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

const WEEK_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

function toDMY(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function createWeek(index) {
  return {
    weekName: `Tuần ${index + 1}`,
    weekTopic: '',
    weekStartDate: '',
    weekEndDate: '',
    weekRange: '',
    dayPlans: {
      'Thứ 2': '',
      'Thứ 3': '',
      'Thứ 4': '',
      'Thứ 5': '',
      'Thứ 6': '',
    },
  };
}

function buildWeeks(count, currentWeeks = []) {
  const total = Math.max(1, Number(count) || 1);
  return Array.from({ length: total }, (_, index) => {
    const old = currentWeeks[index];
    return old
      ? { ...old, weekName: `Tuần ${index + 1}` }
      : createWeek(index);
  });
}

export default function AcademicYearPlan() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [currentYear, setCurrentYear] = useState(null);
  const [loadingYear, setLoadingYear] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [activeBlock, setActiveBlock] = useState('');
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [savingTopic, setSavingTopic] = useState(false);
  const [teachersByBlock, setTeachersByBlock] = useState({});
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingTopicId, setDeletingTopicId] = useState(null);
  const [deletingTopic, setDeletingTopic] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [dialogMode, setDialogMode] = useState('create');
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [topicForm, setTopicForm] = useState({
    topicName: '',
    startDate: '',
    endDate: '',
    weeks: 1,
    teacherIds: [],
    teachers: '',
    weeklyDetails: buildWeeks(1),
  });

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  useEffect(() => {
    const loadCurrentYear = async () => {
      try {
        setLoadingYear(true);
        const resp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT);
        if (resp?.status === 'success' && resp.data) {
          setCurrentYear(resp.data);
        } else {
          setCurrentYear(null);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading current academic year:', error);
        setCurrentYear(null);
      } finally {
        setLoadingYear(false);
      }
    };

    loadCurrentYear();
  }, []);

  useEffect(() => {
    const loadBlocksByYear = async () => {
      if (!currentYear?._id) {
        setBlocks([]);
        setActiveBlock('');
        setTeachersByBlock({});
        return;
      }
      try {
        const resp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CLASSES(currentYear._id));
        const rows = Array.isArray(resp?.data) ? resp.data : [];
        const gradeMap = new Map();
        const teacherMapByGrade = new Map();
        rows.forEach((row) => {
          const gradeId = row?.gradeId || row?.grade?._id;
          const gradeName = row?.gradeName || row?.grade?.gradeName || '';
          if (gradeId && !gradeMap.has(String(gradeId))) {
            gradeMap.set(String(gradeId), { key: String(gradeId), label: gradeName || 'Khối lớp' });
          }
          if (gradeId) {
            const gKey = String(gradeId);
            if (!teacherMapByGrade.has(gKey)) teacherMapByGrade.set(gKey, new Map());
            const teachers = Array.isArray(row?.teacherIds) ? row.teacherIds : [];
            teachers.forEach((t) => {
              const tId = String(t?._id || '');
              const fullName = String(t?.fullName || '').trim();
              if (tId && fullName) {
                teacherMapByGrade.get(gKey).set(tId, { _id: tId, fullName });
              }
            });
          }
        });
        const nextBlocks = Array.from(gradeMap.values());
        const nextTeachersByBlock = {};
        teacherMapByGrade.forEach((value, key) => {
          nextTeachersByBlock[key] = Array.from(value.values()).sort((a, b) =>
            a.fullName.localeCompare(b.fullName, 'vi'),
          );
        });
        setTeachersByBlock(nextTeachersByBlock);
        setBlocks(nextBlocks);
        setActiveBlock((prev) => (prev && nextBlocks.some((b) => b.key === prev) ? prev : (nextBlocks[0]?.key || '')));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading blocks by academic year:', error);
        setBlocks([]);
        setActiveBlock('');
        setTeachersByBlock({});
      }
    };
    loadBlocksByYear();
  }, [currentYear]);

  useEffect(() => {
    const loadTopics = async () => {
      if (!currentYear?._id || !activeBlock) {
        setTopics([]);
        return;
      }
      try {
        setLoadingTopics(true);
        const resp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_PLAN.LIST_TOPICS(currentYear._id, activeBlock));
        const rows = Array.isArray(resp?.data) ? resp.data : [];
        const normalized = rows.map((row) => ({
          id: row.id,
          topicName: row.topicName || '',
          startDate: formatDateInput(row.startDate),
          endDate: formatDateInput(row.endDate),
          weeks: row.weeks || 1,
          teacherIds: Array.isArray(row.teacherIds) ? row.teacherIds.map(String) : [],
          teachers: row.teachers || '',
          weeklyDetails: (row.weeklyDetails || []).map((w, idx) => ({
            weekName: w.weekName || `Tuần ${idx + 1}`,
            weekTopic: w.weekTopic || '',
            weekStartDate: formatDateInput(w.weekStartDate),
            weekEndDate: formatDateInput(w.weekEndDate),
            weekRange: w.weekRange || '',
            dayPlans: {
              'Thứ 2': w?.dayPlans?.thu2 || '',
              'Thứ 3': w?.dayPlans?.thu3 || '',
              'Thứ 4': w?.dayPlans?.thu4 || '',
              'Thứ 5': w?.dayPlans?.thu5 || '',
              'Thứ 6': w?.dayPlans?.thu6 || '',
            },
          })),
        }));
        setTopics(normalized);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading academic plan topics:', error);
        setTopics([]);
      } finally {
        setLoadingTopics(false);
      }
    };
    loadTopics();
  }, [currentYear, activeBlock]);

  const handleFormChange = (field, value) => {
    setTopicForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleWeeksChange = (value) => {
    const nextWeeks = Math.max(1, Number(value) || 1);
    setTopicForm((prev) => ({
      ...prev,
      weeks: nextWeeks,
      weeklyDetails: buildWeeks(nextWeeks, prev.weeklyDetails),
    }));
  };

  const handleWeekDetailChange = (index, field, value) => {
    setTopicForm((prev) => {
      const next = [...prev.weeklyDetails];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, weeklyDetails: next };
    });
  };

  const handleWeekDayChange = (index, day, value) => {
    setTopicForm((prev) => {
      const next = [...prev.weeklyDetails];
      next[index] = {
        ...next[index],
        dayPlans: {
          ...next[index].dayPlans,
          [day]: value,
        },
      };
      return { ...prev, weeklyDetails: next };
    });
  };

  const handleSavePlan = () => {
    toast.info('Dữ liệu chủ đề đã được lưu theo từng lần thêm mới.');
  };

  const handleOpenDialog = () => {
    setDialogMode('create');
    setEditingTopicId(null);
    setTopicForm({
      topicName: '',
      startDate: '',
      endDate: '',
      weeks: 1,
      teacherIds: [],
      teachers: '',
      weeklyDetails: buildWeeks(1),
    });
    setOpenCreateDialog(true);
  };

  const handleOpenEditDialog = (topic) => {
    setDialogMode('edit');
    setEditingTopicId(topic.id);
    setTopicForm({
      topicName: topic.topicName || '',
      startDate: topic.startDate || '',
      endDate: topic.endDate || '',
      weeks: Number(topic.weeks) || 1,
      teacherIds: Array.isArray(topic.teacherIds) ? topic.teacherIds.map(String) : [],
      teachers: topic.teachers || '',
      weeklyDetails: buildWeeks(Number(topic.weeks) || 1, topic.weeklyDetails || []),
    });
    setOpenCreateDialog(true);
  };

  const handleOpenDetailDialog = (topic) => {
    setSelectedTopic(topic);
    setOpenDetailDialog(true);
  };

  const handleOpenDeleteDialog = (topicId) => {
    setDeletingTopicId(topicId);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    if (deletingTopic) return;
    setOpenDeleteDialog(false);
    setDeletingTopicId(null);
  };

  const handleConfirmDeleteTopic = async () => {
    if (!deletingTopicId) return;
    try {
      setDeletingTopic(true);
      await del(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_PLAN.DELETE_TOPIC(deletingTopicId));
      setTopics((prev) => prev.filter((topic) => String(topic.id) !== String(deletingTopicId)));
      toast.success('Đã xóa chủ đề.');
      handleCloseDeleteDialog();
    } catch (error) {
      toast.error(error?.message || 'Xóa chủ đề thất bại');
    } finally {
      setDeletingTopic(false);
    }
  };

  const handleSubmitTopic = async () => {
    if (!topicForm.topicName.trim() || !topicForm.startDate || !topicForm.endDate) {
      toast.error('Vui lòng nhập đủ Tên chủ đề chính, Từ ngày và Đến ngày.');
      return;
    }
    if (!currentYear?._id || !activeBlock) {
      toast.error('Chưa có khối lớp để thêm chủ đề.');
      return;
    }

    try {
      setSavingTopic(true);
      const payload = {
        academicYearId: currentYear._id,
        gradeId: activeBlock,
        topicName: topicForm.topicName.trim(),
        startDate: topicForm.startDate,
        endDate: topicForm.endDate,
        weeks: Number(topicForm.weeks) || 1,
        teacherIds: topicForm.teacherIds,
        teachers:
          (teachersByBlock[activeBlock] || [])
            .filter((t) => topicForm.teacherIds.includes(String(t._id)))
            .map((t) => t.fullName)
            .join(', ')
            .trim() || topicForm.teachers.trim(),
        weeklyDetails: topicForm.weeklyDetails.map((week, index) => ({
          weekIndex: index + 1,
          weekName: week.weekName || `Tuần ${index + 1}`,
          weekTopic: week.weekTopic || '',
          weekStartDate: week.weekStartDate || '',
          weekEndDate: week.weekEndDate || '',
          weekRange:
            week.weekStartDate && week.weekEndDate
              ? `Từ ${toDMY(week.weekStartDate)} đến ${toDMY(week.weekEndDate)}`
              : week.weekRange || '',
          dayPlans: {
            thu2: week.dayPlans?.['Thứ 2'] || '',
            thu3: week.dayPlans?.['Thứ 3'] || '',
            thu4: week.dayPlans?.['Thứ 4'] || '',
            thu5: week.dayPlans?.['Thứ 5'] || '',
            thu6: week.dayPlans?.['Thứ 6'] || '',
          },
        })),
      };
      if (dialogMode === 'edit' && editingTopicId) {
        const resp = await patch(
          ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_PLAN.UPDATE_TOPIC(editingTopicId),
          payload,
        );
        const updated = resp?.data;
        if (updated?.id) {
          setTopics((prev) =>
            prev.map((item) =>
              item.id === updated.id
                ? {
                    ...item,
                    topicName: updated.topicName || '',
                    startDate: formatDateInput(updated.startDate),
                    endDate: formatDateInput(updated.endDate),
                    weeks: updated.weeks || 1,
                    teacherIds: Array.isArray(updated.teacherIds)
                      ? updated.teacherIds.map(String)
                      : item.teacherIds || [],
                    teachers: updated.teachers || '',
                    weeklyDetails: buildWeeks(
                      updated.weeks || 1,
                      (updated.weeklyDetails || []).map((w, idx) => ({
                        weekName: w.weekName || `Tuần ${idx + 1}`,
                        weekTopic: w.weekTopic || '',
                        weekStartDate: formatDateInput(w.weekStartDate),
                        weekEndDate: formatDateInput(w.weekEndDate),
                        weekRange: w.weekRange || '',
                        dayPlans: {
                          'Thứ 2': w?.dayPlans?.thu2 || '',
                          'Thứ 3': w?.dayPlans?.thu3 || '',
                          'Thứ 4': w?.dayPlans?.thu4 || '',
                          'Thứ 5': w?.dayPlans?.thu5 || '',
                          'Thứ 6': w?.dayPlans?.thu6 || '',
                        },
                      })),
                    ),
                  }
                : item,
            ),
          );
        }
      } else {
        const resp = await post(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_PLAN.CREATE_TOPIC, payload);
        const created = resp?.data;
        if (created?.id) {
          setTopics((prev) => [
            ...prev,
            {
              id: created.id,
              topicName: created.topicName || '',
              startDate: formatDateInput(created.startDate),
              endDate: formatDateInput(created.endDate),
              weeks: created.weeks || 1,
              teacherIds: Array.isArray(created.teacherIds) ? created.teacherIds.map(String) : [],
              teachers: created.teachers || '',
              weeklyDetails: topicForm.weeklyDetails,
            },
          ]);
        }
      }
      setOpenCreateDialog(false);
      toast.success(dialogMode === 'edit' ? 'Đã cập nhật chủ đề.' : 'Đã thêm chủ đề mới.');
    } catch (error) {
      toast.error(error?.message || 'Lưu chủ đề thất bại');
    } finally {
      setSavingTopic(false);
    }
  };

  const userName = user?.fullName || user?.username || 'School Admin';

  return (
    <RoleLayout
      title={
        currentYear
          ? `Danh sách chủ đề theo khối năm học ${currentYear.yearName}`
          : 'Danh sách chủ đề theo khối năm học'
      }
      description="Quản lý danh sách chủ đề theo từng khối lớp và chi tiết hoạt động theo tuần."
      menuItems={menuItems}
      activeKey="academic-plan"
      onLogout={handleLogout}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
      <Stack spacing={3}>
        <Typography variant="overline" color="text.secondary">
          MamNon DX &gt; Ban Giám Hiệu &gt; Quản lý Năm học &gt; Danh sách chủ đề theo khối năm học
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'white',
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            1. Thông tin cơ bản năm học
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
            <TextField
              label="Tên năm học"
              value={currentYear?.yearName || ''}
              size="small"
              InputProps={{ readOnly: true }}
              sx={{
                width: { xs: '100%', md: 300 },
                flexShrink: 0,
              }}
            />
            <TextField
              label="Thời gian bắt đầu"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={formatDateInput(currentYear?.startDate)}
              InputProps={{ readOnly: true }}
              sx={{
                flex: 1,
                minWidth: { xs: '100%', md: 220 },
              }}
            />
            <TextField
              label="Thời gian kết thúc"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={formatDateInput(currentYear?.endDate)}
              InputProps={{ readOnly: true }}
              sx={{
                flex: 1,
                minWidth: { xs: '100%', md: 220 },
              }}
            />
          </Stack>
          {loadingYear && (
            <Typography variant="body2" color="text.secondary" mt={1.5}>
              Đang tải thông tin năm học...
            </Typography>
          )}
          {!loadingYear && !currentYear && (
            <Typography variant="body2" color="error" mt={1.5}>
              Chưa có năm học đang hoạt động. Vui lòng tạo năm học trước.
            </Typography>
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'white',
          }}
        >
          <Typography
            variant="h5"
            fontWeight={800}
            textAlign="center"
            color="#1f3b5b"
            sx={{ mb: 2.5 }}
          >
            DANH SÁCH CHỦ ĐỀ THEO KHỐI NĂM HỌC {currentYear?.yearName || '2025-2026'}
          </Typography>

          <Tabs
            value={activeBlock}
            onChange={(_, value) => setActiveBlock(value)}
            sx={{
              mb: 2.5,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 1.5,
                minHeight: 36,
                mr: 1,
                border: '1px solid transparent',
              },
              '& .Mui-selected': {
                bgcolor: '#3794d1',
                color: 'white !important',
              },
            }}
          >
            {blocks.map((block) => (
              <Tab key={block.key} value={block.key} label={block.label} />
            ))}
          </Tabs>

          <Typography
            variant="h6"
            fontWeight={800}
            textAlign="center"
            color="#1f3b5b"
            sx={{ mb: 2 }}
          >
            Khối {blocks.find((b) => b.key === activeBlock)?.label || ''}
          </Typography>

          <Button
            variant="contained"
            onClick={handleOpenDialog}
            disabled={!activeBlock}
            sx={{
              mb: 1.5,
              bgcolor: '#16a34a',
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { bgcolor: '#15803d' },
            }}
          >
            + Thêm chủ đề mới
          </Button>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
          >
            <Table size="small">
              <TableHead sx={{ bgcolor: '#3794d1' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>STT</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Tên chủ đề</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Thời gian</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Số tuần</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Giáo viên</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topics.map((topic, index) => (
                  <TableRow key={topic.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{topic.topicName}</TableCell>
                    <TableCell>{`${toDMY(topic.startDate)} - ${toDMY(topic.endDate)}`}</TableCell>
                    <TableCell>{topic.weeks}</TableCell>
                    <TableCell>{topic.teachers || '—'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleOpenDetailDialog(topic)}
                          sx={{ textTransform: 'none', minWidth: 70 }}
                        >
                          Chi tiết
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleOpenEditDialog(topic)}
                          sx={{ textTransform: 'none', minWidth: 70 }}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => handleOpenDeleteDialog(topic.id)}
                          sx={{ textTransform: 'none', minWidth: 70 }}
                        >
                          Xóa
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!loadingTopics && topics.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Chưa có chủ đề cho khối này.
                    </TableCell>
                  </TableRow>
                )}
                {loadingTopics && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      Đang tải danh sách chủ đề...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              mt: 3,
            }}
          >
            <Button
              variant="contained"
              color="success"
              onClick={handleSavePlan}
              sx={{
                textTransform: 'none',
                px: 3,
                borderRadius: 999,
              }}
              disabled={!currentYear}
            >
              Lưu kế hoạch
            </Button>
          </Box> */}
        </Paper>
      </Stack>

      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
          <IconButton
            aria-label="Đóng"
            onClick={() => setOpenCreateDialog(false)}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <CloseIcon />
          </IconButton>
          <Stack spacing={2}>
            <Typography variant="h5" textAlign="center" fontWeight={800} color="#1f3b5b">
              Thêm chủ đề mới
            </Typography>

            <TextField
              label="Tên chủ đề chính"
              placeholder="VD: TRƯỜNG MẦM NON ĐỨC XUÂN"
              value={topicForm.topicName}
              onChange={(e) => handleFormChange('topicName', e.target.value)}
              fullWidth
            />

            <Typography variant="subtitle2" fontWeight={700}>
              Thời gian thực hiện (chủ đề tổng)
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <TextField
                label="Từ ngày"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={topicForm.startDate}
                onChange={(e) => handleFormChange('startDate', e.target.value)}
                fullWidth
              />
              <TextField
                label="Đến ngày"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={topicForm.endDate}
                onChange={(e) => handleFormChange('endDate', e.target.value)}
                fullWidth
              />
            </Stack>

            <TextField
              label="Số tuần"
              type="number"
              inputProps={{ min: 1, max: 20 }}
              value={topicForm.weeks}
              onChange={(e) => handleWeeksChange(e.target.value)}
              fullWidth
            />

            <Autocomplete
              multiple
              options={teachersByBlock[activeBlock] || []}
              value={(teachersByBlock[activeBlock] || []).filter((t) =>
                topicForm.teacherIds.includes(String(t._id)),
              )}
              onChange={(_, selectedOptions) => {
                handleFormChange(
                  'teacherIds',
                  selectedOptions.map((t) => String(t._id)),
                );
              }}
              getOptionLabel={(option) => option?.fullName || ''}
              isOptionEqualToValue={(option, value) =>
                String(option?._id) === String(value?._id)
              }
              noOptionsText="Không tìm thấy giáo viên"
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={String(option._id)}
                    label={option.fullName}
                    size="small"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Giáo viên thực hiện"
                  placeholder="Tìm và chọn giáo viên..."
                />
              )}
            />

            <Box sx={{ borderTop: '2px solid #3b82f6', pt: 2.5 }}>
              <Typography variant="h6" fontWeight={800} textAlign="center" sx={{ mb: 2 }}>
                Chi tiết từng tuần
              </Typography>
              <Stack spacing={2}>
                {topicForm.weeklyDetails.map((week, weekIndex) => (
                  <Paper
                    key={week.weekName}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: '#f8fafc',
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                      {week.weekName}
                    </Typography>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
                      <TextField
                        label="Chủ đề tuần"
                        placeholder="VD: Trường mầm non bé yêu"
                        value={week.weekTopic}
                        onChange={(e) =>
                          handleWeekDetailChange(weekIndex, 'weekTopic', e.target.value)
                        }
                        fullWidth
                      />
                    </Stack>

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
                      <TextField
                        label="Từ ngày"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={week.weekStartDate || ''}
                        onChange={(e) =>
                          handleWeekDetailChange(weekIndex, 'weekStartDate', e.target.value)
                        }
                        fullWidth
                      />
                      <TextField
                        label="Đến ngày"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={week.weekEndDate || ''}
                        onChange={(e) =>
                          handleWeekDetailChange(weekIndex, 'weekEndDate', e.target.value)
                        }
                        fullWidth
                      />
                    </Stack>

                    <Stack direction="row" flexWrap="wrap" useFlexGap gap={1.5}>
                      {WEEK_DAYS.map((day) => (
                        <Box key={day} sx={{ minWidth: 200, flex: '1 1 200px' }}>
                          <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                            {day}
                          </Typography>
                          <TextField
                            placeholder="Nội dung hoạt động..."
                            value={week.dayPlans[day] || ''}
                            onChange={(e) => handleWeekDayChange(weekIndex, day, e.target.value)}
                            fullWidth
                            multiline
                            minRows={3}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>

            <Button
              variant="contained"
              onClick={handleSubmitTopic}
              disabled={savingTopic}
              sx={{
                mt: 1,
                py: 1.2,
                bgcolor: '#3794d1',
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { bgcolor: '#2b7db1' },
              }}
            >
              {savingTopic ? 'Đang lưu...' : dialogMode === 'edit' ? 'Cập nhật chủ đề' : 'Lưu chủ đề'}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f4f6f8' }}>
          <IconButton
            aria-label="Đóng"
            onClick={() => setOpenDetailDialog(false)}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <CloseIcon />
          </IconButton>
          {selectedTopic && (
            <Stack spacing={2}>
              <Typography variant="h5" textAlign="center" fontWeight={800}>
                {selectedTopic.topicName?.toUpperCase() || 'CHI TIẾT CHỦ ĐỀ'}
              </Typography>
              <Typography variant="h6" textAlign="center" fontWeight={700}>
                Thời gian thực hiện {selectedTopic.weeks} tuần: (Từ {toDMY(selectedTopic.startDate)} đến {toDMY(selectedTopic.endDate)})
              </Typography>

              <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#2f3ea8' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 700 }}>Thứ</TableCell>
                      {(selectedTopic.weeklyDetails || []).map((week, idx) => (
                        <TableCell key={`w-${idx}`} sx={{ color: 'white', fontWeight: 700, minWidth: 180 }}>
                          {week.weekName || `Tuần ${idx + 1}`}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow sx={{ bgcolor: '#3a4bc0' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 700 }} />
                      {(selectedTopic.weeklyDetails || []).map((week, idx) => (
                        <TableCell key={`wh-${idx}`} sx={{ color: 'white', fontWeight: 700 }}>
                          {week.weekTopic || 'Chưa cập nhật'}
                          {(
                            week.weekRange ||
                            (week.weekStartDate && week.weekEndDate
                              ? `Từ ${toDMY(week.weekStartDate)} đến ${toDMY(week.weekEndDate)}`
                              : '')
                          )
                            ? ` (${week.weekRange || `Từ ${toDMY(week.weekStartDate)} đến ${toDMY(week.weekEndDate)}`})`
                            : ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {WEEK_DAYS.map((day) => (
                      <TableRow key={day}>
                        <TableCell sx={{ fontWeight: 700 }}>{day}</TableCell>
                        {(selectedTopic.weeklyDetails || []).map((week, idx) => (
                          <TableCell key={`${day}-${idx}`}>
                            {week?.dayPlans?.[day] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Xác nhận xóa</DialogTitle>
        <DialogContent dividers>
          <Typography>Bạn có muốn xóa chủ đề này không.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            disabled={deletingTopic}
            sx={{ textTransform: 'none' }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDeleteTopic}
            disabled={deletingTopic}
            sx={{ textTransform: 'none' }}
          >
            {deletingTopic ? 'Đang xóa...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}

