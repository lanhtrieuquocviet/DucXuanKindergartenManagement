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
  FormControlLabel,
  Switch,
  CircularProgress,
} from '@mui/material';

const EditStudentDialog = ({
  open,
  onClose,
  formEdit,
  setFormEdit,
  formEditErrors,
  editError,
  setEditError,
  classes,
  GENDER_OPTIONS,
  onSubmit,
  ctxLoading,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Chỉnh sửa thông tin học sinh</DialogTitle>
      <DialogContent dividers>
        {editError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setEditError(null)}>
            {editError}
          </Alert>
        )}
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Thông tin học sinh
        </Typography>
        <Stack spacing={1.5} mb={3}>
          <TextField
            size="small"
            label="Họ tên học sinh"
            value={formEdit.fullName}
            onChange={(e) => setFormEdit((prev) => ({ ...prev, fullName: e.target.value }))}
            fullWidth
            required
            error={!!formEditErrors.fullName}
            helperText={formEditErrors.fullName}
          />
          <TextField
            size="small"
            type="date"
            label="Ngày sinh"
            InputLabelProps={{ shrink: true }}
            value={formEdit.dateOfBirth}
            onChange={(e) => setFormEdit((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
            fullWidth
            required
            error={!!formEditErrors.dateOfBirth}
            helperText={formEditErrors.dateOfBirth}
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Giới tính</InputLabel>
            <Select
              value={formEdit.gender}
              label="Giới tính"
              onChange={(e) => setFormEdit((prev) => ({ ...prev, gender: e.target.value }))}
            >
              {GENDER_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Lớp (Chỉ xem)</InputLabel>
            <Select value={formEdit.classId} label="Lớp (Chỉ xem)" disabled>
              <MenuItem value="">— Chưa xếp lớp —</MenuItem>
              {classes.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.className}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Địa chỉ"
            value={formEdit.address}
            onChange={(e) => setFormEdit((prev) => ({ ...prev, address: e.target.value }))}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={formEdit.needsSpecialAttention}
                onChange={(e) => setFormEdit((prev) => ({ ...prev, needsSpecialAttention: e.target.checked }))}
              />
            }
            label="Cần chú ý đặc biệt (sức khỏe/dị ứng...)"
          />
          {formEdit.needsSpecialAttention && (
            <TextField
              size="small"
              label="Ghi chú đặc biệt"
              multiline
              rows={2}
              value={formEdit.specialNote}
              onChange={(e) => setFormEdit((prev) => ({ ...prev, specialNote: e.target.value }))}
              fullWidth
              placeholder="Ví dụ: Dị ứng đậu phộng, hen suyễn..."
            />
          )}
          <FormControl size="small" fullWidth>
            <InputLabel>Trạng thái học tập</InputLabel>
            <Select
              value={formEdit.status}
              label="Trạng thái học tập"
              onChange={(e) => setFormEdit((prev) => ({ ...prev, status: e.target.value }))}
            >
              <MenuItem value="active">Đang học</MenuItem>
              <MenuItem value="inactive">Đã thôi học / Tốt nghiệp</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Typography variant="subtitle2" color="primary" gutterBottom>
          Thông tin phụ huynh liên hệ
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            size="small"
            label="Họ tên phụ huynh"
            value={formEdit.parentFullName}
            onChange={(e) => setFormEdit((prev) => ({ ...prev, parentFullName: e.target.value }))}
            fullWidth
          />
          <TextField
            size="small"
            label="Email"
            value={formEdit.parentEmail}
            onChange={(e) => setFormEdit((prev) => ({ ...prev, parentEmail: e.target.value }))}
            fullWidth
            error={!!formEditErrors.parentEmail}
            helperText={formEditErrors.parentEmail}
          />
          <TextField
            size="small"
            label="Số điện thoại"
            value={formEdit.parentPhone}
            onChange={(e) => setFormEdit((prev) => ({ ...prev, parentPhone: e.target.value }))}
            fullWidth
            error={!!formEditErrors.parentPhone}
            helperText={formEditErrors.parentPhone}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={onSubmit} disabled={ctxLoading}>
          {ctxLoading ? <CircularProgress size={24} /> : 'Cập nhật'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditStudentDialog;
