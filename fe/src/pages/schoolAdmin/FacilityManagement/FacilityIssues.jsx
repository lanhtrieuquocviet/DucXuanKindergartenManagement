import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Button,
  Stack, Divider
} from '@mui/material';
import {
  ReportProblem as IssueIcon,
  Build as FixIcon,
  CheckCircle as ApproveIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import facilityService from '../../../service/facility.api';
import { toast } from 'react-toastify';

const FacilityIssues = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const resp = await facilityService.getIssues();
      if (resp?.status === 'success') {
        setIssues(resp.data || []);
      }
    } catch (error) {}
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const resp = await facilityService.updateIssueStatus(id, status);
      if (resp?.status === 'success') {
        toast.success(`Đã cập nhật trạng thái: ${status}`);
        fetchIssues();
      }
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
    }
  };

  return (
    <Box>
      <Box sx={{ width: '100%', px: { xs: 1, md: 3 }, boxSizing: 'border-box', mt: -2 }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white', minHeight: 'calc(100vh - 150px)' }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight={900} color="#1e293b">Danh sách Báo cáo Sự cố & Hư hỏng</Typography>
            <Typography variant="body2" color="text.secondary">Tiếp nhận và theo dõi quá trình sửa chữa, khắc phục tài sản trường học</Typography>
          </Box>

          <TableContainer component={Box} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Tài sản</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Mô tả sự cố</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Mức độ</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }} align="center">Thao tác xử lý</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {issues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">Hiện chưa có báo cáo sự cố nào cần xử lý.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  issues.map(issue => (
                    <TableRow key={issue._id} hover>
                      <TableCell sx={{ py: 2 }}>
                        <Typography fontWeight={700} sx={{ color: '#1e293b' }}>{issue.assetItemId?.typeId?.name}</Typography>
                        <Typography variant="caption" sx={{ bgcolor: '#f1f5f9', px: 1, borderRadius: 0.5, fontWeight: 600 }}>{issue.assetItemId?.assetCode}</Typography>
                      </TableCell>
                      <TableCell>{issue.description}</TableCell>
                      <TableCell>
                        <Chip 
                          label={issue.severity === 'high' ? 'Nghiêm trọng' : issue.severity === 'medium' ? 'Trung bình' : 'Nhẹ'} 
                          sx={{ 
                            fontWeight: 700, 
                            borderRadius: 1,
                            bgcolor: issue.severity === 'high' ? '#fef2f2' : '#fffbeb',
                            color: issue.severity === 'high' ? '#dc2626' : '#d97706'
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={issue.status === 'reported' ? 'Vừa báo cáo' : issue.status === 'fixing' ? 'Đang sửa' : 'Đã xong'} 
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 600, borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          {issue.status === 'reported' && (
                            <Button 
                              size="small" 
                              variant="outlined" 
                              startIcon={<FixIcon />}
                              onClick={() => handleUpdateStatus(issue._id, 'fixing')}
                              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                            >
                              Xác nhận sửa
                            </Button>
                          )}
                          {issue.status === 'fixing' && (
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="success" 
                              startIcon={<ApproveIcon />}
                              onClick={() => handleUpdateStatus(issue._id, 'fixed')}
                              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
                            >
                              Hoàn thành
                            </Button>
                          )}
                          <Button 
                            size="small" 
                            variant="text" 
                            sx={{ borderRadius: 1.5, textTransform: 'none', color: '#64748b' }}
                          >
                            Chi tiết
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default FacilityIssues;
