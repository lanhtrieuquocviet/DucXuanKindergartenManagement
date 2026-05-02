import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { get, patch, ENDPOINTS } from '../../../service/api';
import { formatDate } from './AssetUtils';

const ADJUSTMENT_STATUS = {
  pending: { label: 'Chờ xử lý', color: 'warning' },
  applied: { label: 'Đã áp dụng', color: 'success' },
  void: { label: 'Đã hủy', color: 'default' },
};

const ADJUSTMENT_TYPE = {
  surplus: { label: 'Thừa', color: 'info' },
  shortage: { label: 'Thiếu', color: 'error' },
  damage: { label: 'Hỏng', color: 'warning' },
};

export function AdjustmentsTab() {
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.ASSET_ADJUSTMENTS);
      setAdjustments(res?.data?.adjustments || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được danh sách lệnh điều chỉnh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApply = async (id) => {
    if (!window.confirm('Bạn có chắc muốn áp dụng lệnh điều chỉnh này? Số lượng tài sản trong kho sẽ được cập nhật.')) return;
    setProcessingId(id);
    try {
      await patch(ENDPOINTS.SCHOOL_ADMIN.ASSET_ADJUSTMENT_APPLY(id));
      toast.success('Đã áp dụng điều chỉnh tài sản.');
      load();
    } catch (err) {
      toast.error(err?.message || 'Thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleVoid = async (id) => {
    if (!window.confirm('Bạn có chắc muốn hủy lệnh điều chỉnh này?')) return;
    setProcessingId(id);
    try {
      await patch(ENDPOINTS.SCHOOL_ADMIN.ASSET_ADJUSTMENT_VOID(id));
      toast.success('Đã hủy lệnh điều chỉnh.');
      load();
    } catch (err) {
      toast.error(err?.message || 'Thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <Stack alignItems="center" py={4}><CircularProgress size={30} /></Stack>;

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} mb={2} display="flex" alignItems="center" gap={1}>
        <InventoryIcon color="primary" />
        Lệnh điều chỉnh tài sản sau kiểm kê
      </Typography>

      {adjustments.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="text.secondary">Chưa có lệnh điều chỉnh nào cần xử lý.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Tài sản</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell align="center">Chênh lệch</TableCell>
                <TableCell align="center">SL Mới</TableCell>
                <TableCell>Nguồn gốc</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {adjustments.map((adj) => {
                const s = ADJUSTMENT_STATUS[adj.status] || ADJUSTMENT_STATUS.pending;
                const t = ADJUSTMENT_TYPE[adj.type] || { label: adj.type, color: 'default' };
                return (
                  <TableRow key={adj._id} hover>
                    <TableCell>{formatDate(adj.createdAt)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{adj.assetId?.name || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{adj.assetId?.assetCode || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={t.label} color={t.color} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight={700} color={adj.difference > 0 ? 'success.main' : 'error.main'}>
                        {adj.difference > 0 ? `+${adj.difference}` : adj.difference}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{adj.newQty}</TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block">
                        BB: {adj.sourceInspectionId?.minutesNumber || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Bởi: {adj.createdBy?.fullName || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={s.label} color={s.color} size="small" />
                      {adj.appliedAt && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {formatDate(adj.appliedAt)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {adj.status === 'pending' ? (
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Áp dụng ngay">
                            <IconButton 
                              size="small" 
                              color="success" 
                              onClick={() => handleApply(adj._id)}
                              disabled={processingId === adj._id}
                            >
                              {processingId === adj._id ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Hủy bỏ">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleVoid(adj._id)}
                              disabled={processingId === adj._id}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
