import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Checkbox,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import { getRoleDisplayName } from '../utils/permissionUtils';

const RoleDialog = ({
  open,
  onClose,
  editingRole,
  roleForm,
  setRoleForm,
  roles,
  jobPositions,
  loading,
  error,
  onSubmit,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 2, overflow: 'hidden' } } }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
        }}
      >
        <SecurityIcon sx={{ color: 'white', fontSize: 24 }} />
        <Typography variant="h6" fontWeight={700} color="white">
          {editingRole ? `Sửa vai trò: ${getRoleDisplayName(editingRole.roleName)}` : 'Thêm vai trò mới'}
        </Typography>
      </Box>

      <Box component="form" onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}
          <TextField
            label="Mã vai trò (Database)"
            value={roleForm.roleName}
            onChange={(e) => setRoleForm({ ...roleForm, roleName: e.target.value })}
            fullWidth required
            slotProps={{ htmlInput: { maxLength: 32 } }}
            placeholder="VD: Teacher, SchoolAdmin"
            size="small" sx={{ mb: 2.5 }}
            disabled={!!editingRole}
            helperText={editingRole ? "Không thể thay đổi mã vai trò sau khi tạo" : "Mã này dùng để đối chiếu trong code"}
          />
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Tên hiển thị: <strong>{getRoleDisplayName(roleForm.roleName)}</strong>
            </Typography>
          </Box>
          <TextField
            label="Mô tả"
            value={roleForm.description}
            onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
            fullWidth multiline rows={2}
            slotProps={{ htmlInput: { maxLength: 255 } }}
            placeholder="Mô tả vai trò này (tối đa 255 ký tự)"
            size="small" sx={{ mb: 2.5 }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Kế thừa từ role cha (tùy chọn)</InputLabel>
            <Select
              value={roleForm.parentId}
              label="Kế thừa từ role cha (tùy chọn)"
              onChange={(e) => setRoleForm({ ...roleForm, parentId: e.target.value })}
            >
              <MenuItem value=""><em>Không kế thừa</em></MenuItem>
              {roles
                .filter((r) => !editingRole || (r.id || r._id) !== (editingRole.id || editingRole._id))
                .map((r) => (
                  <MenuItem key={r.id || r._id} value={r.id || r._id}>{getRoleDisplayName(r.roleName)}</MenuItem>
                ))}
            </Select>
            <FormHelperText>Role con sẽ tự động có tất cả quyền của role cha</FormHelperText>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mt: 2.5 }}>
            <InputLabel>Các chức vụ ứng với role này</InputLabel>
            <Select
              multiple
              value={roleForm.linkedPositions || []}
              label="Các chức vụ ứng với role này"
              onChange={(e) => setRoleForm({ ...roleForm, linkedPositions: e.target.value })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {jobPositions.map((jp) => (
                <MenuItem key={jp._id} value={jp.title}>
                  <Checkbox checked={(roleForm.linkedPositions || []).indexOf(jp.title) > -1} />
                  <Typography variant="body2">{jp.title}</Typography>
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Các chức vụ được chọn sẽ tự động được gán role này khi tạo nhân viên</FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" sx={{ color: 'text.secondary', borderColor: 'divider', textTransform: 'none' }}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, fontWeight: 700, textTransform: 'none' }}
          >
            {loading ? 'Đang lưu...' : editingRole ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default RoleDialog;
