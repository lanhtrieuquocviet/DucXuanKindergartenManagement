import { useEffect, useState } from "react";
import { getMenus } from "../../service/menu.api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Eye, ArrowLeft } from "lucide-react";

function MenuStudent() {
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
      console.log("API:", res);
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
    rejected: "bg-red-500",
    active: "bg-blue-500",
    completed: "bg-purple-500",
  };

  const statusText = {
    approved: "Đã duyệt",
    pending: "Chờ duyệt",
    rejected: "Bị từ chối",
    active: "Đang áp dụng",
    completed: "Đã kết thúc",
  };

  if (loading) {
    return <p className="p-6">Đang tải dữ liệu...</p>;
  }

  return (
    <div className="p-6 space-y-4">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 
          text-sm font-semibold
          bg-gray-50 border border-gray-200 
          rounded-xl shadow-sm
          hover:bg-gray-100 hover:-translate-y-[1px]
          transition-all duration-200"
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>

        <h1 className="text-xl font-bold">Thực đơn của trường</h1>
      </div>

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

          {/* BUTTON XEM */}
          <button
            onClick={() => navigate(`/student/menus/${menu._id}`)}
            className="flex items-center gap-2 border px-3 py-1 rounded-md text-sm hover:bg-gray-100"
          >
            <Eye size={18} />
            Xem
          </button>
        </div>
      ))}

      {menus.length === 0 && (
        <p className="text-gray-500 text-sm">Chưa có thực đơn nào</p>
      )}
    </div>
  );
}

export default MenuStudent;
