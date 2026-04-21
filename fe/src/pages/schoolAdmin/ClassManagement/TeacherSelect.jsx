import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Avatar,
  ListItemText,
  OutlinedInput,
} from '@mui/material';

export default function TeacherSelect({ availability, value, onChange, error, helperText, loading }) {
  const all       = availability || [];
  const available = all.filter(t => !t.inCurrentYear && !t.maxYearsReached && !value.includes(t._id));
  const selected  = all.filter(t => value.includes(t._id));
  const inYear    = all.filter(t => t.inCurrentYear  && !value.includes(t._id));
  const maxYears  = all.filter(t => t.maxYearsReached && !t.inCurrentYear && !value.includes(t._id));

  const menuItems = [];

  if (loading) {
    menuItems.push(<MenuItem key="__loading" disabled><em>Đang tải...</em></MenuItem>);
  } else if (all.length === 0) {
    menuItems.push(<MenuItem key="__empty" disabled><em>Không có giáo viên nào</em></MenuItem>);
  } else {
    // Selected
    selected.forEach(t => {
      menuItems.push(
        <MenuItem key={t._id} value={t._id}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pointerEvents: 'none' }}>
            <Checkbox checked size="small" onChange={() => {}} sx={{ p: 0.5 }} />
            <Avatar sx={{ width: 26, height: 26, mx: 1, bgcolor: '#dbeafe', color: '#2563eb', fontSize: '0.75rem', fontWeight: 700 }}>
              {t.fullName?.charAt(0)}
            </Avatar>
            <ListItemText
              primary={t.fullName}
              secondary={`${t.email}${t.yearsInClass > 0 ? ` · ${t.yearsInClass}/2 năm dạy lớp này` : ''}`}
            />
          </Box>
        </MenuItem>
      );
    });

    if (selected.length > 0 && available.length > 0) {
      menuItems.push(
        <MenuItem key="__div_available" disabled sx={{ fontSize: '0.72rem', color: 'text.disabled', py: 0.3, minHeight: 'unset', opacity: 1 }}>
          — Có thể chọn —
        </MenuItem>
      );
    }

    // Available
    available.forEach(t => {
      menuItems.push(
        <MenuItem key={t._id} value={t._id}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pointerEvents: 'none' }}>
            <Checkbox checked={false} size="small" onChange={() => {}} sx={{ p: 0.5 }} />
            <Avatar sx={{ width: 26, height: 26, mx: 1, bgcolor: '#dbeafe', color: '#2563eb', fontSize: '0.75rem', fontWeight: 700 }}>
              {t.fullName?.charAt(0)}
            </Avatar>
            <ListItemText
              primary={t.fullName}
              secondary={`${t.email}${t.yearsInClass > 0 ? ` · ${t.yearsInClass}/2 năm dạy lớp này` : ''}`}
            />
          </Box>
        </MenuItem>
      );
    });

    // Already has a class this year
    if (inYear.length > 0) {
      menuItems.push(
        <MenuItem key="__div_inyear" disabled sx={{ fontSize: '0.72rem', color: 'text.disabled', py: 0.3, minHeight: 'unset', opacity: 1 }}>
          — Đã phụ trách lớp khác năm nay —
        </MenuItem>
      );
      inYear.forEach(t => {
        menuItems.push(
          <MenuItem key={t._id} value={t._id} disabled sx={{ opacity: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Avatar sx={{ width: 26, height: 26, mx: 1, bgcolor: '#f3f4f6', color: '#9ca3af', fontSize: '0.75rem', fontWeight: 700 }}>
                {t.fullName?.charAt(0)}
              </Avatar>
              <ListItemText primary={t.fullName} secondary={`Đang dạy lớp: ${t.inCurrentYear}`} />
            </Box>
          </MenuItem>
        );
      });
    }

    // Max years reached
    if (maxYears.length > 0) {
      menuItems.push(
        <MenuItem key="__div_maxyears" disabled sx={{ fontSize: '0.72rem', color: 'text.disabled', py: 0.3, minHeight: 'unset', opacity: 1 }}>
          — Đã dạy lớp này đủ 2 năm —
        </MenuItem>
      );
      maxYears.forEach(t => {
        menuItems.push(
          <MenuItem key={t._id} value={t._id} disabled sx={{ opacity: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Avatar sx={{ width: 26, height: 26, mx: 1, bgcolor: '#f3f4f6', color: '#9ca3af', fontSize: '0.75rem', fontWeight: 700 }}>
                {t.fullName?.charAt(0)}
              </Avatar>
              <ListItemText primary={t.fullName} secondary="Đã phụ trách lớp này 2 năm (tối đa)" />
            </Box>
          </MenuItem>
        );
      });
    }
  }

  return (
    <FormControl fullWidth size="small" error={!!error} required>
      <InputLabel>Giáo viên phụ trách (chọn 2)</InputLabel>
      <Select
        multiple
        label="Giáo viên phụ trách (chọn 2)"
        value={value}
        onChange={(e) => { if (e.target.value.length <= 2) onChange(e.target.value); }}
        input={<OutlinedInput label="Giáo viên phụ trách (chọn 2)" />}
        renderValue={(sel) => all.filter(t => sel.includes(t._id)).map(t => t.fullName).join(', ')}
      >
        {menuItems}
      </Select>
      {error && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>{error}</Typography>}
      {helperText && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>{helperText}</Typography>}
    </FormControl>
  );
}
