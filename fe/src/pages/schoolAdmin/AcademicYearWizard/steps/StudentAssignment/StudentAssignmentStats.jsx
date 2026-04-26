import {
  Chip,
  Stack
} from '@mui/material';
import {
  WarningAmber as WarningIcon
} from '@mui/icons-material';

export default function StudentAssignmentStats({ assignedCount, totalCount, importedCount }) {
  return (
    <Stack direction="row" spacing={2} flexWrap="wrap">
      <Chip
        label={`${assignedCount}/${totalCount} học sinh đã xếp lớp`}
        color={assignedCount === totalCount && totalCount > 0 ? 'success' : 'warning'}
        sx={{ fontWeight: 700 }}
      />
      {totalCount - assignedCount > 0 && (
        <Chip
          icon={<WarningIcon />}
          label={`${totalCount - assignedCount} học sinh chưa xếp lớp`}
          color="warning" variant="outlined"
        />
      )}
      {(importedCount || 0) > 0 && (
        <Chip
          label={`Đã import ${importedCount} học sinh mới`}
          color="info" variant="outlined" size="small"
        />
      )}
    </Stack>
  );
}
