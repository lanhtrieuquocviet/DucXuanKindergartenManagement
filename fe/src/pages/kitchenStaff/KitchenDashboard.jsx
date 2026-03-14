import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMenus } from "../../service/menu.api";
import { getAttendanceSummary } from "../../service/mealManagement.api";
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Typography,
  LinearProgress,
  alpha,
} from "@mui/material";
import {
  RestaurantMenu as MenuIcon,
  LocalFireDepartment as FoodIcon,
  CloudUpload as UploadIcon,
  BarChart as ReportIcon,
  Restaurant as MealIcon,
  People as PeopleIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  EditNote as DraftIcon,
  TrendingUp as TrendIcon,
  ArrowForward as ArrowIcon,
  WbSunny as MorningIcon,
  WbTwilight as EveningIcon,
  NightsStay as NightIcon,
  LunchDining as LunchIcon,
} from "@mui/icons-material";

const STATUS_CONFIG = {
  approved: { label: "Đã duyệt", color: "success" },
  pending: { label: "Chờ duyệt", color: "warning" },
  draft: { label: "Nháp", color: "default" },
  rejected: { label: "Từ chối", color: "error" },
  active: { label: "Đang áp dụng", color: "info" },
  completed: { label: "Hoàn thành", color: "secondary" },
};

const MONTH_NAMES = [
  "", "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return { text: "Chào buổi sáng", icon: <MorningIcon sx={{ fontSize: 20 }} /> };
  if (h < 14) return { text: "Chào buổi trưa", icon: <LunchIcon sx={{ fontSize: 20 }} /> };
  if (h < 18) return { text: "Chào buổi chiều", icon: <EveningIcon sx={{ fontSize: 20 }} /> };
  return { text: "Chào buổi tối", icon: <NightIcon sx={{ fontSize: 20 }} /> };
}

const QUICK_ACTIONS = [
  {
    label: "Quản lý thực đơn",
    desc: "Tạo & theo dõi thực đơn tháng",
    path: "/kitchen/menus",
    gradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    icon: <MenuIcon sx={{ fontSize: 26 }} />,
  },
  {
    label: "Quản lý món ăn",
    desc: "Danh sách & dinh dưỡng món ăn",
    path: "/kitchen/foods",
    gradient: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
    icon: <FoodIcon sx={{ fontSize: 26 }} />,
  },
  {
    label: "Sĩ số & Suất cơm",
    desc: "Thống kê điểm danh bữa ăn",
    path: "/kitchen/headcount",
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
    icon: <PeopleIcon sx={{ fontSize: 26 }} />,
  },
  {
    label: "Upload ảnh",
    desc: "Ảnh bữa ăn & mẫu thực phẩm",
    path: "/kitchen/upload-food",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    icon: <UploadIcon sx={{ fontSize: 26 }} />,
  },
  {
    label: "Quản lý bữa ăn",
    desc: "Theo dõi & ghi nhận bữa ăn",
    path: "/kitchen/meal-management",
    gradient: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
    icon: <MealIcon sx={{ fontSize: 26 }} />,
  },
  {
    label: "Báo cáo",
    desc: "Xuất báo cáo thực đơn & dinh dưỡng",
    path: "/kitchen/report",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
    icon: <ReportIcon sx={{ fontSize: 26 }} />,
  },
];

function StatCard({ label, value, color, icon, loading, sublabel }) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        flex: 1,
        minWidth: 0,
        transition: "all 0.15s",
        "&:hover": {
          borderColor: `${color}.main`,
          boxShadow: `0 4px 20px ${alpha("#4f46e5", 0.1)}`,
        },
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            {loading ? (
              <>
                <Skeleton variant="text" width={60} height={44} />
                <Skeleton variant="text" width={90} height={20} />
              </>
            ) : (
              <>
                <Typography variant="h4" fontWeight={800} color={`${color}.main`} lineHeight={1.2}>
                  {value}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500} mt={0.5}>
                  {label}
                </Typography>
                {sublabel && (
                  <Typography variant="caption" color="text.disabled">
                    {sublabel}
                  </Typography>
                )}
              </>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: alpha(color === "primary" ? "#4f46e5" : color === "warning" ? "#f59e0b" : color === "info" ? "#0ea5e9" : color === "success" ? "#10b981" : "#6b7280", 0.12),
              width: 44,
              height: 44,
            }}
          >
            <Box sx={{ color: `${color}.main`, display: "flex" }}>{icon}</Box>
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

function KitchenDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menus, setMenus] = useState([]);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [todaySummary, setTodaySummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const greeting = getGreeting();
  const userName = user?.fullName || user?.name || "Kitchen Staff";
  const firstName = userName.split(" ").pop();

  useEffect(() => {
    getMenus()
      .then((res) => setMenus(res.data || []))
      .catch(() => setMenus([]))
      .finally(() => setLoadingMenus(false));

    getAttendanceSummary(todayStr)
      .then((res) => setTodaySummary(res.data || null))
      .catch(() => setTodaySummary(null))
      .finally(() => setLoadingSummary(false));
  }, [todayStr]);

  const stats = useMemo(() => ({
    total: menus.length,
    pending: menus.filter((m) => m.status === "pending").length,
    approved: menus.filter((m) => m.status === "approved" || m.status === "active").length,
    draft: menus.filter((m) => m.status === "draft").length,
  }), [menus]);

  const recentMenus = useMemo(
    () => [...menus].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4),
    [menus]
  );

  const todayLabel = today.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalStudents = todaySummary?.classes?.reduce((sum, c) => sum + (c.present || 0), 0) ?? 0;
  const totalClasses = todaySummary?.classes?.length ?? 0;

  return (
    <Box>
      {/* Welcome Banner */}
      <Card
        elevation={0}
        sx={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          borderRadius: 4,
          mb: 3,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: "absolute", right: -30, top: -30,
            width: 160, height: 160, borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.07)",
          }}
        />
        <Box
          sx={{
            position: "absolute", right: 80, bottom: -40,
            width: 100, height: 100, borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.05)",
          }}
        />
        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ color: "rgba(255,255,255,0.8)", mb: 0.75 }}>
                {greeting.icon}
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                  {greeting.text}
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={800} sx={{ color: "white", lineHeight: 1.3 }}>
                {firstName} 👨‍🍳
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.65)", mt: 0.5 }}>
                Hệ thống quản lý nhà bếp Đức Xuân
              </Typography>
            </Box>
            <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", display: "block", textTransform: "capitalize" }}>
                {todayLabel}
              </Typography>
              {!loadingSummary && totalStudents > 0 && (
                <Chip
                  label={`${totalStudents} học sinh có mặt hôm nay`}
                  size="small"
                  sx={{
                    mt: 0.75,
                    bgcolor: "rgba(255,255,255,0.15)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 12,
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                />
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Stats */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3} flexWrap="wrap">
        <StatCard
          label="Tổng thực đơn"
          value={stats.total}
          color="primary"
          icon={<MenuIcon sx={{ fontSize: 22 }} />}
          loading={loadingMenus}
          sublabel="Tất cả tháng"
        />
        <StatCard
          label="Chờ duyệt"
          value={stats.pending}
          color="warning"
          icon={<PendingIcon sx={{ fontSize: 22 }} />}
          loading={loadingMenus}
          sublabel={stats.pending > 0 ? "Cần xử lý" : "Không có mới"}
        />
        <StatCard
          label="Đã duyệt"
          value={stats.approved}
          color="success"
          icon={<CheckIcon sx={{ fontSize: 22 }} />}
          loading={loadingMenus}
          sublabel="Đã phê duyệt"
        />
        <StatCard
          label="Nháp"
          value={stats.draft}
          color="info"
          icon={<DraftIcon sx={{ fontSize: 22 }} />}
          loading={loadingMenus}
          sublabel="Chưa gửi duyệt"
        />
      </Stack>

      {/* Today attendance */}
      {(loadingSummary || totalClasses > 0) && (
        <Card
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, mb: 3 }}
        >
          <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
              <Avatar sx={{ bgcolor: alpha("#0ea5e9", 0.12), width: 36, height: 36 }}>
                <PeopleIcon sx={{ fontSize: 18, color: "info.main" }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  Sĩ số hôm nay
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {todayLabel}
                </Typography>
              </Box>
            </Stack>

            {loadingSummary ? (
              <Stack spacing={1.5}>
                {[1, 2, 3].map((i) => (
                  <Box key={i}>
                    <Skeleton variant="text" width="40%" height={18} />
                    <Skeleton variant="rectangular" height={6} sx={{ borderRadius: 3, mt: 0.5 }} />
                  </Box>
                ))}
              </Stack>
            ) : todaySummary?.classes?.length > 0 ? (
              <Stack spacing={1.5}>
                {todaySummary.classes.slice(0, 4).map((cls) => {
                  const pct = cls.total > 0 ? Math.round((cls.present / cls.total) * 100) : 0;
                  return (
                    <Box key={cls.className}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" fontWeight={600}>
                          {cls.className}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {cls.present}/{cls.total} ({pct}%)
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha("#0ea5e9", 0.1),
                          "& .MuiLinearProgress-bar": {
                            background: "linear-gradient(90deg, #0ea5e9, #6366f1)",
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>
                  );
                })}
                {todaySummary.classes.length > 4 && (
                  <Typography variant="caption" color="text.disabled">
                    +{todaySummary.classes.length - 4} lớp khác
                  </Typography>
                )}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.disabled" textAlign="center" py={1}>
                Chưa có dữ liệu điểm danh hôm nay
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Typography variant="subtitle1" fontWeight={700} mb={1.5} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <TrendIcon sx={{ fontSize: 18, color: "primary.main" }} />
        Truy cập nhanh
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(6, 1fr)" },
          gap: 1.5,
          mb: 3,
        }}
      >
        {QUICK_ACTIONS.map((action) => (
          <Card
            key={action.path}
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              transition: "all 0.18s",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                borderColor: "transparent",
              },
            }}
          >
            <CardActionArea onClick={() => navigate(action.path)} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, textAlign: "center" }}>
                <Avatar
                  sx={{
                    background: action.gradient,
                    width: 48,
                    height: 48,
                    mx: "auto",
                    mb: 1.25,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  {action.icon}
                </Avatar>
                <Typography variant="caption" fontWeight={700} display="block" lineHeight={1.3}>
                  {action.label}
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10.5, lineHeight: 1.3, display: "block", mt: 0.5 }}>
                  {action.desc}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      {/* Recent Menus */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MenuIcon sx={{ fontSize: 18, color: "primary.main" }} />
          Thực đơn gần đây
        </Typography>
        <Typography
          variant="caption"
          color="primary.main"
          fontWeight={600}
          sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
          onClick={() => navigate("/kitchen/menus")}
        >
          Xem tất cả →
        </Typography>
      </Stack>

      {loadingMenus ? (
        <Stack spacing={1.5}>
          {[1, 2, 3].map((i) => (
            <Card key={i} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Skeleton variant="circular" width={44} height={44} />
                  <Box flex={1}>
                    <Skeleton variant="text" width="50%" height={22} />
                    <Skeleton variant="text" width="35%" height={18} />
                  </Box>
                  <Skeleton variant="rounded" width={70} height={24} sx={{ borderRadius: 10 }} />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : recentMenus.length === 0 ? (
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 4, textAlign: "center" }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: "grey.100", mx: "auto", mb: 1.5 }}>
            <MenuIcon sx={{ fontSize: 28, color: "grey.400" }} />
          </Avatar>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Chưa có thực đơn nào
          </Typography>
          <Typography
            variant="caption"
            color="primary.main"
            fontWeight={600}
            sx={{ cursor: "pointer", mt: 1, display: "inline-block", "&:hover": { textDecoration: "underline" } }}
            onClick={() => navigate("/kitchen/menus/create")}
          >
            Tạo thực đơn đầu tiên →
          </Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {recentMenus.map((menu, idx) => {
            const cfg = STATUS_CONFIG[menu.status] || { label: menu.status, color: "default" };
            return (
              <Card
                key={menu._id}
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  transition: "all 0.15s",
                  "&:hover": {
                    borderColor: "rgba(99,102,241,0.35)",
                    boxShadow: "0 4px 16px rgba(99,102,241,0.1)",
                  },
                }}
              >
                <CardActionArea onClick={() => navigate(`/kitchen/menus/${menu._id}`)} sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar
                        sx={{
                          width: 44,
                          height: 44,
                          background:
                            menu.status === "active"
                              ? "linear-gradient(135deg, #0ea5e9, #6366f1)"
                              : idx === 0
                                ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                                : "linear-gradient(135deg, #64748b, #94a3b8)",
                          flexShrink: 0,
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {menu.month}
                      </Avatar>
                      <Box flex={1} minWidth={0}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                          {MONTH_NAMES[menu.month]} năm {menu.year}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {new Date(menu.createdAt).toLocaleDateString("vi-VN")}
                          {menu.createdBy?.fullName && ` · ${menu.createdBy.fullName}`}
                        </Typography>
                      </Box>
                      <Stack direction="row" alignItems="center" spacing={1} flexShrink={0}>
                        <Chip
                          label={cfg.label}
                          color={cfg.color}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: 11 }}
                        />
                        <Avatar sx={{ width: 28, height: 28, bgcolor: alpha("#4f46e5", 0.08) }}>
                          <ArrowIcon sx={{ fontSize: 14, color: "primary.main" }} />
                        </Avatar>
                      </Stack>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

export default KitchenDashboard;
