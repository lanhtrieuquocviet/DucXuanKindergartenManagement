import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { AssetsTab } from './AssetManagement/AssetsTab';
import { WarehouseAssetsTab } from './AssetManagement/WarehouseAssetsTab';

export default function ManageAssets() {
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();
  const [mainTab, setMainTab] = useState(0);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const roles = user?.roles?.map(r => r.roleName || r) || [];
    if (!roles.includes('SchoolAdmin')) navigate('/', { replace: true });
  }, [isInitializing, navigate, user]);

  return (
    <Box>
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: 3, backgroundColor: '#f9fafb' }}>
        <Typography variant="h5" fontWeight={700} mb={2}>Quản lý Cơ sở vật chất</Typography>
        <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab label="Cơ sở vật chất (Báo cáo)" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Tài sản kho (Phân bổ phòng/lớp)" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Chú thích viết tắt: TT = Thứ tự, TS = Tài sản, Mã TS = Mã tài sản, ĐVT = Đơn vị tính, SL = Số lượng, SC = Sức chứa.
        </Typography>
        {mainTab === 0 && <AssetsTab />}
        {mainTab === 1 && <WarehouseAssetsTab />}
      </Paper>
    </Box>
  );
}
