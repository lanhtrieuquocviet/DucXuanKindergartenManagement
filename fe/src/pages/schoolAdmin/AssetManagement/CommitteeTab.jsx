import { Fragment, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GetApp as FileDownloadIcon,
  Description as ArticleIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { get, post, put, patch, del, ENDPOINTS } from '../../../service/api';
import { 
  STATUS_LABEL, 
  formatDate, 
  formatDateInput, 
  emptyCommittee, 
  emptyMember, 
  emptyMinutes, 
  emptyAssetRow,
  ConfirmDialog,
  AddCategoryDialog
} from './AssetUtils';

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
      const { getToken } = await import('../../../service/api');
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
          sx={{ background: 'linear-gradient(90deg,#16a34a,#15803d)', textTransform: 'none', alignSelf: { xs: 'flex-start', sm: 'auto' }, mb: 2 }}
        >
          Tạo Ban Kiểm Kê
        </Button>
      )}

      {/* Create / Edit Form Dialog */}
      <Dialog open={showForm} onClose={() => !saving && setShowForm(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{editId ? 'Chỉnh sửa Ban Kiểm Kê' : 'Tạo Ban Kiểm Kê Mới'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 0.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
              <TextField label="Tên Ban Kiểm Kê" fullWidth size="small" required
                value={form.name}
                onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: undefined })); }}
                error={!!errors.name} helperText={errors.name || `${form.name.length}/50`}
                inputProps={{ maxLength: 50 }} />
              <TextField label="Ngày thành lập" type="date" size="small" required InputLabelProps={{ shrink: true }}
                value={formatDateInput(form.foundedDate)}
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
        <DialogContent dividers>
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
        <DialogContent sx={{ pt: 1 }} dividers>
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
                        {g.rows.map((row, ri) => {
                          counter++;
                          const n = counter;
                          return (
                            <tr key={`${gi}-${ri}`}>
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
                            {g.rows.map((row, ri) => {
                              counter++;
                              const n = counter;
                              return (
                                <tr key={`${gi}-${ri}`}>
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
