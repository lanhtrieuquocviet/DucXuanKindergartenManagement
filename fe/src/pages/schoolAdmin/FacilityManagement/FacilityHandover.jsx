import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, TextField, MenuItem, Select,
  InputLabel, FormControl
} from '@mui/material';
import {
  Add as AddIcon,
  CompareArrows as HandoverIcon,
  AssignmentTurnedIn as ApproveIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import facilityService from '../../../service/facility.api';
import { toast } from 'react-toastify';

const FacilityHandover = () => {
  const navigate = useNavigate();
  const [handovers, setHandovers] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [locations, setLocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [staffs, setStaffs] = useState([]);

  const [newHandover, setNewHandover] = useState({
    assetIds: [],
    fromLocationId: '',
    toLocationId: '',
    receiverId: '',
    reason: ''
  });

  useEffect(() => {
    fetchHandovers();
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [locResp, assetResp, staffResp] = await Promise.all([
        facilityService.getLocations(),
        facilityService.getAssetTypes(), // Or getAssets
        facilityService.getStaffs()
      ]);
      setLocations(locResp.data || []);
      setAssets(assetResp.data || []);
      setStaffs(staffResp.data || []);
    } catch (error) {}
  };

  const fetchHandovers = async () => {
    try {
      const resp = await facilityService.getHandovers();
      if (resp?.status === 'success') {
        setHandovers(resp.data || []);
      }
    } catch (error) {}
  };

  const handleCreate = async () => {
    try {
      const resp = await facilityService.createHandover(newHandover);
      if (resp?.status === 'success') {
        toast.success('Đã tạo phiếu bàn giao mới');
        setOpenAdd(false);
        fetchHandovers();
      }
    } catch (error) {
      toast.error('Lỗi khi tạo phiếu');
    }
  };

  const handleApprove = async (id) => {
    try {
      const resp = await facilityService.approveHandover(id);
      if (resp?.status === 'success') {
        toast.success('Đã phê duyệt bàn giao');
        fetchHandovers();
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
              <Typography variant="h5" fontWeight={900} color="#1e293b">Danh sách Phiếu Bàn giao</Typography>
              <Typography variant="body2" color="text.secondary">Theo dõi quá trình luân chuyển và bàn giao tài sản giữa các bộ phận</Typography>
            </Box>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => setOpenAdd(true)}
              sx={{ borderRadius: 2, px: 3, py: 1.2, fontWeight: 700, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            >
              Lập phiếu bàn giao mới
            </Button>
          </Stack>

          <TableContainer component={Box} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Ngày tạo</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Từ vị trí</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Đến vị trí</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Người nhận</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }} align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {handovers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">Chưa có phiếu bàn giao nào được tạo.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  handovers.map(h => (
                    <TableRow key={h._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{new Date(h.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>{h.fromLocationId?.name}</TableCell>
                      <TableCell>{h.toLocationId?.name}</TableCell>
                      <TableCell>{h.receiverId?.fullName}</TableCell>
                      <TableCell>
                        <Chip 
                          label={h.status === 'pending' ? 'Đang chờ duyệt' : 'Đã hoàn thành'} 
                          sx={{ 
                            fontWeight: 700,
                            borderRadius: 1,
                            bgcolor: h.status === 'pending' ? '#fff7ed' : '#f0fdf4',
                            color: h.status === 'pending' ? '#c2410c' : '#16a34a',
                            border: '1px solid',
                            borderColor: h.status === 'pending' ? '#ffedd5' : '#bcf0da'
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button 
                            size="small" 
                            variant="outlined" 
                            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                          >
                            Chi tiết
                          </Button>
                          {h.status === 'pending' && (
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="success"
                              onClick={() => handleApprove(h._id)}
                              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
                            >
                              Phê duyệt & Chuyển
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
          <DialogTitle sx={{ fontWeight: 800 }}>Lập phiếu bàn giao tài sản</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Từ vị trí</InputLabel>
                  <Select
                    value={newHandover.fromLocationId}
                    label="Từ vị trí"
                    onChange={(e) => setNewHandover({...newHandover, fromLocationId: e.target.value})}
                  >
                    {locations.map(l => (
                      <MenuItem key={l._id} value={l._id}>{l.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Đến vị trí</InputLabel>
                  <Select
                    value={newHandover.toLocationId}
                    label="Đến vị trí"
                    onChange={(e) => setNewHandover({...newHandover, toLocationId: e.target.value})}
                  >
                    {locations.map(l => (
                      <MenuItem key={l._id} value={l._id}>{l.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Người nhận bàn giao</InputLabel>
                  <Select
                    value={newHandover.receiverId}
                    label="Người nhận bàn giao"
                    onChange={(e) => setNewHandover({...newHandover, receiverId: e.target.value})}
                  >
                    {staffs.map(s => (
                      <MenuItem key={s._id} value={s._id}>{s.fullName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label="Lý do bàn giao" 
                  fullWidth 
                  multiline 
                  rows={2}
                  value={newHandover.reason}
                  onChange={(e) => setNewHandover({...newHandover, reason: e.target.value})}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenAdd(false)}>Hủy</Button>
            <Button variant="contained" onClick={handleCreate}>Tạo phiếu</Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
};

export default FacilityHandover;
