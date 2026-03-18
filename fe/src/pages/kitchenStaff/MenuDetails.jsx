import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMenuDetail, submitMenu, updateDailyMenu } from "../../service/menu.api";
import { toast } from "react-toastify";
import FoodSelectorModal from "../../components/FoodSelectorModal";
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
  ListItemIcon,
  ListItemText,
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
  Warning as WarningIcon,
  ErrorOutline as ErrorIcon,
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
  { key: "calories", label: "Calories", unit: "kcal", color: "#f97316", icon: <CalorieIcon sx={{ fontSize: 20 }} /> },
  { key: "protein", label: "Protein", unit: "g", color: "#6366f1", icon: <ProteinIcon sx={{ fontSize: 20 }} /> },
  { key: "fat", label: "Chất béo", unit: "g", color: "#eab308", icon: <FatIcon sx={{ fontSize: 20 }} /> },
  { key: "carb", label: "Tinh bột", unit: "g", color: "#22c55e", icon: <CarbIcon sx={{ fontSize: 20 }} /> },
];

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

function WeekTable({ title, weekData, isEditable, onCellClick, onRemoveFood }) {
  return (
    <Box mb={4}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <Box sx={{ width: 4, height: 20, borderRadius: 2, background: "linear-gradient(180deg, #4f46e5, #7c3aed)" }} />
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
      </Stack>
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
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
                          {foods.length > 0 && (
                            <Stack direction="row" spacing={1.5} mt={0.75} flexWrap="wrap">
                              <Typography variant="caption" sx={{ color: "#f97316", fontWeight: 600, fontSize: 10, display: "flex", alignItems: "center", gap: 0.25 }}>🔥 {dayMenu.totalCalories} kcal</Typography>
                              <Typography variant="caption" sx={{ color: "#6366f1", fontWeight: 600, fontSize: 10, display: "flex", alignItems: "center", gap: 0.25 }}>🥩 {dayMenu.totalProtein} g</Typography>
                            </Stack>
                          )}
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
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [cellFoods, setCellFoods] = useState([]);
  const [incompleteItems, setIncompleteItems] = useState([]);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // LOGIC: Cho phép sửa nếu ở trạng thái Nháp hoặc Bị từ chối
  const isEditable = menu && (menu.status === "draft" || menu.status === "rejected");

  useEffect(() => { fetchMenuDetail(); }, []);

  const fetchMenuDetail = async () => {
    try {
      setLoading(true);
      const res = await getMenuDetail(id);
      setMenu(res.data);
    } catch {
      toast.error("Không thể tải chi tiết thực đơn");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmitDialog = () => {
    const missing = [];
    const checkWeek = (weekData, weekLabel) => {
      if (!weekData) return;
      days.forEach(dayKey => {
        const dayData = weekData[dayKey];
        if (!dayData?.lunchFoods || dayData.lunchFoods.length === 0) {
          missing.push(`${dayMap[dayKey]} (${weekLabel}) - Bữa trưa`);
        }
        if (!dayData?.afternoonFoods || dayData.afternoonFoods.length === 0) {
          missing.push(`${dayMap[dayKey]} (${weekLabel}) - Bữa chiều`);
        }
      });
    };

    checkWeek(menu.weeks?.odd, "Tuần lẻ");
    checkWeek(menu.weeks?.even, "Tuần chẵn");

    if (missing.length > 0) {
      setIncompleteItems(missing);
      setShowErrorDialog(true);
      return;
    }
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
  if (!menu) return null;

  return (
    <Box p={3}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} size="small" sx={{ textTransform: 'none' }}>Quay lại</Button>
        <Chip 
          label={STATUS_CONFIG[menu.status]?.label} 
          color={STATUS_CONFIG[menu.status]?.color} 
          size="small" 
          sx={{ fontWeight: 700 }} 
        />
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Thực đơn Tháng {menu.month}/{menu.year}</Typography>
          {menu.status === "rejected" && (
            <Typography variant="body2" color="error.main" sx={{ mt: 0.5, fontWeight: 600 }}>
              * Thực đơn bị từ chối. Vui lòng kiểm tra, sửa đổi và gửi lại.
            </Typography>
          )}
        </Box>
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

      <Stack direction="row" spacing={2} mb={4}>
        {NUTRITION_INFO.map((item) => <NutritionCard key={item.key} item={item} value={menu.nutrition?.[item.key]} />)}
      </Stack>

      <WeekTable title="Tuần lẻ" weekData={menu.weeks?.odd} isEditable={isEditable} onCellClick={handleCellClick} onRemoveFood={handleRemoveFood} />
      <WeekTable title="Tuần chẵn" weekData={menu.weeks?.even} isEditable={isEditable} onCellClick={handleCellClick} onRemoveFood={handleRemoveFood} />

      <FoodSelectorModal open={showFoodModal} selectedFoods={cellFoods} onClose={() => setShowFoodModal(false)} onSave={handleSaveFoods} />

      {/* DIALOG LỖI: CHƯA ĐIỀN ĐỦ */}
      <Dialog open={showErrorDialog} onClose={() => setShowErrorDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', fontWeight: 700 }}>
          <ErrorIcon color="error" /> Thiếu thông tin món ăn
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Để gửi duyệt, bạn phải điền đầy đủ món cho tất cả các bữa. Các vị trí sau đang trống:
          </Typography>
          <Box sx={{ maxHeight: 250, overflow: 'auto', bgcolor: 'grey.50', borderRadius: 2, p: 1, border: '1px solid #eee' }}>
            <List dense>
              {incompleteItems.map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon sx={{ minWidth: 30 }}><WarningIcon sx={{ fontSize: 16, color: 'orange' }} /></ListItemIcon>
                  <ListItemText primary={item} primaryTypographyProps={{ variant: 'caption', fontWeight: 600 }} />
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setShowErrorDialog(false)} variant="contained" color="inherit" fullWidth sx={{ borderRadius: 2, textTransform: 'none' }}>
            Tôi sẽ bổ sung ngay
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG XÁC NHẬN GỬI */}
      <Dialog open={showSubmitDialog} onClose={() => !submitting && setShowSubmitDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận gửi duyệt</DialogTitle>
        <DialogContent>
          <DialogContentText variant="body2">
            Hệ thống đã kiểm tra, thực đơn đã đầy đủ. Bạn chắc chắn muốn gửi chứ?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2.5, px: 3 }}>
          <Button onClick={() => setShowSubmitDialog(false)} disabled={submitting} sx={{ textTransform: 'none' }}>Hủy</Button>
          <Button variant="contained" color="success" onClick={handleSubmitMenu} disabled={submitting} sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 700 }}>
            {submitting ? "Đang gửi..." : "Xác nhận gửi"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MenuDetail;