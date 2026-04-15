import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, post, postFormData, ENDPOINTS, del, put } from '../../service/api';
import {
  Box, Paper, Typography, Avatar, Stack, Chip, IconButton,
  CircularProgress, Alert, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider,
} from '@mui/material';
import {
  ArrowBack, Add, Edit, Delete, CameraAlt, Close,
  HowToReg, Phone, People,
} from '@mui/icons-material';

const PRIMARY = '#059669';
const PRIMARY_DARK = '#047857';
const BG = '#f0fdf4';

const STATUS_CONFIG = {
  pending:  { label: 'Chờ duyệt', color: 'warning' },
  approved: { label: 'Đã duyệt',  color: 'success' },
  rejected: { label: 'Từ chối',   color: 'error'   },
};

export default function PickupRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isInitializing } = useAuth();
  const [children, setChildren] = useState([]);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isOtherRelation, setIsOtherRelation] = useState(false);
  const [form, setForm] = useState({ studentId: searchParams.get('studentId') || '', fullName: '', relation: '', phone: '', imageFile: null });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const selectedChild = children.find((c) => c._id === form.studentId) || null;
  const selectedClassId = selectedChild?.classId?._id || selectedChild?.classId || '';
  const selectedStudentRequests = pickupRequests.filter((r) => {
    const reqStudentId = r.student?._id || r.student;
    return String(reqStudentId || '') === String(form.studentId || '');
  });

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    fetchChildren();
    fetchMyPickupRequests();
  }, [isInitializing, user, navigate]);

  const fetchChildren = async () => {
    try {
      const res = await get(ENDPOINTS.AUTH.MY_CHILDREN);
      const list = res.data || [];
      setChildren(list);
      if (list.length > 0) {
        setForm(p => ({
          ...p,
          studentId: p.studentId && list.some(c => c._id === p.studentId) ? p.studentId : list[0]._id,
        }));
      }
    } catch { setError('Không tải được thông tin học sinh.'); }
  };

  const fetchMyPickupRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await get(ENDPOINTS.PICKUP.MY_REQUESTS || '/pickup/my-requests');
      setPickupRequests(res.data || []);
    } catch {} finally { setLoadingRequests(false); }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      const file = files?.[0];
      if (file) { setForm(p => ({ ...p, imageFile: file })); setPreviewUrl(URL.createObjectURL(file)); }
    } else if (name === 'fullName') {
      if (value.length <= 50) setForm(p => ({ ...p, [name]: value }));
    } else if (name === 'phone') {
      const nums = value.replace(/[^0-9]/g, '');
      if (nums.length <= 10) setForm(p => ({ ...p, phone: nums }));
    } else if (name === 'relation') {
      if (isOtherRelation) { setForm(p => ({ ...p, relation: value })); }
      else if (value === 'Other') { setIsOtherRelation(true); setForm(p => ({ ...p, relation: '' })); }
      else { setIsOtherRelation(false); setForm(p => ({ ...p, [name]: value })); }
    } else { setForm(p => ({ ...p, [name]: value })); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      if (!form.fullName.trim()) throw new Error('Vui lòng nhập họ tên người đón');
      if (!form.studentId) throw new Error('Vui lòng chọn học sinh');
      if (!selectedClassId) throw new Error('Học sinh chưa được đăng ký lớp nên không thể gửi đơn');
      if (!form.phone.trim()) throw new Error('Vui lòng nhập số điện thoại');
      if (!/^0[35789]\d{8}$/.test(form.phone.trim())) throw new Error('Số điện thoại không hợp lệ.');
      if (!form.relation.trim()) throw new Error('Vui lòng nhập mối quan hệ');
      if (!form.imageFile && !editingId) throw new Error('Vui lòng chọn ảnh để đăng ký');
      let imageUrl = '';
      if (form.imageFile) {
        const fd = new FormData(); fd.append('avatar', form.imageFile);
        const uploadRes = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_AVATAR, fd);
        imageUrl = uploadRes?.data?.url || '';
      }
      const payload = { studentId: form.studentId, fullName: form.fullName.trim(), relation: form.relation.trim(), phone: form.phone.trim(), imageUrl };
      if (editingId) { await put(ENDPOINTS.PICKUP.UPDATE(editingId), payload); setSuccess('Cập nhật thành công!'); }
      else {
        if (selectedStudentRequests.length >= 5) throw new Error('Mỗi học sinh tối đa 5 người đưa đón');
        await post(ENDPOINTS.PICKUP.CREATE, payload); setSuccess('Đăng ký thành công!');
      }
      resetForm();
      fetchMyPickupRequests();
    } catch (err) { setError(err.message || 'Thao tác thất bại'); }
    finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setEditingId(null); setIsOtherRelation(false);
    setForm(p => ({ studentId: p.studentId || children[0]?._id || '', fullName: '', relation: '', phone: '', imageFile: null }));
    setPreviewUrl(null);
  };

  const handleEdit = (req) => {
    setEditingId(req._id);
    const std = ['Bố', 'Mẹ', 'Ông', 'Bà', 'Anh/Chị'];
    setIsOtherRelation(!std.includes(req.relation));
    setForm({ studentId: req.student?._id || form.studentId, fullName: req.fullName, relation: req.relation, phone: req.phone, imageFile: null });
    setPreviewUrl(req.imageUrl || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    try { await del(ENDPOINTS.PICKUP.DELETE(deleteId)); setSuccess('Đã xóa thành công'); fetchMyPickupRequests(); }
    catch (err) { setError(err.message); } finally { setDeleteId(null); }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: BG }}>
      {/* AppBar */}
      <Box sx={{
        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
        px: 2, py: 2, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(5,150,105,0.3)',
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton onClick={() => navigate('/student')} size="small"
            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Box>
            <Typography color="white" fontWeight={700} fontSize="1rem">Quản lý đưa đón</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem' }}>
              {pickupRequests.length}/5 người đã đăng ký
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 2.5, pb: 4 }}>
        {/* Form Card */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #bbf7d0', overflow: 'hidden', mb: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} px={2} py={1.5} borderBottom="1px solid #f0fdf4">
            <Avatar sx={{ bgcolor: '#d1fae5', width: 32, height: 32 }}>
              <Add sx={{ fontSize: 18, color: PRIMARY }} />
            </Avatar>
            <Typography fontWeight={700} fontSize="0.9rem" color="#111827">
              {editingId ? 'Cập nhật thông tin người đón' : 'Đăng ký người đưa đón mới'}
            </Typography>
          </Stack>

          <Box px={2.5} py={2.5} component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            {/* Photo upload */}
            <Stack alignItems="center" mb={2.5}>
              <Box sx={{ position: 'relative' }}>
                <Box component="input" type="file" name="image" id="pickup-image" accept="image/*" onChange={handleChange} sx={{ display: 'none' }} />
                <Box component="label" htmlFor="pickup-image" sx={{ cursor: 'pointer', display: 'block' }}>
                  <Avatar
                    src={previewUrl}
                    sx={{
                      width: 96, height: 96, borderRadius: 3,
                      border: '2px dashed', borderColor: previewUrl ? 'transparent' : PRIMARY,
                      bgcolor: '#f0fdf4', cursor: 'pointer',
                    }}
                  >
                    <Stack alignItems="center">
                      <CameraAlt sx={{ color: PRIMARY, fontSize: 28 }} />
                      <Typography fontSize="0.62rem" fontWeight={700} color={PRIMARY} textTransform="uppercase">
                        Ảnh{!editingId && ' *'}
                      </Typography>
                    </Stack>
                  </Avatar>
                </Box>
                {previewUrl && (
                  <IconButton size="small" onClick={() => { setPreviewUrl(null); setForm(p => ({ ...p, imageFile: null })); }}
                    sx={{ position: 'absolute', top: -6, right: -6, bgcolor: '#ef4444', color: 'white', width: 22, height: 22,
                      '&:hover': { bgcolor: '#dc2626' } }}>
                    <Close sx={{ fontSize: 12 }} />
                  </IconButton>
                )}
              </Box>
            </Stack>

            <Stack spacing={2}>
              {children.length > 1 && !editingId && (
                <FormControl size="small" fullWidth required>
                  <InputLabel>Đăng ký cho bé</InputLabel>
                  <Select
                    label="Đăng ký cho bé"
                    value={form.studentId}
                    onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))}
                    sx={{ borderRadius: 2 }}
                  >
                    {children.map(c => (
                      <MenuItem key={c._id} value={c._id}>
                        {c.fullName} — {c.classId?.className || 'Chưa xếp lớp'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {!selectedClassId && !!form.studentId && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  Học sinh này chưa được xếp lớp. Vui lòng liên hệ nhà trường để đăng ký lớp trước khi gửi đơn đưa đón.
                </Alert>
              )}
              <TextField
                label={`Họ tên người đón (${form.fullName.length}/50)`}
                name="fullName" value={form.fullName} onChange={handleChange} required fullWidth size="small"
                InputProps={{ startAdornment: <HowToReg sx={{ mr: 1, fontSize: 18, color: '#9ca3af' }} /> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                label="Số điện thoại" name="phone" value={form.phone} onChange={handleChange}
                required fullWidth size="small" placeholder="0xxxxxxxxx"
                InputProps={{ startAdornment: <Phone sx={{ mr: 1, fontSize: 18, color: '#9ca3af' }} /> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              {!isOtherRelation ? (
                <FormControl size="small" fullWidth required>
                  <InputLabel>Mối quan hệ</InputLabel>
                  <Select name="relation" value={form.relation} label="Mối quan hệ" onChange={handleChange}
                    sx={{ borderRadius: 2 }}>
                    <MenuItem value=""><em>-- Chọn mối quan hệ --</em></MenuItem>
                    {['Bố','Mẹ','Ông','Bà','Anh/Chị'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                    <MenuItem value="Other">Khác...</MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Mối quan hệ (nhập tự do)" name="relation" value={form.relation} onChange={handleChange}
                    required fullWidth size="small" autoFocus inputProps={{ maxLength: 30 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Button onClick={() => { setIsOtherRelation(false); setForm(p => ({...p, relation: ''})); }}
                    variant="outlined" color="error" size="small" sx={{ borderRadius: 2, whiteSpace: 'nowrap', minWidth: 'auto', px: 1.5 }}>
                    Hủy
                  </Button>
                </Stack>
              )}
            </Stack>

            <Stack direction="row" spacing={1.5} mt={3}>
              {editingId && (
                <Button onClick={() => { resetForm(); setError(''); setSuccess(''); }}
                  variant="outlined" sx={{ flex: 1, borderRadius: 2, textTransform: 'none', borderColor: '#d1d5db', color: '#6b7280' }}>
                  Hủy sửa
                </Button>
              )}
              <Button type="submit" variant="contained" disabled={submitting || (!editingId && !selectedClassId)} sx={{
                flex: 1, borderRadius: 2, textTransform: 'none', fontWeight: 700,
                bgcolor: PRIMARY, '&:hover': { bgcolor: PRIMARY_DARK },
              }}>
                {submitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : editingId ? 'Cập nhật' : 'Đăng ký ngay'}
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* List */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Box px={2} py={1.5} borderBottom="1px solid #f3f4f6">
            <Typography fontWeight={700} fontSize="0.9rem">Người đưa đón đã đăng ký</Typography>
          </Box>
          {loadingRequests ? (
            <Stack alignItems="center" py={4}><CircularProgress sx={{ color: PRIMARY }} size={28} /></Stack>
          ) : pickupRequests.length === 0 ? (
            <Stack alignItems="center" py={6} spacing={1}>
              <Typography fontSize="2rem">👤</Typography>
              <Typography color="text.secondary" fontSize="0.875rem">Chưa có người đưa đón nào</Typography>
            </Stack>
          ) : (
            pickupRequests.map((req, idx) => {
              const cfg = STATUS_CONFIG[req.status] || { label: req.status, color: 'default' };
              return (
                <Box key={req._id}>
                  <Stack direction="row" spacing={1.5} alignItems="center" px={2} py={1.75}>
                    <Avatar src={req.imageUrl} sx={{ width: 52, height: 52, borderRadius: 2.5, flexShrink: 0, border: '1px solid #e5e7eb' }}>
                      <People sx={{ color: '#9ca3af' }} />
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Typography fontWeight={700} fontSize="0.9rem" noWrap>{req.fullName}</Typography>
                      <Typography fontSize="0.78rem" color="text.secondary" mt={0.25}>{req.relation} · {req.phone}</Typography>
                      <Chip label={cfg.label} color={cfg.color} size="small" sx={{ mt: 0.5, height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                    </Box>
                    {req.status === 'pending' && (
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={() => handleEdit(req)}
                          sx={{ bgcolor: '#eff6ff', color: '#2563eb', borderRadius: 2, '&:hover': { bgcolor: '#dbeafe' } }}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setDeleteId(req._id)}
                          sx={{ bgcolor: '#fef2f2', color: '#dc2626', borderRadius: 2, '&:hover': { bgcolor: '#fee2e2' } }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    )}
                  </Stack>
                  {idx < pickupRequests.length - 1 && <Divider />}
                </Box>
              );
            })
          )}
        </Paper>
      </Box>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, mx: 2 } }}>
        <DialogContent>
          <Stack alignItems="center" spacing={2} pt={2}>
            <Avatar sx={{ bgcolor: '#fee2e2', width: 56, height: 56 }}>
              <Delete sx={{ color: '#dc2626', fontSize: 28 }} />
            </Avatar>
            <Typography fontWeight={700} fontSize="1rem">Xác nhận xóa?</Typography>
            <Typography color="text.secondary" fontSize="0.875rem" textAlign="center">
              Người đưa đón này sẽ bị xóa khỏi danh sách và không thể hoàn tác.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteId(null)} variant="outlined" sx={{ flex: 1, borderRadius: 2, textTransform: 'none', borderColor: '#d1d5db', color: '#6b7280' }}>
            Hủy
          </Button>
          <Button onClick={confirmDelete} variant="contained" color="error" sx={{ flex: 1, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            Xóa ngay
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
