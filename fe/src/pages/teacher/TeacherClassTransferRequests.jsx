import { useEffect, useState } from 'react';
import { get, ENDPOINTS } from '../../service/api';
import {
  Box, Paper, Typography, Chip, Stack, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, useMediaQuery,
  Avatar,
} from '@mui/material';
import { SwapHoriz } from '@mui/icons-material';

const STATUS_CONFIG = {
  pending:   { label: 'Chờ duyệt',    color: 'warning' },
  approved:  { label: 'Đã duyệt',     color: 'success' },
  rejected:  { label: 'Bị từ chối',   color: 'error' },
  cancelled: { label: 'Đã huỷ',       color: 'default' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

export default function TeacherClassTransferRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const isMobile = useMediaQuery('(max-width:700px)');

  useEffect(() => {
    const q = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    setLoading(true);
    get(`${ENDPOINTS.CLASS_TRANSFER.TEACHER_REQUESTS}${q}`)
      .then((res) => setRequests(res.data || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const displayed = requests;

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
        <SwapHoriz sx={{ color: '#7c3aed', fontSize: 26 }} />
        <Typography fontWeight={800} fontSize="1.15rem">Đơn xin chuyển lớp</Typography>
        <Chip label={`${requests.length} đơn`} size="small" sx={{ bgcolor: '#ede9fe', color: '#7c3aed', fontWeight: 700 }} />
      </Stack>

      {/* Filter */}
      <Stack direction="row" spacing={1.5} mb={2.5}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select value={statusFilter} label="Trạng thái" onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="pending">Chờ duyệt</MenuItem>
            <MenuItem value="approved">Đã duyệt</MenuItem>
            <MenuItem value="rejected">Bị từ chối</MenuItem>
            <MenuItem value="cancelled">Đã huỷ</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#7c3aed' }} />
        </Box>
      ) : displayed.length === 0 ? (
        <Paper elevation={0} sx={{ p: 5, borderRadius: 3, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <Typography fontSize="2.5rem" mb={1}>📋</Typography>
          <Typography color="text.secondary">Không có đơn nào</Typography>
        </Paper>
      ) : isMobile ? (
        // Mobile: card layout
        <Stack spacing={1.5}>
          {displayed.map((req) => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            return (
              <Paper key={req._id} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.85rem', bgcolor: '#ede9fe', color: '#7c3aed', fontWeight: 700 }}>
                      {req.studentId?.fullName?.charAt(0) || '?'}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={700} fontSize="0.88rem">{req.studentId?.fullName}</Typography>
                      <Typography fontSize="0.72rem" color="text.secondary">{req.studentId?.studentCode}</Typography>
                    </Box>
                  </Stack>
                  <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" mb={0.75}>
                  <Typography fontSize="0.8rem" fontWeight={600}>{req.fromClassId?.className || '—'}</Typography>
                  <SwapHoriz sx={{ fontSize: 16, color: '#6b7280' }} />
                  <Typography fontSize="0.8rem" fontWeight={600}>{req.toClassId?.className || '—'}</Typography>
                </Stack>
                <Typography fontSize="0.76rem" color="text.secondary">Lý do: {req.reason}</Typography>
                <Typography fontSize="0.72rem" color="text.disabled" mt={0.5}>{fmtDate(req.createdAt)}</Typography>
                {req.rejectedReason && (
                  <Typography fontSize="0.74rem" color="error.main" mt={0.5}>
                    Lý do từ chối: {req.rejectedReason}
                  </Typography>
                )}
              </Paper>
            );
          })}
        </Stack>
      ) : (
        // Desktop: table
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 700 }}>Học sinh</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lớp đi</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lớp đến</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lý do</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ngày gửi</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayed.map((req) => {
                const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                return (
                  <TableRow key={req._id} hover>
                    <TableCell>
                      <Typography fontWeight={600} fontSize="0.85rem">{req.studentId?.fullName}</Typography>
                      <Typography fontSize="0.73rem" color="text.secondary">{req.studentId?.studentCode}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{req.fromClassId?.className || '—'}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{req.toClassId?.className || '—'}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography fontSize="0.82rem" noWrap title={req.reason}>{req.reason}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{fmtDate(req.createdAt)}</TableCell>
                    <TableCell>
                      <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                      {req.rejectedReason && (
                        <Typography fontSize="0.71rem" color="error.main" mt={0.5}>{req.rejectedReason}</Typography>
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
