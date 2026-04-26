import {
  Stack,
  TextField,
  InputAdornment,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const PersonnelFilter = ({
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  onAdd,
  totalCount,
  ROLE_OPTIONS,
}) => {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ md: 'center' }}
      spacing={2}
      mb={3}
    >
      <Box>
        <Typography variant="h5" fontWeight={800} color="primary">
          Đội ngũ nhân sự
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tổng cộng {totalCount} thành viên trong nhà trường
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Lọc theo vai trò</InputLabel>
          <Select
            value={roleFilter}
            label="Lọc theo vai trò"
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="">Tất cả vai trò</MenuItem>
            {ROLE_OPTIONS.map((role) => (
              <MenuItem key={role.value} value={role.value}>
                {role.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          placeholder="Tìm tên, email, SĐT..."
          value={search || ''}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="nope"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: '100%', sm: 240 } }}
        />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAdd}
          sx={{
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' },
            whiteSpace: 'nowrap',
            px: 3,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
          }}
        >
          Thêm nhân sự
        </Button>
      </Stack>
    </Stack>
  );
};

export default PersonnelFilter;
