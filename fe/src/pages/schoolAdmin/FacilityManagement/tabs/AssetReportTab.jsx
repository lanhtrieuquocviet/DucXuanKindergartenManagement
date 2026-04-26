import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton,
  CircularProgress, Chip, Stack, Accordion, AccordionSummary,
  AccordionDetails, Badge
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { get } from '../../../../service/api';

const AssetReportTab = ({ searchTerm, typeFilter }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]); // Array of { area: string, locations: [] }

  useEffect(() => {
    fetchReportData();
  }, [searchTerm, typeFilter]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch assets and group them by location and area on the client side for now
      // Or we could have a specific endpoint for this grouped report
      const resp = await get('/school-admin/facilities/assets');
      if (resp?.status === 'success') {
        const assets = resp.data || [];
        
        // Grouping logic: Area -> Location -> Assets
        const grouped = assets.reduce((acc, asset) => {
          const loc = asset.currentLocationId || { name: 'Chưa xác định', area: 'Khác' };
          const areaName = loc.area || 'Khác';
          
          if (!acc[areaName]) acc[areaName] = {};
          if (!acc[areaName][loc.name]) acc[areaName][loc.name] = [];
          
          acc[areaName][loc.name].push(asset);
          return acc;
        }, {});

        // Transform to array for easier rendering
        const finalData = Object.entries(grouped).map(([area, locations]) => ({
          area,
          locations: Object.entries(locations).map(([locName, locAssets]) => ({
            name: locName,
            assets: locAssets
          }))
        }));

        setData(finalData);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {data.length === 0 ? (
        <Typography sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
          Chưa có dữ liệu cơ sở vật chất.
        </Typography>
      ) : (
        data.map((areaGroup, idx) => (
          <Box key={idx} sx={{ mb: 4 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <LocationIcon color="primary" />
              <Typography variant="h6" fontWeight={800} color="primary.main">
                {idx + 1}. {areaGroup.area}
              </Typography>
              <Chip 
                label={`${areaGroup.locations.length} vị trí`} 
                size="small" 
                variant="outlined" 
                color="primary" 
              />
            </Stack>

            {areaGroup.locations.map((loc, lIdx) => (
              <Accordion 
                key={lIdx} 
                defaultExpanded={idx === 0 && lIdx === 0}
                sx={{ 
                  mb: 1, 
                  borderRadius: '8px !important',
                  '&:before': { display: 'none' },
                  boxShadow: 'none',
                  border: '1px solid #eef2f6'
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ bgcolor: '#f8fafc', borderRadius: 2 }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography fontWeight={700}>{loc.name}</Typography>
                    <Badge badgeContent={loc.assets.length} color="info" sx={{ ml: 2 }}>
                      <Box sx={{ width: 10 }} />
                    </Badge>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>STT</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Tên tài sản</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Mã tài sản</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Loại</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Tình trạng</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">Thao tác</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loc.assets.map((asset, aIdx) => (
                          <TableRow key={asset._id} hover>
                            <TableCell>{aIdx + 1}</TableCell>
                            <TableCell fontWeight={500}>{asset.typeId?.name}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', p: 0.5, borderRadius: 1, display: 'inline' }}>
                                {asset.assetCode}
                              </Typography>
                            </TableCell>
                            <TableCell>{asset.typeId?.categoryId?.name}</TableCell>
                            <TableCell>
                              <Chip 
                                label={asset.status === 'good' ? 'Bình thường' : 
                                       asset.status === 'damaged' ? 'Hỏng' : 
                                       asset.status === 'repairing' ? 'Đang sửa' : 'Khác'}
                                size="small"
                                color={asset.status === 'good' ? 'success' : 'error'}
                                variant="soft"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" color="primary"><EditIcon fontSize="small" /></IconButton>
                              <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ))
      )}
    </Box>
  );
};

export default AssetReportTab;
