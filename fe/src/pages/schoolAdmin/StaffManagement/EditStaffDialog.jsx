import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Typography,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';

const EditStaffDialog = ({
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
      <DialogTitle sx={{ fontWeight: 700 }}>Chỉnh sửa thông tin nhân viên</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

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
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
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
          <FormControl size="small" fullWidth>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={form.status}
              label="Trạng thái"
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            >
              <MenuItem value="active">Đang hoạt động</MenuItem>
              <MenuItem value="inactive">Tạm khóa</MenuItem>
            </Select>
          </FormControl>
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
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Lưu thay đổi'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditStaffDialog;
