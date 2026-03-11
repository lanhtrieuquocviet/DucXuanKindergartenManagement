import { useEffect, useState } from "react";
import { getMenus } from "../../service/menu.api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Eye, ArrowLeft, Calendar, User, ChefHat, Clock, CheckCircle, AlertCircle, XCircle, PlayCircle, StopCircle } from "lucide-react";

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

  const statusConfig = {
    approved: {
      label: "Đã duyệt",
      color: "bg-green-100 text-green-700 border-green-200",
      icon: CheckCircle,
      iconColor: "text-green-600"
    },
    pending: {
      label: "Chờ duyệt",
      color: "bg-yellow-100 text-yellow-700 border-yellow-200",
      icon: Clock,
      iconColor: "text-yellow-600"
    },
    rejected: {
      label: "Bị từ chối",
      color: "bg-red-100 text-red-700 border-red-200",
      icon: XCircle,
      iconColor: "text-red-600"
    },
    active: {
      label: "Đang áp dụng",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      icon: PlayCircle,
      iconColor: "text-blue-600"
    },
    completed: {
      label: "Đã kết thúc",
      color: "bg-purple-100 text-purple-700 border-purple-200",
      icon: StopCircle,
      iconColor: "text-purple-600"
    },
  };

  const getStatusConfig = (status) => {
    return statusConfig[status] || {
      label: status,
      color: "bg-gray-100 text-gray-700 border-gray-200",
      icon: AlertCircle,
      iconColor: "text-gray-600"
    };
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách thực đơn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2
            text-sm font-semibold
            bg-gray-100 border border-gray-200
            rounded-xl shadow-sm
            hover:bg-gray-200 hover:-translate-y-[1px]
            transition-all duration-200"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ChefHat className="text-blue-600" size={28} />
              Thực đơn của trường
            </h1>
            <p className="text-sm text-gray-600 mt-1">Danh sách các thực đơn dinh dưỡng hàng tháng</p>
          </div>
        </div>
      </div>

      {/* MENU LIST */}
      <div className="space-y-4">
        {menus.map((menu) => {
          const status = getStatusConfig(menu.status);
          const StatusIcon = status.icon;

          return (
            <div
              key={menu._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6
              hover:shadow-lg hover:border-gray-200 transition-all duration-300
              group cursor-pointer"
              onClick={() => navigate(`/student/menus/${menu._id}`)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100
                      rounded-xl flex items-center justify-center">
                        <Calendar className="text-blue-600" size={20} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-gray-800 mb-3">
                        Thực đơn Tháng {menu.month}/{menu.year}
                      </h2>

                      <div className="flex items-center gap-2">
                        <StatusIcon size={16} className={status.iconColor} />
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/student/menus/${menu._id}`);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white
                    rounded-xl font-medium hover:bg-blue-700 hover:shadow-lg
                    transition-all duration-200 group-hover:bg-blue-700"
                  >
                    <Eye size={18} />
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {menus.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <ChefHat className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có thực đơn nào</h3>
            <p className="text-gray-500">Hệ thống chưa có thực đơn dinh dưỡng nào được tạo.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MenuStudent;
