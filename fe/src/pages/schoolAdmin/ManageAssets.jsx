import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
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
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
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

const emptyMember    = () => ({ fullName: '', position: '', role: 'Thành viên', notes: '' });
const emptyCommittee = () => ({ name: '', foundedDate: new Date().toISOString().slice(0, 10), decisionNumber: '', scope: [], members: [emptyMember()] });
const emptyAssetRow  = () => ({ category: '', assetCode: '', name: '', unit: 'Cái', quantity: 0, targetUser: '', notes: '' });
const emptyMinutes   = () => ({
  className: '',
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
  const [staff, setStaff]               = useState([]);
  const [classes, setClasses]           = useState([]);
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
      const [cRes, tRes, sRes, clsRes] = await Promise.all([
        get(ENDPOINTS.SCHOOL_ADMIN.ASSET_COMMITTEES),
        get(ENDPOINTS.SCHOOL_ADMIN.TEACHERS),
        get(ENDPOINTS.SCHOOL_ADMIN.STAFF),
        get(ENDPOINTS.CLASSES.LIST),
      ]);
      setCommittees(cRes?.data?.committees || []);
      setTeachers((tRes?.data || []).filter(t => t.fullName?.trim()));
      setStaff((sRes?.data || []).filter(s => s.fullName?.trim()));
      setClasses((clsRes?.data || []).filter(c => c.className?.trim()));
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

  const handleAddMember    = () => setForm(prev => ({ ...prev, members: [...prev.members, emptyMember()] }));
  const handleRemoveMember = idx  => setForm(prev => ({ ...prev, members: prev.members.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!form.name.trim())           { toast.error('Vui lòng nhập tên ban kiểm kê.'); return; }
    if (!form.foundedDate)           { toast.error('Vui lòng chọn ngày thành lập.'); return; }
    if (!form.decisionNumber.trim()) { toast.error('Vui lòng nhập số quyết định.'); return; }
    const names = form.members.map(m => m.fullName.trim()).filter(Boolean);
    if (new Set(names).size !== names.length) { toast.error('Danh sách thành viên có người bị trùng.'); return; }
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
      scope: Array.isArray(c.scope) ? c.scope : (c.scope ? [c.scope] : []),
      members: c.members?.length
        ? c.members.map(m => ({ fullName: m.fullName, position: m.position || '', role: m.role || 'Thành viên', notes: m.notes || '' }))
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
          notes:    String(r[3] || '').trim(),
        }));
        setForm({ name, foundedDate, decisionNumber, members: members.length ? members : [emptyMember()] });
        setShowForm(true);
        toast.success('Đọc file thành công. Kiểm tra lại trước khi lưu.');
      };
      reader.readAsArrayBuffer(file);
    }).catch(() => toast.error('Không hỗ trợ import Excel.'));
    e.target.value = '';
  };

  const allPersons  = [
    ...teachers.map(t => ({ fullName: t.fullName, group: 'Giáo viên' })),
    ...staff.map(s => ({ fullName: s.fullName, group: 'Ban Giám Hiệu' })),
  ];
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
          <Autocomplete
            multiple size="small" sx={{ mb: 2 }}
            options={classes.map(c => c.className)}
            value={form.scope}
            onChange={(_, val) => setForm(p => ({ ...p, scope: val }))}
            renderTags={(val, getTagProps) =>
              val.map((opt, i) => <Chip key={opt} label={opt} size="small" {...getTagProps({ index: i })} />)
            }
            renderInput={params => (
              <TextField {...params} label="Phạm vi - Lớp phụ trách" placeholder="Chọn lớp..." />
            )}
          />

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
                      value={allPersons.find(p => p.fullName === m.fullName) || null}
                      onChange={(_, sel) => sel && handleMemberChange(idx, 'fullName', typeof sel === 'string' ? sel : sel.fullName)}
                      inputValue={m.fullName}
                      onInputChange={(_, val, reason) => reason === 'input' && handleMemberChange(idx, 'fullName', val)}
                      freeSolo
                      renderInput={params => <TextField {...params} label="Họ và tên" placeholder="Chọn hoặc nhập" />}
                    />
                    <TextField size="small" fullWidth label="Chức vụ" placeholder="VD: Hiệu trưởng"
                      value={m.position} onChange={e => handleMemberChange(idx, 'position', e.target.value)} />
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
                      value={m.notes} onChange={e => handleMemberChange(idx, 'notes', e.target.value)} />
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
                          value={allPersons.find(p => p.fullName === m.fullName) || null}
                          onChange={(_, sel) => sel && handleMemberChange(idx, 'fullName', typeof sel === 'string' ? sel : sel.fullName)}
                          inputValue={m.fullName}
                          onInputChange={(_, val, reason) => reason === 'input' && handleMemberChange(idx, 'fullName', val)}
                          freeSolo
                          renderInput={params => <TextField {...params} placeholder="Chọn hoặc nhập họ tên" />}
                          sx={{ minWidth: 180 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth placeholder="VD: Hiệu trưởng"
                          value={m.position} onChange={e => handleMemberChange(idx, 'position', e.target.value)} />
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
                          value={m.notes} onChange={e => handleMemberChange(idx, 'notes', e.target.value)} />
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
              {viewCommittee.scope?.length > 0 && (
                <Typography><strong>Phạm vi - Lớp phụ trách:</strong> {[].concat(viewCommittee.scope).join(', ')}</Typography>
              )}
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
      className:        m.className || '',
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
                    <Typography variant="body2" color="text.secondary">{formatDate(m.createdAt)} · {[m.className, m.scope].filter(Boolean).join(' - ') || '—'}</Typography>
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
                    <TableCell>{[m.className, m.scope].filter(Boolean).join(' - ') || '—'}</TableCell>
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
              <TextField label="Phạm vi" size="small" value={form.scope || '—'} disabled
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 160 } }} />
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

