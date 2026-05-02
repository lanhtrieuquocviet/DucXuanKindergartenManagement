import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { get, ENDPOINTS } from "../../../service/api";
import { toast } from 'react-toastify';

const TRANSACTION_TYPE_MAP = {
  ALLOCATE: { label: 'Cấp phát', color: 'primary', icon: '📦' },
  UPDATE: { label: 'Cập nhật', color: 'info', icon: '📝' },
  RECOVER: { label: 'Thu hồi', color: 'warning', icon: '🔙' },
  TRANSFER: { label: 'Điều chuyển', color: 'secondary', icon: '↔️' },
  INITIAL: { label: 'Khởi tạo', color: 'success', icon: '🆕' },
};

export function AssetTransactionsTab() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState({
    type: '',
    startDate: '',
    endDate: '',
  });

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);

      const res = await get(`${ENDPOINTS.SCHOOL_ADMIN.ASSET_TRANSACTIONS}?${params.toString()}`);
      if (res.status === 'success') {
        setTransactions(res.data);
      }
    } catch (err) {
      toast.error('Không thể tải lịch sử biến động');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1}>
            <HistoryIcon color="primary" /> Lịch sử biến động tài sản
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Theo dõi mọi giao dịch cấp phát, thu hồi và điều chuyển tài sản trong toàn trường
          </Typography>
        </Box>
        <IconButton onClick={loadTransactions} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#f8fafc' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FilterIcon sx={{ color: 'text.secondary' }} />
          <TextField
            select
            label="Loại giao dịch"
            size="small"
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {Object.entries(TRANSACTION_TYPE_MAP).map(([key, value]) => (
              <MenuItem key={key} value={key}>{value.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Từ ngày"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={filter.startDate}
            onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
          />
          <TextField
            label="Đến ngày"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={filter.endDate}
            onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
          />
          <IconButton color="primary" onClick={loadTransactions} disabled={loading}>
            <SearchIcon />
          </IconButton>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Thời gian</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tài sản</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Loại</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">S.Lượng</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Từ (Phòng/Kho)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Đến (Phòng)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Người thực hiện</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ghi chú</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  Chưa có lịch sử giao dịch nào được ghi lại.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((t) => (
                <TableRow key={t._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {new Date(t.date).toLocaleDateString('vi-VN')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(t.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{t.inventoryItemId?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{t.inventoryItemId?.assetCode}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={TRANSACTION_TYPE_MAP[t.type]?.label || t.type}
                      color={TRANSACTION_TYPE_MAP[t.type]?.color || 'default'}
                      size="small"
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {t.quantity} {t.inventoryItemId?.unit}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {t.fromRoomId?.roomName || (t.type === 'ALLOCATE' ? '📦 Kho tổng' : '—')}
                  </TableCell>
                  <TableCell>
                    {t.toRoomId?.roomName || (t.type === 'RECOVER' ? '📥 Thu hồi về kho' : '—')}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{t.actorId?.fullName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontStyle: 'italic' }}>{t.note || '—'}</Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
