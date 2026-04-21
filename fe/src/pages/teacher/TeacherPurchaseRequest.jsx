import AddIcon from '@mui/icons-material/Add';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, IconButton, InputAdornment,
  InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { del, ENDPOINTS, get, post, postFormData, put } from '../../service/api';

const STATUS_LABEL = {
  draft: { label: 'Nháp', color: 'default' },
  pending: { label: 'Chờ duyệt', color: 'warning' },
  approved: { label: 'Đã duyệt', color: 'success' },
  rejected: { label: 'Từ chối', color: 'error' },
};

const UNIT_OPTIONS = ['Cái', 'Bộ', 'Chiếc', 'Hộp', 'Gói', 'Cuộn', 'Quyển', 'Tờ', 'Kg', 'Lít'];
const MAX_IMAGES = 5;

const emptyForm = () => ({
  assetName: '',
  quantity: 1,
  unit: 'Cái',
  classId: '',
  estimatedCost: '',
  reason: '',
  notes: '',
  images: [],
});

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN');
}

function formatCost(n) {
  if (!n && n !== 0) return '';
  return Number(n).toLocaleString('vi-VN') + ' đ';
}

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

export default function TeacherPurchaseRequest() {
  const navigate = useNavigate();
  const { user, logout, isInitializing, hasPermission, hasRole } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const roles = user?.roles?.map(r => r.roleName || r) || [];
    if (!roles.includes('Teacher') && !roles.includes('HeadTeacher')) { navigate('/', { replace: true }); return; }
    load();
  }, [isInitializing, user, navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const [rRes, cRes] = await Promise.all([
        get(ENDPOINTS.TEACHER.PURCHASE_REQUESTS),
        get(ENDPOINTS.TEACHER.MY_CLASSES),
      ]);
      setRequests(rRes?.data?.requests || []);
      setMyClasses(cRes?.data?.classes || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được dữ liệu.');
    } finally { setLoading(false); }
  };

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpenModal(true);
  };

  const handleOpenEdit = (r) => {
    setEditing(r);
    setForm({
      assetName: r.assetName || '',
      quantity: r.quantity || 1,
      unit: r.unit || 'Cái',
      classId: r.classId?._id || r.classId || '',
      estimatedCost: r.estimatedCost || '',
      reason: r.reason || '',
      notes: r.notes || '',
      images: r.images || [],
    });
    setOpenModal(true);
  };

  const handleImagePick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) { toast.warning(`Tối đa ${MAX_IMAGES} ảnh.`); return; }
    const toUpload = files.slice(0, remaining);
    setUploading(true);
    try {
      const urls = await Promise.all(
        toUpload.map(async (file) => {
          const fd = new FormData();
          fd.append('image', file);
          const res = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_PURCHASE_IMAGE, fd);
          return res?.data?.url;
        })
      );
      const valid = urls.filter(Boolean);
      setForm(f => ({ ...f, images: [...f.images, ...valid] }));
      if (valid.length < toUpload.length) toast.warning('Một số ảnh upload thất bại.');
    } catch {
      toast.error('Upload ảnh thất bại.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (idx) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const handleSave = async (submitStatus) => {
    if (!form.assetName.trim()) { toast.error('Vui lòng nhập tên đồ dùng/tài sản.'); return; }
    if (form.assetName.trim().length > 200) { toast.error('Tên đồ dùng/tài sản tối đa 200 ký tự.'); return; }
    if (!form.classId) { toast.error('Vui lòng chọn lớp.'); return; }
    const qty = Number(form.quantity);
    if (!qty || qty < 1 || !Number.isInteger(qty)) { toast.error('Số lượng phải là số nguyên lớn hơn 0.'); return; }
    if (qty > 1000) { toast.error('Số lượng tối đa 1.000.'); return; }
    if (form.estimatedCost && Number(form.estimatedCost) > 10_000_000) { toast.error('Ước tính chi phí không được vượt quá 10.000.000 đ.'); return; }
    if (submitStatus === 'pending' && !form.reason.trim()) { toast.error('Vui lòng nhập lý do mua sắm trước khi gửi duyệt.'); return; }
    if (form.reason.length > 500) { toast.error('Lý do mua sắm tối đa 500 ký tự.'); return; }
    if (form.notes.length > 200) { toast.error('Ghi chú thêm tối đa 200 ký tự.'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : 0,
        status: submitStatus,
      };
      if (editing?._id) {
        await put(ENDPOINTS.TEACHER.PURCHASE_REQUEST_DETAIL(editing._id), payload);
        toast.success('Cập nhật yêu cầu thành công.');
      } else {
        await post(ENDPOINTS.TEACHER.PURCHASE_REQUESTS, payload);
        toast.success(submitStatus === 'pending' ? 'Gửi yêu cầu thành công.' : 'Lưu nháp thành công.');
      }
      setOpenModal(false);
      load();
    } catch (err) {
      toast.error(err?.message || 'Có lỗi xảy ra.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await del(ENDPOINTS.TEACHER.PURCHASE_REQUEST_DETAIL(deleteTarget._id));
      toast.success('Xóa yêu cầu thành công.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Không xóa được yêu cầu.');
    } finally { setDeleting(false); }
  };

  const userName = user?.fullName || user?.username || 'Teacher';

  const menuItems = useMemo(() => [
    { key: 'classes', label: 'Lớp phụ trách' },
    { key: 'students', label: 'Danh sách học sinh' },
    { key: 'attendance', label: 'Điểm danh' },
    { key: 'pickup-approval', label: 'Đơn đăng ký đưa đón' },
    { key: 'leave-requests', label: 'Danh sách đơn xin nghỉ' },
    { key: 'contact-book', label: 'Sổ liên lạc' },
    { key: 'purchase-request', label: 'Cơ sở vật chất' },
    { key: 'class-assets', label: 'Tài sản lớp' },
    ...(hasRole('InventoryStaff') ? [{ key: 'asset-inspection', label: 'Kiểm kê tài sản' }] : []),
  ], [hasPermission, hasRole]);

  const handleMenuSelect = (key) => {
    const MAP = {
      classes: '/teacher', students: '/teacher/students',
      'contact-book': '/teacher/contact-book', attendance: '/teacher/attendance',
      'pickup-approval': '/teacher/pickup-approval', 'leave-requests': '/teacher/leave-requests',
      'purchase-request': '/teacher/purchase-request',
      'class-assets': '/teacher/class-assets', 'asset-inspection': '/teacher/asset-inspection',
    };
    if (MAP[key]) navigate(MAP[key]);
  };

  return (
    <RoleLayout
      title="Yêu cầu mua sắm"
      description="Tạo và theo dõi yêu cầu mua sắm đồ dùng cho lớp phụ trách."
      menuItems={menuItems}
      activeKey="purchase-request"
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="h6" fontWeight={700}>Danh sách yêu cầu mua sắm</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          disabled={myClasses.length === 0}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Tạo yêu cầu
        </Button>
      </Box>

      {myClasses.length === 0 && !loading && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 2 }}>
          <Typography color="text.secondary" variant="body2">
            Bạn chưa được phân công dạy lớp nào. Vui lòng liên hệ Ban giám hiệu.
          </Typography>
        </Paper>
      )}

      {/* ── Table ── */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : requests.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">Chưa có yêu cầu mua sắm nào.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Số YC</TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Ngày tạo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tên đồ dùng / Tài sản</TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Lớp</TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} align="right">Số lượng</TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} align="right">Ước tính chi phí</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Ảnh</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((r) => {
                  const canEdit = ['draft', 'rejected'].includes(r.status);
                  const canDelete = r.status === 'draft';
                  return (
                    <TableRow key={r._id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 13, whiteSpace: 'nowrap' }}>
                        {r.requestCode || '—'}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {formatDate(r.createdAt)}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{r.assetName}</Typography>
                        {r.reason && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            {r.reason}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {r.classId?.className || '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {r.quantity} {r.unit}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {r.estimatedCost ? formatCost(r.estimatedCost) : '—'}
                      </TableCell>
                      <TableCell align="center">
                        {r.images?.length > 0 ? (
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {r.images.slice(0, 3).map((url, i) => (
                              <Box
                                key={i}
                                component="img"
                                src={url}
                                onClick={() => setPreviewImg(url)}
                                sx={{
                                  width: 36, height: 36, borderRadius: 1,
                                  objectFit: 'cover', cursor: 'pointer',
                                  border: '1px solid', borderColor: 'divider',
                                  '&:hover': { opacity: 0.8 },
                                }}
                              />
                            ))}
                            {r.images.length > 3 && (
                              <Box sx={{
                                width: 36, height: 36, borderRadius: 1,
                                bgcolor: 'grey.100', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 11, color: 'text.secondary',
                                border: '1px solid', borderColor: 'divider',
                              }}>
                                +{r.images.length - 3}
                              </Box>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={STATUS_LABEL[r.status]?.label || r.status}
                          color={STATUS_LABEL[r.status]?.color || 'default'}
                          size="small"
                          sx={{ fontSize: 11, height: 22 }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        <IconButton size="small" onClick={() => handleOpenEdit(r)} disabled={!canEdit} title="Chỉnh sửa">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(r)} disabled={!canDelete} title="Xóa">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* ── Create / Edit Modal ── */}
      <Dialog open={openModal} onClose={() => !saving && !uploading && setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editing ? 'Chỉnh sửa yêu cầu mua sắm' : 'Tạo yêu cầu mua sắm'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {/* Asset name */}
            <TextField
              label="Tên đồ dùng / Tài sản *"
              placeholder="Ví dụ: Đồ chơi lắp ghép"
              fullWidth size="small"
              value={form.assetName}
              onChange={e => setForm(f => ({ ...f, assetName: e.target.value }))}
              slotProps={{ htmlInput: { maxLength: 200 } }}
              helperText={`${form.assetName.length}/200`}
            />

            {/* Quantity + Unit */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Số lượng *" type="number" size="small"
                slotProps={{ htmlInput: { min: 1, max: 1000, step: 1 } }}
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                sx={{ flex: 1 }}
              />
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Đơn vị tính</InputLabel>
                <Select label="Đơn vị tính" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                  {UNIT_OPTIONS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            {/* Class */}
            <FormControl size="small" fullWidth>
              <InputLabel>Phòng / Lớp đề xuất *</InputLabel>
              <Select label="Phòng / Lớp đề xuất *" value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}>
                {myClasses.map(c => <MenuItem key={c._id} value={c._id}>{c.className}</MenuItem>)}
              </Select>
            </FormControl>

            {/* Estimated cost */}
            <TextField
              label="Ước tính chi phí (VNĐ)" type="number" size="small" fullWidth
              value={form.estimatedCost}
              onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value }))}
              slotProps={{
                htmlInput: { min: 0, max: 9999999999 },
                input: { endAdornment: <InputAdornment position="end">đ</InputAdornment> },
              }}
            />

            {/* Reason */}
            <TextField
              label="Lý do mua sắm *"
              placeholder="Ví dụ: Đồ chơi cũ đã hỏng nhiều, cần thay mới cho trẻ"
              fullWidth size="small" multiline minRows={3}
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              slotProps={{ htmlInput: { maxLength: 500 } }}
              helperText={`${form.reason.length}/500`}
            />

            {/* Notes */}
            <TextField
              label="Ghi chú thêm"
              fullWidth size="small" multiline minRows={2}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              slotProps={{ htmlInput: { maxLength: 200 } }}
              helperText={`${form.notes.length}/200`}
            />

            {/* ── Image upload ── */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Ảnh bằng chứng (tối đa {MAX_IMAGES} ảnh)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {/* Thumbnails */}
                {form.images.map((url, i) => (
                  <Box key={i} sx={{ position: 'relative', width: 72, height: 72 }}>
                    <Box
                      component="img"
                      src={url}
                      onClick={() => setPreviewImg(url)}
                      sx={{
                        width: 72, height: 72, borderRadius: 1.5,
                        objectFit: 'cover', cursor: 'pointer',
                        border: '1px solid', borderColor: 'divider',
                        '&:hover': { opacity: 0.85 },
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveImage(i)}
                      sx={{
                        position: 'absolute', top: -8, right: -8,
                        bgcolor: 'error.main', color: 'white',
                        width: 20, height: 20, p: 0,
                        '&:hover': { bgcolor: 'error.dark' },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Box>
                ))}

                {/* Upload button */}
                {form.images.length < MAX_IMAGES && (
                  <Box
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    sx={{
                      width: 72, height: 72, borderRadius: 1.5,
                      border: '2px dashed', borderColor: uploading ? 'grey.300' : 'primary.main',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      color: uploading ? 'grey.400' : 'primary.main',
                      bgcolor: 'primary.50',
                      transition: 'all 0.15s',
                      '&:hover': { bgcolor: uploading ? 'primary.50' : 'primary.100' },
                    }}
                  >
                    {uploading
                      ? <CircularProgress size={20} />
                      : <>
                        <AddPhotoAlternateIcon sx={{ fontSize: 22 }} />
                        <Typography variant="caption" sx={{ fontSize: 10, mt: 0.25 }}>Thêm ảnh</Typography>
                      </>
                    }
                  </Box>
                )}
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleImagePick}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 2, gap: 1 }}>
          <Button onClick={() => setOpenModal(false)} disabled={saving || uploading}>Hủy</Button>
          <Button variant="outlined" onClick={() => handleSave('draft')} disabled={saving || uploading}>
            {saving ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}Lưu lại
          </Button>
          <Button variant="contained" onClick={() => handleSave('pending')} disabled={saving || uploading}>
            {saving ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}Gửi duyệt
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Image Preview ── */}
      <Dialog open={!!previewImg} onClose={() => setPreviewImg(null)} maxWidth="md">
        <DialogContent sx={{ p: 1 }}>
          <Box component="img" src={previewImg} sx={{ maxWidth: '100%', maxHeight: '80vh', display: 'block', borderRadius: 1 }} />
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa yêu cầu mua sắm"
        message={`Bạn có chắc muốn xóa yêu cầu "${deleteTarget?.assetName}"? Hành động này không thể hoàn tác.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </RoleLayout>
  );
}
