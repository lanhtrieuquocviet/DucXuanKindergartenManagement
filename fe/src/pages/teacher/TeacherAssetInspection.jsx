import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { useTeacher } from '../../context/TeacherContext';
import { get, post, put, del, ENDPOINTS } from '../../service/api';

const STATUS_LABEL = {
  draft:    { label: 'Nháp',      color: 'default' },
  pending:  { label: 'Chờ duyệt', color: 'warning' },
  approved: { label: 'Đã duyệt',  color: 'success' },
  rejected: { label: 'Từ chối',   color: 'error' },
};

const emptyAssetRow = () => ({ category: '', assetCode: '', name: '', unit: 'Cái', quantity: 0, targetUser: '', notes: '' });
const emptyForm = () => ({
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
      <DialogContent><Typography variant="body2">{message}</Typography></DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading}>Hủy</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={loading}>
          {loading ? 'Đang xóa...' : 'Xóa'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Add Category Dialog ──────────────────────────────────────────────────────
function AddCategoryDialog({ open, onClose, onConfirm }) {
  const [value, setValue] = useState('');
  const handle = () => { if (!value.trim()) return; onConfirm(value.trim()); setValue(''); };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Thêm nhóm tài sản</DialogTitle>
      <DialogContent>
        <TextField autoFocus fullWidth size="small" label="Tên nhóm"
          placeholder="VD: ĐỒ DÙNG, THIẾT BỊ DẠY HỌC"
          value={value} onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()} sx={{ mt: 1 }} />
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={() => { onClose(); setValue(''); }}>Hủy</Button>
        <Button variant="contained" onClick={handle} disabled={!value.trim()}>Thêm</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function TeacherAssetInspection() {
  const navigate  = useNavigate();
  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, logout, isInitializing } = useAuth();

  const [loading, setLoading]         = useState(true);
  const [minutes, setMinutes]         = useState([]);
  const [committees, setCommittees]   = useState([]);
  const [openModal, setOpenModal]     = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(emptyForm());
  const [saving, setSaving]           = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const roles = user?.roles?.map(r => r.roleName || r) || [];
    if (!roles.includes('Teacher')) { navigate('/', { replace: true }); return; }
    load();
  }, [isInitializing, user, navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        get(ENDPOINTS.TEACHER.ASSET_MINUTES),
        get(ENDPOINTS.TEACHER.ASSET_COMMITTEES),
      ]);
      setMinutes(mRes?.data?.minutes || []);
      setCommittees(cRes?.data?.committees || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được dữ liệu.');
    } finally { setLoading(false); }
  };

  const handleOpenCreate = () => { setEditing(null); setForm(emptyForm()); setOpenModal(true); };

  const handleOpenEdit = m => {
    setEditing(m);
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
    if (!form.className.trim()) { toast.error('Vui lòng nhập Lớp.'); return; }
    if (!form.inspectionDate)  { toast.error('Vui lòng chọn ngày kiểm kê.'); return; }
    setSaving(true);
    try {
      if (editing?._id) {
        await put(ENDPOINTS.TEACHER.ASSET_MINUTES_DETAIL(editing._id), form);
        toast.success('Cập nhật biên bản thành công.');
      } else {
        await post(ENDPOINTS.TEACHER.ASSET_MINUTES, form);
        toast.success('Tạo biên bản thành công. Chờ Ban Giám Hiệu duyệt.');
      }
      setOpenModal(false); load();
    } catch (err) { toast.error(err?.message || 'Lưu thất bại.'); }
    finally { setSaving(false); }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await del(ENDPOINTS.TEACHER.ASSET_MINUTES_DETAIL(deleteTarget));
      toast.success('Đã xóa biên bản.');
      setDeleteTarget(null); load();
    } catch (err) { toast.error(err?.message || 'Xóa thất bại.'); }
    finally { setDeleting(false); }
  };

  const isReadOnly        = editing?.status === 'approved' || editing?.status === 'pending';
  const parsedDate        = form.inspectionDate ? new Date(form.inspectionDate) : null;
  const dayStr            = parsedDate ? parsedDate.getDate() : '___';
  const monthStr          = parsedDate ? parsedDate.getMonth() + 1 : '___';
  const yearStr           = parsedDate ? parsedDate.getFullYear() : '______';
  const selectedCommittee = committees.find(c => c._id === form.committeeId) || null;

  const cellBorder = { border: '1px solid #555', padding: '4px 6px', fontSize: 13 };
  const headerCell = { ...cellBorder, fontWeight: 700, textAlign: 'center', background: '#f3f4f6' };

  const { isCommitteeMember } = useTeacher();
  const menuItems = [
    { key: 'classes',          label: 'Lớp phụ trách' },
    { key: 'students',         label: 'Danh sách học sinh' },
    { key: 'attendance',       label: 'Điểm danh' },
    { key: 'pickup-approval',  label: 'Đơn đưa đón' },
    { key: 'schedule',         label: 'Lịch dạy & hoạt động' },
    { key: 'messages',         label: 'Thông báo cho phụ huynh' },
    ...(isCommitteeMember ? [{ key: 'asset-inspection', label: 'Kiểm kê tài sản' }] : []),
  ];

  const handleMenuSelect = key => {
    if (key === 'classes')          navigate('/teacher');
    if (key === 'students')         navigate('/teacher');
    if (key === 'attendance')       navigate('/teacher/attendance');
    if (key === 'pickup-approval')  navigate('/teacher/pickup-approval');
    if (key === 'asset-inspection') navigate('/teacher/asset-inspection');
  };

  return (
    <RoleLayout
      title="Kiểm kê Tài sản"
      description="Tạo và quản lý biên bản kiểm kê tài sản lớp phụ trách."
      menuItems={menuItems}
      activeKey="asset-inspection"
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={user?.fullName || user?.username || 'Giáo viên'}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: 3, backgroundColor: '#f9fafb' }}>
        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} mb={3} gap={1}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Biên bản kiểm kê tài sản</Typography>
            <Typography variant="body2" color="text.secondary">Tạo biên bản và gửi lên Ban Giám Hiệu để duyệt</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}
            sx={{ background: 'linear-gradient(90deg,#16a34a,#15803d)', textTransform: 'none', alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
            Tạo Biên Bản Mới
          </Button>
        </Stack>

        {/* List */}
        {loading ? (
          <Stack alignItems="center" py={5}><CircularProgress size={28} /></Stack>
        ) : minutes.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography color="text.secondary">Bạn chưa có biên bản kiểm kê nào.</Typography>
            <Button variant="outlined" sx={{ mt: 2, textTransform: 'none' }} onClick={handleOpenCreate}>
              Tạo biên bản đầu tiên
            </Button>
          </Paper>
        ) : isMobile ? (
          <Stack spacing={1.5}>
            {minutes.map(m => {
              const s = STATUS_LABEL[m.status] || STATUS_LABEL.pending;
              const canEdit = m.status !== 'approved';
              return (
                <Paper key={m._id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box>
                      <Typography fontWeight={600}>{m.minutesNumber || '—'}</Typography>
                      <Typography variant="body2" color="text.secondary">{formatDate(m.createdAt)}</Typography>
                      <Typography variant="body2">{[m.className, m.scope].filter(Boolean).join(' - ') || '—'}</Typography>
                    </Box>
                    <Chip label={s.label} color={s.color} size="small" />
                  </Stack>
                  {m.status === 'rejected' && (
                    <Typography variant="caption" color="error.main">Biên bản bị từ chối — chỉnh sửa và gửi lại</Typography>
                  )}
                  <Stack direction="row" spacing={1} mt={1}>
                    <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleOpenEdit(m)}
                      sx={{ textTransform: 'none', flex: 1 }}>
                      {canEdit ? 'Chỉnh sửa' : 'Xem'}
                    </Button>
                    {canEdit && (
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(m._id)}><DeleteIcon fontSize="small" /></IconButton>
                    )}
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
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {minutes.map(m => {
                  const s = STATUS_LABEL[m.status] || STATUS_LABEL.pending;
                  const canEdit = m.status !== 'approved';
                  return (
                    <TableRow key={m._id} hover>
                      <TableCell>{m.minutesNumber || '—'}</TableCell>
                      <TableCell>{formatDate(m.createdAt)}</TableCell>
                      <TableCell>{[m.className, m.scope].filter(Boolean).join(' - ') || '—'}</TableCell>
                      <TableCell>
                        <Stack spacing={0.3}>
                          <Chip label={s.label} color={s.color} size="small" sx={{ alignSelf: 'flex-start' }} />
                          {m.status === 'rejected' && (
                            <Typography variant="caption" color="error.main">Bị từ chối — cần chỉnh sửa</Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Button size="small" variant="outlined" startIcon={canEdit ? <EditIcon /> : null}
                            onClick={() => handleOpenEdit(m)} sx={{ textTransform: 'none' }}>
                            {canEdit ? 'Chỉnh sửa' : 'Xem'}
                          </Button>
                          {canEdit && (
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(m._id)}><DeleteIcon fontSize="small" /></IconButton>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* ── Official Document Modal ── */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { maxHeight: isMobile ? '100%' : '95vh' } }}>
        <DialogTitle sx={{ pb: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <span>{editing ? 'Chỉnh sửa biên bản' : 'Tạo biên bản kiểm kê'}</span>
            {editing && <Chip label={STATUS_LABEL[editing.status]?.label || '—'} color={STATUS_LABEL[editing.status]?.color || 'default'} size="small" />}
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {isReadOnly && editing?.status === 'pending' && (
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: '#fffbeb', borderColor: 'warning.light' }}>
              <Typography variant="body2" color="warning.dark">Biên bản đang chờ Ban Giám Hiệu duyệt. Bạn không thể chỉnh sửa lúc này.</Typography>
            </Paper>
          )}
          {editing?.status === 'rejected' && (
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: '#fef2f2', borderColor: 'error.light' }}>
              <Typography variant="body2" color="error.dark">Biên bản bị từ chối. Hãy chỉnh sửa và lưu lại để gửi lên duyệt lần nữa.</Typography>
            </Paper>
          )}

          {/* Phần nhập liệu */}
          <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 2, bgcolor: '#f9fafb' }}>
            <Typography variant="body2" fontWeight={600} mb={1.5} color="text.secondary">Thông tin biên bản</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} flexWrap="wrap">
              <TextField label="Lớp *" size="small" value={form.className}
                onChange={e => setForm(p => ({ ...p, className: e.target.value }))} disabled={isReadOnly}
                placeholder="VD: MẪU GIÁO LỚN 1" required
                error={!form.className && !isReadOnly}
                helperText={!form.className && !isReadOnly ? 'Bắt buộc nhập' : ''}
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 150 } }} />
              <TextField label="Phạm vi" size="small" value={form.scope}
                onChange={e => setForm(p => ({ ...p, scope: e.target.value }))} disabled={isReadOnly}
                placeholder="VD: Phòng học, Nhà bếp"
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 160 } }} />
              <TextField label="Địa điểm" size="small" value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))} disabled={isReadOnly}
                sx={{ minWidth: { xs: '100%', sm: 130 } }} />
              <TextField label="Ngày kiểm kê" type="date" size="small" InputLabelProps={{ shrink: true }}
                value={form.inspectionDate} onChange={e => setForm(p => ({ ...p, inspectionDate: e.target.value }))}
                disabled={isReadOnly} sx={{ minWidth: { xs: '100%', sm: 155 } }} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} flexWrap="wrap">
              <TextField label="Giờ bắt đầu (VD: 14h)" size="small" value={form.inspectionTime}
                onChange={e => setForm(p => ({ ...p, inspectionTime: e.target.value }))} disabled={isReadOnly}
                sx={{ minWidth: { xs: '100%', sm: 155 } }} />
              <TextField label="Giờ kết thúc (VD: 11h30)" size="small" value={form.endTime}
                onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} disabled={isReadOnly}
                sx={{ minWidth: { xs: '100%', sm: 175 } }} />
              <FormControl size="small" sx={{ flex: 1, minWidth: { xs: '100%', sm: 190 } }}>
                <InputLabel>Ban kiểm kê</InputLabel>
                <Select value={form.committeeId} label="Ban kiểm kê"
                  onChange={e => setForm(p => ({ ...p, committeeId: e.target.value }))} disabled={isReadOnly}>
                  <MenuItem value="">— Không chọn —</MenuItem>
                  {committees.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <TextField label="II. Lí do kiểm kê" size="small" fullWidth multiline rows={2}
              value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
              disabled={isReadOnly} sx={{ mb: 2 }} />
            <TextField label="IV. Hình thức kiểm kê" size="small" fullWidth multiline rows={2}
              value={form.inspectionMethod} onChange={e => setForm(p => ({ ...p, inspectionMethod: e.target.value }))}
              disabled={isReadOnly} />
          </Paper>

          {/* Biên bản chính thức */}
          <Box sx={{ fontFamily: 'Times New Roman, serif', fontSize: { xs: 12, sm: 14 }, color: '#000', p: { xs: 0, sm: 1 } }}>
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

            <Typography sx={{ fontWeight: 700, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>I/ Thành phần Ban kiểm kê:</Typography>
            {selectedCommittee?.members?.length ? (
              selectedCommittee.members.map((m, i) => (
                <Typography key={i} sx={{ ml: 2, fontFamily: 'inherit', fontSize: 'inherit' }}>
                  {i + 1}. {m.fullName}{m.role !== 'Thành viên' ? ` - ${m.role}` : ''}
                </Typography>
              ))
            ) : (
              <Typography sx={{ ml: 2, fontStyle: 'italic', color: '#888', fontFamily: 'inherit', fontSize: 'inherit' }}>
                (Chọn Ban kiểm kê ở phần thông tin phía trên)
              </Typography>
            )}

            <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>II/ Lí do kiểm kê:</Typography>
            <Typography sx={{ ml: 2, fontFamily: 'inherit', fontSize: 'inherit' }}>- {form.reason || '...'}</Typography>

            <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>III/ Thời gian kiểm kê:</Typography>
            <Typography sx={{ ml: 2, fontFamily: 'inherit', fontSize: 'inherit' }}>
              - Vào hồi {form.inspectionTime || '___'} ngày {dayStr} tháng {monthStr} năm {yearStr}
            </Typography>

            <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>IV/ Hình thức kiểm kê:</Typography>
            {(form.inspectionMethod || '').split('\n').map((line, i) => (
              <Typography key={i} sx={{ ml: 2, fontFamily: 'inherit', fontSize: 'inherit' }}>- {line}</Typography>
            ))}

            <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>V/ Nội dung kiểm kê:</Typography>
            <Typography sx={{ fontWeight: 700, textAlign: 'center', mb: 1, fontFamily: 'inherit', fontSize: 'inherit' }}>
              KIỂM KÊ TÀI SẢN CÓ TRONG LỚP HỌC:
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

            <Typography sx={{ fontFamily: 'inherit', fontSize: { xs: 11, sm: 13 }, mb: 2 }}>
              Kiểm kê kết thúc vào lúc {form.endTime || '___'} ngày {dayStr} tháng {monthStr} năm {yearStr}.
              {' '}Biên bản này được sao thành 2 bản, giáo viên chủ nhiệm lớp giữ một bản và Ban kiểm kê giữ một bản.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} textAlign="center">
              {[
                { title: 'XÁC NHẬN CỦA NHÀ TRƯỜNG', sub: 'Phó Hiệu Trưởng', name: selectedCommittee?.members?.find(m => m.role === 'Trưởng ban')?.fullName },
                { title: 'GIÁO VIÊN CHỦ NHIỆM', sub: '', name: user?.fullName || '' },
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
          {!isReadOnly && (
            <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ textTransform: 'none' }}>
              {saving ? 'Đang lưu...' : editing?.status === 'rejected' ? 'Lưu & Gửi lại' : 'Lưu & Gửi duyệt'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <AddCategoryDialog open={categoryDialog} onClose={() => setCategoryDialog(false)}
        onConfirm={name => { handleAddCategory(name); setCategoryDialog(false); }} />

      <ConfirmDialog open={!!deleteTarget} title="Xóa biên bản" message="Bạn có chắc chắn muốn xóa biên bản này?"
        onConfirm={handleConfirmDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </RoleLayout>
  );
}
