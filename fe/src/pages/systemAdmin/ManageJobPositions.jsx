import {
  Alert,
  Box,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { del, get, post, put, ENDPOINTS } from '../../service/api';
import JobPositionHeader from './components/JobPositionHeader';
import JobPositionTable from './components/JobPositionTable';
import JobPositionDialog from './components/JobPositionDialog';

const ManageJobPositions = () => {
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPos, setEditingPos] = useState(null);
  const [form, setForm] = useState({ title: '', roleName: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const res = await get(ENDPOINTS.SYSTEM_ADMIN.JOB_POSITIONS);
      setPositions(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách chức vụ');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await get(ENDPOINTS.SYSTEM_ADMIN.ROLES);
      setRoles(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách vai trò:', err);
    }
  };

  useEffect(() => {
    fetchPositions();
    fetchRoles();
  }, []);

  const handleOpenDialog = (pos = null) => {
    if (pos) {
      setEditingPos(pos);
      setForm({
        title: pos.title,
        roleName: pos.roleName || '',
        description: pos.description || '',
      });
    } else {
      setEditingPos(null);
      setForm({ title: '', roleName: '', description: '' });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Vui lòng nhập tên chức vụ');
      return;
    }

    try {
      setSubmitting(true);
      if (editingPos) {
        await put(ENDPOINTS.SYSTEM_ADMIN.UPDATE_JOB_POSITION(editingPos._id), form);
        toast.success('Cập nhật chức vụ thành công');
      } else {
        await post(ENDPOINTS.SYSTEM_ADMIN.CREATE_JOB_POSITION, form);
        toast.success('Tạo chức vụ thành công');
      }
      setOpenDialog(false);
      fetchPositions();
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Lỗi khi lưu chức vụ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chức vụ này?')) return;
    try {
      await del(ENDPOINTS.SYSTEM_ADMIN.DELETE_JOB_POSITION(id));
      toast.success('Đã xóa chức vụ');
      fetchPositions();
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Lỗi khi xóa chức vụ');
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <JobPositionHeader 
        onRefresh={fetchPositions} 
        onAddClick={() => handleOpenDialog()} 
        loading={loading} 
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <JobPositionTable 
        loading={loading} 
        positions={positions} 
        onEdit={handleOpenDialog} 
        onDelete={handleDelete} 
      />

      <JobPositionDialog 
        open={openDialog} 
        onClose={() => !submitting && setOpenDialog(false)} 
        editingPos={editingPos} 
        form={form} 
        setForm={setForm} 
        roles={roles} 
        submitting={submitting} 
        onSubmit={handleSubmit} 
      />
    </Box>
  );
};

export default ManageJobPositions;
