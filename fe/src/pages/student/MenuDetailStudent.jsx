import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMenuDetail } from "../../service/menu.api";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";

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
};

function MenuDetailStudent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const renderCell = (weekData, day, type) => {
    const dayMenu = weekData?.[day];
    if (!dayMenu) return null;

    const foods = dayMenu[type] || [];

    if (!foods.length) {
      return <span className="text-gray-400 text-xs italic">Không có món</span>;
    }

    return (
      <div className="text-sm space-y-1">
        {foods.map((food, index) => (
          <div key={index}>
            • {food.name} ({food.calories} kcal)
          </div>
        ))}

        <div className="flex gap-3 text-xs text-gray-500 mt-2">
          <span>🔥 {dayMenu.totalCalories} kcal</span>
          <span>🥩 {dayMenu.totalProtein} g</span>
        </div>
      </div>
    );
  };

  const renderWeek = (title, weekData) => (
    <div className="mb-10">
      <h2 className="font-semibold mb-3 text-lg">{title}</h2>

      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="border border-gray-200 p-3 w-32 text-center">
                Bữa ăn
              </th>

              {days.map((day) => (
                <th key={day} className="border border-gray-200 p-3">
                  {dayMap[day]}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {mealTypes.map((meal) => (
              <tr key={meal.key}>
                <td className="border border-gray-200 p-3 font-medium bg-gray-50 text-center">
                  {meal.label}
                </td>

                {days.map((day) => (
                  <td
                    key={day}
                    className="border border-gray-200 p-3 align-top bg-white"
                  >
                    {renderCell(weekData, day, meal.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) return <p className="p-6">Đang tải dữ liệu...</p>;
  if (!menu) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium 
          bg-white border border-gray-200 rounded-lg shadow-sm
          hover:bg-gray-50 transition"
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>

        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            statusMap[menu.status]?.color
          }`}
        >
          {statusMap[menu.status]?.label || menu.status}
        </span>
      </div>

      {/* TITLE */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Thực đơn Tháng {menu.month}/{menu.year}
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Tạo bởi: {menu.createdBy?.fullName} (
          {new Date(menu.createdAt).toLocaleDateString("vi-VN")})
        </p>
      </div>

      {/* NUTRITION */}
      <div className="grid grid-cols-4 gap-4 bg-gray-50 border border-gray-200 rounded-xl p-5 mb-10">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Calories</p>
          <p className="font-semibold text-lg">{menu.nutrition?.calories}</p>
          <p className="text-xs text-gray-400">kcal/ngày</p>
        </div>

        <div className="text-center">
          <p className="text-gray-500 text-sm">Protein</p>
          <p className="font-semibold text-lg">{menu.nutrition?.protein} g</p>
        </div>

        <div className="text-center">
          <p className="text-gray-500 text-sm">Chất béo</p>
          <p className="font-semibold text-lg">{menu.nutrition?.fat} g</p>
        </div>

        <div className="text-center">
          <p className="text-gray-500 text-sm">Tinh bột</p>
          <p className="font-semibold text-lg">{menu.nutrition?.carb} g</p>
        </div>
      </div>

      {/* MENU TABLE */}
      {renderWeek("Tuần lẻ", menu.weeks?.odd)}
      {renderWeek("Tuần chẵn", menu.weeks?.even)}
    </div>
  );
}

export default MenuDetailStudent;
