import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getMenuDetail,
  submitMenu,
  updateDailyMenu,
  getFoods,
  getNutritionPlanSetting,
} from "../../service/menu.api";
import { labelForRejectPreset } from "../../constants/menuRejectPresets";
import { toast } from "react-toastify";
import FoodSelectorModal from "../../components/FoodSelectorModal";
import { downloadMenuTemplate, exportMenuToExcel } from "../../utils/excelMenuTemplate";
import { parseMenuExcel, formatImportErrors } from "../../utils/excelMenuImporter";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
  List,
  ListItem,
  ListItemText,
  Alert,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Close as CloseIcon,
  LocalFireDepartment as CalorieIcon,
  Egg as ProteinIcon,
  Opacity as FatIcon,
  Grain as CarbIcon,
  Send as SendIcon,
  ErrorOutline as ErrorIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";

const days = ["mon", "tue", "wed", "thu", "fri"];

const dayMap = {
  mon: "Thứ Hai",
  tue: "Thứ Ba",
  wed: "Thứ Tư",
  thu: "Thứ Năm",
  fri: "Thứ Sáu",
};

const mealTypes = [
  { key: "lunchFoods", label: "Bữa trưa" },
  { key: "afternoonFoods", label: "Bữa chiều" },
];

const STATUS_CONFIG = {
  draft: { label: "Nháp", color: "default" },
  pending: { label: "Chờ duyệt", color: "warning" },
  approved: { label: "Đã duyệt", color: "success" },
  active: { label: "Đang áp dụng", color: "info" },
  completed: { label: "Hoàn thành", color: "secondary" },
  rejected: { label: "Từ chối", color: "error" },
};

const NUTRITION_INFO = [
  { key: "calories", label: "Kcal", unit: "kcal", color: "#f97316", icon: <CalorieIcon sx={{ fontSize: 20 }} /> },
  { key: "protein", label: "Chất đạm", unit: "g", color: "#6366f1", icon: <ProteinIcon sx={{ fontSize: 20 }} /> },
  { key: "fat", label: "Chất béo", unit: "g", color: "#eab308", icon: <FatIcon sx={{ fontSize: 20 }} /> },
  { key: "carb", label: "Tinh bột", unit: "g", color: "#22c55e", icon: <CarbIcon sx={{ fontSize: 20 }} /> },
];

const DEFAULT_NUTRITION_RANGES = {
  avgCalories: { min: 615, max: 726 },
  protein: { min: 13, max: 20 },
  fat: { min: 25, max: 35 },
  carb: { min: 52, max: 60 },
};

const getNutritionRangesFromPlan = (planItems = []) => {
  const ranges = {
    avgCalories: { ...DEFAULT_NUTRITION_RANGES.avgCalories },
    protein: { ...DEFAULT_NUTRITION_RANGES.protein },
    fat: { ...DEFAULT_NUTRITION_RANGES.fat },
    carb: { ...DEFAULT_NUTRITION_RANGES.carb },
  };

  planItems.forEach((item) => {
    const label = String(item?.name || "").toLowerCase();
    const min = Number(item?.min);
    const max = Number(item?.max);
    if (Number.isNaN(min) || Number.isNaN(max) || max <= min) return;

    if (/calo|kcal|năng lượng/.test(label)) {
      ranges.avgCalories = { min, max };
      return;
    }
    if (/đạm|protein/.test(label)) {
      ranges.protein = { min, max };
      return;
    }
    if (/béo|fat/.test(label)) {
      ranges.fat = { min, max };
      return;
    }
    if (/tinh bột|carb/.test(label)) {
      ranges.carb = { min, max };
    }
  });

  return ranges;
};

