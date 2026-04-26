import { Paper, Stack, Typography, Chip, Box, Grid, Skeleton } from '@mui/material';
import { 
  MonitorHeart as HealthIcon, 
  HealthAndSafety as SafetyIcon, 
  StickyNote2 as NoteIcon 
} from '@mui/icons-material';
import InfoRow from './InfoRow';
import { fmtDate, calcBMI, bmiLabel, STATUS_HEALTH } from './ContactBookUtils';

export default function TabSucKhoe({ health, loading }) {
  if (loading) return <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} />;
  if (!health) return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}>
      <SafetyIcon sx={{ fontSize: 44, color: 'grey.300', mb: 1 }} />
      <Typography color="text.secondary">Chưa có dữ liệu sức khỏe.</Typography>
    </Paper>
  );
  const bmi = calcBMI(health.height, health.weight);
  const bmiCfg = bmiLabel(bmi);
  const statusCfg = STATUS_HEALTH[health.generalStatus];
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
        <HealthIcon sx={{ fontSize: 18, color: '#0891b2' }} />
        <Typography variant="subtitle2" fontWeight={700}>Hồ sơ sức khỏe</Typography>
        <Chip label={fmtDate(health.checkDate)} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
        {statusCfg && <Chip label={statusCfg.label} size="small" color={statusCfg.color} sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />}
      </Stack>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" mb={2}>
        {health.height && (
          <Box sx={{ bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 2, px: 2, py: 1, textAlign: 'center', minWidth: 80 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>Chiều cao</Typography>
            <Typography variant="body1" fontWeight={800} color="#0891b2">{health.height}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>cm</Typography>
          </Box>
        )}
        {health.weight && (
          <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2, px: 2, py: 1, textAlign: 'center', minWidth: 80 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>Cân nặng</Typography>
            <Typography variant="body1" fontWeight={800} color="#16a34a">{health.weight}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>kg</Typography>
          </Box>
        )}
        {bmi && (
          <Box sx={{ bgcolor: '#fefce8', border: '1px solid #fde68a', borderRadius: 2, px: 2, py: 1, textAlign: 'center', minWidth: 80 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>BMI</Typography>
            <Typography variant="body1" fontWeight={800} color="#d97706">{bmi}</Typography>
            {bmiCfg && <Chip label={bmiCfg.label} size="small" color={bmiCfg.color} variant="outlined" sx={{ height: 16, fontSize: '0.62rem', mt: 0.25, '& .MuiChip-label': { px: 0.75 } }} />}
          </Box>
        )}
        {health.temperature && (
          <Box sx={{ bgcolor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 2, px: 2, py: 1, textAlign: 'center', minWidth: 80 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>Thân nhiệt</Typography>
            <Typography variant="body1" fontWeight={800} color="#e11d48">{health.temperature}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>°C</Typography>
          </Box>
        )}
      </Stack>
      <Grid container spacing={2}>
        {health.chronicDiseases?.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Tiền sử bệnh</Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {health.chronicDiseases.map((d, i) => <Chip key={i} label={d} size="small" color="error" variant="outlined" />)}
            </Stack>
          </Grid>
        )}
        {health.allergies?.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Dị ứng</Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {health.allergies.map((a, i) => <Chip key={i} label={a.allergen || a} size="small" color="warning" variant="outlined" />)}
            </Stack>
          </Grid>
        )}
        {health.notes && (
          <Grid item xs={12}><InfoRow label="Ghi chú" value={health.notes} icon={<NoteIcon sx={{ fontSize: 14 }} />} /></Grid>
        )}
      </Grid>
    </Paper>
  );
}
