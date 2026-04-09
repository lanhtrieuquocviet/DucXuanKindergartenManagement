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
  ToggleButtonGroup, ToggleButton, useMediaQuery, useTheme, TextField,
} from "@mui/material";
import { EventBusy as EventBusyIcon } from "@mui/icons-material";
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

// ── Mobile card cho từng đơn đưa đón ──
function RequestCard({ req, onAction, onPreviewImage }) {
  const meta = STATUS_META[req.status] || { label: req.status, color: "default" };
  const isPending = req.status === "pending";
  const isRejected = req.status === "rejected";
  
  return (
    <Box
      sx={{
        px: 2, py: 1.75,
        borderBottom: "1px solid", borderColor: "divider",
        bgcolor: isPending ? "rgba(245,158,11,0.03)" : "white",
        "&:last-child": { borderBottom: 0 },
      }}
    >
      {/* Row 1: Học sinh + Trạng thái */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        <Avatar
          sx={{
            width: 36, height: 36, fontSize: 14, fontWeight: 700,
            background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", flexShrink: 0,
          }}
        >
          {req.student?.fullName?.[0] || "?"}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>{req.student?.fullName || "—"}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {req.fullName} · {req.relation}
          </Typography>
        </Box>
        <Chip label={meta.label} icon={meta.icon} color={meta.color} size="small" sx={{ fontWeight: 700, fontSize: 11, height: 22 }} />
      </Box>

      {/* Row 2: SĐT + Ảnh */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: isPending || isRejected ? 1 : 0, pl: 0.5 }}>
        <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 600, color: "text.secondary" }}>
          📞 {req.phone}
        </Typography>
        {req.imageUrl && (
          <Box
            component="img"
            src={req.imageUrl}
            alt={req.fullName}
            onClick={() => onPreviewImage(req.imageUrl)}
            sx={{
              width: 40, height: 40, borderRadius: 1.5, objectFit: "cover",
              border: "2px solid", borderColor: "divider", cursor: "pointer", ml: "auto", flexShrink: 0,
              "&:hover": { borderColor: "primary.main", boxShadow: 2 },
            }}
          />
        )}
      </Box>

      {/* Rejected reason */}
      {isRejected && req.rejectedReason && (
        <Box sx={{ pl: 0.5, pr: 0.5, mb: 1 }}>
          <Alert severity="error" sx={{ py: 0.5, px: 1.5, fontSize: 12, borderRadius: 1.5 }}>
            <Typography variant="caption" fontWeight={600}>
              Lý do từ chối:
            </Typography>
            <Typography variant="caption" sx={{ display: "block", mt: 0.25 }}>
              {req.rejectedReason}
            </Typography>
          </Alert>
        </Box>
      )}

      {/* Row 3: Actions (chỉ khi pending) */}
      {isPending && (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small" variant="contained" color="success"
            startIcon={<ApproveIcon sx={{ fontSize: "13px !important" }} />}
            onClick={() => onAction(req, "approve")}
            sx={{ textTransform: "none", fontSize: 12, fontWeight: 700, borderRadius: 2, boxShadow: "none", flex: 1 }}
          >
            Duyệt
          </Button>
          <Button
            size="small" variant="outlined" color="error"
            startIcon={<RejectIcon sx={{ fontSize: "13px !important" }} />}
            onClick={() => onAction(req, "reject")}
            sx={{ textTransform: "none", fontSize: 12, fontWeight: 700, borderRadius: 2, flex: 1 }}
          >
            Từ chối
          </Button>
        </Box>
      )}
    </Box>
  );
}

function PickupRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isInitializing, hasPermission } = useAuth();

  const [myClasses, setMyClasses] = useState(null); // null = chưa load
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [previewImage, setPreviewImage] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState("");
  const [allRequests, setAllRequests] = useState([]);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);



  const menuItems = useMemo(() => [
    { key: "classes",          label: "Lớp phụ trách" },
    { key: "students",         label: "Danh sách học sinh" },
    { key: "attendance",       label: "Điểm danh" },
    { key: "pickup-approval",  label: "Đơn đưa đón" },
    { key: "schedule",         label: "Lịch dạy & hoạt động" },
    { key: "contact-book",     label: "Sổ liên lạc điện tử" },
    { key: "purchase-request", label: "Cơ sở vật chất" },
    { key: "class-assets",     label: "Tài sản lớp" },
    ...(hasPermission("MANAGE_INSPECTION") ? [{ key: "asset-inspection", label: "Kiểm kê tài sản" }] : []),
  ], [hasPermission]);

  const activeKey = useMemo(() => {
    const path = location.pathname || "";
    if (path.startsWith("/teacher/contact-book"))    return "contact-book";
    if (path.startsWith("/teacher/attendance"))      return "attendance";
    if (path.startsWith("/teacher/pickup-approval")) return "pickup-approval";
    if (path.startsWith("/teacher/purchase-request")) return "purchase-request";
    if (path.startsWith("/teacher/class-assets"))    return "class-assets";
    if (path.startsWith("/teacher/asset-inspection")) return "asset-inspection";
    return "classes";
  }, [location.pathname]);

  const handleMenuSelect = (key) => {
    if (key === "classes")          { navigate("/teacher");                    return; }
    if (key === "contact-book")     { navigate("/teacher/contact-book");       return; }
    if (key === "attendance")       { navigate("/teacher/attendance");          return; }
    if (key === "pickup-approval")  { navigate("/teacher/pickup-approval");     return; }
    if (key === "purchase-request") { navigate("/teacher/purchase-request");    return; }
    if (key === "class-assets")     { navigate("/teacher/class-assets");        return; }
    if (key === "asset-inspection") { navigate("/teacher/asset-inspection");    return; }
  };

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes("Teacher")) { navigate("/", { replace: true }); return; }

    // Kiểm tra giáo viên có được phân công lớp không
    get(ENDPOINTS.CLASSES.LIST).then((res) => {
      const all = res.data || [];
      const mine = all.filter((c) => (c.teacherIds || []).some((t) => {
        const uid = t?.userId?._id || t?.userId || t?._id || t;
        return uid?.toString() === user._id?.toString();
      }));
      setMyClasses(mine);
      if (mine.length > 0) fetchPickupRequests();
      else setLoading(false);
    }).catch(() => {
      setMyClasses([]);
      setLoading(false);
    });
  }, [isInitializing, user, navigate]);

 const fetchPickupRequests = async () => {
   try {
     setLoading(true);
     setError("");

     const res = await get(ENDPOINTS.PICKUP.REQUESTS || "/pickup/requests");
     const data = res.data || [];

     setAllRequests(data);
     setRequests(data);
   } catch (_) {
     setError("Không tải được danh sách. Vui lòng thử lại.");
   } finally {
     setLoading(false);
   }
 };
 useEffect(() => {
   if (filterStatus === "all") {
     setRequests(allRequests);
   } else {
     setRequests(allRequests.filter((r) => r.status === filterStatus));
   }
 }, [filterStatus, allRequests]);

  const handleAction = (request, type) => {
    setSelectedRequest(request);
    if (type === "reject") {
      setRejectReason("");
      setRejectDialogOpen(true);
    } else {
      setActionType(type);
      setConfirmOpen(true);
    }
  };

  // approval handler (used by confirm dialog for approve)
  const confirmAction = async () => {
    if (!selectedRequest) return;
    try {
      setError("");
      const payload = {
        requestId: selectedRequest._id,
        status: "approved",
      };
      await post(ENDPOINTS.PICKUP.UPDATE_STATUS || "/pickup/requests/status", payload);
      setRequests((prev) =>
        prev.map((r) =>
          r._id === selectedRequest._id ? { ...r, status: "approved" } : r
        )
      );
      setSuccessMessage("Đã duyệt thành công!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError(err.message || "Lỗi khi xử lý yêu cầu. Vui lòng thử lại.");
    } finally {
      setConfirmOpen(false);
      setSelectedRequest(null);
    }
  };

  const confirmReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) return;
    try {
      setError("");
      const payload = {
        requestId: selectedRequest._id,
        status: "rejected",
        rejectedReason: rejectReason.trim(),
      };
      await post(ENDPOINTS.PICKUP.UPDATE_STATUS || "/pickup/requests/status", payload);
      setRequests((prev) =>
        prev.map((r) =>
          r._id === selectedRequest._id
            ? { ...r, status: "rejected", rejectedReason: rejectReason.trim() }
            : r
        )
      );
      setSuccessMessage("Đã từ chối đăng ký với lý do được cung cấp.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError(err.message || "Lỗi khi từ chối yêu cầu. Vui lòng thử lại.");
    } finally {
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectReason("");
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const userName = user?.fullName || user?.username || "Giáo viên";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
      {/* Chưa được phân công lớp */}
      {myClasses !== null && myClasses.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
          <Paper elevation={0} sx={{ textAlign: 'center', p: 5, borderRadius: 3, border: '1px solid', borderColor: 'divider', maxWidth: 420 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'grey.100', mx: 'auto', mb: 2 }}>
              <EventBusyIcon sx={{ fontSize: 34, color: 'grey.400' }} />
            </Avatar>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Chưa được phân công lớp
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Giáo viên này chưa được phân công vào lớp nào. Vui lòng liên hệ quản trị viên để được phân công.
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Page header banner */}
      {(myClasses === null || myClasses.length > 0) && <><Paper
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
            sx={{ flexWrap: 'wrap', '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, fontSize: 12, px: { xs: 1.25, sm: 2 } } }}
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

        {/* Content */}
        {loading ? (
          <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={isMobile ? 100 : 60} />)}
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
        ) : isMobile ? (
          /* ── Mobile: Card list ── */
          <Box>
            {requests.map((req) => (
              <RequestCard
                key={req._id}
                req={req}
                onAction={handleAction}
                onPreviewImage={setPreviewImage}
              />
            ))}
          </Box>
        ) : (
          /* ── Desktop: Table ── */
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
                  const isRejected = req.status === "rejected";
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
                              background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white",
                            }}
                          >
                            {req.student?.fullName?.[0] || "?"}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>{req.student?.fullName || "—"}</Typography>
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
                        <Chip label={req.relation} size="small" variant="outlined" sx={{ height: 22, fontSize: 11, fontWeight: 600 }} />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>{req.phone}</Typography>
                      </TableCell>

                      <TableCell align="center">
                        {req.imageUrl ? (
                          <Box
                            component="img" src={req.imageUrl} alt={req.fullName}
                            onClick={() => setPreviewImage(req.imageUrl)}
                            sx={{
                              width: 48, height: 48, borderRadius: 2, objectFit: "cover",
                              border: "2px solid", borderColor: "divider", cursor: "pointer",
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
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                          <Chip label={meta.label} icon={meta.icon} color={meta.color} size="small" sx={{ fontWeight: 700, fontSize: 11, height: 24 }} />
                          {isRejected && req.rejectedReason && (
                            <Alert severity="error" sx={{ py: 0.25, px: 1, fontSize: 10, borderRadius: 1, minWidth: 120 }}>
                              <Typography variant="caption" fontWeight={600} sx={{ fontSize: 10 }}>
                                Lý do: {req.rejectedReason}
                              </Typography>
                            </Alert>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        {isPending ? (
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button
                              size="small" variant="contained" color="success"
                              startIcon={<ApproveIcon sx={{ fontSize: "14px !important" }} />}
                              onClick={() => handleAction(req, "approve")}
                              sx={{ textTransform: "none", fontSize: 12, fontWeight: 700, borderRadius: 2, boxShadow: "none" }}
                            >
                              Duyệt
                            </Button>
                            <Button
                              size="small" variant="outlined" color="error"
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

      {/* Confirm dialog for approve */}
      <ConfirmDialog
        open={confirmOpen}
        title="Xác nhận duyệt"
        message={`Bạn có chắc muốn duyệt "${selectedRequest?.fullName}" (${selectedRequest?.relation}) cho học sinh "${selectedRequest?.student?.fullName}"?`}
        confirmText="Duyệt"
        onConfirm={confirmAction}
        onCancel={() => { setConfirmOpen(false); setSelectedRequest(null); setActionType(""); }}
      />

      {/* Reject dialog with reason */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => { setRejectDialogOpen(false); setSelectedRequest(null); setRejectReason(""); }}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: "error.main" }}>
              <RejectIcon sx={{ color: "white" }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Từ chối đăng ký đưa đón
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vui lòng nhập lý do từ chối
              </Typography>
            </Box>
          </Box>

          {selectedRequest && (
            <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Thông tin đăng ký:
              </Typography>
              <Typography variant="body2">
                Học sinh: {selectedRequest.student?.fullName}
              </Typography>
              <Typography variant="body2">
                Người đăng ký: {selectedRequest.fullName} ({selectedRequest.relation})
              </Typography>
              <Typography variant="body2">
                SĐT: {selectedRequest.phone}
              </Typography>
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Lý do từ chối *
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Nhập lý do từ chối đăng ký này..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                }
              }}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => { setRejectDialogOpen(false); setSelectedRequest(null); setRejectReason(""); }}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Hủy
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={confirmReject}
              disabled={!rejectReason.trim()}
              sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
            >
              Từ chối
            </Button>
          </Box>
        </Box>
      </Dialog>

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
      </>}
    </RoleLayout>
  );
}

export default PickupRequest;
