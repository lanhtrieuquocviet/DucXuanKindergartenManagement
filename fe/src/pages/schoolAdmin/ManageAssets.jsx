import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Autocomplete,
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
  TableRow,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { del, get, patch, post, put, ENDPOINTS } from '../../service/api';
import { SCHOOL_ADMIN_MENU_ITEMS, createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_LABEL = {
  draft:    { label: 'Nháp',      color: 'default' },
  pending:  { label: 'Chờ duyệt', color: 'warning' },
  approved: { label: 'Đã duyệt',  color: 'success' },
  rejected: { label: 'Từ chối',   color: 'error' },
};

const emptyMember    = () => ({ fullName: '', position: '', role: 'Thành viên' });
const emptyCommittee = () => ({ name: '', foundedDate: '', decisionNumber: '', members: [emptyMember()] });
const emptyAssetRow  = () => ({ category: '', assetCode: '', name: '', unit: 'Cái', quantity: 0, targetUser: '', notes: '' });
const emptyMinutes   = () => ({
  scope: '',
  location: 'Đức Xuân',
  inspectionDate: new Date().toISOString().slice(0, 10),
  inspectionTime: '',
  endTime: '',
  reason: 'Kiểm kê tài sản có trong lớp học tại thời điểm cuối năm',
  inspectionMethod: 'Kiểm kê số tài sản có trong lớp học và theo Thông tư 01 của Bộ GD&ĐT ban hành và các thiết bị dạy học khác.\nTổng hợp số liệu báo cáo về nhà trường để có kế hoạch bổ sung và theo dõi.',
  committeeId: '',
  assets: [emptyAssetRow()],
  conclusion: '',
});

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN');
}

