import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';

const JobPositionDialog = ({
  open,
  onClose,
  editingPos,
  form,
  setForm,
  roles,
  submitting,
  onSubmit,
}) => {
  return (
    <Dialog open={open} onClose={() => !submitting && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'grey.100' }}>
        {editingPos ? 'Chỉnh sửa chức vụ' : 'Thêm chức vụ mới'}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Tên chức vụ *"
            fullWidth
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="VD: Giáo viên, Bảo vệ..."
            disabled={editingPos?.isDefault}
          />
          <FormControl fullWidth>
            <InputLabel>Quyền hệ thống (Role)</InputLabel>
            <Select
              label="Quyền hệ thống (Role)"
              value={form.roleName}
              onChange={(e) => setForm({ ...form, roleName: e.target.value })}
            >
              <MenuItem value="">
                <em>Không có quyền (Chỉ lưu hồ sơ)</em>
              </MenuItem>
              {roles.map((role) => (
                <MenuItem key={role._id} value={role.roleName}>
                  {role.roleName}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, px: 1.5 }}>
              Nếu để trống, người thuộc chức vụ này sẽ không có tài khoản đăng nhập.
            </Typography>
          </FormControl>
          <TextField
            label="Mô tả"
            fullWidth
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'grey.100' }}>
        <Button onClick={onClose} disabled={submitting}>Hủy</Button>
        <Button 
          variant="contained" 
          onClick={onSubmit} 
          disabled={submitting}
        >
          {submitting ? <CircularProgress size={20} color="inherit" /> : 'Lưu dữ liệu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JobPositionDialog;
