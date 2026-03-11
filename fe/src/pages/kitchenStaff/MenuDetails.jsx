import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMenuDetail, submitMenu, updateDailyMenu } from "../../service/menu.api";
import { toast } from "react-toastify";
import FoodSelectorModal from "../../components/FoodSelectorModal";
import {
  Alert,
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
  Tooltip,
  Typography,
  alpha,
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

function NutritionCard({ item, value }) {
  return (
    <Card
      elevation={0}
      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, flex: 1 }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, textAlign: "center" }}>
        <Avatar
          sx={{
            width: 38,
            height: 38,
            bgcolor: alpha(item.color, 0.12),
            mx: "auto",
            mb: 1,
          }}
        >
          <Box sx={{ color: item.color, display: "flex" }}>{item.icon}</Box>
        </Avatar>
        <Typography variant="h6" fontWeight={800} lineHeight={1.1}>
          {value ?? "—"}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {item.unit}/ngày
        </Typography>
        <Typography variant="caption" color="text.disabled" fontWeight={600}>
          {item.label}
        </Typography>
      </CardContent>
    </Card>
  );
}

function FoodTag({ food, canDelete, onDelete }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        bgcolor: alpha("#4f46e5", 0.07),
        border: "1px solid",
        borderColor: alpha("#4f46e5", 0.15),
        borderRadius: 1.5,
        px: 1,
        py: 0.25,
        mb: 0.5,
        mr: 0.5,
      }}
    >
      <Typography variant="caption" fontWeight={600} color="primary.main" sx={{ fontSize: 11 }}>
        {food.name}
      </Typography>
      <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
        {food.calories}kcal
      </Typography>
      {canDelete && (
        <IconButton
          size="small"
          onClick={onDelete}
          sx={{
            width: 14,
            height: 14,
            ml: 0.25,
            color: "error.main",
            opacity: 0.7,
            "&:hover": { opacity: 1 },
            p: 0,
          }}
        >
          <CloseIcon sx={{ fontSize: 11 }} />
        </IconButton>
      )}
    </Box>
  );
}

