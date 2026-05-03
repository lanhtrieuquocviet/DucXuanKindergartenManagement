import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Typography, Alert, Stack, CircularProgress, Box, IconButton, Divider
} from '@mui/material';
import { Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';
import { post, ENDPOINTS } from '../../service/api';

export default function StudentRequestModal({ open, onClose, studentId, studentName, onSuccess }) {
  const [type, setType] = useState('transfer');
  const [reason, setReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await post(ENDPOINTS.STUDENTS.CONTACT_BOOK_SUBMIT_REQUEST, {
        studentId,
        type,
        reason: reason.trim(),
        effectiveDate: effectiveDate || undefined
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi gửi yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={() => !loading && onClose()} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography fontWeight={700}>Gửi yêu cầu Chuyển trường/Thôi học</Typography>
          {!loading && (
            <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
          )}
        </Stack>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2.5}>
          <Box sx={{ bgcolor: '#f0f9ff', p: 1.5, borderRadius: 2, border: '1px solid #bae6fd' }}>
            <Typography fontSize="0.75rem" color="text.secondary">Học sinh</Typography>
            <Typography fontWeight={700} color="primary.main">{studentName}</Typography>
          </Box>

          <FormControl fullWidth size="small">
            <InputLabel>Loại yêu cầu</InputLabel>
            <Select 
              value={type} 
              label="Loại yêu cầu" 
              onChange={(e) => setType(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="transfer">Xin chuyển trường</MenuItem>
              <MenuItem value="withdrawal">Xin thôi học (nghỉ học hẳn)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Lý do *"
            multiline
            rows={4}
            fullWidth
            size="small"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            placeholder="Vui lòng cung cấp lý do chi tiết..."
            inputProps={{ maxLength: 1000 }}
          />

          <TextField
            label="Ngày dự kiến (nếu có)"
            type="date"
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            disabled={loading}
          />

          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
          
          <Alert severity="info" sx={{ borderRadius: 2, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
            Yêu cầu sẽ được Ban Giám hiệu xem xét và phản hồi trong thời gian sớm nhất.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button 
          fullWidth 
          variant="outlined" 
          onClick={onClose} 
          disabled={loading}
          sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b', borderColor: '#cbd5e1' }}
        >
          Hủy
        </Button>
        <Button 
          fullWidth 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: '#0ea5e9', '&:hover': { bgcolor: '#0284c7' } }}
        >
          {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
