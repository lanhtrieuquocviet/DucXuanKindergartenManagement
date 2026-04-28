import { Outlet } from 'react-router-dom';
import RoleLayout from '../../layouts/RoleLayout';

const SchoolAdminLayout = () => {
  return (
    <RoleLayout
      title="Quản trị trường học"
      description="Quản lý toàn diện hoạt động của nhà trường"
    >
      <Outlet />
    </RoleLayout>
  );
};

export default SchoolAdminLayout;
