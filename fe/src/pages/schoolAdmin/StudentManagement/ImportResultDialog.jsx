import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Alert,
  Box,
  Typography
} from '@mui/material';

const ImportResultDialog = ({ open, onClose, result, onDownloadResults }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Kết quả import Excel</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            Tạo học sinh thành công: <strong>{result?.createdStudents || 0}</strong>
          </Alert>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Phụ huynh tạo mới: <strong>{result?.createdParents || 0}</strong> - Gán phụ huynh đã có: <strong>{result?.linkedExistingParents || 0}</strong>
          </Alert>
          
          {(result?.errors || []).length > 0 && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Có {(result?.errors || []).length} dòng lỗi:
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2, maxHeight: 150, overflow: 'auto' }}>
                {(result?.errors || []).map((err, i) => (
                  <li key={i}>
                    <Typography variant="caption">{err}</Typography>
                  </li>
                ))}
              </Box>
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
        <Button 
          variant="contained" 
          color="success" 
          onClick={onDownloadResults}
          disabled={!result?.importResults?.length}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Tải file tài khoản vừa tạo
        </Button>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportResultDialog;
