import Dropdown from "./Dropdown";
import "../layouts/Layout.css";

function LeftNav() {
  return (
    <aside className="sidebar left">
      <Dropdown title="Cơ cấu nhà trường">
        <li>Ban Giám hiệu</li>
        <li>Tổ Chuyên môn</li>
        <li>Tổ Hành chính</li>
        <li>Hội PHHS</li>
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
