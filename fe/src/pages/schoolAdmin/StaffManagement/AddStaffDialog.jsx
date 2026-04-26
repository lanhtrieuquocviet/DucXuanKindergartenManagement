import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Alert,
  Typography,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
const AddStaffDialog = ({
  open,
  onClose,
  form,
  setForm,
  loading,
  error,
  setError,
  onSubmit,
  POSITION_OPTIONS,
  POSITION_MAP,
}) => {

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Thêm nhân viên mới</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Typography variant="subtitle2" color="primary" gutterBottom>
          Trạng thái tài khoản
        </Typography>
        <Stack spacing={2} mb={3}>
          {form.roleName ? (
            <Alert severity="success" variant="outlined" sx={{ py: 0.5, '& .MuiAlert-message': { fontSize: '0.8rem' } }}>
              Chức vụ này <strong>có quyền truy cập hệ thống</strong>. Mật khẩu sẽ được hệ thống <strong>tự động sinh</strong> và gửi qua Email nhân sự. Nhân viên bắt buộc phải đổi mật khẩu ở lần đầu đăng nhập.
            </Alert>
          ) : (
            <Alert severity="info" variant="outlined" sx={{ py: 0.5, '& .MuiAlert-message': { fontSize: '0.8rem' } }}>
              Chức vụ này <strong>chỉ lưu hồ sơ</strong>, không cấp tài khoản đăng nhập.
            </Alert>
          )}
        </Stack>

        <Typography variant="subtitle2" color="primary" gutterBottom>
          Thông tin cá nhân & Chức vụ
        </Typography>
        <Stack spacing={2}>
          <TextField
            size="small"
            label="Họ và tên"
            fullWidth
            required
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              size="small"
              label="Email"
              fullWidth
              required
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
            <TextField
              size="small"
              label="Số điện thoại"
              fullWidth
              required
              value={form.phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setForm((p) => ({ ...p, phone: val, username: val }));
              }}
              helperText="Dùng làm tài khoản đăng nhập"
              FormHelperTextProps={{ sx: { color: 'primary.main', fontWeight: 600 } }}
            />
          </Stack>
          <FormControl size="small" fullWidth required>
            <InputLabel>Chức vụ / Vị trí</InputLabel>
            <Select
              value={form.position}
              label="Chức vụ / Vị trí"
              onChange={(e) => {
                const pos = e.target.value;
                const role = POSITION_MAP[pos] || null;
                setForm((p) => ({ ...p, position: pos, roleName: role }));
              }}
            >
              {POSITION_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
              <MenuItem value="Other">Khác...</MenuItem>
            </Select>
            {form.position && !POSITION_MAP[form.position] && form.position !== 'Other' && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
                * Chức vụ này chỉ tạo hồ sơ nhân sự, không có quyền truy cập hệ thống.
              </Typography>
            )}
          </FormControl>
          {form.position === 'Other' && (
            <TextField
              size="small"
              label="Nhập chức vụ khác"
              fullWidth
              value={form.customPosition}
              onChange={(e) => setForm((p) => ({ ...p, customPosition: e.target.value }))}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={loading}
          sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Tạo tài khoản'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStaffDialog;
