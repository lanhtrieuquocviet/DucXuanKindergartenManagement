import {
  Add as AddIcon,
  AssignmentTurnedIn as ApproveIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip, Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl, Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import facilityService from '../../../service/facility.api';

const FacilityInventory = () => {
  const navigate = useNavigate();
  const [inventories, setInventories] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [locations, setLocations] = useState([]);
  const [staffs, setStaffs] = useState([]);

  const [newInventory, setNewInventory] = useState({
    title: '',
    locationId: '',
    chairmanId: '',
    secretaryId: '',
    members: []
  });

  useEffect(() => {
    fetchInventories();
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [locResp, staffResp] = await Promise.all([
        facilityService.getLocations(),
        facilityService.getStaffs()
      ]);
      setLocations(locResp.data || []);
      setStaffs(staffResp.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchInventories = async () => {
    try {
      const resp = await facilityService.getInventories();
      if (resp?.status === 'success') {
        setInventories(resp.data || []);
      }
    } catch (error) { }
  };

  const handleCreate = async () => {
    try {
      const resp = await facilityService.createInventory(newInventory);
      if (resp?.status === 'success') {
        toast.success('Đã tạo biên bản kiểm kê');
        setOpenAdd(false);
        fetchInventories();
      }
    } catch (error) {
      toast.error('Lỗi khi tạo biên bản');
    }
  };

  const handleApprove = async (id) => {
    try {
      const resp = await facilityService.approveInventory(id);
      if (resp?.status === 'success') {
        toast.success('Đã phê duyệt biên bản kiểm kê');
        fetchInventories();
      }
    } catch (error) {
      toast.error('Lỗi khi phê duyệt');
    }
  };

  return (
    <Box>
      <Box sx={{ width: '100%', px: { xs: 1, md: 3 }, boxSizing: 'border-box', mt: -2 }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white', minHeight: 'calc(100vh - 150px)' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <Box>
              <Typography variant="h5" fontWeight={900} color="#1e293b">Danh sách Báo cáo cuối năm</Typography>
              <Typography variant="body2" color="text.secondary">Quản lý và phê duyệt các đợt báo cáo tài sản cuối năm</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAdd(true)}
              sx={{ borderRadius: 2, px: 3, py: 1.2, fontWeight: 700, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            >
              Tạo đợt kiểm kê mới
            </Button>
          </Stack>

          <TableContainer component={Box} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Tiêu đề</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Vị trí kiểm kê</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Trưởng ban</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Thư ký</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }} align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">Chưa có dữ liệu kiểm kê nào được tạo.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  inventories.map(inv => (
                    <TableRow key={inv._id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{inv.title}</TableCell>
                      <TableCell>{inv.locationId?.name}</TableCell>
                      <TableCell>{inv.chairmanId?.fullName}</TableCell>
                      <TableCell>{inv.secretaryId?.fullName}</TableCell>
                      <TableCell>
                        <Chip
                          label={inv.status === 'approved' ? 'Đã duyệt' : inv.status === 'submitted' ? 'Chờ duyệt' : 'Bản nháp'}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            borderRadius: 1,
                            bgcolor: inv.status === 'approved' ? '#f0fdf4' : '#fff7ed',
                            color: inv.status === 'approved' ? '#16a34a' : '#c2410c',
                            border: '1px solid',
                            borderColor: inv.status === 'approved' ? '#bcf0da' : '#ffedd5'
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                          >
                            Chi tiết
                          </Button>
                          {inv.status === 'submitted' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<ApproveIcon />}
                              onClick={() => handleApprove(inv._id)}
                              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
                            >
                              Phê duyệt
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Add Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Tạo đợt báo cáo mới</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Tiêu đề đợt kiểm kê"
                fullWidth
                value={newInventory.title}
                onChange={(e) => setNewInventory({ ...newInventory, title: e.target.value })}
                placeholder="VD: Báo cáo kiểm kê Cuối năm học 2024-2025"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Vị trí kiểm kê</InputLabel>
                <Select
                  value={newInventory.locationId}
                  label="Vị trí kiểm kê"
                  onChange={(e) => setNewInventory({ ...newInventory, locationId: e.target.value })}
                >
                  {locations.map(l => (
                    <MenuItem key={l._id} value={l._id}>{l.name} ({l.area})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Trưởng ban (Chairman)</InputLabel>
                <Select
                  value={newInventory.chairmanId}
                  label="Trưởng ban (Chairman)"
                  onChange={(e) => setNewInventory({ ...newInventory, chairmanId: e.target.value })}
                >
                  {staffs.map(s => (
                    <MenuItem key={s._id} value={s._id}>{s.fullName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Thư ký (Secretary)</InputLabel>
                <Select
                  value={newInventory.secretaryId}
                  label="Thư ký (Secretary)"
                  onChange={(e) => setNewInventory({ ...newInventory, secretaryId: e.target.value })}
                >
                  {staffs.map(s => (
                    <MenuItem key={s._id} value={s._id}>{s.fullName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAdd(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleCreate}>Bắt đầu kiểm kê</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacilityInventory;
