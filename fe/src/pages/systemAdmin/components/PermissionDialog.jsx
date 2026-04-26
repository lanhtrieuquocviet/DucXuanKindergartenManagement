import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';

function PermissionDialog({
  open,
  onClose,
  editingPermission,
  permissionForm,
  setPermissionForm,
  onSave,
  loading,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        {editingPermission ? 'Sửa quyền' : 'Thêm quyền mới'}
      </DialogTitle>
      <Box component="form" onSubmit={onSave}>
        <DialogContent>
          <Stack spacing={2.5}>
            <TextField
              label="Mã quyền (Code)"
              fullWidth
              placeholder="VD: VIEW_ACCOUNTS"
              value={permissionForm.code}
              onChange={(e) =>
                setPermissionForm((prev) => ({ ...prev, code: e.target.value }))
              }
              helperText="Viết hoa, không dấu, dùng gạch dưới (VD: CREATE_USER)"
              required
            />
            <TextField
              label="Mô tả"
              fullWidth
              placeholder="VD: Cho phép xem danh sách tài khoản"
              value={permissionForm.description}
              onChange={(e) =>
                setPermissionForm((prev) => ({ ...prev, description: e.target.value }))
              }
              required
            />
            <TextField
              label="Nhóm chức năng"
              fullWidth
              placeholder="VD: Người dùng, Học sinh, Điểm danh..."
              value={permissionForm.group}
              onChange={(e) =>
                setPermissionForm((prev) => ({ ...prev, group: e.target.value }))
              }
              helperText="Dùng để gom nhóm các quyền liên quan"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button
            onClick={onClose}
            color="inherit"
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ fontWeight: 800, textTransform: 'none', px: 3, borderRadius: 2 }}
          >
            {loading ? 'Đang lưu...' : 'Lưu quyền'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

import { Stack } from '@mui/material';
export default PermissionDialog;
