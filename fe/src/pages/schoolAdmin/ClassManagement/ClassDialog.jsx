import { memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { WarningAmber as WarningAmberIcon } from '@mui/icons-material';
import TeacherSelect from './TeacherSelect';

const ClassDialog = memo(({
  open,
  onClose,
  mode,
  form,
  setForm,
  errors,
  loading,
  fetchingData,
  onSubmit,
  grades,
  rooms,
  academicYear,
  teacherAvailability,
  teacherAvailLoading,
  gradeLocked,
  noActiveYear,
  onNavigateToYearSetup,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {mode === 'create' ? 'Tạo lớp học mới' : 'Chỉnh sửa lớp học'}
      </DialogTitle>
      <DialogContent dividers>
        {fetchingData && (
          <Stack alignItems="center" py={6}><CircularProgress size={32} /></Stack>
        )}

        {!fetchingData && noActiveYear && (
          <Alert
            severity="warning"
            icon={<WarningAmberIcon />}
            sx={{ mb: 2, borderRadius: 2 }}
            action={
              <Button size="small" color="inherit" onClick={onNavigateToYearSetup}>
                Tạo năm học
              </Button>
            }
          >
            Chưa có năm học đang hoạt động. Vui lòng tạo năm học mới trước khi tạo lớp.
          </Alert>
        )}

        {!fetchingData && errors.submit && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{errors.submit}</Alert>
        )}

        {!fetchingData && academicYear && mode === 'create' && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Lớp sẽ được tạo trong năm học: <strong>{academicYear.yearName}</strong>
          </Alert>
        )}

        {!fetchingData && (academicYear || mode === 'edit') && (
          <Stack spacing={2.5} mt={1}>
            <TextField
              label="Tên lớp"
              required
              fullWidth
              size="small"
              placeholder="Ví dụ: Lớp Lá 1"
              value={form.className}
              onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))}
              error={!!errors.className}
              helperText={errors.className || `${form.className.length}/10 ký tự`}
              inputProps={{ maxLength: 10 }}
            />

            <FormControl fullWidth size="small" required error={!!errors.gradeId}>
              <InputLabel>Khối lớp</InputLabel>
              <Select
                label="Khối lớp"
                value={form.gradeId}
                onChange={(e) => setForm((f) => ({ ...f, gradeId: e.target.value }))}
                disabled={gradeLocked}
              >
                {grades.map((g) => (
                  <MenuItem key={g._id} value={g._id}>{g.gradeName}</MenuItem>
                ))}
              </Select>
              {errors.gradeId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>{errors.gradeId}</Typography>
              )}
            </FormControl>

            <TextField
              label="Sĩ số tối đa"
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0, max: 30 }}
              value={form.maxStudents}
              onChange={(e) => setForm((f) => ({ ...f, maxStudents: e.target.value }))}
              error={!!errors.maxStudents}
              helperText={errors.maxStudents || 'Gợi ý: 25 - 30 học sinh'}
            />

            <TeacherSelect
              availability={teacherAvailability}
              loading={teacherAvailLoading}
              value={form.teacherIds}
              onChange={(val) => setForm(f => ({ ...f, teacherIds: val }))}
              error={errors.teacherIds}
              helperText={`Đã chọn: ${form.teacherIds.length}/2 giáo viên (bắt buộc)`}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Phòng học</InputLabel>
              <Select
                label="Phòng học"
                value={form.roomId}
                onChange={(e) => setForm(f => ({ ...f, roomId: e.target.value }))}
              >
                <MenuItem value=""><em>— Chưa chọn phòng —</em></MenuItem>
                {rooms.map(r => {
                  const occupied = r.occupiedByClass && r.occupiedByClass !== form.className;
                  const unavailable = r.status !== 'available';
                  const disabled = !!occupied || unavailable;
                  const label = occupied
                    ? ` (Đang dùng bởi lớp ${r.occupiedByClass})`
                    : r.status === 'in_use' ? ' (Đang sử dụng)'
                    : r.status === 'maintenance' ? ' (Bảo trì)'
                    : '';
                  return (
                    <MenuItem key={r._id} value={r._id} disabled={disabled}>
                      {r.roomName} — Tầng {r.floor}{label}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Hủy</Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={loading || fetchingData || (mode === 'create' && !academicYear)}
          sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3 }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : (mode === 'create' ? 'Tạo lớp học' : 'Lưu thay đổi')}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default ClassDialog;
