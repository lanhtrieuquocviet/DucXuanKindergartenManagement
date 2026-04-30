import {
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Chip,
} from '@mui/material';
import { Refresh as RefreshIcon, Add as AddIcon, EmojiEvents as TrophyIcon } from '@mui/icons-material';

const StudentFilter = ({
  searchTerm,
  setSearchTerm,
  yearFilter,
  setYearFilter,
  academicYears,
  classFilter,
  setClassFilter,
  genderFilter,
  setGenderFilter,
  headParentFilter,
  setHeadParentFilter,
  classes,
  onRefresh,
  onAddStudent,
  totalCount,
  loading,
  ctxLoading,
}) => {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
      <Typography variant="subtitle2" fontWeight={600}>
        Tổng: {totalCount} học sinh
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Tìm tên / mã / PH..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 150 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Năm học</InputLabel>
          <Select
            value={yearFilter}
            label="Năm học"
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            {academicYears.map((ay) => (
              <MenuItem key={ay._id} value={ay._id}>
                {ay.yearName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Lớp</InputLabel>
          <Select
            value={classFilter}
            label="Lớp"
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {classes.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.className || c._id}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Giới tính</InputLabel>
          <Select
            value={genderFilter}
            label="Giới tính"
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="male">Nam</MenuItem>
            <MenuItem value="female">Nữ</MenuItem>
          </Select>
        </FormControl>
        <Chip
          icon={<TrophyIcon sx={{ fontSize: '16px !important', color: headParentFilter ? '#d97706 !important' : undefined }} />}
          label="Hội trưởng"
          clickable
          onClick={() => setHeadParentFilter(headParentFilter ? '' : 'headparent')}
          variant={headParentFilter ? 'filled' : 'outlined'}
          sx={{
            fontWeight: 700,
            alignSelf: 'center',
            borderColor: headParentFilter ? '#d97706' : undefined,
            bgcolor: headParentFilter ? '#fffbeb' : undefined,
            color: headParentFilter ? '#d97706' : undefined,
            '&:hover': { bgcolor: '#fffbeb', borderColor: '#d97706' },
          }}
        />
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onRefresh} disabled={loading}>
          Tải lại
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAddStudent} disabled={ctxLoading}>
          Thêm học sinh
        </Button>
      </Stack>
    </Stack>
  );
};

export default StudentFilter;
