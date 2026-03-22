import { useState, useEffect } from "react";
import { getMenus, approveMenu, rejectMenu } from "../../service/menu.api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import RoleLayout from "../../layouts/RoleLayout";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import { get, ENDPOINTS } from "../../service/api";
import { Check, Eye, X } from "lucide-react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from "@mui/material";

function MenuSchoolAdmin() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);

  const [confirmApprove, setConfirmApprove] = useState(null);
  const [confirmReject, setConfirmReject] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await getMenus();
      setMenus(res.data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách thực đơn");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await approveMenu(confirmApprove._id);

      toast.success("Đã duyệt thực đơn");

      setConfirmApprove(null);
      fetchMenus();
    } catch (error) {
      toast.error("Duyệt thất bại");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      await rejectMenu(confirmReject._id, rejectReason);

      toast.success("Đã từ chối thực đơn");

      setConfirmReject(null);
      setRejectReason("");
      fetchMenus();
    } catch (error) {
      toast.error("Từ chối thất bại");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const menuItems = [
    { key: "overview", label: "Tổng quan trường" },
    {
      key: "academic-years",
      label: "Quản lý năm học",
      children: [
        { key: "academic-year-setup", label: "Thiết lập năm học" },
        { key: "academic-plan", label: "Thiết lập kế hoạch" },
        { key: "academic-students", label: "Danh sách lớp học" },
        { key: 'academic-curriculum', label: 'Chương trình giáo dục' },
        { key: 'academic-schedule', label: 'Thời gian biểu' },
        { key: 'academic-report', label: 'Báo cáo & thống kê' },
      ],
    },
    { key: "classes", label: "Lớp học" },
    { key: "menu", label: "Quản lý thực đơn" },
    { key: "teachers", label: "Giáo viên" },
    { key: "students", label: "Học sinh & phụ huynh" },
    { key: "assets", label: "Quản lý tài sản" },
    { key: "reports", label: "Báo cáo của trường" },
    { key: "contacts", label: "Liên hệ" },
    { key: "qa", label: "Câu hỏi" },
    { key: "blogs", label: "Quản lý blog" },
    { key: "documents", label: "Quản lý tài liệu" },
    { key: "public-info", label: "Thông tin công khai" },
    { key: "attendance", label: "Quản lý điểm danh" },
  ];

  const userName = user?.fullName || user?.username || "School Admin";

  const handleViewProfile = () => {
    navigate("/profile");
  };

  const handleMenuSelect = async (key) => {
    if (key === "overview") navigate("/school-admin");
    if (key === "academic-years" || key === "academic-year-setup")
      navigate("/school-admin/academic-years");
    if (key === "academic-curriculum") navigate("/school-admin/curriculum");
    if (key === "academic-schedule") navigate("/school-admin/timetable");
    if (key === "academic-plan") navigate("/school-admin/academic-plan");
    if (key === "academic-report") {
      try {
        const resp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT);
        const yearId = resp?.status === "success" ? resp?.data?._id : null;
        if (yearId) navigate(`/school-admin/academic-years/${yearId}/report`);
        else navigate("/school-admin/academic-years");
      } catch (_) {
        navigate("/school-admin/academic-years");
      }
      return;
    }
    if (key === "academic-students") navigate("/school-admin/class-list");
    if (key === "classes") navigate("/school-admin/classes");
    if (key === "menu") navigate("/school-admin/menus");
    if (key === "teachers") navigate("/school-admin/teachers");
    if (key === "students") navigate("/school-admin/students");
    if (key === "contacts") navigate("/school-admin/contacts");
    if (key === "qa") navigate("/school-admin/qa");
    if (key === "blogs") navigate("/school-admin/blogs");
    if (key === "documents") navigate("/school-admin/documents");
    if (key === "public-info") navigate("/school-admin/public-info");
    if (key === "attendance") navigate("/school-admin/attendance/overview");
  };

  const statusColor = {
    approved: "bg-green-500",
    pending: "bg-yellow-500",
    draft: "bg-gray-400",
    rejected: "bg-red-500",
    active: "bg-blue-500",
    completed: "bg-purple-500",
  };

  const statusText = {
    approved: "Đã duyệt",
    pending: "Chờ duyệt",
    draft: "Nháp",
    rejected: "Bị từ chối",
    active: "Đang áp dụng",
    completed: "Đã kết thúc",
  };

  if (loading) {
    return <p>Đang tải dữ liệu...</p>;
  }

  return (
    <RoleLayout
      title="Quản lý Thực đơn"
      description="Danh sách thực đơn của trường"
      menuItems={menuItems}
      activeKey="menu"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
      <div className="space-y-4">
        {menus.map((menu) => (
          <div
            key={menu._id}
            className="bg-white rounded-xl shadow p-4 flex justify-between items-center"
          >
            <div>
              <h2 className="font-semibold">
                Thực đơn Tháng {menu.month}/{menu.year}
              </h2>

              <p className="text-sm text-gray-500">
                Tạo bởi: {menu.createdBy?.fullName || "Không rõ"} -{" "}
                {new Date(menu.createdAt).toLocaleDateString("vi-VN")}
              </p>

              <span
                className={`text-xs text-white px-2 py-1 rounded ${
                  statusColor[menu.status] || "bg-gray-400"
                }`}
              >
                {statusText[menu.status] || menu.status}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/school-admin/menus/${menu._id}`)}
                className="flex items-center gap-2 border px-3 py-1 rounded-md text-sm hover:bg-gray-100"
              >
                <Eye size={16} />
                Xem
              </button>

              {menu.status === "pending" && (
                <>
                  <button
                    onClick={() => setConfirmApprove(menu)}
                    className="flex items-center bg-green-500 text-white px-3 py-1 rounded-md text-sm"
                  >
                    <Check size={18} />
                    Duyệt
                  </button>

                  <button
                    onClick={() => setConfirmReject(menu)}
                    className="flex items-center bg-red-500 text-white px-3 py-1 rounded-md text-sm"
                  >
                    <X size={18} />
                    Từ chối
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

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
        onClose={() => setConfirmReject(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Từ chối duyệt thực đơn</DialogTitle>

        <DialogContent>
          {confirmReject && (
            <Typography mb={2}>
              Bạn có chắc muốn từ chối Thực đơn Tháng {confirmReject.month}/
              {confirmReject.year}?
            </Typography>
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Lý do từ chối"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setConfirmReject(null)}>Hủy</Button>

          <Button variant="contained" color="error" onClick={handleReject}>
            Xác nhận từ chối
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}

export default MenuSchoolAdmin;
