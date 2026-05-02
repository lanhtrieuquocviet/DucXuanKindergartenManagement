import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Stack,
  Grid,
  Button,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  List as ListIcon,
  Inventory as InventoryIcon,
  CheckCircle as CheckIcon,
  LocationOn as LocationIcon,
  ArrowForward as ArrowIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Import split components
import { CommitteeTab } from './AssetManagement/CommitteeTab';
import { MinutesTab } from './AssetManagement/MinutesTab';
import { AssetsTab } from './AssetManagement/AssetsTab';
import { WarehouseAssetsTab } from './AssetManagement/WarehouseAssetsTab';
import { AdjustmentsTab } from './AssetManagement/AdjustmentsTab';
import { AssetTransactionsTab } from './AssetManagement/AssetTransactionsTab';

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
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: 3, bgcolor: 'white', border: '1px solid #e5e7eb' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight={900} color="#1e293b">Quản lý Kho & Cơ sở vật chất</Typography>
            <Typography variant="body2" color="text.secondary">Hệ thống quản lý tài sản theo Thông tư 13/2020/TT-BGDĐT</Typography>
          </Box>
        </Stack>

        <Tabs
          value={mainTab}
          onChange={(_, v) => setMainTab(v)}
          sx={{
            mb: 3,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 48, px: 3 },
            borderBottom: '1px solid #f1f5f9'
          }}
        >
          <Tab icon={<DashboardIcon fontSize="small" />} iconPosition="start" label="Tổng quan" />
          <Tab icon={<ListIcon fontSize="small" />} iconPosition="start" label="Báo cáo cuối năm" />
          <Tab icon={<InventoryIcon fontSize="small" />} iconPosition="start" label="Quản lý Kho (Phân bổ)" />
          <Tab icon={<CheckIcon fontSize="small" />} iconPosition="start" label="Lệnh điều chỉnh" />
          <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Hội đồng & Biên bản" />
          <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Lịch sử biến động" />
        </Tabs>

        {mainTab === 0 && (
          <Box sx={{ py: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle1" fontWeight={800} mb={2}>Hướng dẫn quy trình nghiệp vụ</Typography>
                <Stack spacing={2}>
                  {[
                    { title: '1. Thiết lập Hạ tầng', desc: 'Khai báo danh mục các phòng học, kho bãi và vị trí vật lý trong trường.', link: '/school-admin/facilities/locations', icon: <LocationIcon color="primary" /> },
                    { title: '2. Quản lý Kho tổng', desc: 'Nhập danh mục tài sản và theo dõi số lượng tồn thực tế (Tốt/Hỏng).', tab: 2, icon: <ListIcon color="success" /> },
                    { title: '3. Phân bổ & Bàn giao', desc: 'Cấp phát tài sản từ kho về từng phòng học hoặc điều chuyển giữa các vị trí.', link: '/school-admin/facilities/room-based', icon: <InventoryIcon color="warning" /> },
                    { title: '4. Truy xuất & Audit', desc: 'Theo dõi lịch sử biến động chi tiết và rà soát báo cáo hiện trạng tài sản.', tab: 4, icon: <ArrowIcon color="info" /> }
                  ].map((step, i) => (
                    <Paper
                      key={i}
                      variant="outlined"
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        cursor: 'pointer',
                        transition: '0.2s',
                        '&:hover': { bgcolor: '#f8fafc', borderColor: '#2563eb' }
                      }}
                      onClick={() => step.link ? navigate(step.link) : setMainTab(step.tab)}
                    >
                      <Box sx={{ p: 1, bgcolor: '#f1f5f9', borderRadius: 2 }}>{step.icon}</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={700}>{step.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{step.desc}</Typography>
                      </Box>
                      <ArrowIcon sx={{ opacity: 0.3 }} />
                    </Paper>
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, bgcolor: '#eff6ff', borderRadius: 3, height: '100%' }}>
                  <Typography variant="h6" fontWeight={800} color="#1e40af" mb={1}>Phím tắt nhanh</Typography>
                  <Stack spacing={1.5} mt={2}>
                    <Button variant="contained" fullWidth onClick={() => navigate('/school-admin/facilities/locations')} sx={{ bgcolor: '#2563eb', borderRadius: 2 }}>Quản lý Danh mục CSVC</Button>
                    <Button variant="outlined" fullWidth onClick={() => setMainTab(1)} sx={{ borderRadius: 2 }}>Xem Báo cáo Tổng quát</Button>
                    <Button variant="outlined" fullWidth onClick={() => navigate('/school-admin/facilities/room-based')} sx={{ borderRadius: 2 }}>Xem Tài sản theo phòng</Button>
                    <Button variant="outlined" fullWidth onClick={() => navigate('/school-admin/committee')} sx={{ borderRadius: 2, color: '#0284c7', borderColor: '#0284c7' }}>Hội đồng kiểm kê</Button>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {mainTab === 1 && <AssetsTab />}
        {mainTab === 2 && <WarehouseAssetsTab />}
        {mainTab === 3 && <AdjustmentsTab />}
        {mainTab === 4 && <CommitteeTab />}
        {mainTab === 5 && <AssetTransactionsTab />}
      </Paper>
    </Box>
  );
}
