import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { get, put, ENDPOINTS } from '../../service/api';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';

function toInputDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function formatUsDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function buildMonthBuckets(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [];
  }
  const result = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const limit = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= limit) {
    const month = cursor.getMonth() + 1;
    const year = cursor.getFullYear();
    result.push({
      key: `${year}-${String(month).padStart(2, '0')}`,
      label: `Tháng ${month}/${year}`,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
}

export default function AcademicEventSetup() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const menuItems = useSchoolAdminMenu();
  const [currentYear, setCurrentYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [eventsByMonth, setEventsByMonth] = useState({});
  const [blocks, setBlocks] = useState([]);
  const [dialog, setDialog] = useState({
    open: false,
    mode: 'add',
    monthKey: '',
    eventId: '',
    value: '',
    date: '',
    blockKey: '',
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    monthKey: '',
    eventId: '',
    eventName: '',
  });

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    const roles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!roles.includes('SchoolAdmin')) navigate('/', { replace: true });
  }, [isInitializing, navigate, user]);

  useEffect(() => {
    const loadCurrentYear = async () => {
      try {
        setLoading(true);
        const resp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT);
        if (resp?.status === 'success' && resp.data) {
          const y = resp.data;
          const normalized = {
            ...y,
            startDate: toInputDate(y.startDate),
            endDate: toInputDate(y.endDate),
          };
          setCurrentYear(normalized);
          try {
            const planResp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_EVENTS.GET(y._id));
            const months = Array.isArray(planResp?.data?.months) ? planResp.data.months : [];
            const mapped = {};
            months.forEach((m) => {
              if (!m?.monthKey) return;
              mapped[m.monthKey] = (m.items || []).map((it) => ({
                id: String(it._id || `${it.name}-${it.date}`),
                name: it.name || '',
                date: toInputDate(it.date),
                blockKey: String(it.grade || ''),
                blockLabel: it.gradeName || 'Khối lớp',
              }));
            });
            setEventsByMonth(mapped);
          } catch {
            setEventsByMonth({});
          }
        } else {
          setCurrentYear(null);
        }
      } catch {
        setCurrentYear(null);
      } finally {
        setLoading(false);
      }
    };
    loadCurrentYear();
  }, []);

  useEffect(() => {
    const loadAllBlocks = async () => {
      try {
        const resp = await get(ENDPOINTS.GRADES.LIST);
        const rows = Array.isArray(resp?.data) ? resp.data : [];
        setBlocks(
          rows.map((row) => ({
            key: String(row?._id || ''),
            label: row?.gradeName || 'Khối lớp',
          })).filter((x) => x.key)
        );
      } catch {
        setBlocks([]);
      }
    };
    loadAllBlocks();
  }, []);

  const monthBuckets = useMemo(() => {
    if (!currentYear?.startDate || !currentYear?.endDate) return [];
    return buildMonthBuckets(currentYear.startDate, currentYear.endDate);
  }, [currentYear]);

  const openAddDialog = (monthKey) => {
    setDialog({
      open: true,
      mode: 'add',
      monthKey,
      eventId: '',
      value: '',
      date: '',
      blockKey: blocks[0]?.key || '',
    });
  };

  const openEditDialog = (monthKey, event) => {
    setDialog({
      open: true,
      mode: 'edit',
      monthKey,
      eventId: event.id,
      value: event.name || '',
      date: event.date || '',
      blockKey: event.blockKey || blocks[0]?.key || '',
    });
  };

  const persistEvents = async (nextEventsByMonth, successMessage) => {
    if (!currentYear?._id) return;
    const months = Object.entries(nextEventsByMonth).map(([monthKey, items]) => ({
      monthKey,
      items: (items || []).map((it) => ({
        name: it.name,
        date: it.date,
        grade: it.blockKey,
      })),
    }));
    await put(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_EVENTS.UPSERT, {
      academicYearId: currentYear._id,
      months,
    });
    if (successMessage) toast.success(successMessage);
  };

  const addEvent = async () => {
    const value = dialog.value.trim();
    if (!value) {
      toast.error('Vui lòng nhập tên sự kiện');
      return;
    }
    if (!dialog.date) {
      toast.error('Vui lòng chọn ngày sự kiện');
      return;
    }
    if (!dialog.blockKey) {
      toast.error('Vui lòng chọn khối lớp');
      return;
    }
    const selectedMonthKey = String(dialog.date).slice(0, 7);
    if (selectedMonthKey !== dialog.monthKey) {
      toast.error('Ngày sự kiện phải thuộc đúng tháng bạn đang thêm');
      return;
    }
    const blockLabel = blocks.find((b) => b.key === dialog.blockKey)?.label || 'Khối lớp';
    const event = {
      id: dialog.mode === 'edit' ? dialog.eventId : Date.now().toString(),
      name: value,
      date: dialog.date,
      blockKey: dialog.blockKey,
      blockLabel,
    };
    const nextEvents = {
      ...eventsByMonth,
      [dialog.monthKey]:
        dialog.mode === 'edit'
          ? (eventsByMonth[dialog.monthKey] || []).map((e) => (e.id === dialog.eventId ? event : e))
          : [...(eventsByMonth[dialog.monthKey] || []), event],
    };
    try {
      await persistEvents(nextEvents, dialog.mode === 'edit' ? 'Đã sửa và lưu sự kiện' : 'Đã thêm và lưu sự kiện');
      setEventsByMonth(nextEvents);
      setDialog({ open: false, mode: 'add', monthKey: '', eventId: '', value: '', date: '', blockKey: '' });
    } catch (err) {
      toast.error(err?.message || 'Lưu sự kiện thất bại');
    }
  };

  const removeEvent = async (monthKey, eventId) => {
    const nextEvents = {
      ...eventsByMonth,
      [monthKey]: (eventsByMonth[monthKey] || []).filter((e) => e.id !== eventId),
    };
    try {
      await persistEvents(nextEvents, 'Đã xóa và lưu sự kiện');
      setEventsByMonth(nextEvents);
    } catch (err) {
      toast.error(err?.message || 'Xóa sự kiện thất bại');
    }
  };

  const openDeleteDialog = (monthKey, event) => {
    setDeleteDialog({
      open: true,
      monthKey,
      eventId: event.id,
      eventName: event.name || 'sự kiện',
    });
  };

  const confirmDeleteEvent = async () => {
    if (!deleteDialog.monthKey || !deleteDialog.eventId) return;
    await removeEvent(deleteDialog.monthKey, deleteDialog.eventId);
    setDeleteDialog({ open: false, monthKey: '', eventId: '', eventName: '' });
  };

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);
  const userName = user?.fullName || user?.username || 'School Admin';

  return (
    <RoleLayout
      title="Thiết lập sự kiện"
      description="Nhập danh sách sự kiện nổi bật theo từng tháng."
      menuItems={menuItems}
      activeKey="academic-events"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
      <Typography variant="h4" fontWeight={800} sx={{ color: '#4f46e5', mb: 1 }}>
        Thiết lập sự kiện năm học {currentYear?.yearName || ''}
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        Nhập danh sách sự kiện nổi bật theo từng tháng. Bạn có thể thêm, xóa từng sự kiện.
      </Typography>

      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Typography variant="h5" fontWeight={800} sx={{ color: '#4f46e5', mb: 2 }}>
          1. Thông tin cơ bản năm học
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            label="Tên năm học"
            value={currentYear?.yearName || ''}
            fullWidth
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Bắt đầu"
            value={formatUsDate(currentYear?.startDate)}
            InputProps={{ readOnly: true }}
            sx={{ width: { xs: '100%', md: 220 } }}
          />
          <TextField
            label="Kết thúc"
            value={formatUsDate(currentYear?.endDate)}
            InputProps={{ readOnly: true }}
            sx={{ width: { xs: '100%', md: 220 } }}
          />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={800} sx={{ color: '#4f46e5', mb: 2 }}>
          2. Danh sách sự kiện theo tháng
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          {monthBuckets.map((m) => (
            <Paper key={m.key} variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#4f46e5', mb: 1 }}>
                {m.label}
              </Typography>
              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ mb: 1.5 }}
                onClick={() => openAddDialog(m.key)}
              >
                Thêm sự kiện
              </Button>
              <Stack spacing={1}>
                {(eventsByMonth[m.key] || []).map((event) => (
                  <Paper
                    key={event.id}
                    variant="outlined"
                    sx={{
                      px: 1.25,
                      py: 1,
                      borderRadius: 2,
                      borderColor: '#86efac',
                      bgcolor: '#dcfce7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                      <EventIcon sx={{ color: '#16a34a', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: '#166534', fontWeight: 600 }}>
                        {`${event.name} - ${formatUsDate(event.date)} - ${event.blockLabel || 'Khối lớp'}`}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => openEditDialog(m.key, event)}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => openDeleteDialog(m.key, event)}
                      >
                        Xóa
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          ))}
        </Box>

      </Paper>

      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, mode: 'add', monthKey: '', eventId: '', value: '', date: '', blockKey: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{dialog.mode === 'edit' ? 'Sửa sự kiện' : 'Thêm sự kiện'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tên sự kiện"
            fullWidth
            value={dialog.value}
            onChange={(e) => setDialog((prev) => ({ ...prev, value: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Ngày sự kiện"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={dialog.date}
            onChange={(e) => setDialog((prev) => ({ ...prev, date: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Khối lớp"
            select
            fullWidth
            value={dialog.blockKey}
            onChange={(e) => setDialog((prev) => ({ ...prev, blockKey: e.target.value }))}
          >
            {blocks.map((b) => (
              <MenuItem key={b.key} value={b.key}>
                {b.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, mode: 'add', monthKey: '', eventId: '', value: '', date: '', blockKey: '' })}>Hủy</Button>
          <Button variant="contained" onClick={addEvent}>{dialog.mode === 'edit' ? 'Lưu sửa' : 'Thêm'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, monthKey: '', eventId: '', eventName: '' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Xác nhận xóa sự kiện</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa sự kiện "{deleteDialog.eventName}" không?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, monthKey: '', eventId: '', eventName: '' })}>
            Hủy
          </Button>
          <Button color="error" variant="contained" onClick={confirmDeleteEvent}>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}

