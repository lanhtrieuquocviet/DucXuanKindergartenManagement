import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMealPhoto } from '../../service/mealManagement.api';
import {
  Box, Paper, Typography, Stack, Avatar, IconButton, CircularProgress, Chip, Dialog,
} from '@mui/material';
import {
  ArrowBack, ChevronLeft, ChevronRight, Close, NoMeals, AccessTime, Today,
} from '@mui/icons-material';

const PRIMARY = '#059669';
const PRIMARY_DARK = '#047857';
const BG = '#f0fdf4';

const MEAL_CONFIG = {
  sang:  { label: 'Bữa sáng',       emoji: '🌅', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  trua:  { label: 'Bữa chính trưa', emoji: '🍚', color: PRIMARY,   bg: '#ecfdf5', border: '#6ee7b7' },
  chieu: { label: 'Bữa phụ chiều',  emoji: '🍎', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
  xe:    { label: 'Bữa xế',         emoji: '🥛', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  khac:  { label: 'Khác',           emoji: '🍽️', color: '#6b7280', bg: '#f8fafc', border: '#e5e7eb' },
};

const DAY_SHORT = ['CN','T2','T3','T4','T5','T6','T7'];
const DAY_FULL  = ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'];

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function parseDate(s) { return new Date(s + 'T00:00:00'); }
function fmt(s) { const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; }

function getWeekDays(center) {
  const c = parseDate(center);
  return Array.from({length:7}, (_,i) => { const d = new Date(c); d.setDate(d.getDate()+i-3); return toDateStr(d); });
}

function ImageGrid({ images, onOpen }) {
  if (!images?.length) {
    return (
      <Stack alignItems="center" justifyContent="center" spacing={1} py={3}>
        <NoMeals sx={{ fontSize: 32, color: '#d1d5db' }} />
        <Typography fontSize="0.78rem" color="text.disabled">Chưa có hình ảnh</Typography>
      </Stack>
    );
  }
  if (images.length === 1) {
    return (
      <Box p={1.5}>
        <Box onClick={() => onOpen(0)} sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer', '&:active': { opacity: 0.85 } }}>
          <Box component="img" src={images[0]} alt="meal" sx={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
        </Box>
      </Box>
    );
  }
  if (images.length === 2) {
    return (
      <Box p={1.5} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        {images.map((img, i) => (
          <Box key={i} onClick={() => onOpen(i)} sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer', aspectRatio: '1', '&:active': { opacity: 0.85 } }}>
            <Box component="img" src={img} alt={`meal ${i+1}`} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </Box>
        ))}
      </Box>
    );
  }
  const [first, ...rest] = images;
  return (
    <Box p={1.5}>
      <Box onClick={() => onOpen(0)} sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer', mb: 1, '&:active': { opacity: 0.85 } }}>
        <Box component="img" src={first} alt="meal 1" sx={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(rest.length, 4)}, 1fr)`, gap: 1 }}>
        {rest.slice(0, 4).map((img, i) => (
          <Box key={i} onClick={() => onOpen(i+1)} sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer', aspectRatio: '1', position: 'relative', '&:active': { opacity: 0.85 } }}>
            <Box component="img" src={img} alt={`meal ${i+2}`} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {i === 3 && images.length > 5 && (
              <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                <Typography color="white" fontWeight={800} fontSize="1.1rem">+{images.length - 4}</Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function Lightbox({ images, index, onClose, onPrev, onNext, onJump }) {
  const touchStart = useRef(null);
  const handleTouchStart = e => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = e => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? onNext() : onPrev();
    touchStart.current = null;
  };

  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 2000, bgcolor: 'black', display: 'flex', flexDirection: 'column' }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" px={2} pt={4} pb={1.5}>
        <Typography color="rgba(255,255,255,0.6)" fontSize="0.85rem">{index+1} / {images.length}</Typography>
        <IconButton onClick={onClose} sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
          <Close />
        </IconButton>
      </Stack>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', px: 1 }}>
        {images.length > 1 && (
          <IconButton onClick={onPrev} sx={{ position: 'absolute', left: 8, bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <ChevronLeft />
          </IconButton>
        )}
        <Box component="img" src={images[index]} alt={`Ảnh ${index+1}`}
          sx={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 2, userSelect: 'none' }} draggable={false} />
        {images.length > 1 && (
          <IconButton onClick={onNext} sx={{ position: 'absolute', right: 8, bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <ChevronRight />
          </IconButton>
        )}
      </Box>
      {images.length > 1 && (
        <Stack direction="row" justifyContent="center" spacing={0.75} py={3}>
          {images.map((_, i) => (
            <Box key={i} onClick={() => onJump(i)} sx={{
              width: i === index ? 20 : 8, height: 8, borderRadius: 1,
              bgcolor: i === index ? 'white' : 'rgba(255,255,255,0.35)',
              cursor: 'pointer', transition: 'all 0.2s',
            }} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default function MealPhotosStudent() {
  const navigate = useNavigate();
  const today = toDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [mealData, setMealData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const weekDays = getWeekDays(selectedDate);
  const weekRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setMealData(null);
    getMealPhoto(selectedDate)
      .then(res => { if (!cancelled) setMealData(res.data || null); })
      .catch(() => { if (!cancelled) setMealData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedDate]);

  useEffect(() => {
    const el = weekRef.current?.querySelector('[data-selected="true"]');
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedDate]);

  const changeDate = (delta) => {
    const d = parseDate(selectedDate); d.setDate(d.getDate() + delta); setSelectedDate(toDateStr(d));
  };

  const meals = mealData?.meals || [];
  const isToday = selectedDate === today;
  const dayName = DAY_FULL[parseDate(selectedDate).getDay()];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: BG, display: 'flex', flexDirection: 'column' }}>
      {/* AppBar */}
      <Box sx={{
        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(5,150,105,0.3)',
      }}>
        {/* Title bar */}
        <Stack direction="row" alignItems="center" spacing={1.5} px={2} pt={2} pb={1}>
          <IconButton onClick={() => navigate('/student')} size="small"
            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Box flex={1}>
            <Typography color="white" fontWeight={700} fontSize="1rem">Hình ảnh bữa ăn</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem' }}>{dayName}, {fmt(selectedDate)}</Typography>
          </Box>
          {!isToday && (
            <Chip label="Hôm nay" onClick={() => setSelectedDate(today)} size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }} />
          )}
        </Stack>

        {/* Week strip */}
        <Box ref={weekRef} sx={{ display: 'flex', gap: 0.75, px: 1.5, pb: 1.5, overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
          {weekDays.map(dateStr => {
            const d = parseDate(dateStr);
            const isSelected = dateStr === selectedDate;
            const isTodayDay = dateStr === today;
            const isFuture = dateStr > today;
            return (
              <Box key={dateStr} data-selected={isSelected}
                onClick={() => !isFuture && setSelectedDate(dateStr)}
                sx={{
                  flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  borderRadius: 3, px: 1.5, py: 1, minWidth: 44, cursor: isFuture ? 'default' : 'pointer',
                  bgcolor: isSelected ? 'white' : 'rgba(255,255,255,0.15)',
                  opacity: isFuture ? 0.35 : 1,
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.15s',
                  boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                }}>
                <Typography fontSize="0.62rem" fontWeight={500} color={isSelected ? '#374151' : 'rgba(255,255,255,0.85)'}>
                  {DAY_SHORT[d.getDay()]}
                </Typography>
                <Typography fontSize="0.9rem" fontWeight={800} color={isSelected ? PRIMARY : 'white'}
                  sx={{ textDecoration: isTodayDay && !isSelected ? 'underline' : 'none' }}>
                  {d.getDate()}
                </Typography>
                {isTodayDay && <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: isSelected ? PRIMARY : 'white', mt: 0.25 }} />}
              </Box>
            );
          })}
          {/* Prev / Next week */}
          <Box onClick={() => changeDate(-7)} sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 40, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.15)', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
            <ChevronLeft sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Box onClick={() => selectedDate < today && changeDate(7)}
            sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 40, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.15)', cursor: 'pointer', opacity: selectedDate >= today ? 0.3 : 1,
              '&:hover': selectedDate < today ? { bgcolor: 'rgba(255,255,255,0.25)' } : {} }}>
            <ChevronRight sx={{ color: 'white', fontSize: 20 }} />
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, maxWidth: 600, mx: 'auto', width: '100%', px: 2, py: 2.5, pb: 4 }}>
        {loading ? (
          <Stack spacing={1.5}>
            {[1,2].map(k => (
              <Paper key={k} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <Box sx={{ height: 52, bgcolor: '#f3f4f6' }} />
                <Box p={1.5} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
                  {[1,2,3].map(i => <Box key={i} sx={{ aspectRatio: '1', borderRadius: 2, bgcolor: '#f3f4f6' }} />)}
                </Box>
              </Paper>
            ))}
          </Stack>
        ) : meals.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" py={12} spacing={2}>
            <Avatar sx={{ bgcolor: '#f0fdf4', width: 72, height: 72 }}>
              <Typography fontSize="2.5rem">🍽️</Typography>
            </Avatar>
            <Box textAlign="center">
              <Typography fontWeight={600} color="text.secondary">Chưa có hình ảnh bữa ăn</Typography>
              <Typography fontSize="0.82rem" color="text.disabled" mt={0.5}>
                {isToday ? 'Nhà trường chưa cập nhật ảnh hôm nay' : 'Không có dữ liệu cho ngày này'}
              </Typography>
            </Box>
            {!isToday && (
              <Chip label="Xem hôm nay" onClick={() => setSelectedDate(today)} icon={<Today fontSize="small" />}
                sx={{ bgcolor: PRIMARY, color: 'white', fontWeight: 700, cursor: 'pointer', '&:hover': { bgcolor: PRIMARY_DARK } }} />
            )}
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={0.75} alignItems="center" px={0.5}>
              <AccessTime sx={{ fontSize: 14, color: '#9ca3af' }} />
              <Typography fontSize="0.75rem" color="text.secondary">
                Cập nhật {meals.length} bữa ăn · {fmt(selectedDate)}
              </Typography>
            </Stack>

            {meals.map(meal => {
              const cfg = MEAL_CONFIG[meal.mealType] || MEAL_CONFIG.khac;
              return (
                <Paper key={meal.mealType} elevation={0} sx={{ borderRadius: 3, border: '1.5px solid', borderColor: cfg.border, overflow: 'hidden' }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} px={2} py={1.5} sx={{ bgcolor: cfg.bg }}>
                    <Typography fontSize="1.4rem">{cfg.emoji}</Typography>
                    <Box flex={1}>
                      <Typography fontWeight={700} fontSize="0.9rem" color={cfg.color}>{cfg.label}</Typography>
                      {meal.description && (
                        <Typography fontSize="0.75rem" color={cfg.color} sx={{ opacity: 0.75 }} noWrap>{meal.description}</Typography>
                      )}
                    </Box>
                    <Chip label={`${meal.images?.length || 0} ảnh`} size="small"
                      sx={{ fontWeight: 700, height: 22, fontSize: '0.68rem', bgcolor: cfg.border, color: cfg.color }} />
                  </Stack>
                  <ImageGrid images={meal.images} onOpen={idx => setLightbox({ images: meal.images, index: idx })} />
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox(lb => ({ ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length }))}
          onNext={() => setLightbox(lb => ({ ...lb, index: (lb.index + 1) % lb.images.length }))}
          onJump={i => setLightbox(lb => ({ ...lb, index: i }))}
        />
      )}
    </Box>
  );
}
