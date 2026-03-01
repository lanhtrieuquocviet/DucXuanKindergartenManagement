import Dropdown from "./Dropdown";
import "../layouts/Layout.css";

function RightNav() {
  return (
    <aside className="sidebar right">
      <Dropdown title="Thông tin mới">
        <li>Công văn số 07</li>
        <li>Thực đơn tháng 1</li>
        <li>Hoạt động 20/11</li>
      </Dropdown>

      <Dropdown title="Sự kiện nổi bật">
        <li>Sự kiện 1</li>
        <li>Sự kiện 2</li>
        <li>Sự kiện 3</li>
      </Dropdown>
    </aside>
  );
}

export default RightNav;
