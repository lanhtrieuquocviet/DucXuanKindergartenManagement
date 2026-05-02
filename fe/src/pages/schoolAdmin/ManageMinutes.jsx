import { Box, Paper } from '@mui/material';
import { MinutesTab } from './AssetManagement/MinutesTab';

export default function ManageMinutes() {
  return (
    <Box>
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: 3, backgroundColor: '#f9fafb' }}>
        <MinutesTab />
      </Paper>
    </Box>
  );
}
