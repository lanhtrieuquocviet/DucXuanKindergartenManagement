import {
  Button,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

function AccountToolbar({
  accountSearch,
  setAccountSearch,
  setPage,
  filteredCount,
  onAddAccount,
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      spacing={{ xs: 1.5, sm: 0 }}
      sx={{
        px: { xs: 2, sm: 3 },
        py: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
        <Typography variant="subtitle2" fontWeight={600}>
          Danh sách tài khoản
        </Typography>
        <Chip
          label={`${filteredCount} tài khoản`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Stack>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        <TextField
          size="small"
          placeholder="Tìm kiếm tài khoản..."
          value={accountSearch}
          onChange={(e) => {
            setAccountSearch(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 220 }}
        />
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={onAddAccount}
          sx={{
            borderRadius: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          Thêm tài khoản
        </Button>
      </Stack>
    </Stack>
  );
}

export default AccountToolbar;
