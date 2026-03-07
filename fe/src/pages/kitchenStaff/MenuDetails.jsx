import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMenuDetail, submitMenu, updateDailyMenu } from "../../service/menu.api";
import { toast } from "react-toastify";
import FoodSelectorModal from "../../components/FoodSelectorModal";
import { Plus, X } from "lucide-react";
const days = ["mon", "tue", "wed", "thu", "fri"];

const dayMap = {
  mon: "Thứ hai",
  tue: "Thứ ba",
  wed: "Thứ tư",
  thu: "Thứ năm",
  fri: "Thứ sáu",
};

const mealTypes = [
  { key: "lunchFoods", label: "Bữa trưa" },
  { key: "afternoonFoods", label: "Bữa chiều" },
];

const statusMap = {
  draft: {
    label: "Nháp",
    color: "bg-gray-200 text-gray-700",
  },
  pending: {
    label: "Chờ duyệt",
    color: "bg-yellow-100 text-yellow-700",
  },
  approved: {
    label: "Đã duyệt",
    color: "bg-green-100 text-green-700",
  },
  active: {
    label: "Đang áp dụng",
    color: "bg-blue-100 text-blue-700",
  },
  completed: {
    label: "Hoàn thành",
    color: "bg-purple-100 text-purple-700",
  },
  rejected: {
    label: "Bị từ chối",
    color: "bg-red-100 text-red-700",
  },
};

function MenuDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  const [foodInput, setFoodInput] = useState("");

  useEffect(() => {
    fetchMenuDetail();
  }, []);

  const fetchMenuDetail = async () => {
    try {
      setLoading(true);

      const res = await getMenuDetail(id);

      setMenu(res.data);
    } catch (error) {
      toast.error("Không thể tải chi tiết thực đơn");
    } finally {
      setLoading(false);
    }
  };

const handleCellClick = (dailyMenuId, day, mealType) => {
  if (menu.status !== "draft") {
    toast.info("Chỉ chỉnh sửa khi menu ở trạng thái nháp");
    return;
  }

  const currentFoods =
    menu.weeks?.odd?.[day]?.[mealType] ||
    menu.weeks?.even?.[day]?.[mealType] ||
    [];

  setSelectedFoods(currentFoods);

  setSelectedCell({
    dailyMenuId,
    day,
    mealType,
  });

  setShowModal(true);
};

  
const handleSaveFoods = async (foods) => {
  try {
    const payload = {};

    payload[selectedCell.mealType] = foods.map((f) => f._id || f);

    await updateDailyMenu(selectedCell.dailyMenuId, payload);

    toast.success("Cập nhật món thành công");

    setShowModal(false);

    fetchMenuDetail();
  } catch (error) {
    toast.error("Cập nhật thất bại");
  }
};
const handleSubmitMenu = async () => {
  if (!window.confirm("Bạn có chắc muốn gửi thực đơn để duyệt?")) return;

  try {
    await submitMenu(menu._id);

    toast.success("Đã gửi thực đơn để duyệt");

    fetchMenuDetail(); // reload trạng thái
  } catch (error) {
    toast.error(error.response?.data?.message || "Gửi duyệt thất bại");
  }
};

const renderCell = (weekData, day, type) => {
  const dayMenu = weekData?.[day];
  if (!dayMenu) return null;

  const foods = dayMenu[type] || [];

  return (
    <div className="space-y-1 text-sm">
      {/* DANH SÁCH MÓN */}
      {foods.map((food) => (
        <div key={food._id} className="flex justify-between items-center group">
          <span>
            - {food.name} ({food.calories} kcal)
          </span>

          {/* NÚT XOÁ */}
          {menu.status === "draft" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFood(dayMenu._id, type, food._id, foods);
              }}
              className="text-red-500 opacity-0 group-hover:opacity-100"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ))}

      {/* DINH DƯỠNG */}
      {foods.length > 0 && (
        <div className="flex gap-3 text-xs text-gray-500 mt-2">
          <span>🔥 {dayMenu.totalCalories} kcal</span>
          <span>🥩 {dayMenu.totalProtein} g</span>
        </div>
      )}

      {/* NÚT THÊM */}
      {menu.status === "draft" && (
        <div className="flex justify-center mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCellClick(dayMenu._id, day, type);
            }}
            className="text-blue-500 text-xl hover:scale-110"
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  );

};

