import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Tabs, Tab, Button, Stack, TextField,
  MenuItem, Select, InputLabel, FormControl, Paper,
  IconButton, Tooltip, Divider, Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  CloudUpload as ImportIcon,
  GetApp as DownloadIcon,
  Add as AddIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import facilityService from '../../../service/facility.api';
import AssetReportTab from './tabs/AssetReportTab';
import WarehouseTab from './tabs/WarehouseTab';

const FacilityDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState('all');
  const [assetTypes, setAssetTypes] = useState([]);

  useEffect(() => {
    fetchAssetTypes();
  }, []);

  const fetchAssetTypes = async () => {
    try {
      const resp = await facilityService.getAssetTypes();
      if (resp?.status === 'success') {
        setAssetTypes(resp.data || []);
      }
    } catch (error) {
      console.error('Error fetching asset types:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ width: '100%', px: { xs: 1, md: 3 }, boxSizing: 'border-box', mt: -2 }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white', minHeight: 'calc(100vh - 150px)' }}>
          <Box sx={{ mb: 4 }}>
            <Tabs
              value={activeTab}
              onChange={(e, v) => setActiveTab(v)}
              sx={{
                borderBottom: '1px solid #f1f5f9',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: '1rem',
                  minWidth: 160,
                  color: '#64748b',
                  '&.Mui-selected': { color: '#2563eb' }
                },
                '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' }
              }}
            >
              <Tab label="Báo cáo Tổng quát" />
              <Tab label="Quản lý Kho tổng" />
            </Tabs>
          </Box>

          {/* Toolbar */}
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ mb: 4 }} alignItems="center">
            <TextField
              placeholder="Tìm kiếm theo mã hoặc tên tài sản..."
              size="medium"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1 }} />,
                sx: { borderRadius: 2, bgcolor: '#f8fafc' }
              }}
              sx={{ maxWidth: 600 }}
            />

            <FormControl size="medium" sx={{ minWidth: 220 }}>
              <InputLabel>Loại tài sản</InputLabel>
              <Select
                value={assetTypeFilter}
                label="Loại tài sản"
                onChange={(e) => setAssetTypeFilter(e.target.value)}
                sx={{ borderRadius: 2, bgcolor: '#f8fafc' }}
              >
                <MenuItem value="all">Tất cả loại tài sản</MenuItem>
                {assetTypes.map(t => (
                  <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ flexGrow: 1 }} />

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<ImportIcon />}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                Nhập Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                Tải mẫu
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                color="success"
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none', 
                  fontWeight: 800,
                  px: 3,
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              >
                Xuất Báo cáo Excel
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 4, borderColor: '#f1f5f9' }} />

          {/* Tab Content */}
          <Box sx={{ flex: 1 }}>
            {activeTab === 0 && (
              <AssetReportTab 
                searchTerm={searchTerm} 
                typeFilter={assetTypeFilter} 
              />
            )}
            {activeTab === 1 && (
              <WarehouseTab 
                searchTerm={searchTerm} 
                typeFilter={assetTypeFilter} 
              />
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default FacilityDashboard;
