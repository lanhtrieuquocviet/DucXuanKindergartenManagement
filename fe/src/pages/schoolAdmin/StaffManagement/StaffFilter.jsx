import {
  Stack,
  TextField,
  InputAdornment,
  Button,
  Box,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const StaffFilter = ({
  search,
  setSearch,
  onAddStaff,
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
          Danh sách nhân viên
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {totalCount} nhân viên (School Admin, Y tế, Nhà bếp, Tổ trưởng...)
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          placeholder="Tìm theo tên, SĐT..."
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddStaff}
          sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, whiteSpace: 'nowrap' }}
        >
          Thêm nhân viên
        </Button>
      </Stack>
    </Stack>
  );
};

export default StaffFilter;
