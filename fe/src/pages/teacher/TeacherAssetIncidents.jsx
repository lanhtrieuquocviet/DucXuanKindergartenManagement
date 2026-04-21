import AddIcon from '@mui/icons-material/Add';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, IconButton,
  InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { del, ENDPOINTS, get, post, postFormData, put } from '../../service/api';

const STATUS_LABEL = {
  pending: { label: 'Chờ tiếp nhận', color: 'warning' },
  processing: { label: 'Đang xử lý', color: 'info' },
  fixed: { label: 'Đã khắc phục', color: 'success' },
};

const INCIDENT_TYPE_OPTIONS = [
  { value: 'broken', label: 'Hư hỏng' },
  { value: 'lost', label: 'Thất lạc' },
];
const MAX_IMAGES = 5;

const emptyForm = () => ({
  assetKey: '',
  assetName: '',
  assetCode: '',
  type: 'broken',
  classId: '',
  className: '',
  allocationId: '',
  description: '',
  images: [],
});

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN');
}

function getClassIdValue(classId) {
  if (!classId) return '';
  if (typeof classId === 'object') return classId._id || '';
  return classId;
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

export default function TeacherAssetIncidents() {
  const navigate  = useNavigate();
  const { user, logout, isInitializing, hasPermission, hasRole } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading]           = useState(true);
  const [requests, setRequests]         = useState([]);
  const [allocation, setAllocation]     = useState(null);
  const [openModal, setOpenModal]       = useState(false);
  const [editing, setEditing]           = useState(null);
  const [form, setForm]                 = useState(emptyForm());
  const [saving, setSaving]             = useState(false);
  const [uploading, setUploading]       = useState(false);
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
      const [rRes, aRes] = await Promise.all([
        get(ENDPOINTS.TEACHER.ASSET_INCIDENTS),
        get(ENDPOINTS.TEACHER.MY_ASSET_ALLOCATION),
      ]);
      setRequests(rRes?.data?.incidents || []);
      setAllocation(aRes?.data?.allocation || null);
    } catch (err) {
      toast.error(err?.message || 'Không tải được dữ liệu.');
    } finally { setLoading(false); }
  };

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm(),
      classId: getClassIdValue(allocation?.classId),
      className: allocation?.className || '',
      allocationId: allocation?._id || '',
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (r) => {
    setEditing(r);
    setForm({
      assetKey:       '',
      assetName:     r.assetName || '',
      assetCode:     r.assetCode || '',
      type:          r.type || 'broken',
      classId:       r.classId?._id || r.classId || '',
      className:     r.className || r.classId?.className || '',
      allocationId:  r.allocationId?._id || r.allocationId || '',
      description:   r.description || '',
      images:        r.images || [],
    });
    setOpenModal(true);
  };

  const handleImagePick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const invalidType = files.find((file) => !file.type?.startsWith('image/'));
    if (invalidType) {
      toast.error('Chỉ cho phép tải lên tệp ảnh.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const oversized = files.find((file) => file.size > 5 * 1024 * 1024);
    if (oversized) {
      toast.error('Mỗi ảnh tối đa 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
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

  const handleSave = async () => {
    if (!allocation?._id) { toast.error('Chưa có biên bản bàn giao tài sản đang hoạt động cho lớp của bạn.'); return; }
    if (!form.assetName.trim()) { toast.error('Vui lòng chọn tài sản gặp sự cố.'); return; }
    const allocationClassId = getClassIdValue(allocation?.classId);
    if (!form.classId || String(form.classId) !== String(allocationClassId)) {
      toast.error('Lớp báo cáo không hợp lệ.');
      return;
    }
    if (!form.type) { toast.error('Vui lòng chọn loại sự cố.'); return; }
    if (!form.description.trim()) { toast.error('Vui lòng nhập mô tả sự cố.'); return; }
    if (form.description.trim().length < 10) {
      toast.error('Mô tả sự cố cần ít nhất 10 ký tự.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        assetName: form.assetName.trim(),
        assetCode: form.assetCode.trim(),
        classId: allocationClassId,
        className: allocation.className || form.className || '',
        allocationId: allocation._id,
        type: form.type,
        description: form.description.trim(),
        images: form.images,
      };
      if (editing?._id) {
        await put(ENDPOINTS.TEACHER.ASSET_INCIDENT_DETAIL(editing._id), payload);
        toast.success('Cập nhật báo cáo sự cố thành công.');
      } else {
        await post(ENDPOINTS.TEACHER.ASSET_INCIDENTS, payload);
        toast.success('Đã gửi báo cáo sự cố lên Ban Giám Hiệu.');
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
      await del(ENDPOINTS.TEACHER.ASSET_INCIDENT_DETAIL(deleteTarget._id));
      toast.success('Xóa báo cáo sự cố thành công.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Không xóa được yêu cầu.');
    } finally { setDeleting(false); }
  };

  const userName = user?.fullName || user?.username || 'Teacher';
  const allocationAssets = useMemo(() => {
    if (!allocation) return [];
    const norm = (arr = [], source = 'assets') => arr.map((asset, idx) => ({
      key: `${source}-${idx}`,
      name: asset?.name || '',
      assetCode: asset?.assetCode || '',
    })).filter((asset) => asset.name);
    return [...norm(allocation.assets, 'assets'), ...norm(allocation.extraAssets, 'extra')];
  }, [allocation]);
  const assetOptions = useMemo(() => {
    const options = [...allocationAssets];
    if (form.assetName && !options.some((item) => item.name === form.assetName && item.assetCode === (form.assetCode || ''))) {
      options.unshift({
        key: `current-${form.assetName}-${form.assetCode || ''}`,
        name: form.assetName,
        assetCode: form.assetCode || '',
      });
    }
    return options;
  }, [allocationAssets, form.assetName, form.assetCode]);

  const menuItems = useMemo(() => [
    { key: 'classes',          label: 'Lớp phụ trách' },
    { key: 'students',         label: 'Danh sách học sinh' },
    { key: 'attendance',       label: 'Điểm danh' },
    { key: 'pickup-approval',  label: 'Đơn đăng ký đưa đón' },
    { key: 'leave-requests',   label: 'Danh sách đơn xin nghỉ' },
    { key: 'contact-book',     label: 'Sổ liên lạc' },
    { key: 'asset-incidents-teacher', label: 'Báo cáo sự cố CSVC' },
    { key: 'class-assets',     label: 'Tài sản lớp' },
    ...(hasRole('InventoryStaff') ? [{ key: 'asset-inspection', label: 'Kiểm kê tài sản' }] : []),
  ], [hasPermission, hasRole]);

  const handleMenuSelect = (key) => {
    const MAP = {
      classes: '/teacher', students: '/teacher/students',
      'contact-book': '/teacher/contact-book', attendance: '/teacher/attendance',
      'pickup-approval': '/teacher/pickup-approval', 'leave-requests': '/teacher/leave-requests',
      'asset-incidents-teacher': '/teacher/asset-incidents',
      'class-assets': '/teacher/class-assets', 'asset-inspection': '/teacher/asset-inspection',
    };
    if (MAP[key]) navigate(MAP[key]);
  };

  return (
    <RoleLayout
      title="Báo cáo sự cố cơ sở vật chất"
      description="Giáo viên báo cáo sự cố tài sản của lớp và theo dõi tiến độ xử lý từ Ban Giám Hiệu."
      menuItems={menuItems}
      activeKey="asset-incidents-teacher"
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="h6" fontWeight={700}>Danh sách sự cố đã báo cáo</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          disabled={!allocation?._id}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Báo cáo sự cố
        </Button>
      </Box>

      {!allocation?._id && !loading && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 2 }}>
          <Typography color="text.secondary" variant="body2">
            Lớp của bạn chưa có biên bản bàn giao tài sản đang hoạt động nên chưa thể báo cáo sự cố.
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
            <Typography color="text.secondary" variant="body2">Chưa có báo cáo sự cố nào.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Ngày báo cáo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tài sản gặp sự cố</TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Lớp</TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} align="center">Loại sự cố</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Ảnh</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((r) => {
                  const canEdit = r.status !== 'fixed';
                  const canDelete = r.status === 'pending';
                  return (
                    <TableRow key={r._id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {formatDate(r.createdAt)}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{r.assetName}</Typography>
                        {(r.description || r.assetCode) && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            {r.assetCode ? `Mã: ${r.assetCode}` : r.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {r.className || r.classId?.className || '—'}
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {INCIDENT_TYPE_OPTIONS.find((t) => t.value === r.type)?.label || r.type || '—'}
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
          {editing ? 'Chỉnh sửa báo cáo sự cố' : 'Tạo báo cáo sự cố'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Tài sản gặp sự cố *</InputLabel>
              <Select
                label="Tài sản gặp sự cố *"
                value={form.assetKey}
                onChange={(e) => {
                  const selected = assetOptions.find((item) => item.key === e.target.value);
                  setForm((f) => ({
                    ...f,
                    assetKey: e.target.value,
                    assetName: selected?.name || '',
                    assetCode: selected?.assetCode || '',
                    classId: getClassIdValue(allocation?.classId),
                    className: allocation?.className || '',
                    allocationId: allocation?._id || '',
                  }));
                }}
              >
                {assetOptions.map((asset) => (
                  <MenuItem key={asset.key} value={asset.key}>
                    {asset.name}{asset.assetCode ? ` (${asset.assetCode})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Mã tài sản (nếu có)"
              placeholder="Ví dụ: TS-0012"
              fullWidth size="small"
              value={form.assetCode}
              onChange={e => setForm(f => ({ ...f, assetCode: e.target.value }))}
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />

            <TextField
              label="Lớp báo cáo"
              fullWidth
              size="small"
              value={allocation?.className || form.className || '—'}
              disabled
              helperText="Sự cố chỉ được báo cáo trong lớp đang được bàn giao tài sản."
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Loại sự cố *</InputLabel>
              <Select label="Loại sự cố *" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {INCIDENT_TYPE_OPTIONS.map((type) => <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField
              label="Mô tả sự cố *"
              fullWidth size="small" multiline minRows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              slotProps={{ htmlInput: { maxLength: 1000 } }}
              helperText={`${form.description.length}/1000`}
            />

            {/* ── Image upload ── */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Ảnh hiện trạng sự cố (tối đa {MAX_IMAGES} ảnh)
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
          <Button variant="contained" onClick={() => handleSave()} disabled={saving || uploading}>
            {saving ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}Gửi báo cáo
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
        title="Xóa báo cáo sự cố"
        message={`Bạn có chắc muốn xóa báo cáo "${deleteTarget?.assetName}"? Hành động này không thể hoàn tác.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </RoleLayout>
  );
}
