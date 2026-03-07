import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

function KitchenSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);

  const menu = [
    {
      name: "Quản lý thực đơn",
      children: [
        { name: "Thực đơn", path: "/kitchen/menus" },
        { name: "Món ăn", path: "/kitchen/foods" },
      ],
    },
    {
      name: "Quản lý dữ liệu",
      children: [
        { name: "Sỉ số & Suất ăn", path: "/kitchen/students" },
        { name: "Upload ảnh món", path: "/kitchen/upload-food" },
        { name: "Mẫu thực phẩm", path: "/kitchen/sample-food" },
      ],
    },
    {
      name: "Báo cáo",
      path: "/kitchen/report",
    },
  ];

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
