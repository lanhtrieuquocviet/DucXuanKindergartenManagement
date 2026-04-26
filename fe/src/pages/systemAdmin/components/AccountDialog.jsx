import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Person as PersonIcon } from '@mui/icons-material';

function AccountDialog({
  open,
  onClose,
  editingUser,
  userForm,
  setUserForm,
  roles,
  saveErrorMessage,
  loading,
  onSave,
  usernameHint,
  passwordHint,
  handleChangeField,
  isSmDown,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const selectedRoleId = userForm.roleIds[0];
  const selectedRoleObj = roles.find(r => (r.id || r._id) === selectedRoleId);
  const isSystemAdminRole = selectedRoleObj?.roleName === 'SystemAdmin';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isSmDown}
      PaperProps={{
        sx: {
          borderRadius: isSmDown ? 0 : 3,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      }}
    >
      <DialogTitle
        sx={{
          pt: 3,
          pb: 2,
          px: 4,
          fontWeight: 800,
          fontSize: '1.5rem',
          color: '#1e293b',
        }}
      >
        {editingUser ? 'Sửa thông tin nhân viên' : 'Thêm nhân viên mới'}
      </DialogTitle>

      <Box component="form" onSubmit={onSave}>
        <DialogContent sx={{ px: 4, pb: 4 }}>
          {/* Avatar Preview */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Avatar
              src={userForm.avatarUrl}
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'rgba(99,102,241,0.05)',
                color: 'primary.main',
                boxShadow: '0 8px 16px rgba(37, 99, 235, 0.15)',
                border: '3px solid rgba(99,102,241,0.2)',
              }}
            >
              <PersonIcon sx={{ fontSize: 48 }} />
            </Avatar>
          </Box>

          {saveErrorMessage && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {saveErrorMessage}
            </Alert>
          )}

          {/* Section 1: Account Info */}
          <Typography
            variant="subtitle2"
            sx={{
              color: '#1976d2',
              fontWeight: 700,
              mb: 1.5,
              fontSize: '0.875rem'
            }}
          >
            Thông tin tài khoản
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 4 }}>
            {isSystemAdminRole && (
              <TextField
                label="Tên đăng nhập (Username) *"
                name="username"
                value={userForm.username}
                onChange={handleChangeField}
                size="medium"
                placeholder="VD: nguyenvan_a"
                helperText={
                  usernameHint || 'SystemAdmin có thể đặt tên tài khoản tùy ý.'
                }
                FormHelperTextProps={{
                  sx: { color: usernameHint ? 'warning.main' : 'text.secondary' },
                }}
                inputProps={{ autoComplete: 'off' }}
                disabled={!!editingUser}
                fullWidth
              />
            )}

            {!editingUser && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: -1.5 }}>
                <Button 
                  size="small" 
                  variant="text" 
                  onClick={() => setUserForm(p => ({ ...p, password: '@DucXuan123', confirmPassword: '@DucXuan123' }))}
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                >
                  Sử dụng mật khẩu mặc định (@DucXuan123)
                </Button>
              </Box>
            )}
            <TextField
              label="Mật khẩu *"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={userForm.password}
              onChange={handleChangeField}
              size="medium"
              placeholder={
                editingUser ? 'Để trống nếu giữ nguyên' : 'Mặc định: @DucXuan123'
              }
              helperText={
                passwordHint ||
                (!editingUser ? 'Để trống nếu muốn dùng mật khẩu mặc định' : '')
              }
              FormHelperTextProps={{
                sx: { color: passwordHint ? 'warning.main' : 'text.secondary' },
              }}
              inputProps={{ autoComplete: 'new-password' }}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943-9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Xác nhận mật khẩu *"
              name="confirmPassword"
              type="password"
              value={userForm.confirmPassword}
              onChange={handleChangeField}
              size="medium"
              placeholder="Nhập lại mật khẩu"
              inputProps={{ autoComplete: 'new-password' }}
              fullWidth
            />
          </Box>

          {/* Section 2: Personal Info */}
          <Typography
            variant="subtitle2"
            sx={{ color: '#1976d2', fontWeight: 700, mb: 2, fontSize: '0.875rem' }}
          >
            Thông tin cá nhân & Chức vụ
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Họ và tên *"
              name="fullName"
              value={userForm.fullName}
              onChange={handleChangeField}
              required
              size="medium"
              placeholder="VD: Nguyễn Văn A"
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 2 }}>
              <TextField
                label="Email *"
                name="email"
                type="email"
                value={userForm.email}
                onChange={handleChangeField}
                required
                size="medium"
                placeholder="VD: tranlong280403@gmail.com"
                fullWidth
              />

              <TextField
                label="Số điện thoại"
                name="phone"
                value={userForm.phone}
                onChange={handleChangeField}
                size="medium"
                placeholder="Số điện thoại"
                helperText={!isSystemAdminRole ? "Số điện thoại này sẽ dùng làm tài khoản đăng nhập." : ""}
                FormHelperTextProps={{ sx: { color: 'primary.main', fontWeight: 600 } }}
                fullWidth
              />
            </Box>

            <FormControl size="medium" required fullWidth>
              <InputLabel>Vai trò hệ thống *</InputLabel>
              <Select
                name="roleIds"
                value={userForm.roleIds[0] || ''}
                label="Vai trò hệ thống *"
                onChange={(e) => {
                  const newRoleId = e.target.value;
                  const newRoleObj = roles.find(r => (r.id || r._id) === newRoleId);
                  const isNewSysAdmin = newRoleObj?.roleName === 'SystemAdmin';
                  
                  setUserForm((prev) => {
                    const next = { ...prev, roleIds: [newRoleId] };
                    // Nếu không phải SystemAdmin, ép username về SĐT
                    if (!isNewSysAdmin) {
                      next.username = prev.phone;
                    }
                    return next;
                  });
                }}
              >
                {roles.map((r) => (
                  <MenuItem key={r.id || r._id} value={r.id || r._id}>
                    {r.roleName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="medium" required fullWidth>
              <InputLabel>Chức vụ / Vị trí *</InputLabel>
              <Select
                name="position"
                value={userForm.position}
                label="Chức vụ / Vị trí"
                onChange={handleChangeField}
              >
                <MenuItem value="Giáo viên chủ nhiệm">Giáo viên chủ nhiệm</MenuItem>
                <MenuItem value="Giáo viên bộ môn">Giáo viên bộ môn</MenuItem>
                <MenuItem value="Bảo mẫu">Bảo mẫu</MenuItem>
                <MenuItem value="Nhân viên bếp">Nhân viên bếp</MenuItem>
                <MenuItem value="Nhân viên y tế">Nhân viên y tế</MenuItem>
                <MenuItem value="Quản lý / Ban giám hiệu">
                  Quản lý / Ban giám hiệu
                </MenuItem>
                <MenuItem value="Khác">Khác</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="medium" fullWidth>
              <InputLabel>Trạng thái công tác</InputLabel>
              <Select
                name="status"
                value={userForm.status}
                label="Trạng thái công tác"
                onChange={handleChangeField}
              >
                <MenuItem value="active">Đang làm việc</MenuItem>
                <MenuItem value="maternity_leave">Nghỉ thai sản</MenuItem>
                <MenuItem value="on_leave">Nghỉ phép dài hạn</MenuItem>
                <MenuItem value="resigned">Đã thôi việc</MenuItem>
                <MenuItem value="inactive">Khóa tài khoản</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 4, pb: 4, gap: 2 }}>
          <Button
            onClick={onClose}
            variant="text"
            sx={{
              textTransform: 'uppercase',
              fontWeight: 700,
              color: '#64748b',
              px: 3,
            }}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              textTransform: 'uppercase',
              fontWeight: 700,
              px: 4,
              py: 1.2,
              borderRadius: 2,
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
              boxShadow:
                '0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1)',
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : editingUser ? (
              'LƯU THAY ĐỔI'
            ) : (
              'TẠO TÀI KHOẢN'
            )}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default AccountDialog;
