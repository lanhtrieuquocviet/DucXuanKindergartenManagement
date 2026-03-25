import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMenuDetail } from "../../service/menu.api";
import { toast } from "react-toastify";
import { ArrowLeft, Flame, Beef, Droplets, Wheat } from "lucide-react";

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
  const [activeWeek, setActiveWeek] = useState("odd");

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
          <div key={index} className="flex items-start gap-1">
            <span className="text-emerald-500 mt-0.5">•</span>
            <span className="text-gray-700">{food.name}</span>
            <span className="text-gray-400 text-xs whitespace-nowrap ml-1">({food.calories} kcal)</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!menu) return null;

  const weekData = activeWeek === "odd" ? menu.weeks?.odd : menu.weeks?.even;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky green header */}
      <div className="sticky top-0 z-20 bg-emerald-600 shadow-md">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors text-white flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-base leading-tight truncate">
              Thực đơn Tháng {menu.month}/{menu.year}
            </h1>
          </div>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full border flex-shrink-0 ${statusMap[menu.status]?.color || "bg-gray-100 text-gray-700 border-gray-200"}`}
          >
            {statusMap[menu.status]?.label || menu.status}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Nutrition summary: 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Calories */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-orange-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Flame size={20} className="text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Calories</p>
              <p className="font-bold text-gray-800 text-sm leading-tight">
                {menu.nutrition?.calories}
                <span className="text-xs font-normal text-gray-400 ml-1">kcal</span>
              </p>
            </div>
          </div>

          {/* Protein */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-blue-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Beef size={20} className="text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Protein</p>
              <p className="font-bold text-gray-800 text-sm leading-tight">
                {menu.nutrition?.protein}
                <span className="text-xs font-normal text-gray-400 ml-1">g</span>
              </p>
            </div>
          </div>

          {/* Chất béo */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-emerald-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Droplets size={20} className="text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Chất béo</p>
              <p className="font-bold text-gray-800 text-sm leading-tight">
                {menu.nutrition?.fat}
                <span className="text-xs font-normal text-gray-400 ml-1">g</span>
              </p>
            </div>
          </div>

          {/* Tinh bột */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-yellow-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <Wheat size={20} className="text-yellow-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Tinh bột</p>
              <p className="font-bold text-gray-800 text-sm leading-tight">
                {menu.nutrition?.carb}
                <span className="text-xs font-normal text-gray-400 ml-1">g</span>
              </p>
            </div>
          </div>
        </div>

        {/* Week tabs */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 flex gap-1">
          <button
            onClick={() => setActiveWeek("odd")}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeWeek === "odd"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Tuần lẻ
          </button>
          <button
            onClick={() => setActiveWeek("even")}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeWeek === "even"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Tuần chẵn
          </button>
        </div>

        {/* Day cards */}
        <div className="space-y-3">
          {days.map((day) => {
            const dayMenu = weekData?.[day];
            return (
              <div
                key={day}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Day header */}
                <div className="flex items-center justify-between px-4 py-3 border-l-4 border-emerald-500 bg-emerald-50">
                  <span className="font-bold text-gray-800 text-sm">{dayMap[day]}</span>
                  {dayMenu?.totalCalories != null && (
                    <span className="flex items-center gap-1 bg-orange-100 text-orange-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                      <Flame size={12} />
                      {dayMenu.totalCalories} kcal
                    </span>
                  )}
                </div>

                {/* Meal sections */}
                <div className="divide-y divide-gray-50">
                  {mealTypes.map((meal) => (
                    <div key={meal.key} className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        {meal.icon} {meal.label}
                      </p>
                      {renderCell(weekData, day, meal.key)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}

export default MenuDetailStudent;