const evaluateNutrition = (nutrition = {}, ranges = DEFAULT_NUTRITION_RANGES) => {
  const avgCalories = Number(nutrition.avgCalories || 0);

  const protein = Number(nutrition.protein || 0);
  const fat = Number(nutrition.fat || 0);
  const carb = Number(nutrition.carb || 0);

  const pKcal = protein * 4;
  const fKcal = fat * 9;
  const cKcal = carb * 4;
  const totalMacroKcal = pKcal + fKcal + cKcal;

  const proteinPercent = totalMacroKcal > 0 ? Number(((pKcal / totalMacroKcal) * 100).toFixed(2)) : 0;
  const fatPercent = totalMacroKcal > 0 ? Number(((fKcal / totalMacroKcal) * 100).toFixed(2)) : 0;
  const carbPercent = totalMacroKcal > 0 ? Number(((cKcal / totalMacroKcal) * 100).toFixed(2)) : 0;

  const result = {
    calories: {
      value: avgCalories,
      pass: avgCalories >= ranges.avgCalories.min && avgCalories <= ranges.avgCalories.max,
      range: `${ranges.avgCalories.min} - ${ranges.avgCalories.max}`,
    },
    protein: {
      value: proteinPercent,
      pass: proteinPercent >= ranges.protein.min && proteinPercent <= ranges.protein.max,
      range: `${ranges.protein.min}% - ${ranges.protein.max}%`,
    },
    fat: {
      value: fatPercent,
      pass: fatPercent >= ranges.fat.min && fatPercent <= ranges.fat.max,
      range: `${ranges.fat.min}% - ${ranges.fat.max}%`,
    },
    carb: {
      value: carbPercent,
      pass: carbPercent >= ranges.carb.min && carbPercent <= ranges.carb.max,
      range: `${ranges.carb.min}% - ${ranges.carb.max}%`,
    },
  };

  result.overallPass = result.calories.pass && result.protein.pass && result.fat.pass && result.carb.pass;

  return result;
};

const evaluateDailyNutrition = (dayMenu, ranges = DEFAULT_NUTRITION_RANGES) => {
  const calories = Number(dayMenu?.totalCalories || 0);
  const protein = Number(dayMenu?.totalProtein || 0);
  const fat = Number(dayMenu?.totalFat || 0);
  const carb = Number(dayMenu?.totalCarb || 0);

  const pKcal = protein * 4;
  const fKcal = fat * 9;
  const cKcal = carb * 4;
  const totalMacroKcal = pKcal + fKcal + cKcal;

  const proteinPercent = totalMacroKcal > 0 ? Number(((pKcal / totalMacroKcal) * 100).toFixed(1)) : 0;
  const fatPercent = totalMacroKcal > 0 ? Number(((fKcal / totalMacroKcal) * 100).toFixed(1)) : 0;
  const carbPercent = totalMacroKcal > 0 ? Number(((cKcal / totalMacroKcal) * 100).toFixed(1)) : 0;

  const reasons = [];
  if (calories < ranges.avgCalories.min || calories > ranges.avgCalories.max) {
    reasons.push(`Calo: ${calories.toFixed(1)} (mục tiêu ${ranges.avgCalories.min}-${ranges.avgCalories.max})`);
  }
  if (proteinPercent < ranges.protein.min || proteinPercent > ranges.protein.max) {
    reasons.push(`Đạm: ${proteinPercent}% (mục tiêu ${ranges.protein.min}-${ranges.protein.max}%)`);
  }
  if (fatPercent < ranges.fat.min || fatPercent > ranges.fat.max) {
    reasons.push(`Béo: ${fatPercent}% (mục tiêu ${ranges.fat.min}-${ranges.fat.max}%)`);
  }
  if (carbPercent < ranges.carb.min || carbPercent > ranges.carb.max) {
    reasons.push(`Tinh bột: ${carbPercent}% (mục tiêu ${ranges.carb.min}-${ranges.carb.max}%)`);
  }

  return {
    calories,
    proteinPercent,
    fatPercent,
    carbPercent,
    pass: reasons.length === 0,
    reasons,
  };
};

// --- Sub-components ---

