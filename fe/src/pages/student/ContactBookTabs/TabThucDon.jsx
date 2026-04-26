import { useEffect, useState } from 'react';
import { Box, Stack, Typography, Paper, Divider, Skeleton } from '@mui/material';
import { 
  Restaurant as MenuIcon 
} from '@mui/icons-material';
import { get, ENDPOINTS } from '../../../service/api';

export default function TabThucDon() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    get(ENDPOINTS.STUDENTS.CONTACT_BOOK_TODAY_MENU)
      .then(res => { setData(res.data || null); setMessage(res.message || ''); })
      .catch((err) => {
        setData(null);
        setMessage(err?.message || 'Không tải được thực đơn hôm nay');
      })
      .finally(() => setLoading(false));
  }, []);

  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const dateStr = today.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  if (loading) return <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />;
  if (!data) return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}>
      <MenuIcon sx={{ fontSize: 44, color: 'grey.300', mb: 1 }} />
      <Typography color="text.secondary" variant="body2">{message || 'Không có thực đơn cho hôm nay'}</Typography>
    </Paper>
  );
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <MenuIcon sx={{ fontSize: 18, color: '#16a34a' }} />
        <Typography variant="subtitle2" fontWeight={700}>Thực đơn & Dinh dưỡng</Typography>
      </Stack>
      <Typography variant="body2" fontWeight={700} mb={1.5} sx={{ textTransform: 'capitalize' }}>{dateStr}</Typography>
      {(data.lunchFoods?.length > 0 || data.afternoonFoods?.length > 0) && (
        <Paper elevation={0} sx={{ borderRadius: 2, bgcolor: '#fefce8', border: '1px solid #fde68a', p: 2.5, mb: 2 }}>
          <Stack spacing={1.5}>
            {data.lunchFoods?.length > 0 && (
              <Box>
                <Typography variant="caption" fontWeight={700} color="#92400e" sx={{ display: 'block', mb: 0.5 }}>🍱 Bữa trưa</Typography>
                <Typography variant="body2">{data.lunchFoods.map(f => f.name).join(', ')}</Typography>
              </Box>
            )}
            {data.lunchFoods?.length > 0 && data.afternoonFoods?.length > 0 && <Divider sx={{ borderStyle: 'dashed' }} />}
            {data.afternoonFoods?.length > 0 && (
              <Box>
                <Typography variant="caption" fontWeight={700} color="#92400e" sx={{ display: 'block', mb: 0.5 }}>🍎 Bữa chiều</Typography>
                <Typography variant="body2">{data.afternoonFoods.map(f => f.name).join(', ')}</Typography>
              </Box>
            )}
          </Stack>
        </Paper>
      )}
      {(data.totalCalories > 0 || data.totalProtein > 0) && (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {[{ label: 'Calories', val: data.totalCalories, unit: 'kcal', color: '#f97316' }, { label: 'Protein', val: data.totalProtein, unit: 'g', color: '#6366f1' }, { label: 'Chất béo', val: data.totalFat, unit: 'g', color: '#eab308' }, { label: 'Tinh bột', val: data.totalCarb, unit: 'g', color: '#22c55e' }]
            .filter(n => n.val > 0).map(n => (
              <Box key={n.label} sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5, px: 1.5, py: 0.75, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>{n.label}</Typography>
                <Typography variant="body2" fontWeight={700} color={n.color}>{Math.round(n.val)}{n.unit}</Typography>
              </Box>
            ))}
        </Stack>
      )}
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
        Tuần {data.weekType === 'odd' ? 'lẻ' : 'chẵn'} · Tuần {data.weekNum} của năm
      </Typography>
    </Box>
  );
}
