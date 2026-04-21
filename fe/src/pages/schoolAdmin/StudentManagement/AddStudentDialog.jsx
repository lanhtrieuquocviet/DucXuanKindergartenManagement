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
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';

const AddStudentDialog = ({
  open,
  onClose,
  formAdd,
  setFormAdd,
  formAddErrors,
  addError,
  setAddError,
  checkingParentPhone,
  isParentInfoLocked,
  activeAcademicYear,
  GENDER_OPTIONS,
  uploadingImage,
  addImageInputRef,
  onCheckExistingParent,
  onAddImageChange,
  onSubmit,
  ctxLoading,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Thêm học sinh và tài khoản phụ huynh</DialogTitle>
      <DialogContent dividers>
        {addError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAddError(null)}>
            {addError}
          </Alert>
        )}
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Thông tin tài khoản phụ huynh
        </Typography>
        <Stack spacing={1.5} mb={2}>
          <TextField
            size="small"
            label="Số điện thoại (đồng thời là tài khoản đăng nhập)"
            value={formAdd.parent.phone}
            onChange={(e) =>
              setFormAdd((prev) => ({
                ...prev,
                parent: { ...prev.parent, phone: e.target.value.replace(/\D/g, '') },
              }))
            }
            onBlur={() => onCheckExistingParent(formAdd.parent.phone)}
            fullWidth
            required
            error={!!formAddErrors.parentPhone}
            helperText={
              formAddErrors.parentPhone ||
              (checkingParentPhone
                ? 'Đang kiểm tra số điện thoại...'
                : 'Nếu trùng số, hệ thống sẽ dùng lại tài khoản phụ huynh hiện có')
            }
            placeholder="10–11 chữ số"
            inputProps={{ inputMode: 'numeric', maxLength: 11 }}
          />
          <Alert severity="info">
            Tài khoản và mật khẩu tạm sẽ được hệ thống tự sinh và gửi qua email phụ huynh khi tạo tài khoản mới. Nếu số
            điện thoại đã tồn tại, hệ thống sẽ dùng lại tài khoản cũ.
          </Alert>
          <TextField
            size="small"
            label="Họ tên phụ huynh"
            value={formAdd.parent.fullName}
            onChange={(e) => setFormAdd((prev) => ({ ...prev, parent: { ...prev.parent, fullName: e.target.value } }))}
            fullWidth
            required
            disabled={isParentInfoLocked}
            error={!!formAddErrors.parentFullName}
            helperText={isParentInfoLocked ? 'Đã xác nhận phụ huynh, không thể chỉnh sửa' : formAddErrors.parentFullName}
          />
          <TextField
            size="small"
            type="email"
            label="Email"
            value={formAdd.parent.email}
            onChange={(e) => setFormAdd((prev) => ({ ...prev, parent: { ...prev.parent, email: e.target.value } }))}
            fullWidth
            required
            disabled={isParentInfoLocked}
            error={!!formAddErrors.parentEmail}
            helperText={isParentInfoLocked ? 'Đã xác nhận phụ huynh, không thể chỉnh sửa' : formAddErrors.parentEmail}
          />
        </Stack>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Thông tin học sinh
        </Typography>
        <Stack spacing={1.5}>
          <Box sx={{ p: 1.5, bgcolor: '#f0f9ff', borderRadius: 1.5, border: '1px solid', borderColor: '#bae6fd' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <Typography variant="caption" color="#0369a1" fontWeight={700}>
                NIÊN KHÓA HỆ THỐNG:
              </Typography>
              <Chip
                label={activeAcademicYear?.yearName || 'Chưa có năm học đang hoạt động'}
                size="small"
                sx={{
                  bgcolor: activeAcademicYear ? '#0284c7' : '#9e9e9e',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
              * Học sinh mới sẽ được hệ thống <strong>tự động gán</strong> vào niên khóa đang hoạt động này.
            </Typography>
          </Box>
          <TextField
            size="small"
            label="Họ tên học sinh"
            value={formAdd.student.fullName}
            onChange={(e) => setFormAdd((prev) => ({ ...prev, student: { ...prev.student, fullName: e.target.value } }))}
            fullWidth
            required
            error={!!formAddErrors.studentFullName}
            helperText={formAddErrors.studentFullName}
          />
          <TextField
            size="small"
            type="date"
            label="Ngày sinh"
            InputLabelProps={{ shrink: true }}
            value={formAdd.student.dateOfBirth}
            onChange={(e) =>
              setFormAdd((prev) => ({ ...prev, student: { ...prev.student, dateOfBirth: e.target.value } }))
            }
            fullWidth
            required
            error={!!formAddErrors.studentDateOfBirth}
            helperText={formAddErrors.studentDateOfBirth}
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Giới tính</InputLabel>
            <Select
              value={formAdd.student.gender}
              label="Giới tính"
              onChange={(e) => setFormAdd((prev) => ({ ...prev, student: { ...prev.student, gender: e.target.value } }))}
            >
              {GENDER_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Ảnh học sinh
            </Typography>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              ref={addImageInputRef}
              onChange={onAddImageChange}
              style={{ display: 'none' }}
            />
            <Stack direction="row" alignItems="center" spacing={2}>
              <Button
                variant="outlined"
                size="small"
                component="span"
                disabled={uploadingImage}
                onClick={() => addImageInputRef.current?.click()}
              >
                {uploadingImage ? <CircularProgress size={20} /> : 'Chọn ảnh'}
              </Button>
              {formAdd.student.avatar && (
                <>
                  <Box
                    component="img"
                    src={formAdd.student.avatar}
                    alt="Preview"
                    sx={{ width: 56, height: 56, borderRadius: 1, objectFit: 'cover' }}
                  />
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setFormAdd((prev) => ({ ...prev, student: { ...prev.student, avatar: '' } }))}
                  >
                    Xóa ảnh
                  </Button>
                </>
              )}
            </Stack>
          </Box>
          <TextField
            size="small"
            label="Địa chỉ"
            value={formAdd.student.address}
            onChange={(e) => setFormAdd((prev) => ({ ...prev, student: { ...prev.student, address: e.target.value } }))}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={onSubmit} disabled={ctxLoading}>
          {ctxLoading ? <CircularProgress size={24} /> : 'Tạo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStudentDialog;
