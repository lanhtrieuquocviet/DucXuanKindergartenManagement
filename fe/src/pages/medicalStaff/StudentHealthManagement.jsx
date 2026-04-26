import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

import { get, post, put, del, ENDPOINTS } from '../../service/api';
import {
  Box, Paper, Typography, Button, Stack, TextField, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  TablePagination, CircularProgress, Alert, Tab, Tabs,
  FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress, InputAdornment,
  IconButton, Tooltip, Divider,
} from '@mui/material';
import {
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  Search as SearchIcon,
  PeopleAlt as PeopleIcon,
  MonitorHeart as HealthIcon,
  HealthAndSafety as SafetyIcon,
  MedicalServices as MedicalIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';

// ── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  healthy:    { label: 'Bình thường', color: 'success' },
  monitor:    { label: 'Theo dõi',    color: 'warning' },
  concerning: { label: 'Đáng lo ngại', color: 'error'  },
};

function bmiLabel(bmi) {
  if (!bmi) return null;
  if (bmi < 14.5) return { label: 'Thiếu cân',  color: 'info'    };
  if (bmi < 18)   return { label: 'Bình thường', color: 'success' };
  if (bmi < 25)   return { label: 'Thừa cân',    color: 'warning' };
  return           { label: 'Béo phì',     color: 'error'   };
}

const IMPORT_COLUMNS = ['Tên học sinh', 'Lớp', 'Chiều cao (cm)', 'Cân nặng (kg)', 'Tiền sử bệnh', 'Dị ứng', 'Ghi chú'];


const EMPTY_FORM = {
  height: '', weight: '', temperature: '', heartRate: '',
  chronicDiseases: '', allergies: '',
  notes: '', generalStatus: 'healthy',
  checkDate: new Date().toISOString().slice(0, 10),
  followUpDate: '', recommendations: '',
};

