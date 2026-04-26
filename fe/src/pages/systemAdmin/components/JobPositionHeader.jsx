import { Box, Typography, Stack, Button } from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  Add as AddIcon 
} from '@mui/icons-material';

const JobPositionHeader = ({ onRefresh, onAddClick, loading }) => {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
      <Box>
        <Typography variant="h4" fontWeight={800} color="primary" gutterBottom>
          Cấu hình Chức vụ & Quyền
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Thiết lập danh mục chức danh và ánh xạ quyền truy cập hệ thống tương ứng
        </Typography>
      </Box>
      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          disabled={loading}
        >
          Làm mới
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddClick}
          sx={{ px: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
        >
          Thêm chức vụ
        </Button>
      </Stack>
    </Stack>
  );
};

export default JobPositionHeader;