function NutritionCard({ item, value }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, flex: 1 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, textAlign: "center" }}>
        <Avatar sx={{ width: 38, height: 38, bgcolor: alpha(item.color, 0.12), mx: "auto", mb: 1 }}>
          <Box sx={{ color: item.color, display: "flex" }}>{item.icon}</Box>
        </Avatar>
        <Typography variant="h6" fontWeight={800} lineHeight={1.1}>{value ?? "—"}</Typography>
        <Typography variant="caption" color="text.secondary" display="block">{item.unit}/ngày</Typography>
        <Typography variant="caption" color="text.disabled" fontWeight={600}>{item.label}</Typography>
      </CardContent>
    </Card>
  );
}

function FoodTag({ food, canDelete, onDelete }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, bgcolor: alpha("#4f46e5", 0.07), border: "1px solid", borderColor: alpha("#4f46e5", 0.15), borderRadius: 1.5, px: 1, py: 0.25, mb: 0.5, mr: 0.5 }}>
      <Typography variant="caption" fontWeight={600} color="primary.main" sx={{ fontSize: 11 }}>{food.name}</Typography>
      <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>{food.calories}kcal</Typography>
      {canDelete && (
        <IconButton size="small" onClick={onDelete} sx={{ width: 14, height: 14, ml: 0.25, color: "error.main", opacity: 0.7, "&:hover": { opacity: 1 }, p: 0 }}>
          <CloseIcon sx={{ fontSize: 11 }} />
        </IconButton>
      )}
    </Box>
  );
}

