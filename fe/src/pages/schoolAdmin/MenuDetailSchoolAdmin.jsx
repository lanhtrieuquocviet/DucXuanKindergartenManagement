import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMenuDetail, getNutritionPlanSetting } from "../../service/menu.api";
import { toast } from "react-toastify";
import RoleLayout from "../../layouts/RoleLayout";
import { createSchoolAdminMenuSelect } from "./schoolAdminMenuConfig";
import { useSchoolAdminMenu } from "./useSchoolAdminMenu";
import { useAuth } from "../../context/AuthContext";
import { labelForRejectPreset } from "../../constants/menuRejectPresets";
import {
  DEFAULT_NUTRITION_RANGES,
  getNutritionRangesFromPlan,
  evaluateNutrition,
  evaluateDailyNutrition,
} from "../../utils/menuNutritionEval";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
} from "@mui/material";
import { ArrowBack as BackIcon } from "@mui/icons-material";

const HISTORY_EVENT_LABELS = {
  submitted:            "Gửi duyệt (bếp gửi)",
  headparent_reviewed:  "Hội trưởng PH xem xét",
  approved:             "Ban giám hiệu duyệt",
  rejected_pending:     "Ban giám hiệu từ chối",
  request_edit_active:  "Yêu cầu chỉnh sửa (từ thực đơn đang áp dụng)",
  applied:              "Áp dụng thực đơn",
  ended:                "Kết thúc áp dụng",
};

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

const STATUS_CHIP = {
  draft: { label: "Nháp", color: "default" },
  pending: { label: "Chờ duyệt", color: "warning" },
  approved: { label: "Đã duyệt", color: "success" },
  active: { label: "Đang áp dụng", color: "info" },
  completed: { label: "Hoàn thành", color: "secondary" },
  rejected: { label: "Bị từ chối", color: "error" },
};

function ViewFoodTag({ food }) {
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
        {food.calories} kcal
      </Typography>
    </Box>
  );
}

