import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";

function KitchenSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const { hasPermission } = useAuth();

  const ALL_MENU = [
    {
      name: "Quản lý thực đơn",
      permission: "MANAGE_MENU",
      children: [
        { name: "Thực đơn", path: "/kitchen/menus", permission: "MANAGE_MENU" },
        { name: "Món ăn", path: "/kitchen/foods", permission: "MANAGE_FOOD" },
      ],
    },
    {
      name: "Quản lý dữ liệu",
      permission: "MANAGE_MEAL_PHOTO",
      children: [
        { name: "Sỉ số & Suất ăn", path: "/kitchen/students", permission: "VIEW_REPORT" },
        { name: "Upload ảnh món ăn", path: "/kitchen/upload-food", permission: "MANAGE_MEAL_PHOTO" },
        { name: "Upload mẫu thực phẩm", path: "/kitchen/sample-food", permission: "MANAGE_MEAL_PHOTO" },
      ],
    },
    {
      name: "Báo cáo",
      path: "/kitchen/report",
      permission: "VIEW_REPORT",
    },
  ];

  const menu = useMemo(() => {
    return ALL_MENU.reduce((acc, item) => {
      if (item.children) {
        const visibleChildren = item.children.filter(
          (c) => !c.permission || hasPermission(c.permission)
        );
        if (visibleChildren.length === 0) return acc;
        return [...acc, { ...item, children: visibleChildren }];
      }
      if (!item.permission || hasPermission(item.permission)) {
        return [...acc, item];
      }
      return acc;
    }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission]);

  const toggleMenu = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/login");
};

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-lg font-bold">MamNon DX</h1>
        <p className="text-xs text-gray-400">Trường MN Đức Xuân</p>
      </div>

      <div className="flex-1 p-3 space-y-2">
        <p className="text-xs text-gray-400 mb-2">Nhân viên nhà bếp</p>

        {menu.map((item, index) => (
          <div key={index}>
            {!item.children && (
              <Link
                to={item.path}
                className={`block px-3 py-2 rounded-md text-sm ${
                  location.pathname === item.path
                    ? "bg-slate-700"
                    : "hover:bg-slate-800"
                }`}
              >
                {item.name}
              </Link>
            )}

            {item.children && (
              <>
                <button
                  onClick={() => toggleMenu(index)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-800 flex justify-between"
                >
                  {item.name}
                  <span>{openMenu === index ? "▾" : "▸"}</span>
                </button>

                {openMenu === index && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={`block px-3 py-2 rounded-md text-sm ${
                          location.pathname === child.path
                            ? "bg-slate-700"
                            : "hover:bg-slate-800"
                        }`}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* User + Logout */}
      <div className="p-4 border-t border-slate-700">
        <p className="text-sm">Nguyen Van A</p>
        <p className="text-xs text-gray-400 mb-2">Nhân viên Nhà bếp</p>

        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white text-sm py-2 rounded-md"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

export default KitchenSidebar;
