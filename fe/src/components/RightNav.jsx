import Dropdown from "./Dropdown";
import '../layouts/Layout.css';

function RightNav() {
  return (
    <aside className="sidebar right">
      <Dropdown title="Thông tin mới" color="orange">
        <li style={{color:'black'}}>Công văn số 07</li>
        <li style={{color:'black'}}>Thực đơn tháng 1</li>
        <li style={{color:'black'}}>Hoạt động 20/11</li>
      </Dropdown>

      <Dropdown title="Sự kiện nổi bật" color="green">
        <li style={{color:'black'}}>Sự kiện 1</li>
        <li style={{color:'black'}}>Sự kiện 2</li>
        <li style={{color:'black'}}>Sự kiện 3</li>
      </Dropdown>
    </aside>
  );
}

export default RightNav;