function SchoolAdminWeekTable({ title, weekData, nutritionRanges }) {
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
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 560 }}>
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
                  <TableCell key={day} align="center" sx={{ fontWeight: 700, fontSize: 12, py: 1.5 }}>
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
                    return (
                      <TableCell key={day} sx={{ verticalAlign: "top", p: 1.25, minWidth: 120 }}>
                        <Box>
                          {!foods.length ? (
                            <Typography variant="caption" color="text.disabled">
                              Không có món
                            </Typography>
                          ) : (
                            foods.map((food) => <ViewFoodTag key={food._id} food={food} />)
                          )}
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: 12,
                    bgcolor: "grey.50",
                    borderRight: "1px solid",
                    borderColor: "divider",
                    verticalAlign: "top",
                    py: 1.5,
                  }}
                >
                  Đánh giá ngày
                </TableCell>
                {days.map((day) => {
                  const dayMenu = weekData?.[day];
                  const evaluation = evaluateDailyNutrition(dayMenu, nutritionRanges);
                  const hasData =
                    (dayMenu?.lunchFoods?.length || 0) > 0 ||
                    (dayMenu?.afternoonFoods?.length || 0) > 0;

                  return (
                    <TableCell
                      key={day}
                      sx={{
                        verticalAlign: "top",
                        p: 1.25,
                        minWidth: 120,
                        bgcolor: alpha(evaluation.pass ? "#16a34a" : "#dc2626", 0.03),
                      }}
                    >
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
                            Đạm {evaluation.proteinPercent}% • Béo {evaluation.fatPercent}% • Tinh bột{" "}
                            {evaluation.carbPercent}%
                          </Typography>
                          <Chip
                            size="small"
                            color={evaluation.pass ? "success" : "error"}
                            label={evaluation.pass ? "Đạt" : "Không đạt"}
                            sx={{ mt: 0.75, fontWeight: 700 }}
                          />
                          {!evaluation.pass && (
                            <Box sx={{ mt: 0.75 }}>
                              {evaluation.reasons.map((reason, idx) => (
                                <Typography
                                  key={idx}
                                  variant="caption"
                                  color="error.main"
                                  sx={{ display: "block", lineHeight: 1.35 }}
                                >
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

const MenuDetailSchoolAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nutritionRanges, setNutritionRanges] = useState(DEFAULT_NUTRITION_RANGES);

  const nutritionEvaluation = useMemo(() => {
    const m = menu;
    if (!m) return evaluateNutrition({}, nutritionRanges);
    const plan = m.nutritionPlan;
    if (Array.isArray(plan) && plan.length > 0) {
      const planNutrition = {
        avgCalories:
          plan.find((row) => /năng lượng|calo|kcal/i.test(row.label))?.actual ||
          m.nutrition?.avgCalories ||
          0,
        protein:
          plan.find((row) => /đạm|protein|chất đạm/i.test(row.label))?.actual || m.nutrition?.protein || 0,
        fat:
          plan.find((row) => /chất béo|béo|fat|lipid/i.test(row.label))?.actual || m.nutrition?.fat || 0,
        carb:
          plan.find((row) => /tinh bột|carb|glucid/i.test(row.label))?.actual || m.nutrition?.carb || 0,
      };
      return evaluateNutrition(planNutrition, nutritionRanges);
    }
    return evaluateNutrition(m.nutrition, nutritionRanges);
  }, [menu, nutritionRanges]);

  const fetchNutritionPlanSetting = async () => {
    try {
      const res = await getNutritionPlanSetting();
      const rows = Array.isArray(res?.data) ? res.data : [];
      setNutritionRanges(getNutritionRangesFromPlan(rows));
    } catch {
      setNutritionRanges(DEFAULT_NUTRITION_RANGES);
    }
  };

  useEffect(() => {
    fetchMenuDetail();
    fetchNutritionPlanSetting();
  }, [id]);

  useEffect(() => {
    const onUpdated = () => fetchNutritionPlanSetting();
    window.addEventListener("nutrition_plan_updated", onUpdated);
    return () => window.removeEventListener("nutrition_plan_updated", onUpdated);
  }, []);

  const fetchMenuDetail = async () => {
    try {
      setLoading(true);
      const res = await getMenuDetail(id);
      setMenu(res.data);
    } catch {
      toast.error("Không thể tải thực đơn");
    } finally {
      setLoading(false);
    }
  };

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);
  const st = menu?.status && STATUS_CHIP[menu.status] ? STATUS_CHIP[menu.status] : STATUS_CHIP.draft;

  if (loading) {
    return (
      <RoleLayout
        title="Chi tiết thực đơn"
        description="Xem chi tiết thực đơn của trường"
        menuItems={menuItems}
        activeKey="menu"
        userName={user?.fullName || user?.username}
        userAvatar={user?.avatar}
        onMenuSelect={handleMenuSelect}
        onLogout={() => {
          logout();
          navigate("/login");
        }}
        onViewProfile={() => navigate("/profile")}
      >
        <Typography sx={{ p: 3 }}>Đang tải dữ liệu...</Typography>
      </RoleLayout>
    );
  }
  if (!menu) return null;

  return (
    <RoleLayout
      title="Chi tiết thực đơn"
      description="Xem chi tiết thực đơn của trường"
      menuItems={menuItems}
      activeKey="menu"
      userName={user?.fullName || user?.username}
      userAvatar={user?.avatar}
      onMenuSelect={handleMenuSelect}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      onViewProfile={() => navigate("/profile")}
    >
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
          size="small"
          sx={{ mb: 2, textTransform: "none", color: "text.secondary", fontWeight: 600 }}
        >
          Quay lại
        </Button>

        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap" mb={2}>
          <Chip label={st.label} color={st.color} size="small" sx={{ fontWeight: 700 }} />
        </Stack>

        <Typography variant="h5" fontWeight={800} color="#312eae">
          Thực đơn Tháng {menu.month}/{menu.year}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: menu.headParentReview?.comment ? 1.5 : 3 }}>
          Tạo bởi: <strong>{menu.createdBy?.fullName || menu.createdBy?.email || "—"}</strong>
        </Typography>

        {menu.headParentReview?.comment && (
          <Box mb={3} px={2} py={1.5} sx={{ bgcolor: "info.50", border: "1px solid", borderColor: "info.200", borderRadius: 2 }}>
            <Typography variant="caption" color="info.dark" fontWeight={700}>
              Ý kiến hội trưởng phụ huynh:
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {menu.headParentReview.comment}
            </Typography>
          </Box>
        )}

        {Array.isArray(menu.statusHistory) && menu.statusHistory.length > 0 && (
          <Card elevation={0} sx={{ mb: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography fontWeight={700} mb={2}>
                Lịch sử thao tác
              </Typography>
              <Stack spacing={2}>
                {menu.statusHistory.map((ev, idx) => (
                  <Box
                    key={`${ev.at || idx}-${ev.type}-${idx}`}
                    sx={{ borderLeft: "3px solid", borderColor: "primary.main", pl: 2 }}
                  >
                    <Typography fontWeight={600} fontSize="0.9rem">
                      {HISTORY_EVENT_LABELS[ev.type] || ev.type}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {ev.at ? new Date(ev.at).toLocaleString("vi-VN") : ""}
                    </Typography>
                    {(ev.presets?.length > 0 || (ev.detail && String(ev.detail).trim())) && (
                      <Box sx={{ mt: 0.75, fontSize: "0.8rem", color: "text.secondary" }}>
                        {(ev.presets || []).map((pid) => (
                          <div key={pid}>• {labelForRejectPreset(pid)}</div>
                        ))}
                        {ev.detail && String(ev.detail).trim() ? <div>Chi tiết: {ev.detail}</div> : null}
                      </Box>
                    )}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {menu.nutrition && (
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: nutritionEvaluation.overallPass ? "success.main" : "error.main",
              borderRadius: 3,
              mb: 4,
              bgcolor: nutritionEvaluation.overallPass ? "success.50" : "error.50",
            }}
          >
            <CardContent>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: nutritionEvaluation.overallPass ? "success.main" : "error.main",
                }}
              >
                Đánh giá dinh dưỡng (theo tiêu chuẩn đang áp dụng)
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={1} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Calo trung bình/ngày: {nutritionEvaluation.calories.value?.toFixed(1) || 0} kcal
                </Typography>
                <Chip
                  label={nutritionEvaluation.calories.pass ? "Đạt" : "Không đạt"}
                  color={nutritionEvaluation.calories.pass ? "success" : "error"}
                  size="small"
                />
                <Typography variant="caption" color="text.secondary">
                  (Tiêu chuẩn {nutritionEvaluation.calories.range} kcal)
                </Typography>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="stretch">
                {["protein", "fat", "carb"].map((key) => (
                  <Box
                    key={key}
                    sx={{
                      flex: 1,
                      p: 1,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: nutritionEvaluation[key].pass ? "success.main" : "error.main",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: nutritionEvaluation[key].pass ? "success.main" : "error.main",
                      }}
                    >
                      {key === "carb" ? "Tinh bột" : key === "fat" ? "Chất béo" : "Chất đạm"}
                    </Typography>
                    <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                      {nutritionEvaluation[key].value.toFixed(1)}% / {nutritionEvaluation[key].range}
                    </Typography>
                    <Chip
                      label={nutritionEvaluation[key].pass ? "Đạt" : "Không đạt"}
                      color={nutritionEvaluation[key].pass ? "success" : "error"}
                      size="small"
                      sx={{ mt: 0.75 }}
                    />
                  </Box>
                ))}
              </Stack>

              <Box mt={2}>
                {nutritionEvaluation.overallPass ? (
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                    Kết luận: Đạt
                  </Typography>
                ) : (
                  <Box>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 700, mb: 1 }}>
                      Kết luận: Không đạt
                    </Typography>
                    <List dense>
                      {!nutritionEvaluation.calories.pass && (
                        <ListItem>
                          <ListItemText
                            primary={`Calo trung bình/ngày: ${nutritionEvaluation.calories.value?.toFixed(1) || 0} kcal (mục tiêu ${nutritionEvaluation.calories.range} kcal)`}
                          />
                        </ListItem>
                      )}
                      {!nutritionEvaluation.protein.pass && (
                        <ListItem>
                          <ListItemText
                            primary={`Chất đạm: ${nutritionEvaluation.protein.value.toFixed(1)}% (mục tiêu ${nutritionEvaluation.protein.range})`}
                          />
                        </ListItem>
                      )}
                      {!nutritionEvaluation.fat.pass && (
                        <ListItem>
                          <ListItemText
                            primary={`Chất béo: ${nutritionEvaluation.fat.value.toFixed(1)}% (mục tiêu ${nutritionEvaluation.fat.range})`}
                          />
                        </ListItem>
                      )}
                      {!nutritionEvaluation.carb.pass && (
                        <ListItem>
                          <ListItemText
                            primary={`Tinh bột: ${nutritionEvaluation.carb.value.toFixed(1)}% (mục tiêu ${nutritionEvaluation.carb.range})`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        )}

        <SchoolAdminWeekTable title="Tuần lẻ" weekData={menu.weeks?.odd} nutritionRanges={nutritionRanges} />
        <SchoolAdminWeekTable title="Tuần chẵn" weekData={menu.weeks?.even} nutritionRanges={nutritionRanges} />
      </Box>
    </RoleLayout>
  );
};

export default MenuDetailSchoolAdmin;
