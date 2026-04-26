import { Paper, Typography } from '@mui/material';

function AccountHeader() {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: { xs: 2, sm: 3 },
        p: { xs: 2, sm: 3 },
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        borderRadius: 2,
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        color="white"
        sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
      >
        Quản lý tài khoản
      </Typography>
      <Typography variant="body2" color="rgba(255,255,255,0.8)" mt={0.5}>
        Thêm, sửa, xóa tài khoản và gán vai trò trong hệ thống.
      </Typography>
    </Paper>
  );
}

export default AccountHeader;
