import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Grid,
  Checkbox,
  Collapse,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  VpnKey as PermIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { groupByField, getRoleDisplayName } from '../utils/permissionUtils';

const RolePermissionDialog = ({
  open,
  onClose,
  selectedRole,
  permissions,
  selectedPermissions,
  inheritedPermissions,
  permSearch,
  setPermSearch,
  collapsedGroups,
  onToggleGroup,
  onTogglePermission,
  loading,
  onSubmit,
}) => {
  if (!selectedRole) return null;

  const groupedPermissions = groupByField(
    permissions.filter(p => 
      p.code.toLowerCase().includes(permSearch.toLowerCase()) || 
      p.description.toLowerCase().includes(permSearch.toLowerCase())
    )
  );

  return (
    <Dialog
      open={open && !!selectedRole}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 2, overflow: 'hidden', maxHeight: '90vh' } } }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
        }}
      >
        <PermIcon sx={{ color: 'white', fontSize: 24 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} color="white" noWrap>
            Phân quyền: {getRoleDisplayName(selectedRole.roleName)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
            Chọn các quyền hạn cụ thể cho vai trò này
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Tìm kiếm quyền hạn theo mã hoặc mô tả..."
          value={permSearch}
          onChange={(e) => setPermSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            sx: { bgcolor: 'white' }
          }}
        />
      </Box>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {Object.entries(groupedPermissions).map(([group, perms]) => (
            <Box key={group} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'white' }}>
              <Box 
                onClick={() => onToggleGroup(group)}
                sx={{ 
                  px: 2, py: 1.5, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', 
                  justifyContent: 'space-between', cursor: 'pointer',
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <ShieldIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="subtitle2" fontWeight={700}>{group}</Typography>
                  <Typography variant="caption" color="text.disabled">({perms.length} quyền)</Typography>
                </Box>
                <IconButton size="small">
                  {collapsedGroups[group] ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
                </IconButton>
              </Box>
              
              <Collapse in={!collapsedGroups[group]}>
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={1}>
                    {perms.map((perm) => {
                      const isInherited = inheritedPermissions.has(perm.code);
                      const isSelected = selectedPermissions.has(perm.code) || isInherited;
                      
                      return (
                        <Grid item xs={12} sm={6} key={perm._id}>
                          <Tooltip title={isInherited ? "Quyền này được kế thừa từ role cha, không thể xóa bỏ ở đây" : perm.description} arrow>
                            <Box 
                              onClick={() => !isInherited && onTogglePermission(perm.code)}
                              sx={{ 
                                display: 'flex', alignItems: 'flex-start', p: 1, borderRadius: 1.5,
                                border: '1px solid', borderColor: isSelected ? 'primary.light' : 'transparent',
                                bgcolor: isSelected ? 'rgba(79, 70, 229, 0.04)' : 'transparent',
                                cursor: isInherited ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: isInherited ? 'rgba(79, 70, 229, 0.04)' : 'rgba(0,0,0,0.02)' }
                              }}
                            >
                              <Checkbox 
                                size="small" 
                                checked={isSelected} 
                                disabled={isInherited}
                                sx={{ p: 0.5, mt: -0.25 }}
                              />
                              <Box sx={{ ml: 0.5 }}>
                                <Typography variant="body2" fontWeight={600} color={isSelected ? 'primary.dark' : 'text.primary'}>
                                  {perm.code}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                                  {perm.description}
                                </Typography>
                              </Box>
                            </Box>
                          </Tooltip>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              </Collapse>
            </Box>
          ))}
          {Object.keys(groupedPermissions).length === 0 && (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled' }}>
              <Typography variant="body2">Không tìm thấy quyền hạn nào khớp với từ khóa</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Đóng</Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, px: 4, fontWeight: 700 }}
        >
          {loading ? 'Đang lưu...' : 'Lưu phân quyền'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RolePermissionDialog;
