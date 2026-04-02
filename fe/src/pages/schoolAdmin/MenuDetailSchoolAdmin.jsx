import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMenuDetail, updateMenu } from "../../service/menu.api";
import { toast } from "react-toastify";
import RoleLayout from "../../layouts/RoleLayout";
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';
import { useAuth } from "../../context/AuthContext";

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
  draft: { label: "Nháp", color: "bg-gray-200 text-gray-700" },
  pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Đã duyệt", color: "bg-green-100 text-green-700" },
  active: { label: "Đang áp dụng", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Hoàn thành", color: "bg-purple-100 text-purple-700" },
  rejected: { label: "Bị từ chối", color: "bg-red-100 text-red-700" },
};

const MenuDetailSchoolAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showNutritionPlan, setShowNutritionPlan] = useState(false);
  const nutritionSectionRef = useRef(null);
  const [nutritionPlan, setNutritionPlan] = useState([]);
  const [newNutritionPlan, setNewNutritionPlan] = useState({ label: "", target: "", actual: "" });

  useEffect(() => {
    fetchMenuDetail();
  }, []);

  useEffect(() => {
    if (!menu) return;

    if (Array.isArray(menu.nutritionPlan) && menu.nutritionPlan.length > 0) {
      setNutritionPlan(menu.nutritionPlan.map((item, idx) => ({ id: idx + 1, ...item })));
      return;
    }

    setNutritionPlan([
      { id: 1, label: "Nhu cầu năng lượng (kcal)", target: 1300, actual: menu.nutrition?.calories || 0 },
      { id: 2, label: "Protein (g)", target: 50, actual: menu.nutrition?.protein || 0 },
      { id: 3, label: "Chất béo (g)", target: 30, actual: menu.nutrition?.fat || 0 },
      { id: 4, label: "Tinh bột (g)", target: 150, actual: menu.nutrition?.carb || 0 },
    ]);
  }, [menu]);

  const handleNutritionPlanChange = (id, field, value) => {
    setNutritionPlan((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: field === "label" ? value : Number(value) || 0 } : row
      )
    );
  };

  const handleAddNutritionPlan = () => {
    if (!newNutritionPlan.label.trim()) {
      toast.error("Tên mục dinh dưỡng không được để trống");
      return;
    }

    const nextId = nutritionPlan.length ? Math.max(...nutritionPlan.map((row) => row.id)) + 1 : 1;
    setNutritionPlan((prev) => [
      ...prev,
      {
        id: nextId,
        label: newNutritionPlan.label.trim(),
        target: Number(newNutritionPlan.target) || 0,
        actual: Number(newNutritionPlan.actual) || 0,
      },
    ]);
    setNewNutritionPlan({ label: "", target: "", actual: "" });
    toast.success("Đã thêm mục dinh dưỡng");
  };

  const handleDeleteNutritionPlan = (id) => {
    setNutritionPlan((prev) => prev.filter((row) => row.id !== id));
  };

  const handleUpdateNutritionPlan = async () => {
    for (const item of nutritionPlan) {
      if (!item.label || item.target == null || item.actual == null) {
        toast.error("Vui lòng điền đầy đủ thông tin cho tất cả các chỉ tiêu");
        return;
      }
      if (item.target <= 0 || item.actual < 0) {
        toast.error("Mục tiêu phải > 0 và thực tế >= 0");
        return;
      }
    }

    const nutrition = {
      calories: nutritionPlan.find((x) => /năng lượng|calo/i.test(x.label))?.actual || 0,
      protein: nutritionPlan.find((x) => /protein/i.test(x.label))?.actual || 0,
      fat: nutritionPlan.find((x) => /chất béo|fat/i.test(x.label))?.actual || 0,
      carb: nutritionPlan.find((x) => /tinh bột|carb/i.test(x.label))?.actual || 0,
    };

    try {
      const res = await updateMenu(id, { nutritionPlan, nutrition });
      setMenu(res.data.data || { ...menu, nutritionPlan, nutrition });
      setNutritionPlan((prev) => prev.map((item) => ({ ...item })));
      toast.success("Cập nhật kế hoạch dinh dưỡng theo sở thành công");
    } catch (error) {
      toast.error(error.response?.data?.message || "Cập nhật kế hoạch thất bại");
    }
  };

  const fetchMenuDetail = async () => {
    try {
      setLoading(true);
      const res = await getMenuDetail(id);
      setMenu(res.data);
    } catch (error) {
      toast.error("Không thể tải thực đơn");
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
            - {food.name} ({food.calories} kcal)
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
              <tr key={meal.key}>
                <td className="border border-gray-300 p-2 font-medium bg-gray-100 text-center">
                  {meal.label}
                </td>

                {days.map((day) => (
                  <td
                    key={day}
                    className="border border-gray-300 p-3 align-top bg-white"
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

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  if (loading) return <p className="p-6">Đang tải dữ liệu...</p>;
  if (!menu) return null;

  return (
    <RoleLayout
      title="Chi tiết thực đơn"
      description="Xem chi tiết thực đơn của trường"
      menuItems={menuItems}
      activeKey="menu"
      userName={user?.fullName || user?.username}
      userAvatar={user?.avatar}
      onMenuSelect={handleMenuSelect}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      onViewProfile={() => navigate("/profile")}
    >
      <div className="p-6">
        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 mb-3"
        >
          ← Quay lại
        </button>

        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            statusMap[menu.status]?.color
          }`}
        >
          {statusMap[menu.status]?.label}
        </span>

        <div className="mb-6 mt-3">
          <h1 className="text-xl font-bold">
            Thực đơn Tháng {menu.month}/{menu.year}
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Tạo bởi: {menu.createdBy?.fullName}
          </p>

          <button
            onClick={() => {
              setShowNutritionPlan((prev) => !prev);
              if (!showNutritionPlan) {
                setTimeout(() => {
                  nutritionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 100);
              }
            }}
            className="mt-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
          >
            Quản lý thực đơn
          </button>
        </div>

        {showNutritionPlan && (
          <div
            ref={nutritionSectionRef}
            className="mb-8 border border-gray-300 rounded-lg p-4 bg-white shadow-sm max-h-[360px] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Kế hoạch dinh dưỡng theo sở</h2>
              <button
                onClick={handleUpdateNutritionPlan}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Cập nhật
              </button>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="border border-gray-300 p-2 text-left">Tiêu chí</th>
                  <th className="border border-gray-300 p-2 text-center">Mục tiêu</th>
                  <th className="border border-gray-300 p-2 text-center">Thực tế</th>
                  <th className="border border-gray-300 p-2 text-center">Hành động</th>
                </tr>
              </thead>

              <tbody>
                {nutritionPlan.map((row) => (
                  <tr key={row.id} className="even:bg-gray-50">
                    <td className="border border-gray-300 p-2">{row.label}</td>
                    <td className="border border-gray-300 p-2 text-center">
                      <input
                        value={row.target}
                        onChange={(e) => handleNutritionPlanChange(row.id, "target", e.target.value)}
                        className="w-24 p-1 text-right border rounded outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      <input
                        value={row.actual}
                        onChange={(e) => handleNutritionPlanChange(row.id, "actual", e.target.value)}
                        className="w-24 p-1 text-right border rounded outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      <button
                        onClick={() => handleDeleteNutritionPlan(row.id)}
                        className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              placeholder="Tiêu chí mới"
              value={newNutritionPlan.label}
              onChange={(e) => setNewNutritionPlan((prev) => ({ ...prev, label: e.target.value }))}
              className="w-80 p-2 border rounded focus:ring-2 focus:ring-blue-200"
            />
            <input
              placeholder="Mục tiêu"
              value={newNutritionPlan.target}
              onChange={(e) => setNewNutritionPlan((prev) => ({ ...prev, target: e.target.value }))}
              className="w-24 p-2 border rounded text-right focus:ring-2 focus:ring-blue-200"
            />
            <input
              placeholder="Thực tế"
              value={newNutritionPlan.actual}
              onChange={(e) => setNewNutritionPlan((prev) => ({ ...prev, actual: e.target.value }))}
              className="w-24 p-2 border rounded text-right focus:ring-2 focus:ring-blue-200"
            />
            <button
              onClick={handleAddNutritionPlan}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
            >
              Thêm
            </button>
          </div>
        </div>
      )}

        {renderWeek("Tuần lẻ", menu.weeks?.odd)}
        {renderWeek("Tuần chẵn", menu.weeks?.even)}
      </div>
    </RoleLayout>
  );
};

export default MenuDetailSchoolAdmin;
