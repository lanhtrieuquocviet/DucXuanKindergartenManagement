import {
  Stack,
  TextField,
  InputAdornment,
  Button,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  Sync as SyncIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const TeacherFilter = ({
  search,
  setSearch,
  onMigrate,
  onAddTeacher,
  totalCount,
}) => {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ sm: 'center' }}
      spacing={2}
      mb={3}
    >
      <Box>
        <Typography variant="h5" fontWeight={700}>
          Danh sách giáo viên
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {totalCount} giáo viên
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          placeholder="Tìm theo tên, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 240 }}
        />
        <Tooltip title="Đồng bộ giáo viên từ tài khoản có role Teacher">
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={onMigrate}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Đồng bộ
          </Button>
        </Tooltip>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddTeacher}
          sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, whiteSpace: 'nowrap' }}
        >
          Thêm giáo viên
        </Button>
      </Stack>
    </Stack>
  );
};

export default TeacherFilter;
