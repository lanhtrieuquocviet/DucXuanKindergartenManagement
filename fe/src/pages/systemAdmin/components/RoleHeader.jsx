import { Box, Paper, Typography, Button } from '@mui/material';
import { 
  Security as SecurityIcon, 
  Add as AddIcon 
} from '@mui/icons-material';

const RoleHeader = ({ onAddClick }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        mb: 3, p: 3,
        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
        borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <SecurityIcon sx={{ color: 'white', fontSize: 36 }} />
        <Box>
          <Typography variant="h5" fontWeight={700} color="white">Quản lý vai trò</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
            Thêm, sửa, xóa các vai trò trong hệ thống
          </Typography>
        </Box>
      </Box>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAddClick}
        sx={{
          bgcolor: 'white', color: '#4f46e5', fontWeight: 700,
          '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }, boxShadow: 2,
        }}
      >
        Thêm vai trò
      </Button>
    </Paper>
  );
};

export default RoleHeader;
