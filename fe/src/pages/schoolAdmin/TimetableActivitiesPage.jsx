import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { toast } from 'react-toastify';
import { Add as AddIcon, Edit as EditIcon, Print as PrintIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, put, ENDPOINTS } from '../../service/api';

const SEASON_OPTIONS = [
  { value: 'summer', label: 'Mùa Hè' },
  { value: 'winter', label: 'Mùa Đông' },
];

const menuItems = [
  { key: 'overview', label: 'Tổng quan trường' },
  {
    key: 'academic-years',
    label: 'Quản lý năm học',
    children: [
      { key: 'academic-year-setup', label: 'Thiết lập năm học' },
      { key: 'academic-plan', label: 'Thiết lập kế hoạch' },
      { key: 'academic-students', label: 'Danh sách lớp học' },
      { key: 'academic-curriculum', label: 'Chương trình giáo dục' },
      { key: 'academic-schedule', label: 'Thời gian biểu' },
      { key: 'academic-report', label: 'Báo cáo & thống kê' },
    ],
  },
  { key: 'classes', label: 'Lớp học' },
  { key: 'menu', label: 'Quản lý thực đơn' },
  { key: 'teachers', label: 'Giáo viên' },
  { key: 'students', label: 'Học sinh & phụ huynh' },
  { key: 'assets', label: 'Quản lý tài sản' },
  { key: 'reports', label: 'Báo cáo của trường' },
  { key: 'contacts', label: 'Liên hệ' },
  { key: 'qa', label: 'Câu hỏi' },
  { key: 'blogs', label: 'Quản lý blog' },
  { key: 'documents', label: 'Quản lý tài liệu' },
  { key: 'public-info', label: 'Thông tin công khai' },
  { key: 'attendance', label: 'Quản lý điểm danh' },
];

// Dùng initialValue + key để reset khi modal mở — không cần sync phức tạp
function TimeSelect({ label, initialValue = '', onChange }) {
  const [h, setH] = useState(initialValue ? initialValue.split(':')[0] : '');
  const [m, setM] = useState(initialValue ? initialValue.split(':')[1] : '');

  const notify = (newH, newM) => {
    const hh = newH.padStart(2, '0');
    const mm = newM.padStart(2, '0');
    onChange(newH && newM ? `${hh}:${mm}` : '');
  };

  const onChangeH = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (v.length === 2 && Number(v) > 23) v = '23';
    setH(v);
    notify(v, m);
  };

  const onChangeM = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (v.length === 2 && Number(v) > 59) v = '59';
    setM(v);
    notify(h, v);
  };

  const onBlurH = () => {
    const padded = h ? h.padStart(2, '0') : '';
    setH(padded);
    notify(padded, m);
  };

  const onBlurM = () => {
    const padded = m ? m.padStart(2, '0') : '';
    setM(padded);
    notify(h, padded);
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.75, display: 'block' }}>
        {label}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <TextField
          size="small"
          placeholder="GG"
          value={h}
          onChange={onChangeH}
          onBlur={onBlurH}
          inputProps={{ inputMode: 'numeric', maxLength: 2 }}
          sx={{ width: 64, '& input': { textAlign: 'center', fontWeight: 700, fontSize: 15 } }}
        />
        <Typography fontWeight={900} fontSize={18} color="text.secondary" sx={{ userSelect: 'none', pb: '2px' }}>:</Typography>
        <TextField
          size="small"
          placeholder="PP"
          value={m}
          onChange={onChangeM}
          onBlur={onBlurM}
          inputProps={{ inputMode: 'numeric', maxLength: 2 }}
          sx={{ width: 64, '& input': { textAlign: 'center', fontWeight: 700, fontSize: 15 } }}
        />
      </Stack>
    </Box>
  );
}