// ── HealthFormDialog — tạo mới hoặc cập nhật bản ghi đang hiển thị (editHealthId) ──
function HealthFormDialog({ open, onClose, student, prefill, editHealthId, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (prefill) {
      const allergiesStr = Array.isArray(prefill.allergies)
        ? prefill.allergies.map(a => (typeof a === 'string' ? a : a.allergen)).filter(Boolean).join(', ')
        : '';
      setForm({
        height:          prefill.height ?? '',
        weight:          prefill.weight ?? '',
        temperature:     prefill.temperature ?? '',
        heartRate:       prefill.heartRate ?? '',
        chronicDiseases: Array.isArray(prefill.chronicDiseases) ? prefill.chronicDiseases.join(', ') : (prefill.chronicDiseases || ''),
        allergies:       allergiesStr,
        notes:           prefill.notes || '',
        generalStatus:   prefill.generalStatus || 'healthy',
        checkDate:       editHealthId && prefill.checkDate
          ? new Date(prefill.checkDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        followUpDate:    prefill.followUpDate ? new Date(prefill.followUpDate).toISOString().slice(0, 10) : '',
        recommendations: prefill.recommendations || '',
      });
    } else {
      setForm({ ...EMPTY_FORM, checkDate: new Date().toISOString().slice(0, 10) });
    }
    setErr(null);
  }, [open, prefill, editHealthId]);

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    try {
      const chronicDiseases = form.chronicDiseases.split(',').map(s => s.trim()).filter(Boolean);
      const allergies = form.allergies.split(',').map(s => s.trim()).filter(Boolean).map(a => ({ allergen: a }));
      const common = {
        height: form.height,
        weight: form.weight,
        temperature: form.temperature,
        heartRate: form.heartRate,
        chronicDiseases,
        allergies,
        notes: form.notes,
        generalStatus: form.generalStatus,
        checkDate: form.checkDate,
        followUpDate: form.followUpDate || undefined,
        recommendations: form.recommendations,
      };
      if (editHealthId) {
        await put(ENDPOINTS.STUDENTS.HEALTH_RECORD_UPDATE(editHealthId), common);
        toast.success('Đã cập nhật hồ sơ sức khỏe');
      } else {
        await post(ENDPOINTS.STUDENTS.HEALTH_RECORD_CREATE, { ...common, studentId: student._id });
        toast.success('Tạo hồ sơ sức khỏe thành công');
      }
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
        {editHealthId ? 'Cập nhật lần khám (đang hiển thị)' : prefill ? 'Ghi nhận lần khám mới' : 'Tạo hồ sơ sức khỏe'} — {student?.fullName}
      </DialogTitle>
      <DialogContent dividers>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        {prefill && !editHealthId && (
          <Alert severity="info" sx={{ mb: 2, fontSize: '0.8rem' }}>
            Thông tin được điền sẵn từ lần khám trước. Bản ghi mới sẽ được tạo khi lưu.
          </Alert>
        )}
        {editHealthId && (
          <Alert severity="info" sx={{ mb: 2, fontSize: '0.8rem' }}>
            Bạn đang sửa đúng bản ghi đang hiển thị trên bảng tổng quan. Lưu để cập nhật (không tạo thêm lần khám mới).
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
          <TextField
            size="small" label="Tiền sử bệnh" fullWidth multiline rows={2}
            value={form.chronicDiseases} onChange={f('chronicDiseases')}
            helperText="Nhập các bệnh phân cách bởi dấu phẩy, ví dụ: Hen suyễn, Tiểu đường"
          />
          <TextField
            size="small" label="Dị ứng" fullWidth
            value={form.allergies} onChange={f('allergies')}
            helperText="Nhập các chất gây dị ứng phân cách bởi dấu phẩy, ví dụ: Tôm, Sữa"
          />

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
            <TextField
              size="small" label="Ngày khám" fullWidth type="date"
              value={form.checkDate} onChange={f('checkDate')}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
          <TextField size="small" label="Khuyến nghị" fullWidth multiline rows={2} value={form.recommendations} onChange={f('recommendations')} />
          <TextField size="small" label="Ghi chú" fullWidth multiline rows={2} value={form.notes} onChange={f('notes')} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} disabled={saving} color="inherit">Hủy</Button>
        <Button
          variant="contained" onClick={handleSave} disabled={saving}
          sx={{ bgcolor: '#0891b2', '&:hover': { bgcolor: '#0e7490' } }}
        >
          {saving ? <CircularProgress size={18} color="inherit" /> : (editHealthId ? 'Cập nhật' : prefill ? 'Lưu lần khám mới' : 'Tạo hồ sơ')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function StudentHealthManagement() {
  const navigate = useNavigate();
  const { user, hasRole, hasPermission, logout, isInitializing } = useAuth();

  const [rows, setRows]         = useState([]);
  const [classes, setClasses]   = useState([]);
  const [academicYear, setAcademicYear] = useState('');
  
  const isReadOnly = useMemo(() => {
    // SchoolAdmin and Teacher are read-only unless they also have MedicalStaff or SystemAdmin roles
    const isRestrictedRole = hasRole('SchoolAdmin') || hasRole('Teacher');
    const hasOverrideRole = hasRole('MedicalStaff') || hasRole('SystemAdmin');
    return isRestrictedRole && !hasOverrideRole;
  }, [hasRole]);

  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage]         = useState(0);
  const PAGE_SIZE = 15;

  // CRUD dialog — prefill = latest record data (or null for brand new)
  const [healthDialog, setHealthDialog] = useState({ open: false, student: null, prefill: null, editHealthId: null });

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null); // { healthId, studentName }
  const [deleting, setDeleting]         = useState(false);

  // Import dialog
  const [importOpen, setImportOpen]     = useState(false);
  const [importRows, setImportRows]     = useState([]);
  const [importFile, setImportFile]     = useState('');
  const [importing, setImporting]       = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const allowed = hasRole('MedicalStaff') || hasRole('SchoolAdmin') || hasRole('SystemAdmin') || hasPermission('MANAGE_HEALTH');
    if (!allowed) { navigate('/', { replace: true }); return; }
    fetchData();
  }, [isInitializing, user]); // eslint-disable-line

  const fetchData = async (cId = classFilter) => {
    setLoading(true);
    setError(null);
    try {
      const params = cId ? `?classId=${cId}` : '';
      const [healthRes, classRes] = await Promise.all([
        get(`${ENDPOINTS.STUDENTS.HEALTH_OVERVIEW}${params}`),
        get(ENDPOINTS.STUDENTS.HEALTH_CLASSES),
      ]);
      setRows(healthRes.data || []);
      setClasses(classRes.data || []);
      if (classRes.academicYear) setAcademicYear(classRes.academicYear);
    } catch (err) {
      setError(err.message || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r =>
      (!q || r.fullName.toLowerCase().includes(q) || r.className.toLowerCase().includes(q)) &&
      (!classFilter || String(r.classId) === classFilter)
    );
  }, [rows, search, classFilter]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await del(ENDPOINTS.STUDENTS.HEALTH_RECORD_DELETE(deleteTarget.healthId));
      toast.success('Đã xóa hồ sơ sức khỏe');
      setDeleteTarget(null);
      fetchData();
    } catch (e) {
      toast.error(e.data?.message || e.message || 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  };

  // ── Export ────────────────────────────────────────────────────
  const handleExport = () => {
    const data = [
      ['STT', 'Tên học sinh', 'Lớp', 'Ngày sinh', 'Giới tính', 'Chiều cao (cm)', 'Cân nặng (kg)', 'BMI', 'Tiền sử bệnh', 'Dị ứng', 'Tình trạng', 'Ngày cập nhật'],
      ...filtered.map((r, i) => [
        i + 1, r.fullName, r.className,
        r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString('vi-VN') : '',
        r.gender === 'male' ? 'Nam' : r.gender === 'female' ? 'Nữ' : 'Khác',
        r.height ?? '', r.weight ?? '', r.bmi ?? '',
        (r.chronicDiseases || []).join(', '),
        (r.allergies || []).join(', '),
        STATUS_CONFIG[r.generalStatus]?.label || '',
        r.checkDate ? new Date(r.checkDate).toLocaleDateString('vi-VN') : '',
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [5, 20, 12, 12, 8, 10, 10, 8, 25, 25, 14, 14].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sức khỏe học sinh');
    XLSX.writeFile(wb, `bao-cao-suc-khoe-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Xuất báo cáo thành công');
  };

  const handleDownloadTemplate = () => {
    const data = [IMPORT_COLUMNS, ['Nguyễn Văn A', 'Lớp Lá Xanh', '105', '17', 'Hen suyễn', 'Tôm, Sữa', 'Ghi chú mẫu']];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = IMPORT_COLUMNS.map((_, i) => ({ wch: i === 0 ? 22 : 16 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mẫu import');
    XLSX.writeFile(wb, 'mau-import-suc-khoe.xlsx');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file.name);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (raw.length < 2) { toast.error('File Excel trống'); return; }
        const parsed = raw.slice(1).map(row => ({
          fullName: String(row[0] || '').trim(), className: String(row[1] || '').trim(),
          height: row[2] || '', weight: row[3] || '',
          chronicDiseases: String(row[4] || '').trim(), allergies: String(row[5] || '').trim(),
          notes: String(row[6] || '').trim(),
        })).filter(r => r.fullName);
        setImportRows(parsed);
      } catch { toast.error('Không thể đọc file Excel'); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleImportSubmit = async () => {
    if (!importRows.length) return;
    setImporting(true);
    try {
      const res = await post(ENDPOINTS.STUDENTS.HEALTH_IMPORT, { rows: importRows });
      setImportResult(res);
      if (res.created > 0) { toast.success(`Import thành công ${res.created} bản ghi`); fetchData(); }
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Import thất bại');
    } finally { setImporting(false); }
  };

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const stats = useMemo(() => {
    const withHealth = rows.filter(r => r.healthId);
    return {
      total:      rows.length,
      withHealth: withHealth.length,
      healthy:    rows.filter(r => r.generalStatus === 'healthy').length,
      monitor:    rows.filter(r => r.generalStatus === 'monitor').length,
      concerning: rows.filter(r => r.generalStatus === 'concerning').length,
    };
  }, [rows]);

  return (
    <>
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1300, mx: 'auto' }}>
        {/* Header */}
        <Paper elevation={0} sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <SafetyIcon sx={{ color: 'white', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight={700} color="white">Quản lý sức khỏe học sinh</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {academicYear ? `Năm học: ${academicYear}` : 'Tổng quan tình hình sức khỏe toàn trường'}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Tabs */}
        {/* <Paper elevation={0} sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Tabs
            value={1}
            sx={{ px: 1, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13 }, '& .Mui-selected': { color: '#0891b2' }, '& .MuiTabs-indicator': { bgcolor: '#0891b2' } }}
          >
            <Tab icon={<PeopleIcon fontSize="small" />} iconPosition="start" label="Danh sách học sinh" disabled />
            <Tab icon={<HealthIcon fontSize="small" />} iconPosition="start" label="Báo cáo sức khỏe" />
          </Tabs>
        </Paper> */}

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        {/* Stat cards */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2.5}>
          {[
            { label: 'Tổng học sinh', val: stats.total,      color: '#6366f1', bg: '#eef2ff' },
            { label: 'Có hồ sơ SK',  val: stats.withHealth, color: '#0891b2', bg: '#e0f2fe' },
            { label: 'Bình thường',  val: stats.healthy,    color: '#16a34a', bg: '#dcfce7' },
            { label: 'Theo dõi',     val: stats.monitor,    color: '#d97706', bg: '#fef3c7' },
            { label: 'Đáng lo ngại', val: stats.concerning, color: '#dc2626', bg: '#fee2e2' },
          ].map(s => (
            <Paper key={s.label} elevation={0} sx={{ flex: 1, px: 2, py: 1.5, borderRadius: 2, bgcolor: s.bg, border: `1px solid ${s.bg}` }}>
              <Typography variant="h5" fontWeight={800} color={s.color}>{s.val}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Paper>
          ))}
        </Stack>

        <Paper elevation={1} sx={{ borderRadius: 2, p: 2.5 }}>
          {/* Toolbar */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2} alignItems={{ sm: 'center' }}>
            <TextField
              size="small" placeholder="Tìm tên học sinh, lớp..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
              sx={{ minWidth: 220 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Lọc theo lớp</InputLabel>
              <Select label="Lọc theo lớp" value={classFilter} onChange={e => { setClassFilter(e.target.value); setPage(0); fetchData(e.target.value); }}>
                <MenuItem value="">Tất cả lớp</MenuItem>
                {classes.map(c => <MenuItem key={c._id} value={c._id}>{c.className || c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Box sx={{ flex: 1 }} />
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" color="inherit" onClick={handleDownloadTemplate}>Tải mẫu</Button>
              {!isReadOnly && (
                <Button size="small" variant="outlined" startIcon={<ImportIcon />} onClick={() => { setImportOpen(true); setImportResult(null); setImportRows([]); setImportFile(''); }}>Import Excel</Button>
              )}
              <Button size="small" variant="contained" startIcon={<ExportIcon />} onClick={handleExport} sx={{ bgcolor: '#0891b2', '&:hover': { bgcolor: '#0e7490' } }}>Xuất báo cáo</Button>
            </Stack>
          </Stack>

          {/* Table */}
          {loading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress size={32} /><Typography variant="body2" color="text.secondary" mt={1}>Đang tải...</Typography></Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small" sx={{ minWidth: 960 }}>
                  <TableHead sx={{ bgcolor: '#f0f9ff' }}>
                    <TableRow>
                      {['#', 'Tên học sinh / Lớp', 'Chiều cao', 'Cân nặng', 'BMI', 'Tiền sử bệnh', 'Dị ứng', 'Tình trạng', 'Lần khám', 'Ngày khám gần nhất', ''].map(col => (
                        <TableCell key={col} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'text.secondary', py: 1, whiteSpace: 'nowrap' }}>
                          {col}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                          <PersonIcon sx={{ fontSize: 40, color: 'grey.300', display: 'block', mx: 'auto', mb: 1 }} />
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    ) : paginated.map((r, idx) => {
                      const bmi = bmiLabel(r.bmi);
                      const statusCfg = STATUS_CONFIG[r.generalStatus];
                      return (
                        <TableRow
                          key={r._id}
                          hover
                          onClick={() => navigate(`/medical-staff/health/${r._id}/history`, { state: r })}
                          sx={{
                            cursor: 'pointer',
                            bgcolor: r.generalStatus === 'concerning' ? '#fff5f5' : r.generalStatus === 'monitor' ? '#fffbeb' : undefined,
                            '&:hover': { bgcolor: r.generalStatus === 'concerning' ? '#fee2e2' : r.generalStatus === 'monitor' ? '#fde68a33' : '#f0f9ff' },
                          }}
                        >
                          <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{page * PAGE_SIZE + idx + 1}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Typography variant="body2" fontWeight={700} color="primary" sx={{ fontSize: '0.85rem', '&:hover': { textDecoration: 'underline' } }}>
                              {r.fullName}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">{r.className}</Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.82rem' }}>
                            {r.height ? `${r.height} cm` : <Typography variant="caption" color="text.disabled">—</Typography>}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.82rem' }}>
                            {r.weight ? `${r.weight} kg` : <Typography variant="caption" color="text.disabled">—</Typography>}
                          </TableCell>
                          <TableCell>
                            {bmi
                              ? <Chip label={`${r.bmi} · ${bmi.label}`} size="small" color={bmi.color} variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                              : <Typography variant="caption" color="text.disabled">—</Typography>}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 140 }}>
                            {r.chronicDiseases?.length > 0
                              ? <Typography variant="caption">{r.chronicDiseases.join(', ')}</Typography>
                              : <Typography variant="caption" color="text.disabled">—</Typography>}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 140 }}>
                            {r.allergies?.length > 0
                              ? <Stack direction="row" flexWrap="wrap" gap={0.4}>{r.allergies.map((a, i) => <Chip key={i} label={a} size="small" color="warning" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />)}</Stack>
                              : <Typography variant="caption" color="text.disabled">—</Typography>}
                          </TableCell>
                          <TableCell>
                            {statusCfg
                              ? <Chip label={statusCfg.label} size="small" color={statusCfg.color} sx={{ fontSize: '0.7rem', height: 20, fontWeight: 600 }} />
                              : <Typography variant="caption" color="text.disabled">Chưa có</Typography>}
                          </TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            {r.checkupCount > 0 ? (
                              <Chip
                                icon={<HistoryIcon sx={{ fontSize: '0.85rem !important' }} />}
                                label={`${r.checkupCount} lần`}
                                size="small"
                                onClick={e => { e.stopPropagation(); navigate(`/medical-staff/health/${r._id}/history`, { state: r }); }}
                                sx={{ fontSize: '0.7rem', height: 22, bgcolor: '#f3e8ff', color: '#7c3aed', fontWeight: 600, cursor: 'pointer', '&:hover': { bgcolor: '#e9d5ff' } }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                            {r.checkDate ? new Date(r.checkDate).toLocaleDateString('vi-VN') : '—'}
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                            {!isReadOnly && (
                              <>
                                <Tooltip title={r.healthId ? 'Sửa hồ sơ đang hiển thị' : 'Tạo hồ sơ sức khỏe'}>
                                  <IconButton
                                    size="small"
                                    onClick={e => {
                                      e.stopPropagation();
                                      setHealthDialog({
                                        open: true,
                                        student: r,
                                        prefill: r.healthId ? r : null,
                                        editHealthId: r.healthId || null,
                                      });
                                    }}
                                    sx={{ color: r.healthId ? '#2563eb' : '#16a34a' }}
                                  >
                                    {r.healthId ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                                  </IconButton>
                                </Tooltip>
                                {r.healthId && (
                                  <Tooltip title="Xóa hồ sơ mới nhất">
                                    <IconButton size="small" onClick={e => { e.stopPropagation(); setDeleteTarget({ healthId: r.healthId, studentName: r.fullName }); }} sx={{ color: 'error.main' }}>
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div" count={filtered.length} page={page}
                rowsPerPage={PAGE_SIZE} rowsPerPageOptions={[PAGE_SIZE]}
                onPageChange={(_, p) => setPage(p)}
                labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count} học sinh`}
                sx={{ borderTop: '1px solid', borderColor: 'divider' }}
              />
            </>
          )}
        </Paper>
      </Box>

      {/* Health form dialog — always creates new record */}
      <HealthFormDialog
        open={healthDialog.open}
        onClose={() => setHealthDialog({ open: false, student: null, prefill: null, editHealthId: null })}
        student={healthDialog.student}
        prefill={healthDialog.prefill}
        editHealthId={healthDialog.editHealthId}
        onSaved={fetchData}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Xóa hồ sơ sức khỏe</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Bạn có chắc muốn xóa hồ sơ sức khỏe gần nhất của <strong>{deleteTarget?.studentName}</strong>?<br />
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

      {/* Import dialog */}
      <Dialog open={importOpen} onClose={() => !importing && setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Import sức khỏe từ Excel</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
              File Excel cần có các cột: <strong>{IMPORT_COLUMNS.join(', ')}</strong>.<br />
              Hàng đầu tiên là tiêu đề, từ hàng 2 là dữ liệu.
            </Alert>
            <Box>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileChange} />
              <Button variant="outlined" startIcon={<ImportIcon />} onClick={() => fileRef.current?.click()} fullWidth>
                {importFile || 'Chọn file Excel...'}
              </Button>
            </Box>
            {importRows.length > 0 && !importResult && (
              <Alert severity="success" sx={{ fontSize: '0.8rem' }}>Đọc được <strong>{importRows.length}</strong> hàng. Nhấn "Xác nhận import" để tiến hành.</Alert>
            )}
            {importing && <Box><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Đang import...</Typography><LinearProgress /></Box>}
            {importResult && (
              <Alert severity={importResult.created > 0 ? 'success' : 'warning'} sx={{ fontSize: '0.8rem' }}>
                <strong>Kết quả:</strong> Tạo mới {importResult.created} bản ghi, bỏ qua {importResult.skipped}.
                {importResult.errors?.length > 0 && <Box mt={0.5}>{importResult.errors.slice(0, 5).map((e, i) => <div key={i}>• {e}</div>)}</Box>}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={() => setImportOpen(false)} disabled={importing} color="inherit">Đóng</Button>
          <Button variant="contained" onClick={handleImportSubmit} disabled={importing || importRows.length === 0 || !!importResult} sx={{ bgcolor: '#0891b2', '&:hover': { bgcolor: '#0e7490' } }}>
            {importing ? 'Đang import...' : `Xác nhận import (${importRows.length} hàng)`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
