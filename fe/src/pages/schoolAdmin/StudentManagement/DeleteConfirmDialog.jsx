import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';

const DeleteConfirmDialog = ({ open, onClose, studentName, onDelete, loading, error }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xóa học sinh</DialogTitle>
      <DialogContent>
        <Typography>
          Bạn có chắc chắn muốn xóa học sinh <strong>{studentName}</strong>?
          Hành động này không thể hoàn tác và sẽ xóa bỏ toàn bộ hồ sơ liên quan của học sinh này.
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ p: 2, px: 3 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Hủy</Button>
        <Button 
          onClick={onDelete} 
          color="error" 
          variant="contained" 
          disabled={loading}
          sx={{ borderRadius: 2, px: 3, fontWeight: 600, textTransform: 'none' }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Xác nhận xóa'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
