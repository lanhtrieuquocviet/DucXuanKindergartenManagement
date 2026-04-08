import { useState, useEffect, useRef } from "react";
import {
  getMenus,
  approveMenu,
  rejectMenu,
  getNutritionPlanSetting,
  updateNutritionPlanSetting,
} from "../../service/menu.api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import RoleLayout from "../../layouts/RoleLayout";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';
import {
  Box, Typography, Paper, Chip, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Skeleton, Tabs, Tab,
  Avatar, Tooltip, Stack, Divider, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  MenuBook as MenuBookIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  HourglassEmpty as PendingIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

const STATUS_CONFIG = {
  approved: { label: "Đã duyệt",     color: "success" },
  pending:  { label: "Chờ duyệt",    color: "warning" },
  draft:    { label: "Nháp",         color: "default" },
  rejected: { label: "Bị từ chối",   color: "error"   },
  active:   { label: "Đang áp dụng", color: "info"    },
  completed:{ label: "Đã kết thúc",  color: "secondary"},
};

const TABS = [
  { value: "all",      label: "Tất cả" },
  { value: "pending",  label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
];

function MenuCardSkeleton() {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #e5e7eb" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box sx={{ flex: 1 }}>
          <Skeleton width={200} height={28} />
          <Skeleton width={160} height={20} sx={{ mt: 0.5 }} />
          <Skeleton width={80} height={24} sx={{ mt: 1 }} />
        </Box>
        <Stack direction="row" gap={1}>
          <Skeleton width={80} height={36} sx={{ borderRadius: 1 }} />
          <Skeleton width={80} height={36} sx={{ borderRadius: 1 }} />
        </Stack>
      </Stack>
    </Paper>
  );
}

function EmptyState({ tab }) {
  const messages = {
    all:      { title: "Chưa có thực đơn nào", sub: "Khi y tế hoặc giáo viên gửi thực đơn, chúng sẽ xuất hiện tại đây." },
    pending:  { title: "Không có thực đơn chờ duyệt", sub: "Hiện tại không có thực đơn nào đang chờ xét duyệt." },
    approved: { title: "Chưa có thực đơn đã duyệt", sub: "Các thực đơn sau khi được phê duyệt sẽ hiển thị tại đây." },
    rejected: { title: "Chưa có thực đơn bị từ chối", sub: "Các thực đơn bị từ chối sẽ hiển thị tại đây." },
  };
  const { title, sub } = messages[tab] || messages.all;
  return (
    <Paper
      elevation={0}
      sx={{
        p: 6, borderRadius: 2, border: "1px dashed #d1d5db",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
      }}
    >
      <Avatar sx={{ width: 64, height: 64, bgcolor: "#f3f4f6" }}>
        {tab === "pending"
          ? <PendingIcon sx={{ fontSize: 36, color: "#f59e0b" }} />
          : <MenuBookIcon sx={{ fontSize: 36, color: "#9ca3af" }} />
        }
      </Avatar>
      <Typography variant="h6" fontWeight={700} color="text.primary">{title}</Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={380}>{sub}</Typography>
    </Paper>
  );
}

function MenuSchoolAdmin() {
  const [menus, setMenus]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [tab, setTab]                   = useState("all");
  const [confirmApprove, setConfirmApprove] = useState(null);
  const [confirmReject, setConfirmReject]   = useState(null);
  const [rejectReason, setRejectReason]     = useState("");

  const [showNutritionPlan, setShowNutritionPlan] = useState(false);
  const [nutritionSaving, setNutritionSaving] = useState(false);
  const [nutritionPlan, setNutritionPlan] = useState([
    { id: 1, name: "Calo trung bình/ngày", min: 615, max: 726, actual: 0 },
    { id: 2, name: "Đạm (g)", min: 13, max: 20, actual: 0 },
    { id: 3, name: "Béo (g)", min: 25, max: 35, actual: 0 },
    { id: 4, name: "Tinh bột (g)", min: 52, max: 60, actual: 0 },
  ]);
  const [newPlanItem, setNewPlanItem] = useState({ name: "", min: "", max: "", actual: "" });
  const nutritionSectionRef = useRef(null);

  const navigate       = useNavigate();
  const { user, logout } = useAuth();
  const menuItems = useSchoolAdminMenu();

  useEffect(() => {
    fetchMenus();
    fetchNutritionPlan();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await getMenus();
      setMenus(res.data || []);
    } catch {
      toast.error("Không thể tải danh sách thực đơn");
    } finally {
      setLoading(false);
    }
  };

  const fetchNutritionPlan = async () => {
    try {
      const res = await getNutritionPlanSetting();
      const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
      if (rows.length > 0) {
        setNutritionPlan(
          rows.map((item, idx) => ({
            id: idx + 1,
            name: item.name,
            min: Number(item.min) || 0,
            max: Number(item.max) || 0,
            actual: Number(item.actual) || 0,
          }))
        );
      }
    } catch {
      // Keep fallback values if config API fails.
    }
  };

  const handleApprove = async () => {
    try {
      await approveMenu(confirmApprove._id);
      toast.success("Đã duyệt thực đơn");
      setConfirmApprove(null);
      fetchMenus();
    } catch {
      toast.error("Duyệt thất bại");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error("Vui lòng nhập lý do từ chối"); return; }
    try {
      await rejectMenu(confirmReject._id, rejectReason);
      toast.success("Đã từ chối thực đơn");
      setConfirmReject(null);
      setRejectReason("");
      fetchMenus();
    } catch {
      toast.error("Từ chối thất bại");
    }
  };

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);
  const userName = user?.fullName || user?.username || "School Admin";

  const handleScrollToNutritionPlan = () => {
    setShowNutritionPlan((prev) => {
      const next = !prev;
      if (!prev) {
        setTimeout(() => {
          nutritionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      }
      return next;
    });
  };

  const handleAddPlanItem = () => {
    if (!newPlanItem.name.trim()) {
      toast.error("Vui lòng nhập tên mục kế hoạch");
      return;
    }

    const min = Number(newPlanItem.min);
    const max = Number(newPlanItem.max);
    if (Number.isNaN(min) || Number.isNaN(max) || min <= 0 || max <= 0) {
      toast.error("Giá trị tối thiểu và tối đa phải là số dương");
      return;
    }
    if (max <= min) {
      toast.error("Giá trị tối đa phải lớn hơn giá trị tối thiểu");
      return;
    }

    setNutritionPlan((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newPlanItem.name.trim(),
        min,
        max,
        actual: Number(newPlanItem.actual) || 0,
      },
    ]);

    setNewPlanItem({ name: "", min: "", max: "", actual: "" });
  };

  const handleUpdatePlanItem = (id, field, value) => {
    setNutritionPlan((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      if (field === "name") return { ...item, name: value };
      if (field === "actual") return { ...item, actual: Number(value || 0) };
      const parsed = Number(value);
      if (Number.isNaN(parsed)) return item;
      return { ...item, [field]: parsed };
    }));
  };

  const handleDeletePlanItem = (id) => {
    setNutritionPlan((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateNutritionPlan = async () => {
    for (const item of nutritionPlan) {
      if (item.min == null || item.max == null) {
        toast.error(`Mục ${item.name} cần nhập đầy đủ giá trị tối thiểu/tối đa`);
        return;
      }
      if (item.max <= item.min) {
        toast.error(`Mục ${item.name}: giá trị tối đa phải lớn hơn tối thiểu`);
        return;
      }
    }

    try {
      setNutritionSaving(true);
      const payload = nutritionPlan.map(({ name, min, max, actual }) => ({
        name: String(name || "").trim(),
        min: Number(min),
        max: Number(max),
        actual: Number(actual || 0),
      }));
      await updateNutritionPlanSetting(payload);
      // Notify other tabs/pages (e.g. Kitchen Staff) to refresh ranges immediately.
      localStorage.setItem("nutrition_plan_updated_at", String(Date.now()));
      toast.success("Đã cập nhật kế hoạch dinh dưỡng theo sở");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Cập nhật kế hoạch thất bại");
    } finally {
      setNutritionSaving(false);
    }
  };

  const filtered = tab === "all" ? menus : menus.filter((m) => m.status === tab);

  const pendingCount = menus.filter((m) => m.status === "pending").length;

  return (
    <RoleLayout
      title="Quản lý Thực đơn"
      description="Danh sách thực đơn của trường"
      menuItems={menuItems}
      activeKey="menu"
      onLogout={() => { logout(); navigate("/login", { replace: true }); }}
      onViewProfile={() => navigate("/profile")}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#312eae">
            Quản lý Thực đơn
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Xem xét và phê duyệt thực đơn do y tế / giáo viên gửi lên
          </Typography>
        </Box>
        {pendingCount > 0 && (
          <Chip
            icon={<PendingIcon />}
            label={`${pendingCount} thực đơn chờ duyệt`}
            color="warning"
            sx={{ fontWeight: 700, fontSize: 13 }}
          />
        )}
      </Stack>

      <Box mb={2}>
        <Button
          variant="contained"
          color={showNutritionPlan ? "secondary" : "primary"}
          onClick={handleScrollToNutritionPlan}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          {showNutritionPlan ? "Ẩn kế hoạch dinh dưỡng theo sở" : "Hiển thị kế hoạch dinh dưỡng theo sở"}
        </Button>
      </Box>

      {showNutritionPlan && (
        <Box ref={nutritionSectionRef} sx={{ p: 3, border: "1px solid #e5e7eb", borderRadius: 2, mb: 3, maxHeight: 360, overflowY: "auto", background: "#ffffff" }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Kế hoạch dinh dưỡng theo sở
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Chỉ tiêu</TableCell>
                  <TableCell>Mục tiêu Min</TableCell>
                  <TableCell>Mục tiêu Max</TableCell>
                  <TableCell>Giá trị thực tế</TableCell>
                  <TableCell>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {nutritionPlan.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={item.name}
                        onChange={(e) => handleUpdatePlanItem(item.id, "name", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={item.min}
                        onChange={(e) => handleUpdatePlanItem(item.id, "min", e.target.value)}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={item.max}
                        onChange={(e) => handleUpdatePlanItem(item.id, "max", e.target.value)}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={item.actual}
                        onChange={(e) => handleUpdatePlanItem(item.id, "actual", e.target.value)}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton color="error" size="small" onClick={() => handleDeletePlanItem(item.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Thêm mục mới"
                      value={newPlanItem.name}
                      onChange={(e) => setNewPlanItem((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="Min"
                      value={newPlanItem.min}
                      onChange={(e) => setNewPlanItem((prev) => ({ ...prev, min: e.target.value }))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="Max"
                      value={newPlanItem.max}
                      onChange={(e) => setNewPlanItem((prev) => ({ ...prev, max: e.target.value }))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="Actual"
                      value={newPlanItem.actual}
                      onChange={(e) => setNewPlanItem((prev) => ({ ...prev, actual: e.target.value }))}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="contained" size="small" onClick={handleAddPlanItem}>
                      Thêm
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Box mt={2} textAlign="right">
            <Button
              variant="outlined"
              color="primary"
              onClick={handleUpdateNutritionPlan}
              disabled={nutritionSaving}
            >
              {nutritionSaving ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </Box>
        </Box>
      )}

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid #e5e7eb", mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ px: 2, "& .MuiTab-root": { fontWeight: 600, fontSize: 13, minHeight: 48 } }}
        >
          {TABS.map((t) => (
            <Tab
              key={t.value}
              value={t.value}
              label={
                t.value === "pending" && pendingCount > 0
                  ? <Stack direction="row" alignItems="center" gap={0.75}>
                      {t.label}
                      <Chip label={pendingCount} size="small" color="warning" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                    </Stack>
                  : t.label
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* List */}
      <Stack spacing={2}>
        {loading
          ? [1, 2, 3].map((i) => <MenuCardSkeleton key={i} />)
          : filtered.length === 0
            ? <EmptyState tab={tab} />
            : filtered.map((menu) => {
                const sc = STATUS_CONFIG[menu.status] || { label: menu.status, color: "default" };
                return (
                  <Paper
                    key={menu._id}
                    elevation={0}
                    sx={{
                      p: 3, borderRadius: 2,
                      border: "1px solid",
                      borderColor: menu.status === "pending" ? "#fde68a" : "#e5e7eb",
                      bgcolor: menu.status === "pending" ? "#fffbeb" : "#fff",
                      transition: "box-shadow 0.15s",
                      "&:hover": { boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
                    }}
                  >
                    <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={2}>
                      {/* Left info */}
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" alignItems="center" gap={1} mb={0.75}>
                          <CalendarIcon sx={{ fontSize: 18, color: "#6366f1" }} />
                          <Typography variant="subtitle1" fontWeight={700} color="#111827">
                            Thực đơn Tháng {menu.month}/{menu.year}
                          </Typography>
                          <Chip
                            label={sc.label}
                            color={sc.color}
                            size="small"
                            sx={{ fontWeight: 600, fontSize: 11 }}
                          />
                        </Stack>
                        <Stack direction="row" alignItems="center" gap={0.75}>
                          <PersonIcon sx={{ fontSize: 15, color: "#9ca3af" }} />
                          <Typography variant="body2" color="text.secondary">
                            Tạo bởi: <strong>{menu.createdBy?.fullName || "Không rõ"}</strong>
                          </Typography>
                          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                          <Typography variant="body2" color="text.secondary">
                            {new Date(menu.createdAt).toLocaleDateString("vi-VN")}
                          </Typography>
                        </Stack>
                      </Box>

                      {/* Actions */}
                      <Stack direction="row" gap={1} flexShrink={0}>
                        <Tooltip title="Xem chi tiết">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => navigate(`/school-admin/menus/${menu._id}`)}
                            sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
                          >
                            Xem
                          </Button>
                        </Tooltip>

                        {menu.status === "pending" && (
                          <>
                            <Tooltip title="Phê duyệt thực đơn này">
                              <Button
                                variant="contained"
                                size="small"
                                color="success"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => setConfirmApprove(menu)}
                                sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
                              >
                                Duyệt
                              </Button>
                            </Tooltip>
                            <Tooltip title="Từ chối thực đơn này">
                              <Button
                                variant="contained"
                                size="small"
                                color="error"
                                startIcon={<CancelIcon />}
                                onClick={() => setConfirmReject(menu)}
                                sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
                              >
                                Từ chối
                              </Button>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })
        }
      </Stack>

      {/* Confirm Approve */}
      <ConfirmDialog
        open={!!confirmApprove}
        title="Xác nhận duyệt thực đơn"
        message={
          confirmApprove
            ? `Bạn có chắc muốn duyệt Thực đơn Tháng ${confirmApprove.month}/${confirmApprove.year}?`
            : ""
        }
        confirmText="Xác nhận duyệt"
        cancelText="Hủy"
        onConfirm={handleApprove}
        onCancel={() => setConfirmApprove(null)}
      />

      {/* Reject Dialog */}
      <Dialog open={!!confirmReject} onClose={() => setConfirmReject(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Từ chối duyệt thực đơn</DialogTitle>
        <DialogContent>
          {confirmReject && (
            <Typography mb={2} color="text.secondary">
              Từ chối Thực đơn Tháng <strong>{confirmReject.month}/{confirmReject.year}</strong>?
            </Typography>
          )}
          <TextField
            fullWidth multiline rows={3}
            label="Lý do từ chối *"
            placeholder="Nhập lý do từ chối để thông báo cho người tạo..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setConfirmReject(null); setRejectReason(""); }}>Hủy</Button>
          <Button variant="contained" color="error" onClick={handleReject}>
            Xác nhận từ chối
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}

export default MenuSchoolAdmin;
