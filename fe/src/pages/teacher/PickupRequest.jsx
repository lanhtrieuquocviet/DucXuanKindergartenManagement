import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import RoleLayout from "../../layouts/RoleLayout";
import { get, post, ENDPOINTS } from "../../service/api";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  Box, Paper, Typography, Button, Select, MenuItem, FormControl,
  InputLabel, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, Alert, Skeleton, Stack, Dialog, IconButton, Avatar,
  ToggleButtonGroup, ToggleButton,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Close as CloseIcon,
  DirectionsCar as PickupIcon,
  HourglassEmpty as PendingIcon,
  CheckCircleOutline as ApprovedIcon,
  BlockOutlined as RejectedIcon,
} from "@mui/icons-material";

const STATUS_META = {
  pending:  { label: "Chờ duyệt", color: "warning",  icon: <PendingIcon sx={{ fontSize: 14 }} /> },
  approved: { label: "Đã duyệt",  color: "success",  icon: <ApprovedIcon sx={{ fontSize: 14 }} /> },
  rejected: { label: "Từ chối",   color: "error",    icon: <RejectedIcon sx={{ fontSize: 14 }} /> },
};

function PickupRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isInitializing } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [previewImage, setPreviewImage] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState("");

  const menuItems = useMemo(() => [
    { key: "classes",         label: "Lớp phụ trách" },
    { key: "students",        label: "Danh sách học sinh" },
    { key: "attendance",      label: "Điểm danh" },
    { key: "pickup-approval", label: "Đơn đưa đón" },
    { key: "schedule",        label: "Lịch dạy & hoạt động" },
    { key: "messages",        label: "Thông báo cho phụ huynh" },
  ], []);

  const activeKey = useMemo(() => {
    const path = location.pathname || "";
    if (path.startsWith("/teacher/attendance"))      return "attendance";
    if (path.startsWith("/teacher/pickup-approval")) return "pickup-approval";
    return "classes";
  }, [location.pathname]);

  const handleMenuSelect = (key) => {
    if (key === "classes")         { navigate("/teacher");                  return; }
    if (key === "attendance")      { navigate("/teacher/attendance");        return; }
    if (key === "pickup-approval") { navigate("/teacher/pickup-approval");   return; }
  };

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes("Teacher")) { navigate("/", { replace: true }); return; }
    fetchPickupRequests();
  }, [isInitializing, user, navigate]);

  const fetchPickupRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await get(ENDPOINTS.PICKUP.REQUESTS || "/pickup/requests");
      let data = res.data || [];
      if (filterStatus !== "all") data = data.filter((r) => r.status === filterStatus);
      setRequests(data);
    } catch (_) {
      setError("Không tải được danh sách. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setConfirmOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest) return;
    try {
      setError("");
      const payload = {
        requestId: selectedRequest._id,
        status: actionType === "approve" ? "approved" : "rejected",
      };
      await post(ENDPOINTS.PICKUP.UPDATE_STATUS || "/pickup/requests/status", payload);
      setRequests((prev) =>
        prev.map((r) => r._id === selectedRequest._id ? { ...r, status: payload.status } : r)
      );
      setSuccessMessage(actionType === "approve" ? "Đã duyệt thành công!" : "Đã từ chối đăng ký.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError(err.message || "Lỗi khi xử lý yêu cầu. Vui lòng thử lại.");
    } finally {
      setConfirmOpen(false);
      setSelectedRequest(null);
      setActionType("");
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const userName = user?.fullName || user?.username || "Giáo viên";

  return (
    <RoleLayout
      title="Phê duyệt người đưa đón"
      description="Xem và xử lý các đăng ký người đưa đón từ phụ huynh."
      menuItems={menuItems}
      activeKey={activeKey}
      onLogout={() => navigate("/login", { replace: true })}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate("/profile")}
      onMenuSelect={handleMenuSelect}
    >
      {/* Page header banner */}
      <Paper
        elevation={0}
        sx={{
          mb: 3, borderRadius: 3, overflow: 'hidden',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          position: 'relative',
        }}
      >
        <Box sx={{ position:'absolute', right:-20, top:-20, width:100, height:100, borderRadius:'50%', bgcolor:'rgba(255,255,255,0.08)' }} />
        <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5, display:'flex', alignItems:'center', gap:2, position:'relative', zIndex:1 }}>
          <Avatar sx={{ width:48, height:48, bgcolor:'rgba(255,255,255,0.2)' }}>
            <PickupIcon sx={{ color:'white', fontSize:26 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700} color="white">
              Phê duyệt người đưa đón
            </Typography>
            <Typography variant="body2" sx={{ color:'rgba(255,255,255,0.8)' }}>
              Các đăng ký từ phụ huynh chờ giáo viên xác nhận
            </Typography>
          </Box>
          {pendingCount > 0 && (
            <Chip
              label={`${pendingCount} chờ duyệt`}
              sx={{ ml:'auto', bgcolor:'rgba(255,255,255,0.25)', color:'white', fontWeight:700, fontSize:13 }}
            />
          )}
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}
      >
        {/* Toolbar */}
        <Box
          sx={{
            px: { xs: 2, md: 3 }, py: 2,
            borderBottom: "1px solid", borderColor: "divider",
            display: "flex", flexWrap: "wrap",
            alignItems: "center", justifyContent: "space-between", gap: 2,
            bgcolor: 'grey.50',
          }}
        >
          <ToggleButtonGroup
            value={filterStatus}
            exclusive
            size="small"
            onChange={(_, val) => { if (val) setFilterStatus(val); }}
            sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, fontSize: 12, px: 2 } }}
          >
            <ToggleButton value="pending">Chờ duyệt</ToggleButton>
            <ToggleButton value="approved">Đã duyệt</ToggleButton>
            <ToggleButton value="rejected">Từ chối</ToggleButton>
            <ToggleButton value="all">Tất cả</ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchPickupRequests}
            disabled={loading}
            size="small"
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Làm mới
          </Button>
        </Box>

        {/* Alerts */}
        {error && <Alert severity="error" sx={{ mx: 3, mt: 2, borderRadius: 2 }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mx: 3, mt: 2, borderRadius: 2 }}>{successMessage}</Alert>}

        {/* Table */}
        {loading ? (
          <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={60} />)}
          </Box>
        ) : requests.length === 0 ? (
          <Box sx={{ py: 10, textAlign: "center" }}>
            <Avatar sx={{ width: 60, height: 60, bgcolor: "grey.100", mx: "auto", mb: 2 }}>
              <PickupIcon sx={{ color: "grey.400", fontSize: 30 }} />
            </Avatar>
            <Typography variant="body1" fontWeight={600} color="text.secondary">
              Không có đăng ký nào{filterStatus === "pending" ? " đang chờ duyệt" : ""}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Khi phụ huynh đăng ký, danh sách sẽ hiển thị tại đây.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    "& th": {
                      bgcolor: "grey.50", fontWeight: 700, fontSize: 12,
                      color: "text.secondary", textTransform: "uppercase",
                      letterSpacing: 0.5, py: 1.5,
                      borderBottom: "2px solid", borderColor: "divider",
                    },
                  }}
                >
                  <TableCell>Học sinh</TableCell>
                  <TableCell>Người đăng ký</TableCell>
                  <TableCell>Quan hệ</TableCell>
                  <TableCell>Số điện thoại</TableCell>
                  <TableCell align="center">Ảnh</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell align="center" sx={{ minWidth: 160 }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((req) => {
                  const meta = STATUS_META[req.status] || { label: req.status, color: "default" };
                  const isPending = req.status === "pending";
                  return (
                    <TableRow
                      key={req._id}
                      hover
                      sx={{
                        "&:last-child td": { border: 0 },
                        bgcolor: isPending ? "rgba(245,158,11,0.03)" : "transparent",
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 34, height: 34, fontSize: 13, fontWeight: 700,
                              background: "linear-gradient(135deg,#f59e0b,#d97706)",
                              color: "white",
                            }}
                          >
                            {req.student?.fullName?.[0] || "?"}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>
                            {req.student?.fullName || "—"}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: "grey.200", fontSize: 12 }}>
                            {req.fullName?.[0] || "?"}
                          </Avatar>
                          <Typography variant="body2">{req.fullName}</Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={req.relation}
                          size="small"
                          variant="outlined"
                          sx={{ height: 22, fontSize: 11, fontWeight: 600 }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                          {req.phone}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        {req.imageUrl ? (
                          <Box
                            component="img"
                            src={req.imageUrl}
                            alt={req.fullName}
                            onClick={() => setPreviewImage(req.imageUrl)}
                            sx={{
                              width: 48, height: 48,
                              borderRadius: 2, objectFit: "cover",
                              border: "2px solid", borderColor: "divider",
                              cursor: "pointer",
                              transition: "all 0.15s",
                              "&:hover": { transform: "scale(1.1)", boxShadow: 3, borderColor: "primary.main" },
                            }}
                          />
                        ) : (
                          <Avatar sx={{ width: 48, height: 48, bgcolor: "grey.100", mx: "auto" }}>
                            <Typography variant="caption" color="text.disabled">N/A</Typography>
                          </Avatar>
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          label={meta.label}
                          icon={meta.icon}
                          color={meta.color}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: 11, height: 24 }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        {isPending ? (
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<ApproveIcon sx={{ fontSize: "14px !important" }} />}
                              onClick={() => handleAction(req, "approve")}
                              sx={{ textTransform: "none", fontSize: 12, fontWeight: 700, borderRadius: 2, boxShadow: "none" }}
                            >
                              Duyệt
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<RejectIcon sx={{ fontSize: "14px !important" }} />}
                              onClick={() => handleAction(req, "reject")}
                              sx={{ textTransform: "none", fontSize: 12, fontWeight: 700, borderRadius: 2 }}
                            >
                              Từ chối
                            </Button>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title={actionType === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
        message={
          actionType === "approve"
            ? `Bạn có chắc muốn duyệt "${selectedRequest?.fullName}" (${selectedRequest?.relation}) cho học sinh "${selectedRequest?.student?.fullName}"?`
            : `Bạn có chắc muốn từ chối "${selectedRequest?.fullName}" (${selectedRequest?.relation})?`
        }
        confirmText={actionType === "approve" ? "Duyệt" : "Từ chối"}
        onConfirm={confirmAction}
        onCancel={() => { setConfirmOpen(false); setSelectedRequest(null); setActionType(""); }}
      />

      {/* Image preview dialog */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, bgcolor: "transparent", boxShadow: "none" } } }}
      >
        <Box sx={{ position: "relative" }}>
          <IconButton
            onClick={() => setPreviewImage(null)}
            sx={{
              position: "absolute", top: 8, right: 8,
              bgcolor: "rgba(0,0,0,0.55)", color: "white",
              "&:hover": { bgcolor: "rgba(0,0,0,0.8)" }, zIndex: 1,
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          {previewImage && (
            <Box
              component="img"
              src={previewImage}
              alt="Preview"
              sx={{ width: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 3, display: "block" }}
            />
          )}
        </Box>
      </Dialog>
    </RoleLayout>
  );
}

export default PickupRequest;
