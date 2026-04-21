import { useState, useEffect } from "react";
import api from "../../service/api";
import {
  getMenus,
  approveMenu,
  rejectMenu,
  requestEditFromActiveMenu,
  applyMenu,
  endMenu,
} from "../../service/menu.api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import RoleLayout from "../../layouts/RoleLayout";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import { MENU_REJECT_PRESETS } from "../../constants/menuRejectPresets";
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';
import {
  Box, Typography, Paper, Chip, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Skeleton, Tabs, Tab,
  Avatar, Tooltip, Stack, Divider, FormGroup, FormControlLabel, Checkbox
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  MenuBook as MenuBookIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  HourglassEmpty as PendingIcon,
  PlayCircleOutline as ApplyIcon,
  StopCircle as EndMenuIcon,
  History as HistoryIcon,
  EditNote as EditNoteIcon,
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
  { value: "all",       label: "Tất cả" },
  { value: "pending",   label: "Chờ duyệt" },
  { value: "approved",  label: "Đã duyệt" },
  { value: "active",    label: "Đang áp dụng" },
  { value: "completed", label: "Lịch sử" },
];

/** Tab Lịch sử: đã kết thúc + các lần trả về bếp (từ chối / yêu cầu sửa) */
function isHistoryListStatus(menu) {
  return menu.status === "completed" || menu.status === "rejected";
}

