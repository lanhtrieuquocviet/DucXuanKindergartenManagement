import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { get, post, put, del, ENDPOINTS } from '../../../service/api';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

function CategoryFormModal({ open, onClose, initialData, onSubmit, loading, typeLabel }) {
  const [form, setForm] = useState({ name: '', description: '', status: 'active' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        name: initialData?.name || '',
        description: initialData?.description || '',
        status: initialData?.status || 'active',
      });
      setFormErrors({});
    }
  }, [open, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Tên không được để trống';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {initialData ? `Chỉnh sửa ${typeLabel}` : `Tạo ${typeLabel} mới`}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              name="name"
              label={`Tên ${typeLabel} *`}
              value={form.name}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!formErrors.name}
              helperText={formErrors.name || ' '}
            />
            <TextField
              name="description"
              label="Mô tả"
              value={form.description}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
              size="small"
            />
            <FormControl fullWidth size="small">
              <InputLabel>Trạng thái</InputLabel>
              <Select name="status" value={form.status} label="Trạng thái" onChange={handleChange}>
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Không hoạt động</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="submit" variant="contained" color="success" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default function ManageCategoriesBase({ type, title, description, typeLabel, activeKey }) {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await get(`${ENDPOINTS.SCHOOL_ADMIN.GENERAL_CATEGORIES.LIST}?type=${type}`);
      setCategories(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, [type]);

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (selected) {
        await put(ENDPOINTS.SCHOOL_ADMIN.GENERAL_CATEGORIES.UPDATE(selected._id), form);
        toast.success('Cập nhật thành công');
      } else {
        await post(ENDPOINTS.SCHOOL_ADMIN.GENERAL_CATEGORIES.CREATE, { ...form, type });
        toast.success('Tạo mới thành công');
      }
      loadCategories();
      setModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await del(ENDPOINTS.SCHOOL_ADMIN.GENERAL_CATEGORIES.DELETE(confirmDelete._id));
      toast.success('Xóa thành công');
      loadCategories();
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi xóa');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
          borderRadius: 3,
          px: 4, py: 3, mb: 3, color: 'white'
        }}
      >
        <Typography variant="h5" fontWeight={700}>{title}</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>{description}</Typography>
      </Paper>

      <Paper elevation={2} sx={{ borderRadius: 3, p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="subtitle1" fontWeight={600}>Danh sách {typeLabel}</Typography>
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => { setSelected(null); setModalOpen(true); }}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Tạo {typeLabel} mới
          </Button>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Tên {typeLabel}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Mô tả</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : categories.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>Chưa có dữ liệu.</TableCell></TableRow>
              ) : categories.map((cat) => (
                <TableRow key={cat._id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{cat.name}</TableCell>
                  <TableCell>{cat.description || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={cat.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      color={cat.status === 'active' ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton size="small" color="primary" onClick={() => { setSelected(cat); setModalOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => setConfirmDelete(cat)}><DeleteIcon fontSize="small" /></IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selected}
        onSubmit={handleSubmit}
        loading={submitting}
        typeLabel={typeLabel}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa "${confirmDelete?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={submitting}
      />
    </Box>
  );
}
