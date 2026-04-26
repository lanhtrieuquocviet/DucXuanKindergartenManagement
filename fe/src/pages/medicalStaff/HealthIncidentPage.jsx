import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ChevronRight as NextIcon,
  Person as PersonIcon,
  ChevronLeft as PrevIcon,
  HealthAndSafety as SafetyIcon,
  Today as TodayIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell, TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { del, ENDPOINTS, get, patch, post } from '../../service/api';

// ── Constants ─────────────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  mild: { label: 'Nhẹ', color: 'info', bg: '#e0f2fe', text: '#0369a1' },
  moderate: { label: 'Vừa', color: 'warning', bg: '#fef3c7', text: '#d97706' },
  severe: { label: 'Nặng', color: 'error', bg: '#fee2e2', text: '#dc2626' },
};

const STATUS_CONFIG = {
  monitoring: { label: 'Đang theo dõi', color: 'warning' },
  sent_home: { label: 'Cho về nhà', color: 'error' },
  recovered: { label: 'Đã hồi phục', color: 'success' },
  referred: { label: 'Chuyển viện', color: 'error' },
};

const COMMON_SYMPTOMS = ['Sốt', 'Ho', 'Đau bụng', 'Đau đầu', 'Nôn mửa', 'Tiêu chảy', 'Dị ứng', 'Chấn thương', 'Khó thở', 'Mệt mỏi'];