function lastHistoryEntry(menu) {
  const h = menu.statusHistory;
  if (!Array.isArray(h) || h.length === 0) return null;
  return h[h.length - 1];
}

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
    active:    { title: "Không có thực đơn đang áp dụng", sub: "Hãy áp dụng một thực đơn đã duyệt để hiển thị tại đây." },
    completed: {
      title: "Chưa có mục trong lịch sử",
      sub: "Đã kết thúc áp dụng, từ chối duyệt hoặc yêu cầu bếp chỉnh sửa đều được ghi tại đây.",
    },
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
          : tab === "completed"
            ? <HistoryIcon sx={{ fontSize: 36, color: "#9ca3af" }} />
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
  const [rejectDetail, setRejectDetail]     = useState("");
  const [rejectPresetSel, setRejectPresetSel] = useState({});
  const [confirmApply, setConfirmApply]     = useState(null);
  const [confirmEnd, setConfirmEnd]         = useState(null);
  const [confirmRequestEdit, setConfirmRequestEdit] = useState(null);
  const [requestEditDetail, setRequestEditDetail] = useState("");
  const [requestEditPresetSel, setRequestEditPresetSel] = useState({});

  const navigate       = useNavigate();
  const { user, logout } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [activeYear, setActiveYear]   = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // 1. Fetch current academic year
      const yearRes = await api.get("/school-admin/academic-years/current").catch(() => null);
      const activeAY = yearRes?.status === "success" ? yearRes.data : null;
      setActiveYear(activeAY);

      // 2. Fetch menus with year filter
      const params = { limit: 500 };
      if (activeAY?._id) {
        params.academicYearId = activeAY._id;
      }
      const res = await getMenus(params);
      const list = Array.isArray(res?.data) ? res.data : [];
      setMenus(list);
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const fetchMenus = () => fetchInitialData();

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

  const handleApply = async () => {
    if (!confirmApply) return;
    try {
      await applyMenu(confirmApply._id);
      toast.success("Đã áp dụng thực đơn");
      setConfirmApply(null);
      fetchMenus();
    } catch (e) {
      toast.error(e?.message || e?.data?.message || "Áp dụng thất bại");
    }
  };

  const handleEndMenu = async () => {
    if (!confirmEnd) return;
    try {
      await endMenu(confirmEnd._id);
      toast.success("Đã kết thúc và lưu vào lịch sử");
      setConfirmEnd(null);
      fetchMenus();
    } catch (e) {
      toast.error(e?.message || e?.data?.message || "Kết thúc thất bại");
    }
  };

  const handleReject = async () => {
    if (!confirmReject) return;
    const presets = MENU_REJECT_PRESETS.filter((p) => rejectPresetSel[p.id]).map((p) => p.id);
    const detail = rejectDetail.trim();
    if (presets.length === 0 && detail.length < 5) {
      toast.error("Chọn ít nhất một lý do gợi ý hoặc nhập chi tiết (tối thiểu 5 ký tự)");
      return;
    }
    try {
      await rejectMenu(confirmReject._id, { presets, detail });
      toast.success("Đã từ chối; đã ghi vào Lịch sử");
      setConfirmReject(null);
      setRejectDetail("");
      setRejectPresetSel({});
      fetchMenus();
    } catch (e) {
      toast.error(e?.message || e?.data?.message || "Từ chối thất bại");
    }
  };

  const handleRequestEditFromActive = async () => {
    if (!confirmRequestEdit) return;
    const presets = MENU_REJECT_PRESETS.filter((p) => requestEditPresetSel[p.id]).map((p) => p.id);
    const detail = requestEditDetail.trim();
    if (presets.length === 0 && detail.length < 5) {
      toast.error("Chọn ít nhất một lý do gợi ý hoặc nhập chi tiết (tối thiểu 5 ký tự)");
      return;
    }
    try {
      await requestEditFromActiveMenu(confirmRequestEdit._id, { presets, detail });
      toast.success("Đã gửi yêu cầu chỉnh sửa cho bếp; đã ghi vào Lịch sử");
      setConfirmRequestEdit(null);
      setRequestEditDetail("");
      setRequestEditPresetSel({});
      fetchMenus();
    } catch (e) {
      toast.error(e?.message || e?.data?.message || "Gửi yêu cầu thất bại");
    }
  };

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);
  const userName = user?.fullName || user?.username || "School Admin";

  const filtered =
    tab === "all"
      ? menus
      : tab === "completed"
        ? menus.filter(isHistoryListStatus)
        : menus.filter((m) => m.status === tab);

  const pendingCount = menus.filter((m) => m.status === "pending").length;
  const activeCount = menus.filter((m) => m.status === "active").length;
  const historyCount = menus.filter(isHistoryListStatus).length;

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
            Quản lý Thực đơn {activeYear ? `— ${activeYear.yearName}` : ""}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Xem xét và phê duyệt thực đơn của năm học {activeYear?.yearName || "hiện tại"}
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

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid #e5e7eb", mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ px: 2, "& .MuiTab-root": { fontWeight: 600, fontSize: 13, minHeight: 48 } }}
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
                  badge
                    ? <Stack direction="row" alignItems="center" gap={0.75}>{t.label}{badge}</Stack>
                    : t.label
                }
              />
            );
          })}
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
                      borderColor:
                        menu.status === "pending"
                          ? "#fde68a"
                          : menu.status === "active"
                            ? "#93c5fd"
                            : "#e5e7eb",
                      bgcolor:
                        menu.status === "pending"
                          ? "#fffbeb"
                          : menu.status === "active"
                            ? "#eff6ff"
                            : "#fff",
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
                        <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
                          <PersonIcon sx={{ fontSize: 15, color: "#9ca3af" }} />
                          <Typography variant="body2" color="text.secondary">
                            Tạo bởi: <strong>{menu.createdBy?.fullName || "Không rõ"}</strong>
                          </Typography>
                          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                          <Typography variant="body2" color="text.secondary">
                            {new Date(menu.createdAt).toLocaleDateString("vi-VN")}
                          </Typography>
                        </Stack>
                        {menu.status === "active" && menu.appliedAt && (
                          <Typography variant="caption" color="primary.main" display="block" mt={0.75}>
                            Áp dụng từ: {new Date(menu.appliedAt).toLocaleString("vi-VN")}
                          </Typography>
                        )}
                        {menu.status === "completed" && menu.endedAt && (
                          <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
                            Kết thúc: {new Date(menu.endedAt).toLocaleString("vi-VN")}
                          </Typography>
                        )}
                        {menu.status === "rejected" && (() => {
                          const last = lastHistoryEntry(menu);
                          const ctx =
                            last?.type === "request_edit_active"
                              ? "Yêu cầu chỉnh sửa từ thực đơn đang áp dụng"
                              : "Từ chối duyệt — bếp có thể chỉnh và gửi lại";
                          return (
                            <Typography variant="caption" color="error.main" display="block" mt={0.75}>
                              {ctx}
                            </Typography>
                          );
                        })()}
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
                                onClick={() => {
                                  setRejectDetail("");
                                  setRejectPresetSel({});
                                  setConfirmReject(menu);
                                }}
                                sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
                              >
                                Từ chối
                              </Button>
                            </Tooltip>
                          </>
                        )}
                        {menu.status === "approved" && (
                          <Tooltip title="Áp dụng làm thực đơn hiện tại của trường">
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              startIcon={<ApplyIcon />}
                              onClick={() => setConfirmApply(menu)}
                              sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
                            >
                              Áp dụng
                            </Button>
                          </Tooltip>
                        )}
                        {menu.status === "active" && (
                          <>
                            <Tooltip title="Gửi lại bếp chỉnh sửa (ghi vào Lịch sử)">
                              <Button
                                variant="outlined"
                                size="small"
                                color="secondary"
                                startIcon={<EditNoteIcon />}
                                onClick={() => {
                                  setRequestEditDetail("");
                                  setRequestEditPresetSel({});
                                  setConfirmRequestEdit(menu);
                                }}
                                sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
                              >
                                Yêu cầu chỉnh sửa
                              </Button>
                            </Tooltip>
                            <Tooltip title="Kết thúc và chuyển vào lịch sử">
                              <Button
                                variant="contained"
                                size="small"
                                color="warning"
                                startIcon={<EndMenuIcon />}
                                onClick={() => setConfirmEnd(menu)}
                                sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
                              >
                                Kết thúc
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
      <Dialog
        open={!!confirmReject}
        onClose={() => { setConfirmReject(null); setRejectDetail(""); setRejectPresetSel({}); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight={700}>Từ chối duyệt thực đơn</DialogTitle>
        <DialogContent>
          {confirmReject && (
            <Typography mb={2} color="text.secondary">
              Từ chối Thực đơn Tháng <strong>{confirmReject.month}/{confirmReject.year}</strong>. Nội dung sẽ gửi cho bộ phận bếp.
            </Typography>
          )}
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Gợi ý lý do (chọn một hoặc nhiều)
          </Typography>
          <FormGroup sx={{ mb: 2 }}>
            {MENU_REJECT_PRESETS.map((p) => (
              <FormControlLabel
                key={p.id}
                control={
                  <Checkbox
                    size="small"
                    checked={!!rejectPresetSel[p.id]}
                    onChange={() =>
                      setRejectPresetSel((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                    }
                  />
                }
                label={<Typography variant="body2">{p.label}</Typography>}
              />
            ))}
          </FormGroup>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Chi tiết lý do từ chối"
            placeholder="Mô tả cụ thể để bếp chỉnh sửa (bắt buộc nếu không chọn gợi ý nào ở trên, tối thiểu 5 ký tự)..."
            value={rejectDetail}
            onChange={(e) => setRejectDetail(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setConfirmReject(null);
              setRejectDetail("");
              setRejectPresetSel({});
            }}
          >
            Hủy
          </Button>
          <Button variant="contained" color="error" onClick={handleReject}>
            Xác nhận từ chối
          </Button>
        </DialogActions>
      </Dialog>

      {/* Yêu cầu chỉnh sửa (đang áp dụng) */}
      <Dialog
        open={!!confirmRequestEdit}
        onClose={() => {
          setConfirmRequestEdit(null);
          setRequestEditDetail("");
          setRequestEditPresetSel({});
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight={700}>Yêu cầu chỉnh sửa thực đơn đang áp dụng</DialogTitle>
        <DialogContent>
          {confirmRequestEdit && (
            <Typography mb={2} color="text.secondary">
              Thực đơn Tháng <strong>{confirmRequestEdit.month}/{confirmRequestEdit.year}</strong> sẽ ngừng áp dụng và được gửi lại bộ phận bếp. Mọi thao tác được lưu trong Lịch sử.
            </Typography>
          )}
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Gợi ý lý do (chọn một hoặc nhiều)
          </Typography>
          <FormGroup sx={{ mb: 2 }}>
            {MENU_REJECT_PRESETS.map((p) => (
              <FormControlLabel
                key={p.id}
                control={
                  <Checkbox
                    size="small"
                    checked={!!requestEditPresetSel[p.id]}
                    onChange={() =>
                      setRequestEditPresetSel((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                    }
                  />
                }
                label={<Typography variant="body2">{p.label}</Typography>}
              />
            ))}
          </FormGroup>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Chi tiết yêu cầu"
            placeholder="Mô tả cụ thể để bếp chỉnh sửa (bắt buộc nếu không chọn gợi ý nào ở trên, tối thiểu 5 ký tự)..."
            value={requestEditDetail}
            onChange={(e) => setRequestEditDetail(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setConfirmRequestEdit(null);
              setRequestEditDetail("");
              setRequestEditPresetSel({});
            }}
          >
            Hủy
          </Button>
          <Button variant="contained" color="secondary" onClick={handleRequestEditFromActive}>
            Gửi yêu cầu chỉnh sửa
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!confirmApply}
        title="Áp dụng thực đơn"
        message={
          confirmApply
            ? `Áp dụng Thực đơn Tháng ${confirmApply.month}/${confirmApply.year}? Thực đơn đang áp dụng (nếu có) sẽ được kết thúc và lưu lịch sử.`
            : ""
        }
        confirmText="Áp dụng"
        cancelText="Hủy"
        onConfirm={handleApply}
        onCancel={() => setConfirmApply(null)}
      />

      <ConfirmDialog
        open={!!confirmEnd}
        title="Kết thúc thực đơn"
        message={
          confirmEnd
            ? `Kết thúc Thực đơn Tháng ${confirmEnd.month}/${confirmEnd.year}? Thực đơn sẽ chuyển sang lịch sử.`
            : ""
        }
        confirmText="Kết thúc"
        cancelText="Hủy"
        onConfirm={handleEndMenu}
        onCancel={() => setConfirmEnd(null)}
      />
    </RoleLayout>
  );
}

export default MenuSchoolAdmin;
