import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { CommitteeTab } from './AssetManagement/CommitteeTab';

export default function ManageCommittee() {
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const roles = user?.roles?.map(r => r.roleName || r) || [];
    if (!roles.includes('SchoolAdmin')) navigate('/', { replace: true });
  }, [isInitializing, navigate, user]);

  return (
    <Box>
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: 3, backgroundColor: '#f9fafb' }}>
        {/* <Typography variant="h5" fontWeight={700} mb={2}>Ban Kiểm Kê</Typography> */}
        <CommitteeTab />
      </Paper>
    </Box>
  );
}
