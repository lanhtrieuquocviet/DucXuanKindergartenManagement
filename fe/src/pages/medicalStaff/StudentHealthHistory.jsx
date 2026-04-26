import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, post, del, ENDPOINTS } from '../../service/api';
import {
  Box, Paper, Typography, Button, Stack, TextField, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  CircularProgress, Alert, Divider, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  FileDownload as ExportIcon,
  HealthAndSafety as SafetyIcon,
  MedicalServices as MedicalIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  MonitorWeight as WeightIcon,
  Height as HeightIcon,
  Dashboard as DashboardIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

// ── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  healthy:    { label: 'Bình thường', color: 'success', bg: '#dcfce7', text: '#16a34a' },
  monitor:    { label: 'Theo dõi',    color: 'warning', bg: '#fef3c7', text: '#d97706' },
  concerning: { label: 'Đáng lo ngại', color: 'error',  bg: '#fee2e2', text: '#dc2626' },
};

function bmiCategory(bmi) {
  if (!bmi) return null;
  if (bmi < 14.5) return { label: 'Thiếu cân',  color: 'info'    };
  if (bmi < 18)   return { label: 'Bình thường', color: 'success' };
  if (bmi < 25)   return { label: 'Thừa cân',    color: 'warning' };
  return           { label: 'Béo phì',     color: 'error'   };
}

const MENU_ITEMS = [
  { key: 'overview',  label: 'Tổng quan sức khỏe', icon: <DashboardIcon fontSize="small" /> },
  { key: 'health',    label: 'Quản lý sức khỏe',    icon: <MedicalIcon fontSize="small" /> },
  { key: 'incidents', label: 'Ghi nhận bất thường', icon: <WarningIcon fontSize="small" /> },
];

/** Cùng ngày khám: checkDate từ form thường là 00:00 còn bản ghi cũ có thể có giờ → cần createdAt để bản mới luôn lên đầu */
function sortHealthRecordsNewestFirst(list) {
  return [...(list || [])].sort((a, b) => {
    const db = new Date(b.checkDate || 0).getTime();
    const da = new Date(a.checkDate || 0).getTime();
    if (db !== da) return db - da;
    const cb = new Date(b.createdAt || 0).getTime();
    const ca = new Date(a.createdAt || 0).getTime();
    if (cb !== ca) return cb - ca;
    return String(b._id || '').localeCompare(String(a._id || ''));
  });
}

const EMPTY_FORM = {
  height: '', weight: '', temperature: '', heartRate: '',
  chronicDiseases: '', allergies: '',
  notes: '', generalStatus: 'healthy',
  checkDate: new Date().toISOString().slice(0, 10),
  followUpDate: '', recommendations: '',
};

