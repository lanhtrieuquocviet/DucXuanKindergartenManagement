import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, Avatar,
} from '@mui/material';
import { WarningAmber as WarningIcon } from '@mui/icons-material';

function ConfirmDialog({
  open,
  title = 'Xác nhận thao tác',
  message,
  confirmText = 'Đồng ý',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog
      open={!!open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: '#fef2f2', flexShrink: 0 }}>
            <WarningIcon sx={{ color: 'error.main', fontSize: 22 }} />
          </Avatar>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ pt: 0.75 }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      {message && (
        <DialogContent sx={{ pt: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        </DialogContent>
      )}

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          {cancelText}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog;