// ─── Shared: Confirm Delete Dialog ───────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title || 'Xác nhận'}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading}>Hủy</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={loading}>
          {loading ? 'Đang xóa...' : 'Xóa'}
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
function CommitteeTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading]           = useState(true);
  const [committees, setCommittees]     = useState([]);
  const [teachers, setTeachers]         = useState([]);
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState(emptyCommittee());
  const [saving, setSaving]             = useState(false);
  const [editId, setEditId]             = useState(null);
  const [viewCommittee, setViewCommittee] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const importRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        get(ENDPOINTS.SCHOOL_ADMIN.ASSET_COMMITTEES),
        get(ENDPOINTS.SCHOOL_ADMIN.TEACHERS),
      ]);
      setCommittees(cRes?.data?.committees || []);
      setTeachers((tRes?.data || []).filter(t => t.fullName?.trim()));
    } catch (err) {
      toast.error(err?.message || 'Không tải được danh sách ban kiểm kê.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMemberChange = (idx, field, value) =>
    setForm(prev => {
      const members = [...prev.members];
      members[idx] = { ...members[idx], [field]: value };
      return { ...prev, members };
    });

  const handleAddMember    = () => setForm(prev => ({ ...prev, members: [...prev.members, emptyMember()] }));
  const handleRemoveMember = idx  => setForm(prev => ({ ...prev, members: prev.members.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!form.name.trim())           { toast.error('Vui lòng nhập tên ban kiểm kê.'); return; }
    if (!form.foundedDate)           { toast.error('Vui lòng chọn ngày thành lập.'); return; }
    if (!form.decisionNumber.trim()) { toast.error('Vui lòng nhập số quyết định.'); return; }
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
        ? c.members.map(m => ({ fullName: m.fullName, position: m.position || '', role: m.role || 'Thành viên' }))
        : [emptyMember()],
    });
    setShowForm(true);
    setViewCommittee(null);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await del(ENDPOINTS.SCHOOL_ADMIN.ASSET_COMMITTEE_DETAIL(deleteTarget));
      toast.success('Đã xóa ban kiểm kê.');
      setDeleteTarget(null);
      load();
    } catch (err) { toast.error(err?.message || 'Xóa thất bại.'); }
    finally { setDeleting(false); }
  };

  const handleImport = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    import('xlsx').then(XLSX => {
      const reader = new FileReader();
      reader.onload = evt => {
        const wb   = XLSX.read(evt.target.result, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (!rows?.length) { toast.error('File rỗng hoặc sai định dạng.'); return; }
        const header       = rows[0] || [];
        const name         = String(header[0] || '').trim();
        const foundedDate  = header[1] ? new Date(header[1]).toISOString().slice(0, 10) : '';
        const decisionNumber = String(header[2] || '').trim();
        const members = rows.slice(1).filter(r => r[0]).map(r => ({
          fullName: String(r[0] || '').trim(),
          position: String(r[1] || '').trim(),
          role:     String(r[2] || 'Thành viên').trim(),
        }));
        setForm({ name, foundedDate, decisionNumber, members: members.length ? members : [emptyMember()] });
        setShowForm(true);
        toast.success('Đọc file thành công. Kiểm tra lại trước khi lưu.');
      };
      reader.readAsArrayBuffer(file);
    }).catch(() => toast.error('Không hỗ trợ import Excel.'));
    e.target.value = '';
  };

  const getChairman = c => c.members?.find(m => m.role === 'Trưởng ban')?.fullName || '—';

  return (
    <Box>
      {/* Header row */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} mb={2} gap={1}>
        <Typography variant="h6" fontWeight={700}>Quản lý Ban Kiểm Kê</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => importRef.current?.click()} sx={{ textTransform: 'none' }}>
            Import File
          </Button>
          <input ref={importRef} hidden type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setEditId(null); setForm(emptyCommittee()); setShowForm(v => !v); }}
            sx={{ background: 'linear-gradient(90deg,#16a34a,#15803d)', textTransform: 'none' }}
          >
            {showForm && !editId ? 'Ẩn form' : 'Tạo Ban Kiểm Kê'}
          </Button>
        </Stack>
      </Stack>

      {/* Create / Edit Form */}
      {showForm && (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>
            {editId ? 'Chỉnh sửa Ban Kiểm Kê' : 'Tạo Ban Kiểm Kê Mới'}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
            <TextField label="Tên Ban Kiểm Kê" fullWidth size="small" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <TextField label="Ngày thành lập" type="date" size="small" InputLabelProps={{ shrink: true }}
              value={form.foundedDate} onChange={e => setForm(p => ({ ...p, foundedDate: e.target.value }))}
              sx={{ minWidth: { xs: '100%', sm: 175 } }} />
            <TextField label="Số quyết định" size="small" value={form.decisionNumber}
              onChange={e => setForm(p => ({ ...p, decisionNumber: e.target.value }))}
              sx={{ minWidth: { xs: '100%', sm: 165 } }} />
          </Stack>

          <Typography variant="body2" fontWeight={600} mb={1}>Thành viên Ban Kiểm Kê</Typography>

          {/* Mobile: card per member | Desktop: table */}
          {isMobile ? (
            <Stack spacing={1.5} mb={1}>
              {form.members.map((m, idx) => (
                <Paper key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                  <Stack spacing={1.5}>
                    <Autocomplete size="small" options={teachers}
                      getOptionLabel={t => (typeof t === 'string' ? t : t.fullName || '')}
                      value={teachers.find(t => t.fullName === m.fullName) || null}
                      onChange={(_, sel) => sel && handleMemberChange(idx, 'fullName', sel.fullName)}
                      inputValue={m.fullName}
                      onInputChange={(_, val, reason) => reason === 'input' && handleMemberChange(idx, 'fullName', val)}
                      freeSolo
                      renderInput={params => <TextField {...params} label="Họ tên" placeholder="Chọn hoặc nhập" />}
                    />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FormControl size="small" sx={{ flex: 1 }}>
                        <InputLabel>Vai trò</InputLabel>
                        <Select label="Vai trò" value={m.role} onChange={e => handleMemberChange(idx, 'role', e.target.value)}>
                          <MenuItem value="Trưởng ban">Trưởng ban</MenuItem>
                          <MenuItem value="Phó ban">Phó ban</MenuItem>
                          <MenuItem value="Thành viên">Thành viên</MenuItem>
                        </Select>
                      </FormControl>
                      <IconButton size="small" color="error" onClick={() => handleRemoveMember(idx)} disabled={form.members.length <= 1}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Box sx={{ overflowX: 'auto', mb: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f3f4f6' }}>
                    <TableCell>Họ tên</TableCell>
                    <TableCell sx={{ width: 160 }}>Vai trò trong ban</TableCell>
                    <TableCell sx={{ width: 56 }} align="center" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {form.members.map((m, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Autocomplete size="small" options={teachers}
                          getOptionLabel={t => (typeof t === 'string' ? t : t.fullName || '')}
                          value={teachers.find(t => t.fullName === m.fullName) || null}
                          onChange={(_, sel) => sel && handleMemberChange(idx, 'fullName', sel.fullName)}
                          inputValue={m.fullName}
                          onInputChange={(_, val, reason) => reason === 'input' && handleMemberChange(idx, 'fullName', val)}
                          freeSolo
                          renderInput={params => <TextField {...params} placeholder="Chọn hoặc nhập họ tên" />}
                          sx={{ minWidth: 200 }}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select value={m.role} onChange={e => handleMemberChange(idx, 'role', e.target.value)}>
                            <MenuItem value="Trưởng ban">Trưởng ban</MenuItem>
                            <MenuItem value="Phó ban">Phó ban</MenuItem>
                            <MenuItem value="Thành viên">Thành viên</MenuItem>
                          </Select>
                        </FormControl>
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

          <Button size="small" onClick={handleAddMember} sx={{ mb: 2, textTransform: 'none' }}>+ Thêm thành viên</Button>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyCommittee()); }} disabled={saving}>Hủy</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ textTransform: 'none' }}>
              {saving ? 'Đang lưu...' : 'Lưu Ban Kiểm Kê'}
            </Button>
          </Stack>
        </Paper>
      )}

      {/* List */}
      {loading ? (
        <Stack alignItems="center" py={4}><CircularProgress size={28} /></Stack>
      ) : committees.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={4}>Chưa có ban kiểm kê nào.</Typography>
      ) : isMobile ? (
        /* Mobile card list */
        <Stack spacing={1.5}>
          {committees.map(c => (
            <Paper key={c._id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography fontWeight={600}>{c.name}</Typography>
              <Typography variant="body2" color="text.secondary">{formatDate(c.foundedDate)} · {c.decisionNumber}</Typography>
              <Typography variant="body2">Trưởng ban: {getChairman(c)}</Typography>
              <Stack direction="row" spacing={1} mt={1.5}>
                <Button size="small" variant="contained" color="info" sx={{ textTransform: 'none', flex: 1 }} onClick={() => setViewCommittee(c)}>Xem</Button>
                <IconButton size="small" onClick={() => handleEdit(c)}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => setDeleteTarget(c._id)}><DeleteIcon fontSize="small" /></IconButton>
              </Stack>
            </Paper>
          ))}
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
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {committees.map(c => (
                <TableRow key={c._id} hover>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{formatDate(c.foundedDate)}</TableCell>
                  <TableCell>{c.decisionNumber}</TableCell>
                  <TableCell>{getChairman(c)}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Button size="small" variant="contained" color="info" sx={{ textTransform: 'none' }} onClick={() => setViewCommittee(c)}>Xem</Button>
                      <IconButton size="small" onClick={() => handleEdit(c)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(c._id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
              {viewCommittee.members?.map((m, i) => (
                <Paper key={i} variant="outlined" sx={{ p: 1.2, borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{m.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary">{m.role}</Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setViewCommittee(null)}>Đóng</Button>
          <Button variant="outlined" onClick={() => handleEdit(viewCommittee)}>Chỉnh sửa</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa ban kiểm kê"
        message="Bạn có chắc chắn muốn xóa ban kiểm kê này?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </Box>
  );
}

// ─── Minutes Tab ──────────────────────────────────────────────────────────────
function MinutesTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading]           = useState(true);
  const [minutesList, setMinutesList]   = useState([]);
  const [committees, setCommittees]     = useState([]);
  const [openModal, setOpenModal]       = useState(false);
  const [editingMinutes, setEditingMinutes] = useState(null);
  const [form, setForm]                 = useState(emptyMinutes());
  const [saving, setSaving]             = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);

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
      scope:            m.scope || '',
      location:         m.location || 'Đức Xuân',
      inspectionDate:   m.inspectionDate ? new Date(m.inspectionDate).toISOString().slice(0, 10) : '',
      inspectionTime:   m.inspectionTime || '',
      endTime:          m.endTime || '',
      reason:           m.reason || '',
      inspectionMethod: m.inspectionMethod || '',
      committeeId:      m.committeeId?._id || m.committeeId || '',
      assets:           m.assets?.length ? m.assets.map(a => ({ ...a })) : [emptyAssetRow()],
      conclusion:       m.conclusion || '',
    });
    setOpenModal(true);
  };

  const handleAssetChange = (idx, field, value) =>
    setForm(prev => {
      const assets = [...prev.assets];
      assets[idx] = { ...assets[idx], [field]: field === 'quantity' ? Number(value) : value };
      return { ...prev, assets };
    });

  const handleAddRow      = ()    => setForm(prev => ({ ...prev, assets: [...prev.assets, emptyAssetRow()] }));
  const handleRemoveRow   = idx   => setForm(prev => ({ ...prev, assets: prev.assets.filter((_, i) => i !== idx) }));
  const handleAddCategory = name  => setForm(prev => ({ ...prev, assets: [...prev.assets, { ...emptyAssetRow(), category: name }] }));

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
      await patch(ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES_REJECT(editingMinutes._id), {});
      toast.success('Đã từ chối biên bản.');
      setOpenModal(false); load();
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

  const isApproved         = editingMinutes?.status === 'approved';
  const isReadOnly         = true; // BGH chỉ xem, không chỉnh sửa
  const parsedDate         = form.inspectionDate ? new Date(form.inspectionDate) : null;
  const dayStr             = parsedDate ? parsedDate.getDate() : '___';
  const monthStr           = parsedDate ? parsedDate.getMonth() + 1 : '___';
  const yearStr            = parsedDate ? parsedDate.getFullYear() : '______';
  const selectedCommittee  = committees.find(c => c._id === form.committeeId) || null;

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
                    <Typography variant="body2" color="text.secondary">{formatDate(m.createdAt)} · {m.scope || '—'}</Typography>
                    <Typography variant="body2">{m.createdBy?.fullName || '—'}</Typography>
                  </Box>
                  <Chip label={s.label} color={s.color} size="small" />
                </Stack>
                <Stack direction="row" spacing={1} mt={1.5}>
                  <Button size="small" variant="contained" color="info" sx={{ textTransform: 'none', flex: 1 }} onClick={() => handleOpenView(m)}>Xem</Button>
                  <IconButton size="small" color="error" onClick={() => setDeleteTarget(m._id)}><DeleteIcon fontSize="small" /></IconButton>
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
                    <TableCell>{m.scope || '—'}</TableCell>
                    <TableCell>{m.createdBy?.fullName || m.createdBy?.username || '—'}</TableCell>
                    <TableCell><Chip label={s.label} color={s.color} size="small" /></TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Button size="small" variant="contained" color="info" sx={{ textTransform: 'none' }} onClick={() => handleOpenView(m)}>Xem</Button>
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(m._id)}><DeleteIcon fontSize="small" /></IconButton>
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
          {/* Phần thông tin — BGH chỉ xem */}
          <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 2, bgcolor: '#f9fafb' }}>
            <Typography variant="body2" fontWeight={600} mb={1.5} color="text.secondary">Thông tin biên bản</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} flexWrap="wrap">
              <TextField label="Lớp / Phạm vi" size="small" value={form.scope || '—'} disabled
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 160 } }}
                InputProps={{ sx: { fontWeight: form.scope ? 600 : 400 } }} />
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
              BIÊN BẢN KIỂM KÊ TÀI SẢN {form.scope ? form.scope.toUpperCase() : ''}
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
                    <th style={{ ...headerCell, width: 80 }}>MÃ SỐ</th>
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
                      const cat  = row.category || '';
                      const last = groups[groups.length - 1];
                      if (last && last.category === cat) last.rows.push(row);
                      else groups.push({ category: cat, rows: [row] });
                    });
                    let counter = 0;
                    return groups.map((g, gi) => (
                      <>
                        {g.category && (
                          <tr key={`cat-${gi}`}>
                            <td colSpan={isReadOnly ? 7 : 8}
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
                                {isReadOnly ? row.assetCode : (
                                  <input style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 13 }}
                                    value={row.assetCode} onChange={e => handleAssetChange(globalIdx, 'assetCode', e.target.value)} />
                                )}
                              </td>
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
          {editingMinutes?.status === 'pending' && (
            <>
              <Button variant="contained" color="success" onClick={handleApprove} disabled={saving} sx={{ textTransform: 'none' }}>
                {saving ? '...' : 'Duyệt'}
              </Button>
              <Button variant="contained" color="error" onClick={handleReject} disabled={saving} sx={{ textTransform: 'none' }}>
                {saving ? '...' : 'Từ chối'}
              </Button>
            </>
          )}
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManageAssets() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const roles = user?.roles?.map(r => r.roleName || r) || [];
    if (!roles.includes('SchoolAdmin')) navigate('/', { replace: true });
  }, [isInitializing, navigate, user]);

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  return (
    <RoleLayout
      title="Kiểm kê Tài sản"
      description="Quản lý ban kiểm kê và biên bản kiểm kê tài sản trường."
      menuItems={SCHOOL_ADMIN_MENU_ITEMS}
      activeKey="assets"
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={user?.fullName || user?.username || 'School Admin'}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: 3, backgroundColor: '#f9fafb' }}>
        <Typography variant="h5" fontWeight={700} mb={2}>Kiểm kê Tài sản</Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          variant="scrollable" scrollButtons="auto">
          <Tab label="1. Ban Kiểm Kê" />
          <Tab label="2. Biên bản kiểm kê" />
        </Tabs>
        {tab === 0 && <CommitteeTab />}
        {tab === 1 && <MinutesTab />}
      </Paper>
    </RoleLayout>
  );
}
