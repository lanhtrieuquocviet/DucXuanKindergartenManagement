import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Stack,
  TextField, MenuItem, Select, InputLabel, FormControl,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import facilityService from '../../../service/facility.api';
import { toast } from 'react-toastify';

const LOCATION_TYPES = [
  { value: 'classroom', label: 'Phòng học' },
  { value: 'office', label: 'Văn phòng / Hành chính' },
  { value: 'warehouse', label: 'Kho tổng' },
  { value: 'outdoor', label: 'Sân chơi / Khu ngoài trời' },
  { value: 'functional_room', label: 'Phòng chức năng' },
  { value: 'kitchen', label: 'Nhà bếp' },
  { value: 'other', label: 'Khác' }
];

const ManageLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [staff, setStaff] = useState([]);
  
  const [form, setForm] = useState({
    name: '',
    type: 'classroom',
    area: '',
    managerId: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
    fetchStaff();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await facilityService.getLocations();
      if (resp?.status === 'success') {
        setLocations(resp.data || []);
      }
    } catch (error) {
      toast.error('Lỗi lấy danh sách vị trí');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const resp = await facilityService.getStaffs();
      if (resp?.status === 'success') {
        setStaff(resp.data || []);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditItem(item);
      setForm({
        name: item.name,
        type: item.type,
        area: item.area,
        managerId: item.managerId?._id || item.managerId || '',
        description: item.description || ''
      });
    } else {
      setEditItem(null);
      setForm({
        name: '',
        type: 'classroom',
        area: '',
        managerId: '',
        description: ''
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.area) {
      toast.warning('Vui lòng điền tên và khu vực');
      return;
    }

    try {
      if (editItem) {
        await facilityService.updateLocation(editItem._id, form);
        toast.success('Cập nhật thành công');
      } else {
        await facilityService.createLocation(form);
        toast.success('Thêm mới thành công');
      }
      setOpenDialog(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Lỗi lưu dữ liệu');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vị trí này?')) return;
    try {
      await facilityService.deleteLocation(id);
      toast.success('Xóa thành công');
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi xóa');
    }
  };

  const filteredLocations = locations.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="primary">Danh mục Vị trí & Khu vực</Typography>
          <Typography variant="body2" color="text.secondary">Quản lý danh sách phòng học, kho bãi và khu vực trong trường</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Thêm Vị trí mới
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
          fullWidth
          placeholder="Tìm kiếm theo tên phòng hoặc khu vực..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          }}
          size="small"
        />
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Tên Vị trí</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Loại</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Khu vực</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Người phụ trách</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : filteredLocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">Chưa có dữ liệu vị trí</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLocations.map((loc) => (
                <TableRow key={loc._id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LocationIcon fontSize="small" color="action" />
                      <Typography fontWeight={600}>{loc.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={LOCATION_TYPES.find(t => t.value === loc.type)?.label || loc.type} 
                      size="small" 
                      variant="soft"
                      color={loc.type === 'classroom' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{loc.area}</TableCell>
                  <TableCell>{loc.managerId?.fullName || 'Chưa phân công'}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary" onClick={() => handleOpenDialog(loc)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(loc._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editItem ? 'Cập nhật Vị trí' : 'Thêm Vị trí mới'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Tên Vị trí (VD: Lớp Mầm 1, Kho A...)"
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            
            <FormControl fullWidth>
              <InputLabel>Loại vị trí</InputLabel>
              <Select
                value={form.type}
                label="Loại vị trí"
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {LOCATION_TYPES.map(t => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Khu vực (VD: Khu A, Tầng 1, Sân chơi...)"
              fullWidth
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              required
            />

            <FormControl fullWidth>
              <InputLabel>Người phụ trách</InputLabel>
              <Select
                value={form.managerId}
                label="Người phụ trách"
                onChange={(e) => setForm({ ...form, managerId: e.target.value })}
              >
                <MenuItem value=""><em>Chưa phân công</em></MenuItem>
                {staff.map(s => (
                  <MenuItem key={s._id} value={s._id}>{s.fullName}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Ghi chú"
              fullWidth
              multiline
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: 700 }}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} sx={{ fontWeight: 700, px: 4 }}>
            {editItem ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageLocations;