function WeekTable({ title, weekData, isEditable, onCellClick, onRemoveFood, nutritionRanges }) {
  return (
    <Box mb={4}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <Box sx={{ width: 4, height: 20, borderRadius: 2, background: "linear-gradient(180deg, #4f46e5, #7c3aed)" }} />
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
      </Stack>
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 560 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, width: 110, borderRight: "1px solid", borderColor: "divider", py: 1.5 }}>Bữa ăn</TableCell>
                {days.map((day) => (
                  <TableCell key={day} align="center" sx={{ fontWeight: 700, fontSize: 12, py: 1.5 }}>{dayMap[day]}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {mealTypes.map((meal) => (
                <TableRow key={meal.key}>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12, bgcolor: "grey.50", borderRight: "1px solid", borderColor: "divider", verticalAlign: "top", py: 1.5 }}>{meal.label}</TableCell>
                  {days.map((day) => {
                    const dayMenu = weekData?.[day];
                    const foods = dayMenu?.[meal.key] || [];
                    return (
                      <TableCell key={day} sx={{ verticalAlign: "top", p: 1.25, minWidth: 120, cursor: isEditable ? "pointer" : "default", "&:hover": isEditable ? { bgcolor: alpha("#4f46e5", 0.04) } : {}, transition: "background 0.15s" }}
                        onClick={() => isEditable && onCellClick(dayMenu._id, day, meal.key, foods)}>
                        <Box>
                          {foods.map((food) => (
                            <FoodTag key={food._id} food={food} canDelete={isEditable} onDelete={(e) => { e.stopPropagation(); onRemoveFood(dayMenu._id, meal.key, food._id, foods); }} />
                          ))}

                          {isEditable && (
                            <IconButton size="small" sx={{ mt: 0.5, width: 22, height: 22, bgcolor: alpha("#4f46e5", 0.08), color: "primary.main", border: "1px dashed", borderColor: alpha("#4f46e5", 0.3), borderRadius: 1 }}>
                              <AddIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, bgcolor: "grey.50", borderRight: "1px solid", borderColor: "divider", verticalAlign: "top", py: 1.5 }}>
                  Đánh giá ngày
                </TableCell>
                {days.map((day) => {
                  const dayMenu = weekData?.[day];
                  const evaluation = evaluateDailyNutrition(dayMenu, nutritionRanges);
                  const hasData = (dayMenu?.lunchFoods?.length || 0) > 0 || (dayMenu?.afternoonFoods?.length || 0) > 0;

                  return (
                    <TableCell key={day} sx={{ verticalAlign: "top", p: 1.25, minWidth: 120, bgcolor: alpha(evaluation.pass ? "#16a34a" : "#dc2626", 0.03) }}>
                      {!hasData ? (
                        <Typography variant="caption" color="text.disabled">
                          Chưa có dữ liệu
                        </Typography>
                      ) : (
                        <Box>
                          <Typography variant="caption" sx={{ display: "block", fontWeight: 700 }}>
                            {evaluation.calories.toFixed(1)} kcal
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            Đạm {evaluation.proteinPercent}% • Béo {evaluation.fatPercent}% • Tinh bột {evaluation.carbPercent}%
                          </Typography>
                          <Chip
                            size="small"
                            color={evaluation.pass ? "success" : "error"}
                            label={evaluation.pass ? "PASS" : "CẦN CHỈNH"}
                            sx={{ mt: 0.75, fontWeight: 700 }}
                          />
                          {!evaluation.pass && (
                            <Box sx={{ mt: 0.75 }}>
                              {evaluation.reasons.map((reason, idx) => (
                                <Typography key={idx} variant="caption" color="error.main" sx={{ display: "block", lineHeight: 1.35 }}>
                                  - {reason}
                                </Typography>
                              ))}
                            </Box>
                          )}
                        </Box>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}

// --- Main Component ---

function MenuDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [cellFoods, setCellFoods] = useState([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [importUpdates, setImportUpdates] = useState([]);
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [availableFoods, setAvailableFoods] = useState([]);
  const [nutritionRanges, setNutritionRanges] = useState(DEFAULT_NUTRITION_RANGES);

  // LOGIC: Cho phép sửa nếu ở trạng thái Nháp hoặc Bị từ chối
  const isEditable = menu && (menu.status === "draft" || menu.status === "rejected");

  const nutritionEvaluation = useMemo(() => {
    const plan = menu?.nutritionPlan;
    if (Array.isArray(plan) && plan.length > 0) {
      const planNutrition = {
        avgCalories: plan.find((row) => /năng lượng|calo/i.test(row.label))?.actual || menu?.nutrition?.avgCalories || 0,
        protein: plan.find((row) => /protein/i.test(row.label))?.actual || menu?.nutrition?.protein || 0,
        fat: plan.find((row) => /chất béo|fat/i.test(row.label))?.actual || menu?.nutrition?.fat || 0,
        carb: plan.find((row) => /tinh bột|carb/i.test(row.label))?.actual || menu?.nutrition?.carb || 0,
      };
      return evaluateNutrition(planNutrition);
    }
    return evaluateNutrition(menu?.nutrition, nutritionRanges);
  }, [menu, nutritionRanges]);

  useEffect(() => { 
    fetchMenuDetail();
    fetchAvailableFoods();
    fetchNutritionPlanSetting();
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "nutrition_plan_updated_at") {
        fetchNutritionPlanSetting();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchNutritionPlanSetting();
      }
    };

    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = window.setInterval(fetchNutritionPlanSetting, 15000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, []);

  const fetchMenuDetail = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await getMenuDetail(id);
      setMenu(res.data);
    } catch (error) {
      setFetchError(error.response?.data?.message || "Không thể tải chi tiết thực đơn");
      toast.error("Không thể tải chi tiết thực đơn");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableFoods = async () => {
    try {
      const res = await getFoods();
      setAvailableFoods(res.data || []);
    } catch {
      console.error("Không thể tải danh sách món ăn");
    }
  };

  const fetchNutritionPlanSetting = async () => {
    try {
      const res = await getNutritionPlanSetting();
      const rows = Array.isArray(res?.data) ? res.data : [];
      setNutritionRanges(getNutritionRangesFromPlan(rows));
    } catch {
      setNutritionRanges(DEFAULT_NUTRITION_RANGES);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      downloadMenuTemplate(menu.month, menu.year);
      toast.success("Tải biểu mẫu thành công");
    } catch (error) {
      toast.error("Lỗi khi tải biểu mẫu");
      console.error(error);
    }
  };

  const handleExportMenu = () => {
    try {
      exportMenuToExcel(menu);
      toast.success("Xuất thực đơn thành công");
    } catch (error) {
      toast.error("Lỗi khi xuất thực đơn");
      console.error(error);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportLoading(true);
      const { updates, errors } = await parseMenuExcel(file, menu, availableFoods);

      if (errors.length > 0) {
        setImportErrors(errors);
        setImportDialogOpen(true);
      } else if (updates.length === 0) {
        toast.error("Không có dữ liệu hợp lệ trong file");
      } else {
        setImportUpdates(updates);
        setImportErrors([]);
        setConfirmImportOpen(true);
      }
    } catch (error) {
      toast.error("Lỗi khi đọc file: " + error.message);
      console.error(error);
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmImport = async () => {
    try {
      setImportLoading(true);
      
      for (const update of importUpdates) {
        await updateDailyMenu(update.dailyMenuId, {
          [update.mealType]: update.foodIds
        });
      }

      toast.success(`Cập nhật thành công ${importUpdates.length} bữa ăn`);
      setConfirmImportOpen(false);
      setImportUpdates([]);
      fetchMenuDetail();
    } catch (error) {
      toast.error("Lỗi khi cập nhật: " + error.message);
      console.error(error);
    } finally {
      setImportLoading(false);
    }
  };

  const handleOpenSubmitDialog = () => {
    setShowSubmitDialog(true);
  };

  const handleCellClick = (dailyMenuId, day, mealType, currentFoods) => {
    if (!isEditable) return;
    setCellFoods(currentFoods);
    setSelectedCell({ dailyMenuId, day, mealType });
    setShowFoodModal(true);
  };

  const handleSaveFoods = async (foods) => {
    try {
      const payload = { [selectedCell.mealType]: foods.map((f) => f._id || f) };
      await updateDailyMenu(selectedCell.dailyMenuId, payload);
      toast.success("Cập nhật thành công");
      setShowFoodModal(false);
      fetchMenuDetail();
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  const handleRemoveFood = async (dailyMenuId, mealType, foodId, currentFoods) => {
    if (!isEditable) return;
    try {
      const newFoods = currentFoods.filter((f) => f._id !== foodId).map((f) => f._id);
      await updateDailyMenu(dailyMenuId, { [mealType]: newFoods });
      toast.success("Đã xoá món");
      fetchMenuDetail();
    } catch {
      toast.error("Xoá món thất bại");
    }
  };

  const handleSubmitMenu = async () => {
    try {
      setSubmitting(true);
      await submitMenu(menu._id);
      toast.success("Đã gửi thực đơn thành công");
      setShowSubmitDialog(false);
      fetchMenuDetail();
    } catch (error) {
      toast.error(error.response?.data?.message || "Gửi duyệt thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Box p={3}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} /></Box>;
  if (fetchError) return <Box p={3}><Typography color="error">{fetchError}</Typography></Box>;
  if (!menu) return <Box p={3}><Typography>Không tìm thấy thực đơn. Vui lòng kiểm tra lại ID.</Typography></Box>;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} size="small" sx={{ textTransform: 'none' }}>Quay lại</Button>
        <Chip 
          label={STATUS_CONFIG[menu.status]?.label} 
          color={STATUS_CONFIG[menu.status]?.color} 
          size="small" 
          sx={{ fontWeight: 700 }} 
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Thực đơn Tháng {menu.month}/{menu.year}</Typography>
          {menu.status === "rejected" && (
            <Typography variant="body2" color="error.main" sx={{ mt: 0.5, fontWeight: 600 }}>
              Chỉnh sửa thực đơn bên dưới rồi bấm &quot;Gửi lại thực đơn&quot;.
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: "flex-start", sm: "flex-end" }}>
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<DownloadIcon />} 
            onClick={handleDownloadTemplate}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Tải mẫu
          </Button>
          {menu && (menu.status === "draft" || menu.status === "rejected") && (
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<UploadIcon />} 
              onClick={handleImportClick}
              disabled={importLoading}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              {importLoading ? "Đang nhập..." : "Nhập Excel"}
            </Button>
          )}
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<DownloadIcon />} 
            onClick={handleExportMenu}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Xuất Excel
          </Button>
          {isEditable && (
            <Button 
              variant="contained" 
              color={menu.status === "rejected" ? "primary" : "success"} 
              startIcon={<SendIcon />} 
              onClick={handleOpenSubmitDialog} 
              sx={{ borderRadius: 2.5, px: 3, fontWeight: 700, textTransform: 'none' }}
            >
              {menu.status === "rejected" ? "Gửi lại thực đơn" : "Gửi duyệt"}
            </Button>
          )}
        </Stack>
      </Stack>

      <input 
        ref={fileInputRef} 
        type="file" 
        accept=".xlsx,.xls" 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
      />

      {menu.status === "rejected" && (menu.rejectPresets?.length > 0 || menu.rejectDetail || menu.rejectReason) && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={800} gutterBottom>
            Lý do từ chối (từ ban giám hiệu)
          </Typography>
          {Array.isArray(menu.rejectPresets) && menu.rejectPresets.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: menu.rejectDetail ? 1 : 0 }}>
              {menu.rejectPresets.map((pid) => (
                <Chip
                  key={pid}
                  size="small"
                  label={labelForRejectPreset(pid)}
                  color="error"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Stack>
          )}
          {menu.rejectDetail ? (
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontWeight: 500 }}>
              Chi tiết: {menu.rejectDetail}
            </Typography>
          ) : menu.rejectReason ? (
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {menu.rejectReason}
            </Typography>
          ) : null}
        </Alert>
      )}

      {menu?.nutrition && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: nutritionEvaluation.overallPass ? 'success.main' : 'warning.main', borderRadius: 3, mb: 4, p: 2, bgcolor: nutritionEvaluation.overallPass ? 'success.50' : 'warning.50' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: nutritionEvaluation.overallPass ? 'success.main' : 'warning.main' }}>
              Đánh giá dinh dưỡng
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={1} alignItems="center">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Calo trung bình/ngày: {nutritionEvaluation.calories.value?.toFixed(1) || 0} kcal
              </Typography>
                <Chip label={nutritionEvaluation.calories.pass ? 'ĐẠT' : 'CẦN CHỈNH'} color={nutritionEvaluation.calories.pass ? 'success' : 'warning'} size="small" />
                <Typography variant="caption" color="text.secondary">
                  (Tiêu chuẩn {nutritionEvaluation.calories.range} kcal)
                </Typography>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
                {['protein', 'fat', 'carb'].map((key) => (
                  <Box key={key} sx={{ flex: 1, p: 1, borderRadius: 2, border: '1px solid', borderColor: nutritionEvaluation[key].pass ? 'success.main' : 'warning.main' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: nutritionEvaluation[key].pass ? 'success.main' : 'warning.main' }}>
                      {key === 'carb' ? 'Tinh bột' : key === 'fat' ? 'Chất béo' : 'Chất đạm'}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                      {nutritionEvaluation[key].value.toFixed(1)}% / {nutritionEvaluation[key].range}
                    </Typography>
                    <Chip label={nutritionEvaluation[key].pass ? 'ĐẠT' : 'CẦN CHỈNH'} color={nutritionEvaluation[key].pass ? 'success' : 'warning'} size="small" sx={{ mt: 0.75 }} />
                  </Box>
                ))}
              </Stack>
              <Box mt={2}>
                {nutritionEvaluation.overallPass ? (
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                    Kết luận: Thực đơn đạt chuẩn dinh dưỡng.
                  </Typography>
                ) : (
                <Box>
                  <Typography variant="body2" color="warning.main" sx={{ fontWeight: 700, mb: 1 }}>
                    Kết luận: Thực đơn chưa đạt chuẩn
                  </Typography>
                  <List dense>
                    {!nutritionEvaluation.calories.pass && (
                      <ListItem>
                        <ListItemText primary={`Calo trung bình/ngày: ${nutritionEvaluation.calories.value?.toFixed(1) || 0} kcal (mục tiêu ${nutritionEvaluation.calories.range} kcal)`} />
                      </ListItem>
                    )}
                    {!nutritionEvaluation.protein.pass && (
                      <ListItem>
                        <ListItemText primary={`Chất đạm: ${nutritionEvaluation.protein.value.toFixed(1)}% (mục tiêu ${nutritionEvaluation.protein.range})`} />
                      </ListItem>
                    )}
                    {!nutritionEvaluation.fat.pass && (
                      <ListItem>
                        <ListItemText primary={`Chất béo: ${nutritionEvaluation.fat.value.toFixed(1)}% (mục tiêu ${nutritionEvaluation.fat.range})`} />
                      </ListItem>
                    )}
                    {!nutritionEvaluation.carb.pass && (
                      <ListItem>
                        <ListItemText primary={`Tinh bột: ${nutritionEvaluation.carb.value.toFixed(1)}% (mục tiêu ${nutritionEvaluation.carb.range})`} />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}
       

      <WeekTable
        title="Tuần lẻ"
        weekData={menu.weeks?.odd}
        isEditable={isEditable}
        onCellClick={handleCellClick}
        onRemoveFood={handleRemoveFood}
        nutritionRanges={nutritionRanges}
      />
      <WeekTable
        title="Tuần chẵn"
        weekData={menu.weeks?.even}
        isEditable={isEditable}
        onCellClick={handleCellClick}
        onRemoveFood={handleRemoveFood}
        nutritionRanges={nutritionRanges}
      />

      <FoodSelectorModal open={showFoodModal} selectedFoods={cellFoods} onClose={() => setShowFoodModal(false)} onSave={handleSaveFoods} />

      {/* DIALOG XÁC NHẬN GỬI */}
      <Dialog open={showSubmitDialog} onClose={() => !submitting && setShowSubmitDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận gửi duyệt</DialogTitle>
        <DialogContent>
          <DialogContentText variant="body2">
            Bạn có chắc muốn gửi thực đơn lên duyệt?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2.5, px: 3 }}>
          <Button onClick={() => setShowSubmitDialog(false)} disabled={submitting} sx={{ textTransform: 'none' }}>Hủy</Button>
          <Button variant="contained" color="success" onClick={handleSubmitMenu} disabled={submitting} sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 700 }}>
            {submitting ? "Đang gửi..." : "Xác nhận gửi"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG IMPORT ERRORS */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', fontWeight: 700 }}>
          <ErrorIcon color="error" /> Lỗi khi nhập dữ liệu
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Phát hiện một số vấn đề trong file:
          </Typography>
          <Box sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'grey.50', borderRadius: 2, p: 1.5, border: '1px solid #eee', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {formatImportErrors(importErrors)}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setImportDialogOpen(false)} variant="contained" color="inherit" fullWidth sx={{ borderRadius: 2, textTransform: 'none' }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG CONFIRM IMPORT */}
      <Dialog open={confirmImportOpen} onClose={() => !importLoading && setConfirmImportOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận nhập dữ liệu</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Sắp cập nhật {importUpdates.length} bữa ăn từ file Excel:
          </Typography>
          <Box sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'grey.50', borderRadius: 2, p: 1.5, border: '1px solid #eee' }}>
            <List dense>
              {importUpdates.map((update, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={update.displayName} 
                    primaryTypographyProps={{ variant: 'caption', fontWeight: 600, fontSize: '0.8rem' }}
                    secondary={`${update.foodIds.length} món ăn`}
                    secondaryTypographyProps={{ variant: 'caption', fontSize: '0.7rem' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions sx={{ pb: 2.5, px: 3 }}>
          <Button onClick={() => setConfirmImportOpen(false)} disabled={importLoading} sx={{ textTransform: 'none' }}>Hủy</Button>
          <Button variant="contained" color="primary" onClick={handleConfirmImport} disabled={importLoading} sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 700 }}>
            {importLoading ? "Đang cập nhật..." : "Xác nhận nhập"}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default MenuDetail;