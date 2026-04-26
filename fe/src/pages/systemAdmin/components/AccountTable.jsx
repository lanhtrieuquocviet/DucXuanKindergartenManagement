import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

function AccountTable({
  users,
  paginatedUsers,
  filteredUsers,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  loading,
  isMdDown,
}) {
  const renderRoleNames = (account) => {
    const roleNames = (account.roles || [])
      .map((r) => r.roleName || (typeof r === 'string' ? r : ''))
      .filter(Boolean);
    if (roleNames.length === 0)
      return (
        <Typography variant="caption" color="text.disabled">
          Chưa gán vai trò
        </Typography>
      );
    return roleNames.map((name) => (
      <Chip
        key={name}
        label={name}
        size="small"
        variant="outlined"
        sx={{ mr: 0.5, mb: 0.25 }}
      />
    ));
  };

  const getUserInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(-2)
      .join('')
      .toUpperCase();
  };

  return (
    <>
      <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%' }}>
        <Table size="small" sx={{ minWidth: isMdDown ? 640 : undefined }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: 12, sm: 13 },
                  px: { xs: 1.5, sm: 2 },
                  whiteSpace: 'nowrap',
                }}
              >
                Tài khoản & Họ tên
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: 12, sm: 13 },
                  px: { xs: 1.5, sm: 2 },
                  display: { xs: 'none', md: 'table-cell' },
                }}
              >
                Email
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: 12, sm: 13 },
                  px: { xs: 1.5, sm: 2 },
                  display: { xs: 'none', lg: 'table-cell' },
                }}
              >
                Vai trò
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: 12, sm: 13 },
                  px: { xs: 1.5, sm: 2 },
                  whiteSpace: 'nowrap',
                }}
              >
                Trạng thái
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: 12, sm: 13 },
                  px: { xs: 1, sm: 2 },
                  whiteSpace: 'nowrap',
                }}
              >
                Thao tác
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{ py: 5, color: 'text.secondary' }}
                >
                  Chưa có tài khoản nào trong hệ thống.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((account) => {
                const userId = account._id || account.id;
                return (
                  <TableRow key={userId} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ px: { xs: 1.5, sm: 2 } }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar 
                          src={account.avatarUrl} 
                          sx={{ 
                            width: 36, 
                            height: 36, 
                            bgcolor: 'rgba(99,102,241,0.1)',
                            color: 'primary.main',
                            border: '1px solid rgba(99,102,241,0.2)',
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                          >
                            {account.username}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            noWrap
                          >
                            {account.fullName || 'Chưa cập nhật tên'}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell
                      sx={{
                        px: { xs: 1.5, sm: 2 },
                        display: { xs: 'none', md: 'table-cell' },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 160,
                        }}
                        title={account.email}
                      >
                        {account.email}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        px: { xs: 1.5, sm: 2 },
                        display: { xs: 'none', lg: 'table-cell' },
                      }}
                    >
                      {renderRoleNames(account)}
                    </TableCell>
                    <TableCell sx={{ px: { xs: 1.5, sm: 2 } }}>
                      <Chip
                        label={
                          account.status === 'active'
                            ? 'Đang làm việc'
                            : account.status === 'maternity_leave'
                            ? 'Nghỉ thai sản'
                            : account.status === 'on_leave'
                            ? 'Nghỉ phép'
                            : account.status === 'resigned'
                            ? 'Đã thôi việc'
                            : 'Đã khóa'
                        }
                        size="small"
                        color={
                          account.status === 'active'
                            ? 'success'
                            : account.status === 'maternity_leave'
                            ? 'warning'
                            : account.status === 'resigned'
                            ? 'error'
                            : 'default'
                        }
                        variant="filled"
                        sx={{ fontWeight: 600, fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ px: { xs: 1, sm: 2 } }}>
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onEdit(account)}
                          title="Sửa"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={loading}
                          onClick={() => onDelete(account)}
                          title="Xóa"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {users.length > 0 && (
        <TablePagination
          component="div"
          count={filteredUsers.length}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Số dòng/trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            flexWrap: 'wrap',
            '& .MuiTablePagination-toolbar': {
              flexWrap: 'wrap',
              minHeight: { xs: 52, sm: 52 },
              px: { xs: 1.5, sm: 2 },
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
            },
          }}
        />
      )}
    </>
  );
}

export default AccountTable;