const toDateStr = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toISOString().slice(0, 10);
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HealthIncidentPage() {
  const navigate = useNavigate();
  const { user, hasRole, hasPermission, logout, isInitializing } = useAuth();

  const today = toDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isReadOnly = useMemo(() => {
    return hasRole('SchoolAdmin') && !hasRole('MedicalStaff') && !hasRole('SystemAdmin');
  }, [hasRole]);

  // Students list cho autocomplete
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classFilter, setClassFilter] = useState('');

  // Form state (trong dialog ghi nhận mới)
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    studentId: null, symptoms: '', description: '', severity: 'mild', status: 'monitoring',
  });
  const [saving, setSaving] = useState(false);

  // Edit / delete
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const allowed = hasRole('MedicalStaff') || hasRole('SchoolAdmin') || hasRole('SystemAdmin') || hasPermission('MANAGE_HEALTH');
    if (!allowed) { navigate('/', { replace: true }); return; }
    loadStudents();
  }, [isInitializing, user]); // eslint-disable-line

  useEffect(() => { fetchIncidents(); }, [selectedDate, classFilter]); // eslint-disable-line

  const loadStudents = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        get(ENDPOINTS.STUDENTS.HEALTH_OVERVIEW),
        get(ENDPOINTS.STUDENTS.HEALTH_CLASSES),
      ]);
      setStudents(sRes.data || []);
      setClasses(cRes.data || []);
    } catch { /* silent */ }
  };

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ date: selectedDate });
      if (classFilter) params.append('classId', classFilter);
      const res = await get(`${ENDPOINTS.STUDENTS.HEALTH_INCIDENTS}?${params}`);
      setIncidents(res.data || []);
    } catch (e) {
      setError(e.message || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, classFilter]);

  // ── Date navigation ───────────────────────────────────────────
  const changeDate = (offset) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(toDateStr(d));
  };

  const displayDate = useMemo(() => {
    const d = new Date(selectedDate);
    return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  }, [selectedDate]);

  const isToday = selectedDate === today;

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.studentId) { toast.error('Vui lòng chọn học sinh'); return; }
    if (!form.symptoms.trim()) { toast.error('Vui lòng nhập triệu chứng'); return; }
    setSaving(true);
    try {
      await post(ENDPOINTS.STUDENTS.HEALTH_INCIDENTS, {
        studentId: form.studentId._id,
        date: selectedDate,
        symptoms: form.symptoms.trim(),
        description: form.description.trim(),
        severity: form.severity,
        status: form.status,
      });
      toast.success('Đã ghi nhận bất thường');
      setForm({ studentId: null, symptoms: '', description: '', severity: 'mild', status: 'monitoring' });
      setCreateOpen(false);
      fetchIncidents();
    } catch (e) {
      toast.error(e.data?.message || e.message || 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit status ───────────────────────────────────────────────
  const handleEditSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await patch(ENDPOINTS.STUDENTS.HEALTH_INCIDENT_UPDATE(editTarget._id), {
        status: editTarget.status,
        description: editTarget.description,
        severity: editTarget.severity,
      });
      toast.success('Đã cập nhật');
      setEditTarget(null);
      fetchIncidents();
    } catch (e) {
      toast.error(e.data?.message || e.message || 'Lỗi khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await del(ENDPOINTS.STUDENTS.HEALTH_INCIDENT_DELETE(deleteTarget._id));
      toast.success('Đã xóa');
      setDeleteTarget(null);
      fetchIncidents();
    } catch (e) {
      toast.error(e.data?.message || e.message || 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: incidents.length,
    severe: incidents.filter(i => i.severity === 'severe').length,
    monitoring: incidents.filter(i => i.status === 'monitoring').length,
    recovered: incidents.filter(i => i.status === 'recovered').length,
  }), [incidents]);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <>
      <Box sx={{ p: { xs: 2, md: 3 }, width: '100%', maxWidth: 1800, mx: 'auto' }}>

        {/* Header */}
        <Paper elevation={0} sx={{ mb: 3, p: 2.5, background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <WarningIcon sx={{ color: 'white', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight={700} color="white">Ghi nhận bất thường sức khỏe</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Theo dõi và xử lý các trường hợp bất thường trong ngày
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* ── Date navigator ────────────────────────────────────── */}
        <Paper elevation={1} sx={{ mb: 2.5, p: 2, borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Tooltip title="Ngày trước"><IconButton size="small" onClick={() => changeDate(-1)}><PrevIcon /></IconButton></Tooltip>
              <Paper elevation={0} sx={{ px: 2, py: 0.8, bgcolor: '#fef2f2', borderRadius: 1.5, minWidth: 220, textAlign: 'center' }}>
                <Typography variant="subtitle2" fontWeight={700} color="#dc2626" sx={{ textTransform: 'capitalize' }}>
                  {displayDate}
                </Typography>
              </Paper>
              <Tooltip title="Ngày sau"><IconButton size="small" onClick={() => changeDate(1)} disabled={selectedDate >= today}><NextIcon /></IconButton></Tooltip>
            </Stack>

            <TextField
              type="date" size="small" value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              inputProps={{ max: today }}
              sx={{ width: 160 }}
              InputLabelProps={{ shrink: true }}
            />

            {!isToday && (
              <Button size="small" startIcon={<TodayIcon />} onClick={() => setSelectedDate(today)}
                variant="outlined" sx={{ color: '#dc2626', borderColor: '#dc2626' }}>
                Hôm nay
              </Button>
            )}

            <Box sx={{ flex: 1 }} />

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Lọc theo lớp</InputLabel>
              <Select label="Lọc theo lớp" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                <MenuItem value="">Tất cả lớp</MenuItem>
                {classes.map(c => <MenuItem key={c._id} value={c._id}>{c.className || c.name}</MenuItem>)}
              </Select>
            </FormControl>

            {!isReadOnly && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateOpen(true)}
                sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                Ghi nhận bất thường
              </Button>
            )}
          </Stack>
        </Paper>

        {/* ── Stat cards ────────────────────────────────────────── */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2.5}>
          {[
            { label: 'Tổng bất thường', val: stats.total, color: '#dc2626', bg: '#fef2f2' },
            { label: 'Mức độ nặng', val: stats.severe, color: '#b91c1c', bg: '#fee2e2' },
            { label: 'Đang theo dõi', val: stats.monitoring, color: '#d97706', bg: '#fef3c7' },
            { label: 'Đã hồi phục', val: stats.recovered, color: '#16a34a', bg: '#dcfce7' },
          ].map(s => (
            <Paper key={s.label} elevation={0} sx={{ flex: 1, px: 2, py: 1.5, borderRadius: 2, bgcolor: s.bg }}>
              <Typography variant="h5" fontWeight={800} color={s.color}>{s.val}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Paper>
          ))}
        </Stack>

        {/* ── Bảng full width ───────────────────────────────── */}
        <Paper elevation={1} sx={{ borderRadius: 2, width: '100%' }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={1.5} justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                <WarningIcon sx={{ color: '#dc2626', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  Danh sách bất thường — {new Date(selectedDate).toLocaleDateString('vi-VN')}
                </Typography>
                {incidents.length > 0 && (
                  <Chip label={incidents.length} size="small"
                    sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: '0.72rem' }} />
                )}
              </Stack>
            </Stack>
          </Box>

          {error && (
            <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>{error}</Alert>
          )}

          {loading ? (
            <Box sx={{ py: 5, textAlign: 'center' }}><CircularProgress size={28} /></Box>
          ) : incidents.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
              <SafetyIcon sx={{ fontSize: 48, color: 'grey.300', display: 'block', mx: 'auto', mb: 1 }} />
              <Typography variant="body2">Không có bất thường nào trong ngày này</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#fff5f5' }}>
                  <TableRow>
                    {['#', 'Học sinh', 'Lớp', 'Triệu chứng', 'Mức độ', 'Trạng thái', 'Người ghi', 'Mô tả', ''].map(col => (
                      <TableCell key={col} sx={{
                        fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase',
                        color: '#dc2626', py: 1.2, whiteSpace: 'nowrap', borderBottom: '2px solid #fecaca',
                      }}>
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incidents.map((inc, idx) => {
                    const sev = SEVERITY_CONFIG[inc.severity];
                    const sts = STATUS_CONFIG[inc.status];
                    return (
                      <TableRow key={inc._id} hover
                        sx={{ bgcolor: inc.severity === 'severe' ? '#fff5f5' : undefined }}>
                        <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{idx + 1}</TableCell>

                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#fecaca', color: '#dc2626' }}>
                              {inc.studentId?.fullName?.[0] || <PersonIcon fontSize="small" />}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem' }}>
                              {inc.studentId?.fullName || '—'}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.78rem' }}>
                          {inc.classId?.className || '—'}
                        </TableCell>

                        <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#dc2626' }}>
                          {inc.symptoms}
                        </TableCell>

                        <TableCell>
                          {sev && (
                            <Chip label={sev.label} size="small" color={sev.color}
                              sx={{ fontSize: '0.65rem', height: 18, fontWeight: 600 }} />
                          )}
                        </TableCell>

                        <TableCell>
                          {sts && (
                            <Chip label={sts.label} size="small" color={sts.color} variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 18 }} />
                          )}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          {inc.recordedBy?.fullName || inc.recordedBy?.username || '—'}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.74rem', color: 'text.secondary', maxWidth: 180 }}>
                          {inc.description || <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>

                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Tooltip title="Cập nhật trạng thái">
                            <IconButton size="small" onClick={() => setEditTarget({ ...inc })}
                              sx={{ color: '#2563eb' }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton size="small" onClick={() => setDeleteTarget(inc)}
                              sx={{ color: 'error.main' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* ── Dialog ghi nhận mới ───────────────────────────────── */}
      <Dialog open={createOpen} onClose={() => !saving && setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Ghi nhận bất thường
          <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', fontWeight: 400, mt: 0.5 }}>
            Ngày: {new Date(selectedDate).toLocaleDateString('vi-VN')}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Autocomplete
              size="small"
              options={students}
              getOptionLabel={o => `${o.fullName} — ${o.className}`}
              value={form.studentId}
              onChange={(_, v) => setForm(p => ({ ...p, studentId: v }))}
              renderInput={params => <TextField {...params} label="Chọn học sinh *" placeholder="Tìm theo tên..." />}
              renderOption={(props, o) => (
                <Box component="li" {...props} key={o._id}>
                  <Avatar sx={{ width: 28, height: 28, mr: 1, fontSize: '0.75rem', bgcolor: '#fecaca' }}>
                    {o.fullName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{o.fullName}</Typography>
                    <Typography variant="caption" color="text.secondary">{o.className}</Typography>
                  </Box>
                </Box>
              )}
              noOptionsText="Không tìm thấy học sinh"
            />
            <Autocomplete
              size="small" freeSolo
              options={COMMON_SYMPTOMS}
              value={form.symptoms}
              onInputChange={(_, v) => setForm(p => ({ ...p, symptoms: v }))}
              onChange={(_, v) => setForm(p => ({ ...p, symptoms: v || '' }))}
              renderInput={params => <TextField {...params} label="Triệu chứng *" placeholder="Chọn hoặc nhập triệu chứng..." />}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Mức độ</InputLabel>
              <Select label="Mức độ" value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}>
                {Object.entries(SEVERITY_CONFIG).map(([v, c]) => (
                  <MenuItem key={v} value={v}>{c.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Trạng thái xử lý</InputLabel>
              <Select label="Trạng thái xử lý" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                  <MenuItem key={v} value={v}>{c.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small" label="Mô tả chi tiết" fullWidth multiline rows={3}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Ghi chú thêm về triệu chứng, xử lý..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={() => !saving && setCreateOpen(false)} color="inherit" disabled={saving}>Hủy</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}
            sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, fontWeight: 700 }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Lưu bản ghi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit dialog ─────────────────────────────────────────── */}
      {editTarget && (
        <Dialog open onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Cập nhật bản ghi</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} pt={1}>
              <Typography variant="body2" color="text.secondary">
                Học sinh: <strong>{editTarget.studentId?.fullName}</strong>
                {' · '}{editTarget.symptoms}
              </Typography>
              <FormControl size="small" fullWidth>
                <InputLabel>Mức độ</InputLabel>
                <Select label="Mức độ" value={editTarget.severity}
                  onChange={e => setEditTarget(p => ({ ...p, severity: e.target.value }))}>
                  {Object.entries(SEVERITY_CONFIG).map(([v, c]) => (
                    <MenuItem key={v} value={v}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Trạng thái xử lý</InputLabel>
                <Select label="Trạng thái xử lý" value={editTarget.status}
                  onChange={e => setEditTarget(p => ({ ...p, status: e.target.value }))}>
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                    <MenuItem key={v} value={v}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField size="small" label="Ghi chú" fullWidth multiline rows={3}
                value={editTarget.description || ''}
                onChange={e => setEditTarget(p => ({ ...p, description: e.target.value }))} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 2, py: 1.5 }}>
            <Button onClick={() => setEditTarget(null)} color="inherit">Hủy</Button>
            <Button variant="contained" onClick={handleEditSave} disabled={saving}
              sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}>
              {saving ? <CircularProgress size={18} color="inherit" /> : 'Lưu'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* ── Delete confirm ──────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Xóa bản ghi</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Bạn có chắc muốn xóa bản ghi bất thường của{' '}
            <strong>{deleteTarget?.studentId?.fullName}</strong>?<br />
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} color="inherit">Hủy</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
