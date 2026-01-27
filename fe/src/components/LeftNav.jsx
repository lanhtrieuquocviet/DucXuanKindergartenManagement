import Dropdown from "./Dropdown";
import '../layouts/Layout.css';

function LeftNav() {
  return (
    <aside className="sidebar left">
      <Dropdown title="Cơ cấu nhà trường" color="orange">
        <li style={{color:'black'}}>Ban Giám hiệu</li>
        <li style={{color:'black'}}>Tổ Chuyên môn</li>
        <li style={{color:'black'}}>Tổ Hành chính</li>
        <li style={{color:'black'}}>Hội PHHS</li>
      </Dropdown>

      <Dropdown title="Các hoạt động" color="green">
        <li style={{color:'black'}}>Bản tin trường</li>
        <li style={{color:'black'}}>Thông báo</li>
        <li style={{color:'black'}}>Tin từ Phòng</li>
        <li style={{color:'black'}}>Ngoại khóa</li>
      </Dropdown>

      <Dropdown title="Kế hoạch CS-GD" color="red">
        <li style={{color:'black'}}>Kế hoạch năm</li>
        <li style={{color:'black'}}>Kế hoạch tháng</li>
        <li style={{color:'black'}}>Chăm sóc trẻ</li>
      </Dropdown>
    </aside>
  );
}

export default LeftNav;