import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';

const DuplicateConfirmDialog = ({ open, onClose, data, onConfirm }) => {
  const isSingleAdd = data?.[0]?.rowIndex === 'Thủ công';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: 'warning.main' }}>
        Cảnh báo trùng lặp học sinh
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" gutterBottom>
          Phát hiện <strong>{data?.length || 0}</strong> học sinh đã tồn tại trong hệ thống (cùng tên, ngày sinh và phụ huynh):
        </Typography>
        
        <Box 
          component="ul" 
          sx={{ 
            mt: 1, 
            maxHeight: 200, 
            overflow: 'auto', 
            pl: 2, 
            bgcolor: 'grey.50', 
            borderRadius: 1, 
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          {data?.map((d, i) => (
            <li key={i}>
              <Typography variant="caption">
                {d.rowIndex === 'Thủ công' ? 'Hiện tại' : `Dòng ${d.rowIndex}`}: <strong>{d.studentName}</strong> (PH: {d.parentName} - {d.phone})
              </Typography>
            </li>
          ))}
        </Box>
        
        <Typography variant="body2" sx={{ mt: 2, fontWeight: 500 }}>
          Bạn muốn xử lý như thế nào với những học sinh bị trùng này?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Hủy</Button>
        
        {!isSingleAdd && (
          <Button 
            onClick={() => onConfirm(false, true)} 
            variant="outlined" 
            color="primary"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Bỏ qua và chỉ nhập mới
          </Button>
        )}
        
        <Button 
          onClick={() => onConfirm(true, false)} 
          variant="contained" 
          color="warning"
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Cập nhật thông tin cũ
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DuplicateConfirmDialog;
