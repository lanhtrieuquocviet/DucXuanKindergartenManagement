import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMenuDetail } from '../../service/menu.api';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, Stack, Avatar, Chip, IconButton,
  CircularProgress, Grid, Tabs, Tab, Divider,
} from '@mui/material';
import {
  ArrowBack, LocalFireDepartment, SetMeal, WaterDrop, Grain,
} from '@mui/icons-material';

const PRIMARY = '#059669';
const PRIMARY_DARK = '#047857';
const BG = '#f0fdf4';

const DAYS = ['mon','tue','wed','thu','fri'];
const DAY_MAP = { mon:'Thứ hai', tue:'Thứ ba', wed:'Thứ tư', thu:'Thứ năm', fri:'Thứ sáu' };
const MEAL_TYPES = [
  { key: 'lunchFoods',     label: 'Bữa trưa',   icon: '🍽️' },
  { key: 'afternoonFoods', label: 'Bữa chiều',  icon: '🥤' },
];

const STATUS_MAP = {
  approved:  { label: 'Đã duyệt',    color: 'success' },
  active:    { label: 'Đang áp dụng', color: 'info'   },
  completed: { label: 'Hoàn thành',  color: 'default' },
};

function NutriCard({ icon, label, value, unit, color, bg, border }) {
  return (
    <Paper elevation={0} sx={{ p: 1.75, borderRadius: 3, border: '1px solid', borderColor: border, bgcolor: bg }}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Avatar sx={{ bgcolor: `${color}20`, color, width: 38, height: 38 }}>{icon}</Avatar>
        <Box>
          <Typography fontSize="0.7rem" color="text.secondary" fontWeight={600}>{label}</Typography>
          <Typography fontWeight={800} fontSize="0.95rem" color="#111827">
            {value ?? '—'}<Typography component="span" fontSize="0.7rem" color="text.secondary" fontWeight={400} ml={0.4}>{unit}</Typography>
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function MenuDetailStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0); // 0=odd, 1=even

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getMenuDetail(id);
        setMenu(res.data);
      } catch { toast.error('Không thể tải chi tiết thực đơn'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress sx={{ color: PRIMARY }} />
          <Typography color="text.secondary" fontSize="0.875rem">Đang tải dữ liệu...</Typography>
        </Stack>
      </Box>
    );
  }
  if (!menu) return null;

  const weekData = activeWeek === 0 ? menu.weeks?.odd : menu.weeks?.even;
  const statusCfg = STATUS_MAP[menu.status] || { label: menu.status, color: 'default' };

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
          <Box flex={1} minWidth={0}>
            <Typography color="white" fontWeight={700} fontSize="1rem" noWrap>
              Thực đơn Tháng {menu.month}/{menu.year}
            </Typography>
          </Box>
          <Chip label={statusCfg.label} color={statusCfg.color} size="small" sx={{ fontWeight: 700, height: 24, fontSize: '0.72rem', flexShrink: 0 }} />
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 2.5, pb: 4 }}>
        {/* Nutrition */}
        <Grid container spacing={1.5} mb={2.5}>
          <Grid item xs={6}><NutriCard icon={<LocalFireDepartment fontSize="small"/>} label="Calories" value={menu.nutrition?.calories} unit="kcal" color="#ea580c" bg="#fff7ed" border="#fed7aa"/></Grid>
          <Grid item xs={6}><NutriCard icon={<SetMeal fontSize="small"/>} label="Protein" value={menu.nutrition?.protein} unit="g" color="#2563eb" bg="#eff6ff" border="#bfdbfe"/></Grid>
          <Grid item xs={6}><NutriCard icon={<WaterDrop fontSize="small"/>} label="Chất béo" value={menu.nutrition?.fat} unit="g" color={PRIMARY} bg="#f0fdf4" border="#bbf7d0"/></Grid>
          <Grid item xs={6}><NutriCard icon={<Grain fontSize="small"/>} label="Tinh bột" value={menu.nutrition?.carb} unit="g" color="#d97706" bg="#fffbeb" border="#fde68a"/></Grid>
        </Grid>

        {/* Week Tabs */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', mb: 2, overflow: 'hidden' }}>
          <Tabs value={activeWeek} onChange={(_, v) => setActiveWeek(v)}
            sx={{
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.875rem', flex: 1 },
              '& .Mui-selected': { color: PRIMARY },
              '& .MuiTabs-indicator': { bgcolor: PRIMARY, height: 3 },
            }}>
            <Tab label="Tuần lẻ" />
            <Tab label="Tuần chẵn" />
          </Tabs>
        </Paper>

        {/* Day Cards */}
        <Stack spacing={1.5}>
          {DAYS.map((day) => {
            const dayMenu = weekData?.[day];
            return (
              <Paper key={day} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between"
                  px={2} py={1.25} sx={{ borderLeft: `4px solid ${PRIMARY}`, bgcolor: '#f0fdf4' }}>
                  <Typography fontWeight={700} fontSize="0.9rem">{DAY_MAP[day]}</Typography>
                  {dayMenu?.totalCalories != null && (
                    <Chip
                      icon={<LocalFireDepartment sx={{ fontSize: '14px !important', color: '#ea580c !important' }} />}
                      label={`${dayMenu.totalCalories} kcal`}
                      size="small"
                      sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem', bgcolor: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}
                    />
                  )}
                </Stack>
                <Box>
                  {MEAL_TYPES.map((meal, idx) => {
                    const foods = dayMenu?.[meal.key] || [];
                    return (
                      <Box key={meal.key}>
                        <Box px={2} py={1.5}>
                          <Typography fontSize="0.72rem" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing="0.05em" mb={1}>
                            {meal.icon} {meal.label}
                          </Typography>
                          {foods.length === 0 ? (
                            <Typography fontSize="0.8rem" color="text.disabled" fontStyle="italic">Không có món</Typography>
                          ) : (
                            <Stack spacing={0.5}>
                              {foods.map((food, i) => (
                                <Stack key={i} direction="row" spacing={1} alignItems="baseline">
                                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: PRIMARY, flexShrink: 0, mt: 0.7 }} />
                                  <Typography fontSize="0.85rem" color="#374151">{food.name}</Typography>
                                  <Typography fontSize="0.75rem" color="text.disabled" whiteSpace="nowrap">({food.calories} kcal)</Typography>
                                </Stack>
                              ))}
                            </Stack>
                          )}
                        </Box>
                        {idx < MEAL_TYPES.length - 1 && <Divider />}
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
