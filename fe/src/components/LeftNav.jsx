import Dropdown from "./Dropdown";
import "../layouts/Layout.css";
import { NavLink } from "react-router-dom";

function LeftNav() {
  return (
    <aside className="sidebar left">
      <Dropdown title="Cơ cấu nhà trường">
        <NavLink to="/board-of-directors">
          {({ isActive }) => (
            <li
              style={{
                color: isActive ? "red" : "#333",
                fontWeight: isActive ? "600" : "400",
                cursor: "pointer",
              }}
            >
              Ban Giám hiệu
            </li>
          )}
        </NavLink>
        <NavLink to="/professional-group">
          {({ isActive }) => (
            <li
              style={{
                color: isActive ? "red" : "#333",
                fontWeight: isActive ? "600" : "400",
                cursor: "pointer",
              }}
            >
              Tổ chuyên môn
            </li>
          )}
        </NavLink>
        <NavLink to="/administrative-staff">
          {({ isActive }) => (
            <li
              style={{
                color: isActive ? "red" : "#333",
                fontWeight: isActive ? "600" : "400",
                cursor: "pointer",
              }}
            >
              Tổ hành chính
            </li>
          )}
        </NavLink>
        <NavLink to="/parent-council">
          {({ isActive }) => (
            <li
              style={{
                color: isActive ? "red" : "#333",
                fontWeight: isActive ? "600" : "400",
                cursor: "pointer",
              }}
            >
              Hội PHHS
            </li>
          )}
        </NavLink>
      </Dropdown>

      <Dropdown title="Các hoạt động">
        <li>Bản tin trường</li>
        <li>Thông báo</li>
        <li>Tin từ Phòng</li>
        <li>Ngoại khóa</li>
      </Dropdown>

      <Dropdown title="Kế hoạch CS-GD">
        <li>Kế hoạch năm</li>
        <li>Kế hoạch tháng</li>
        <li>Chăm sóc trẻ</li>
      </Dropdown>
    </aside>
  );
}

export default LeftNav;
