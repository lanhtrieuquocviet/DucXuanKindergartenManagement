import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMenuDetail } from "../../service/menu.api";
import { toast } from "react-toastify";
import RoleLayout from "../../layouts/RoleLayout";
import { createSchoolAdminMenuSelect } from "./schoolAdminMenuConfig";
import { useSchoolAdminMenu } from "./useSchoolAdminMenu";
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

  useEffect(() => {
    fetchMenuDetail();
  }, []);

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
        </div>

        {renderWeek("Tuần lẻ", menu.weeks?.odd)}
        {renderWeek("Tuần chẵn", menu.weeks?.even)}
      </div>
    </RoleLayout>
  );
};

export default MenuDetailSchoolAdmin;
