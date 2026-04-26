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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

function PositionFormModal({ open, onClose, initialData, onSubmit, loading }) {
  const [form, setForm] = useState({ title: '', description: '', roleName: '' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        title: initialData?.title || '',
        description: initialData?.description || '',
        roleName: initialData?.roleName || '',
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
    if (!form.title.trim()) errs.title = 'Tên chức vụ không được để trống';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {initialData ? 'Chỉnh sửa chức vụ' : 'Tạo chức vụ mới'}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              name="title"
              label="Tên chức vụ *"
              value={form.title}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!formErrors.title}
              helperText={formErrors.title || ' '}
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

export default function ManageStaffPositions() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadPositions = async () => {
    setLoading(true);
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.JOB_POSITIONS.LIST);
      setPositions(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPositions(); }, []);

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (selected) {
        await put(ENDPOINTS.SCHOOL_ADMIN.JOB_POSITIONS.UPDATE(selected._id), form);
        toast.success('Cập nhật thành công');
      } else {
        await post(ENDPOINTS.SCHOOL_ADMIN.JOB_POSITIONS.CREATE, form);
        toast.success('Tạo mới thành công');
      }
      loadPositions();
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
      await del(ENDPOINTS.SCHOOL_ADMIN.JOB_POSITIONS.DELETE(confirmDelete._id));
      toast.success('Xóa thành công');
      loadPositions();
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
          background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
          borderRadius: 3,
          px: 4, py: 3, mb: 3, color: 'white'
        }}
      >
        <Typography variant="h5" fontWeight={700}>Quản lý Chức vụ</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>Tạo và chỉnh sửa các chức vụ nhân viên trong hệ thống.</Typography>
      </Paper>

      <Paper elevation={2} sx={{ borderRadius: 3, p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="subtitle1" fontWeight={600}>Danh sách chức vụ</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => { setSelected(null); setModalOpen(true); }}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Tạo chức vụ mới
          </Button>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Tên chức vụ</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Mô tả</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : positions.length === 0 ? (
                <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4 }}>Chưa có dữ liệu.</TableCell></TableRow>
              ) : positions.map((pos) => (
                <TableRow key={pos._id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{pos.title}</TableCell>
                  <TableCell>{pos.description || '-'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton size="small" color="primary" onClick={() => { setSelected(pos); setModalOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                      {!pos.isDefault && (
                        <IconButton size="small" color="error" onClick={() => setConfirmDelete(pos)}><DeleteIcon fontSize="small" /></IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <PositionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selected}
        onSubmit={handleSubmit}
        loading={submitting}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa chức vụ "${confirmDelete?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={submitting}
      />
    </Box>
  );
}
