import {
  Add as AddIcon,
  ChevronRight as ArrowIcon,
  Article as ArticleIcon,
  Dashboard as DashboardIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  FileDownload as FileDownloadIcon,
  Inventory as InventoryIcon,
  List as ListIcon,
  LocationOn as LocationIcon,
  UploadFile as UploadFileIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { del, ENDPOINTS, get, patch, post, postFormData, put } from '../../service/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_LABEL = {
  draft: { label: 'Nháp', color: 'default' },
  pending: { label: 'Chờ duyệt', color: 'warning' },
  approved: { label: 'Đã duyệt', color: 'success' },
  rejected: { label: 'Từ chối', color: 'error' },
};

function formatDateInput(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

const emptyMember = () => ({ userId: null, fullName: '', position: '', role: 'Thành viên', notes: '' });
const emptyCommittee = () => ({ name: '', foundedDate: new Date().toISOString().slice(0, 10), decisionNumber: '', members: [emptyMember()] });
const emptyAssetRow = () => ({ category: '', assetCode: '', name: '', unit: 'Cái', quantity: 0, targetUser: '', notes: '' });
const emptyMinutes = () => ({
  className: '',
  location: 'Đức Xuân',
  inspectionDate: new Date().toISOString().slice(0, 10),
  inspectionTime: '',
  endTime: '',
  reason: 'Kiểm kê tài sản có trong lớp học tại thời điểm cuối năm',
  inspectionMethod: 'Kiểm kê số tài sản có trong lớp học và theo Thông tư 01 của Bộ GD&ĐT ban hành và các thiết bị dạy học khác.\nTổng hợp số liệu báo cáo về nhà trường để có kế hoạch bổ sung và theo dõi.',
  committeeId: '',
  assets: [emptyAssetRow()],
  extraAssets: [],
  conclusion: '',
});

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ─── Shared: Confirm Delete Dialog ───────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading, confirmText = 'Xóa', loadingText = 'Đang xóa...' }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title || 'Xác nhận'}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading}>Hủy</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={loading}>
          {loading ? loadingText : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Shared: Add Category Dialog ─────────────────────────────────────────────
function AddCategoryDialog({ open, onClose, onConfirm }) {
  const [value, setValue] = useState('');
  const handleConfirm = () => {
    if (!value.trim()) return;
    onConfirm(value.trim());
    setValue('');
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Thêm nhóm tài sản</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          size="small"
          label="Tên nhóm"
          placeholder="VD: ĐỒ DÙNG, THIẾT BỊ DẠY HỌC"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={() => { onClose(); setValue(''); }}>Hủy</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={!value.trim()}>Thêm</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Committee Tab ────────────────────────────────────────────────────────────
export function CommitteeTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(true);
  const [committees, setCommittees] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCommittee());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewCommittee, setViewCommittee] = useState(null);
  const [endTarget, setEndTarget] = useState(null);
  const [ending, setEnding] = useState(false);
  const [committeeTab, setCommitteeTab] = useState(0);
  const [historyYear, setHistoryYear] = useState('all');
  // Minutes merged state
  const [minutesList, setMinutesList] = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [minutesPage, setMinutesPage] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [editingMinutes, setEditingMinutes] = useState(null);
  const [minutesForm, setMinutesForm] = useState(emptyMinutes());
  const [savingMinutes, setSavingMinutes] = useState(false);
  const [deleteMinutesTarget, setDeleteMinutesTarget] = useState(null);
  const [deletingMinutes, setDeletingMinutes] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [categoryDialog, setCategoryDialog] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const [cRes, tRes, sRes, clsRes, mRes] = await Promise.all([
        get(ENDPOINTS.SCHOOL_ADMIN.ASSET_COMMITTEES),
        get(ENDPOINTS.SCHOOL_ADMIN.TEACHERS),
        get(ENDPOINTS.SCHOOL_ADMIN.STAFF),
        get(ENDPOINTS.CLASSES.LIST),
        get(ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES),
      ]);
      setCommittees(cRes?.data?.committees || []);
      setTeachers((tRes?.data || []).filter(t => t.fullName?.trim()));
      setStaff((sRes?.data || []).filter(s => s.fullName?.trim()));
      setClasses((clsRes?.data || []).filter(c => c.className?.trim()));
      setMinutesList(mRes?.data?.minutes || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được danh sách ban kiểm kê.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMemberChange = (idx, field, value) =>
    setForm(prev => {
      if (field === 'fullName' && value.trim()) {
        const duplicate = prev.members.some((m, i) => i !== idx && m.fullName.trim() === value.trim());
        if (duplicate) { toast.warning('Thành viên này đã được thêm.'); return prev; }
      }
      const members = [...prev.members];
      members[idx] = { ...members[idx], [field]: value };
      return { ...prev, members };
    });

  const handleAddMember = () => setForm(prev => ({ ...prev, members: [...prev.members, emptyMember()] }));
  const handleRemoveMember = idx => setForm(prev => ({ ...prev, members: prev.members.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    const errs = {};
    const nameTrimmed = form.name.trim();
    if (!nameTrimmed) errs.name = 'Vui lòng nhập tên ban kiểm kê.';
    else if (nameTrimmed.length > 50) errs.name = 'Tên ban không được vượt quá 50 ký tự.';

    if (!form.foundedDate) {
      errs.foundedDate = 'Vui lòng chọn ngày thành lập.';
    } else {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      // Parse theo local time (tránh lệch múi giờ khi dùng new Date("YYYY-MM-DD"))
      const [y, m, d] = form.foundedDate.split('-');
      const chosen = new Date(Number(y), Number(m) - 1, Number(d));
      if (chosen > today) errs.foundedDate = 'Ngày thành lập không được ở tương lai.';
    }

    const decTrimmed = form.decisionNumber.trim();
    if (!decTrimmed) errs.decisionNumber = 'Vui lòng nhập số quyết định.';
    else if (decTrimmed.length > 50) errs.decisionNumber = 'Số quyết định không được vượt quá 50 ký tự.';

    const filledNames = form.members.map(m => m.fullName.trim()).filter(Boolean);
    if (filledNames.length === 0) errs.members = 'Phải có ít nhất 1 thành viên.';
    else if (new Set(filledNames).size !== filledNames.length) errs.members = 'Danh sách thành viên có người bị trùng.';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error(Object.values(errs)[0]);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (editId) {
        await put(ENDPOINTS.SCHOOL_ADMIN.ASSET_COMMITTEE_DETAIL(editId), form);
        toast.success('Cập nhật ban kiểm kê thành công.');
      } else {
        await post(ENDPOINTS.SCHOOL_ADMIN.ASSET_COMMITTEES, form);
        toast.success('Tạo ban kiểm kê thành công.');
      }
      setShowForm(false); setForm(emptyCommittee()); setEditId(null);
      load();
    } catch (err) { toast.error(err?.message || 'Lưu thất bại.'); }
    finally { setSaving(false); }
  };

  const handleEdit = c => {
    setEditId(c._id);
    setForm({
      name: c.name,
      foundedDate: c.foundedDate ? new Date(c.foundedDate).toISOString().slice(0, 10) : '',
      decisionNumber: c.decisionNumber,
      members: c.members?.length
        ? c.members.map(m => ({ userId: m.userId || null, fullName: m.fullName, position: m.position || '', role: m.role || 'Thành viên', notes: m.notes || '' }))
        : [emptyMember()],
    });
    setShowForm(true);
    setViewCommittee(null);
  };

  const handleConfirmEnd = async () => {
    setEnding(true);
    try {
      await patch(ENDPOINTS.SCHOOL_ADMIN.ASSET_COMMITTEE_END(endTarget));
      toast.success('Đã kết thúc ban kiểm kê.');
      setEndTarget(null);
      load();
    } catch (err) { toast.error(err?.message || 'Kết thúc thất bại.'); }
    finally { setEnding(false); }
  };

  const occupiedMap = {};
  committees
    .filter(c => c.status === 'active' && String(c._id) !== String(editId))
    .forEach(c => (c.members || []).forEach(m => {
      if (m.userId) occupiedMap[String(m.userId)] = c.name;
    }));

  const allPersons = [
    ...teachers.map(t => ({ userId: t.userId, fullName: t.fullName, group: 'Giáo viên', occupiedCommittee: occupiedMap[String(t.userId)] || null })),
    ...staff.map(s => ({ userId: s._id, fullName: s.fullName, group: 'Ban Giám Hiệu', occupiedCommittee: occupiedMap[String(s._id)] || null })),
  ];
  const getChairman = c => c.members?.find(m => m.role === 'Trưởng ban')?.fullName || '—';

  const activeCommittees = committees.filter(c => c.status === 'active');
  const endedCommittees = committees.filter(c => c.status === 'ended');
  const historyYears = [...new Set(
    endedCommittees.map(c => new Date(c.endedAt || c.foundedDate).getFullYear())
  )].sort((a, b) => b - a);
  const filteredHistory = historyYear === 'all'
    ? endedCommittees
    : endedCommittees.filter(c => new Date(c.endedAt || c.foundedDate).getFullYear() === Number(historyYear));

  // ─── Minutes helpers ────────────────────────────────────────────────────────
  const MPAGE_SIZE = 5;
  const minutesByCommittee = minutesList.reduce((acc, m) => {
    const cid = String(m.committeeId?._id || m.committeeId || 'none');
    if (!acc[cid]) acc[cid] = [];
    acc[cid].push(m);
    return acc;
  }, {});

  const toggleExpand = id => setExpandedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleOpenMinutes = m => {
    setEditingMinutes(m);
    setMinutesForm({
      className: m.className || '',
      location: m.location || 'Đức Xuân',
      inspectionDate: m.inspectionDate ? new Date(m.inspectionDate).toISOString().slice(0, 10) : '',
      inspectionTime: m.inspectionTime || '',
      endTime: m.endTime || '',
      reason: m.reason || '',
      inspectionMethod: m.inspectionMethod || '',
      committeeId: m.committeeId?._id || m.committeeId || '',
      assets: m.assets?.length ? m.assets.map(a => ({ ...a })) : [emptyAssetRow()],
      extraAssets: m.extraAssets?.length ? m.extraAssets.map(a => ({ ...a })) : [],
      conclusion: m.conclusion || '',
    });
    setOpenModal(true);
  };

  const handleMinutesApprove = async () => {
    setSavingMinutes(true);
    try {
      await patch(ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES_APPROVE(editingMinutes._id), {});
      toast.success('Đã duyệt biên bản.');
      setOpenModal(false); load();
    } catch (err) { toast.error(err?.message || 'Duyệt thất bại.'); }
    finally { setSavingMinutes(false); }
  };

  const handleMinutesReject = async () => {
    setSavingMinutes(true);
    try {
      await patch(ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES_REJECT(editingMinutes._id), { rejectReason });
      toast.success('Đã từ chối biên bản.');
      setRejectDialog(false); setRejectReason(''); setOpenModal(false); load();
    } catch (err) { toast.error(err?.message || 'Thất bại.'); }
    finally { setSavingMinutes(false); }
  };

  const handleMinutesDeleteConfirm = async () => {
    setDeletingMinutes(true);
    try {
      await del(ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES_DETAIL(deleteMinutesTarget));
      toast.success('Đã xóa biên bản.');
      setDeleteMinutesTarget(null); load();
    } catch (err) { toast.error(err?.message || 'Xóa thất bại.'); }
    finally { setDeletingMinutes(false); }
  };

  const downloadWord = async (m) => {
    try {
      const { getToken } = await import('../../service/api');
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}${ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES_EXPORT_WORD(m._id)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) { toast.error('Không xuất được file Word.'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bien_ban_kiem_ke_${m.minutesNumber || m._id}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Lỗi xuất Word.'); }
  };

  // Modal computed values
  const mParsedDate = minutesForm.inspectionDate ? new Date(minutesForm.inspectionDate) : null;
  const mDayStr = mParsedDate ? mParsedDate.getDate() : '___';
  const mMonthStr = mParsedDate ? mParsedDate.getMonth() + 1 : '___';
  const mYearStr = mParsedDate ? mParsedDate.getFullYear() : '______';
  const mSelectedCommittee = committees.find(c => c._id === minutesForm.committeeId) || null;
  const mCellBorder = { border: '1px solid #555', padding: '4px 6px', fontSize: 13 };
  const mHeaderCell = { ...mCellBorder, fontWeight: 700, textAlign: 'center', background: '#f3f4f6' };

  const renderMinutesPanel = (c) => {
    const cMinutes = minutesByCommittee[String(c._id)] || [];
    const page = minutesPage[String(c._id)] || 0;
    const paged = cMinutes.slice(page * MPAGE_SIZE, (page + 1) * MPAGE_SIZE);
    if (cMinutes.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={1.5}>
          Chưa có biên bản nào cho ban này.
        </Typography>
      );
    }
    return (
      <Box>
        {isMobile ? (
          <Stack spacing={1}>
            {paged.map(m => {
              const s = STATUS_LABEL[m.status] || STATUS_LABEL.pending;
              return (
                <Paper key={m._id} variant="outlined" sx={{ p: 1, borderRadius: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{m.minutesNumber || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(m.inspectionDate)} · {[m.className, m.scope].filter(Boolean).join(' - ') || '—'}
                      </Typography>
                    </Box>
                    <Chip label={s.label} color={s.color} size="small" />
                  </Stack>
                  <Stack direction="row" spacing={0.5} mt={0.5}>
                    <Button size="small" variant="outlined" color="info" sx={{ textTransform: 'none' }} onClick={() => handleOpenMinutes(m)}>Xem</Button>
                    <Tooltip title="Tải Word"><IconButton size="small" onClick={() => downloadWord(m)}><FileDownloadIcon fontSize="small" /></IconButton></Tooltip>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#dbeafe' }}>
                <TableCell>Số BB</TableCell>
                <TableCell>Ngày KK</TableCell>
                <TableCell>Lớp / Phạm vi</TableCell>
                <TableCell>Người tạo</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map(m => {
                const s = STATUS_LABEL[m.status] || STATUS_LABEL.pending;
                return (
                  <TableRow key={m._id}>
                    <TableCell>{m.minutesNumber || '—'}</TableCell>
                    <TableCell>{formatDate(m.inspectionDate)}</TableCell>
                    <TableCell>{[m.className, m.scope].filter(Boolean).join(' - ') || '—'}</TableCell>
                    <TableCell>{m.createdBy?.fullName || '—'}</TableCell>
                    <TableCell><Chip label={s.label} color={s.color} size="small" /></TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Button size="small" variant="outlined" color="info" sx={{ textTransform: 'none' }} onClick={() => handleOpenMinutes(m)}>Xem</Button>
                        <Tooltip title="Tải Word"><IconButton size="small" onClick={() => downloadWord(m)}><FileDownloadIcon fontSize="small" /></IconButton></Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {cMinutes.length > MPAGE_SIZE && (
          <TablePagination
            component="div"
            count={cMinutes.length}
            rowsPerPage={MPAGE_SIZE}
            page={page}
            onPageChange={(_, newPage) => setMinutesPage(prev => ({ ...prev, [String(c._id)]: newPage }))}
            rowsPerPageOptions={[MPAGE_SIZE]}
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count} biên bản`}
            sx={{ '.MuiTablePagination-toolbar': { minHeight: 36 }, fontSize: 12 }}
          />
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* Header row */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} mb={2} gap={1}>
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            borderRadius: 3,
            width: '100%',
            px: 4,
            py: 3,
            mb: 3,
          }}
        >
          <Typography variant="h5" fontWeight={700} color="white">
            Quản lý ban kiểm kê
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
            Kiểm kê tài sản của trường và duyệt biên bản.
          </Typography>
        </Paper>
      </Stack>
      {committeeTab === 0 && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditId(null); setForm(emptyCommittee()); setShowForm(true); }}
          sx={{ background: 'linear-gradient(90deg,#16a34a,#15803d)', textTransform: 'none', alignSelf: { xs: 'flex-start', sm: 'auto' } }}
        >
          Tạo Ban Kiểm Kê
        </Button>
      )}

      {/* Create / Edit Form Dialog */}
      <Dialog open={showForm} onClose={() => !saving && setShowForm(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{editId ? 'Chỉnh sửa Ban Kiểm Kê' : 'Tạo Ban Kiểm Kê Mới'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 0.5 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              {editId ? 'Chỉnh sửa Ban Kiểm Kê' : 'Tạo Ban Kiểm Kê Mới'}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
              <TextField label="Tên Ban Kiểm Kê" fullWidth size="small" required
                value={form.name}
                onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: undefined })); }}
                error={!!errors.name} helperText={errors.name || `${form.name.length}/50`}
                inputProps={{ maxLength: 50 }} />
              <TextField label="Ngày thành lập" type="date" size="small" required InputLabelProps={{ shrink: true }}
                value={formatDateInput(form.foundedDate)}
                disabled
                onChange={e => { setForm(p => ({ ...p, foundedDate: e.target.value })); setErrors(p => ({ ...p, foundedDate: undefined })); }}
                error={!!errors.foundedDate} helperText={errors.foundedDate}
                inputProps={{ max: new Date().toISOString().slice(0, 10) }}
                sx={{ minWidth: { xs: '100%', sm: 175 } }} />
              <TextField label="Số quyết định" size="small" required
                value={form.decisionNumber}
                onChange={e => { setForm(p => ({ ...p, decisionNumber: e.target.value })); setErrors(p => ({ ...p, decisionNumber: undefined })); }}
                error={!!errors.decisionNumber} helperText={errors.decisionNumber || `${form.decisionNumber.length}/50`}
                inputProps={{ maxLength: 50 }}
                sx={{ minWidth: { xs: '100%', sm: 165 } }} />
            </Stack>
            <Typography variant="body2" fontWeight={600} mb={1}>Thành viên Ban Kiểm Kê</Typography>

            {/* Mobile: card per member | Desktop: table */}
            {isMobile ? (
              <Stack spacing={1.5} mb={1}>
                {form.members.map((m, idx) => (
                  <Paper key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                    <Stack spacing={1.5}>
                      <Autocomplete size="small" options={allPersons}
                        getOptionLabel={p => (typeof p === 'string' ? p : p.fullName || '')}
                        groupBy={p => (typeof p === 'string' ? '' : p.group)}
                        getOptionDisabled={p => typeof p !== 'string' && !!p.occupiedCommittee}
                        renderOption={(props, option) => {
                          const { key, ...rest } = props;
                          return (
                            <li key={key} {...rest}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25 }}>
                                <span>{option.fullName}</span>
                                {option.occupiedCommittee && (
                                  <Typography variant="caption" color="text.secondary">
                                    Đang ở: {option.occupiedCommittee}
                                  </Typography>
                                )}
                              </Box>
                            </li>
                          );
                        }}
                        value={allPersons.find(p => p.fullName === m.fullName) || null}
                        onChange={(_, sel) => {
                          if (!sel) return;
                          const name = typeof sel === 'string' ? sel : sel.fullName;
                          const uid = typeof sel === 'string' ? null : (sel.userId || null);
                          const duplicate = form.members.some((mm, i) => i !== idx && mm.fullName.trim() === name.trim());
                          if (duplicate) { toast.warning('Thành viên này đã được thêm.'); return; }
                          setForm(prev => {
                            const members = [...prev.members];
                            members[idx] = { ...members[idx], fullName: name, userId: uid };
                            return { ...prev, members };
                          });
                        }}
                        inputValue={m.fullName}
                        onInputChange={(_, val, reason) => reason === 'input' && handleMemberChange(idx, 'fullName', val)}
                        freeSolo
                        renderInput={params => <TextField {...params} label="Họ và tên" placeholder="Chọn hoặc nhập" />}
                      />
                      <FormControl size="small" fullWidth>
                        <InputLabel>Chức vụ</InputLabel>
                        <Select label="Chức vụ" value={m.position} onChange={e => handleMemberChange(idx, 'position', e.target.value)}>
                          <MenuItem value=""><em>— Không có —</em></MenuItem>
                          <MenuItem value="Trưởng ban">Trưởng ban</MenuItem>
                          <MenuItem value="Phó trưởng ban">Phó trưởng ban</MenuItem>
                          <MenuItem value="Thành viên - Thư ký">Thành viên - Thư ký</MenuItem>
                          <MenuItem value="Ủy viên">Ủy viên</MenuItem>
                          <MenuItem value="Thành viên">Thành viên</MenuItem>
                        </Select>
                      </FormControl>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <FormControl size="small" sx={{ flex: 1 }}>
                          <InputLabel>Nhiệm vụ phân công</InputLabel>
                          <Select label="Nhiệm vụ phân công" value={m.role} onChange={e => handleMemberChange(idx, 'role', e.target.value)}>
                            <MenuItem value="Trưởng ban">Trưởng ban</MenuItem>
                            <MenuItem value="Phó trưởng ban">Phó trưởng ban</MenuItem>
                            <MenuItem value="Thành viên - Thư ký">Thành viên - Thư ký</MenuItem>
                            <MenuItem value="Ủy viên">Ủy viên</MenuItem>
                            <MenuItem value="Thành viên">Thành viên</MenuItem>
                          </Select>
                        </FormControl>
                        <IconButton size="small" color="error" onClick={() => handleRemoveMember(idx)} disabled={form.members.length <= 1}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <TextField size="small" fullWidth label="Ghi chú" placeholder="Ghi chú..."
                        value={m.notes} onChange={e => handleMemberChange(idx, 'notes', e.target.value)}
                        inputProps={{ maxLength: 200 }} />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Box sx={{ overflowX: 'auto', mb: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f3f4f6' }}>
                      <TableCell>Họ và tên</TableCell>
                      <TableCell sx={{ width: 180 }}>Chức vụ</TableCell>
                      <TableCell sx={{ width: 190 }}>Nhiệm vụ phân công</TableCell>
                      <TableCell sx={{ width: 200 }}>Ghi chú</TableCell>
                      <TableCell sx={{ width: 56 }} align="center" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {form.members.map((m, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Autocomplete size="small" options={allPersons}
                            getOptionLabel={p => (typeof p === 'string' ? p : p.fullName || '')}
                            groupBy={p => (typeof p === 'string' ? '' : p.group)}
                            getOptionDisabled={p => typeof p !== 'string' && !!p.occupiedCommittee}
                            renderOption={(props, option) => {
                              const { key, ...rest } = props;
                              return (
                                <li key={key} {...rest}>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25 }}>
                                    <span>{option.fullName}</span>
                                    {option.occupiedCommittee && (
                                      <Typography variant="caption" color="text.secondary">
                                        Đang ở: {option.occupiedCommittee}
                                      </Typography>
                                    )}
                                  </Box>
                                </li>
                              );
                            }}
                            value={allPersons.find(p => p.fullName === m.fullName) || null}
                            onChange={(_, sel) => {
                              if (!sel) return;
                              const name = typeof sel === 'string' ? sel : sel.fullName;
                              const uid = typeof sel === 'string' ? null : (sel.userId || null);
                              const duplicate = form.members.some((mm, i) => i !== idx && mm.fullName.trim() === name.trim());
                              if (duplicate) { toast.warning('Thành viên này đã được thêm.'); return; }
                              setForm(prev => {
                                const members = [...prev.members];
                                members[idx] = { ...members[idx], fullName: name, userId: uid };
                                return { ...prev, members };
                              });
                            }}
                            inputValue={m.fullName}
                            onInputChange={(_, val, reason) => reason === 'input' && handleMemberChange(idx, 'fullName', val)}
                            freeSolo
                            renderInput={params => <TextField {...params} placeholder="Chọn hoặc nhập họ tên" />}
                            sx={{ minWidth: 180 }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" fullWidth>
                            <Select value={m.position} onChange={e => handleMemberChange(idx, 'position', e.target.value)} displayEmpty>
                              <MenuItem value=""><em style={{ color: '#9ca3af' }}>— Không có —</em></MenuItem>
                              <MenuItem value="Trưởng ban">Trưởng ban</MenuItem>
                              <MenuItem value="Phó trưởng ban">Phó trưởng ban</MenuItem>
                              <MenuItem value="Thành viên - Thư ký">Thành viên - Thư ký</MenuItem>
                              <MenuItem value="Ủy viên">Ủy viên</MenuItem>
                              <MenuItem value="Thành viên">Thành viên</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" fullWidth>
                            <Select value={m.role} onChange={e => handleMemberChange(idx, 'role', e.target.value)}>
                              <MenuItem value="Trưởng ban">Trưởng ban</MenuItem>
                              <MenuItem value="Phó trưởng ban">Phó trưởng ban</MenuItem>
                              <MenuItem value="Thành viên - Thư ký">Thành viên - Thư ký</MenuItem>
                              <MenuItem value="Ủy viên">Ủy viên</MenuItem>
                              <MenuItem value="Thành viên">Thành viên</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField size="small" fullWidth placeholder="Ghi chú..."
                            value={m.notes} onChange={e => handleMemberChange(idx, 'notes', e.target.value)}
                            inputProps={{ maxLength: 200 }} />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" color="error" onClick={() => handleRemoveMember(idx)} disabled={form.members.length <= 1}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

            <Button size="small" onClick={handleAddMember} sx={{ mb: 1, textTransform: 'none' }}>+ Thêm thành viên</Button>
            {errors.members && <Typography variant="caption" color="error" display="block" mb={1}>{errors.members}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyCommittee()); setErrors({}); }} disabled={saving}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ textTransform: 'none' }}>
            {saving ? 'Đang lưu...' : 'Lưu Ban Kiểm Kê'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tabs */}
      <Tabs
        value={committeeTab}
        onChange={(_, v) => { setCommitteeTab(v); setShowForm(false); setEditId(null); setForm(emptyCommittee()); }}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={`Đang hoạt động (${activeCommittees.length})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab label={`Lịch sử (${endedCommittees.length})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
      </Tabs>

      {/* Tab 0 — Đang hoạt động */}
      {committeeTab === 0 && (
        loading ? (
          <Stack alignItems="center" py={4}><CircularProgress size={28} /></Stack>
        ) : activeCommittees.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>Chưa có ban kiểm kê nào đang hoạt động.</Typography>
        ) : isMobile ? (
          <Stack spacing={1.5}>
            {activeCommittees.map(c => {
              const cMCnt = (minutesByCommittee[String(c._id)] || []).length;
              const isExp = expandedIds.has(String(c._id));
              return (
                <Paper key={c._id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography fontWeight={600}>{c.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{formatDate(c.foundedDate)} · {c.decisionNumber}</Typography>
                  <Typography variant="body2">Trưởng ban: {getChairman(c)}</Typography>
                  <Stack direction="row" spacing={1} mt={1.5} alignItems="center" flexWrap="wrap">
                    <Button size="small" variant="contained" color="info" sx={{ textTransform: 'none' }} onClick={() => setViewCommittee(c)}>Xem</Button>
                    <IconButton size="small" onClick={() => handleEdit(c)}><EditIcon fontSize="small" /></IconButton>
                    <Button size="small" variant="outlined" color="warning" sx={{ textTransform: 'none' }} onClick={() => setEndTarget(c._id)}>Kết thúc</Button>
                    <Tooltip title="Biên bản kiểm kê">
                      <Button size="small" variant={isExp ? 'contained' : 'outlined'} color="secondary"
                        startIcon={<ArticleIcon fontSize="small" />}
                        endIcon={isExp ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        onClick={() => toggleExpand(String(c._id))} sx={{ textTransform: 'none', minWidth: 'auto' }}>
                        {cMCnt > 0 ? `(${cMCnt})` : ''}
                      </Button>
                    </Tooltip>
                  </Stack>
                  {isExp && <Box mt={1.5}>{renderMinutesPanel(c)}</Box>}
                </Paper>
              );
            })}
          </Stack>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f3f4f6' }}>
                  <TableCell>Tên ban</TableCell>
                  <TableCell>Ngày thành lập</TableCell>
                  <TableCell>Số quyết định</TableCell>
                  <TableCell>Trưởng ban</TableCell>
                  <TableCell>Số thành viên</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeCommittees.map(c => {
                  const cMCnt = (minutesByCommittee[String(c._id)] || []).length;
                  const isExp = expandedIds.has(String(c._id));
                  return (
                    <Fragment key={c._id}>
                      <TableRow hover>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{formatDate(c.foundedDate)}</TableCell>
                        <TableCell>{c.decisionNumber}</TableCell>
                        <TableCell>{getChairman(c)}</TableCell>
                        <TableCell>{c.members?.length || 0} người</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" flexWrap="wrap">
                            <Button size="small" variant="contained" color="info" sx={{ textTransform: 'none' }} onClick={() => setViewCommittee(c)}>Xem</Button>
                            <IconButton size="small" onClick={() => handleEdit(c)}><EditIcon fontSize="small" /></IconButton>
                            <Button size="small" variant="outlined" color="warning" sx={{ textTransform: 'none' }} onClick={() => setEndTarget(c._id)}>Kết thúc</Button>
                            <Tooltip title="Biên bản kiểm kê">
                              <Button size="small" variant={isExp ? 'contained' : 'outlined'} color="secondary"
                                startIcon={<ArticleIcon fontSize="small" />}
                                endIcon={isExp ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                onClick={() => toggleExpand(String(c._id))} sx={{ textTransform: 'none', minWidth: 'auto' }}>
                                {cMCnt > 0 ? `(${cMCnt})` : ''}
                              </Button>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                      {isExp && (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ p: 0, bgcolor: '#f0f7ff', borderBottom: '2px solid #93c5fd' }}>
                            <Box sx={{ p: 1.5 }}>
                              <Typography variant="body2" fontWeight={600} mb={1} color="primary.main">
                                Biên bản — {c.name}
                              </Typography>
                              {renderMinutesPanel(c)}
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )
      )}

      {/* Tab 1 — Lịch sử */}
      {committeeTab === 1 && (
        <Box>
          {/* Year filter */}
          <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
            <Typography variant="body2" fontWeight={600} color="text.secondary">Lọc theo năm:</Typography>
            <Select size="small" value={historyYear} onChange={e => setHistoryYear(e.target.value)} sx={{ minWidth: 120 }}>
              <MenuItem value="all">Tất cả</MenuItem>
              {historyYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
            {historyYear !== 'all' && (
              <Button size="small" onClick={() => setHistoryYear('all')} sx={{ textTransform: 'none' }}>Xóa lọc</Button>
            )}
          </Stack>

          {loading ? (
            <Stack alignItems="center" py={4}><CircularProgress size={28} /></Stack>
          ) : filteredHistory.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              {historyYear === 'all' ? 'Chưa có ban kiểm kê nào đã kết thúc.' : `Không có ban kiểm kê kết thúc năm ${historyYear}.`}
            </Typography>
          ) : isMobile ? (
            <Stack spacing={1.5}>
              {filteredHistory.map(c => {
                const cMCnt = (minutesByCommittee[String(c._id)] || []).length;
                const isExp = expandedIds.has(String(c._id));
                return (
                  <Paper key={c._id} variant="outlined" sx={{ p: 2, borderRadius: 2, opacity: 0.85 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography fontWeight={600}>{c.name}</Typography>
                      <Chip label="Đã kết thúc" size="small" color="default" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{formatDate(c.foundedDate)} · {c.decisionNumber}</Typography>
                    <Typography variant="body2">Trưởng ban: {getChairman(c)}</Typography>
                    {c.endedAt && <Typography variant="body2" color="error.light">Kết thúc: {formatDate(c.endedAt)}</Typography>}
                    <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap">
                      <Button size="small" variant="outlined" color="info" sx={{ textTransform: 'none' }} onClick={() => setViewCommittee(c)}>Xem chi tiết</Button>
                      <Tooltip title="Biên bản kiểm kê">
                        <Button size="small" variant={isExp ? 'contained' : 'outlined'} color="secondary"
                          startIcon={<ArticleIcon fontSize="small" />}
                          endIcon={isExp ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          onClick={() => toggleExpand(String(c._id))} sx={{ textTransform: 'none', minWidth: 'auto' }}>
                          {cMCnt > 0 ? `(${cMCnt})` : ''}
                        </Button>
                      </Tooltip>
                    </Stack>
                    {isExp && <Box mt={1.5}>{renderMinutesPanel(c)}</Box>}
                  </Paper>
                );
              })}
            </Stack>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f3f4f6' }}>
                    <TableCell>Tên ban</TableCell>
                    <TableCell>Ngày thành lập</TableCell>
                    <TableCell>Số quyết định</TableCell>
                    <TableCell>Trưởng ban</TableCell>
                    <TableCell>Số thành viên</TableCell>
                    <TableCell>Ngày kết thúc</TableCell>
                    <TableCell align="center">Chi tiết</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHistory.map(c => {
                    const cMCnt = (minutesByCommittee[String(c._id)] || []).length;
                    const isExp = expandedIds.has(String(c._id));
                    return (
                      <Fragment key={c._id}>
                        <TableRow hover sx={{ opacity: 0.85 }}>
                          <TableCell>{c.name}</TableCell>
                          <TableCell>{formatDate(c.foundedDate)}</TableCell>
                          <TableCell>{c.decisionNumber}</TableCell>
                          <TableCell>{getChairman(c)}</TableCell>
                          <TableCell>{c.members?.length || 0} người</TableCell>
                          <TableCell>{c.endedAt ? formatDate(c.endedAt) : '—'}</TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Button size="small" variant="outlined" color="info" sx={{ textTransform: 'none' }} onClick={() => setViewCommittee(c)}>Xem</Button>
                              <Tooltip title="Biên bản kiểm kê">
                                <Button size="small" variant={isExp ? 'contained' : 'outlined'} color="secondary"
                                  startIcon={<ArticleIcon fontSize="small" />}
                                  endIcon={isExp ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                  onClick={() => toggleExpand(String(c._id))} sx={{ textTransform: 'none', minWidth: 'auto' }}>
                                  {cMCnt > 0 ? `(${cMCnt})` : ''}
                                </Button>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                        {isExp && (
                          <TableRow>
                            <TableCell colSpan={7} sx={{ p: 0, bgcolor: '#f0f7ff', borderBottom: '2px solid #93c5fd' }}>
                              <Box sx={{ p: 1.5 }}>
                                <Typography variant="body2" fontWeight={600} mb={1} color="primary.main">
                                  Biên bản — {c.name}
                                </Typography>
                                {renderMinutesPanel(c)}
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewCommittee} onClose={() => setViewCommittee(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết Ban Kiểm Kê</DialogTitle>
        <DialogContent>
          {viewCommittee && (
            <Stack spacing={1.5} pt={1}>
              <Typography><strong>Tên ban:</strong> {viewCommittee.name}</Typography>
              <Typography><strong>Ngày thành lập:</strong> {formatDate(viewCommittee.foundedDate)}</Typography>
              <Typography><strong>Số quyết định:</strong> {viewCommittee.decisionNumber}</Typography>
              <Divider />
              <Typography variant="body2" fontWeight={600}>Thành viên:</Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f3f4f6' }}>
                      <TableCell>TT</TableCell>
                      <TableCell>Họ và tên</TableCell>
                      <TableCell>Chức vụ</TableCell>
                      <TableCell>Nhiệm vụ phân công</TableCell>
                      <TableCell>Ghi chú</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewCommittee.members?.map((m, i) => (
                      <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{m.fullName}</TableCell>
                        <TableCell>{m.position || '—'}</TableCell>
                        <TableCell>{m.role}</TableCell>
                        <TableCell>{m.notes || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setViewCommittee(null)}>Đóng</Button>
          {viewCommittee?.status !== 'ended' && (
            <Button variant="outlined" onClick={() => { setViewCommittee(null); handleEdit(viewCommittee); }}>Chỉnh sửa</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirm End */}
      <ConfirmDialog
        open={!!endTarget}
        title="Kết thúc ban kiểm kê"
        message="Bạn có chắc chắn muốn kết thúc ban kiểm kê này? Ban sẽ không thể chỉnh sửa sau khi kết thúc."
        onConfirm={handleConfirmEnd}
        onCancel={() => setEndTarget(null)}
        loading={ending}
        confirmText="Kết thúc"
        loadingText="Đang kết thúc..."
      />

      {/* ── Minutes View Dialog ── */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { maxHeight: isMobile ? '100%' : '95vh' } }}>
        <DialogTitle sx={{ pb: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <span>Biên bản kiểm kê</span>
            {editingMinutes && (
              <Chip label={STATUS_LABEL[editingMinutes.status]?.label || '—'} color={STATUS_LABEL[editingMinutes.status]?.color || 'default'} size="small" />
            )}
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {editingMinutes?.status === 'rejected' && editingMinutes?.rejectReason && (
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: '#fef2f2', borderColor: 'error.light' }}>
              <Typography variant="body2" fontWeight={600} color="error.dark" mb={0.5}>Lý do từ chối:</Typography>
              <Typography variant="body2" color="error.dark">{editingMinutes.rejectReason}</Typography>
            </Paper>
          )}
          <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 2, bgcolor: '#f9fafb' }}>
            <Typography variant="body2" fontWeight={600} mb={1.5} color="text.secondary">Thông tin biên bản</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} flexWrap="wrap">
              <TextField label="Lớp" size="small" value={minutesForm.className || '—'} disabled sx={{ flex: 1, minWidth: { xs: '100%', sm: 150 } }} />
              <TextField label="Địa điểm" size="small" value={minutesForm.location} disabled sx={{ minWidth: { xs: '100%', sm: 130 } }} />
              <TextField label="Ngày kiểm kê" type="date" size="small" InputLabelProps={{ shrink: true }} value={minutesForm.inspectionDate} disabled sx={{ minWidth: { xs: '100%', sm: 155 } }} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} flexWrap="wrap">
              <TextField label="Giờ bắt đầu" size="small" value={minutesForm.inspectionTime} disabled sx={{ minWidth: { xs: '100%', sm: 155 } }} />
              <TextField label="Giờ kết thúc" size="small" value={minutesForm.endTime} disabled sx={{ minWidth: { xs: '100%', sm: 175 } }} />
              <TextField label="Ban kiểm kê" size="small" disabled value={committees.find(c => c._id === minutesForm.committeeId)?.name || '—'} sx={{ flex: 1, minWidth: { xs: '100%', sm: 190 } }} />
            </Stack>
            <TextField label="II. Lí do kiểm kê" size="small" fullWidth multiline rows={2} value={minutesForm.reason} disabled sx={{ mb: 2 }} />
            <TextField label="IV. Hình thức kiểm kê" size="small" fullWidth multiline rows={2} value={minutesForm.inspectionMethod} disabled />
          </Paper>

          <Box sx={{ fontFamily: 'Times New Roman, serif', fontSize: { xs: 12, sm: 14 }, color: '#000', p: { xs: 0, sm: 1 } }}>
            <Typography sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 }, textAlign: 'center', fontFamily: 'inherit' }}>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</Typography>
            <Typography sx={{ fontSize: { xs: 11, sm: 13 }, textAlign: 'center', textDecoration: 'underline', fontFamily: 'inherit', mb: 0.5 }}>Độc lập - Tự do - Hạnh phúc</Typography>
            <Typography sx={{ textAlign: 'center', fontWeight: 700, fontSize: { xs: 13, sm: 15 }, textTransform: 'uppercase', mb: 0.5, fontFamily: 'inherit' }}>
              BIÊN BẢN KIỂM KÊ TÀI SẢN {[minutesForm.className, minutesForm.scope].filter(Boolean).map(s => s.toUpperCase()).join(' - ')}
            </Typography>
            <Typography sx={{ textAlign: 'center', fontStyle: 'italic', mb: 2, fontFamily: 'inherit', fontSize: { xs: 11, sm: 13 } }}>
              {minutesForm.location}, ngày {mDayStr} tháng {mMonthStr} năm {mYearStr}
            </Typography>
            <Typography sx={{ fontWeight: 700, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>I/ Thành phần Ban kiểm kê:</Typography>
            {mSelectedCommittee?.members?.length ? (
              mSelectedCommittee.members.map((m, i) => (
                <Typography key={i} sx={{ ml: 2, fontFamily: 'inherit', fontSize: 'inherit' }}>
                  {i + 1}. {m.fullName}{m.role !== 'Thành viên' ? ` - ${m.role}` : ''}
                </Typography>
              ))
            ) : (
              <Typography sx={{ ml: 2, fontStyle: 'italic', color: '#888', fontSize: 'inherit', fontFamily: 'inherit' }}>(Chưa có thành viên)</Typography>
            )}
            <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>II/ Lí do kiểm kê:</Typography>
            <Typography sx={{ ml: 2, fontFamily: 'inherit', fontSize: 'inherit' }}>- {minutesForm.reason || '...'}</Typography>
            <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>III/ Thời gian kiểm kê:</Typography>
            <Typography sx={{ ml: 2, fontFamily: 'inherit', fontSize: 'inherit' }}>
              - Vào hồi {minutesForm.inspectionTime || '___'} ngày {mDayStr} tháng {mMonthStr} năm {mYearStr}
            </Typography>
            <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>IV/ Hình thức kiểm kê:</Typography>
            {(minutesForm.inspectionMethod || '').split('\n').map((line, i) => (
              <Typography key={i} sx={{ ml: 2, fontFamily: 'inherit', fontSize: 'inherit' }}>- {line}</Typography>
            ))}
            <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>V/ Nội dung kiểm kê:</Typography>
            <Typography sx={{ fontWeight: 700, textAlign: 'center', mb: 1, fontFamily: 'inherit', fontSize: 'inherit' }}>KIỂM KÊ TÀI SẢN CÓ TRONG LỚP HỌC:</Typography>
            <Box sx={{ overflowX: 'auto', mb: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr>
                    <th style={{ ...mHeaderCell, width: 32 }}>TT</th>
                    <th style={mHeaderCell}>TÊN THIẾT BỊ</th>
                    <th style={{ ...mHeaderCell, width: 46 }}>ĐVT</th>
                    <th style={{ ...mHeaderCell, width: 46 }}>SL</th>
                    <th style={{ ...mHeaderCell, width: 110 }}>ĐỐI TƯỢNG SỬ DỤNG</th>
                    <th style={{ ...mHeaderCell, width: 90 }}>GHI CHÚ</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const groups = [];
                    minutesForm.assets.forEach(row => {
                      const cat = row.category || '';
                      const last = groups[groups.length - 1];
                      if (last && last.category === cat) last.rows.push(row);
                      else groups.push({ category: cat, rows: [row] });
                    });
                    let counter = 0;
                    return groups.map((g, gi) => (
                      <Fragment key={gi}>
                        {g.category && (
                          <tr>
                            <td colSpan={6} style={{ ...mCellBorder, fontWeight: 700, textAlign: 'center', background: '#f0f0f0' }}>{g.category}</td>
                          </tr>
                        )}
                        {g.rows.map(row => {
                          counter++;
                          const n = counter;
                          return (
                            <tr key={n}>
                              <td style={{ ...mCellBorder, textAlign: 'center' }}>{n}</td>
                              <td style={mCellBorder}>{row.name}</td>
                              <td style={{ ...mCellBorder, textAlign: 'center' }}>{row.unit}</td>
                              <td style={{ ...mCellBorder, textAlign: 'center' }}>{row.quantity}</td>
                              <td style={{ ...mCellBorder, textAlign: 'center' }}>{row.targetUser}</td>
                              <td style={mCellBorder}>{row.notes}</td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    ));
                  })()}
                </tbody>
              </table>
            </Box>
            {minutesForm.extraAssets?.length > 0 && (
              <>
                <Typography sx={{ fontWeight: 700, textAlign: 'center', mt: 2, mb: 1, fontFamily: 'inherit', fontSize: 'inherit' }}>
                  CÁC THIẾT BỊ TÀI SẢN KHÁC NGOÀI THÔNG TƯ
                </Typography>
                <Box sx={{ overflowX: 'auto', mb: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                    <thead>
                      <tr>
                        <th style={{ ...mHeaderCell, width: 32 }}>TT</th>
                        <th style={mHeaderCell}>TÊN THIẾT BỊ</th>
                        <th style={{ ...mHeaderCell, width: 46 }}>ĐVT</th>
                        <th style={{ ...mHeaderCell, width: 46 }}>SL</th>
                        <th style={{ ...mHeaderCell, width: 110 }}>ĐỐI TƯỢNG SỬ DỤNG</th>
                        <th style={{ ...mHeaderCell, width: 90 }}>GHI CHÚ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const groups = [];
                        minutesForm.extraAssets.forEach(row => {
                          const cat = row.category || '';
                          const last = groups[groups.length - 1];
                          if (last && last.category === cat) last.rows.push(row);
                          else groups.push({ category: cat, rows: [row] });
                        });
                        let counter = 0;
                        return groups.map((g, gi) => (
                          <Fragment key={gi}>
                            {g.category && (
                              <tr>
                                <td colSpan={6} style={{ ...mCellBorder, fontWeight: 700, textAlign: 'center', background: '#f0f0f0' }}>{g.category}</td>
                              </tr>
                            )}
                            {g.rows.map(row => {
                              counter++;
                              const n = counter;
                              return (
                                <tr key={n}>
                                  <td style={{ ...mCellBorder, textAlign: 'center' }}>{n}</td>
                                  <td style={mCellBorder}>{row.name}</td>
                                  <td style={{ ...mCellBorder, textAlign: 'center' }}>{row.unit}</td>
                                  <td style={{ ...mCellBorder, textAlign: 'center' }}>{row.quantity}</td>
                                  <td style={{ ...mCellBorder, textAlign: 'center' }}>{row.targetUser}</td>
                                  <td style={mCellBorder}>{row.notes}</td>
                                </tr>
                              );
                            })}
                          </Fragment>
                        ));
                      })()}
                    </tbody>
                  </table>
                </Box>
              </>
            )}
            <Typography sx={{ fontFamily: 'inherit', fontSize: { xs: 11, sm: 13 }, mb: 2 }}>
              Kiểm kê kết thúc vào lúc {minutesForm.endTime || '___'} ngày {mDayStr} tháng {mMonthStr} năm {mYearStr}.
              {' '}Biên bản này được sao thành 2 bản, giáo viên chủ nhiệm lớp giữ một bản và Ban kiểm kê giữ một bản.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} textAlign="center">
              {[
                { title: 'XÁC NHẬN CỦA NHÀ TRƯỜNG', sub: 'Phó Hiệu Trưởng', name: mSelectedCommittee?.members?.find(m => m.role === 'Trưởng ban')?.fullName },
                { title: 'GIÁO VIÊN CHỦ NHIỆM', sub: '', name: '' },
                { title: 'NGƯỜI GHI BIÊN BẢN', sub: '', name: mSelectedCommittee?.members?.find(m => m.role === 'Phó ban')?.fullName },
              ].map((col, i) => (
                <Box key={i} sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontFamily: 'inherit', fontSize: { xs: 11, sm: 13 } }}>{col.title}</Typography>
                  {col.sub && <Typography sx={{ fontStyle: 'italic', fontFamily: 'inherit', fontSize: 12 }}>{col.sub}</Typography>}
                  <Typography sx={{ mt: { xs: 2, sm: 5 }, fontWeight: 700, fontFamily: 'inherit', fontSize: { xs: 11, sm: 13 } }}>
                    {col.name || '\u00A0'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 1.5, sm: 3 }, pb: 2, gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => setOpenModal(false)} disabled={savingMinutes}>Đóng</Button>
          {editingMinutes && (
            <Button variant="outlined" color="primary" startIcon={<FileDownloadIcon />} onClick={() => downloadWord(editingMinutes)} sx={{ textTransform: 'none' }}>
              Tải về Word
            </Button>
          )}
          {editingMinutes?.status === 'pending' && (
            <>
              <Button variant="contained" color="success" onClick={handleMinutesApprove} disabled={savingMinutes} sx={{ textTransform: 'none' }}>
                {savingMinutes ? '...' : 'Duyệt'}
              </Button>
              <Button variant="contained" color="error" onClick={() => { setRejectReason(''); setRejectDialog(true); }} disabled={savingMinutes} sx={{ textTransform: 'none' }}>
                Từ chối
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Lý do từ chối</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField autoFocus fullWidth multiline rows={3} size="small" label="Lý do từ chối *"
            placeholder="Nhập lý do từ chối biên bản này..." value={rejectReason}
            onChange={e => setRejectReason(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setRejectDialog(false)} disabled={savingMinutes}>Hủy</Button>
          <Button variant="contained" color="error" disabled={savingMinutes || !rejectReason.trim()} onClick={handleMinutesReject}>
            {savingMinutes ? 'Đang xử lý...' : 'Xác nhận từ chối'}
          </Button>
        </DialogActions>
      </Dialog>

      <AddCategoryDialog open={categoryDialog} onClose={() => setCategoryDialog(false)} onConfirm={name => { setCategoryDialog(false); }} />

      <ConfirmDialog
        open={!!deleteMinutesTarget}
        title="Xóa biên bản kiểm kê"
        message="Bạn có chắc chắn muốn xóa biên bản này không?"
        onConfirm={handleMinutesDeleteConfirm}
        onCancel={() => setDeleteMinutesTarget(null)}
        loading={deletingMinutes}
      />
    </Box>
  );
}

// ─── Minutes Tab ──────────────────────────────────────────────────────────────
export function MinutesTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(true);
  const [minutesList, setMinutesList] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingMinutes, setEditingMinutes] = useState(null);
  const [form, setForm] = useState(emptyMinutes());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        get(ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES),
        get(ENDPOINTS.SCHOOL_ADMIN.ASSET_COMMITTEES),
      ]);
      setMinutesList(mRes?.data?.minutes || []);
      setCommittees(cRes?.data?.committees || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được dữ liệu.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleOpenView = m => {
    setEditingMinutes(m);
    setForm({
      className: m.className || '',
      location: m.location || 'Đức Xuân',
      inspectionDate: m.inspectionDate ? new Date(m.inspectionDate).toISOString().slice(0, 10) : '',
      inspectionTime: m.inspectionTime || '',
      endTime: m.endTime || '',
      reason: m.reason || '',
      inspectionMethod: m.inspectionMethod || '',
      committeeId: m.committeeId?._id || m.committeeId || '',
      assets: m.assets?.length ? m.assets.map(a => ({ ...a })) : [emptyAssetRow()],
      extraAssets: m.extraAssets?.length ? m.extraAssets.map(a => ({ ...a })) : [],
      conclusion: m.conclusion || '',
    });
    setOpenModal(true);
  };

  const handleAssetChange = (idx, field, value) =>
    setForm(prev => {
      const assets = [...prev.assets];
      assets[idx] = { ...assets[idx], [field]: field === 'quantity' ? Number(value) : value };
      return { ...prev, assets };
    });

  const handleAddRow = () => setForm(prev => ({ ...prev, assets: [...prev.assets, emptyAssetRow()] }));
  const handleRemoveRow = idx => setForm(prev => ({ ...prev, assets: prev.assets.filter((_, i) => i !== idx) }));
  const handleAddCategory = name => setForm(prev => ({ ...prev, assets: [...prev.assets, { ...emptyAssetRow(), category: name }] }));

  const handleSave = async () => {
    if (!form.inspectionDate) { toast.error('Vui lòng chọn ngày kiểm kê.'); return; }
    setSaving(true);
    try {
      if (editingMinutes?._id) {
        await put(ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES_DETAIL(editingMinutes._id), form);
        toast.success('Cập nhật biên bản thành công.');
      } else {
        await post(ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES, form);
        toast.success('Tạo biên bản thành công.');
      }
      setOpenModal(false); load();
    } catch (err) { toast.error(err?.message || 'Lưu thất bại.'); }
    finally { setSaving(false); }
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      await patch(ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES_APPROVE(editingMinutes._id), {});
      toast.success('Đã duyệt biên bản.');
      setOpenModal(false); load();
    } catch (err) { toast.error(err?.message || 'Duyệt thất bại.'); }
    finally { setSaving(false); }
  };

  const handleReject = async () => {
    setSaving(true);
    try {
      await patch(ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES_REJECT(editingMinutes._id), { rejectReason });
      toast.success('Đã từ chối biên bản.');
      setRejectDialog(false);
      setRejectReason('');
      setOpenModal(false);
      load();
    } catch (err) { toast.error(err?.message || 'Thất bại.'); }
    finally { setSaving(false); }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await del(ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES_DETAIL(deleteTarget));
      toast.success('Đã xóa biên bản.');
      setDeleteTarget(null); load();
    } catch (err) { toast.error(err?.message || 'Xóa thất bại.'); }
    finally { setDeleting(false); }
  };

  const downloadWord = async (m) => {
    try {
      const { getToken } = await import('../../service/api');
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}${ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES_EXPORT_WORD(m._id)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) { toast.error('Không xuất được file Word.'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bien_ban_kiem_ke_${m.minutesNumber || m._id}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Lỗi xuất Word.');
    }
  };

  const isApproved = editingMinutes?.status === 'approved';
  const isReadOnly = true; // BGH chỉ xem, không chỉnh sửa
  const parsedDate = form.inspectionDate ? new Date(form.inspectionDate) : null;
  const dayStr = parsedDate ? parsedDate.getDate() : '___';
  const monthStr = parsedDate ? parsedDate.getMonth() + 1 : '___';
  const yearStr = parsedDate ? parsedDate.getFullYear() : '______';
  const selectedCommittee = committees.find(c => c._id === form.committeeId) || null;

  const cellBorder = { border: '1px solid #555', padding: '4px 6px', fontSize: 13 };
  const headerCell = { ...cellBorder, fontWeight: 700, textAlign: 'center', background: '#f3f4f6' };

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} mb={2} gap={1}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Biên Bản Kiểm Kê Tài Sản</Typography>
          <Typography variant="body2" color="text.secondary">Giáo viên tạo biên bản — Ban Giám Hiệu xem và duyệt</Typography>
        </Box>
      </Stack>

      {/* List */}
      {loading ? (
        <Stack alignItems="center" py={4}><CircularProgress size={28} /></Stack>
      ) : minutesList.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={4}>Chưa có biên bản kiểm kê nào.</Typography>
      ) : isMobile ? (
        <Stack spacing={1.5}>
          {minutesList.map(m => {
            const s = STATUS_LABEL[m.status] || STATUS_LABEL.pending;
            return (
              <Paper key={m._id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography fontWeight={600}>{m.minutesNumber || '—'}</Typography>
                    <Typography variant="body2" color="text.secondary">{formatDate(m.createdAt)} · {[m.className, m.scope].filter(Boolean).join(' - ') || '—'}</Typography>
                    <Typography variant="body2">{m.createdBy?.fullName || '—'}</Typography>
                  </Box>
                  <Chip label={s.label} color={s.color} size="small" />
                </Stack>
                <Stack direction="row" spacing={1} mt={1.5}>
                  <Button size="small" variant="contained" color="info" sx={{ textTransform: 'none', flex: 1 }} onClick={() => handleOpenView(m)}>Xem</Button>
                  <Tooltip title="Tải về Word (.docx)">
                    <IconButton size="small" color="primary" onClick={() => downloadWord(m)}>
                      <FileDownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f3f4f6' }}>
                <TableCell>Số biên bản</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Lớp/Phạm vi</TableCell>
                <TableCell>Người tạo</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {minutesList.map(m => {
                const s = STATUS_LABEL[m.status] || STATUS_LABEL.pending;
                return (
                  <TableRow key={m._id} hover>
                    <TableCell>{m.minutesNumber || '—'}</TableCell>
                    <TableCell>{formatDate(m.createdAt)}</TableCell>
                    <TableCell>{[m.className, m.scope].filter(Boolean).join(' - ') || '—'}</TableCell>
                    <TableCell>{m.createdBy?.fullName || m.createdBy?.username || '—'}</TableCell>
                    <TableCell><Chip label={s.label} color={s.color} size="small" /></TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Button size="small" variant="contained" color="info" sx={{ textTransform: 'none' }} onClick={() => handleOpenView(m)}>Xem</Button>
                        <Tooltip title="Tải về Word (.docx)">
                          <IconButton size="small" color="primary" onClick={() => downloadWord(m)}>
                            <FileDownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* ── Official Document Modal ── */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { maxHeight: isMobile ? '100%' : '95vh' } }}>
        <DialogTitle sx={{ pb: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <span>{editingMinutes ? 'Biên bản kiểm kê' : 'Tạo biên bản kiểm kê'}</span>
            {editingMinutes && (
              <Chip label={STATUS_LABEL[editingMinutes.status]?.label || '—'} color={STATUS_LABEL[editingMinutes.status]?.color || 'default'} size="small" />
            )}
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {editingMinutes?.status === 'rejected' && editingMinutes?.rejectReason && (
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: '#fef2f2', borderColor: 'error.light' }}>
              <Typography variant="body2" fontWeight={600} color="error.dark" mb={0.5}>Lý do từ chối:</Typography>
              <Typography variant="body2" color="error.dark">{editingMinutes.rejectReason}</Typography>
            </Paper>
          )}
          {/* Phần thông tin — BGH chỉ xem */}
          <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 2, bgcolor: '#f9fafb' }}>
            <Typography variant="body2" fontWeight={600} mb={1.5} color="text.secondary">Thông tin biên bản</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} flexWrap="wrap">
              <TextField label="Lớp" size="small" value={form.className || '—'} disabled
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 150 } }}
                InputProps={{ sx: { fontWeight: form.className ? 600 : 400 } }} />
              <TextField label="Địa điểm" size="small" value={form.location} disabled
                sx={{ minWidth: { xs: '100%', sm: 130 } }} />
              <TextField label="Ngày kiểm kê" type="date" size="small" InputLabelProps={{ shrink: true }}
                value={form.inspectionDate} disabled sx={{ minWidth: { xs: '100%', sm: 155 } }} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} flexWrap="wrap">
              <TextField label="Giờ bắt đầu" size="small" value={form.inspectionTime} disabled
                sx={{ minWidth: { xs: '100%', sm: 155 } }} />
              <TextField label="Giờ kết thúc" size="small" value={form.endTime} disabled
                sx={{ minWidth: { xs: '100%', sm: 175 } }} />
              <TextField label="Ban kiểm kê" size="small" disabled
                value={committees.find(c => c._id === form.committeeId)?.name || '—'}
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 190 } }} />
            </Stack>
            <TextField label="II. Lí do kiểm kê" size="small" fullWidth multiline rows={2}
              value={form.reason} disabled sx={{ mb: 2 }} />
            <TextField label="IV. Hình thức kiểm kê" size="small" fullWidth multiline rows={2}
              value={form.inspectionMethod} disabled />
          </Paper>

          {/* Biên bản chính thức */}
          <Box sx={{ fontFamily: 'Times New Roman, serif', fontSize: { xs: 12, sm: 14 }, color: '#000', p: { xs: 0, sm: 1 } }}>
            {/* Header */}
            <Typography sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 }, textAlign: 'center', fontFamily: 'inherit' }}>
              CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </Typography>
            <Typography sx={{ fontSize: { xs: 11, sm: 13 }, textAlign: 'center', textDecoration: 'underline', fontFamily: 'inherit', mb: 0.5 }}>
              Độc lập - Tự do - Hạnh phúc
            </Typography>
            <Typography sx={{ textAlign: 'center', fontWeight: 700, fontSize: { xs: 13, sm: 15 }, textTransform: 'uppercase', mb: 0.5, fontFamily: 'inherit' }}>
              BIÊN BẢN KIỂM KÊ TÀI SẢN {[form.className, form.scope].filter(Boolean).map(s => s.toUpperCase()).join(' - ')}
            </Typography>
            <Typography sx={{ textAlign: 'center', fontStyle: 'italic', mb: 2, fontFamily: 'inherit', fontSize: { xs: 11, sm: 13 } }}>
              {form.location}, ngày {dayStr} tháng {monthStr} năm {yearStr}
            </Typography>

            {/* I */}
            <Typography sx={{ fontWeight: 700, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>I/ Thành phần Ban kiểm kê:</Typography>
            {selectedCommittee?.members?.length ? (
              selectedCommittee.members.map((m, i) => (
                <Typography key={i} sx={{ ml: 2, fontFamily: 'inherit', fontSize: 'inherit' }}>
                  {i + 1}. {m.fullName}{m.role !== 'Thành viên' ? ` - ${m.role}` : ''}
                </Typography>
              ))
            ) : (
              <Typography sx={{ ml: 2, fontStyle: 'italic', color: '#888', fontSize: 'inherit', fontFamily: 'inherit' }}>
                (Chọn Ban kiểm kê ở phần thông tin phía trên)
              </Typography>
            )}

            {/* II */}
            <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>II/ Lí do kiểm kê:</Typography>
            <Typography sx={{ ml: 2, fontFamily: 'inherit', fontSize: 'inherit' }}>- {form.reason || '...'}</Typography>

            {/* III */}
            <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>III/ Thời gian kiểm kê:</Typography>
            <Typography sx={{ ml: 2, fontFamily: 'inherit', fontSize: 'inherit' }}>
              - Vào hồi {form.inspectionTime || '___'} ngày {dayStr} tháng {monthStr} năm {yearStr}
            </Typography>

            {/* IV */}
            <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>IV/ Hình thức kiểm kê:</Typography>
            {(form.inspectionMethod || '').split('\n').map((line, i) => (
              <Typography key={i} sx={{ ml: 2, fontFamily: 'inherit', fontSize: 'inherit' }}>- {line}</Typography>
            ))}

            {/* V */}
            <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>V/ Nội dung kiểm kê:</Typography>
            <Typography sx={{ fontWeight: 700, textAlign: 'center', mb: 1, fontFamily: 'inherit', fontSize: 'inherit' }}>
              KIỂM KÊ TÀI SẢN CÓ TRONG LỚP HỌC:
            </Typography>

            {/* Asset table */}
            <Box sx={{ overflowX: 'auto', mb: 1, WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr>
                    <th style={{ ...headerCell, width: 32 }}>TT</th>
                    <th style={headerCell}>TÊN THIẾT BỊ</th>
                    <th style={{ ...headerCell, width: 46 }}>ĐVT</th>
                    <th style={{ ...headerCell, width: 46 }}>SL</th>
                    <th style={{ ...headerCell, width: 110 }}>ĐỐI TƯỢNG SỬ DỤNG</th>
                    <th style={{ ...headerCell, width: 90 }}>GHI CHÚ</th>
                    {!isReadOnly && <th style={{ ...headerCell, width: 36 }} />}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const groups = [];
                    form.assets.forEach(row => {
                      const cat = row.category || '';
                      const last = groups[groups.length - 1];
                      if (last && last.category === cat) last.rows.push(row);
                      else groups.push({ category: cat, rows: [row] });
                    });
                    let counter = 0;
                    return groups.map((g, gi) => (
                      <>
                        {g.category && (
                          <tr key={`cat-${gi}`}>
                            <td colSpan={isReadOnly ? 6 : 7}
                              style={{ ...cellBorder, fontWeight: 700, textAlign: 'center', background: '#f0f0f0' }}>
                              {g.category}
                            </td>
                          </tr>
                        )}
                        {g.rows.map(row => {
                          counter++;
                          const globalIdx = form.assets.indexOf(row);
                          const n = counter;
                          return (
                            <tr key={globalIdx}>
                              <td style={{ ...cellBorder, textAlign: 'center' }}>{n}</td>
                              <td style={cellBorder}>
                                {isReadOnly ? row.name : (
                                  <input style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 13 }}
                                    value={row.name} onChange={e => handleAssetChange(globalIdx, 'name', e.target.value)} placeholder="Tên thiết bị" />
                                )}
                              </td>
                              <td style={{ ...cellBorder, textAlign: 'center' }}>
                                {isReadOnly ? row.unit : (
                                  <input style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center', fontSize: 13 }}
                                    value={row.unit} onChange={e => handleAssetChange(globalIdx, 'unit', e.target.value)} />
                                )}
                              </td>
                              <td style={{ ...cellBorder, textAlign: 'center' }}>
                                {isReadOnly ? row.quantity : (
                                  <input type="number" min={0}
                                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center', fontSize: 13 }}
                                    value={row.quantity} onChange={e => handleAssetChange(globalIdx, 'quantity', e.target.value)} />
                                )}
                              </td>
                              <td style={{ ...cellBorder, textAlign: 'center' }}>
                                {isReadOnly ? row.targetUser : (
                                  <select style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 13 }}
                                    value={row.targetUser} onChange={e => handleAssetChange(globalIdx, 'targetUser', e.target.value)}>
                                    <option value="">—</option>
                                    <option value="Trẻ">Trẻ</option>
                                    <option value="Giáo viên">Giáo viên</option>
                                    <option value="Dùng chung">Dùng chung</option>
                                  </select>
                                )}
                              </td>
                              <td style={cellBorder}>
                                {isReadOnly ? row.notes : (
                                  <input style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 13 }}
                                    value={row.notes} onChange={e => handleAssetChange(globalIdx, 'notes', e.target.value)} />
                                )}
                              </td>
                              {!isReadOnly && (
                                <td style={{ ...cellBorder, textAlign: 'center', padding: 2 }}>
                                  <IconButton size="small" color="error" onClick={() => handleRemoveRow(globalIdx)} disabled={form.assets.length <= 1}>
                                    <DeleteIcon sx={{ fontSize: 15 }} />
                                  </IconButton>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </>
                    ));
                  })()}
                </tbody>
              </table>
            </Box>

            {!isReadOnly && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={2}>
                <Button size="small" onClick={handleAddRow} sx={{ textTransform: 'none' }}>+ Thêm dòng tài sản</Button>
                <Button size="small" variant="outlined" onClick={() => setCategoryDialog(true)} sx={{ textTransform: 'none' }}>
                  + Thêm nhóm mới
                </Button>
              </Stack>
            )}

            {/* Extra Assets (ngoài thông tư) */}
            {form.extraAssets?.length > 0 && (
              <>
                <Typography sx={{ fontWeight: 700, textAlign: 'center', mt: 2, mb: 1, fontFamily: 'inherit', fontSize: 'inherit' }}>
                  CÁC THIẾT BỊ TÀI SẢN KHÁC NGOÀI THÔNG TƯ
                </Typography>
                <Box sx={{ overflowX: 'auto', mb: 1, WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                    <thead>
                      <tr>
                        <th style={{ ...headerCell, width: 32 }}>TT</th>
                        <th style={{ ...headerCell, width: 80 }}>MÃ SỐ</th>
                        <th style={headerCell}>TÊN THIẾT BỊ</th>
                        <th style={{ ...headerCell, width: 46 }}>ĐVT</th>
                        <th style={{ ...headerCell, width: 46 }}>SL</th>
                        <th style={{ ...headerCell, width: 110 }}>ĐỐI TƯỢNG SỬ DỤNG</th>
                        <th style={{ ...headerCell, width: 90 }}>GHI CHÚ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const groups = [];
                        form.extraAssets.forEach(row => {
                          const cat = row.category || '';
                          const last = groups[groups.length - 1];
                          if (last && last.category === cat) last.rows.push(row);
                          else groups.push({ category: cat, rows: [row] });
                        });
                        let counter = 0;
                        return groups.map((g, gi) => (
                          <>
                            {g.category && (
                              <tr key={`ecat-${gi}`}>
                                <td colSpan={7}
                                  style={{ ...cellBorder, fontWeight: 700, textAlign: 'center', background: '#f0f0f0' }}>
                                  {g.category}
                                </td>
                              </tr>
                            )}
                            {g.rows.map(row => {
                              counter++;
                              const n = counter;
                              return (
                                <tr key={n}>
                                  <td style={{ ...cellBorder, textAlign: 'center' }}>{n}</td>
                                  <td style={cellBorder}>{row.assetCode}</td>
                                  <td style={cellBorder}>{row.name}</td>
                                  <td style={{ ...cellBorder, textAlign: 'center' }}>{row.unit}</td>
                                  <td style={{ ...cellBorder, textAlign: 'center' }}>{row.quantity}</td>
                                  <td style={{ ...cellBorder, textAlign: 'center' }}>{row.targetUser}</td>
                                  <td style={cellBorder}>{row.notes}</td>
                                </tr>
                              );
                            })}
                          </>
                        ));
                      })()}
                    </tbody>
                  </table>
                </Box>
              </>
            )}

            {/* Footer */}
            <Typography sx={{ fontFamily: 'inherit', fontSize: { xs: 11, sm: 13 }, mb: 2 }}>
              Kiểm kê kết thúc vào lúc {form.endTime || '___'} ngày {dayStr} tháng {monthStr} năm {yearStr}.
              {' '}Biên bản này được sao thành 2 bản, giáo viên chủ nhiệm lớp giữ một bản và Ban kiểm kê giữ một bản.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} textAlign="center">
              {[
                { title: 'XÁC NHẬN CỦA NHÀ TRƯỜNG', sub: 'Phó Hiệu Trưởng', name: selectedCommittee?.members?.find(m => m.role === 'Trưởng ban')?.fullName },
                { title: 'GIÁO VIÊN CHỦ NHIỆM', sub: '', name: '' },
                { title: 'NGƯỜI GHI BIÊN BẢN', sub: '', name: selectedCommittee?.members?.find(m => m.role === 'Phó ban')?.fullName },
              ].map((col, i) => (
                <Box key={i} sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontFamily: 'inherit', fontSize: { xs: 11, sm: 13 } }}>{col.title}</Typography>
                  {col.sub && <Typography sx={{ fontStyle: 'italic', fontFamily: 'inherit', fontSize: 12 }}>{col.sub}</Typography>}
                  <Typography sx={{ mt: { xs: 2, sm: 5 }, fontWeight: 700, fontFamily: 'inherit', fontSize: { xs: 11, sm: 13 } }}>
                    {col.name || '\u00A0'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 1.5, sm: 3 }, pb: 2, gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => setOpenModal(false)} disabled={saving}>Đóng</Button>
          {editingMinutes && (
            <Button variant="outlined" color="primary" startIcon={<FileDownloadIcon />} onClick={() => downloadWord(editingMinutes)} sx={{ textTransform: 'none' }}>
              Tải về Word
            </Button>
          )}
          {editingMinutes?.status === 'pending' && (
            <>
              <Button variant="contained" color="success" onClick={handleApprove} disabled={saving} sx={{ textTransform: 'none' }}>
                {saving ? '...' : 'Duyệt'}
              </Button>
              <Button variant="contained" color="error" onClick={() => { setRejectReason(''); setRejectDialog(true); }} disabled={saving} sx={{ textTransform: 'none' }}>
                Từ chối
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Lý do từ chối</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            size="small"
            label="Lý do từ chối *"
            placeholder="Nhập lý do từ chối biên bản này..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setRejectDialog(false)} disabled={saving}>Hủy</Button>
          <Button
            variant="contained"
            color="error"
            disabled={saving || !rejectReason.trim()}
            onClick={handleReject}
          >
            {saving ? 'Đang xử lý...' : 'Xác nhận từ chối'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Category Dialog */}
      <AddCategoryDialog open={categoryDialog} onClose={() => setCategoryDialog(false)} onConfirm={name => { handleAddCategory(name); setCategoryDialog(false); }} />

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa biên bản kiểm kê"
        message="Bạn có chắc chắn muốn xóa biên bản này không?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </Box>
  );
}

// ─── Shared: Inline-edit cell components ─────────────────────────────────────
function InlineCell({ a, field, align = 'left', isText = false, ie, setIe, onSave, sx = {} }) {
  const isEditing = ie?.id === a._id && ie?.field === field;
  const rawVal = a[field];
  const display = rawVal != null && rawVal !== '' ? rawVal : '—';
  if (isEditing) {
    return (
      <TableCell align={align} sx={{ p: '2px 4px', ...sx }}>
        <input
          autoFocus
          type={isText ? 'text' : 'number'}
          defaultValue={rawVal ?? ''}
          style={{
            width: '100%', border: '1px solid #1a56db', borderRadius: 4,
            padding: '2px 6px', fontSize: 13, outline: 'none',
            textAlign: align === 'center' ? 'center' : 'left', background: '#f0f7ff',
          }}
          onBlur={e => onSave(a._id, field, e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') e.target.blur();
            if (e.key === 'Escape') setIe(null);
          }}
        />
      </TableCell>
    );
  }
  return (
    <TableCell
      align={align}
      onClick={() => setIe({ id: a._id, field, value: rawVal })}
      sx={{ cursor: 'text', '&:hover': { backgroundColor: '#e8f4fd' }, ...sx }}
    >
      {display}
    </TableCell>
  );
}

function InlineSelectCell({ a, field, options, align = 'center', ie, setIe, onSave, renderValue }) {
  const isEditing = ie?.id === a._id && ie?.field === field;
  const rawVal = a[field];
  if (isEditing) {
    return (
      <TableCell align={align} sx={{ p: '2px 4px' }}>
        <select
          autoFocus
          defaultValue={rawVal}
          style={{ width: '100%', border: '1px solid #1a56db', borderRadius: 4, padding: '2px 4px', fontSize: 12 }}
          onChange={e => onSave(a._id, field, e.target.value)}
          onBlur={() => setIe(null)}
          onKeyDown={e => e.key === 'Escape' && setIe(null)}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </TableCell>
    );
  }
  return (
    <TableCell
      align={align}
      onClick={() => setIe({ id: a._id, field, value: rawVal })}
      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#e8f4fd' } }}
    >
      {renderValue ? renderValue(rawVal) : (rawVal || '—')}
    </TableCell>
  );
}

// ─── Assets Tab (CRUD Tài sản) ────────────────────────────────────────────────
const CONDITION_OPTIONS = ['Còn tốt', 'Đã hỏng'];
const CONDITION_COLOR = {
  'Còn tốt': 'success',
  'Đã hỏng': 'error',
  // Backward compatibility for existing data
  'Tốt': 'success',
  'Hỏng': 'error',
  'Cần sửa chữa': 'error',
};

function normalizeCondition(value) {
  const raw = String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!raw) return 'Còn tốt';
  if (raw.includes('da hong') || raw === 'hong' || raw.includes('can sua chua')) return 'Đã hỏng';
  if (raw.includes('con tot') || raw === 'tot') return 'Còn tốt';
  return 'Còn tốt';
}
const CATEGORY_OPTIONS = [
  'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em',
  'Số bàn, ghế ngồi',
  'Khối phòng phục vụ học tập',
  'Phòng tổ chức ăn, nghỉ',
  'Công trình công cộng và khối phòng phục vụ khác',
  'Khối phòng hành chính quản trị',
  'Diện tích đất',
  'Thiết bị dạy học và CNTT',
];
const CONSTRUCTION_OPTIONS = ['Kiên cố', 'Bán kiên cố', 'Tạm', 'Không áp dụng'];

// Mục 7 – cơ sở vật chất khác (hiển thị ĐVT + Số lượng thay vì diện tích / loại CT)
const SECTION7_CATEGORIES = ['Diện tích đất', 'Thiết bị dạy học và CNTT'];
const SECTION7_SUB_LABELS = {
  'Diện tích đất': '7.1. Diện tích đất (Tính đến thời điểm hiện tại)',
  'Thiết bị dạy học và CNTT': '7.2. Thiết bị dạy học và thiết bị Công nghệ thông tin',
};
const SECTION7_PRESETS = {
  'Diện tích đất': [
    { name: 'Tổng diện tích khuôn viên đất', unit: 'm²' },
    { name: 'Diện tích sân chơi', unit: 'm²' },
    { name: 'Diện tích sân vườn (dùng cho trẻ khám phá, trải nghiệm)', unit: 'm²' },
  ],
  'Thiết bị dạy học và CNTT': [
    { name: 'Thiết bị dạy học tối thiểu', unit: 'Bộ' },
    { name: 'Thiết bị đồ chơi ngoài trời', unit: 'Loại' },
    { name: 'Tổng số máy tính đang được sử dụng (Bao gồm cả Laptop và PC)', unit: 'Bộ' },
    { name: 'Tổng số đường truyền Internet (Bao gồm cả thuê bao miễn phí và trả phí)', unit: 'Bộ' },
    { name: 'Số máy tính được kết nối Internet', unit: 'Bộ' },
    { name: 'Số máy tính phục vụ công tác Quản lý', unit: 'Bộ' },
    { name: 'Số máy tính phục vụ công tác Giảng dạy, Học tập', unit: 'Bộ' },
    { name: 'Máy chiếu', unit: 'Chiếc' },
    { name: 'Máy Photocopy', unit: 'Chiếc' },
    { name: 'Máy in', unit: 'Chiếc' },
    { name: 'Máy Scaner', unit: 'Chiếc' },
    { name: 'Máy ép Plastic', unit: 'Chiếc' },
    { name: 'Tivi dùng cho công tác quản lý', unit: 'Chiếc' },
    { name: 'Tivi tại các phòng học', unit: 'Chiếc' },
    { name: 'Đàn phím điện tử', unit: 'Chiếc' },
    { name: 'Tủ đựng đồ', unit: 'Chiếc' },
  ],
};
const UNIT_OPTIONS = ['Cái', 'Bộ', 'Loại', 'Chiếc', 'm²', 'Phòng', 'Bàn', 'Ghế', 'Khác'];

const emptyAsset = () => ({
  assetCode: '', name: '', category: 'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em', room: '',
  requiredQuantity: 0, quantity: 1, area: '', constructionType: 'Không áp dụng',
  unit: 'Cái', condition: 'Còn tốt', notes: '',
  seats1: null, seats2: null, seats4: null,
});

function AssetsTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(emptyAsset());
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Import Excel
  const importRef = useRef();
  const [importPreview, setImportPreview] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // Bulk select & delete
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Inline edit (phần 2 – Số bàn, ghế ngồi)
  const [inlineEdit, setInlineEdit] = useState(null); // { id, field, value }
  const [inlineSaving, setInlineSaving] = useState(false);

  // Pagination

  const load = async () => {
    setLoading(true);
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.ASSETS + '?type=csvc');
      setAssets((res?.data?.assets || []).map((a) => ({ ...a, condition: normalizeCondition(a.condition) })));
    } catch (err) {
      toast.error(err?.message || 'Không tải được danh sách tài sản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => { setSelected(new Set()); }, [search, filterCategory]);

  const handleInlineSave = async (id, field, value) => {
    const asset = assets.find(a => a._id === id);
    if (!asset) return;
    const STRING_FIELDS = new Set(['name', 'assetCode', 'unit', 'condition', 'constructionType', 'notes', 'room']);
    const parsedRaw = STRING_FIELDS.has(field) ? value : (value === '' || value == null ? null : Number(value));
    const parsed = field === 'condition' ? normalizeCondition(parsedRaw) : parsedRaw;
    if (asset[field] === parsed) { setInlineEdit(null); return; }
    setInlineSaving(true);
    try {
      const payload = { ...asset, [field]: parsed };
      await put(ENDPOINTS.SCHOOL_ADMIN.ASSET_DETAIL(id), payload);
      setAssets(prev => prev.map(a => a._id === id ? { ...a, [field]: parsed } : a));
    } catch (err) {
      toast.error(err?.message || 'Lưu thất bại.');
    } finally {
      setInlineSaving(false);
      setInlineEdit(null);
    }
  };

  const handleOpen = (asset = null) => {
    if (asset?._id) {
      // Edit mode
      setForm({
        assetCode: asset.assetCode,
        name: asset.name,
        category: asset.category || 'Khác',
        room: asset.room || '',
        requiredQuantity: asset.requiredQuantity ?? 0,
        quantity: asset.quantity,
        area: asset.area ?? '',
        constructionType: asset.constructionType || 'Không áp dụng',
        unit: asset.unit || 'Cái',
        condition: normalizeCondition(asset.condition),
        notes: asset.notes || '',
        seats1: asset.seats1 ?? null,
        seats2: asset.seats2 ?? null,
        seats4: asset.seats4 ?? null,
      });
      setEditId(asset._id);
    } else {
      // Add mode – preset category nếu được truyền vào
      setForm({ ...emptyAsset(), ...(asset?.category ? { category: asset.category } : {}) });
      setEditId(null);
    }
    setOpenModal(true);
  };

  const handleClose = () => { setOpenModal(false); setForm(emptyAsset()); setEditId(null); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên tài sản.'); return; }
    if (SECTION7_CATEGORIES.includes(form.category) && !form.unit?.trim()) {
      toast.error('Vui lòng nhập đơn vị tính (ĐVT).'); return;
    }
    if ((form.quantity ?? 0) < 0) { toast.error('Số lượng không được âm.'); return; }
    if ((form.requiredQuantity ?? 0) < 0) { toast.error('Nhu cầu QĐ không được âm.'); return; }
    if (form.category === 'Số bàn, ghế ngồi') {
      const total = (form.seats1 || 0) + (form.seats2 || 0) + (form.seats4 || 0);
      if (total > (form.quantity || 0)) {
        toast.error('Tổng "Trong đó" (1+2+4 chỗ) không được lớn hơn Tổng số chỗ ngồi.'); return;
      }
    }
    setSaving(true);
    try {
      const payload = { ...form, condition: normalizeCondition(form.condition), area: form.area !== '' ? Number(form.area) : null };
      if (editId) {
        await put(ENDPOINTS.SCHOOL_ADMIN.ASSET_DETAIL(editId), payload);
        toast.success('Cập nhật tài sản thành công.');
      } else {
        await post(ENDPOINTS.SCHOOL_ADMIN.ASSETS, payload);
        toast.success('Thêm tài sản thành công.');
      }
      handleClose();
      load();
    } catch (err) {
      toast.error(err?.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await del(ENDPOINTS.SCHOOL_ADMIN.ASSET_DETAIL(deleteTarget._id));
      toast.success('Xóa tài sản thành công.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Xóa thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = id =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });


  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all([...selected].map(id => del(ENDPOINTS.SCHOOL_ADMIN.ASSET_DETAIL(id))));
      toast.success(`Đã xóa ${selected.size} tài sản.`);
      setSelected(new Set());
      setBulkDeleteOpen(false);
      load();
    } catch (err) {
      toast.error(err?.message || 'Xóa thất bại.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleImportFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    import('xlsx').then(XLSX => {
      const reader = new FileReader();
      reader.onload = evt => {
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (!rows?.length) { toast.error('File rỗng hoặc sai định dạng.'); return; }

        // ── Section header mapping (theo số thứ tự trong Excel báo cáo) ──
        const SECTION_PATTERNS = [
          { re: /^1[\.\s\)]/, cat: 'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em', fmt: 'room' },
          { re: /^2[\.\s\)]/, cat: 'Số bàn, ghế ngồi', fmt: 'banGhe' },
          { re: /^3[\.\s\)]/, cat: 'Khối phòng phục vụ học tập', fmt: 'room' },
          { re: /^4[\.\s\)]/, cat: 'Phòng tổ chức ăn, nghỉ', fmt: 'room' },
          { re: /^5[\.\s\)]/, cat: 'Công trình công cộng và khối phòng phục vụ khác', fmt: 'room' },
          { re: /^6[\.\s\)]/, cat: 'Khối phòng hành chính quản trị', fmt: 'room' },
          { re: /^7\.1/, cat: 'Diện tích đất', fmt: 'landarea' },
          { re: /^7\.2/, cat: 'Thiết bị dạy học và CNTT', fmt: 'equip' },
          { re: /^7[\.\s\)]/, cat: 'Thiết bị dạy học và CNTT', fmt: 'equip' },
        ];

        // Prefix tự động sinh mã TS theo category
        const CODE_PREFIX = {
          'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em': 'PH',
          'Số bàn, ghế ngồi': 'BG',
          'Khối phòng phục vụ học tập': 'HT',
          'Phòng tổ chức ăn, nghỉ': 'AN',
          'Công trình công cộng và khối phòng phục vụ khác': 'CC',
          'Khối phòng hành chính quản trị': 'HC',
          'Diện tích đất': 'DT',
          'Thiết bị dạy học và CNTT': 'TB',
        };
        const codeCounters = {};

        const toNum = v => {
          if (typeof v === 'number') return v;
          const s = String(v ?? '').trim();
          if (!s) return 0;
          // Số kiểu Việt Nam: dấu chấm = phân nghìn, dấu phẩy = thập phân (vd: 3.943,3)
          // Nhận biết: có cả '.' lẫn ',' → bỏ dấu chấm, đổi phẩy thành chấm
          const cleaned = s.includes('.') && s.includes(',')
            ? s.replace(/\./g, '').replace(',', '.')
            : s.replace(',', '.');
          const n = parseFloat(cleaned);
          return isNaN(n) ? 0 : n;
        };
        const isNum = v => typeof v === 'number' || (typeof v === 'string' && /^[\d,\.]+$/.test(v.trim()) && v.trim() !== '');

        // Các tên dòng cần bỏ qua (tiêu đề cột, dòng tổng hợp không phải tài sản)
        const SKIP_ROW = /^(tổng số:?|trong đó|chia ra|tổng cộng|đvt|ghi chú|nguồn nước|thư viện nhà trường)$/i;

        let currentCat = '';
        let currentFmt = 'room';
        const parsed = [];

        for (const row of rows) {
          const col0 = String(row[0] ?? '').trim();
          if (!col0) continue;

          // Kiểm tra header đầu mục (1., 2., ..., 7.1, 7.2)
          const sec = SECTION_PATTERNS.find(s => s.re.test(col0));
          if (sec) {
            currentCat = sec.cat;
            currentFmt = sec.fmt;
            continue;
          }

          // Bỏ qua dòng tiêu đề cột (toàn chữ, không có số) hoặc dòng gộp chung
          if (!currentCat) continue;
          const numCols = row.slice(1).filter(v => isNum(v));
          if (numCols.length === 0) continue;

          // Làm sạch tên – bỏ ký tự đầu dòng như "- ", "+ ", "* "
          const name = col0.replace(/^[\-\+\*\•\–\—\s]+/, '').trim();
          if (!name || name.length < 2) continue;
          if (SKIP_ROW.test(name)) continue;

          // Sinh mã tài sản tự động
          const prefix = CODE_PREFIX[currentCat] || 'TS';
          codeCounters[prefix] = (codeCounters[prefix] || 0) + 1;
          const assetCode = `${prefix}${String(codeCounters[prefix]).padStart(3, '0')}`;

          let asset;

          if (currentFmt === 'landarea') {
            // Diện tích đất: cấu trúc [tên, ĐVT (m²), giá trị diện tích]
            // Lưu vào unit + quantity để hiển thị đúng trong bảng section 7
            let dvt = '';
            let qty = 0;
            for (let ci = 1; ci < row.length; ci++) {
              const v = row[ci];
              if (v === '' || v == null) continue;
              if (isNum(v)) { qty = toNum(v); break; }
              if (!dvt && typeof v === 'string') dvt = v.trim();
            }
            asset = {
              assetCode, name,
              category: currentCat,
              room: '',
              requiredQuantity: 0,
              quantity: qty,
              unit: dvt || 'm²',
              area: null,
              constructionType: 'Không áp dụng',
              condition: 'Còn tốt',
              notes: '',
            };
          } else if (currentFmt === 'banGhe') {
            // Phần 2 – Số bàn, ghế ngồi
            // col[1]=nhu cầu QĐ, col[2]=tổng số, col[3]=1 chỗ, col[4]=2 chỗ, col[5]=4 chỗ
            asset = {
              assetCode, name,
              category: currentCat,
              room: '',
              requiredQuantity: toNum(row[1]),
              quantity: toNum(row[2]),
              area: null,
              constructionType: 'Không áp dụng',
              condition: 'Còn tốt',
              notes: '',
              seats1: row[3] !== '' && row[3] != null ? toNum(row[3]) : null,
              seats2: row[4] !== '' && row[4] != null ? toNum(row[4]) : null,
              seats4: row[5] !== '' && row[5] != null ? toNum(row[5]) : null,
            };
          } else if (currentFmt === 'equip') {
            // Thiết bị: scan toàn bộ row để tìm ĐVT (text đầu tiên) và số lượng (số đầu tiên)
            // Cần thiết vì Excel gốc để ĐVT/Số lượng ở cột 8-9, còn file mẫu để ở cột 1-2
            let dvt = '';
            let qty = 0;
            for (let ci = 1; ci < row.length; ci++) {
              const v = row[ci];
              if (v === '' || v == null) continue;
              if (isNum(v)) { qty = toNum(v); break; }
              if (!dvt && typeof v === 'string') dvt = v.trim();
            }
            asset = {
              assetCode, name,
              category: currentCat,
              room: '',
              requiredQuantity: 0,
              quantity: qty,
              unit: dvt || 'Cái',
              area: null,
              constructionType: 'Không áp dụng',
              condition: 'Còn tốt',
              notes: '',
            };
          } else {
            // Phòng / Bàn ghế: col[1]=nhu cầu QĐ, col[2]=tổng số, col[3]=diện tích
            // col[4,5]=Kiên cố; col[6,7]=Bán kiên cố; col[8,9]=Tạm
            const requiredQuantity = toNum(row[1]);
            const quantity = toNum(row[2]);
            const areaRaw = row[3];
            const area = areaRaw !== '' && areaRaw != null ? toNum(areaRaw) || null : null;

            const kienCo = toNum(row[4]);
            const banKienCo = toNum(row[6]);
            const tam = toNum(row[8]);
            let constructionType = 'Không áp dụng';
            if (kienCo > 0 && !banKienCo && !tam) constructionType = 'Kiên cố';
            else if (banKienCo > 0 && !kienCo && !tam) constructionType = 'Bán kiên cố';
            else if (tam > 0 && !kienCo && !banKienCo) constructionType = 'Tạm';

            asset = {
              assetCode, name,
              category: currentCat,
              room: '',
              requiredQuantity,
              quantity,
              area,
              constructionType,
              condition: 'Còn tốt',
              notes: '',
            };
          }

          parsed.push(asset);
        }

        if (!parsed.length) {
          toast.error('Không nhận ra cấu trúc file. Hãy dùng file báo cáo cơ sở vật chất đúng định dạng hoặc tải file mẫu.');
          return;
        }
        setImportPreview(parsed);
        setImportOpen(true);
        toast.info(`Đọc được ${parsed.length} tài sản. Kiểm tra trước khi nhập.`);
      };
      reader.readAsArrayBuffer(file);
    }).catch(() => toast.error('Không hỗ trợ import Excel.'));
    e.target.value = '';
  };

  const handleDownloadTemplate = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Trường MN Đức Xuân';
      wb.created = new Date();

      const ws = wb.addWorksheet('Cơ sở vật chất', {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
        views: [{ state: 'frozen', xSplit: 0, ySplit: 7 }],
      });

      // ── Column widths ──────────────────────────────────────────────────────
      ws.columns = [
        { key: 'A', width: 50 },
        { key: 'B', width: 15 },
        { key: 'C', width: 12 },
        { key: 'D', width: 14 },
        { key: 'E', width: 11 },
        { key: 'F', width: 13 },
        { key: 'G', width: 13 },
        { key: 'H', width: 13 },
        { key: 'I', width: 11 },
        { key: 'J', width: 13 },
      ];

      // ── Helpers ────────────────────────────────────────────────────────────
      const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
      const bdr = (style = 'thin', color = 'B0BEC5') => ({ style, color: { argb: color } });
      const allBorders = (style = 'thin', color = 'B0BEC5') => ({
        top: bdr(style, color), bottom: bdr(style, color),
        left: bdr(style, color), right: bdr(style, color),
      });
      const font = (size, bold, color = '212121', italic = false) =>
        ({ name: 'Times New Roman', size, bold, italic, color: { argb: color } });
      const align = (h, v = 'middle', wrap = true) => ({ horizontal: h, vertical: v, wrapText: wrap });

      const styleCell = (cell, { f, fi, al, bd } = {}) => {
        if (f) cell.fill = f;
        if (fi) cell.font = fi;
        if (al) cell.alignment = al;
        if (bd) cell.border = bd;
      };

      const mergeStyle = (addr, opts) => styleCell(ws.getCell(addr), opts);

      // ── Row 1: School name ─────────────────────────────────────────────────
      ws.addRow([]);
      ws.mergeCells('A1:J1');
      mergeStyle('A1', {
        f: fill('1565C0'),
        fi: font(14, true, 'FFFFFF'),
        al: align('center'),
      });
      ws.getCell('A1').value = 'TRƯỜNG MẦM NON ĐỨC XUÂN';
      ws.getRow(1).height = 26;

      // ── Row 2: Report title ────────────────────────────────────────────────
      ws.addRow([]);
      ws.mergeCells('A2:J2');
      mergeStyle('A2', {
        f: fill('1976D2'),
        fi: font(13, true, 'FFFFFF'),
        al: align('center'),
      });
      ws.getCell('A2').value = 'BÁO CÁO CƠ SỞ VẬT CHẤT – MẪU NHẬP DỮ LIỆU';
      ws.getRow(2).height = 24;

      // ── Row 3: Instruction ─────────────────────────────────────────────────
      ws.addRow([]);
      ws.mergeCells('A3:J3');
      mergeStyle('A3', {
        f: fill('E3F2FD'),
        fi: font(9, false, '1565C0', true),
        al: align('left'),
      });
      ws.getCell('A3').value =
        '  Hướng dẫn: Điền số liệu thực tế vào các ô màu trắng. Các ô màu xanh/cam là tiêu đề, không chỉnh sửa. ' +
        'File này dùng để Import vào hệ thống quản lý tài sản.';
      ws.getRow(3).height = 18;

      // ── Row 4: Blank ───────────────────────────────────────────────────────
      ws.addRow([]);
      ws.getRow(4).height = 6;

      // ── Rows 5-6: Double-row column header ────────────────────────────────
      // Row 5: group headers
      ws.addRow([]);
      ws.getRow(5).height = 22;
      const h5 = ws.getRow(5);

      const setH = (addr, value, bgColor = '1565C0', fgColor = 'FFFFFF') => {
        ws.getCell(addr).value = value;
        mergeStyle(addr, {
          f: fill(bgColor),
          fi: font(10, true, fgColor),
          al: align('center'),
          bd: allBorders('medium', '90CAF9'),
        });
      };

      ws.mergeCells('A5:A6');
      setH('A5', 'Tên phòng / Tài sản');
      ws.mergeCells('B5:B6');
      setH('B5', 'Nhu cầu\ntheo QĐ');
      ws.mergeCells('C5:C6');
      setH('C5', 'Tổng số');
      ws.mergeCells('D5:D6');
      setH('D5', 'Diện tích\n(m²)');
      ws.mergeCells('E5:F5');
      setH('E5', 'Kiên cố', '1976D2');
      ws.mergeCells('G5:H5');
      setH('G5', 'Bán kiên cố', '388E3C', 'FFFFFF');
      ws.mergeCells('I5:J5');
      setH('I5', 'Tạm', 'F57C00', 'FFFFFF');

      // Row 6: sub-headers for construction groups
      ws.addRow([]);
      ws.getRow(6).height = 18;
      const subCols = [
        ['E6', 'Số phòng', '1976D2'],
        ['F6', 'Diện tích', '1976D2'],
        ['G6', 'Số phòng', '388E3C'],
        ['H6', 'Diện tích', '388E3C'],
        ['I6', 'Số phòng', 'F57C00'],
        ['J6', 'Diện tích', 'F57C00'],
      ];
      subCols.forEach(([addr, val, bg]) => setH(addr, val, bg));

      // ── Row 7: Unit row ────────────────────────────────────────────────────
      ws.addRow([]);
      ws.getRow(7).height = 16;
      const units = ['', 'Phòng', 'Phòng', 'm²', 'Phòng', 'm²', 'Phòng', 'm²', 'Phòng', 'm²'];
      units.forEach((u, i) => {
        const cell = ws.getRow(7).getCell(i + 1);
        cell.value = u;
        cell.font = font(9, false, '546E7A', true);
        cell.fill = fill('E3F2FD');
        cell.alignment = align('center');
        cell.border = allBorders('thin', 'B0BEC5');
      });

      // ── Section builder helpers ────────────────────────────────────────────
      const SECTION_COLORS = [
        '1565C0', // 1
        '6A1B9A', // 2
        '00695C', // 3
        'B71C1C', // 4
        '37474F', // 5
        'E65100', // 6
        '004D40', // 7
      ];

      const addSectionHeader = (title, colorIdx) => {
        const color = SECTION_COLORS[colorIdx] || '1565C0';
        const row = ws.addRow([title]);
        ws.mergeCells(`A${row.number}:J${row.number}`);
        mergeStyle(`A${row.number}`, {
          f: fill(color),
          fi: font(10, true, 'FFFFFF'),
          al: align('left'),
          bd: { top: bdr('medium', color), bottom: bdr('medium', color), left: bdr('thin'), right: bdr('thin') },
        });
        row.height = 20;
      };

      const addDataRow = (label, vals, isSubItem = false) => {
        const rowData = [label, ...vals];
        const row = ws.addRow(rowData);
        row.height = 18;
        row.eachCell({ includeEmpty: true }, (cell, colNum) => {
          if (colNum === 1) {
            cell.font = font(10, !isSubItem, isSubItem ? '424242' : '212121');
            cell.alignment = align('left');
            cell.fill = fill(isSubItem ? 'FAFAFA' : 'F5F5F5');
          } else {
            cell.font = font(10, false, '1565C0');
            cell.alignment = align('center');
            cell.fill = fill('FFFFFF');
            cell.numFmt = '#,##0.##';
          }
          cell.border = allBorders('thin', 'CFD8DC');
        });
      };

      // Equipment section (7.x): 3 columns only
      const addEquipSectionHeader = (title, colorIdx) => {
        const color = SECTION_COLORS[colorIdx] || '004D40';
        const row = ws.addRow([title, 'ĐVT', 'Số lượng']);
        ws.mergeCells(`C${row.number}:J${row.number}`);
        [1, 2, 3].forEach(ci => {
          const cell = row.getCell(ci);
          cell.fill = fill(ci === 1 ? color : color + 'CC');
          cell.font = font(10, true, 'FFFFFF');
          cell.alignment = align(ci === 1 ? 'left' : 'center');
          cell.border = allBorders('medium', '80CBC4');
        });
        row.height = 20;
      };

      const addEquipRow = (label, dvt, qty) => {
        const row = ws.addRow([label, dvt, qty]);
        ws.mergeCells(`C${row.number}:J${row.number}`);
        row.height = 18;
        row.getCell(1).font = font(10, false, '212121');
        row.getCell(1).alignment = align('left');
        row.getCell(1).fill = fill('FAFAFA');
        row.getCell(1).border = allBorders('thin', 'CFD8DC');
        row.getCell(2).font = font(10, false, '5D4037');
        row.getCell(2).alignment = align('center');
        row.getCell(2).fill = fill('FFF8E1');
        row.getCell(2).border = allBorders('thin', 'CFD8DC');
        row.getCell(3).font = font(10, true, '1565C0');
        row.getCell(3).alignment = align('center');
        row.getCell(3).fill = fill('FFFFFF');
        row.getCell(3).numFmt = '#,##0.##';
        row.getCell(3).border = allBorders('thin', 'CFD8DC');
      };

      // ── Section 1 ──────────────────────────────────────────────────────────
      addSectionHeader('1. Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em', 0);
      addDataRow('- Tổng số phòng học', [17, 17, 695, 17, 695, '', '', '', '']);
      addDataRow('+ Khu sinh hoạt chung', [17, 17, 695, 17, 695, '', '', '', ''], true);
      addDataRow('+ Khu ngủ', [17, 10, 472.2, 10, 472.2, '', '', '', ''], true);
      addDataRow('+ Khu vệ sinh', [17, 17, 223.81, 17, 223.81, '', '', '', ''], true);
      addDataRow('+ Hiên chơi, đón trẻ', [17, 17, 560.75, 17, 560.75, '', '', '', ''], true);
      addDataRow('+ Kho nhóm, lớp', [17, '', '', '', '', '', '', '', ''], true);
      addDataRow('+ Phòng giáo viên', [2, '', '', '', '', '', '', '', ''], true);

      // ── Section 2 ──────────────────────────────────────────────────────────
      addSectionHeader('2. Số bàn, ghế ngồi', 1);

      // Sub-header row đặc biệt cho phần 2: Trong đó 1/2/4 chỗ ngồi
      (() => {
        const BG_COLOR = '6A1B9A';
        const BG_LIGHT = 'AB47BC';

        // Row A: merged "Trong đó" spanning D-F
        const r1 = ws.addRow([]);
        r1.height = 20;
        const applyH = (addr, val, bg, colspan) => {
          ws.getCell(addr).value = val;
          styleCell(ws.getCell(addr), {
            f: fill(bg),
            fi: font(9, true, 'FFFFFF'),
            al: align('center'),
            bd: allBorders('medium', '90CAF9'),
          });
          if (colspan) ws.mergeCells(`${addr}:${String.fromCharCode(addr.charCodeAt(0) + colspan - 1)}${r1.number}`);
        };
        ws.mergeCells(`A${r1.number}:A${r1.number}`);
        applyH(`A${r1.number}`, 'Tên', BG_COLOR);
        applyH(`B${r1.number}`, 'Tổng nhu cầu cần có\ntheo quy định', BG_COLOR);
        applyH(`C${r1.number}`, 'Tổng số chỗ ngồi\ncủa tất cả các phòng', BG_COLOR);
        // Merge D-F for "Trong đó"
        ws.mergeCells(`D${r1.number}:F${r1.number}`);
        applyH(`D${r1.number}`, 'Trong đó', BG_LIGHT);
        // Merge G-J empty
        ws.mergeCells(`G${r1.number}:J${r1.number}`);
        styleCell(ws.getCell(`G${r1.number}`), { f: fill('F3E5F5'), bd: allBorders('thin', 'CE93D8') });

        // Row B: sub-cols 1/2/4 chỗ
        const r2 = ws.addRow([]);
        r2.height = 18;
        const sub = (addr, val, bg) => {
          ws.getCell(addr).value = val;
          styleCell(ws.getCell(addr), {
            f: fill(bg),
            fi: font(9, true, 'FFFFFF'),
            al: align('center'),
            bd: allBorders('medium', 'CE93D8'),
          });
        };
        ws.mergeCells(`A${r2.number}:A${r2.number}`);
        sub(`A${r2.number}`, '', BG_COLOR);
        sub(`B${r2.number}`, '', BG_COLOR);
        sub(`C${r2.number}`, '', BG_COLOR);
        sub(`D${r2.number}`, '1 chỗ ngồi', BG_LIGHT);
        sub(`E${r2.number}`, '2 chỗ ngồi', BG_LIGHT);
        sub(`F${r2.number}`, '4 chỗ ngồi', BG_LIGHT);
        ws.mergeCells(`G${r2.number}:J${r2.number}`);
        styleCell(ws.getCell(`G${r2.number}`), { f: fill('F3E5F5'), bd: allBorders('thin', 'CE93D8') });
      })();

      // Data rows cho phần 2: [nhuCau, tongSo, cho1, cho2, cho4]
      // cols: B=nhuCau, C=tongSo, D=1chỗ, E=2chỗ, F=4chỗ
      const addBanGheRow = (label, [nhuCau, tongSo, cho1, cho2, cho4], isSubItem = false) => {
        const nz = v => (v === 0 || v) ? v : '';
        const row = ws.addRow([label, nhuCau, tongSo, nz(cho1), nz(cho2), nz(cho4)]);
        row.height = 18;
        // Merge G-J empty
        ws.mergeCells(`G${row.number}:J${row.number}`);
        row.eachCell({ includeEmpty: true }, (cell, colNum) => {
          if (colNum === 1) {
            cell.font = font(10, !isSubItem, isSubItem ? '424242' : '212121');
            cell.alignment = align('left');
            cell.fill = fill(isSubItem ? 'FAFAFA' : 'F5F5F5');
          } else if (colNum <= 6) {
            cell.font = font(10, false, '1565C0');
            cell.alignment = align('center');
            cell.fill = fill('FFFFFF');
            cell.numFmt = '#,##0.##';
          } else if (colNum === 7) {
            cell.fill = fill('FCE4EC');
          }
          cell.border = allBorders('thin', 'CFD8DC');
        });
      };

      addBanGheRow('- Tổng số bàn', [300, 277, 0, 17, 260]);
      addBanGheRow('+ Bàn giáo viên', [38, 17, 0, 17, 0], true);
      addBanGheRow('+ Bàn học sinh', [260, 260, 0, 0, 260], true);
      addBanGheRow('- Tổng số ghế', [558, 558, 558, 0, 0]);
      addBanGheRow('+ Ghế giáo viên', [38, 17, 17, 0, 0], true);
      addBanGheRow('+ Ghế học sinh', [520, 520, 520, 0, 0], true);

      // ── Section 3 ──────────────────────────────────────────────────────────
      addSectionHeader('3. Khối phòng phục vụ học tập', 2);
      addDataRow('- Phòng thư viện', [1, 1, 40, 1, 40, '', '', '', '']);
      addDataRow('- Phòng Giáo dục thể chất', [1, '', '', '', '', '', '', '', '']);
      addDataRow('- Phòng Giáo dục nghệ thuật', [1, 1, 73, 1, 73, '', '', '', '']);
      addDataRow('- Phòng Y tế học đường', [1, 1, 12, 1, 12, '', '', '', '']);
      addDataRow('- Nhà tập đa năng', [1, '', '', '', '', '', '', '', '']);
      addDataRow('- Phòng làm quen với máy tính', [1, 1, 16, 1, 16, '', '', '', '']);
      addDataRow('- Sân chơi riêng', [2, 1, 540, 1, 540, '', '', '', '']);

      // ── Section 4 ──────────────────────────────────────────────────────────
      addSectionHeader('4. Phòng tổ chức ăn, nghỉ', 3);
      addDataRow('- Nhà bếp', [2, 2, 75, 1, 45, 1, 30, '', '']);
      addDataRow('- Phòng ăn', [1, 1, 9, '', '', '', '', 1, 9]);
      addDataRow('- Kho bếp', [2, 2, 12, 1, 6, 1, 6, '', '']);

      // ── Section 5 ──────────────────────────────────────────────────────────
      addSectionHeader('5. Công trình công cộng và khối phòng phục vụ khác', 4);
      addDataRow('- Nhà để xe GV', [1, 1, 108, '', '', '', '', 1, 108]);
      addDataRow('- Nhà để xe HS', [0, '', '', '', '', '', '', '', '']);
      addDataRow('- Nhà vệ sinh dành cho GV', [3, 2, 12, 2, 12, '', '', '', '']);

      // ── Section 6 ──────────────────────────────────────────────────────────
      addSectionHeader('6. Khối phòng hành chính quản trị', 5);
      addDataRow('- Phòng Hiệu trưởng', [1, 1, 18, 1, 18, '', '', '', '']);
      addDataRow('- Phòng phó Hiệu trưởng', [2, 2, 36, 2, 36, '', '', '', '']);
      addDataRow('- Phòng họp Hội đồng', [1, '', '', '', '', '', '', '', '']);
      addDataRow('- Phòng họp (Tổ chuyên môn)', [1, 1, 18, 1, 18, '', '', '', '']);
      addDataRow('- Văn phòng nhà trường', [1, 1, 40, 1, 40, '', '', '', '']);
      addDataRow('- Phòng thường trực (Bảo vệ)', [2, 1, 6.2, '', '', '', '', 1, 6.2]);
      addDataRow('- Nhà công vụ giáo viên', [0, '', '', '', '', '', '', '', '']);
      addDataRow('- Phòng kho lưu trữ tài liệu', [1, 1, 18, 1, 18, '', '', '', '']);

      // ── Blank separator ────────────────────────────────────────────────────
      const sepRow = ws.addRow([]);
      ws.mergeCells(`A${sepRow.number}:J${sepRow.number}`);
      ws.getCell(`A${sepRow.number}`).fill = fill('E8F5E9');
      sepRow.height = 8;

      // ── Section 7.1 ────────────────────────────────────────────────────────
      addEquipSectionHeader('7.1. Diện tích đất (Tính đến thời điểm hiện tại)', 6);
      addEquipRow('- Tổng diện tích khuôn viên đất', 'm²', 3943.3);
      addEquipRow('- Diện tích sân chơi', 'm²', 540);
      addEquipRow('- Diện tích sân vườn', 'm²', 250);

      // ── Section 7.2 ────────────────────────────────────────────────────────
      addEquipSectionHeader('7.2. Thiết bị dạy học và thiết bị CNTT', 6);
      addEquipRow('- Thiết bị dạy học tối thiểu', 'Bộ', 17);
      addEquipRow('- Thiết bị đồ chơi ngoài trời', 'Loại', 10);
      addEquipRow('- Tổng số máy tính đang được sử dụng', 'Bộ', 28);
      addEquipRow('- Tổng số đường truyền Internet', 'Bộ', 2);
      addEquipRow('- Số máy tính được kết nối Internet', 'Bộ', 28);
      addEquipRow('- Số máy tính phục vụ công tác Quản lý', 'Bộ', 8);
      addEquipRow('- Số máy tính phục vụ công tác Giảng dạy, Học tập', 'Bộ', 20);
      addEquipRow('- Máy chiếu', 'Chiếc', 2);
      addEquipRow('- Máy Photocopy', 'Chiếc', 1);
      addEquipRow('- Máy in', 'Chiếc', 6);
      addEquipRow('- Máy Scaner', 'Chiếc', 2);
      addEquipRow('- Máy ép Plastic', 'Chiếc', 0);
      addEquipRow('- Tivi dùng cho công tác quản lý', 'Chiếc', 4);
      addEquipRow('- Tivi dùng tại các phòng học', 'Chiếc', 17);
      addEquipRow('- Đàn phím điện tử', 'Chiếc', 2);
      addEquipRow('- Tủ đựng đồ', 'Chiếc', 51);

      // ── Footer ─────────────────────────────────────────────────────────────
      const lastR = ws.addRow([]);
      ws.mergeCells(`A${lastR.number}:J${lastR.number}`);
      ws.getCell(`A${lastR.number}`).value =
        `Mẫu tải về từ hệ thống Quản lý Tài sản – Trường MN Đức Xuân  |  ${new Date().toLocaleDateString('vi-VN')}`;
      ws.getCell(`A${lastR.number}`).font = font(9, false, '90A4AE', true);
      ws.getCell(`A${lastR.number}`).alignment = align('right');
      ws.getCell(`A${lastR.number}`).fill = fill('ECEFF1');
      lastR.height = 14;

      // ── Write & download ───────────────────────────────────────────────────
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau_co_so_vat_chat.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Tải file mẫu thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Không tải được file mẫu: ' + (err?.message || ''));
    }
  };

  const handleExportExcel = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Quản lý Tài sản - Trường MN Đức Xuân';
      wb.created = new Date();

      const ws = wb.addWorksheet('Danh sách tài sản', {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
        views: [{ state: 'frozen', xSplit: 0, ySplit: 6 }],
      });

      const COLS = [
        { header: 'STT', key: 'stt', width: 6 },  // A=1
        { header: 'Tên tài sản', key: 'name', width: 38 },  // B=2
        { header: 'Loại tài sản', key: 'category', width: 32 },  // C=3
        { header: 'Nhu cầu QĐ', key: 'requiredQuantity', width: 13 },  // D=4
        { header: 'Thực tế', key: 'quantity', width: 11 },  // E=5
        { header: 'Diện tích (m²)', key: 'area', width: 14 },  // F=6
        { header: 'Loại CT', key: 'constructionType', width: 14 },  // G=7
        { header: 'Tình trạng', key: 'condition', width: 13 },  // H=8
        { header: 'Ghi chú', key: 'notes', width: 22 },  // I=9
        { header: '1 chỗ ngồi', key: 'seats1', width: 11 },  // J=10 (phần 2)
        { header: '2 chỗ ngồi', key: 'seats2', width: 11 },  // K=11 (phần 2)
        { header: '4 chỗ ngồi', key: 'seats4', width: 11 },  // L=12 (phần 2)
      ];
      const NCOLS = COLS.length;
      ws.columns = COLS;

      // ── Palette ──────────────────────────────────────────────────────────────
      const CLR = {
        headerBg: '1A56DB', headerFg: 'FFFFFF',
        catBg: 'E8F0FE', catFg: '1A56DB',
        subtotalBg: 'EFF6FF', subtotalFg: '1E40AF',
        totalBg: 'DBEAFE', totalFg: '1E3A8A',
        rowEven: 'F8FAFF',
        rowOdd: 'FFFFFF',
        condGood: 'D1FAE5', condBad: 'FEF3C7', condBroken: 'FEE2E2',
        border: 'CBD5E1',
        titleBg: '1E40AF', titleFg: 'FFFFFF',
        subtitleBg: 'DBEAFE', subtitleFg: '1E3A8A',
      };

      const border = (color = CLR.border) => ({
        top: { style: 'thin', color: { argb: color } },
        left: { style: 'thin', color: { argb: color } },
        bottom: { style: 'thin', color: { argb: color } },
        right: { style: 'thin', color: { argb: color } },
      });

      const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

      const fontBold = (size = 10, color = '000000') => ({ name: 'Times New Roman', size, bold: true, color: { argb: color } });
      const fontNormal = (size = 10) => ({ name: 'Times New Roman', size });

      const center = { horizontal: 'center', vertical: 'middle', wrapText: true };
      const left = { horizontal: 'left', vertical: 'middle', wrapText: true };
      const right = { horizontal: 'right', vertical: 'middle', wrapText: true };

      const lastCol = String.fromCharCode(64 + NCOLS); // 'M' (13 cols)

      // ── Row 1: Logo / School name ─────────────────────────────────────────
      ws.addRow([]);
      const r1 = ws.getRow(1);
      r1.height = 22;
      ws.mergeCells(`A1:${lastCol}1`);
      const c1 = ws.getCell('A1');
      c1.value = 'TRƯỜNG MẦM NON ĐỨC XUÂN';
      c1.font = { name: 'Times New Roman', size: 13, bold: true, color: { argb: CLR.titleFg } };
      c1.fill = fill(CLR.titleBg);
      c1.alignment = center;

      // ── Row 2: Report title ───────────────────────────────────────────────
      ws.addRow([]);
      const r2 = ws.getRow(2);
      r2.height = 22;
      ws.mergeCells(`A2:${lastCol}2`);
      const c2 = ws.getCell('A2');
      c2.value = 'BÁO CÁO DANH SÁCH TÀI SẢN';
      c2.font = { name: 'Times New Roman', size: 13, bold: true, color: { argb: CLR.subtitleFg } };
      c2.fill = fill(CLR.subtitleBg);
      c2.alignment = center;

      // ── Row 3: Meta info ──────────────────────────────────────────────────
      ws.addRow([]);
      const r3 = ws.getRow(3);
      r3.height = 18;
      ws.mergeCells(`A3:E3`);
      const c3a = ws.getCell('A3');
      const now = new Date();
      c3a.value = `Ngày xuất: ${now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}   Giờ: ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
      c3a.font = fontNormal(10);
      c3a.alignment = left;
      ws.mergeCells(`F3:${lastCol}3`);
      const c3b = ws.getCell('F3');
      const filterDesc = [
        `Tổng: ${filtered.length} tài sản`,
        filterCategory ? `Loại: ${filterCategory}` : '',
        search ? `Tìm kiếm: "${search}"` : '',
      ].filter(Boolean).join('   |   ');
      c3b.value = filterDesc;
      c3b.font = fontNormal(10);
      c3b.alignment = right;

      // ── Row 4: Blank spacer ───────────────────────────────────────────────
      ws.addRow([]);
      ws.getRow(4).height = 6;

      // ── Row 5: Column headers ─────────────────────────────────────────────
      ws.addRow([]);
      const r5 = ws.getRow(5);
      r5.height = 30;
      COLS.forEach((col, i) => {
        const cell = r5.getCell(i + 1);
        cell.value = col.header;
        cell.font = fontBold(10, CLR.headerFg);
        cell.fill = fill(CLR.headerBg);
        cell.alignment = center;
        cell.border = border('90A8C3');
      });

      // ── Row 6: Unit row ───────────────────────────────────────────────────
      ws.addRow([]);
      const r6 = ws.getRow(6);
      r6.height = 18;
      const UNITS = ['', '', '', '', '', 'Cái/Phòng', 'Cái/Phòng', 'm²', '', '', ''];
      UNITS.forEach((u, i) => {
        const cell = r6.getCell(i + 1);
        cell.value = u;
        cell.font = { name: 'Times New Roman', size: 9, italic: true, color: { argb: '64748B' } };
        cell.fill = fill('EFF6FF');
        cell.alignment = center;
        cell.border = border('CBD5E1');
      });

      // ── Data rows, grouped by category ────────────────────────────────────
      const COND_COLOR = {
        'Tốt': 'D1FAE5',
        'Khá': 'D1FAE5',
        'Trung bình': 'FEF3C7',
        'Hỏng': 'FEE2E2',
        'Cần sửa': 'FEF3C7',
      };

      const catList = CATEGORY_OPTIONS.map(cat => ({
        cat,
        rows: filtered.filter(a => a.category === cat),
      })).filter(g => g.rows.length > 0);
      const uncatRows = filtered.filter(a => !CATEGORY_OPTIONS.includes(a.category));
      if (uncatRows.length) catList.push({ cat: 'Khác', rows: uncatRows });

      let rowIdx = 7;
      let grandReq = 0, grandAct = 0, grandCount = 0;

      catList.forEach(({ cat, rows }, gi) => {
        // Category header row
        const catRow = ws.getRow(rowIdx++);
        catRow.height = 20;
        ws.mergeCells(`A${rowIdx - 1}:${lastCol}${rowIdx - 1}`);
        const catCell = ws.getCell(`A${rowIdx - 1}`);
        catCell.value = `${gi + 1}.  ${cat}  (${rows.length} mục)`;
        catCell.font = fontBold(10, CLR.catFg);
        catCell.fill = fill(CLR.catBg);
        catCell.alignment = left;
        catCell.border = {
          top: { style: 'medium', color: { argb: '93B4F0' } },
          bottom: { style: 'medium', color: { argb: '93B4F0' } },
          left: { style: 'thin', color: { argb: CLR.border } },
          right: { style: 'thin', color: { argb: CLR.border } },
        };

        let catReq = 0, catAct = 0;

        rows.forEach((a, i) => {
          const isEven = i % 2 === 0;
          const dr = ws.getRow(rowIdx++);
          dr.height = 18;
          const isBanGhe = a.category === 'Số bàn, ghế ngồi';
          const vals = [
            i + 1,                                                              // A (1)
            a.name,                                                             // B (2)
            a.category,                                                         // C (3)
            a.requiredQuantity || 0,                                            // D (4)
            a.quantity || 0,                                                    // E (5)
            a.area != null ? a.area : '',                                       // F (6)
            a.constructionType !== 'Không áp dụng' ? a.constructionType : '',  // G (7)
            a.condition,                                                        // H (8)
            a.notes || '',                                                      // I (9)
            isBanGhe && a.seats1 != null ? a.seats1 : '',                      // J (10)
            isBanGhe && a.seats2 != null ? a.seats2 : '',                      // K (11)
            isBanGhe && a.seats4 != null ? a.seats4 : '',                      // L (12)
          ];
          vals.forEach((v, ci) => {
            const cell = dr.getCell(ci + 1);
            cell.value = v;
            cell.font = fontNormal(10);
            cell.fill = fill(isEven ? CLR.rowEven : CLR.rowOdd);
            cell.border = border(CLR.border);
            cell.alignment = ci === 0 ? center : (ci >= 4 && ci <= 6) || ci >= 10 ? { ...center } : left;
          });

          // Condition color highlight (col I = 9)
          const condColor = COND_COLOR[a.condition];
          if (condColor) {
            ws.getCell(`I${rowIdx - 1}`).fill = fill(condColor);
          }

          // Quantity vs required: highlight col F (6)
          const qty = a.quantity || 0;
          const req = a.requiredQuantity || 0;
          if (req > 0) {
            ws.getCell(`F${rowIdx - 1}`).font = {
              name: 'Times New Roman', size: 10,
              bold: true,
              color: { argb: qty >= req ? '059669' : 'D97706' },
            };
          }

          catReq += req;
          catAct += qty;
        });

        // Category subtotal row
        const subRow = ws.getRow(rowIdx++);
        subRow.height = 18;
        ws.mergeCells(`A${rowIdx - 1}:E${rowIdx - 1}`);
        ws.getCell(`A${rowIdx - 1}`).value = `Cộng: ${rows.length} mục`;
        ws.getCell(`A${rowIdx - 1}`).font = fontBold(10, CLR.subtotalFg);
        ws.getCell(`A${rowIdx - 1}`).fill = fill(CLR.subtotalBg);
        ws.getCell(`A${rowIdx - 1}`).alignment = right;
        ws.getCell(`A${rowIdx - 1}`).border = border('93B4F0');

        ws.getCell(`F${rowIdx - 1}`).value = catReq;
        ws.getCell(`F${rowIdx - 1}`).font = fontBold(10, CLR.subtotalFg);
        ws.getCell(`F${rowIdx - 1}`).fill = fill(CLR.subtotalBg);
        ws.getCell(`F${rowIdx - 1}`).alignment = center;
        ws.getCell(`F${rowIdx - 1}`).border = border('93B4F0');

        ws.getCell(`G${rowIdx - 1}`).value = catAct;
        ws.getCell(`G${rowIdx - 1}`).font = fontBold(10, CLR.subtotalFg);
        ws.getCell(`G${rowIdx - 1}`).fill = fill(CLR.subtotalBg);
        ws.getCell(`G${rowIdx - 1}`).alignment = center;
        ws.getCell(`G${rowIdx - 1}`).border = border('93B4F0');

        ['H', 'I', 'J', 'K', 'L', 'M'].forEach(col => {
          ws.getCell(`${col}${rowIdx - 1}`).fill = fill(CLR.subtotalBg);
          ws.getCell(`${col}${rowIdx - 1}`).border = border('93B4F0');
        });

        grandReq += catReq;
        grandAct += catAct;
        grandCount += rows.length;
      });

      // ── Grand total row ───────────────────────────────────────────────────
      const totalRow = ws.getRow(rowIdx++);
      totalRow.height = 22;
      ws.mergeCells(`A${rowIdx - 1}:E${rowIdx - 1}`);
      ws.getCell(`A${rowIdx - 1}`).value = `TỔNG CỘNG: ${grandCount} tài sản`;
      ws.getCell(`A${rowIdx - 1}`).font = fontBold(11, CLR.totalFg);
      ws.getCell(`A${rowIdx - 1}`).fill = fill(CLR.totalBg);
      ws.getCell(`A${rowIdx - 1}`).alignment = center;
      ws.getCell(`A${rowIdx - 1}`).border = { top: { style: 'medium', color: { argb: '3B82F6' } }, bottom: { style: 'medium', color: { argb: '3B82F6' } }, left: border().left, right: border().right };

      ws.getCell(`F${rowIdx - 1}`).value = grandReq;
      ws.getCell(`F${rowIdx - 1}`).font = fontBold(11, CLR.totalFg);
      ws.getCell(`F${rowIdx - 1}`).fill = fill(CLR.totalBg);
      ws.getCell(`F${rowIdx - 1}`).alignment = center;
      ws.getCell(`F${rowIdx - 1}`).border = ws.getCell(`A${rowIdx - 1}`).border;

      ws.getCell(`G${rowIdx - 1}`).value = grandAct;
      ws.getCell(`G${rowIdx - 1}`).font = fontBold(11, CLR.totalFg);
      ws.getCell(`G${rowIdx - 1}`).fill = fill(CLR.totalBg);
      ws.getCell(`G${rowIdx - 1}`).alignment = center;
      ws.getCell(`G${rowIdx - 1}`).border = ws.getCell(`A${rowIdx - 1}`).border;

      ['H', 'I', 'J', 'K', 'L', 'M'].forEach(col => {
        ws.getCell(`${col}${rowIdx - 1}`).fill = fill(CLR.totalBg);
        ws.getCell(`${col}${rowIdx - 1}`).border = ws.getCell(`A${rowIdx - 1}`).border;
      });

      // ── Footer row ────────────────────────────────────────────────────────
      const footerRow = ws.getRow(rowIdx);
      footerRow.height = 14;
      ws.mergeCells(`A${rowIdx}:${lastCol}${rowIdx}`);
      ws.getCell(`A${rowIdx}`).value = `Xuất bởi hệ thống Quản lý Tài sản – Trường MN Đức Xuân  |  ${now.toLocaleString('vi-VN')}`;
      ws.getCell(`A${rowIdx}`).font = { name: 'Times New Roman', size: 9, italic: true, color: { argb: '94A3B8' } };
      ws.getCell(`A${rowIdx}`).alignment = right;

      // ── Auto-filter on header row ─────────────────────────────────────────
      ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: NCOLS } };

      // ── Generate & download ───────────────────────────────────────────────
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = now.toISOString().slice(0, 10);
      a.href = url;
      a.download = `tai-san-${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Xuất Excel thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Xuất Excel thất bại: ' + (err?.message || 'Lỗi không xác định'));
    }
  };

  const handleBulkImport = async () => {
    if (!importPreview.length) return;
    setImporting(true);
    try {
      const res = await post(ENDPOINTS.SCHOOL_ADMIN.ASSETS_BULK, { assets: importPreview });
      const { created, skipped, errors } = res?.data || {};
      toast.success(`Nhập thành công ${created} tài sản${skipped ? `, bỏ qua ${skipped}` : ''}.`);
      if (errors?.length) toast.warning(errors.slice(0, 3).join(' | '));
      setImportOpen(false);
      setImportPreview([]);
      load();
    } catch (err) {
      toast.error(err?.message || 'Nhập thất bại.');
    } finally {
      setImporting(false);
    }
  };

  const filtered = assets.filter(a => {
    const matchSearch = !search ||
      a.name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || a.category === filterCategory;
    return matchSearch && matchCategory;
  });

  // Khi search: chỉ hiện nhóm có dữ liệu; khi không search: giữ tất cả section
  const grouped = CATEGORY_OPTIONS.map(cat => ({
    cat,
    rows: filtered.filter(a => a.category === cat),
  })).filter(g => (!search && !filterCategory) || g.rows.length > 0);
  const uncategorized = filtered.filter(a => !CATEGORY_OPTIONS.includes(a.category));
  if (uncategorized.length) grouped.push({ cat: 'Khác', rows: uncategorized });

  // Tổng hợp nhanh
  const totalRequired = filtered.reduce((s, a) => s + (a.requiredQuantity || 0), 0);
  const totalActual = filtered.reduce((s, a) => s + (a.quantity || 0), 0);

  return (
    <Box>
      {/* Toolbar */}
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} mb={2} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Tìm kiếm theo tên tài sản..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 220, flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Loại tài sản</InputLabel>
          <Select
            value={filterCategory}
            label="Loại tài sản"
            onChange={e => setFilterCategory(e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {CATEGORY_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => importRef.current?.click()} sx={{ whiteSpace: 'nowrap', textTransform: 'none' }}>
          Import Excel
        </Button>
        <input ref={importRef} hidden type="file" accept=".xlsx,.xls" onChange={handleImportFile} />
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate} sx={{ whiteSpace: 'nowrap', textTransform: 'none' }}>
          Tải mẫu
        </Button>
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={handleExportExcel}
          sx={{ whiteSpace: 'nowrap', textTransform: 'none', borderColor: '#059669', color: '#059669', '&:hover': { borderColor: '#047857', backgroundColor: '#F0FDF4' } }}
        >
          Xuất Excel
        </Button>
      </Stack>


      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : (
        <>
          {(() => {
            const elements = [];
            let section7Rendered = false;

            grouped.forEach(({ cat, rows }, gi) => {
              const isSection7 = SECTION7_CATEGORIES.includes(cat);

              // Helper: toggle all rows in this group
              const toggleGroupAll = () => {
                const allSelected = rows.every(a => selected.has(a._id));
                setSelected(prev => {
                  const next = new Set(prev);
                  rows.forEach(a => allSelected ? next.delete(a._id) : next.add(a._id));
                  return next;
                });
              };

              // Nút thêm nhanh vào đúng danh mục
              const addBtn = (
                <Tooltip title={`Thêm vào "${cat}"`}>
                  <IconButton size="small" color="primary" onClick={() => handleOpen({ category: cat })}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              );

              if (isSection7) {
                // Render parent "7. Cơ sở vật chất khác" header only once
                if (!section7Rendered) {
                  section7Rendered = true;
                  elements.push(
                    <Box key="section7-parent" sx={{ backgroundColor: '#d1e3ff', borderLeft: '4px solid #1a56db', px: 1.5, py: 0.75, mt: 2, mb: 0.5, borderRadius: '4px' }}>
                      <Typography fontWeight={700} fontSize="0.9rem" color="#1a56db">
                        7. Cơ sở vật chất khác
                      </Typography>
                    </Box>
                  );
                }

                // Sub-section header + table with ĐVT / Số lượng columns
                elements.push(
                  <Box key={`section7-${gi}`} mb={2} ml={2}>
                    <Box sx={{ backgroundColor: '#e8f0fe', borderLeft: '3px solid #4f86e8', px: 1.5, py: 0.6, borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography fontWeight={700} fontSize="0.82rem" color="#1a56db" display="inline">
                          {SECTION7_SUB_LABELS[cat] || cat}
                        </Typography>
                        <Typography component="span" fontWeight={400} color="text.secondary" ml={1} fontSize="0.75rem">
                          ({rows.length} mục)
                        </Typography>
                      </Box>
                      {addBtn}
                    </Box>
                    <TableContainer sx={{ border: '1px solid #c7d7f8', borderTop: 'none', borderRadius: '0 0 4px 4px', maxHeight: 360, overflow: 'auto' }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox" sx={{ backgroundColor: '#f0f4f8', fontWeight: 700 }}>
                              <Tooltip title="Chọn/bỏ chọn tất cả trong nhóm này">
                                <Checkbox
                                  size="small"
                                  checked={rows.length > 0 && rows.every(a => selected.has(a._id))}
                                  indeterminate={rows.some(a => selected.has(a._id)) && !rows.every(a => selected.has(a._id))}
                                  onChange={toggleGroupAll}
                                />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8' }}>Tên tài sản</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8' }} align="center">ĐVT</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8' }} align="center">Tổng kho</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8' }} align="center">Đã phân bổ</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8' }} align="center">Còn lại</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8' }} align="center">Tình trạng</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8' }} align="center">Xóa</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} align="center" sx={{ py: 2, color: 'text.secondary', fontSize: '0.8rem' }}>
                                Chưa có dữ liệu — nhấn <strong>+</strong> để thêm
                              </TableCell>
                            </TableRow>
                          ) : rows.map(a => (
                            <TableRow key={a._id} hover selected={selected.has(a._id)}>
                              <TableCell padding="checkbox">
                                <Checkbox size="small" checked={selected.has(a._id)} onChange={() => toggleSelect(a._id)} />
                              </TableCell>
                              <InlineCell a={a} field="name" isText ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave} />
                              <InlineSelectCell a={a} field="unit" options={UNIT_OPTIONS} align="center" ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave} />
                              <InlineCell a={a} field="quantity" align="center" ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave} sx={{ fontWeight: 600 }} />
                              <TableCell align="center" sx={{ color: 'info.main', fontWeight: 500 }}>{a.allocatedQty ?? 0}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, color: (a.remainingQty ?? a.quantity ?? 0) > 0 ? 'success.main' : 'error.main' }}>{a.remainingQty ?? a.quantity ?? 0}</TableCell>
                              <InlineSelectCell a={a} field="condition" options={CONDITION_OPTIONS} ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave}
                                renderValue={v => <Chip label={v} color={CONDITION_COLOR[v] || 'default'} size="small" />} />
                              <TableCell align="center">
                                <IconButton size="small" color="error" onClick={() => setDeleteTarget(a)}><DeleteIcon fontSize="small" /></IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                );
              } else if (cat === 'Số bàn, ghế ngồi') {
                // ── Section 2: Số bàn, ghế ngồi – sticky header + inline edit ──
                const hSx2 = { fontWeight: 700, backgroundColor: '#f0f4f8' };

                elements.push(
                  <Box key={`section-${gi}`} mb={3}>
                    <Box sx={{ backgroundColor: '#e8f0fe', borderLeft: '4px solid #1a56db', px: 1.5, py: 0.75, borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography fontWeight={700} fontSize="0.85rem" color="#1a56db" display="inline">2. Số bàn, ghế ngồi</Typography>
                        <Typography component="span" fontWeight={400} color="text.secondary" ml={1} fontSize="0.75rem">({rows.length} mục) — click vào ô để chỉnh sửa</Typography>
                      </Box>
                      {addBtn}
                    </Box>
                    <TableContainer sx={{ border: '1px solid #c7d7f8', borderTop: 'none', borderRadius: '0 0 4px 4px', maxHeight: 400, overflow: 'auto' }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox" rowSpan={2} sx={{ ...hSx2, verticalAlign: 'middle' }}>
                              <Tooltip title="Chọn/bỏ chọn tất cả">
                                <Checkbox
                                  size="small"
                                  checked={rows.length > 0 && rows.every(a => selected.has(a._id))}
                                  indeterminate={rows.some(a => selected.has(a._id)) && !rows.every(a => selected.has(a._id))}
                                  onChange={toggleGroupAll}
                                />
                              </Tooltip>
                            </TableCell>
                            {['Tên tài sản', 'Nhu cầu QĐ', 'Tổng số chỗ ngồi'].map(h => (
                              <TableCell key={h} rowSpan={2} align="center" sx={{ ...hSx2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                {h}
                              </TableCell>
                            ))}
                            <TableCell colSpan={3} align="center" sx={{ ...hSx2, borderBottom: '1px solid #c7d7f8' }}>
                              Trong đó
                            </TableCell>
                            <TableCell rowSpan={2} align="center" sx={{ ...hSx2, verticalAlign: 'middle' }}>Đã phân bổ</TableCell>
                            <TableCell rowSpan={2} align="center" sx={{ ...hSx2, verticalAlign: 'middle' }}>Còn lại</TableCell>
                            <TableCell rowSpan={2} align="center" sx={{ ...hSx2, verticalAlign: 'middle' }}>Tình trạng</TableCell>
                            <TableCell rowSpan={2} align="center" sx={{ ...hSx2, verticalAlign: 'middle' }}>Xóa</TableCell>
                          </TableRow>
                          <TableRow>
                            {['1 chỗ ngồi', '2 chỗ ngồi', '4 chỗ ngồi'].map(h => (
                              <TableCell key={h} align="center" sx={{ ...hSx2, top: 33 }}>
                                {h}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={10} align="center" sx={{ py: 2, color: 'text.secondary', fontSize: '0.8rem' }}>
                                Chưa có dữ liệu — nhấn <strong>+</strong> để thêm
                              </TableCell>
                            </TableRow>
                          ) : rows.map(a => (
                            <TableRow key={a._id} hover selected={selected.has(a._id)}>
                              <TableCell padding="checkbox">
                                <Checkbox size="small" checked={selected.has(a._id)} onChange={() => toggleSelect(a._id)} />
                              </TableCell>
                              <InlineCell a={a} field="name" isText ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave} />
                              <InlineCell a={a} field="requiredQuantity" align="center" ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave} />
                              <InlineCell a={a} field="quantity" align="center" ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave}
                                sx={{ fontWeight: 600, color: (a.quantity || 0) >= (a.requiredQuantity || 0) ? 'success.main' : 'warning.main' }} />
                              <InlineCell a={a} field="seats1" align="center" ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave} />
                              <InlineCell a={a} field="seats2" align="center" ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave} />
                              <InlineCell a={a} field="seats4" align="center" ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave} />
                              <TableCell align="center" sx={{ color: 'info.main', fontWeight: 500 }}>{a.allocatedQty ?? 0}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, color: (a.remainingQty ?? a.quantity ?? 0) > 0 ? 'success.main' : 'error.main' }}>{a.remainingQty ?? a.quantity ?? 0}</TableCell>
                              <InlineSelectCell a={a} field="condition" options={CONDITION_OPTIONS} ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave}
                                renderValue={v => <Chip label={v} color={CONDITION_COLOR[v] || 'default'} size="small" />} />
                              <TableCell align="center">
                                <IconButton size="small" color="error" onClick={() => setDeleteTarget(a)}><DeleteIcon fontSize="small" /></IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                );
              } else {
                // Sections 1, 3-6
                const catIndex = CATEGORY_OPTIONS.indexOf(cat);
                const catLabel = catIndex >= 0 ? `${catIndex + 1}. ${cat}` : cat;
                const hSx = { fontWeight: 700, backgroundColor: '#f0f4f8' };
                elements.push(
                  <Box key={`section-${gi}`} mb={3}>
                    <Box sx={{ backgroundColor: '#e8f0fe', borderLeft: '4px solid #1a56db', px: 1.5, py: 0.75, borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography fontWeight={700} fontSize="0.85rem" color="#1a56db" display="inline">{catLabel}</Typography>
                        <Typography component="span" fontWeight={400} color="text.secondary" ml={1} fontSize="0.75rem">({rows.length} mục) — click vào ô để chỉnh sửa</Typography>
                      </Box>
                      {addBtn}
                    </Box>
                    <TableContainer sx={{ border: '1px solid #c7d7f8', borderTop: 'none', borderRadius: '0 0 4px 4px', maxHeight: 400, overflow: 'auto' }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox" sx={hSx}>
                              <Tooltip title="Chọn/bỏ chọn tất cả trong nhóm này">
                                <Checkbox
                                  size="small"
                                  checked={rows.length > 0 && rows.every(a => selected.has(a._id))}
                                  indeterminate={rows.some(a => selected.has(a._id)) && !rows.every(a => selected.has(a._id))}
                                  onChange={toggleGroupAll}
                                />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={hSx}>Tên tài sản</TableCell>
                            <TableCell sx={hSx} align="center">Nhu cầu QĐ</TableCell>
                            <TableCell sx={hSx} align="center">Thực tế</TableCell>
                            {!isMobile && <TableCell sx={hSx} align="center">Diện tích (m²)</TableCell>}
                            {!isMobile && <TableCell sx={hSx} align="center">Loại CT</TableCell>}
                            <TableCell sx={hSx} align="center">Tình trạng</TableCell>
                            <TableCell sx={hSx} align="center">Xóa</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} align="center" sx={{ py: 2, color: 'text.secondary', fontSize: '0.8rem' }}>
                                Chưa có dữ liệu — nhấn <strong>+</strong> để thêm
                              </TableCell>
                            </TableRow>
                          ) : rows.map(a => (
                            <TableRow key={a._id} hover selected={selected.has(a._id)}>
                              <TableCell padding="checkbox">
                                <Checkbox size="small" checked={selected.has(a._id)} onChange={() => toggleSelect(a._id)} />
                              </TableCell>
                              <InlineCell a={a} field="name" isText ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave} />
                              <InlineCell a={a} field="requiredQuantity" align="center" ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave} />
                              <InlineCell a={a} field="quantity" align="center" ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave}
                                sx={{ fontWeight: 600, color: (a.quantity || 0) >= (a.requiredQuantity || 0) ? 'success.main' : 'warning.main' }} />
                              {!isMobile && <InlineCell a={a} field="area" align="center" ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave} />}
                              {!isMobile && (
                                <InlineSelectCell a={a} field="constructionType" options={CONSTRUCTION_OPTIONS} ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave}
                                  renderValue={v => v !== 'Không áp dụng'
                                    ? <Chip label={v} size="small" variant="outlined" color="info" />
                                    : '—'} />
                              )}
                              <InlineSelectCell a={a} field="condition" options={CONDITION_OPTIONS} ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave}
                                renderValue={v => <Chip label={v} color={CONDITION_COLOR[v] || 'default'} size="small" />} />
                              <TableCell align="center">
                                <IconButton size="small" color="error" onClick={() => setDeleteTarget(a)}><DeleteIcon fontSize="small" /></IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                );
              }
            });

            return elements;
          })()}

        </>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Cập nhật tài sản' : 'Thêm tài sản mới'}</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            <Stack direction="row" gap={1}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Loại tài sản</InputLabel>
                <Select
                  value={form.category}
                  label="Loại tài sản"
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORY_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>

            {SECTION7_CATEGORIES.includes(form.category) ? (
              <Autocomplete
                freeSolo
                options={(SECTION7_PRESETS[form.category] || []).map(p => p.name)}
                value={form.name}
                onInputChange={(_, v) => setForm(p => ({ ...p, name: v }))}
                onChange={(_, v) => {
                  if (!v) return;
                  const preset = (SECTION7_PRESETS[form.category] || []).find(p => p.name === v);
                  setForm(p => ({ ...p, name: v, ...(preset ? { unit: preset.unit } : {}) }));
                }}
                size="small"
                fullWidth
                renderInput={params => <TextField {...params} label="Tên tài sản *" size="small" />}
              />
            ) : (
              <TextField
                label="Tên tài sản *"
                size="small"
                fullWidth
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            )}

            <Divider><Typography variant="caption" color="text.secondary">Số lượng</Typography></Divider>

            {SECTION7_CATEGORIES.includes(form.category) ? (
              /* Mục 7: chỉ cần ĐVT + Số lượng */
              <Stack direction="row" gap={1}>
                <Autocomplete
                  freeSolo
                  options={UNIT_OPTIONS}
                  value={form.unit || ''}
                  onInputChange={(_, v) => setForm(p => ({ ...p, unit: v }))}
                  onChange={(_, v) => setForm(p => ({ ...p, unit: v || '' }))}
                  size="small"
                  sx={{ flex: 1 }}
                  renderInput={params => <TextField {...params} label="ĐVT (đơn vị tính)" size="small" />}
                />
                <TextField
                  label="Số lượng"
                  size="small"
                  type="number"
                  inputProps={{ min: 0, step: 0.1 }}
                  sx={{ flex: 1 }}
                  value={form.quantity}
                  onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))}
                />
              </Stack>
            ) : form.category === 'Số bàn, ghế ngồi' ? (
              /* Mục 2: Số bàn, ghế ngồi */
              <>
                <Stack direction="row" gap={1}>
                  <TextField
                    label="Nhu cầu theo QĐ"
                    size="small" type="number" inputProps={{ min: 0 }} sx={{ flex: 1 }}
                    value={form.requiredQuantity}
                    onChange={e => setForm(p => ({ ...p, requiredQuantity: Number(e.target.value) }))}
                  />
                  <TextField
                    label="Tổng số chỗ ngồi"
                    size="small" type="number" inputProps={{ min: 0 }} sx={{ flex: 1 }}
                    value={form.quantity}
                    onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))}
                  />
                </Stack>
                <Divider><Typography variant="caption" color="text.secondary">Trong đó</Typography></Divider>
                <Stack direction="row" gap={1}>
                  <TextField
                    label="1 chỗ ngồi"
                    size="small" type="number" inputProps={{ min: 0 }} sx={{ flex: 1 }}
                    value={form.seats1 ?? ''}
                    onChange={e => setForm(p => ({ ...p, seats1: e.target.value === '' ? null : Number(e.target.value) }))}
                  />
                  <TextField
                    label="2 chỗ ngồi"
                    size="small" type="number" inputProps={{ min: 0 }} sx={{ flex: 1 }}
                    value={form.seats2 ?? ''}
                    onChange={e => setForm(p => ({ ...p, seats2: e.target.value === '' ? null : Number(e.target.value) }))}
                  />
                  <TextField
                    label="4 chỗ ngồi"
                    size="small" type="number" inputProps={{ min: 0 }} sx={{ flex: 1 }}
                    value={form.seats4 ?? ''}
                    onChange={e => setForm(p => ({ ...p, seats4: e.target.value === '' ? null : Number(e.target.value) }))}
                  />
                </Stack>
              </>
            ) : (
              /* Mục 1, 3-6: Nhu cầu QĐ + Thực tế + Diện tích + Loại CT */
              <>
                <Stack direction="row" gap={1}>
                  <TextField
                    label="Nhu cầu theo QĐ"
                    size="small"
                    type="number"
                    inputProps={{ min: 0 }}
                    sx={{ flex: 1 }}
                    value={form.requiredQuantity}
                    onChange={e => setForm(p => ({ ...p, requiredQuantity: Number(e.target.value) }))}
                  />
                  <TextField
                    label="Số lượng thực tế"
                    size="small"
                    type="number"
                    inputProps={{ min: 0 }}
                    sx={{ flex: 1 }}
                    value={form.quantity}
                    onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))}
                  />
                </Stack>

                <Divider><Typography variant="caption" color="text.secondary">Cơ sở vật chất</Typography></Divider>

                <Stack direction="row" gap={1}>
                  <TextField
                    label="Diện tích (m²)"
                    size="small"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    sx={{ flex: 1 }}
                    value={form.area}
                    onChange={e => setForm(p => ({ ...p, area: e.target.value }))}
                    helperText="Áp dụng cho phòng học"
                  />
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Loại công trình</InputLabel>
                    <Select
                      value={form.constructionType}
                      label="Loại công trình"
                      onChange={e => setForm(p => ({ ...p, constructionType: e.target.value }))}
                    >
                      {CONSTRUCTION_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Stack>
              </>
            )}

            <Divider><Typography variant="caption" color="text.secondary">Tình trạng</Typography></Divider>

            <FormControl size="small" fullWidth>
              <InputLabel>Tình trạng</InputLabel>
              <Select
                value={form.condition}
                label="Tình trạng"
                onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}
              >
                {CONDITION_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField
              label="Ghi chú"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={handleClose} disabled={saving}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : editId ? 'Cập nhật' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa tài sản"
        message={`Bạn có chắc muốn xóa tài sản "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {/* Bulk Delete Confirm */}
      <Dialog open={bulkDeleteOpen} onClose={() => !bulkDeleting && setBulkDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Xác nhận xóa hàng loạt</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Bạn có chắc muốn xóa <strong>{selected.size}</strong> tài sản đã chọn? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting}>Hủy</Button>
          <Button variant="contained" color="error" onClick={handleBulkDelete} disabled={bulkDeleting}>
            {bulkDeleting ? 'Đang xóa...' : `Xóa ${selected.size} mục`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Preview Dialog */}
      <Dialog open={importOpen} onClose={() => !importing && setImportOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Xem trước dữ liệu Import ({importPreview.length} dòng)</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ overflowX: 'auto', maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f0f4f8' }}>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tên tài sản</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Loại</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Nhu cầu QĐ</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Thực tế</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Diện tích</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Loại CT</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tình trạng</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Ghi chú</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {importPreview.map((row, i) => (
                  <TableRow key={i} hover sx={!row.name ? { backgroundColor: '#fff3cd' } : {}}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell sx={{ color: !row.name ? 'error.main' : 'inherit' }}>{row.name || '(trống)'}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell align="center">{row.requiredQuantity}</TableCell>
                    <TableCell align="center">{row.quantity}</TableCell>
                    <TableCell align="center">{row.area ?? '—'}</TableCell>
                    <TableCell>{row.constructionType}</TableCell>
                    <TableCell>{row.condition}</TableCell>
                    <TableCell>{row.notes || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          <Box px={2} py={1}>
            <Typography variant="caption" color="text.secondary">
              Các dòng thiếu Mã TS hoặc Tên sẽ bị bỏ qua. Mã trùng với dữ liệu đã có cũng sẽ bị bỏ qua.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setImportOpen(false)} disabled={importing}>Hủy</Button>
          <Button variant="contained" onClick={handleBulkImport} disabled={importing}>
            {importing ? 'Đang nhập...' : `Nhập ${importPreview.length} tài sản`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating bulk-action bar */}
      {selected.size > 0 && (
        <Box sx={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1300,
          backgroundColor: '#1e293b',
          color: '#fff',
          borderRadius: 3,
          px: 3, py: 1.2,
          display: 'flex', alignItems: 'center', gap: 2,
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
          whiteSpace: 'nowrap',
        }}>
          <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>
            Đã chọn <strong style={{ color: '#fff' }}>{selected.size}</strong> mục
          </Typography>
          <Button
            size="small"
            variant="text"
            sx={{ color: '#94a3b8', textTransform: 'none', minWidth: 0 }}
            onClick={() => setSelected(new Set())}
          >
            Bỏ chọn
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<DeleteIcon fontSize="small" />}
            onClick={() => setBulkDeleteOpen(true)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Xóa {selected.size} mục
          </Button>
        </Box>
      )}
    </Box>
  );
}

// ─── Warehouse Assets Tab ─────────────────────────────────────────────────────
const WAREHOUSE_CATEGORIES = ['Đồ dùng', 'Thiết bị dạy học, đồ chơi và học liệu', 'Sách, tài liệu, băng đĩa', 'Thiết bị ngoài thông tư'];
const WAREHOUSE_PAGE_SIZE = 10;

function getCells(row) {
  return Array.from(row.querySelectorAll('td, th')).map(c => c.textContent.replace(/\s+/g, ' ').trim());
}

function parseWordDoc(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tables = doc.querySelectorAll('table');
  const items = [];

  const CATEGORY_MAP = { 'I': 'Đồ dùng', 'II': 'Thiết bị dạy học, đồ chơi và học liệu', 'III': 'Sách, tài liệu, băng đĩa' };

  tables.forEach(table => {
    const rows = Array.from(table.querySelectorAll('tr'));
    const hasRomanHeader = rows.some(row => {
      const cells = getCells(row);
      return ['I', 'II', 'III'].includes(cells[0]);
    });
    const tableText = table.textContent.toUpperCase();
    const isNgoaiThongTu = tableText.includes('NGOÀI THÔNG TƯ') && !hasRomanHeader;

    if (hasRomanHeader) {
      let currentCategory = null;
      rows.forEach(row => {
        const cells = getCells(row);
        if (cells.length < 3) return;
        const first = cells[0];
        if (CATEGORY_MAP[first]) { currentCategory = CATEGORY_MAP[first]; return; }
        if (first === 'TT' || (first === '1' && cells[1] === '2')) return;
        const rowNum = parseInt(first);
        if (isNaN(rowNum) || rowNum < 1 || !currentCategory || !cells[2]) return;
        items.push({
          assetCode: cells[1] || '',
          name: cells[2],
          category: currentCategory,
          unit: cells[3] || 'Cái',
          quantity: parseInt(cells[4]) || 0,
          condition: 'Tốt',
          notes: cells[6] || '',
        });
      });
    } else if (isNgoaiThongTu) {
      rows.forEach(row => {
        const cells = getCells(row);
        const rowNum = parseInt(cells[0]);
        if (isNaN(rowNum) || rowNum <= 1) return;
        const name = cells[1];
        if (!name || isNaN(parseInt(cells[3])) && cells[3] !== '' && cells[3] !== '0') return;
        items.push({
          assetCode: '',
          name,
          category: 'Thiết bị ngoài thông tư',
          unit: cells[2] || 'Cái',
          quantity: parseInt(cells[3]) || 0,
          condition: 'Tốt',
          notes: cells[5] || '',
        });
      });
    }
  });

  return items;
}

function normalizeWarehouseCategory(rawCategory, isExtra = false) {
  if (isExtra) return 'Thiết bị ngoài thông tư';
  const normalized = String(rawCategory || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/^i\b|do dung/.test(normalized) || normalized.includes('do dung')) return 'Đồ dùng';
  if (/^ii\b|day hoc|do choi|hoc lieu/.test(normalized) || normalized.includes('day hoc') || normalized.includes('do choi') || normalized.includes('hoc lieu')) return 'Thiết bị dạy học, đồ chơi và học liệu';
  if (/^iii\b|sach|tai lieu|bang dia/.test(normalized) || normalized.includes('sach') || normalized.includes('tai lieu') || normalized.includes('bang dia')) return 'Sách, tài liệu, băng đĩa';
  if (/ngoai thong tu/.test(normalized)) return 'Thiết bị ngoài thông tư';
  return 'Đồ dùng';
}

function inferWarehouseCategoryFromCode(assetCode) {
  const code = String(assetCode || '').trim().toUpperCase();
  if (!code) return '';
  if (code.startsWith('TBNT')) return 'Thiết bị ngoài thông tư';
  if (/^MN?561\d+/.test(code) || /^561\d+/.test(code)) return 'Đồ dùng';
  if (/^MN?562\d+/.test(code) || /^562\d+/.test(code)) return 'Thiết bị dạy học, đồ chơi và học liệu';
  if (/^MN?563\d+/.test(code) || /^563\d+/.test(code)) return 'Sách, tài liệu, băng đĩa';
  return '';
}

function mapImportedRowsToWarehouse(assets = [], extraAssets = []) {
  const rows = [];
  assets.forEach((item) => {
    const name = String(item?.name || '').trim();
    if (!name) return;
    const assetCode = String(item?.assetCode || '').trim();
    const normalizedCategory = normalizeWarehouseCategory(item?.category);
    const inferredCategory = inferWarehouseCategoryFromCode(assetCode);
    const finalCategory = (
      !String(item?.category || '').trim()
      || (normalizedCategory === 'Đồ dùng' && inferredCategory && inferredCategory !== 'Đồ dùng')
      || inferredCategory === 'Thiết bị ngoài thông tư'
    ) ? (inferredCategory || normalizedCategory) : normalizedCategory;
    rows.push({
      assetCode,
      name,
      category: finalCategory,
      unit: String(item?.unit || '').trim() || 'Cái',
      quantity: Number(item?.quantity) || 0,
      goodQuantity: Number(item?.quantity) || 0,
      brokenQuantity: 0,
      condition: 'Còn tốt',
      notes: String(item?.notes || '').trim(),
    });
  });
  extraAssets.forEach((item) => {
    const name = String(item?.name || '').trim();
    if (!name) return;
    rows.push({
      assetCode: String(item?.assetCode || '').trim(),
      name,
      category: normalizeWarehouseCategory(item?.category, true),
      unit: String(item?.unit || '').trim() || 'Cái',
      quantity: Number(item?.quantity) || 0,
      goodQuantity: Number(item?.quantity) || 0,
      brokenQuantity: 0,
      condition: 'Còn tốt',
      notes: String(item?.notes || '').trim(),
    });
  });
  return rows;
}
const WAREHOUSE_CATEGORY_PREFIX = { 'Đồ dùng': 'I', 'Thiết bị dạy học, đồ chơi và học liệu': 'II', 'Sách, tài liệu, băng đĩa': 'III', 'Thiết bị ngoài thông tư': 'IV' };
const emptyWarehouseAsset = () => ({ assetCode: '', name: '', category: 'Đồ dùng', unit: 'Cái', quantity: 0, goodQuantity: 0, brokenQuantity: 0, condition: 'Còn tốt' });

function deriveWarehouseQuantities(asset) {
  const total = Number(asset?.quantity) || 0;
  const hasGood = asset?.goodQuantity !== undefined && asset?.goodQuantity !== null;
  const hasBroken = asset?.brokenQuantity !== undefined && asset?.brokenQuantity !== null;
  if (hasGood || hasBroken) {
    const good = Math.max(0, Number(asset?.goodQuantity) || 0);
    const broken = Math.max(0, Number(asset?.brokenQuantity) || 0);
    return { good, broken, total: good + broken };
  }
  const condition = normalizeCondition(asset?.condition);
  if (condition === 'Đã hỏng') return { good: 0, broken: total, total };
  return { good: total, broken: 0, total };
}

function WarehouseAssetsTab() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(emptyWarehouseAsset());
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importItems, setImportItems] = useState([]);
  const [importing, setImporting] = useState(false);
  const [categoryPage, setCategoryPage] = useState({});
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.ASSETS + '?type=asset');
      setAssets((res?.data?.assets || []).map((a) => {
        const q = deriveWarehouseQuantities(a);
        return { ...a, quantity: q.total, goodQuantity: q.good, brokenQuantity: q.broken, condition: normalizeCondition(a.condition) };
      }));
    } catch (err) {
      toast.error(err?.message || 'Không tải được danh sách tài sản.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    setSelected((prev) => {
      if (!prev.size) return prev;
      const validIds = new Set(assets.map((a) => String(a._id)));
      const next = new Set([...prev].filter((id) => validIds.has(String(id))));
      return next;
    });
  }, [assets]);
  useEffect(() => { setCategoryPage({}); }, [search]);

  const handleSave = async () => {
    if (!form.assetCode.trim()) return toast.warn('Mã tài sản không được để trống.');
    if (!form.name.trim()) return toast.warn('Tên tài sản không được để trống.');
    if (!form.unit?.trim()) return toast.warn('Đơn vị tính không được để trống.');
    const goodQuantity = Number(form.goodQuantity);
    const brokenQuantity = Number(form.brokenQuantity);
    if (Number.isNaN(goodQuantity) || goodQuantity < 0) return toast.warn('Số lượng còn tốt không hợp lệ.');
    if (Number.isNaN(brokenQuantity) || brokenQuantity < 0) return toast.warn('Số lượng đã hỏng không hợp lệ.');
    const quantity = goodQuantity + brokenQuantity;
    setSaving(true);
    try {
      const payload = {
        type: 'asset',
        assetCode: form.assetCode.trim(),
        name: form.name.trim(),
        category: form.category,
        unit: form.unit.trim(),
        quantity,
        goodQuantity,
        brokenQuantity,
        condition: brokenQuantity > 0 ? 'Đã hỏng' : 'Còn tốt',
      };
      if (editId) {
        await put(ENDPOINTS.SCHOOL_ADMIN.ASSET_DETAIL(editId), payload);
        setAssets(prev => prev.map(a => a._id === editId ? { ...a, ...payload } : a));
        toast.success('Cập nhật thành công.');
      } else {
        const res = await post(ENDPOINTS.SCHOOL_ADMIN.ASSETS, payload);
        setAssets(prev => [...prev, res.data.asset]);
        toast.success('Thêm tài sản thành công.');
      }
      setOpenModal(false); setForm(emptyWarehouseAsset()); setEditId(null);
    } catch (err) {
      toast.error(err?.message || 'Lỗi khi lưu.');
    } finally { setSaving(false); }
  };

  const handleQuickDelete = async (asset) => {
    if (!asset?._id) return;
    setDeletingId(asset._id);
    try {
      await del(ENDPOINTS.SCHOOL_ADMIN.ASSET_DETAIL(asset._id));
      setAssets(prev => prev.filter(a => a._id !== asset._id));
      toast.success(`Đã xóa "${asset.name}".`);
    } catch (err) {
      toast.error(err?.message || 'Lỗi khi xóa.');
    } finally { setDeletingId(''); }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectCategory = (rows) => {
    const ids = rows.map((r) => r._id);
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      ids.forEach((id) => {
        if (allSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    try {
      const selectedIds = [...selected];
      const selectedMap = new Map(assets.map((a) => [String(a._id), a]));
      const results = await Promise.allSettled(
        selectedIds.map((id) => del(ENDPOINTS.SCHOOL_ADMIN.ASSET_DETAIL(id)))
      );
      let deletedCount = 0;
      const failedNames = [];
      results.forEach((r, idx) => {
        const id = String(selectedIds[idx]);
        if (r.status === 'fulfilled') deletedCount++;
        else failedNames.push(selectedMap.get(id)?.name || id);
      });

      if (deletedCount > 0) {
        const deletedIds = selectedIds.filter((_, idx) => results[idx].status === 'fulfilled');
        setAssets((prev) => prev.filter((a) => !deletedIds.includes(String(a._id))));
      }
      setSelected(new Set());
      setBulkDeleteOpen(false);
      if (failedNames.length === 0) toast.success(`Đã xóa ${deletedCount} mục.`);
      else {
        toast.warn(`Đã xóa ${deletedCount} mục, lỗi ${failedNames.length} mục.`);
      }
    } catch (err) {
      toast.error(err?.message || 'Lỗi khi xóa hàng loạt.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      let parsed = [];

      if (ext === 'doc') {
        const formData = new FormData();
        formData.append('file', file);
        const res = await postFormData(ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS_PARSE_WORD, formData);
        parsed = mapImportedRowsToWarehouse(res?.data?.assets || [], res?.data?.extraAssets || []);
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        parsed = parseWordDoc(result.value);
      }

      if (parsed.length === 0) return toast.warn('Không tìm thấy dữ liệu tài sản trong file.');
      setImportItems(parsed);
      setImportOpen(true);
    } catch (err) {
      toast.error('Không thể đọc file Word: ' + err.message);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await post(ENDPOINTS.SCHOOL_ADMIN.ASSETS_BULK_WAREHOUSE, { assets: importItems });
      const { created, updated, skipped, errors } = res.data;
      toast.success(
        `Đã nhập mới ${created} tài sản${updated > 0 ? `, cộng dồn ${updated}` : ''}${skipped > 0 ? `, bỏ qua ${skipped}` : ''}.`
      );
      if (errors?.length) errors.slice(0, 5).forEach(e => toast.warn(e, { autoClose: 6000 }));
      setImportOpen(false);
      setImportItems([]);
      load();
    } catch (err) {
      toast.error(err?.message || 'Lỗi khi nhập dữ liệu.');
    } finally { setImporting(false); }
  };

  const filtered = assets.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()) || a.assetCode?.toLowerCase().includes(search.toLowerCase()));
  const grouped = WAREHOUSE_CATEGORIES.map(cat => ({ cat, rows: filtered.filter(a => a.category === cat) }));

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <TextField size="small" placeholder="Tìm theo tên hoặc mã..." value={search} onChange={e => setSearch(e.target.value)} sx={{ width: 280 }} />
        <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()}>
          Import Word
        </Button>
        <input ref={fileInputRef} type="file" accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style={{ display: 'none' }} onChange={handleFileSelect} />
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : (
        grouped.map(({ cat, rows }) => (
          <Box key={cat} mb={3}>
            {(() => {
              const currentPage = categoryPage[cat] || 0;
              const maxPage = Math.max(0, Math.ceil(rows.length / WAREHOUSE_PAGE_SIZE) - 1);
              const safePage = Math.min(currentPage, maxPage);
              const pagedRows = rows.slice(safePage * WAREHOUSE_PAGE_SIZE, (safePage + 1) * WAREHOUSE_PAGE_SIZE);
              return (
                <>
                  <Box sx={{ backgroundColor: '#e8f0fe', borderLeft: '4px solid #1a56db', px: 1.5, py: 0.75, borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Checkbox
                        size="small"
                        disabled={rows.length === 0}
                        checked={rows.length > 0 && rows.every((r) => selected.has(r._id))}
                        indeterminate={rows.some((r) => selected.has(r._id)) && !rows.every((r) => selected.has(r._id))}
                        onChange={() => toggleSelectCategory(rows)}
                      />
                      <Typography fontWeight={700} fontSize="0.85rem" color="#1a56db">
                        {WAREHOUSE_CATEGORY_PREFIX[cat]}. {cat}
                        <Typography component="span" fontWeight={400} color="text.secondary" ml={1} fontSize="0.75rem">({rows.length} mục)</Typography>
                      </Typography>
                    </Stack>
                    <Button size="small" startIcon={<AddIcon />} onClick={() => { setForm({ ...emptyWarehouseAsset(), category: cat }); setEditId(null); setOpenModal(true); }}>Thêm</Button>
                  </Box>
                  <TableContainer sx={{ border: '1px solid #c7d7f8', borderTop: 'none', borderRadius: '0 0 4px 4px' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8', width: 44 }} />
                          <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8', width: 50 }}>#</TableCell>
                          <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8', width: 110 }}>Mã TS</TableCell>
                          <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8' }}>Tên tài sản</TableCell>
                          <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8' }} align="center">ĐVT</TableCell>
                          <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8' }} align="center">Tổng kho</TableCell>
                          <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8' }} align="center">Đã phân bổ</TableCell>
                          <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8' }} align="center">Còn lại</TableCell>
                          <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8' }} align="center">Còn tốt</TableCell>
                          <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8' }} align="center">Đã hỏng</TableCell>
                          <TableCell sx={{ fontWeight: 700, backgroundColor: '#f0f4f8' }} align="center">Thao tác</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.length === 0 ? (
                          <TableRow><TableCell colSpan={11} align="center" sx={{ py: 2, color: 'text.secondary', fontSize: '0.8rem' }}>Chưa có dữ liệu — nhấn <strong>Thêm</strong> để bắt đầu</TableCell></TableRow>
                        ) : pagedRows.map((a, idx) => (
                          <TableRow key={a._id} hover>
                            <TableCell padding="checkbox">
                              <Checkbox
                                size="small"
                                checked={selected.has(a._id)}
                                onChange={() => toggleSelect(a._id)}
                              />
                            </TableCell>
                            <TableCell>{safePage * WAREHOUSE_PAGE_SIZE + idx + 1}</TableCell>
                            <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 0.5, borderRadius: 0.5 }}>{a.assetCode}</Typography></TableCell>
                            <TableCell>{a.name}</TableCell>
                            <TableCell align="center">{a.unit}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>{a.quantity}</TableCell>
                            <TableCell align="center" sx={{ color: 'info.main', fontWeight: 500 }}>{a.allocatedQty ?? 0}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: (a.remainingQty ?? a.quantity ?? 0) > 0 ? 'success.main' : 'error.main' }}>{a.remainingQty ?? a.quantity ?? 0}</TableCell>
                            <TableCell align="center" sx={{ color: 'success.main', fontWeight: 700 }}>{deriveWarehouseQuantities(a).good}</TableCell>
                            <TableCell align="center" sx={{ color: 'error.main', fontWeight: 700 }}>{deriveWarehouseQuantities(a).broken}</TableCell>
                            <TableCell align="center">
                              <Stack direction="row" justifyContent="center" spacing={0.5}>
                                <Tooltip title="Sửa"><IconButton size="small" onClick={() => { const q = deriveWarehouseQuantities(a); setForm({ assetCode: a.assetCode, name: a.name, category: a.category, unit: a.unit, quantity: q.total, goodQuantity: q.good, brokenQuantity: q.broken, condition: q.broken > 0 ? 'Đã hỏng' : 'Còn tốt' }); setEditId(a._id); setOpenModal(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                <Tooltip title="Xóa lẻ">
                                  <span>
                                    <IconButton size="small" color="error" onClick={() => handleQuickDelete(a)} disabled={deletingId === a._id}>
                                      {deletingId === a._id ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon fontSize="small" />}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {rows.length > WAREHOUSE_PAGE_SIZE && (
                    <TablePagination
                      component="div"
                      count={rows.length}
                      rowsPerPage={WAREHOUSE_PAGE_SIZE}
                      rowsPerPageOptions={[WAREHOUSE_PAGE_SIZE]}
                      page={safePage}
                      onPageChange={(_, newPage) => setCategoryPage((prev) => ({ ...prev, [cat]: newPage }))}
                      labelRowsPerPage="Hiển thị"
                      labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                      sx={{ border: '1px solid #c7d7f8', borderTop: 'none', borderRadius: '0 0 4px 4px', '.MuiTablePagination-toolbar': { minHeight: 42 } }}
                    />
                  )}
                </>
              );
            })()}
          </Box>
        ))
      )}

      {/* Dialog thêm/sửa */}
      <Dialog open={openModal} onClose={() => { setOpenModal(false); setForm(emptyWarehouseAsset()); setEditId(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Sửa tài sản' : 'Thêm tài sản kho'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField label="Mã tài sản *" value={form.assetCode} onChange={e => setForm(f => ({ ...f, assetCode: e.target.value }))} fullWidth size="small" />
              <TextField label="ĐVT" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} sx={{ width: 120 }} size="small" />
            </Stack>
            <TextField label="Tên tài sản *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth size="small" />
            <TextField select label="Nhóm tài sản" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} fullWidth size="small" disabled={!editId}>
              {WAREHOUSE_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField label="SL còn tốt" type="number" value={form.goodQuantity} onChange={e => setForm(f => ({ ...f, goodQuantity: Number(e.target.value) }))} inputProps={{ min: 0 }} fullWidth size="small" />
              <TextField label="SL đã hỏng" type="number" value={form.brokenQuantity} onChange={e => setForm(f => ({ ...f, brokenQuantity: Number(e.target.value) }))} inputProps={{ min: 0 }} fullWidth size="small" />
            </Stack>
            <TextField label="Tổng kho" value={(Number(form.goodQuantity) || 0) + (Number(form.brokenQuantity) || 0)} fullWidth size="small" InputProps={{ readOnly: true }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenModal(false); setForm(emptyWarehouseAsset()); setEditId(null); }} disabled={saving}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? <CircularProgress size={18} /> : editId ? 'Lưu' : 'Thêm'}</Button>
        </DialogActions>
      </Dialog>

      {/* Import Word preview */}
      <Dialog open={importOpen} onClose={() => { if (!importing) { setImportOpen(false); setImportItems([]); } }} maxWidth="md" fullWidth>
        <DialogTitle>
          Xem trước dữ liệu import — {importItems.length} tài sản
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {WAREHOUSE_CATEGORIES.map(cat => {
            const rows = importItems.filter(a => a.category === cat);
            if (!rows.length) return null;
            return (
              <Box key={cat}>
                <Box sx={{ backgroundColor: '#e8f0fe', px: 2, py: 0.75 }}>
                  <Typography fontWeight={700} fontSize="0.82rem" color="#1a56db">
                    {WAREHOUSE_CATEGORY_PREFIX[cat]}. {cat}
                    <Typography component="span" fontWeight={400} color="text.secondary" ml={1} fontSize="0.75rem">({rows.length} mục)</Typography>
                  </Typography>
                </Box>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: 40 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 110 }}>Mã TS</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tên tài sản</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 60 }} align="center">ĐVT</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 70 }} align="center">SL</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((a, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 0.5, borderRadius: 0.5 }}>{a.assetCode || '(tự động)'}</Typography></TableCell>
                        <TableCell>{a.name}</TableCell>
                        <TableCell align="center">{a.unit}</TableCell>
                        <TableCell align="center">{a.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setImportOpen(false); setImportItems([]); }} disabled={importing}>Hủy</Button>
          <Button variant="contained" onClick={handleImport} disabled={importing} startIcon={importing ? <CircularProgress size={16} /> : <UploadFileIcon />}>
            {importing ? 'Đang nhập...' : `Nhập ${importItems.length} tài sản`}
          </Button>
        </DialogActions>
      </Dialog>

      {selected.size > 0 && (
        <Box sx={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          backgroundColor: '#1e293b',
          color: '#fff',
          borderRadius: 3,
          px: 3,
          py: 1.2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
          whiteSpace: 'nowrap',
        }}>
          <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>
            Đã chọn <strong style={{ color: '#fff' }}>{selected.size}</strong> mục
          </Typography>
          <Button
            size="small"
            variant="text"
            sx={{ color: '#94a3b8', textTransform: 'none', minWidth: 0 }}
            onClick={() => setSelected(new Set())}
          >
            Bỏ chọn
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<DeleteIcon fontSize="small" />}
            sx={{ textTransform: 'none', borderRadius: 2 }}
            onClick={() => setBulkDeleteOpen(true)}
          >
            Xóa {selected.size} mục
          </Button>
        </Box>
      )}

      <Dialog open={bulkDeleteOpen} onClose={() => !bulkDeleting && setBulkDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Xóa nhiều mục</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Bạn có chắc muốn xóa {selected.size} mục đã chọn? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting}>Hủy</Button>
          <Button variant="contained" color="error" onClick={handleBulkDelete} disabled={bulkDeleting}>
            {bulkDeleting ? <CircularProgress size={18} /> : `Xóa ${selected.size} mục`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManageAssets() {
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();
  const [mainTab, setMainTab] = useState(0);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const roles = user?.roles?.map(r => r.roleName || r) || [];
    if (!roles.includes('SchoolAdmin')) navigate('/', { replace: true });
  }, [isInitializing, navigate, user]);

  return (
    <Box>
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: 3, bgcolor: 'white', border: '1px solid #e5e7eb' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight={900} color="#1e293b">Quản lý Kho & Cơ sở vật chất</Typography>
            <Typography variant="body2" color="text.secondary">Hệ thống quản lý tài sản theo Thông tư 13/2020/TT-BGDĐT</Typography>
          </Box>
        </Stack>

        <Tabs
          value={mainTab}
          onChange={(_, v) => setMainTab(v)}
          sx={{
            mb: 3,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 48, px: 3 },
            borderBottom: '1px solid #f1f5f9'
          }}
        >
          <Tab icon={<DashboardIcon fontSize="small" />} iconPosition="start" label="Tổng quan" />
          <Tab icon={<ListIcon fontSize="small" />} iconPosition="start" label="Báo cáo cuối năm" />
          <Tab icon={<InventoryIcon fontSize="small" />} iconPosition="start" label="Quản lý Kho (Phân bổ)" />
        </Tabs>

        {mainTab === 0 && (
          <Box sx={{ py: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle1" fontWeight={800} mb={2}>Hướng dẫn quy trình nghiệp vụ</Typography>
                <Stack spacing={2}>
                  {[
                    { title: '1. Danh mục Cơ sở vật chất', desc: 'Định nghĩa các phòng học, khu vực hạ tầng và "Kho tổng" của trường.', link: '/school-admin/facilities/locations', icon: <LocationIcon color="primary" /> },
                    { title: '2. Nhập tài sản', desc: 'Sử dụng file Excel để nhập danh sách tài sản hiện có vào hệ thống.', tab: 1, icon: <ListIcon color="success" /> },
                    { title: '3. Phân bổ về phòng (CSVC)', desc: 'Chuyển đồ từ "Kho tổng" về từng phòng học hoặc cơ sở vật chất cụ thể.', link: '/school-admin/facilities/room-based', icon: <InventoryIcon color="warning" /> },
                    { title: '4. Báo cáo cuối năm', desc: 'Rà soát tình trạng sử dụng và xuất báo cáo gửi Sở/Phòng GD.', tab: 1, icon: <ArrowIcon color="info" /> }
                  ].map((step, i) => (
                    <Paper
                      key={i}
                      variant="outlined"
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        cursor: 'pointer',
                        transition: '0.2s',
                        '&:hover': { bgcolor: '#f8fafc', borderColor: '#2563eb' }
                      }}
                      onClick={() => step.link ? navigate(step.link) : setMainTab(step.tab)}
                    >
                      <Box sx={{ p: 1, bgcolor: '#f1f5f9', borderRadius: 2 }}>{step.icon}</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={700}>{step.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{step.desc}</Typography>
                      </Box>
                      <ArrowIcon sx={{ opacity: 0.3 }} />
                    </Paper>
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, bgcolor: '#eff6ff', borderRadius: 3, height: '100%' }}>
                  <Typography variant="h6" fontWeight={800} color="#1e40af" mb={1}>Phím tắt nhanh</Typography>
                  <Stack spacing={1.5} mt={2}>
                    <Button variant="contained" fullWidth onClick={() => navigate('/school-admin/facilities/locations')} sx={{ bgcolor: '#2563eb', borderRadius: 2 }}>Quản lý Danh mục CSVC</Button>
                    <Button variant="outlined" fullWidth onClick={() => setMainTab(1)} sx={{ borderRadius: 2 }}>Xem Báo cáo Tổng quát</Button>
                    <Button variant="outlined" fullWidth onClick={() => navigate('/school-admin/facilities/room-based')} sx={{ borderRadius: 2 }}>Xem Tài sản theo phòng</Button>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {mainTab === 1 && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, bgcolor: '#f8fafc', p: 1, borderRadius: 1 }}>
              💡 <b>Mẹo:</b> Bạn có thể chỉnh sửa trực tiếp Số lượng thực tế bằng cách bấm vào con số trên bảng.
            </Typography>
            <AssetsTab />
          </Box>
        )}
        {mainTab === 2 && <WarehouseAssetsTab />}
      </Paper>
    </Box>
  );
}