// ── Form dialog ───────────────────────────────────────────────────────────────
function NewCheckDialog({ open, onClose, studentId, prefill, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (prefill) {
      setForm({
        height:          prefill.height ?? '',
        weight:          prefill.weight ?? '',
        temperature:     prefill.temperature ?? '',
        heartRate:       prefill.heartRate ?? '',
        chronicDiseases: Array.isArray(prefill.chronicDiseases) ? prefill.chronicDiseases.join(', ') : '',
        allergies:       (prefill.allergies || []).map(a => a.allergen || a).filter(Boolean).join(', '),
        notes:           prefill.notes || '',
        generalStatus:   prefill.generalStatus || 'healthy',
        checkDate:       new Date().toISOString().slice(0, 10),
        followUpDate:    prefill.followUpDate ? new Date(prefill.followUpDate).toISOString().slice(0, 10) : '',
        recommendations: prefill.recommendations || '',
      });
    } else {
      setForm({ ...EMPTY_FORM, checkDate: new Date().toISOString().slice(0, 10) });
    }
    setErr(null);
  }, [open, prefill]);

  const f = field => e => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    try {
      await post(ENDPOINTS.STUDENTS.HEALTH_RECORD_CREATE, {
        ...form,
        studentId,
        chronicDiseases: form.chronicDiseases.split(',').map(s => s.trim()).filter(Boolean),
        allergies: form.allergies.split(',').map(s => s.trim()).filter(Boolean).map(a => ({ allergen: a })),
      });
      toast.success('Đã ghi nhận lần khám mới');
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.data?.message || e.message || 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {prefill ? 'Ghi nhận lần khám mới' : 'Tạo hồ sơ sức khỏe'}
      </DialogTitle>
      <DialogContent dividers>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        {prefill && (
          <Alert severity="info" sx={{ mb: 2, fontSize: '0.8rem' }}>
            Thông tin điền sẵn từ lần khám trước. Bản ghi mới sẽ được tạo khi lưu.
          </Alert>
        )}
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="primary">Chỉ số cơ thể</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField size="small" label="Chiều cao (cm)" fullWidth value={form.height} onChange={f('height')} type="number" inputProps={{ min: 0, step: 0.1 }} />
            <TextField size="small" label="Cân nặng (kg)"  fullWidth value={form.weight} onChange={f('weight')} type="number" inputProps={{ min: 0, step: 0.1 }} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField size="small" label="Nhiệt độ (°C)"  fullWidth value={form.temperature} onChange={f('temperature')} type="number" inputProps={{ min: 35, max: 43, step: 0.1 }} />
            <TextField size="small" label="Nhịp tim (bpm)" fullWidth value={form.heartRate}   onChange={f('heartRate')}   type="number" inputProps={{ min: 0 }} />
          </Stack>
          <Divider />
          <Typography variant="subtitle2" color="primary">Thông tin bệnh lý</Typography>
          <TextField size="small" label="Tiền sử bệnh" fullWidth multiline rows={2}
            value={form.chronicDiseases} onChange={f('chronicDiseases')}
            helperText="Phân cách bằng dấu phẩy, ví dụ: Hen suyễn, Tiểu đường" />
          <TextField size="small" label="Dị ứng" fullWidth
            value={form.allergies} onChange={f('allergies')}
            helperText="Phân cách bằng dấu phẩy, ví dụ: Tôm, Sữa" />
          <Divider />
          <Typography variant="subtitle2" color="primary">Đánh giá & theo dõi</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>Tình trạng</InputLabel>
              <Select label="Tình trạng" value={form.generalStatus} onChange={f('generalStatus')}>
                {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                  <MenuItem key={v} value={v}>{c.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField size="small" label="Ngày khám" fullWidth type="date"
              value={form.checkDate} onChange={f('checkDate')} InputLabelProps={{ shrink: true }} />
          </Stack>
          <TextField size="small" label="Khuyến nghị" fullWidth multiline rows={2} value={form.recommendations} onChange={f('recommendations')} />
          <TextField size="small" label="Ghi chú" fullWidth multiline rows={2} value={form.notes} onChange={f('notes')} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} disabled={saving} color="inherit">Hủy</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}
          sx={{ bgcolor: '#0891b2', '&:hover': { bgcolor: '#0e7490' } }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Lưu lần khám'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StudentHealthHistory() {
  const { studentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasRole, hasPermission, logout, isInitializing } = useAuth();

  // Student info được truyền qua router state (trực tiếp là object row từ trang chính)
  const [student, setStudent] = useState(location.state || null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  
  const isReadOnly = useMemo(() => {
    // SchoolAdmin and Teacher are read-only unless they also have MedicalStaff or SystemAdmin roles
    const isRestrictedRole = hasRole('SchoolAdmin') || hasRole('Teacher');
    const hasOverrideRole = hasRole('MedicalStaff') || hasRole('SystemAdmin');
    return isRestrictedRole && !hasOverrideRole;
  }, [hasRole]);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const allowed = hasRole('MedicalStaff') || hasRole('SchoolAdmin') || hasRole('SystemAdmin') || hasPermission('MANAGE_HEALTH');
    if (!allowed) { navigate('/', { replace: true }); return; }
    fetchHistory();
  }, [isInitializing, user]); // eslint-disable-line

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await get(ENDPOINTS.STUDENTS.ADMIN_HEALTH_HISTORY(studentId));
      setRecords(sortHealthRecordsNewestFirst(res.data));
      // Nếu chưa có student info, lấy từ bản ghi đầu tiên hoặc gọi API
      if (!student && res.data?.length > 0) {
        if (!student) setStudent({ _id: studentId, fullName: 'Học sinh' });
      }
    } catch (e) {
      setError(e.message || 'Không tải được lịch sử');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await del(ENDPOINTS.STUDENTS.HEALTH_RECORD_DELETE(deleteTarget._id));
      toast.success('Đã xóa bản ghi');
      setDeleteTarget(null);
      fetchHistory();
    } catch (e) {
      toast.error(e.data?.message || e.message || 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    if (!records.length) return;
    const data = [
      ['#', 'Ngày khám', 'Chiều cao (cm)', 'Cân nặng (kg)', 'BMI', 'Nhiệt độ (°C)', 'Nhịp tim (bpm)',
       'Tiền sử bệnh', 'Dị ứng', 'Tình trạng', 'Khuyến nghị', 'Ghi chú', 'Người ghi', 'Ngày tạo'],
      ...records.map((r, i) => {
        const bmi = r.height && r.weight ? +(r.weight / ((r.height / 100) ** 2)).toFixed(1) : '';
        return [
          i + 1,
          r.checkDate ? new Date(r.checkDate).toLocaleDateString('vi-VN') : '',
          r.height ?? '', r.weight ?? '', bmi,
          r.temperature ?? '', r.heartRate ?? '',
          (r.chronicDiseases || []).join(', '),
          (r.allergies || []).map(a => a.allergen || a).filter(Boolean).join(', '),
          STATUS_CONFIG[r.generalStatus]?.label || '',
          r.recommendations || '', r.notes || '',
          r.recordedBy?.fullName || r.recordedBy?.username || '',
          r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '',
        ];
      }),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [4,12,12,12,8,12,12,24,24,14,24,24,16,12].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lịch sử khám');
    XLSX.writeFile(wb, `lich-su-kham-${(student?.fullName || studentId).replace(/\s+/g, '-')}.xlsx`);
    toast.success('Xuất Excel thành công');
  };

  // ── Stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!records.length) return null;
    const latest = records[0];
    const prev   = records[1];
    const bmi    = latest.height && latest.weight ? +(latest.weight / ((latest.height / 100) ** 2)).toFixed(1) : null;
    const heightDelta = prev && latest.height && prev.height ? +(latest.height - prev.height).toFixed(1) : null;
    const weightDelta = prev && latest.weight && prev.weight ? +(latest.weight - prev.weight).toFixed(1) : null;
    return { latest, bmi, heightDelta, weightDelta };
  }, [records]);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <>
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>

        {/* Top bar */}
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
          <Button
            startIcon={<BackIcon />} size="small" variant="outlined" color="inherit"
            onClick={() => navigate('/medical-staff/health')}
          >
            Quay lại
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            size="small" variant="outlined" startIcon={<ExportIcon />}
            onClick={handleExport} disabled={!records.length}
            sx={{ color: '#7c3aed', borderColor: '#7c3aed', '&:hover': { borderColor: '#6d28d9', bgcolor: '#faf5ff' } }}
          >
            Xuất Excel
          </Button>
          {!isReadOnly && (
            <Button
              size="small" variant="contained" startIcon={<AddIcon />}
              onClick={() => setFormOpen(true)}
              sx={{ bgcolor: '#0891b2', '&:hover': { bgcolor: '#0e7490' } }}
            >
              Ghi nhận lần khám mới
            </Button>
          )}
        </Stack>

        {/* Student info header */}
        <Paper elevation={0} sx={{ mb: 2.5, p: 2.5, borderRadius: 2, background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.2)', fontSize: '1.4rem' }}>
              {student?.fullName?.[0] || <PersonIcon />}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700} color="white">
                {student?.fullName || 'Học sinh'}
              </Typography>
              <Stack direction="row" spacing={2} mt={0.5}>
                {student?.className && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Lớp: {student.className}
                  </Typography>
                )}
                {student?.dateOfBirth && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Ngày sinh: {new Date(student.dateOfBirth).toLocaleDateString('vi-VN')}
                  </Typography>
                )}
                {student?.gender && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {student.gender === 'male' ? 'Nam' : student.gender === 'female' ? 'Nữ' : 'Khác'}
                  </Typography>
                )}
              </Stack>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h4" fontWeight={800} color="white">{records.length}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>lần khám</Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Quick stats từ lần khám mới nhất */}
        {stats && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2.5}>
            {[
              {
                icon: <HeightIcon />, label: 'Chiều cao',
                val: stats.latest.height ? `${stats.latest.height} cm` : '—',
                delta: stats.heightDelta,
                color: '#0891b2', bg: '#e0f2fe',
              },
              {
                icon: <WeightIcon />, label: 'Cân nặng',
                val: stats.latest.weight ? `${stats.latest.weight} kg` : '—',
                delta: stats.weightDelta,
                color: '#7c3aed', bg: '#f3e8ff',
              },
              {
                icon: <SafetyIcon />, label: 'BMI',
                val: stats.bmi ? `${stats.bmi}` : '—',
                sub: bmiCategory(stats.bmi)?.label,
                color: '#0891b2', bg: '#e0f2fe',
              },
              {
                icon: <CalendarIcon />, label: 'Khám gần nhất',
                val: stats.latest.checkDate ? new Date(stats.latest.checkDate).toLocaleDateString('vi-VN') : '—',
                sub: STATUS_CONFIG[stats.latest.generalStatus]?.label,
                statusColor: STATUS_CONFIG[stats.latest.generalStatus]?.text,
                color: '#16a34a', bg: '#dcfce7',
              },
            ].map(s => (
              <Paper key={s.label} elevation={0} sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: s.bg }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                  <Box sx={{ color: s.color, display: 'flex' }}>{s.icon}</Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{s.label}</Typography>
                </Stack>
                <Typography variant="h6" fontWeight={800} color={s.color}>{s.val}</Typography>
                {s.delta !== undefined && s.delta !== null && (
                  <Typography variant="caption" color={s.delta >= 0 ? '#16a34a' : '#dc2626'}>
                    {s.delta >= 0 ? '+' : ''}{s.delta} so với lần trước
                  </Typography>
                )}
                {s.sub && (
                  <Typography variant="caption" sx={{ color: s.statusColor || 'text.secondary', display: 'block' }}>
                    {s.sub}
                  </Typography>
                )}
              </Paper>
            ))}
          </Stack>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        {/* History table */}
        <Paper elevation={1} sx={{ borderRadius: 2 }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <HistoryIcon sx={{ color: '#7c3aed', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight={700}>Danh sách các lần khám</Typography>
              {records.length > 0 && (
                <Chip label={`${records.length} bản ghi`} size="small"
                  sx={{ bgcolor: '#f3e8ff', color: '#7c3aed', fontWeight: 600, fontSize: '0.72rem' }} />
              )}
            </Stack>
          </Box>

          {loading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary" mt={1}>Đang tải...</Typography>
            </Box>
          ) : records.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
              <HistoryIcon sx={{ fontSize: 48, color: 'grey.300', display: 'block', mx: 'auto', mb: 1 }} />
              <Typography variant="body2">Chưa có lần khám nào</Typography>
              <Button size="small" variant="contained" startIcon={<AddIcon />} sx={{ mt: 1.5, bgcolor: '#0891b2' }}
                onClick={() => setFormOpen(true)}>
                Tạo lần khám đầu tiên
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#faf5ff' }}>
                  <TableRow>
                    {['#', 'Ngày khám', 'Cao (cm)', 'Nặng (kg)', 'BMI', 'Nhiệt độ', 'Nhịp tim',
                      'Tiền sử bệnh', 'Dị ứng', 'Tình trạng', 'Khuyến nghị', 'Người ghi', 'Ngày tạo', ''].map(col => (
                      <TableCell key={col} sx={{
                        fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase',
                        color: '#7c3aed', py: 1.2, whiteSpace: 'nowrap',
                        borderBottom: '2px solid #e9d5ff',
                      }}>
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((r, idx) => {
                    const bmi = r.height && r.weight ? +(r.weight / ((r.height / 100) ** 2)).toFixed(1) : null;
                    const bmiInfo = bmiCategory(bmi);
                    const statusCfg = STATUS_CONFIG[r.generalStatus];
                    const isLatest = idx === 0;
                    return (
                      <TableRow key={r._id}
                        sx={{
                          bgcolor: isLatest ? '#faf5ff' : undefined,
                          '&:hover': { bgcolor: isLatest ? '#f3e8ff' : '#fafafa' },
                        }}
                      >
                        <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: isLatest ? 700 : 400 }}>
                          {idx + 1}
                        </TableCell>

                        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 110 }}>
                          <Stack spacing={0.3}>
                            <Typography variant="caption" fontWeight={isLatest ? 700 : 500} sx={{ fontSize: '0.8rem' }}>
                              {r.checkDate ? new Date(r.checkDate).toLocaleDateString('vi-VN') : '—'}
                            </Typography>
                            {isLatest && (
                              <Chip label="Mới nhất" size="small" color="success"
                                sx={{ height: 16, fontSize: '0.6rem', width: 'fit-content' }} />
                            )}
                          </Stack>
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                          {r.height ?? <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                          {r.weight ?? <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>

                        <TableCell>
                          {bmiInfo
                            ? <Chip label={`${bmi} · ${bmiInfo.label}`} size="small" color={bmiInfo.color}
                                variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
                            : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.78rem' }}>
                          {r.temperature ? `${r.temperature}°C` : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.78rem' }}>
                          {r.heartRate ? `${r.heartRate} bpm` : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', maxWidth: 150 }}>
                          {r.chronicDiseases?.length > 0
                            ? <Typography variant="caption">{r.chronicDiseases.join(', ')}</Typography>
                            : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>

                        <TableCell sx={{ maxWidth: 150 }}>
                          {r.allergies?.length > 0
                            ? <Stack direction="row" flexWrap="wrap" gap={0.3}>
                                {r.allergies.map((a, i) => (
                                  <Chip key={i} label={a.allergen || a} size="small" color="warning"
                                    variant="outlined" sx={{ fontSize: '0.6rem', height: 16 }} />
                                ))}
                              </Stack>
                            : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>

                        <TableCell>
                          {statusCfg
                            ? <Chip label={statusCfg.label} size="small" color={statusCfg.color}
                                sx={{ fontSize: '0.65rem', height: 18, fontWeight: 600 }} />
                            : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.74rem', color: 'text.secondary', maxWidth: 180 }}>
                          {r.recommendations || <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          {r.recordedBy?.fullName || r.recordedBy?.username || '—'}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.74rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </TableCell>

                        <TableCell align="right">
                          {!isReadOnly && (
                            <Tooltip title="Xóa bản ghi này">
                              <IconButton size="small"
                                onClick={() => setDeleteTarget(r)}
                                sx={{ color: 'error.light', '&:hover': { color: 'error.main' } }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
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

      {/* New check dialog */}
      <NewCheckDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        studentId={studentId}
        prefill={records[0] || null}
        onSaved={fetchHistory}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Xóa bản ghi khám</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Bạn có chắc muốn xóa bản ghi khám ngày{' '}
            <strong>{deleteTarget?.checkDate ? new Date(deleteTarget.checkDate).toLocaleDateString('vi-VN') : ''}</strong>?<br />
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
