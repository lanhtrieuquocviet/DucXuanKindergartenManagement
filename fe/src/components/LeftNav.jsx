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
        <NavLink to="/school-news">
          {({ isActive }) => (
            <li
              style={{
                color: isActive ? "red" : "#333",
                fontWeight: isActive ? "600" : "400",
                cursor: "pointer",
              }}
            >
              Bản tin trường
            </li>
          )}
        </NavLink>
        <NavLink to="/notifications-news">
          {({ isActive }) => (
            <li
              style={{
                color: isActive ? "red" : "#333",
                fontWeight: isActive ? "600" : "400",
                cursor: "pointer",
              }}
            >
              Thông báo
            </li>
          )}
        </NavLink>
        <NavLink to="/department-news">
          {({ isActive }) => (
            <li
              style={{
                color: isActive ? "red" : "#333",
                fontWeight: isActive ? "600" : "400",
                cursor: "pointer",
              }}
            >
              Tin tức từ Phòng
            </li>
          )}
        </NavLink>
        <NavLink to="/department-notifications">
          {({ isActive }) => (
            <li
              style={{
                color: isActive ? "red" : "#333",
                fontWeight: isActive ? "600" : "400",
                cursor: "pointer",
              }}
            >
              Thông báo từ Phòng
            </li>
          )}
        </NavLink>
        <NavLink to="/extracurricular-activities">
          {({ isActive }) => (
            <li
              style={{
                color: isActive ? "red" : "#333",
                fontWeight: isActive ? "600" : "400",
                cursor: "pointer",
              }}
            >
              Hoạt động ngoại khóa
            </li>
          )}
        </NavLink>
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
