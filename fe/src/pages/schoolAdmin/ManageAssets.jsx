import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Tab,
  Tabs,
  Typography,
  Grid,
  Stack,
  Button
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { AssetsTab } from './AssetManagement/AssetsTab';
import { WarehouseAssetsTab } from './AssetManagement/WarehouseAssetsTab';
import {
  Dashboard as DashboardIcon,
  ListAlt as ListIcon,
  Inventory as InventoryIcon,
  LocationOn as LocationIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';

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
        </Tabs>

        {mainTab === 0 && (
          <Box sx={{ py: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle1" fontWeight={800} mb={2}>Hướng dẫn quy trình nghiệp vụ</Typography>
                <Stack spacing={2}>
                  {[
                    { title: '1. Danh mục Cơ sở vật chất', desc: 'Định nghĩa các phòng học, khu vực hạ tầng và "Kho tổng" của trường.', link: '/school-admin/facilities/locations', icon: <LocationIcon color="primary" /> },
                    { title: '2. Nhập tài sản', desc: 'Sử dụng file Excel để nhập danh sách tài sản hiện có vào hệ thống.', tab: 1, icon: <ListIcon color="success" /> },
                    { title: '3. Phân bổ về phòng (CSVC)', desc: 'Chuyển đồ từ "Kho tổng" về từng phòng học hoặc cơ sở vật chất cụ thể.', link: '/school-admin/facilities/room-based', icon: <InventoryIcon color="warning" /> },
                    { title: '4. Báo cáo cuối năm', desc: 'Rà soát tình trạng sử dụng và xuất báo cáo gửi Sở/Phòng GD.', tab: 1, icon: <ArrowIcon color="info" /> }
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
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {mainTab === 1 && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, bgcolor: '#f8fafc', p: 1, borderRadius: 1 }}>
              💡 <b>Mẹo:</b> Bạn có thể chỉnh sửa trực tiếp Số lượng thực tế bằng cách bấm vào con số trên bảng.
            </Typography>
            <AssetsTab />
          </Box>
        )}
        {mainTab === 2 && <WarehouseAssetsTab />}
      </Paper>
    </Box>
  );
}
