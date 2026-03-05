// Modal đánh vắng mặt học sinh + dialog xác nhận
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Alert, IconButton,
  Avatar,
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonOff as AbsentIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { ABSENT_REASONS, MAX_NOTE_LEN, sanitizeMultiLineText } from './attendanceUtils';

function AbsentModal({
  isOpen,
  studentId,
  students,
  absentForm,
  setAbsentForm,
  absentError,
  onSubmit,
  onClose,
  isConfirmOpen,
  selectedDate,
  onConfirm,
  onCancelConfirm,
}) {
  const studentObj = students.find((s) => s._id === studentId);
  const studentName = studentObj?.fullName || studentId || '';
  const studentAvatar = studentObj?.avatar || '';
  const initial = studentName?.[0]?.toUpperCase() || '?';

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}
      >
        {/* Colored header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            px: 2.5, pt: 2.5, pb: 2,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
              <AbsentIcon sx={{ color: 'white', fontSize: 22 }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="white">
                Ghi nhận vắng mặt
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                {selectedDate}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', mt: -0.5 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box component="form" onSubmit={onSubmit}>
          <DialogContent sx={{ pt: 2.5, pb: 1 }}>
            {absentError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{absentError}</Alert>
            )}

            {/* Student card */}
            <Box
              sx={{
                mb: 2.5, p: 1.75, borderRadius: 2.5,
                border: '1.5px solid', borderColor: 'error.200',
                bgcolor: '#fff5f5',
                display: 'flex', alignItems: 'center', gap: 1.5,
              }}
            >
              <Avatar
                src={studentAvatar || undefined}
                sx={{
                  width: 44, height: 44,
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  fontWeight: 700, fontSize: 15,
                  border: studentAvatar ? '2px solid #fca5a5' : 'none',
                }}
              >
                {initial}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={700}>{studentName}</Typography>
                <Typography variant="caption" color="error.main">Sẽ được đánh là vắng mặt</Typography>
              </Box>
              <WarningIcon sx={{ color: 'error.main', ml: 'auto', opacity: 0.6 }} fontSize="small" />
            </Box>

            {/* Reason */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Lý do vắng mặt *</InputLabel>
              <Select
                value={absentForm.reason}
                label="Lý do vắng mặt *"
                onChange={(e) => setAbsentForm((prev) => ({ ...prev, reason: e.target.value }))}
              >
                <MenuItem value="" disabled>-- Chọn lý do --</MenuItem>
                {ABSENT_REASONS.map((reason) => (
                  <MenuItem key={reason} value={reason}>{reason}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Note */}
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              label="Ghi chú thêm"
              placeholder="Ví dụ: Phụ huynh đã báo trước qua điện thoại..."
              value={absentForm.note}
              slotProps={{ htmlInput: { maxLength: MAX_NOTE_LEN } }}
              onChange={(e) =>
                setAbsentForm((prev) => ({
                  ...prev,
                  note: sanitizeMultiLineText(e.target.value, MAX_NOTE_LEN),
                }))
              }
              helperText={`${(absentForm.note || '').length} / ${MAX_NOTE_LEN} ký tự`}
            />
          </DialogContent>

          <DialogActions sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, flex: 1 }}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="error"
              startIcon={<AbsentIcon />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, flex: 1.5, boxShadow: 'none' }}
            >
              Xác nhận vắng mặt
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Xác nhận lưu vắng mặt"
        message={`Bạn có chắc muốn lưu vắng mặt cho học sinh "${studentName}" vào ngày ${selectedDate}?`}
        confirmText="Lưu"
        cancelText="Hủy"
        onConfirm={onConfirm}
        onCancel={onCancelConfirm}
      />
    </>
  );
}

export default AbsentModal;
