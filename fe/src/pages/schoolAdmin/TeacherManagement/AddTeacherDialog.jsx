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
  Tooltip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Autorenew as AutorenewIcon } from '@mui/icons-material';

const AddTeacherDialog = ({
  open,
  onClose,
  form,
  setForm,
  errors,
  loading,
  error,
  setError,
  onGenerateUsername,
  usernameGenerating,
  onSubmit,
  EMPLOYMENT_OPTIONS,
  GENDER_OPTIONS,
}) => {
  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Thêm giáo viên mới</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Typography variant="subtitle2" color="primary" gutterBottom>
          Thông tin tài khoản
        </Typography>
        <Stack spacing={1.5} mb={2}>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <TextField
              size="small"
              label="Tài khoản đăng nhập"
              required
              sx={{ flex: 1 }}
              value={form.username}
              InputProps={{ readOnly: true }}
              error={!!errors.username}
              helperText={errors.username || 'Được tạo tự động'}
            />
            <Tooltip title="Tạo lại">
              <span>
                <IconButton
                  size="small"
                  onClick={onGenerateUsername}
                  disabled={usernameGenerating}
                  sx={{ mt: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                  {usernameGenerating ? <CircularProgress size={16} /> : <AutorenewIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
          <TextField
            size="small"
            label="Mật khẩu tạm thời"
            type="text"
            required
            fullWidth
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            error={!!errors.password}
            helperText={errors.password}
          />
        </Stack>

        <Typography variant="subtitle2" color="primary" gutterBottom>
          Thông tin cá nhân
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            size="small"
            label="Họ và tên"
            required
            fullWidth
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            error={!!errors.fullName}
            helperText={errors.fullName}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              size="small"
              label="Email"
              required
              fullWidth
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              error={!!errors.email}
              helperText={errors.email}
            />
            <TextField
              size="small"
              label="Số điện thoại"
              required
              fullWidth
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
              error={!!errors.phone}
              helperText={errors.phone}
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Giới tính</InputLabel>
              <Select
                value={form.gender}
                label="Giới tính"
                onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
              >
                {GENDER_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Bằng cấp"
              fullWidth
              value={form.degree}
              onChange={(e) => setForm((p) => ({ ...p, degree: e.target.value }))}
              placeholder="VD: Cử nhân, Thạc sĩ..."
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Loại hình công tác</InputLabel>
              <Select
                value={form.employmentType}
                label="Loại hình công tác"
                onChange={(e) => setForm((p) => ({ ...p, employmentType: e.target.value }))}
              >
                {EMPLOYMENT_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Ngày vào làm"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.hireDate}
              onChange={(e) => setForm((p) => ({ ...p, hireDate: e.target.value }))}
            />
          </Stack>
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
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Tạo giáo viên'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTeacherDialog;