function minutesToHHMM(minutes) {
  const m = Number(minutes);
  if (Number.isNaN(m)) return '';
  const h = Math.floor(m / 60);
  const mins = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function seasonContentLabel(appliesToSeason) {
  if (appliesToSeason === 'winter') return 'Nội dung hoạt động MÙA ĐÔNG';
  if (appliesToSeason === 'summer') return 'Nội dung hoạt động MÙA HÈ';
  if (appliesToSeason === 'both') return 'Nội dung hoạt động CẢ 2 MÙA';
  return 'Nội dung hoạt động';
}


export default function TimetableActivitiesPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [academicYear, setAcademicYear] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    appliesToSeason: '',
    startTime: '',
    endTime: '',
    content: '',
  });

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleMenuSelect = (key) => {
    if (key === 'overview') navigate('/school-admin');
    if (key === 'academic-years' || key === 'academic-year-setup') navigate('/school-admin/academic-years');
    if (key === 'academic-plan') navigate('/school-admin/academic-plan');
    if (key === 'academic-report') {
      const yearId = academicYear?._id;
      if (yearId) navigate(`/school-admin/academic-years/${yearId}/report`);
      else navigate('/school-admin/academic-years');
      return;
    }
    if (key === 'academic-students') navigate('/school-admin/class-list');
    if (key === 'academic-curriculum') navigate('/school-admin/curriculum');
    if (key === 'academic-schedule') return;
    if (key === 'classes') navigate('/school-admin/classes');
    if (key === 'menu') navigate('/school-admin/menus');
    if (key === 'students') navigate('/school-admin/students');
    if (key === 'contacts') navigate('/school-admin/contacts');
    if (key === 'qa') navigate('/school-admin/qa');
    if (key === 'blogs') navigate('/school-admin/blogs');
    if (key === 'documents') navigate('/school-admin/documents');
    if (key === 'public-info') navigate('/school-admin/public-info');
    if (key === 'attendance') navigate('/school-admin/attendance/overview');
  };

  const yearName = academicYear?.yearName || '';

  const loadActivities = async (yearId) => {
    const res = await get(ENDPOINTS.SCHOOL_ADMIN.TIMETABLE.LIST(yearId));
    if (res?.status === 'success') setActivities(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [yearRes] = await Promise.all([get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT)]);
        if (cancelled) return;
        if (yearRes?.status === 'success' && yearRes.data) {
          setAcademicYear(yearRes.data);
          await loadActivities(yearRes.data._id);
        } else {
          setAcademicYear(null);
          setActivities([]);
        }
      } catch (_) {
        if (cancelled) return;
        setAcademicYear(null);
        setActivities([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const summer = activities.filter(
      (a) => a.appliesToSeason === 'summer' || a.appliesToSeason === 'both'
    );
    const winter = activities.filter(
      (a) => a.appliesToSeason === 'winter' || a.appliesToSeason === 'both'
    );
    return { summer, winter };
  }, [activities]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setForm({ appliesToSeason: '', startTime: '', endTime: '', content: '' });
    setOpenModal(true);
  };

  const openEditModal = (id) => {
    const item = activities.find((a) => String(a._id) === String(id));
    if (!item) return;
    setModalMode('edit');
    setEditingId(id);
    setForm({
      appliesToSeason: item.appliesToSeason,
      startTime: minutesToHHMM(item.startMinutes),
      endTime: minutesToHHMM(item.endMinutes),
      content: item.content || '',
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setOpenModal(false);
  };

  const handleSave = async () => {
    if (!academicYear?._id) {
      toast.error('Chưa có năm học đang hoạt động.');
      return;
    }
    if (!form.appliesToSeason) {
      toast.error('Vui lòng chọn mùa áp dụng.');
      return;
    }
    if (!form.startTime) {
      toast.error('Vui lòng chọn "Từ giờ".');
      return;
    }
    if (!form.endTime) {
      toast.error('Vui lòng chọn "Đến giờ".');
      return;
    }

    // Parse sang số phút để so sánh (input type="time" luôn trả về HH:MM 24h)
    const [startH, startM] = form.startTime.split(':').map(Number);
    const [endH, endM] = form.endTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (startMins >= endMins) {
      toast.error('Giờ bắt đầu phải nhỏ hơn giờ kết thúc.');
      return;
    }

    // Check overlap ngay trên frontend
    const conflicting = activities.find((a) => {
      if (modalMode === 'edit' && String(a._id) === String(editingId)) return false;
      const sameSeasonGroup =
        a.appliesToSeason === 'both' ||
        form.appliesToSeason === 'both' ||
        a.appliesToSeason === form.appliesToSeason;
      if (!sameSeasonGroup) return false;
      return startMins < a.endMinutes && endMins > a.startMinutes;
    });
    if (conflicting) {
      toast.error(
        `Trùng giờ với hoạt động ${minutesToHHMM(conflicting.startMinutes)} – ${minutesToHHMM(conflicting.endMinutes)}. Vui lòng chọn giờ khác.`
      );
      return;
    }

    if (!form.content.trim()) {
      toast.error('Vui lòng nhập nội dung hoạt động.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        id: modalMode === 'edit' ? editingId : undefined,
        academicYearId: academicYear._id,
        appliesToSeason: form.appliesToSeason,
        startTime: form.startTime,
        endTime: form.endTime,
        content: form.content.trim(),
      };

      await put(ENDPOINTS.SCHOOL_ADMIN.TIMETABLE.UPSERT, payload);
      await loadActivities(academicYear._id);
      setOpenModal(false);
      toast.success(modalMode === 'edit' ? 'Đã cập nhật hoạt động.' : 'Đã thêm hoạt động mới.');
    } catch (err) {
      toast.error(err?.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <RoleLayout
      title={`Thời gian biểu cả trường -- ${yearName || '—'}`}
      description="Thiết lập thời gian biểu hoạt động hằng ngày theo mùa."
      menuItems={menuItems}
      activeKey="academic-schedule"
      onLogout={handleLogout}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
      userName={user?.fullName || user?.username || 'School Admin'}
      userAvatar={user?.avatar}
    >
      <Stack spacing={3} sx={{ '@media print': { '& .no-print': { display: 'none' } } }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }} className="no-print">
          MamNon DX → Ban Giám hiệu → Quản lý Năm học → Thời gian biểu cả trường {yearName ? `(${yearName})` : ''}
        </Typography>

        <Box className="no-print">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h5" fontWeight={900} sx={{ color: '#1e40af' }}>
                Thời gian biểu cả trường -- {yearName || '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                THỜI GIAN BIỂU HOẠT ĐỘNG HẰNG NGÀY
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Năm học: <strong>{yearName || '—'}</strong>
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} className="no-print" sx={{ flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreateModal}
                sx={{
                  bgcolor: '#6366f1',
                  '&:hover': { bgcolor: '#4f46e5' },
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                Thêm hoạt động mới
              </Button>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{
                  bgcolor: '#16a34a',
                  '&:hover': { bgcolor: '#15803d' },
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                In thời gian biểu
              </Button>
              <Button
                variant="outlined"
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderColor: '#22c55e',
                  color: '#16a34a',
                }}
                onClick={() => toast.info('Import file đang được phát triển')}
              >
                Import file
              </Button>
            </Stack>
          </Stack>
        </Box>

        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>Đang tải...</Box>
        ) : (
          <>
            <SeasonTable title="MÙA HÈ" activities={grouped.summer} onEdit={openEditModal} />
            <SeasonTable title="MÙA ĐÔNG" activities={grouped.winter} onEdit={openEditModal} />
          </>
        )}
      </Stack>

      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle
          component="div"
          sx={{
            pb: 1.5,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
          }}
        >
          <Typography variant="subtitle1" fontWeight={900}>
            {modalMode === 'edit' ? 'Sửa hoạt động' : 'Thêm hoạt động mới'}
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5 }}>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
              Thời gian
            </Typography>
            <Stack direction="row" spacing={3} alignItems="flex-start">
              <TimeSelect
                key={`start-${editingId || 'new'}-${openModal}`}
                label="Từ giờ"
                initialValue={form.startTime}
                onChange={(v) => setForm((prev) => ({ ...prev, startTime: v }))}
              />
              <Typography fontWeight={700} color="text.disabled" sx={{ pt: '28px' }}>→</Typography>
              <TimeSelect
                key={`end-${editingId || 'new'}-${openModal}`}
                label="Đến giờ"
                initialValue={form.endTime}
                onChange={(v) => setForm((prev) => ({ ...prev, endTime: v }))}
              />
            </Stack>

            <FormControl size="small" fullWidth>
              <InputLabel>Áp dụng cho mùa</InputLabel>
              <Select
                label="Áp dụng cho mùa"
                value={form.appliesToSeason}
                onChange={(e) => setForm((prev) => ({ ...prev, appliesToSeason: e.target.value }))}
              >
                <MenuItem value="">
                  <em>- Chọn -</em>
                </MenuItem>
                {SEASON_OPTIONS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
                <MenuItem value="both">Cả 2 mùa</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={seasonContentLabel(form.appliesToSeason)}
              placeholder={
                form.appliesToSeason === 'winter'
                  ? 'VD: Đón trẻ - Trò chuyện trong lớp ấm áp...'
                  : 'VD: Đón trẻ - Trò chuyện trong lớp thoáng mát...'
              }
              size="small"
              fullWidth
              multiline
              minRows={3}
              value={form.content}
              onChange={(e) => {
                if (e.target.value.length <= 300) {
                  setForm((prev) => ({ ...prev, content: e.target.value }));
                }
              }}
              error={form.content.length > 280}
              helperText={
                <Box component="span" sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Typography
                    variant="caption"
                    color={form.content.length > 280 ? 'error' : 'text.disabled'}
                  >
                    {form.content.length}/300
                  </Typography>
                </Box>
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseModal}
            disabled={saving}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              bgcolor: '#f3f4f6',
              color: '#6b7280',
              '&:hover': { bgcolor: '#e5e7eb' },
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
            }}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}

function SeasonTable({ title, activities, onEdit }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#1e3a8a', mb: 1 }}>
        {title}
      </Typography>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <TableContainer>
          <Table size="small" sx={{ minWidth: 620 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#eaf2ff' }}>
                <TableCell sx={{ fontWeight: 900, color: '#1e3a8a', width: 160 }}>GIỜ</TableCell>
                <TableCell sx={{ fontWeight: 900, color: '#1e3a8a' }}>NỘI DUNG HOẠT ĐỘNG</TableCell>
                <TableCell sx={{ fontWeight: 900, color: '#1e3a8a', width: 160 }}>HÀNH ĐỘNG</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} sx={{ py: 3, color: 'text.secondary' }}>
                    Chưa có hoạt động.
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((a) => (
                  <TableRow key={a._id}>
                    <TableCell sx={{ color: '#1f2937', fontWeight: 700 }}>
                      {a.startLabel} - {a.endLabel}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#111827' }}>
                        {a.content || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<EditIcon fontSize="small" />}
                        onClick={() => onEdit(a._id)}
                        sx={{
                          bgcolor: '#f97316',
                          '&:hover': { bgcolor: '#ea580c' },
                          textTransform: 'none',
                          fontWeight: 700,
                        }}
                      >
                        Sửa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

