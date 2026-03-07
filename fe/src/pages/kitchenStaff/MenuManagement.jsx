import { useState, useEffect } from "react";
import { getMenus} from "../../service/menu.api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
function MenuManagement() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
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
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Quản lý Thực đơn</h1>

        <button
          onClick={() => navigate("/kitchen/menus/create")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          + Tạo mới
        </button>
      </div>

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

            <button
              onClick={() => navigate(`/kitchen/menus/${menu._id}`)}
              className="border px-3 py-1 rounded-md text-sm"
            >
              Xem
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MenuManagement;
