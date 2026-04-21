import {
  Bolt as ActionIcon,
  Close as CloseIcon,
  CalendarToday as DateIcon,
  FilterList as FilterIcon,
  Article as LogIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSystemAdmin } from '../../context/SystemAdminContext';
import RoleLayout from '../../layouts/RoleLayout';

function SystemLogs() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const { getSystemLogs, loading, error, setError } = useSystemAdmin();
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [localError, setLocalError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    action: '',
    actor: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('SystemAdmin')) {
      navigate('/', { replace: true });
    }
  }, [navigate, user, isInitializing]);

  const fetchLogs = async (page = 1, limit = 20, extraFilters = {}) => {
    if (!user) return;
    try {
      setLocalError('');
      setError(null);
      const cleanFilters = {};
      Object.entries(extraFilters).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim() !== '') {
          cleanFilters[key] = value.trim();
        }
      });

      const response = await getSystemLogs({
        page,
        limit,
        ...cleanFilters,
      });
      setLogs(response.data || []);
      if (response.pagination) {
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
        });
      } else {
        setPagination((prev) => ({
          ...prev,
          page,
        }));
      }
    } catch (err) {
      setLocalError(err.message || 'Không lấy được nhật ký hệ thống');
    }
  };

  useEffect(() => {
    fetchLogs(1, pagination.limit, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getSystemLogs, setError, user]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyFilters = () => {
    fetchLogs(1, pagination.limit, filters);
  };

  const handleResetFilters = () => {
    const reset = {
      startDate: '',
      endDate: '',
      action: '',
      actor: '',
    };
    setFilters(reset);
    fetchLogs(1, pagination.limit, reset);
  };

  const menuItems = useMemo(
    () => [
      { key: 'overview', label: 'Tổng quan hệ thống' },
      { key: 'accounts', label: 'Quản lý người dùng' },
      { key: 'roles', label: 'Quản lý vai trò' },
      { key: 'permissions', label: 'Quản lý phân quyền' },
      { key: 'system-logs', label: 'Nhật ký hệ thống' },
      // { key: 'reports', label: 'Báo cáo tổng hợp' },
    ],
    []
  );

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      navigate('/system-admin');
    } else if (key === 'accounts') {
      navigate('/system-admin/manage-accounts');
    } else if (key === 'roles') {
      navigate('/system-admin/manage-roles');
    } else if (key === 'permissions') {
      navigate('/system-admin/manage-permissions');
    } else if (key === 'system-logs') {
      navigate('/system-admin/system-logs');
    } else {
      navigate('/system-admin');
    }
  };

  const userName = user?.fullName || user?.username || 'System Admin';

  const handleViewProfile = () => {
    navigate('/profile');
  };

  return (
    <RoleLayout
      title="Nhật ký hệ thống"
      description="Theo dõi các hoạt động quan trọng trong hệ thống."
      menuItems={menuItems}
      activeKey="system-logs"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
    >
      {/* Header Paper */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: 2,
          px: 3,
          py: 2.5,
          mb: 3,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <LogIcon sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.3 }}>
              Nhật ký hệ thống
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>
              Theo dõi thao tác người dùng trong hệ thống (giới hạn trong 3 ngày gần nhất).
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Main Paper */}
      <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Filter Toolbar */}
        <Box
          sx={{
            bgcolor: 'grey.50',
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 3,
            py: 2,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ mb: 2 }}
          >
            <FilterIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Bộ lọc
            </Typography>
          </Stack>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'flex-end' }}
          >
            <TextField
              label="Từ ngày"
              type="date"
              size="small"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{ startAdornment: null }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Đến ngày"
              type="date"
              size="small"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Hành động"
              type="text"
              size="small"
              placeholder="Tìm theo hành động..."
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Người thực hiện"
              type="text"
              size="small"
              placeholder="Tìm theo người thực hiện..."
              value={filters.actor}
              onChange={(e) => handleFilterChange('actor', e.target.value)}
              sx={{ flex: 1 }}
            />
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleResetFilters}
                disabled={loading}
                startIcon={<RefreshIcon />}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Xóa bộ lọc
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleApplyFilters}
                disabled={loading}
                startIcon={<FilterIcon />}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Áp dụng
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Error Alert */}
        {(localError || error) && (
          <Box sx={{ px: 3, pt: 2 }}>
            <Alert severity="error" onClose={() => { setLocalError(''); setError(null); }}>
              {localError || error}
            </Alert>
          </Box>
        )}

        {/* Table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  '& th': {
                    bgcolor: 'grey.50',
                    fontWeight: 700,
                    fontSize: 12,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    py: 1.5,
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                  },
                }}
              >
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <DateIcon sx={{ fontSize: 14 }} />
                    <span>Thời gian</span>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <PersonIcon sx={{ fontSize: 14 }} />
                    <span>Người thực hiện</span>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <ActionIcon sx={{ fontSize: 14 }} />
                    <span>Hành động</span>
                  </Stack>
                </TableCell>
                <TableCell align="center">Xem chi tiết</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow
                  key={log._id}
                  hover
                  sx={{ '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell sx={{ fontSize: 13, color: 'text.primary' }}>
                    {log.createdAt
                      ? new Date(log.createdAt).toLocaleString('vi-VN')
                      : '--'}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: 'text.primary' }}>
                    {log.actorName || 'Không rõ'}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: 'text.primary' }}>
                    {log.action}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<ViewIcon />}
                      onClick={() => setSelectedLog(log)}
                      sx={{ fontSize: 12 }}
                    >
                      Xem
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    <Stack alignItems="center" spacing={1}>
                      <LogIcon sx={{ fontSize: 40, color: 'grey.300' }} />
                      <Typography variant="body2" color="text.secondary">
                        Chưa có nhật ký nào.
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Row */}
        <Divider />
        <Box
          sx={{
            px: 3,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Trang{' '}
            <Box component="span" fontWeight={700} color="text.primary">
              {pagination.page}/{pagination.totalPages || 1}
            </Box>
            {' · '}Tổng{' '}
            <Box component="span" fontWeight={700} color="text.primary">
              {pagination.total}
            </Box>{' '}
            bản ghi
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                if (pagination.page > 1 && !loading) {
                  fetchLogs(pagination.page - 1, pagination.limit);
                }
              }}
              disabled={loading || pagination.page <= 1}
            >
              Trước
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                if (pagination.page < (pagination.totalPages || 1) && !loading) {
                  fetchLogs(pagination.page + 1, pagination.limit);
                }
              }}
              disabled={loading || pagination.page >= (pagination.totalPages || 1)}
            >
              Sau
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Log Detail Dialog */}
      <Dialog
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        maxWidth="sm"
        fullWidth
      >
        {/* Gradient Header */}
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2,
            px: 3,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <LogIcon sx={{ fontSize: 22, color: 'rgba(255,255,255,0.85)' }} />
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff' }}>
              Chi tiết nhật ký
            </Typography>
          </Stack>
          <IconButton
            size="small"
            onClick={() => setSelectedLog(null)}
            sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 3 }}>
          {selectedLog && (
            <Stack spacing={2}>
              {/* Thời gian */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <DateIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Thời gian
                  </Typography>
                </Stack>
                <Typography variant="body2" fontWeight={600}>
                  {selectedLog.createdAt
                    ? new Date(selectedLog.createdAt).toLocaleString('vi-VN')
                    : '--'}
                </Typography>
              </Box>

              <Divider />

              {/* Người thực hiện */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Người thực hiện
                  </Typography>
                </Stack>
                <Typography variant="body2" fontWeight={600}>
                  {selectedLog.actorName || 'Không rõ'}
                </Typography>
              </Box>

              <Divider />

              {/* Hành động */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <ActionIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Hành động
                  </Typography>
                </Stack>
                <Typography variant="body2" fontWeight={600}>
                  {selectedLog.action}
                </Typography>
              </Box>

              <Divider />

              {/* Nội dung chi tiết */}
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={600}
                  sx={{ mb: 1, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}
                >
                  Nội dung chi tiết
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    bgcolor: 'grey.50',
                    borderColor: 'divider',
                    p: 2,
                    borderRadius: 1.5,
                  }}
                >
                  <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {selectedLog.detail || 'Không có nội dung chi tiết.'}
                  </Typography>
                </Paper>
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            variant="outlined"
            onClick={() => setSelectedLog(null)}
            startIcon={<CloseIcon />}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}

export default SystemLogs;