function WeekTable({ title, weekData, menu, onCellClick, onRemoveFood }) {
  return (
    <Box mb={4}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <Box
          sx={{
            width: 4,
            height: 20,
            borderRadius: 2,
            background: "linear-gradient(180deg, #4f46e5, #7c3aed)",
          }}
        />
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
      </Stack>

      <Card
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: 12,
                    width: 110,
                    borderRight: "1px solid",
                    borderColor: "divider",
                    py: 1.5,
                  }}
                >
                  Bữa ăn
                </TableCell>
                {days.map((day) => (
                  <TableCell
                    key={day}
                    align="center"
                    sx={{ fontWeight: 700, fontSize: 12, py: 1.5 }}
                  >
                    {dayMap[day]}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {mealTypes.map((meal) => (
                <TableRow key={meal.key}>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: 12,
                      bgcolor: "grey.50",
                      borderRight: "1px solid",
                      borderColor: "divider",
                      verticalAlign: "top",
                      py: 1.5,
                    }}
                  >
                    {meal.label}
                  </TableCell>
                  {days.map((day) => {
                    const dayMenu = weekData?.[day];
                    const foods = dayMenu?.[meal.key] || [];
                    const isDraft = menu.status === "draft";

                    return (
                      <TableCell
                        key={day}
                        sx={{
                          verticalAlign: "top",
                          p: 1.25,
                          minWidth: 120,
                          cursor: isDraft ? "pointer" : "default",
                          bgcolor: isDraft ? undefined : "transparent",
                          "&:hover": isDraft
                            ? { bgcolor: alpha("#4f46e5", 0.04) }
                            : {},
                          transition: "background 0.15s",
                        }}
                        onClick={() =>
                          isDraft && onCellClick(dayMenu._id, day, meal.key, foods)
                        }
                      >
                        <Box>
                          {foods.map((food) => (
                            <FoodTag
                              key={food._id}
                              food={food}
                              canDelete={isDraft}
                              onDelete={(e) => {
                                e.stopPropagation();
                                onRemoveFood(dayMenu._id, meal.key, food._id, foods);
                              }}
                            />
                          ))}

                          {foods.length > 0 && (
                            <Stack direction="row" spacing={1.5} mt={0.75} flexWrap="wrap">
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#f97316",
                                  fontWeight: 600,
                                  fontSize: 10,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.25,
                                }}
                              >
                                🔥 {dayMenu.totalCalories} kcal
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#6366f1",
                                  fontWeight: 600,
                                  fontSize: 10,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.25,
                                }}
                              >
                                🥩 {dayMenu.totalProtein} g
                              </Typography>
                            </Stack>
                          )}

                          {isDraft && (
                            <Tooltip title="Thêm món ăn" arrow>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCellClick(dayMenu._id, day, meal.key, foods);
                                }}
                                sx={{
                                  mt: 0.5,
                                  width: 22,
                                  height: 22,
                                  bgcolor: alpha("#4f46e5", 0.08),
                                  color: "primary.main",
                                  border: "1px dashed",
                                  borderColor: alpha("#4f46e5", 0.3),
                                  borderRadius: 1,
                                  "&:hover": { bgcolor: alpha("#4f46e5", 0.15) },
                                }}
                              >
                                <AddIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {foods.length === 0 && !isDraft && (
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
                              —
                            </Typography>
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

  useEffect(() => {
    fetchMenuDetail();
  }, []);

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

  const handleCellClick = (dailyMenuId, day, mealType, currentFoods) => {
    if (menu.status !== "draft") {
      toast.info("Chỉ chỉnh sửa khi menu ở trạng thái nháp");
      return;
    }
    setCellFoods(currentFoods);
    setSelectedCell({ dailyMenuId, day, mealType });
    setShowFoodModal(true);
  };

  const handleSaveFoods = async (foods) => {
    try {
      const payload = { [selectedCell.mealType]: foods.map((f) => f._id || f) };
      await updateDailyMenu(selectedCell.dailyMenuId, payload);
      toast.success("Cập nhật món thành công");
      setShowFoodModal(false);
      fetchMenuDetail();
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  const handleRemoveFood = async (dailyMenuId, mealType, foodId, currentFoods) => {
    try {
      const newFoods = currentFoods.filter((f) => f._id !== foodId).map((f) => f._id);
      await updateDailyMenu(dailyMenuId, {
        lunchFoods: [],
        afternoonFoods: [],
        [mealType]: newFoods,
      });
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
      toast.success("Đã gửi thực đơn để duyệt");
      setShowSubmitDialog(false);
      fetchMenuDetail();
    } catch (error) {
      toast.error(error.response?.data?.message || "Gửi duyệt thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={120} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!menu) return null;

  const statusCfg = STATUS_CONFIG[menu.status] || { label: menu.status, color: "default" };

  return (
    <Box>
      {/* Back + status */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
          size="small"
          sx={{
            textTransform: "none",
            color: "text.secondary",
            fontWeight: 600,
            borderRadius: 2,
            "&:hover": { bgcolor: "grey.100" },
          }}
        >
          Quay lại
        </Button>
        <Chip
          label={statusCfg.label}
          color={statusCfg.color}
          size="small"
          sx={{ fontWeight: 700 }}
        />
      </Stack>

      {/* Reject reason */}
      {menu.status === "rejected" && menu.rejectReason && (
        <Alert
          severity="error"
          icon={<WarningIcon />}
          sx={{ mb: 3, borderRadius: 3 }}
        >
          <Typography variant="body2" fontWeight={700} mb={0.25}>
            Lý do từ chối
          </Typography>
          <Typography variant="body2">{menu.rejectReason}</Typography>
        </Alert>
      )}

      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Thực đơn Tháng {menu.month}/{menu.year}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            Tạo bởi:{" "}
            <strong>{menu.createdBy?.fullName || "Không rõ"}</strong> &middot;{" "}
            {new Date(menu.createdAt).toLocaleDateString("vi-VN")}
          </Typography>
        </Box>

        {menu.status === "draft" && (
          <Button
            variant="contained"
            color="success"
            startIcon={<SendIcon />}
            onClick={() => setShowSubmitDialog(true)}
            sx={{
              borderRadius: 2.5,
              px: 2.5,
              textTransform: "none",
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(34,197,94,0.3)",
            }}
          >
            Gửi duyệt
          </Button>
        )}
      </Stack>

      {/* Nutrition summary */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={4}>
        {NUTRITION_INFO.map((item) => (
          <NutritionCard key={item.key} item={item} value={menu.nutrition?.[item.key]} />
        ))}
      </Stack>

      {/* Week tables */}
      <WeekTable
        title="Tuần lẻ"
        weekData={menu.weeks?.odd}
        menu={menu}
        onCellClick={handleCellClick}
        onRemoveFood={handleRemoveFood}
      />
      <WeekTable
        title="Tuần chẵn"
        weekData={menu.weeks?.even}
        menu={menu}
        onCellClick={handleCellClick}
        onRemoveFood={handleRemoveFood}
      />

      {/* Food selector */}
      <FoodSelectorModal
        open={showFoodModal}
        selectedFoods={cellFoods}
        onClose={() => setShowFoodModal(false)}
        onSave={handleSaveFoods}
      />

      {/* Submit confirm dialog */}
      <Dialog
        open={showSubmitDialog}
        onClose={() => !submitting && setShowSubmitDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pt: 2.5, px: 3 }}>
          Xác nhận gửi duyệt
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <DialogContentText>
            Bạn có chắc muốn gửi thực đơn{" "}
            <strong>Tháng {menu.month}/{menu.year}</strong> để duyệt? Sau khi gửi,
            bạn sẽ không thể chỉnh sửa thêm.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setShowSubmitDialog(false)}
            disabled={submitting}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmitMenu}
            disabled={submitting}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: "none",
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(34,197,94,0.3)",
            }}
          >
            {submitting ? "Đang gửi..." : "Gửi duyệt"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MenuDetail;
