import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  TablePagination,
  CircularProgress,
  Chip,
  Tooltip,
  Stack,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  Security as SecurityIcon,
  VpnKey as PermIcon,
  Lock as LockIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { getRoleDisplayName } from '../utils/permissionUtils';

const RoleTable = ({
  loading,
  roles,
  jobPositions,
  roleSearch,
  setRoleSearch,
  rolePage,
  setRolePage,
  roleRowsPerPage,
  setRoleRowsPerPage,
  paginatedRoles,
  filteredRoles,
  onEdit,
  onDelete,
  onOpenPermissions,
}) => {
  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ 
        px: 3, 
        py: 2, 
        borderBottom: '1px solid', 
        borderColor: 'divider', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: 1 
      }}>
        <Typography variant="subtitle1" fontWeight={700}>Danh sách vai trò</Typography>
        <TextField
          size="small"
          placeholder="Tìm kiếm vai trò..."
          value={roleSearch}
          onChange={(e) => { setRoleSearch(e.target.value); setRolePage(0); }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 220 }}
        />
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, py: 2 }}>TÊN VAI TRÒ</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 2 }}>MÔ TẢ</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 2 }}>CHỨC VỤ LIÊN KẾT</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 2 }}>SỐ QUYỀN</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 2 }} align="center">THAO TÁC</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={32} thickness={5} sx={{ color: '#4f46e5' }} />
                  <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>
                    Đang tải danh sách vai trò...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : paginatedRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                  <Box sx={{ opacity: 0.5, mb: 1 }}>
                    <SecurityIcon sx={{ fontSize: 48 }} />
                  </Box>
                  <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    {roleSearch.trim() ? 'Không tìm thấy vai trò phù hợp' : 'Chưa có vai trò nào'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRoles.map((role) => {
                const roleId = role.id || role._id;
                const linkedPositions = jobPositions.filter(jp => jp.roleName === role.roleName);
                
                return (
                  <TableRow key={roleId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ py: 2 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                        {getRoleDisplayName(role.roleName)}
                      </Typography>
                      {role.parent && (
                        <Typography variant="caption" color="warning.dark" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
                          <LockIcon sx={{ fontSize: 12 }} /> kế thừa {getRoleDisplayName(typeof role.parent === 'string' ? role.parent : (role.parent.roleName || 'Parent'))}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography
                        variant="body2" color="text.secondary"
                        sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                      >
                        {role.description || (
                          <Box component="span" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                            Không có mô tả
                          </Box>
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {linkedPositions.length > 0 ? (
                          linkedPositions.map(jp => (
                            <Chip 
                              key={jp._id} 
                              label={jp.title} 
                              size="small" 
                              variant="outlined"
                              sx={{ 
                                height: 20, 
                                fontSize: '0.65rem', 
                                fontWeight: 600,
                                borderColor: 'primary.light',
                                color: 'primary.dark'
                              }} 
                            />
                          ))
                        ) : (
                          <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                            Chưa gán chức vụ
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Tooltip title="Nhấn để chỉnh sửa phân quyền">
                        <Chip
                          label={`${role.permissions?.length || 0} quyền`}
                          size="small"
                          clickable
                          onClick={() => onOpenPermissions(role)}
                          color={role.permissions?.length > 0 ? 'primary' : 'default'}
                          variant="outlined"
                          icon={<PermIcon sx={{ fontSize: '14px !important' }} />}
                          sx={{ fontWeight: 600, cursor: 'pointer' }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => onEdit(role)}
                          sx={{ fontSize: 12, borderColor: 'primary.light', color: 'primary.main', textTransform: 'none' }}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={loading ? <CircularProgress size={12} color="error" /> : <DeleteIcon />}
                          onClick={() => onDelete(roleId, role.roleName)}
                          disabled={loading}
                          sx={{ fontSize: 12, borderColor: 'error.light', color: 'error.main', textTransform: 'none' }}
                        >
                          Xóa
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {roles.length > 0 && (
        <TablePagination
          component="div"
          count={filteredRoles.length}
          page={rolePage}
          onPageChange={(_, newPage) => setRolePage(newPage)}
          rowsPerPage={roleRowsPerPage}
          onRowsPerPageChange={(e) => { setRoleRowsPerPage(parseInt(e.target.value, 10)); setRolePage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Số dòng/trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      )}
    </Paper>
  );
};

export default RoleTable;
