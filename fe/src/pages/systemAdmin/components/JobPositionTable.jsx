import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Stack,
  IconButton,
  CircularProgress,
  Box,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Work as WorkIcon,
} from '@mui/icons-material';

const JobPositionTable = ({
  loading,
  positions,
  onEdit,
  onDelete,
}) => {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Tên chức vụ</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Quyền hệ thống (Role)</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Mô tả</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="right">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                <CircularProgress size={40} />
                <Typography sx={{ mt: 2 }} color="text.secondary">Đang tải dữ liệu...</Typography>
              </TableCell>
            </TableRow>
          ) : positions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                <WorkIcon sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                <Typography color="text.secondary">Chưa có chức vụ nào được cấu hình</Typography>
              </TableCell>
            </TableRow>
          ) : (
            positions.map((pos) => (
              <TableRow key={pos._id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{pos.title}</Typography>
                  {pos.isDefault && (
                    <Chip label="Mặc định" size="small" variant="outlined" color="primary" sx={{ height: 20, fontSize: '0.65rem', ml: 1 }} />
                  )}
                </TableCell>
                <TableCell>
                  {pos.roleName ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <SecurityIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="body2" fontWeight={500}>
                        {pos.roleName}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      Chỉ lưu hồ sơ (Không có account)
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {pos.description || '—'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => onEdit(pos)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => onDelete(pos._id)}
                    disabled={pos.isDefault}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default JobPositionTable;
