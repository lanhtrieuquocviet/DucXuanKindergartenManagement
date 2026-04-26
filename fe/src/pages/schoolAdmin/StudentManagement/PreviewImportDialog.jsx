import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  Alert,
  Stack,
  CircularProgress,
  Checkbox,
  Tabs,
  Tab,
  FormControlLabel,
  Switch
} from '@mui/material';

const PreviewImportDialog = ({ open, onClose, data, onConfirm, loading, onRevalidate }) => {
  const [filter, setFilter] = useState('all');
  const [selectedRowIndexes, setSelectedRowIndexes] = useState([]);
  const [allowUnassignedClass, setAllowUnassignedClass] = useState(false);

  const handleToggleAllowUnassigned = (e) => {
    const checked = e.target.checked;
    setAllowUnassignedClass(checked);
    if (onRevalidate) {
      onRevalidate(checked);
    }
  };

  useEffect(() => {
    if (open && data) {
      // Mặc định tick chọn tất cả các dòng KHÔNG bị lỗi
      setSelectedRowIndexes(data.filter(d => d.status !== 'error').map(d => d.rowIndex));
      setFilter('all');
    }
  }, [open, data]);

  const formatDate = (d) => {
    if (!d) return '—';
    const x = new Date(d);
    return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}/${x.getFullYear()}`;
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'new':
        return <Chip label="Tạo mới" color="success" size="small" variant="outlined" />;
      case 'duplicate':
        return <Chip label="Trùng (Cập nhật)" color="warning" size="small" variant="outlined" />;
      case 'error':
        return <Chip label="Lỗi" color="error" size="small" variant="outlined" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const filteredData = data?.filter(row => filter === 'all' || row.status === filter) || [];
  
  // Tính toán trạng thái của checkbox Select All
  const visibleValidRows = filteredData.filter(d => d.status !== 'error').map(d => d.rowIndex);
  const isAllVisibleSelected = visibleValidRows.length > 0 && visibleValidRows.every(id => selectedRowIndexes.includes(id));
  const isSomeVisibleSelected = visibleValidRows.some(id => selectedRowIndexes.includes(id)) && !isAllVisibleSelected;

  const handleToggleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRowIndexes(prev => Array.from(new Set([...prev, ...visibleValidRows])));
    } else {
      setSelectedRowIndexes(prev => prev.filter(id => !visibleValidRows.includes(id)));
    }
  };

  const handleToggleRow = (rowIndex) => {
    setSelectedRowIndexes(prev => 
      prev.includes(rowIndex) ? prev.filter(id => id !== rowIndex) : [...prev, rowIndex]
    );
  };

  const hasErrors = data?.some(d => d.status === 'error');
  const duplicateCount = data?.filter(d => d.status === 'duplicate').length || 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Xem trước & Cấu hình dữ liệu Import</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Bạn có thể lọc dữ liệu và chủ động bỏ tick các dòng không muốn lưu vào hệ thống.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Alert severity="info" sx={{ py: 0, px: 2, '& .MuiAlert-message': { py: 0.5 } }}>
              Tổng cộng: <strong>{data?.length || 0}</strong> dòng
            </Alert>
            <FormControlLabel
              control={
                <Switch 
                  size="small" 
                  checked={allowUnassignedClass} 
                  onChange={handleToggleAllowUnassigned} 
                  color="warning"
                />
              }
              label={<Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.dark' }}>Bỏ qua lỗi thiếu Lớp học (Đẩy vào Chưa xếp lớp)</Typography>}
              sx={{ ml: 'auto !important', mr: 0, bgcolor: 'warning.50', px: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}
            />
          </Stack>
          
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            {duplicateCount > 0 && (
              <Alert severity="warning" sx={{ py: 0, px: 2, '& .MuiAlert-message': { py: 0.5 } }}>
                Có <strong>{duplicateCount}</strong> tài khoản bị trùng lặp
              </Alert>
            )}
            <Alert severity="success" sx={{ py: 0, px: 2, '& .MuiAlert-message': { py: 0.5 } }}>
              Đã chọn: <strong>{selectedRowIndexes.length}</strong> dòng để import
            </Alert>
          </Stack>

          <Tabs 
            value={filter} 
            onChange={(e, newVal) => setFilter(newVal)} 
            sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 36 }}
          >
            <Tab label="Tất cả" value="all" sx={{ textTransform: 'none', minHeight: 36 }} />
            <Tab label="Hợp lệ (Tạo mới)" value="new" sx={{ textTransform: 'none', minHeight: 36, color: 'success.main' }} />
            <Tab label="Trùng lặp" value="duplicate" sx={{ textTransform: 'none', minHeight: 36, color: 'warning.main' }} />
            <Tab label="Bị lỗi" value="error" sx={{ textTransform: 'none', minHeight: 36, color: 'error.main' }} />
          </Tabs>
        </Box>

        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ bgcolor: 'grey.50' }}>
                  <Checkbox
                    size="small"
                    indeterminate={isSomeVisibleSelected}
                    checked={isAllVisibleSelected}
                    onChange={handleToggleSelectAll}
                    disabled={visibleValidRows.length === 0}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Dòng</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Học sinh</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Ngày sinh</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Giới tính</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Lớp</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Phụ huynh</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>SĐT (Tài khoản)</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row, index) => {
                const isSelected = selectedRowIndexes.includes(row.rowIndex);
                const isError = row.status === 'error';

                return (
                  <TableRow 
                    key={index} 
                    hover 
                    selected={isSelected}
                    sx={{ opacity: isError ? 0.6 : 1 }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={() => handleToggleRow(row.rowIndex)}
                        disabled={isError}
                      />
                    </TableCell>
                    <TableCell>{row.rowIndex}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{row.studentName}</TableCell>
                    <TableCell>{formatDate(row.dob)}</TableCell>
                    <TableCell>{row.gender === 'male' ? 'Nam' : row.gender === 'female' ? 'Nữ' : 'Khác'}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{row.className}</TableCell>
                    <TableCell>{row.parentName}</TableCell>
                    <TableCell>{row.phone}</TableCell>
                    <TableCell>{row.email || <span style={{color: '#999', fontStyle: 'italic'}}>Tự động tạo</span>}</TableCell>
                    <TableCell>
                      {getStatusChip(row.status)}
                      {(isError || row.status === 'duplicate' || (row.status === 'new' && row.message !== 'Sẵn sàng')) && (
                        <Typography 
                          variant="caption" 
                          display="block" 
                          color={isError ? 'error.main' : (row.status === 'duplicate' ? 'warning.main' : 'info.main')}
                          sx={{ mt: 0.5, lineHeight: 1.2, fontStyle: row.status === 'new' ? 'italic' : 'normal' }}
                        >
                          {row.message}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    Không có dữ liệu phù hợp với bộ lọc.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Hủy bỏ</Button>
        
        {duplicateCount > 0 && (
          <Button 
            onClick={() => {
              // Chỉ lấy các index của học sinh mới
              const newOnlyIndexes = selectedRowIndexes.filter(id => {
                const r = data.find(d => d.rowIndex === id);
                return r && r.status === 'new';
              });
              onConfirm({ selectedRowIndexes: newOnlyIndexes, forceUpdate: false });
            }} 
            variant="outlined" 
            color="primary"
            disabled={loading || selectedRowIndexes.length === 0}
            sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
          >
            Chỉ Import dòng tạo mới
          </Button>
        )}

        <Button 
          onClick={() => onConfirm({ forceUpdate: false, skipDuplicates: false, selectedRowIndexes, allowUnassignedClass })} 
          variant="contained" 
          disabled={loading || selectedRowIndexes.length === 0}
          sx={{ borderRadius: 2, px: 4, fontWeight: 600, textTransform: 'none' }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : `Thực hiện Import (${selectedRowIndexes.length} dòng)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PreviewImportDialog;
