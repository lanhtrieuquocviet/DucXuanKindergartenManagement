import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';

const ParentMergeConfirmDialog = ({ open, onClose, phone, parentName, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận gộp tài khoản</DialogTitle>
      <DialogContent>
        <Typography>
          Số điện thoại <strong>{phone}</strong> đã thuộc về phụ huynh: <strong>{parentName}</strong>.
          <br /><br />
          Bạn có muốn <strong>gộp học sinh này</strong> vào tài khoản đó không? Thông tin phụ huynh hiện tại sẽ được dùng chung.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Hủy, nhập số khác</Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="primary"
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Xác nhận gộp
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ParentMergeConfirmDialog;
