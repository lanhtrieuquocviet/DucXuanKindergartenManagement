import { Outlet, useNavigate } from 'react-router-dom';
import RoleLayout from '../../layouts/RoleLayout';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';

const SchoolAdminLayout = () => {
  const menuItems = useSchoolAdminMenu();
  const navigate = useNavigate();

  return (
    <RoleLayout
      title="Quản trị trường học"
      description="Quản lý toàn diện hoạt động của nhà trường"
      menuItems={menuItems}
      onMenuSelect={createSchoolAdminMenuSelect(navigate)}
    >
      <Outlet />
    </RoleLayout>
  );
};

export default SchoolAdminLayout;
