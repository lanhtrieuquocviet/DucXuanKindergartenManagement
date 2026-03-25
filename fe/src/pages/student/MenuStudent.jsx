import { useEffect, useState } from "react";
import { getMenus } from "../../service/menu.api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChefHat, Calendar, CheckCircle, Clock, XCircle, PlayCircle, StopCircle, AlertCircle, ChevronRight } from "lucide-react";

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
      iconColor: "text-green-600",
    },
    pending: {
      label: "Chờ duyệt",
      color: "bg-amber-100 text-amber-700 border-amber-200",
      icon: Clock,
      iconColor: "text-amber-600",
    },
    rejected: {
      label: "Bị từ chối",
      color: "bg-red-100 text-red-700 border-red-200",
      icon: XCircle,
      iconColor: "text-red-600",
    },
    active: {
      label: "Đang áp dụng",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      icon: PlayCircle,
      iconColor: "text-blue-600",
    },
    completed: {
      label: "Đã kết thúc",
      color: "bg-purple-100 text-purple-700 border-purple-200",
      icon: StopCircle,
      iconColor: "text-purple-600",
    },
  };

  const getStatusConfig = (status) => {
    return (
      statusConfig[status] || {
        label: status,
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: AlertCircle,
        iconColor: "text-gray-600",
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-emerald-600 px-4 pt-4 pb-5 shadow-md">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors duration-200 text-white flex-shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">
                Thực đơn dinh dưỡng
              </h1>
              <p className="text-emerald-100 text-xs mt-0.5">
                Danh sách thực đơn hàng tháng
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded-full w-2/3" />
                    <div className="h-3 bg-gray-200 rounded-full w-1/3" />
                  </div>
                  <div className="w-5 h-5 bg-gray-200 rounded flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && menus.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ChefHat size={32} className="text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">
              Chưa có thực đơn
            </h3>
            <p className="text-sm text-gray-400">
              Hệ thống chưa có thực đơn dinh dưỡng nào được tạo.
            </p>
          </div>
        )}

        {/* Menu List */}
        {!loading && menus.length > 0 && (
          <div className="space-y-3">
            {menus.map((menu) => {
              const status = getStatusConfig(menu.status);
              const StatusIcon = status.icon;
              const isActive = menu.status === "active";

              return (
                <div
                  key={menu._id}
                  onClick={() => navigate(`/student/menus/${menu._id}`)}
                  className={`rounded-2xl p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform duration-150
                    ${
                      isActive
                        ? "bg-green-50 border border-green-100 border-l-4 border-l-emerald-500"
                        : "bg-white border border-gray-100"
                    }`}
                >
                  {/* Left: Calendar icon in colored rounded square */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-sm">
                    <Calendar size={22} className="text-white" />
                  </div>

                  {/* Center: Title + status badge */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">
                      Thực đơn Tháng {menu.month}/{menu.year}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <StatusIcon size={12} className={status.iconColor} />
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Right: Chevron arrow */}
                  <div className="flex-shrink-0 text-gray-300">
                    <ChevronRight size={18} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MenuStudent;
