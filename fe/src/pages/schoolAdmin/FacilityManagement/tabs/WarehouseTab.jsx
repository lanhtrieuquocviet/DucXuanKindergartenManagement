import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Stack,
  CircularProgress, Chip
} from '@mui/material';
import {
  MoveUp as MoveIcon,
  AddCircle as AddIcon
} from '@mui/icons-material';
import { get } from '../../../../service/api';

const WarehouseTab = ({ searchTerm, typeFilter }) => {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    fetchWarehouseData();
  }, [searchTerm, typeFilter]);

  const fetchWarehouseData = async () => {
    setLoading(true);
    try {
      // Find locations of type 'warehouse' first
      const locResp = await get('/api/school-admin/facilities/locations');
      const warehouseIds = (locResp.data || [])
        .filter(l => l.type === 'warehouse')
        .map(l => l._id);

      const resp = await get('/api/school-admin/facilities/assets');
      if (resp?.status === 'success') {
        const allAssets = resp.data || [];
        const filtered = allAssets.filter(a => 
          warehouseIds.includes(a.currentLocationId?._id)
        );
        setAssets(filtered);
      }
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Danh sách tài sản đang ở Kho tổng</Typography>
        <Button variant="contained" startIcon={<AddIcon />} size="small">
          Nhập kho mới
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>STT</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Mã tài sản</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tên tài sản</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Kho lưu trữ</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tình trạng</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Phân bổ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  Kho trống hoặc không có tài sản phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset, idx) => (
                <TableRow key={asset._id} hover>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{asset.assetCode}</TableCell>
                  <TableCell fontWeight={500}>{asset.typeId?.name}</TableCell>
                  <TableCell>{asset.currentLocationId?.name}</TableCell>
                  <TableCell>
                    <Chip label="Sẵn sàng" size="small" color="success" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Button variant="outlined" size="small" startIcon={<MoveIcon />}>
                      Bàn giao
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default WarehouseTab;