// ─── Assets Tab (CRUD Tài sản) ────────────────────────────────────────────────
const CONDITION_OPTIONS  = ['Tốt', 'Hỏng', 'Cần sửa chữa'];
const CONDITION_COLOR    = { 'Tốt': 'success', 'Hỏng': 'error', 'Cần sửa chữa': 'warning' };
const CATEGORY_OPTIONS   = [
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

const emptyAsset = () => ({
  assetCode: '', name: '', category: 'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em', room: '',
  requiredQuantity: 0, quantity: 1, area: '', constructionType: 'Không áp dụng',
  condition: 'Tốt', notes: '',
});

function AssetsTab() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading]           = useState(true);
  const [assets, setAssets]             = useState([]);
  const [search, setSearch]             = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [openModal, setOpenModal]       = useState(false);
  const [form, setForm]                 = useState(emptyAsset());
  const [editId, setEditId]             = useState(null);
  const [saving, setSaving]             = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // Import Excel
  const importRef                             = useRef();
  const [importPreview, setImportPreview]     = useState([]);
  const [importOpen, setImportOpen]           = useState(false);
  const [importing, setImporting]             = useState(false);

  // Bulk select & delete
  const [selected, setSelected]               = useState(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen]   = useState(false);
  const [bulkDeleting, setBulkDeleting]       = useState(false);

  // Pagination
  const [page, setPage]               = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const load = async () => {
    setLoading(true);
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.ASSETS);
      setAssets(res?.data?.assets || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được danh sách tài sản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => { setSelected(new Set()); setPage(0); }, [search, filterCategory]);

  const handleOpen = (asset = null) => {
    if (asset) {
      setForm({
        assetCode:        asset.assetCode,
        name:             asset.name,
        category:         asset.category || 'Khác',
        room:             asset.room || '',
        requiredQuantity: asset.requiredQuantity ?? 0,
        quantity:         asset.quantity,
        area:             asset.area ?? '',
        constructionType: asset.constructionType || 'Không áp dụng',
        condition:        asset.condition,
        notes:            asset.notes || '',
      });
      setEditId(asset._id);
    } else {
      setForm(emptyAsset());
      setEditId(null);
    }
    setOpenModal(true);
  };

  const handleClose = () => { setOpenModal(false); setForm(emptyAsset()); setEditId(null); };

  const handleSave = async () => {
    if (!form.assetCode.trim()) { toast.error('Vui lòng nhập mã tài sản.'); return; }
    if (!form.name.trim())      { toast.error('Vui lòng nhập tên tài sản.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, area: form.area !== '' ? Number(form.area) : null };
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

  const toggleSelectAll = () =>
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(a => a._id)));

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
        const wb   = XLSX.read(evt.target.result, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (!rows?.length) { toast.error('File rỗng hoặc sai định dạng.'); return; }

        // ── Section header mapping (theo số thứ tự trong Excel báo cáo) ──
        const SECTION_PATTERNS = [
          { re: /^1[\.\s\)]/,  cat: 'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em', fmt: 'room' },
          { re: /^2[\.\s\)]/,  cat: 'Số bàn, ghế ngồi',                             fmt: 'count' },
          { re: /^3[\.\s\)]/,  cat: 'Khối phòng phục vụ học tập',                   fmt: 'room' },
          { re: /^4[\.\s\)]/,  cat: 'Phòng tổ chức ăn, nghỉ',                       fmt: 'room' },
          { re: /^5[\.\s\)]/,  cat: 'Công trình công cộng và khối phòng phục vụ khác', fmt: 'room' },
          { re: /^6[\.\s\)]/,  cat: 'Khối phòng hành chính quản trị',               fmt: 'room' },
          { re: /^7\.1/,       cat: 'Diện tích đất',                                fmt: 'equip' },
          { re: /^7\.2/,       cat: 'Thiết bị dạy học và CNTT',                     fmt: 'equip' },
          { re: /^7[\.\s\)]/,  cat: 'Thiết bị dạy học và CNTT',                     fmt: 'equip' },
        ];

        // Prefix tự động sinh mã TS theo category
        const CODE_PREFIX = {
          'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em': 'PH',
          'Số bàn, ghế ngồi':                             'BG',
          'Khối phòng phục vụ học tập':                   'HT',
          'Phòng tổ chức ăn, nghỉ':                       'AN',
          'Công trình công cộng và khối phòng phục vụ khác': 'CC',
          'Khối phòng hành chính quản trị':               'HC',
          'Diện tích đất':                                 'DT',
          'Thiết bị dạy học và CNTT':                      'TB',
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

          if (currentFmt === 'equip') {
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
              category:         currentCat,
              room:             '',
              requiredQuantity: 0,
              quantity:         qty,
              area:             null,
              constructionType: 'Không áp dụng',
              condition:        'Tốt',
              notes:            dvt,
            };
          } else {
            // Phòng / Bàn ghế: col[1]=nhu cầu QĐ, col[2]=tổng số, col[3]=diện tích
            // col[4,5]=Kiên cố; col[6,7]=Bán kiên cố; col[8,9]=Tạm
            const requiredQuantity = toNum(row[1]);
            const quantity         = toNum(row[2]);
            const areaRaw          = row[3];
            const area = areaRaw !== '' && areaRaw != null ? toNum(areaRaw) || null : null;

            const kienCo   = toNum(row[4]);
            const banKienCo = toNum(row[6]);
            const tam       = toNum(row[8]);
            let constructionType = 'Không áp dụng';
            if (kienCo > 0 && !banKienCo && !tam)       constructionType = 'Kiên cố';
            else if (banKienCo > 0 && !kienCo && !tam)  constructionType = 'Bán kiên cố';
            else if (tam > 0 && !kienCo && !banKienCo)  constructionType = 'Tạm';

            asset = {
              assetCode, name,
              category:         currentCat,
              room:             '',
              requiredQuantity,
              quantity,
              area,
              constructionType,
              condition:        'Tốt',
              notes:            '',
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

  const handleDownloadTemplate = () => {
    import('xlsx').then(XLSX => {
      const aoa = [
        // Tiêu đề chính
        ['I. CƠ SỞ VẬT CHẤT', 'Tổng nhu cầu theo QĐ', 'Tổng số', 'Diện tích (m²)', 'Kiên cố - Số', 'Kiên cố - DT', 'Bán kiên cố - Số', 'Bán kiên cố - DT', 'Tạm - Số', 'Tạm - DT'],
        // Section 1
        ['1. Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em'],
        ['- Tổng số phòng học',             17, 17, 695, 17, 695, '', '', '', ''],
        ['+ Khu sinh hoạt chung',           17, 17, 695, 17, 695, '', '', '', ''],
        ['+ Khu ngủ',                       17, 10, 472.2, 10, 472.2, '', '', '', ''],
        ['+ Khu vệ sinh',                   17, 17, 223.81, 17, 223.81, '', '', '', ''],
        ['+ Hiên chơi, đón trẻ',            17, 17, 560.75, 17, 560.75, '', '', '', ''],
        ['+ Kho nhóm, lớp',                 17, '', '', '', '', '', '', '', ''],
        ['+ Phòng giáo viên',                2, '', '', '', '', '', '',  '', ''],
        // Section 2
        ['2. Số bàn, ghế ngồi', 'Tổng nhu cầu theo QĐ', 'Tổng số', '', '', '', '', '', '', ''],
        ['- Tổng số bàn',   300, 277, '', '', '', '', '', '', ''],
        ['+ Bàn giáo viên',  38,  17, '', '', '', '', '', '', ''],
        ['+ Bàn học sinh',  260, 260, '', '', '', '', '', '', ''],
        ['- Tổng số ghế',   558, 558, '', '', '', '', '', '', ''],
        ['+ Ghế giáo viên',  38,  17, '', '', '', '', '', '', ''],
        ['+ Ghế học sinh',  520, 520, '', '', '', '', '', '', ''],
        // Section 3
        ['3. Khối phòng phục vụ học tập'],
        ['- Phòng thư viện',      1, 1,  40, 1,  40, '', '', '', ''],
        ['- Phòng Giáo dục thể chất', 1, '', '', '', '', '', '', '', ''],
        ['- Phòng Giáo dục nghệ thuật', 1, 1, 73, 1, 73, '', '', '', ''],
        ['- Phòng Y tế học đường', 1, 1, 12, 1, 12, '', '', '', ''],
        ['- Nhà tập đa năng',     1, '', '', '', '', '', '', '', ''],
        ['- Phòng làm quen với máy tính', 1, 1, 16, 1, 16, '', '', '', ''],
        ['- Sân chơi riêng',      2, 1, 540, 1, 540, '', '', '', ''],
        // Section 4
        ['4. Phòng tổ chức ăn, nghỉ'],
        ['- Nhà bếp',   2, 2,  75, 1, 45, 1, 30, '', ''],
        ['- Phòng ăn',  1, 1,   9, '', '', '', '', 1, 9],
        ['- Kho bếp',   2, 2,  12, 1,  6, 1,  6, '', ''],
        // Section 5
        ['5. Công trình công cộng và khối phòng phục vụ khác'],
        ['- Nhà để xe GV',        1, 1, 108, '', '', '', '', 1, 108],
        ['- Nhà để xe HS',        0, '', '', '', '', '', '', '', ''],
        ['- Nhà vệ sinh dành cho GV', 3, 2, 12, 2, 12, '', '', '', ''],
        // Section 6
        ['6. Khối phòng hành chính quản trị'],
        ['- Phòng Hiệu trưởng',     1, 1, 18, 1, 18, '', '', '', ''],
        ['- Phòng phó Hiệu trưởng', 2, 2, 36, 2, 36, '', '', '', ''],
        ['- Phòng họp Hội đồng',    1, '', '', '', '', '', '', '', ''],
        ['- Phòng họp (Tổ chuyên môn)', 1, 1, 18, 1, 18, '', '', '', ''],
        ['- Văn phòng nhà trường',  1, 1, 40, 1, 40, '', '', '', ''],
        ['- Phòng thường trực (Bảo vệ)', 2, 1, 6.2, '', '', '', '', 1, 6.2],
        ['- Nhà công vụ giáo viên', 0, '', '', '', '', '', '', '', ''],
        ['- Phòng kho lưu trữ tài liệu', 1, 1, 18, 1, 18, '', '', '', ''],
        // Section 7.1
        ['7.1. Diện tích đất (Tính đến thời điểm hiện tại)', 'ĐVT', 'Số lượng'],
        ['- Tổng diện tích khuôn viên đất', 'm²', 3943.3],
        ['- Diện tích sân chơi',             'm²',  540],
        ['- Diện tích sân vườn',             'm²',  250],
        // Section 7.2
        ['7.2. Thiết bị dạy học và thiết bị CNTT', 'ĐVT', 'Số lượng'],
        ['- Thiết bị dạy học tối thiểu',                  'Bộ',   17],
        ['- Thiết bị đồ chơi ngoài trời',                 'Loại', 10],
        ['- Tổng số máy tính đang được sử dụng',           'Bộ',   28],
        ['- Tổng số đường truyền Internet',                'Bộ',    2],
        ['- Số máy tính được kết nối Internet',            'Bộ',   28],
        ['- Số máy tính phục vụ công tác Quản lý',         'Bộ',    8],
        ['- Số máy tính phục vụ công tác Giảng dạy, Học tập', 'Bộ', 20],
        ['- Máy chiếu',    'Chiếc',  2],
        ['- Máy Photocopy', 'Chiếc', 1],
        ['- Máy in',        'Chiếc', 6],
        ['- Máy Scaner',    'Chiếc', 2],
        ['- Máy ép Plastic','Chiếc', 0],
        ['- Tivi dùng cho công tác quản lý',  'Chiếc',  4],
        ['- Tivi dùng tại các phòng học',     'Chiếc', 17],
        ['- Đàn phím điện tử',                'Chiếc',  2],
        ['- Tủ đựng đồ',                      'Chiếc', 51],
      ];

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [{ wch: 48 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'CoSoVatChat');
      XLSX.writeFile(wb, 'mau_co_so_vat_chat.xlsx');
    });
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
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.assetCode?.toLowerCase().includes(search.toLowerCase()) ||
      a.room?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || a.category === filterCategory;
    return matchSearch && matchCategory;
  });

  // Phân trang trên danh sách đã lọc
  const pagedRows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Nhóm theo category theo thứ tự CATEGORY_OPTIONS, phần không khớp vào cuối
  const grouped = CATEGORY_OPTIONS.map(cat => ({
    cat,
    rows: pagedRows.filter(a => a.category === cat),
  })).filter(g => g.rows.length > 0);
  const uncategorized = pagedRows.filter(a => !CATEGORY_OPTIONS.includes(a.category));
  if (uncategorized.length) grouped.push({ cat: 'Khác', rows: uncategorized });

  // Tổng hợp nhanh
  const totalRequired = filtered.reduce((s, a) => s + (a.requiredQuantity || 0), 0);
  const totalActual   = filtered.reduce((s, a) => s + (a.quantity || 0), 0);

  return (
    <Box>
      {/* Toolbar */}
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} mb={2} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Tìm kiếm theo mã, tên, phòng..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 220, flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
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
        {selected.size > 0 && (
          <Button
            variant="contained" color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setBulkDeleteOpen(true)}
            sx={{ whiteSpace: 'nowrap', textTransform: 'none' }}
          >
            Xóa {selected.size} mục
          </Button>
        )}
        <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => importRef.current?.click()} sx={{ whiteSpace: 'nowrap', textTransform: 'none' }}>
          Import Excel
        </Button>
        <input ref={importRef} hidden type="file" accept=".xlsx,.xls" onChange={handleImportFile} />
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate} sx={{ whiteSpace: 'nowrap', textTransform: 'none' }}>
          Tải mẫu
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ whiteSpace: 'nowrap' }}>
          Thêm tài sản
        </Button>
      </Stack>

      {/* Tổng hợp nhanh */}
      {!loading && filtered.length > 0 && (
        <Stack direction="row" gap={2} mb={2} flexWrap="wrap">
          <Chip label={`Tổng: ${filtered.length} mục`} variant="outlined" size="small" />
          <Chip label={`Nhu cầu QĐ: ${totalRequired}`} variant="outlined" size="small" color="primary" />
          <Chip label={`Thực tế: ${totalActual}`} variant="outlined" size="small" color={totalActual >= totalRequired ? 'success' : 'warning'} />
        </Stack>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f0f4f8' }}>
                <TableCell padding="checkbox">
                  <Tooltip title={selected.size === filtered.length && filtered.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}>
                    <Checkbox
                      size="small"
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      indeterminate={selected.size > 0 && selected.size < filtered.length}
                      onChange={toggleSelectAll}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mã TS</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tên tài sản</TableCell>
                {!isMobile && <TableCell sx={{ fontWeight: 700 }}>Phòng</TableCell>}
                <TableCell sx={{ fontWeight: 700 }} align="center">Nhu cầu QĐ</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Thực tế</TableCell>
                {!isMobile && <TableCell sx={{ fontWeight: 700 }} align="center">Diện tích (m²)</TableCell>}
                {!isMobile && <TableCell sx={{ fontWeight: 700 }} align="center">Loại CT</TableCell>}
                <TableCell sx={{ fontWeight: 700 }} align="center">Tình trạng</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Hoạt động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography variant="body2" color="text.secondary" py={2}>
                      {search || filterCategory ? 'Không tìm thấy kết quả.' : 'Chưa có tài sản nào.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : grouped.map(({ cat, rows }, gi) => [
                <TableRow key={`cat-${gi}`}>
                  <TableCell
                    colSpan={11}
                    sx={{
                      backgroundColor: '#e8f0fe',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: '#1a56db',
                      py: 0.75,
                      borderBottom: '2px solid #c7d7f8',
                    }}
                  >
                    {CATEGORY_OPTIONS.indexOf(cat) >= 0
                      ? `${CATEGORY_OPTIONS.indexOf(cat) + 1}. ${cat}`
                      : cat}
                    <Typography component="span" sx={{ fontWeight: 400, color: 'text.secondary', ml: 1, fontSize: '0.75rem' }}>
                      ({rows.length} mục)
                    </Typography>
                  </TableCell>
                </TableRow>,
                ...rows.map(a => (
                  <TableRow key={a._id} hover selected={selected.has(a._id)}>
                    <TableCell padding="checkbox">
                      <Checkbox size="small" checked={selected.has(a._id)} onChange={() => toggleSelect(a._id)} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{a.assetCode}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    {!isMobile && <TableCell>{a.room || '—'}</TableCell>}
                    <TableCell align="center">{a.requiredQuantity || 0}</TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2" fontWeight={600}
                        color={(a.quantity || 0) >= (a.requiredQuantity || 0) ? 'success.main' : 'warning.main'}
                      >
                        {a.quantity}
                      </Typography>
                    </TableCell>
                    {!isMobile && <TableCell align="center">{a.area != null ? `${a.area}` : '—'}</TableCell>}
                    {!isMobile && (
                      <TableCell align="center">
                        {a.constructionType !== 'Không áp dụng' ? (
                          <Chip label={a.constructionType} size="small" variant="outlined" color="info" />
                        ) : '—'}
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <Chip label={a.condition} color={CONDITION_COLOR[a.condition] || 'default'} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" justifyContent="center" gap={0.5}>
                        <IconButton size="small" color="primary" onClick={() => handleOpen(a)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(a)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )),
              ])}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Số hàng:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
          />
        </TableContainer>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Cập nhật tài sản' : 'Thêm tài sản mới'}</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            <Stack direction="row" gap={1}>
              <TextField
                label="Mã tài sản *"
                size="small"
                sx={{ flex: 1 }}
                value={form.assetCode}
                onChange={e => setForm(p => ({ ...p, assetCode: e.target.value }))}
              />
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

            <TextField
              label="Tên tài sản *"
              size="small"
              fullWidth
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />

            <TextField
              label="Phòng / Địa điểm"
              size="small"
              fullWidth
              value={form.room}
              onChange={e => setForm(p => ({ ...p, room: e.target.value }))}
            />

            <Divider><Typography variant="caption" color="text.secondary">Số lượng</Typography></Divider>

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
        message={`Bạn có chắc muốn xóa tài sản "${deleteTarget?.name}" (${deleteTarget?.assetCode})?`}
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
                  <TableCell sx={{ fontWeight: 700 }}>Mã TS</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tên tài sản</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Loại</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Phòng</TableCell>
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
                  <TableRow key={i} hover sx={!row.assetCode || !row.name ? { backgroundColor: '#fff3cd' } : {}}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: !row.assetCode ? 'error.main' : 'inherit' }}>{row.assetCode || '(trống)'}</TableCell>
                    <TableCell sx={{ color: !row.name ? 'error.main' : 'inherit' }}>{row.name || '(trống)'}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.room || '—'}</TableCell>
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
      title="Quản lý Tài sản"
      description="Danh sách tài sản, ban kiểm kê và biên bản kiểm kê tài sản trường."
      menuItems={SCHOOL_ADMIN_MENU_ITEMS}
      activeKey="assets-list"
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={user?.fullName || user?.username || 'School Admin'}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: 3, backgroundColor: '#f9fafb' }}>
        <Typography variant="h5" fontWeight={700} mb={2}>Quản lý Tài sản</Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          variant="scrollable" scrollButtons="auto">
          <Tab label="1. Danh sách tài sản" />
          <Tab label="2. Ban Kiểm Kê" />
          <Tab label="3. Biên bản kiểm kê" />
        </Tabs>
        {tab === 0 && <AssetsTab />}
        {tab === 1 && <CommitteeTab />}
        {tab === 2 && <MinutesTab />}
      </Paper>
    </RoleLayout>
  );
}
