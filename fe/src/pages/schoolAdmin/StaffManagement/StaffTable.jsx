import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const StaffTable = ({
  staff,
  onEdit,
  onDelete,
}) => {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead sx={{ bgcolor: '#f8fafc' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Nhân viên</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Chức vụ</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Số điện thoại</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {staff.map((item) => (
            <TableRow key={item._id} hover>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: '#eff6ff',
                      color: '#3b82f6',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    {item.fullName?.charAt(0)?.toUpperCase() || <PersonIcon />}
                  </Avatar>
                  <Typography variant="body2" fontWeight={600}>
                    {item.fullName}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Chip
                  label={item.position || '—'}
                  size="small"
                  sx={{
                    bgcolor: '#f1f5f9',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">{item.email || '—'}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{item.phone || '—'}</Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={item.status === 'active' ? 'Đang hoạt động' : 'Tạm khóa'}
                  size="small"
                  variant="outlined"
                  color={item.status === 'active' ? 'success' : 'error'}
                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                />
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  <Tooltip title="Chỉnh sửa">
                    <IconButton size="small" onClick={() => onEdit(item)} color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <IconButton size="small" onClick={() => onDelete(item)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default StaffTable;
