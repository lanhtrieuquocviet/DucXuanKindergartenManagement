import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get, ENDPOINTS } from "../../service/api";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const DAYS = ["mon", "tue", "wed", "thu", "fri"];
const DAY_LABEL = { mon: "Thứ hai", tue: "Thứ ba", wed: "Thứ tư", thu: "Thứ năm", fri: "Thứ sáu" };
const MEAL_TYPES = [
  { key: "lunchFoods",     label: "Bữa trưa" },
  { key: "afternoonFoods", label: "Bữa chiều" },
];

const STATUS_LABEL = {
  approved:  { label: "Đã duyệt",     color: "bg-green-100 text-green-700" },
  active:    { label: "Đang áp dụng", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Đã kết thúc",  color: "bg-gray-100 text-gray-600" },
};

function MenuTable({ weekData, title }) {
  return (
    <div className="mb-8">
      <h3 className="font-semibold text-sm text-gray-700 mb-2">* {title}</h3>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="border border-gray-200 p-2 w-28 text-center">Bữa ăn</th>
              {DAYS.map((d) => (
                <th key={d} className="border border-gray-200 p-2 text-center">{DAY_LABEL[d]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEAL_TYPES.map((meal) => (
              <tr key={meal.key}>
                <td className="border border-gray-200 p-2 font-medium bg-gray-50 text-center">
                  {meal.label}
                </td>
                {DAYS.map((day) => {
                  const dayMenu = weekData?.[day];
                  const foods = dayMenu?.[meal.key] || [];
                  return (
                    <td key={day} className="border border-gray-200 p-3 align-top bg-white">
                      {foods.length === 0 ? (
                        <span className="text-gray-300 text-xs italic">Chưa có</span>
                      ) : (
                        <div className="space-y-0.5">
                          {foods.map((f, i) => (
                            <div key={i} className="text-xs text-gray-700">
                              - {f.name} ({f.calories} kcal)
                            </div>
                          ))}
                          <div className="flex gap-2 text-xs text-gray-400 mt-1.5 pt-1.5 border-t border-gray-100">
                            <span>🔥 {dayMenu.totalCalories} kcal</span>
                            <span>🥩 {dayMenu.totalProtein} g</span>
                          </div>
                        </div>
                      )}
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
}

function MenuCard({ menu }) {
  const [expanded,    setExpanded]    = useState(false);
  const [detail,      setDetail]      = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const toggle = async () => {
    if (!expanded && !detail) {
      setLoadingDetail(true);
      try {
        const res = await get(ENDPOINTS.KITCHEN.PUBLIC_MENU_DETAIL(menu._id));
        setDetail(res.data);
      } catch {
        // ignore
      } finally {
        setLoadingDetail(false);
      }
    }
    setExpanded((v) => !v);
  };

  const sc = STATUS_LABEL[menu.status] || { label: menu.status, color: "bg-gray-100 text-gray-600" };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition">
      {/* Header row */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={toggle}
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-gray-800">
            Thực đơn Tháng {menu.month}/{menu.year}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.color}`}>
            {sc.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {new Date(menu.createdAt).toLocaleDateString("vi-VN")}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4">
          {loadingDetail ? (
            <div className="text-center py-8 text-gray-400 text-sm">Đang tải chi tiết...</div>
          ) : detail ? (
            <>
              <MenuTable weekData={detail.weeks?.odd}  title="Tuần lẻ" />
              <MenuTable weekData={detail.weeks?.even} title="Tuần chẵn" />
            </>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">Không thể tải chi tiết thực đơn.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WeeklyMenu() {
  const navigate = useNavigate();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());
  const [menus,   setMenus]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const fetchMenus = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ month: selectedMonth, year: selectedYear });
        const res = await get(`${ENDPOINTS.KITCHEN.PUBLIC_MENUS}?${params}`);
        setMenus(res.data || []);
      } catch (err) {
        setError(err.message || "Không thể tải thực đơn");
      } finally {
        setLoading(false);
      }
    };
    fetchMenus();
  }, [selectedMonth, selectedYear]);

  const yearOptions = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) yearOptions.push(y);

  return (
    <div className="w-full min-h-screen bg-white px-4 sm:px-6 py-4 sm:py-6 text-gray-800">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <span className="hover:text-green-600 cursor-pointer" onClick={() => navigate("/")}>Trang chủ</span>
        <span className="mx-1">›</span>
        Thư viện
        <span className="mx-1">›</span>
        <span className="text-gray-700">Thực đơn tuần</span>
      </div>

      <h1 className="text-2xl font-semibold mb-2">Thực đơn tuần</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-2xl">
        Thực đơn được kiểm tra và phê duyệt bởi ban giám hiệu nhà trường.
        Thức ăn được chế biến tại trường để đảm bảo dinh dưỡng và vệ sinh an toàn thực phẩm.
      </p>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-sm font-medium text-gray-600 shrink-0">Lọc theo tháng:</span>
        <div className="flex flex-wrap gap-1.5">
          {MONTHS.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition
                ${selectedMonth === m
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
                }`}
            >
              Tháng {m}
            </button>
          ))}
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:border-green-500"
        >
          {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Content */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Đang tải thực đơn...</div>
      ) : menus.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🍱</div>
          <p className="text-gray-500 font-medium">Chưa có thực đơn nào cho tháng {selectedMonth}/{selectedYear}</p>
          <p className="text-sm text-gray-400 mt-1">Thực đơn sẽ được cập nhật khi nhà trường phê duyệt.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {menus.map((menu) => <MenuCard key={menu._id} menu={menu} />)}
        </div>
      )}
    </div>
  );
}
