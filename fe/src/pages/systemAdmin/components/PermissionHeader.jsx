import { Shield as ShieldIcon } from '@mui/icons-material';
import { Box, Paper, Stack, Typography } from '@mui/material';

function PermissionHeader({ totalPermissions, groupCount }) {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        p: 3,
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        color: 'white',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <ShieldIcon sx={{ fontSize: 32, color: '#818cf8' }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">
            Quản lý phân quyền
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
            Kiểm soát chi tiết các hành động được phép cho từng vai trò người dùng.
          </Typography>
        </Box>
      </Box>
      <Stack direction="row" spacing={2}>
        <Box sx={{ textAlign: 'right' }}>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              fontWeight: 700,
              fontSize: 10,
            }}
          >
            Tổng số quyền
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {totalPermissions}
          </Typography>
        </Box>
        <Box sx={{ width: '1px', bgcolor: 'rgba(255,255,255,0.1)' }} />
        <Box sx={{ textAlign: 'right' }}>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              fontWeight: 700,
              fontSize: 10,
            }}
          >
            Nhóm chức năng
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {groupCount}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default PermissionHeader;