const removeFood = async (dailyMenuId, mealType, foodId, currentFoods) => {
  try {
    const newFoods = currentFoods
      .filter((f) => f._id !== foodId)
      .map((f) => f._id);

    const payload = {
      lunchFoods: [],
      afternoonFoods: [],
    };

    payload[mealType] = newFoods;

    await updateDailyMenu(dailyMenuId, payload);

    toast.success("Đã xoá món");

    fetchMenuDetail();
  } catch (error) {
    toast.error("Xoá món thất bại");
  }
};
  const renderWeek = (title, weekData) => (
    <div className="mb-10">
      <h2 className="font-semibold mb-3">* {title}</h2>

      <div className="overflow-x-auto border border-gray-300 rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="border border-gray-300 p-2 w-32 text-center">
                Bữa ăn
              </th>

              {days.map((day) => (
                <th key={day} className="border border-gray-300 p-2">
                  {dayMap[day]}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {mealTypes.map((meal) => (
              <tr key={meal.key} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2 font-medium bg-gray-100 text-center">
                  {meal.label}
                </td>

                {days.map((day) => {
                  const dailyMenuId = weekData?.[day]?._id;

                  return (
                    <td
                      key={day}
                      onClick={() =>
                        handleCellClick(dailyMenuId, day, meal.key)
                      }
                      className="border border-gray-300 p-3 align-top bg-white cursor-pointer hover:bg-blue-50"
                    >
                      {renderCell(weekData, day, meal.key)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) return <p>Đang tải dữ liệu...</p>;
  if (!menu) return null;

  return (
    <div className="p-6">
      {/* BACK */}
      <div className="flex items-center gap-3 mb-3">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-600">
          ← Quay lại
        </button>

        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            statusMap[menu.status]?.color
          }`}
        >
          {statusMap[menu.status]?.label}
        </span>
      </div>

      {/* REJECT REASON */}
      {menu.status === "rejected" && menu.rejectReason && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-red-500 text-lg">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-800 mb-1">
                Lý do từ chối
              </h3>
              <p className="text-red-700 text-sm">
                {menu.rejectReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold">
            Thực đơn Tháng {menu.month}/{menu.year}
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Tạo bởi: {menu.createdBy?.fullName} (
            {new Date(menu.createdAt).toLocaleDateString("vi-VN")})
          </p>
        </div>

        {menu.status === "draft" && (
          <button
            onClick={handleSubmitMenu}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Gửi duyệt
          </button>
        )}
      </div>

      {/* NUTRITION */}
      <div className="grid grid-cols-4 gap-4 bg-gray-50 border border-gray-300 rounded p-4 mb-8">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Calories</p>
          <p className="font-semibold text-lg">{menu.nutrition?.calories}</p>
          <p className="text-xs text-gray-400">kcal/ngày</p>
        </div>

        <div className="text-center">
          <p className="text-gray-500 text-sm">Protein</p>
          <p className="font-semibold text-lg">{menu.nutrition?.protein} g</p>
          <p className="text-xs text-gray-400">gram/ngày</p>
        </div>

        <div className="text-center">
          <p className="text-gray-500 text-sm">Chất béo</p>
          <p className="font-semibold text-lg">{menu.nutrition?.fat} g</p>
          <p className="text-xs text-gray-400">gram/ngày</p>
        </div>

        <div className="text-center">
          <p className="text-gray-500 text-sm">Tinh bột</p>
          <p className="font-semibold text-lg">{menu.nutrition?.carb} g</p>
          <p className="text-xs text-gray-400">gram/ngày</p>
        </div>
      </div>

      {renderWeek("Tuần lẻ", menu.weeks?.odd)}
      {renderWeek("Tuần chẵn", menu.weeks?.even)}

      {/* MODAL */}
      <FoodSelectorModal
        open={showModal}
        selectedFoods={selectedFoods}
        onClose={() => setShowModal(false)}
        onSave={handleSaveFoods}
      />
    </div>
  );
}

export default MenuDetail;
