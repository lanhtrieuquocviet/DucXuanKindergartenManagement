import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMenus } from '../../service/menu.api';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, Stack, Avatar, Chip, IconButton, CircularProgress, Divider,
} from '@mui/material';
import {
  ArrowBack, CalendarMonth, PlayCircle, StopCircle, Help, ChevronRight, RestaurantMenu,
} from '@mui/icons-material';

const PRIMARY = '#059669';
const PRIMARY_DARK = '#047857';
const BG = '#f0fdf4';

const STATUS_CONFIG = {
  active:    { label: 'Đang áp dụng', color: 'info',    Icon: PlayCircle },
  completed: { label: 'Đã kết thúc',  color: 'default', Icon: StopCircle },
};

const STUDENT_VISIBLE_STATUSES = ['active', 'completed'];

export default function MenuStudent() {
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getMenus();
        const list = Array.isArray(res.data) ? res.data : [];
        setMenus(list.filter((m) => STUDENT_VISIBLE_STATUSES.includes(m.status)));
      } catch { toast.error('Không thể tải danh sách thực đơn'); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: BG }}>
      {/* AppBar */}
      <Box sx={{
        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
        px: 2, py: 2, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(5,150,105,0.3)',
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton onClick={() => navigate(-1)} size="small"
            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Box>
            <Typography color="white" fontWeight={700} fontSize="1rem">Thực đơn dinh dưỡng</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem' }}>Danh sách thực đơn hàng tháng</Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 2.5, pb: 4 }}>
        {loading ? (
          <Stack spacing={1.5}>
            {[1,2,3].map(i => (
              <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: '#e5e7eb' }} />
                  <Stack spacing={0.75} flex={1}>
                    <Box sx={{ width: '60%', height: 14, bgcolor: '#e5e7eb', borderRadius: 1 }} />
                    <Box sx={{ width: '35%', height: 10, bgcolor: '#f3f4f6', borderRadius: 1 }} />
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : menus.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" py={12} spacing={2}>
            <Avatar sx={{ bgcolor: '#f3f4f6', width: 64, height: 64 }}>
              <RestaurantMenu sx={{ fontSize: 32, color: '#9ca3af' }} />
            </Avatar>
            <Box textAlign="center">
              <Typography fontWeight={600} color="text.secondary">Chưa có thực đơn</Typography>
              <Typography fontSize="0.85rem" color="text.disabled" mt={0.5}>Hệ thống chưa có thực đơn nào được tạo.</Typography>
            </Box>
          </Stack>
        ) : (
          <Stack spacing={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            {menus.map((menu, idx) => {
              const cfg = STATUS_CONFIG[menu.status] || { label: menu.status, color: 'default', Icon: Help };
              const { Icon } = cfg;
              const isActive = menu.status === 'active';
              return (
                <Box key={menu._id}>
                  <Box
                    onClick={() => navigate(`/student/menus/${menu._id}`)}
                    sx={{
                      px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 1.5,
                      cursor: 'pointer', bgcolor: isActive ? '#f0fdf4' : 'white',
                      borderLeft: isActive ? `4px solid ${PRIMARY}` : '4px solid transparent',
                      transition: 'all 0.15s',
                      '&:hover': { bgcolor: isActive ? '#ecfdf5' : '#f9fafb' },
                      '&:active': { transform: 'scale(0.99)' },
                    }}
                  >
                    <Avatar sx={{
                      width: 48, height: 48, borderRadius: 2.5, flexShrink: 0,
                      background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
                    }}>
                      <CalendarMonth sx={{ color: 'white' }} />
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Typography fontWeight={700} fontSize="0.9rem" noWrap>
                        Thực đơn Tháng {menu.month}/{menu.year}
                      </Typography>
                      <Stack direction="row" spacing={0.75} alignItems="center" mt={0.5}>
                        <Icon sx={{ fontSize: 13, color: isActive ? PRIMARY : '#9ca3af' }} />
                        <Chip label={cfg.label} color={cfg.color} size="small"
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                      </Stack>
                    </Box>
                    <ChevronRight sx={{ color: '#d1d5db', flexShrink: 0 }} />
                  </Box>
                  {idx < menus.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
