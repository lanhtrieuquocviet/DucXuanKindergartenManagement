import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, Typography } from '@mui/material';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';
import { CommitteeTab } from './ManageAssets';

export default function ManageCommittee() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const menuItems = useSchoolAdminMenu();

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const roles = user?.roles?.map(r => r.roleName || r) || [];
    if (!roles.includes('SchoolAdmin')) navigate('/', { replace: true });
  }, [isInitializing, navigate, user]);

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  return (
    <RoleLayout
      title="Ban Kiểm Kê"
      description="Quản lý ban kiểm kê tài sản trường."
      menuItems={menuItems}
      activeKey="committee"
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={user?.fullName || user?.username || 'School Admin'}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: 3, backgroundColor: '#f9fafb' }}>
        <Typography variant="h5" fontWeight={700} mb={2}>Ban Kiểm Kê</Typography>
        <CommitteeTab />
      </Paper>
    </RoleLayout>
  );
}
