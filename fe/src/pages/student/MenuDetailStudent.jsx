import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMenuDetail } from "../../service/menu.api";
import { toast } from "react-toastify";
import { ArrowLeft, Calendar, User, Flame, Beef, Droplets, Wheat } from "lucide-react";

const days = ["mon", "tue", "wed", "thu", "fri"];

const dayMap = {
  mon: "Thứ hai",
  tue: "Thứ ba",
  wed: "Thứ tư",
  thu: "Thứ năm",
  fri: "Thứ sáu",
};

const mealTypes = [
  { key: "lunchFoods", label: "Bữa trưa", icon: "🍽️" },
  { key: "afternoonFoods", label: "Bữa chiều", icon: "🥤" },
];

const statusMap = {
  approved: {
    label: "Đã duyệt",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  active: {
    label: "Đang áp dụng",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  completed: {
    label: "Hoàn thành",
    color: "bg-purple-100 text-purple-700 border-purple-200",
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
          <div key={index} className="flex items-center gap-1">
            <span>•</span>
            <span>{food.name}</span>
            <span className="text-gray-500">({food.calories} kcal)</span>
          </div>
        ))}

        <div className="flex gap-3 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
          <span className="flex items-center gap-1">
            <Flame size={12} />
            {dayMenu.totalCalories} kcal
          </span>
          <span className="flex items-center gap-1">
            <Beef size={12} />
            {dayMenu.totalProtein} g
          </span>
        </div>
      </div>
    );
  };

  const renderWeek = (title, weekData) => (
    <div className="mb-10">
      <h2 className="font-semibold mb-4 text-xl text-gray-800 flex items-center gap-2">
        <Calendar size={20} />
        {title}
      </h2>

      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white">
        <table className="w-full text-sm border-collapse min-w-[600px]">
          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-700">
            <tr>
              <th className="border border-gray-200 p-4 w-32 text-center font-semibold">
                Bữa ăn
              </th>

              {days.map((day) => (
                <th key={day} className="border border-gray-200 p-4 font-semibold">
                  {dayMap[day]}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {mealTypes.map((meal, index) => (
              <tr key={meal.key} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                <td className="border border-gray-200 p-4 font-medium text-center bg-gray-100">
                  <div className="flex items-center justify-center gap-2">
                    <span>{meal.icon}</span>
                    <span>{meal.label}</span>
                  </div>
                </td>

                {days.map((day) => (
                  <td
                    key={day}
                    className="border border-gray-200 p-4 align-top hover:bg-blue-50 transition-colors"
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

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!menu) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 bg-white p-6 rounded-xl shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium
          bg-gray-100 border border-gray-200 rounded-lg shadow-sm
          hover:bg-gray-200 transition-all duration-200 mb-4 sm:mb-0"
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>

        <div className="flex items-center gap-3">
          <span
            className={`px-4 py-2 text-sm font-medium rounded-full border ${statusMap[menu.status]?.color || 'bg-gray-100 text-gray-700 border-gray-200'}`}
          >
            {statusMap[menu.status]?.label || menu.status}
          </span>
        </div>
      </div>

      {/* TITLE */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Thực đơn Tháng {menu.month}/{menu.year}
        </h1>
      </div>

      {/* NUTRITION */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white border border-gray-200 rounded-xl p-6 mb-10 shadow-sm">
        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
          <Flame className="mx-auto mb-2 text-orange-500" size={24} />
          <p className="text-gray-600 text-sm font-medium">Calories</p>
          <p className="font-bold text-xl text-gray-800">{menu.nutrition?.calories}</p>
          <p className="text-xs text-gray-500">kcal/ngày</p>
        </div>

        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
          <Beef className="mx-auto mb-2 text-blue-500" size={24} />
          <p className="text-gray-600 text-sm font-medium">Protein</p>
          <p className="font-bold text-xl text-gray-800">{menu.nutrition?.protein} g</p>
        </div>

        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
          <Droplets className="mx-auto mb-2 text-green-500" size={24} />
          <p className="text-gray-600 text-sm font-medium">Chất béo</p>
          <p className="font-bold text-xl text-gray-800">{menu.nutrition?.fat} g</p>
        </div>

        <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg">
          <Wheat className="mx-auto mb-2 text-yellow-500" size={24} />
          <p className="text-gray-600 text-sm font-medium">Tinh bột</p>
          <p className="font-bold text-xl text-gray-800">{menu.nutrition?.carb} g</p>
        </div>
      </div>

      {/* MENU TABLE */}
      {renderWeek("Tuần lẻ", menu.weeks?.odd)}
      {renderWeek("Tuần chẵn", menu.weeks?.even)}
    </div>
  );
}

export default MenuDetailStudent;
