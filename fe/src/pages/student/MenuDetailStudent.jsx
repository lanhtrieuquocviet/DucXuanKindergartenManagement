import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMenuDetail, getNutritionPlanSetting, headParentReviewMenu } from '../../service/menu.api';
import { useAuth } from '../../context/AuthContext';
import { MENU_REJECT_PRESETS, labelForRejectPreset } from '../../constants/menuRejectPresets';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, Stack, Avatar, Chip, IconButton,
  CircularProgress, Grid, Tabs, Tab, Divider, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, FormGroup, FormControlLabel, Checkbox, TextField,
} from '@mui/material';
import {
  ArrowBack, LocalFireDepartment, SetMeal, WaterDrop, Grain, RateReview as ReviewIcon, Cancel as CancelIcon,
} from '@mui/icons-material';
import {
  DEFAULT_NUTRITION_RANGES,
  evaluateNutrition,
  getNutritionRangesFromPlan,
} from '../../utils/menuNutritionEval';

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
  active:    { label: 'Đang áp dụng', color: 'info'    },
  completed: { label: 'Đã kết thúc',  color: 'default' },
};

function formatRounded(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Math.round(Number(value)).toLocaleString('vi-VN');
}

function formatOneDecimal(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function getAverageDailyCalories(menu) {
  const weeks = [menu?.weeks?.odd, menu?.weeks?.even];
  const totals = [];

  weeks.forEach((week) => {
    DAYS.forEach((day) => {
      const val = week?.[day]?.totalCalories;
      if (val != null && !Number.isNaN(Number(val))) totals.push(Number(val));
    });
  });

  if (!totals.length) return null;
  return totals.reduce((sum, n) => sum + n, 0) / totals.length;
}

function NutriCard({ icon, label, value, unit, color, bg, border, helperText }) {
  return (
    <Paper elevation={0} sx={{ p: 1.75, borderRadius: 3, border: '1px solid', borderColor: border, bgcolor: bg }}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Avatar sx={{ bgcolor: `${color}20`, color, width: 38, height: 38 }}>{icon}</Avatar>
        <Box>
          <Typography fontSize="0.7rem" color="text.secondary" fontWeight={600}>{label}</Typography>
          <Typography fontWeight={800} fontSize="0.95rem" color="#111827">
            {formatRounded(value)}<Typography component="span" fontSize="0.7rem" color="text.secondary" fontWeight={400} ml={0.4}>{unit}</Typography>
          </Typography>
          {helperText && (
            <Typography fontSize="0.66rem" color="text.secondary" mt={0.2}>
              {helperText}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

export default function MenuDetailStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [activeWeek, setActiveWeek] = useState(0); // 0=odd, 1=even
  const [nutritionRanges, setNutritionRanges] = useState(DEFAULT_NUTRITION_RANGES);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rejectDetail, setRejectDetail] = useState('');
  const [rejectPresetSel, setRejectPresetSel] = useState({});
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setLoadError('');
        const res = await getMenuDetail(id);
        setMenu(res.data);
      } catch (e) {
        setMenu(null);
        setLoadError(e?.message || 'Không thể tải chi tiết thực đơn');
        toast.error('Không thể tải chi tiết thực đơn');
      }
      finally { setLoading(false); }
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getNutritionPlanSetting();
        const rows = Array.isArray(res?.data) ? res.data : [];
        setNutritionRanges(getNutritionRangesFromPlan(rows));
      } catch {
        setNutritionRanges(DEFAULT_NUTRITION_RANGES);
      }
    })();
  }, []);

  const nutritionEvaluation = useMemo(() => {
    const plan = menu?.nutritionPlan;
    if (Array.isArray(plan) && plan.length > 0) {
      const planNutrition = {
        avgCalories:
          plan.find((row) => /năng lượng|calo|kcal/i.test(row.label))?.actual ||
          menu?.nutrition?.avgCalories ||
          0,
        protein:
          plan.find((row) => /đạm|protein|chất đạm/i.test(row.label))?.actual ||
          menu?.nutrition?.protein ||
          0,
        fat:
          plan.find((row) => /chất béo|béo|fat|lipid/i.test(row.label))?.actual ||
          menu?.nutrition?.fat ||
          0,
        carb:
          plan.find((row) => /tinh bột|carb|glucid/i.test(row.label))?.actual ||
          menu?.nutrition?.carb ||
          0,
      };
      return evaluateNutrition(planNutrition, nutritionRanges);
    }
    return evaluateNutrition(menu?.nutrition || {}, nutritionRanges);
  }, [menu, nutritionRanges]);

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
  if (!menu) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center', maxWidth: 420, width: '100%' }}>
          <Typography fontWeight={700} mb={0.75}>Không tải được thực đơn</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {loadError || 'Dữ liệu thực đơn không tồn tại hoặc bạn không có quyền xem.'}
          </Typography>
          <IconButton
            onClick={() => navigate(-1)}
            size="small"
            sx={{ color: 'white', bgcolor: PRIMARY, '&:hover': { bgcolor: PRIMARY_DARK } }}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
        </Paper>
      </Box>
    );
  }

  const weekData = activeWeek === 0 ? menu.weeks?.odd : menu.weeks?.even;
  const statusCfg = STATUS_MAP[menu.status] || { label: menu.status, color: 'default' };
  const avgDailyCalories = getAverageDailyCalories(menu);
  const userRoles = user?.roles?.map((r) => r?.roleName || r) || [];
  const isHeadParent = userRoles.includes('HeadParent');
  const canHeadParentReview = isHeadParent && menu?.status === 'approved';

  const handleHeadParentReview = async () => {
    const presets = MENU_REJECT_PRESETS.filter((p) => rejectPresetSel[p.id]).map((p) => p.id);
    const detail = String(rejectDetail || '').trim();

    // Không nhập gì => giữ luồng bình thường, chỉ đóng popup.
    if (!presets.length && !detail) {
      setReviewOpen(false);
      toast.info('Không có ý kiến, thực đơn giữ nguyên trạng thái hiện tại.');
      return;
    }

    if (!presets.length && detail.length < 5) {
      toast.error('Nhập chi tiết tối thiểu 5 ký tự hoặc chọn ít nhất một lý do gợi ý.');
      return;
    }

    try {
      setSubmittingReview(true);
      await headParentReviewMenu(id, { presets, detail });
      toast.success('Đã gửi review. Thực đơn được chuyển về bếp để chỉnh sửa và duyệt lại.');
      setReviewOpen(false);
      const res = await getMenuDetail(id);
      setMenu(res.data);
    } catch (e) {
      toast.error(e?.message || 'Gửi review thất bại.');
    } finally {
      setSubmittingReview(false);
    }
  };

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
        {canHeadParentReview && (
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'warning.main', borderRadius: 2.5, mb: 2.5, p: 1.5, bgcolor: 'warning.50' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }} justifyContent="space-between">
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="warning.dark">
                  Review thực đơn (Hội trưởng phụ huynh)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Nếu có ý kiến + lý do, thực đơn sẽ trả về bếp để chỉnh sửa và duyệt lại.
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="warning"
                startIcon={<ReviewIcon />}
                onClick={() => {
                  setRejectDetail('');
                  setRejectPresetSel({});
                  setReviewOpen(true);
                }}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Review
              </Button>
            </Stack>
          </Paper>
        )}

        {menu.headParentReview?.comment && (
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'info.main', borderRadius: 2.5, mb: 2.5, p: 1.5, bgcolor: 'info.50' }}>
            <Typography variant="caption" color="info.dark" fontWeight={700}>
              Ý kiến hội trưởng phụ huynh:
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {menu.headParentReview.comment}
            </Typography>
            {Array.isArray(menu.rejectPresets) && menu.rejectPresets.length > 0 && (
              <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                {(menu.rejectPresets || []).map((pid) => `• ${labelForRejectPreset(pid)}`).join(' ')}
              </Typography>
            )}
          </Paper>
        )}

        {/* Nutrition */}
        <Grid container spacing={1.5} mb={2.5}>
          <Grid item xs={6}>
            <NutriCard
              icon={<LocalFireDepartment fontSize="small"/>}
              label="Calories"
              value={menu.nutrition?.calories}
              unit="kcal"
              color="#ea580c"
              bg="#fff7ed"
              border="#fed7aa"
              helperText={avgDailyCalories != null ? `TB 1 ngày: ${formatOneDecimal(avgDailyCalories)} Kcal` : null}
            />
          </Grid>
          <Grid item xs={6}><NutriCard icon={<SetMeal fontSize="small"/>} label="Protein" value={menu.nutrition?.protein} unit="g" color="#2563eb" bg="#eff6ff" border="#bfdbfe"/></Grid>
          <Grid item xs={6}><NutriCard icon={<WaterDrop fontSize="small"/>} label="Chất béo" value={menu.nutrition?.fat} unit="g" color={PRIMARY} bg="#f0fdf4" border="#bbf7d0"/></Grid>
          <Grid item xs={6}><NutriCard icon={<Grain fontSize="small"/>} label="Tinh bột" value={menu.nutrition?.carb} unit="g" color="#d97706" bg="#fffbeb" border="#fde68a"/></Grid>
        </Grid>

        {/* Đánh giá dinh dưỡng giống màn quản trị */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: nutritionEvaluation.overallPass ? 'success.main' : 'error.main',
            borderRadius: 2.5,
            mb: 2.5,
            p: 1.5,
            bgcolor: nutritionEvaluation.overallPass ? 'success.50' : 'error.50',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, mb: 1, color: nutritionEvaluation.overallPass ? 'success.main' : 'error.main' }}
          >
            Đánh giá dinh dưỡng
          </Typography>

          <Stack direction="row" spacing={1} mb={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Calo trung bình/ngày: {nutritionEvaluation.calories.value?.toFixed(1) || 0} kcal
            </Typography>
            <Chip
              label={nutritionEvaluation.calories.pass ? 'Đạt' : 'Không đạt'}
              color={nutritionEvaluation.calories.pass ? 'success' : 'error'}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
            />
            <Typography variant="caption" color="text.secondary">
              (Tiêu chuẩn {nutritionEvaluation.calories.range} kcal)
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
            {['protein', 'fat', 'carb'].map((key) => (
              <Box
                key={key}
                sx={{
                  flex: 1,
                  p: 1,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: nutritionEvaluation[key].pass ? 'success.main' : 'error.main',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: nutritionEvaluation[key].pass ? 'success.main' : 'error.main' }}>
                  {key === 'carb' ? 'Tinh bột' : key === 'fat' ? 'Chất béo' : 'Chất đạm'}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>
                  {nutritionEvaluation[key].value.toFixed(1)}% / {nutritionEvaluation[key].range}
                </Typography>
                <Chip
                  label={nutritionEvaluation[key].pass ? 'Đạt' : 'Không đạt'}
                  color={nutritionEvaluation[key].pass ? 'success' : 'error'}
                  size="small"
                  sx={{ mt: 0.5, height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                />
              </Box>
            ))}
          </Stack>

          <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 700 }} color={nutritionEvaluation.overallPass ? 'success.main' : 'error.main'}>
            Kết luận: {nutritionEvaluation.overallPass ? 'Đạt' : 'Không đạt'}
          </Typography>
        </Paper>

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
                      label={`${formatRounded(dayMenu.totalCalories)} kcal`}
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
                                  <Typography fontSize="0.75rem" color="text.disabled" whiteSpace="nowrap">({formatRounded(food.calories)} kcal)</Typography>
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

      <Dialog open={reviewOpen} onClose={() => !submittingReview && setReviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Review thực đơn</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Chọn lý do và nhập ý kiến để trả thực đơn về bếp chỉnh sửa. Nếu không có ý kiến, bấm xác nhận khi để trống để giữ luồng bình thường.
          </Typography>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Lý do gợi ý
          </Typography>
          <FormGroup sx={{ mb: 2 }}>
            {MENU_REJECT_PRESETS.map((p) => (
              <FormControlLabel
                key={p.id}
                control={
                  <Checkbox
                    size="small"
                    checked={!!rejectPresetSel[p.id]}
                    onChange={() => setRejectPresetSel((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                  />
                }
                label={<Typography variant="body2">{p.label}</Typography>}
              />
            ))}
          </FormGroup>
          <TextField
            label="Ý kiến / Chi tiết"
            placeholder="Nhập lý do chi tiết..."
            multiline
            rows={4}
            fullWidth
            value={rejectDetail}
            onChange={(e) => setRejectDetail(e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText={`${rejectDetail.length}/500 ký tự`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewOpen(false)} disabled={submittingReview} sx={{ textTransform: 'none' }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={handleHeadParentReview}
            disabled={submittingReview}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {submittingReview ? 'Đang gửi...' : 'Xác nhận review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
