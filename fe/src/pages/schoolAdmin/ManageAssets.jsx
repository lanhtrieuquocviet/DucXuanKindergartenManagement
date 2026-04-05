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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
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
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { del, get, patch, post, put, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';

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
export function CommitteeTab() {
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
export function MinutesTab() {
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

  const downloadWord = async (m) => {
    try {
      const { getToken } = await import('../../service/api');
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}${ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES_EXPORT_WORD(m._id)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) { toast.error('Không xuất được file Word.'); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `bien_ban_kiem_ke_${m.minutesNumber || m._id}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Lỗi xuất Word.');
    }
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
                  <Tooltip title="Tải về Word (.docx)">
                    <IconButton size="small" color="primary" onClick={() => downloadWord(m)}>
                      <FileDownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
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
                        <Tooltip title="Tải về Word (.docx)">
                          <IconButton size="small" color="primary" onClick={() => downloadWord(m)}>
                            <FileDownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
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
      const fill  = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
      const bdr   = (style = 'thin', color = 'B0BEC5') => ({ style, color: { argb: color } });
      const allBorders = (style = 'thin', color = 'B0BEC5') => ({
        top: bdr(style, color), bottom: bdr(style, color),
        left: bdr(style, color), right: bdr(style, color),
      });
      const font  = (size, bold, color = '212121', italic = false) =>
        ({ name: 'Times New Roman', size, bold, italic, color: { argb: color } });
      const align = (h, v = 'middle', wrap = true) => ({ horizontal: h, vertical: v, wrapText: wrap });

      const styleCell = (cell, { f, fi, al, bd } = {}) => {
        if (f)  cell.fill      = f;
        if (fi) cell.font      = fi;
        if (al) cell.alignment = al;
        if (bd) cell.border    = bd;
      };

      const mergeStyle = (addr, opts) => styleCell(ws.getCell(addr), opts);

      // ── Row 1: School name ─────────────────────────────────────────────────
      ws.addRow([]);
      ws.mergeCells('A1:J1');
      mergeStyle('A1', {
        f:  fill('1565C0'),
        fi: font(14, true, 'FFFFFF'),
        al: align('center'),
      });
      ws.getCell('A1').value = 'TRƯỜNG MẦM NON ĐỨC XUÂN';
      ws.getRow(1).height = 26;

      // ── Row 2: Report title ────────────────────────────────────────────────
      ws.addRow([]);
      ws.mergeCells('A2:J2');
      mergeStyle('A2', {
        f:  fill('1976D2'),
        fi: font(13, true, 'FFFFFF'),
        al: align('center'),
      });
      ws.getCell('A2').value = 'BÁO CÁO CƠ SỞ VẬT CHẤT – MẪU NHẬP DỮ LIỆU';
      ws.getRow(2).height = 24;

      // ── Row 3: Instruction ─────────────────────────────────────────────────
      ws.addRow([]);
      ws.mergeCells('A3:J3');
      mergeStyle('A3', {
        f:  fill('E3F2FD'),
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
          f:  fill(bgColor),
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
        cell.value     = u;
        cell.font      = font(9, false, '546E7A', true);
        cell.fill      = fill('E3F2FD');
        cell.alignment = align('center');
        cell.border    = allBorders('thin', 'B0BEC5');
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
          f:  fill(color),
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
            cell.font      = font(10, !isSubItem, isSubItem ? '424242' : '212121');
            cell.alignment = align('left');
            cell.fill      = fill(isSubItem ? 'FAFAFA' : 'F5F5F5');
          } else {
            cell.font      = font(10, false, '1565C0');
            cell.alignment = align('center');
            cell.fill      = fill('FFFFFF');
            cell.numFmt    = '#,##0.##';
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
          cell.fill      = fill(ci === 1 ? color : color + 'CC');
          cell.font      = font(10, true, 'FFFFFF');
          cell.alignment = align(ci === 1 ? 'left' : 'center');
          cell.border    = allBorders('medium', '80CBC4');
        });
        row.height = 20;
      };

      const addEquipRow = (label, dvt, qty) => {
        const row = ws.addRow([label, dvt, qty]);
        ws.mergeCells(`C${row.number}:J${row.number}`);
        row.height = 18;
        row.getCell(1).font      = font(10, false, '212121');
        row.getCell(1).alignment = align('left');
        row.getCell(1).fill      = fill('FAFAFA');
        row.getCell(1).border    = allBorders('thin', 'CFD8DC');
        row.getCell(2).font      = font(10, false, '5D4037');
        row.getCell(2).alignment = align('center');
        row.getCell(2).fill      = fill('FFF8E1');
        row.getCell(2).border    = allBorders('thin', 'CFD8DC');
        row.getCell(3).font      = font(10, true, '1565C0');
        row.getCell(3).alignment = align('center');
        row.getCell(3).fill      = fill('FFFFFF');
        row.getCell(3).numFmt    = '#,##0.##';
        row.getCell(3).border    = allBorders('thin', 'CFD8DC');
      };

      // ── Section 1 ──────────────────────────────────────────────────────────
      addSectionHeader('1. Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em', 0);
      addDataRow('- Tổng số phòng học',   [17, 17, 695, 17, 695, '', '', '', '']);
      addDataRow('+ Khu sinh hoạt chung', [17, 17, 695, 17, 695, '', '', '', ''], true);
      addDataRow('+ Khu ngủ',             [17, 10, 472.2, 10, 472.2, '', '', '', ''], true);
      addDataRow('+ Khu vệ sinh',         [17, 17, 223.81, 17, 223.81, '', '', '', ''], true);
      addDataRow('+ Hiên chơi, đón trẻ',  [17, 17, 560.75, 17, 560.75, '', '', '', ''], true);
      addDataRow('+ Kho nhóm, lớp',       [17, '', '', '', '', '', '', '', ''], true);
      addDataRow('+ Phòng giáo viên',      [2,  '', '', '', '', '', '', '', ''], true);

      // ── Section 2 ──────────────────────────────────────────────────────────
      addSectionHeader('2. Số bàn, ghế ngồi', 1);
      addDataRow('- Tổng số bàn',   [300, 277, '', '', '', '', '', '', '']);
      addDataRow('+ Bàn giáo viên', [ 38,  17, '', '', '', '', '', '', ''], true);
      addDataRow('+ Bàn học sinh',  [260, 260, '', '', '', '', '', '', ''], true);
      addDataRow('- Tổng số ghế',   [558, 558, '', '', '', '', '', '', '']);
      addDataRow('+ Ghế giáo viên', [ 38,  17, '', '', '', '', '', '', ''], true);
      addDataRow('+ Ghế học sinh',  [520, 520, '', '', '', '', '', '', ''], true);

      // ── Section 3 ──────────────────────────────────────────────────────────
      addSectionHeader('3. Khối phòng phục vụ học tập', 2);
      addDataRow('- Phòng thư viện',               [1, 1,  40, 1,  40, '', '', '', '']);
      addDataRow('- Phòng Giáo dục thể chất',      [1, '', '', '', '', '', '', '', '']);
      addDataRow('- Phòng Giáo dục nghệ thuật',    [1, 1, 73, 1, 73, '', '', '', '']);
      addDataRow('- Phòng Y tế học đường',          [1, 1, 12, 1, 12, '', '', '', '']);
      addDataRow('- Nhà tập đa năng',              [1, '', '', '', '', '', '', '', '']);
      addDataRow('- Phòng làm quen với máy tính',  [1, 1, 16, 1, 16, '', '', '', '']);
      addDataRow('- Sân chơi riêng',               [2, 1, 540, 1, 540, '', '', '', '']);

      // ── Section 4 ──────────────────────────────────────────────────────────
      addSectionHeader('4. Phòng tổ chức ăn, nghỉ', 3);
      addDataRow('- Nhà bếp',  [2, 2,  75, 1, 45, 1, 30, '', '']);
      addDataRow('- Phòng ăn', [1, 1,   9, '', '', '', '', 1, 9]);
      addDataRow('- Kho bếp',  [2, 2,  12, 1,  6, 1,  6, '', '']);

      // ── Section 5 ──────────────────────────────────────────────────────────
      addSectionHeader('5. Công trình công cộng và khối phòng phục vụ khác', 4);
      addDataRow('- Nhà để xe GV',             [1, 1, 108, '', '', '', '', 1, 108]);
      addDataRow('- Nhà để xe HS',             [0, '', '', '', '', '', '', '', '']);
      addDataRow('- Nhà vệ sinh dành cho GV',  [3, 2, 12, 2, 12, '', '', '', '']);

      // ── Section 6 ──────────────────────────────────────────────────────────
      addSectionHeader('6. Khối phòng hành chính quản trị', 5);
      addDataRow('- Phòng Hiệu trưởng',            [1, 1, 18, 1, 18, '', '', '', '']);
      addDataRow('- Phòng phó Hiệu trưởng',        [2, 2, 36, 2, 36, '', '', '', '']);
      addDataRow('- Phòng họp Hội đồng',           [1, '', '', '', '', '', '', '', '']);
      addDataRow('- Phòng họp (Tổ chuyên môn)',    [1, 1, 18, 1, 18, '', '', '', '']);
      addDataRow('- Văn phòng nhà trường',         [1, 1, 40, 1, 40, '', '', '', '']);
      addDataRow('- Phòng thường trực (Bảo vệ)',   [2, 1, 6.2, '', '', '', '', 1, 6.2]);
      addDataRow('- Nhà công vụ giáo viên',        [0, '', '', '', '', '', '', '', '']);
      addDataRow('- Phòng kho lưu trữ tài liệu',  [1, 1, 18, 1, 18, '', '', '', '']);

      // ── Blank separator ────────────────────────────────────────────────────
      const sepRow = ws.addRow([]);
      ws.mergeCells(`A${sepRow.number}:J${sepRow.number}`);
      ws.getCell(`A${sepRow.number}`).fill = fill('E8F5E9');
      sepRow.height = 8;

      // ── Section 7.1 ────────────────────────────────────────────────────────
      addEquipSectionHeader('7.1. Diện tích đất (Tính đến thời điểm hiện tại)', 6);
      addEquipRow('- Tổng diện tích khuôn viên đất', 'm²', 3943.3);
      addEquipRow('- Diện tích sân chơi',             'm²',  540);
      addEquipRow('- Diện tích sân vườn',             'm²',  250);

      // ── Section 7.2 ────────────────────────────────────────────────────────
      addEquipSectionHeader('7.2. Thiết bị dạy học và thiết bị CNTT', 6);
      addEquipRow('- Thiết bị dạy học tối thiểu',                   'Bộ',    17);
      addEquipRow('- Thiết bị đồ chơi ngoài trời',                  'Loại',  10);
      addEquipRow('- Tổng số máy tính đang được sử dụng',            'Bộ',    28);
      addEquipRow('- Tổng số đường truyền Internet',                 'Bộ',     2);
      addEquipRow('- Số máy tính được kết nối Internet',             'Bộ',    28);
      addEquipRow('- Số máy tính phục vụ công tác Quản lý',          'Bộ',     8);
      addEquipRow('- Số máy tính phục vụ công tác Giảng dạy, Học tập','Bộ',  20);
      addEquipRow('- Máy chiếu',      'Chiếc',  2);
      addEquipRow('- Máy Photocopy',  'Chiếc',  1);
      addEquipRow('- Máy in',         'Chiếc',  6);
      addEquipRow('- Máy Scaner',     'Chiếc',  2);
      addEquipRow('- Máy ép Plastic', 'Chiếc',  0);
      addEquipRow('- Tivi dùng cho công tác quản lý', 'Chiếc',  4);
      addEquipRow('- Tivi dùng tại các phòng học',    'Chiếc', 17);
      addEquipRow('- Đàn phím điện tử',               'Chiếc',  2);
      addEquipRow('- Tủ đựng đồ',                     'Chiếc', 51);

      // ── Footer ─────────────────────────────────────────────────────────────
      const lastR = ws.addRow([]);
      ws.mergeCells(`A${lastR.number}:J${lastR.number}`);
      ws.getCell(`A${lastR.number}`).value =
        `Mẫu tải về từ hệ thống Quản lý Tài sản – Trường MN Đức Xuân  |  ${new Date().toLocaleDateString('vi-VN')}`;
      ws.getCell(`A${lastR.number}`).font      = font(9, false, '90A4AE', true);
      ws.getCell(`A${lastR.number}`).alignment = align('right');
      ws.getCell(`A${lastR.number}`).fill      = fill('ECEFF1');
      lastR.height = 14;

      // ── Write & download ───────────────────────────────────────────────────
      const buffer = await wb.xlsx.writeBuffer();
      const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url    = URL.createObjectURL(blob);
      const a      = document.createElement('a');
      a.href     = url;
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
        { header: 'STT',           key: 'stt',              width: 6  },
        { header: 'Mã tài sản',    key: 'assetCode',        width: 13 },
        { header: 'Tên tài sản',   key: 'name',             width: 38 },
        { header: 'Loại tài sản',  key: 'category',         width: 32 },
        { header: 'Phòng/Địa điểm', key: 'room',            width: 20 },
        { header: 'Nhu cầu QĐ',   key: 'requiredQuantity', width: 13 },
        { header: 'Thực tế',       key: 'quantity',         width: 11 },
        { header: 'Diện tích (m²)', key: 'area',            width: 14 },
        { header: 'Loại CT',       key: 'constructionType', width: 14 },
        { header: 'Tình trạng',    key: 'condition',        width: 13 },
        { header: 'Ghi chú',       key: 'notes',            width: 22 },
      ];
      const NCOLS = COLS.length;
      ws.columns = COLS;

      // ── Palette ──────────────────────────────────────────────────────────────
      const CLR = {
        headerBg:   '1A56DB', headerFg: 'FFFFFF',
        catBg:      'E8F0FE', catFg:    '1A56DB',
        subtotalBg: 'EFF6FF', subtotalFg:'1E40AF',
        totalBg:    'DBEAFE', totalFg:  '1E3A8A',
        rowEven:    'F8FAFF',
        rowOdd:     'FFFFFF',
        condGood:   'D1FAE5', condBad:  'FEF3C7', condBroken: 'FEE2E2',
        border:     'CBD5E1',
        titleBg:    '1E40AF', titleFg:  'FFFFFF',
        subtitleBg: 'DBEAFE', subtitleFg:'1E3A8A',
      };

      const border = (color = CLR.border) => ({
        top:    { style: 'thin', color: { argb: color } },
        left:   { style: 'thin', color: { argb: color } },
        bottom: { style: 'thin', color: { argb: color } },
        right:  { style: 'thin', color: { argb: color } },
      });

      const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

      const fontBold = (size = 10, color = '000000') => ({ name: 'Times New Roman', size, bold: true, color: { argb: color } });
      const fontNormal = (size = 10) => ({ name: 'Times New Roman', size });

      const center = { horizontal: 'center', vertical: 'middle', wrapText: true };
      const left   = { horizontal: 'left',   vertical: 'middle', wrapText: true };
      const right  = { horizontal: 'right',  vertical: 'middle', wrapText: true };

      const lastCol = String.fromCharCode(64 + NCOLS); // 'K'

      // ── Row 1: Logo / School name ─────────────────────────────────────────
      ws.addRow([]);
      const r1 = ws.getRow(1);
      r1.height = 22;
      ws.mergeCells(`A1:${lastCol}1`);
      const c1 = ws.getCell('A1');
      c1.value = 'TRƯỜNG MẦM NON ĐỨC XUÂN';
      c1.font  = { name: 'Times New Roman', size: 13, bold: true, color: { argb: CLR.titleFg } };
      c1.fill  = fill(CLR.titleBg);
      c1.alignment = center;

      // ── Row 2: Report title ───────────────────────────────────────────────
      ws.addRow([]);
      const r2 = ws.getRow(2);
      r2.height = 22;
      ws.mergeCells(`A2:${lastCol}2`);
      const c2 = ws.getCell('A2');
      c2.value = 'BÁO CÁO DANH SÁCH TÀI SẢN';
      c2.font  = { name: 'Times New Roman', size: 13, bold: true, color: { argb: CLR.subtitleFg } };
      c2.fill  = fill(CLR.subtitleBg);
      c2.alignment = center;

      // ── Row 3: Meta info ──────────────────────────────────────────────────
      ws.addRow([]);
      const r3 = ws.getRow(3);
      r3.height = 18;
      ws.mergeCells(`A3:E3`);
      const c3a = ws.getCell('A3');
      const now = new Date();
      c3a.value = `Ngày xuất: ${now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}   Giờ: ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
      c3a.font  = fontNormal(10);
      c3a.alignment = left;
      ws.mergeCells(`F3:${lastCol}3`);
      const c3b = ws.getCell('F3');
      const filterDesc = [
        `Tổng: ${filtered.length} tài sản`,
        filterCategory ? `Loại: ${filterCategory}` : '',
        search ? `Tìm kiếm: "${search}"` : '',
      ].filter(Boolean).join('   |   ');
      c3b.value = filterDesc;
      c3b.font  = fontNormal(10);
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
        cell.value     = col.header;
        cell.font      = fontBold(10, CLR.headerFg);
        cell.fill      = fill(CLR.headerBg);
        cell.alignment = center;
        cell.border    = border('90A8C3');
      });

      // ── Row 6: Unit row ───────────────────────────────────────────────────
      ws.addRow([]);
      const r6 = ws.getRow(6);
      r6.height = 18;
      const UNITS = ['', '', '', '', '', 'Cái/Phòng', 'Cái/Phòng', 'm²', '', '', ''];
      UNITS.forEach((u, i) => {
        const cell = r6.getCell(i + 1);
        cell.value     = u;
        cell.font      = { name: 'Times New Roman', size: 9, italic: true, color: { argb: '64748B' } };
        cell.fill      = fill('EFF6FF');
        cell.alignment = center;
        cell.border    = border('CBD5E1');
      });

      // ── Data rows, grouped by category ────────────────────────────────────
      const COND_COLOR = {
        'Tốt':        'D1FAE5',
        'Khá':        'D1FAE5',
        'Trung bình': 'FEF3C7',
        'Hỏng':       'FEE2E2',
        'Cần sửa':    'FEF3C7',
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
        catCell.font  = fontBold(10, CLR.catFg);
        catCell.fill  = fill(CLR.catBg);
        catCell.alignment = left;
        catCell.border = {
          top:    { style: 'medium', color: { argb: '93B4F0' } },
          bottom: { style: 'medium', color: { argb: '93B4F0' } },
          left:   { style: 'thin',   color: { argb: CLR.border } },
          right:  { style: 'thin',   color: { argb: CLR.border } },
        };

        let catReq = 0, catAct = 0;

        rows.forEach((a, i) => {
          const isEven = i % 2 === 0;
          const dr = ws.getRow(rowIdx++);
          dr.height = 18;
          const vals = [
            i + 1,
            a.assetCode,
            a.name,
            a.category,
            a.room || '',
            a.requiredQuantity || 0,
            a.quantity || 0,
            a.area != null ? a.area : '',
            a.constructionType !== 'Không áp dụng' ? a.constructionType : '',
            a.condition,
            a.notes || '',
          ];
          vals.forEach((v, ci) => {
            const cell = dr.getCell(ci + 1);
            cell.value     = v;
            cell.font      = fontNormal(10);
            cell.fill      = fill(isEven ? CLR.rowEven : CLR.rowOdd);
            cell.border    = border(CLR.border);
            cell.alignment = ci === 0 ? center : ci >= 5 && ci <= 7 ? { ...center } : left;
          });

          // Condition color highlight
          const condColor = COND_COLOR[a.condition];
          if (condColor) {
            ws.getCell(`J${rowIdx - 1}`).fill = fill(condColor);
          }

          // Quantity vs required: highlight cell
          const qty = a.quantity || 0;
          const req = a.requiredQuantity || 0;
          if (req > 0) {
            ws.getCell(`G${rowIdx - 1}`).font = {
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
        ws.getCell(`A${rowIdx - 1}`).font  = fontBold(10, CLR.subtotalFg);
        ws.getCell(`A${rowIdx - 1}`).fill  = fill(CLR.subtotalBg);
        ws.getCell(`A${rowIdx - 1}`).alignment = right;
        ws.getCell(`A${rowIdx - 1}`).border = border('93B4F0');

        ws.getCell(`F${rowIdx - 1}`).value = catReq;
        ws.getCell(`F${rowIdx - 1}`).font  = fontBold(10, CLR.subtotalFg);
        ws.getCell(`F${rowIdx - 1}`).fill  = fill(CLR.subtotalBg);
        ws.getCell(`F${rowIdx - 1}`).alignment = center;
        ws.getCell(`F${rowIdx - 1}`).border = border('93B4F0');

        ws.getCell(`G${rowIdx - 1}`).value = catAct;
        ws.getCell(`G${rowIdx - 1}`).font  = fontBold(10, CLR.subtotalFg);
        ws.getCell(`G${rowIdx - 1}`).fill  = fill(CLR.subtotalBg);
        ws.getCell(`G${rowIdx - 1}`).alignment = center;
        ws.getCell(`G${rowIdx - 1}`).border = border('93B4F0');

        ['H','I','J','K'].forEach(col => {
          ws.getCell(`${col}${rowIdx - 1}`).fill   = fill(CLR.subtotalBg);
          ws.getCell(`${col}${rowIdx - 1}`).border = border('93B4F0');
        });

        grandReq   += catReq;
        grandAct   += catAct;
        grandCount += rows.length;
      });

      // ── Grand total row ───────────────────────────────────────────────────
      const totalRow = ws.getRow(rowIdx++);
      totalRow.height = 22;
      ws.mergeCells(`A${rowIdx - 1}:E${rowIdx - 1}`);
      ws.getCell(`A${rowIdx - 1}`).value = `TỔNG CỘNG: ${grandCount} tài sản`;
      ws.getCell(`A${rowIdx - 1}`).font  = fontBold(11, CLR.totalFg);
      ws.getCell(`A${rowIdx - 1}`).fill  = fill(CLR.totalBg);
      ws.getCell(`A${rowIdx - 1}`).alignment = center;
      ws.getCell(`A${rowIdx - 1}`).border = { top: { style: 'medium', color: { argb: '3B82F6' } }, bottom: { style: 'medium', color: { argb: '3B82F6' } }, left: border().left, right: border().right };

      ws.getCell(`F${rowIdx - 1}`).value = grandReq;
      ws.getCell(`F${rowIdx - 1}`).font  = fontBold(11, CLR.totalFg);
      ws.getCell(`F${rowIdx - 1}`).fill  = fill(CLR.totalBg);
      ws.getCell(`F${rowIdx - 1}`).alignment = center;
      ws.getCell(`F${rowIdx - 1}`).border = ws.getCell(`A${rowIdx - 1}`).border;

      ws.getCell(`G${rowIdx - 1}`).value = grandAct;
      ws.getCell(`G${rowIdx - 1}`).font  = fontBold(11, CLR.totalFg);
      ws.getCell(`G${rowIdx - 1}`).fill  = fill(CLR.totalBg);
      ws.getCell(`G${rowIdx - 1}`).alignment = center;
      ws.getCell(`G${rowIdx - 1}`).border = ws.getCell(`A${rowIdx - 1}`).border;

      ['H','I','J','K'].forEach(col => {
        ws.getCell(`${col}${rowIdx - 1}`).fill   = fill(CLR.totalBg);
        ws.getCell(`${col}${rowIdx - 1}`).border = ws.getCell(`A${rowIdx - 1}`).border;
      });

      // ── Footer row ────────────────────────────────────────────────────────
      const footerRow = ws.getRow(rowIdx);
      footerRow.height = 14;
      ws.mergeCells(`A${rowIdx}:${lastCol}${rowIdx}`);
      ws.getCell(`A${rowIdx}`).value = `Xuất bởi hệ thống Quản lý Tài sản – Trường MN Đức Xuân  |  ${now.toLocaleString('vi-VN')}`;
      ws.getCell(`A${rowIdx}`).font  = { name: 'Times New Roman', size: 9, italic: true, color: { argb: '94A3B8' } };
      ws.getCell(`A${rowIdx}`).alignment = right;

      // ── Auto-filter on header row ─────────────────────────────────────────
      ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: NCOLS } };

      // ── Generate & download ───────────────────────────────────────────────
      const buffer = await wb.xlsx.writeBuffer();
      const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url    = URL.createObjectURL(blob);
      const a      = document.createElement('a');
      const dateStr = now.toISOString().slice(0, 10);
      a.href     = url;
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
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={handleExportExcel}
          sx={{ whiteSpace: 'nowrap', textTransform: 'none', borderColor: '#059669', color: '#059669', '&:hover': { borderColor: '#047857', backgroundColor: '#F0FDF4' } }}
        >
          Xuất Excel
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
  const menuItems = useSchoolAdminMenu();
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
      menuItems={menuItems}
      activeKey="assets-list"
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={user?.fullName || user?.username || 'School Admin'}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: 3, backgroundColor: '#f9fafb' }}>
        <Typography variant="h5" fontWeight={700} mb={2}>Quản lý Tài sản</Typography>
        <AssetsTab />
      </Paper>
    </RoleLayout>
  );
}
