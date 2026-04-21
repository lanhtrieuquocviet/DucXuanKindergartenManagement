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
            <InputLabel>Vai trò hệ thống</InputLabel>
            <Select
              value={form.roleName || 'Teacher'}
              label="Vai trò hệ thống"
              onChange={(e) => setForm((p) => ({ ...p, roleName: e.target.value }))}
            >
              <MenuItem value="SchoolAdmin">Quản trị viên trường</MenuItem>
              <MenuItem value="Teacher">Giáo viên</MenuItem>
              <MenuItem value="KitchenStaff">Nhân viên bếp</MenuItem>
              <MenuItem value="MedicalStaff">Nhân viên y tế</MenuItem>
              <MenuItem value="HeadTeacher">Tổ trưởng chuyên môn</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth required>
            <InputLabel>Chức vụ / Vị trí</InputLabel>
            <Select
              value={form.position}
              label="Chức vụ / Vị trí"
              onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
            >
              {POSITION_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
              <MenuItem value="Other">Khác...</MenuItem>
            </Select>
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
