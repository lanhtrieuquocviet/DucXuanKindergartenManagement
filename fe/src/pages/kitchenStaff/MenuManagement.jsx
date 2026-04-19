import { useState, useEffect, useMemo } from "react";
import { getMenus } from "../../service/menu.api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  InputAdornment,
  Skeleton,
  Paper,
  Tabs,
  Tab,
  Stack,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  RestaurantMenu as MenuIcon,
  CalendarMonth as CalendarIcon,
  ArrowForward as ArrowIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";

const STATUS_CONFIG = {
  approved:           { label: "Đã duyệt",                  color: "success" },
  pending:            { label: "Chờ BGH duyệt",              color: "warning" },
  pending_headparent: { label: "Chờ hội trưởng PH xem xét", color: "info"    },
  draft:              { label: "Nháp",                       color: "default" },
  rejected:           { label: "Từ chối",                    color: "error"   },
  active:             { label: "Đang áp dụng",               color: "info"    },
  completed:          { label: "Lịch sử",                    color: "secondary"},
};

const TABS = [
  { value: "all",                label: "Tất cả"                 },
  { value: "draft",              label: "Nháp"                   },
  { value: "pending_headparent", label: "Chờ hội trưởng PH"      },
  { value: "pending",            label: "Chờ BGH duyệt"          },
  { value: "approved",           label: "Đã duyệt"               },
  { value: "active",             label: "Đang áp dụng"           },
  { value: "completed",          label: "Lịch sử"                },
];

/** Lịch sử: đã kết thúc + bị trả về / từ chối (chip vẫn đỏ "Từ chối") */
function isHistoryListStatus(menu) {
  return menu.status === "completed" || menu.status === "rejected";
}

const MONTH_NAMES = [
  "", "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function StatCard({ label, count, color }) {
  return (
    <Card
      elevation={0}
      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, flex: 1 }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="h4" fontWeight={800} color={`${color}.main`}>
          {count}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

function MenuManagement() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await getMenus({ limit: 500 });
      const list = Array.isArray(res?.data) ? res.data : [];
      setMenus(list);
    } catch {
      toast.error("Không thể tải danh sách thực đơn");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return menus.filter((m) => {
      const matchStatus =
        tab === "all"
          ? true
          : tab === "completed"
            ? isHistoryListStatus(m)
            : m.status === tab;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        `tháng ${m.month}/${m.year}`.includes(q) ||
        String(m.month).includes(q) ||
        String(m.year).includes(q);
      return matchStatus && matchSearch;
    });
  }, [menus, search, tab]);

  const stats = useMemo(() => ({
    total: menus.length,
    pending: menus.filter((m) => m.status === "pending").length,
    active: menus.filter((m) => m.status === "active").length,
    draft: menus.filter((m) => m.status === "draft").length,
  }), [menus]);

  const pendingCount = menus.filter((m) => m.status === "pending").length;
  const activeCount = menus.filter((m) => m.status === "active").length;
  const historyCount = menus.filter(isHistoryListStatus).length;

  return (
    <Box>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} lineHeight={1.3}>
            Quản lý thực đơn
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            Lập kế hoạch và theo dõi thực đơn theo tháng
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/kitchen/menus/create")}
          sx={{
            borderRadius: 2.5,
            px: 2.5,
            py: 1,
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
            fontWeight: 700,
            textTransform: "none",
            "&:hover": {
              background: "linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)",
              boxShadow: "0 6px 20px rgba(99,102,241,0.45)",
            },
          }}
        >
          Tạo thực đơn
        </Button>
      </Stack>

      {/* Stats */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
        <StatCard label="Tổng thực đơn" count={stats.total} color="primary" />
        <StatCard label="Chờ duyệt" count={stats.pending} color="warning" />
        <StatCard label="Đang áp dụng" count={stats.active} color="info" />
        <StatCard label="Nháp" count={stats.draft} color="secondary" />
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", mb: 2.5 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 1, "& .MuiTab-root": { fontWeight: 600, fontSize: 12, minHeight: 44 } }}
        >
          {TABS.map((t) => {
            let badge = null;
            if (t.value === "pending" && pendingCount > 0) {
              badge = <Chip label={pendingCount} size="small" color="warning" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />;
            } else if (t.value === "active" && activeCount > 0) {
              badge = <Chip label={activeCount} size="small" color="info" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />;
            } else if (t.value === "completed" && historyCount > 0) {
              badge = <Chip label={historyCount} size="small" color="secondary" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />;
            }
            return (
              <Tab
                key={t.value}
                value={t.value}
                label={
                  badge ? (
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      {t.label}
                      {badge}
                    </Stack>
                  ) : (
                    t.label
                  )
                }
              />
            );
          })}
        </Tabs>
      </Paper>

      <TextField
        size="small"
        placeholder="Tìm theo tháng/năm..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 2.5 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
            </InputAdornment>
          ),
          endAdornment: search && (
            <InputAdornment position="end">
              <ClearIcon
                sx={{ fontSize: 16, cursor: "pointer", color: "text.disabled" }}
                onClick={() => setSearch("")}
              />
            </InputAdornment>
          ),
          sx: { borderRadius: 2 },
        }}
      />

      {/* Menu list */}
      {loading ? (
        <Stack spacing={1.5}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              elevation={0}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Skeleton variant="text" width={200} height={28} />
                <Skeleton variant="text" width={140} height={20} sx={{ mt: 0.5 }} />
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : filtered.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            p: 6,
            textAlign: "center",
          }}
        >
          <Avatar
            sx={{ width: 64, height: 64, bgcolor: "grey.100", mx: "auto", mb: 2 }}
          >
            <MenuIcon sx={{ fontSize: 32, color: "grey.400" }} />
          </Avatar>
          <Typography fontWeight={600} color="text.secondary">
            {search || tab !== "all"
              ? "Không tìm thấy thực đơn phù hợp"
              : "Chưa có thực đơn nào"}
          </Typography>
          {!search && tab === "all" && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => navigate("/kitchen/menus/create")}
              sx={{ mt: 1.5, textTransform: "none" }}
            >
              Tạo thực đơn đầu tiên
            </Button>
          )}
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {filtered.map((menu) => {
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
                    boxShadow: "0 4px 20px rgba(99,102,241,0.1)",
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(`/kitchen/menus/${menu._id}`)}
                  sx={{ borderRadius: 3 }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      justifyContent="space-between"
                      spacing={1.5}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          sx={{
                            width: 46,
                            height: 46,
                            background:
                              menu.status === "active"
                                ? "linear-gradient(135deg, #0ea5e9, #6366f1)"
                                : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                            flexShrink: 0,
                          }}
                        >
                          <CalendarIcon sx={{ fontSize: 22 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {MONTH_NAMES[menu.month]} năm {menu.year}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Tạo bởi:{" "}
                            <strong>
                              {menu.createdBy?.fullName || "Không rõ"}
                            </strong>{" "}
                            &middot;{" "}
                            {new Date(menu.createdAt).toLocaleDateString("vi-VN")}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        sx={{ flexShrink: 0 }}
                      >
                        <Chip
                          label={cfg.label}
                          color={cfg.color}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: 12 }}
                        />
                        <Avatar
                          sx={{
                            width: 30,
                            height: 30,
                            bgcolor: alpha("#4f46e5", 0.1),
                          }}
                        >
                          <ArrowIcon
                            sx={{ fontSize: 16, color: "primary.main" }}
                          />
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

      {!loading && filtered.length > 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ mt: 2, display: "block" }}>
          Hiển thị {filtered.length}/{menus.length} thực đơn
        </Typography>
      )}
    </Box>
  );
}

export default MenuManagement;
