import { useState, useEffect } from 'react';
import { 
  Box, Paper, Stack, Typography, Divider, Skeleton 
} from '@mui/material';
import { Restaurant as MenuIcon } from '@mui/icons-material';
import { get, ENDPOINTS } from '../../../service/api';

export default function TabThucDon() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    get(ENDPOINTS.TEACHER.CONTACT_BOOK_TODAY_MENU)
      .then(res => {
        setData(res.data || null);
        setMessage(res.message || '');
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const dateStr = today.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  if (loading) {
    return <Box><Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} /></Box>;
  }

  if (!data) {
    return (
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}>
        <MenuIcon sx={{ fontSize: 44, color: 'grey.300', mb: 1 }} />
        <Typography color="text.secondary" variant="body2">
          {message || 'Không có thực đơn cho hôm nay'}
        </Typography>
      </Paper>
    );
  }

  const hasMeals = data.lunchFoods?.length > 0 || data.afternoonFoods?.length > 0;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <MenuIcon sx={{ fontSize: 18, color: '#16a34a' }} />
        <Typography variant="subtitle2" fontWeight={700}>Thực đơn & Dinh dưỡng</Typography>
      </Stack>

      <Typography variant="body2" fontWeight={700} color="text.primary" mb={1.5}
        sx={{ textTransform: 'capitalize' }}>
        {dateStr}
      </Typography>

      {!hasMeals ? (
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">Chưa có món ăn trong thực đơn hôm nay</Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 2, bgcolor: '#fefce8', border: '1px solid #fde68a', p: 2.5 }}>
          <Stack spacing={1.5}>
            {data.lunchFoods?.length > 0 && (
              <Box>
                <Typography variant="caption" fontWeight={700} color="#92400e" sx={{ display: 'block', mb: 0.5 }}>
                  🍱 Bữa trưa
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.7 }}>
                  {data.lunchFoods.map(f => f.name).join(', ')}
                </Typography>
              </Box>
            )}
            {data.lunchFoods?.length > 0 && data.afternoonFoods?.length > 0 && (
              <Divider sx={{ borderStyle: 'dashed' }} />
            )}
            {data.afternoonFoods?.length > 0 && (
              <Box>
                <Typography variant="caption" fontWeight={700} color="#92400e" sx={{ display: 'block', mb: 0.5 }}>
                  🍎 Bữa chiều
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.7 }}>
                  {data.afternoonFoods.map(f => f.name).join(', ')}
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
