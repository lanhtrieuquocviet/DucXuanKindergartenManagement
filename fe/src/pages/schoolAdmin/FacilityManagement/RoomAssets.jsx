import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, List, ListItemButton,
  ListItemIcon, ListItemText, Divider, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button,
  Chip, Stack, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Checkbox, FormControlLabel,
  Container
} from '@mui/material';
import {
  MeetingRoom as RoomIcon,
  AddCircle as AddIcon,
  Delete as RemoveIcon,
  Warehouse as WarehouseIcon,
  LocationOn as LocationIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import facilityService from '../../../service/facility.api';
import { toast } from 'react-toastify';

const RoomAssets = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [roomAssets, setRoomAssets] = useState([]);
  
  // For Allocation Dialog
  const [openAdd, setOpenAdd] = useState(false);
  const [warehouseAssets, setWarehouseAssets] = useState([]);
  const [selectedToAllocate, setSelectedToAllocate] = useState([]);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (selectedLoc) {
      fetchRoomAssets(selectedLoc._id);
    }
  }, [selectedLoc]);

  const fetchLocations = async () => {
    try {
      const resp = await facilityService.getLocations();
      if (resp?.status === 'success') {
        const locs = resp.data || [];
        setLocations(locs);
        if (locs.length > 0 && !selectedLoc) {
          setSelectedLoc(locs[0]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomAssets = async (locId) => {
    try {
      const resp = await facilityService.getAssetsByLocation(locId);
      if (resp?.status === 'success') {
        setRoomAssets(resp.data || []);
      }
    } catch (error) {}
  };

  const fetchWarehouseAssets = async () => {
    try {
      // Find warehouse ID
      const wh = locations.find(l => l.type === 'warehouse');
      if (!wh) {
        toast.error('Không tìm thấy kho tổng để lấy tài sản.');
        return;
      }
      const resp = await facilityService.getAssetsByLocation(wh._id);
      if (resp?.status === 'success') {
        setWarehouseAssets(resp.data || []);
        setOpenAdd(true);
      }
    } catch (error) {}
  };

  const handleAllocate = async () => {
    if (selectedToAllocate.length === 0) return;
    try {
      const resp = await facilityService.createHandover({
        assetIds: selectedToAllocate,
        toLocationId: selectedLoc._id,
        reason: `Phân bổ tài sản về ${selectedLoc.name}`,
        status: 'completed' // Auto-complete for admin allocation
      });

      if (resp?.status === 'success') {
        toast.success(`Đã phân bổ ${selectedToAllocate.length} tài sản`);
        setOpenAdd(false);
        setSelectedToAllocate([]);
        fetchRoomAssets(selectedLoc._id);
      }
    } catch (error) {
      toast.error('Lỗi khi phân bổ tài sản');
    }
  };

  const toggleSelect = (id) => {
    setSelectedToAllocate(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ m: -2, height: 'calc(100vh - 85px)', overflow: 'hidden' }}>
      <Grid container sx={{ height: '100%', m: 0, width: '100%' }}>
        {/* Left Sidebar: Locations */}
        <Grid item xs={12} md={4} lg={3.5} xl={3} sx={{ height: '100%', borderRight: '1px solid #e2e8f0', bgcolor: 'white' }}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="h6" fontWeight={900} color="primary" sx={{ textTransform: 'uppercase', letterSpacing: 2 }}>
                Danh sách Vị trí
              </Typography>
            </Box>
            <List sx={{ p: 0, flexGrow: 1, overflowY: 'auto' }}>
              {locations.map((loc) => (
                <ListItemButton
                  key={loc._id}
                  selected={selectedLoc?._id === loc._id}
                  onClick={() => setSelectedLoc(loc)}
                  sx={{
                    py: 2,
                    px: 2.5,
                    '&.Mui-selected': { bgcolor: '#eff6ff', color: '#2563eb', borderRight: '4px solid #2563eb' },
                    borderBottom: '1px solid #f1f5f9',
                    transition: '0.2s'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {loc.type === 'warehouse' ? <WarehouseIcon fontSize="small" color={selectedLoc?._id === loc._id ? 'primary' : 'inherit'} /> : <RoomIcon fontSize="small" color={selectedLoc?._id === loc._id ? 'primary' : 'inherit'} />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={loc.name} 
                    secondary={loc.area}
                    primaryTypographyProps={{ fontWeight: 800, fontSize: '1.1rem', color: selectedLoc?._id === loc._id ? '#1e40af' : 'inherit' }}
                    secondaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Grid>

        {/* Right Content: Assets in Selected Location */}
        <Grid item xs={12} md={8} lg={8.5} xl={9} sx={{ height: '100%', bgcolor: '#f1f5f9', p: 3, overflowY: 'auto' }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, minHeight: '100%', bgcolor: 'white', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ bgcolor: '#eff6ff', p: 1, borderRadius: 1.5 }}>
                      <LocationIcon color="primary" />
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight={900} color="#1e293b">
                        {selectedLoc?.name}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={selectedLoc?.area} size="small" variant="outlined" sx={{ borderRadius: 1, fontSize: '0.7rem', height: 20 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                          {selectedLoc?.type}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={fetchWarehouseAssets}
                  disabled={selectedLoc?.type === 'warehouse'}
                  sx={{ 
                    borderRadius: 2, 
                    px: 3, 
                    py: 1.2, 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    textTransform: 'none',
                    fontWeight: 700
                  }}
                >
                  Phân bổ tài sản từ kho
                </Button>
              </Stack>

              <TableContainer component={Box} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                <Table stickyHeader size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>STT</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Mã tài sản</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Tên tài sản</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Loại danh mục</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Tình trạng</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }} align="center">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {locations.find(l => l.type === 'warehouse') ? (
                      roomAssets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                            <Box sx={{ opacity: 0.6 }}>
                              <RoomIcon sx={{ fontSize: 60, mb: 1, color: 'text.disabled' }} />
                              <Typography variant="h6" color="text.secondary">Phòng này chưa được phân bổ tài sản nào</Typography>
                              <Typography variant="body2" color="text.disabled">Bấm nút "Phân bổ tài sản từ kho" ở trên để chia đồ cho phòng này</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        roomAssets.map((asset, idx) => (
                          <TableRow key={asset._id} hover>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{asset.assetCode}</TableCell>
                            <TableCell fontWeight={600}>{asset.typeId?.name}</TableCell>
                            <TableCell>{asset.typeId?.categoryId?.name}</TableCell>
                            <TableCell>
                              <Chip 
                                label={asset.status === 'good' ? 'Bình thường' : 'Cần xử lý'} 
                                size="small" 
                                color={asset.status === 'good' ? 'success' : 'error'}
                                variant="soft"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Button size="small" color="error" startIcon={<RemoveIcon />}>Thu hồi</Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                          <Paper variant="outlined" sx={{ p: 4, bgcolor: '#fff4e5', borderStyle: 'dashed', borderColor: '#ff9800' }}>
                            <WarningIcon sx={{ fontSize: 50, color: '#ff9800', mb: 2 }} />
                            <Typography variant="h6" color="#9c6500" fontWeight={700}>Chưa khai báo Kho tổng!</Typography>
                            <Typography variant="body2" color="#9c6500" sx={{ mb: 3 }}>
                              Để phân bổ tài sản, bạn cần khai báo ít nhất một vị trí có loại là "Kho tổng".
                            </Typography>
                            <Button 
                              variant="contained" 
                              color="warning" 
                              onClick={() => navigate('/school-admin/facilities/locations')}
                              sx={{ fontWeight: 700, px: 4 }}
                            >
                              Đi đến Danh mục Vị trí ngay
                            </Button>
                          </Paper>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Allocation Dialog */}
        <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>
            Phân bổ tài sản về {selectedLoc?.name}
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Chọn các tài sản hiện đang có trong <b>Kho tổng</b> để chuyển về phòng này:
            </Typography>
            <List>
              {warehouseAssets.length === 0 ? (
                <Typography sx={{ textAlign: 'center', py: 3 }}>Kho tổng đang trống.</Typography>
              ) : (
                warehouseAssets.map(asset => (
                  <ListItemButton key={asset._id} onClick={() => toggleSelect(asset._id)}>
                    <ListItemIcon>
                      <Checkbox 
                        checked={selectedToAllocate.includes(asset._id)}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${asset.typeId?.name} (${asset.assetCode})`}
                      secondary={`Tình trạng: ${asset.status}`}
                    />
                  </ListItemButton>
                ))
              )}
            </List>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenAdd(false)}>Hủy</Button>
            <Button 
              variant="contained" 
              onClick={handleAllocate}
              disabled={selectedToAllocate.length === 0}
            >
              Phân bổ ngay
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
};

export default RoomAssets;
