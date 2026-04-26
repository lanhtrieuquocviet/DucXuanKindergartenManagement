import {
  AdminPanelSettings as AdminIcon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  TableChart as TableChartIcon,
  ViewList as ViewListIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';

function PermissionAssignmentPanel({
  selectedRole,
  roles,
  handleSelectRole,
  assignSearch,
  setAssignSearch,
  handleSelectAll,
  handleDeselectAll,
  viewMode,
  setViewMode,
  handleSaveRolePermissions,
  selectedPermissions,
  inheritedPermissions,
  relevantGroups,
  showAllPerms,
  setShowAllPerms,
  matrixData,
  calculateProgress,
  toggleGroupRow,
  toggleCellPerms,
  setHoveredPerm,
  togglePermission,
  assignGroups,
  getActionStyle,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        height: 'calc(100vh - 280px)',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      {/* Role Selection Header */}
      <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc' }}>
        <Typography variant="subtitle2" fontWeight={800} mb={2} color="text.primary">
          PHÂN QUYỀN CHO VAI TRÒ
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            pb: 1,
            whiteSpace: 'nowrap',
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'rgba(79, 70, 229, 0.2)',
              borderRadius: 10,
            },
            '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.02)' },
          }}
        >
          {roles
            .filter((r) => !['Parent', 'Student'].includes(r.roleName))
            .map((role) => {
              const roleId = role.id || role._id;
              const isSelected =
                selectedRole && (selectedRole.id || selectedRole._id) === roleId;
              return (
                <Chip
                  key={roleId}
                  label={role.roleName}
                  onClick={() => handleSelectRole(role)}
                  sx={{
                    px: 1,
                    height: 36,
                    fontWeight: isSelected ? 800 : 500,
                    bgcolor: isSelected ? '#4f46e5' : 'white',
                    color: isSelected ? 'white' : 'text.primary',
                    border: '1px solid',
                    borderColor: isSelected ? 'transparent' : 'rgba(0,0,0,0.1)',
                    '&:hover': { bgcolor: isSelected ? '#4338ca' : 'rgba(0,0,0,0.05)' },
                    borderRadius: 3,
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? '0 4px 10px rgba(79, 70, 229, 0.3)' : 'none',
                  }}
                  icon={
                    isSelected ? (
                      <CheckCircleIcon sx={{ color: 'white !important', fontSize: 18 }} />
                    ) : null
                  }
                />
              );
            })}
        </Box>
      </Box>

      {!selectedRole ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ flex: 1, bgcolor: 'rgba(0,0,0,0.01)' }}
          spacing={2}
        >
          <Box sx={{ p: 3, borderRadius: '50%', bgcolor: 'rgba(79, 70, 229, 0.05)' }}>
            <AdminIcon sx={{ fontSize: 64, color: '#4f46e5', opacity: 0.5 }} />
          </Box>
          <Typography variant="body1" fontWeight={600} color="text.secondary">
            Chọn một vai trò để bắt đầu thiết lập quyền
          </Typography>
        </Stack>
      ) : (
        <>
          {/* Assignment Controls */}
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Lọc chức năng..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ fontSize: 18, color: 'text.disabled', mr: 1 }} />
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
              />
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={handleSelectAll}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Chọn tất
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={handleDeselectAll}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  color: 'text.secondary',
                }}
              >
                Bỏ hết
              </Button>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                size="small"
                onChange={(_, v) => v && setViewMode(v)}
                sx={{ height: 32 }}
              >
                <ToggleButton value="matrix" sx={{ px: 1.5, borderRadius: '8px 0 0 8px' }}>
                  <TableChartIcon sx={{ fontSize: 18 }} />
                </ToggleButton>
                <ToggleButton value="list" sx={{ px: 1.5, borderRadius: '0 8px 8px 0' }}>
                  <ViewListIcon sx={{ fontSize: 18 }} />
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            <Button
              variant="contained"
              onClick={handleSaveRolePermissions}
              startIcon={<SaveIcon />}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 800,
                px: 3,
                bgcolor: '#4f46e5',
                '&:hover': { bgcolor: '#4338ca' },
              }}
            >
              Lưu cấu hình
            </Button>
          </Box>

          {/* Main Content Area */}
          <Box sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
            {/* Summary Bar */}
            <Box
              sx={{
                px: 3,
                py: 1.5,
                bgcolor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                sticky: 'top',
                zIndex: 10,
              }}
            >
              <Typography variant="body2" fontWeight={700} color="#1e40af">
                Đang thiết lập cho:{' '}
                <Box component="span" sx={{ color: '#4f46e5', ml: 0.5 }}>
                  {selectedRole.roleName}
                </Box>
              </Typography>
              <Chip
                label={`${selectedPermissions.size} quyền riêng`}
                size="small"
                sx={{ bgcolor: 'white', fontWeight: 700, fontSize: 11, color: '#4f46e5' }}
              />
              {inheritedPermissions.size > 0 && (
                <Chip
                  label={`${inheritedPermissions.size} kế thừa`}
                  size="small"
                  icon={<LockIcon sx={{ fontSize: 12 }} />}
                  sx={{
                    bgcolor: 'rgba(234, 179, 8, 0.1)',
                    fontWeight: 700,
                    fontSize: 11,
                    color: '#92400e',
                  }}
                />
              )}
              <Box sx={{ flex: 1 }} />
              {relevantGroups !== null && (
                <Button
                  size="small"
                  onClick={() => setShowAllPerms(!showAllPerms)}
                  sx={{ textTransform: 'none', fontWeight: 700, fontSize: 11 }}
                >
                  {showAllPerms ? 'Hiện nhóm liên quan' : 'Hiện tất cả các nhóm'}
                </Button>
              )}
            </Box>

            {viewMode === 'matrix' && matrixData ? (
              <TableContainer sx={{ maxHeight: '100%' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          minWidth: 200,
                          fontWeight: 900,
                          bgcolor: 'grey.50',
                          borderRight: '1px solid',
                          borderColor: 'divider',
                          fontSize: 11,
                          color: 'text.secondary',
                        }}
                      >
                        NHÓM CHỨC NĂNG
                      </TableCell>
                      {matrixData.actions.map((action) => (
                        <TableCell
                          key={action}
                          align="center"
                          sx={{
                            fontWeight: 800,
                            bgcolor: 'grey.50',
                            fontSize: 11,
                            color: 'text.secondary',
                            minWidth: 80,
                          }}
                        >
                          {action}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {matrixData.groups.map((group) => {
                      const allGroupPerms = Object.values(
                        matrixData.groupMap[group] || {}
                      ).flat();
                      const editableGroupPerms = allGroupPerms.filter(
                        (p) => !inheritedPermissions.has(p.code)
                      );
                      const checkedCount = allGroupPerms.filter(
                        (p) =>
                          selectedPermissions.has(p.code) ||
                          inheritedPermissions.has(p.code)
                      ).length;
                      const progress = calculateProgress(allGroupPerms);

                      return (
                        <TableRow
                          key={group}
                          hover
                          sx={{
                            '&:hover td': { bgcolor: 'rgba(79, 70, 229, 0.02) !important' },
                          }}
                        >
                          <TableCell
                            sx={{
                              borderRight: '1px solid',
                              borderColor: 'divider',
                              py: 1.5,
                              position: 'sticky',
                              left: 0,
                              bgcolor: 'white',
                              zIndex: 1,
                            }}
                          >
                            <Stack direction="row" alignItems="flex-start" spacing={1}>
                              <Checkbox
                                size="small"
                                checked={
                                  editableGroupPerms.length > 0 &&
                                  editableGroupPerms.every((p) =>
                                    selectedPermissions.has(p.code)
                                  )
                                }
                                indeterminate={
                                  checkedCount > 0 && checkedCount < allGroupPerms.length
                                }
                                onChange={() => toggleGroupRow(allGroupPerms)}
                                disabled={editableGroupPerms.length === 0}
                                sx={{ p: 0, mt: 0.25 }}
                              />
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  variant="body2"
                                  fontWeight={800}
                                  color="text.primary"
                                  sx={{ fontSize: 13 }}
                                >
                                  {group}
                                </Typography>
                                <Box
                                  sx={{
                                    mt: 1,
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                  }}
                                >
                                  <LinearProgress
                                    variant="determinate"
                                    value={progress}
                                    sx={{
                                      flex: 1,
                                      height: 4,
                                      borderRadius: 2,
                                      bgcolor: 'grey.100',
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: progress === 100 ? '#10b981' : '#4f46e5',
                                      },
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: 'text.disabled',
                                    }}
                                  >
                                    {progress}%
                                  </Typography>
                                </Box>
                              </Box>
                            </Stack>
                          </TableCell>
                          {matrixData.actions.map((action) => {
                            const cellPerms = matrixData.groupMap[group]?.[action] || [];
                            if (cellPerms.length === 0)
                              return (
                                <TableCell key={action} align="center" sx={{ opacity: 0.2 }}>
                                  –
                                </TableCell>
                              );

                            const editableInCell = cellPerms.filter(
                              (p) => !inheritedPermissions.has(p.code)
                            );
                            const isAllInherited = editableInCell.length === 0;
                            const isChecked = cellPerms.every(
                              (p) =>
                                selectedPermissions.has(p.code) ||
                                inheritedPermissions.has(p.code)
                            );
                            const isSomeChecked =
                              cellPerms.some(
                                (p) =>
                                  selectedPermissions.has(p.code) ||
                                  inheritedPermissions.has(p.code)
                              ) && !isChecked;

                            const cellStyle = getActionStyle(cellPerms[0].code);

                            return (
                              <TableCell
                                key={action}
                                align="center"
                                onClick={() =>
                                  !isAllInherited && toggleCellPerms(editableInCell, isChecked)
                                }
                                onMouseEnter={() => setHoveredPerm(cellPerms[0])}
                                onMouseLeave={() => setHoveredPerm(null)}
                                sx={{
                                  cursor: isAllInherited ? 'default' : 'pointer',
                                  transition: 'all 0.1s',
                                  bgcolor: isChecked ? `${cellStyle.bg} !important` : 'transparent',
                                }}
                              >
                                <Tooltip
                                  title={
                                    <Box sx={{ p: 0.5 }}>
                                      {cellPerms.map((p) => (
                                        <Box
                                          key={p.code}
                                          sx={{ mb: 1, '&:last-child': { mb: 0 } }}
                                        >
                                          <Typography
                                            variant="caption"
                                            fontWeight={900}
                                            sx={{ display: 'block', color: '#818cf8' }}
                                          >
                                            {p.code}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            sx={{ display: 'block', opacity: 0.8 }}
                                          >
                                            {p.description}
                                          </Typography>
                                          {inheritedPermissions.has(p.code) && (
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                color: '#fbbf24',
                                                fontWeight: 700,
                                                mt: 0.5,
                                              }}
                                            >
                                              <LockIcon sx={{ fontSize: 10 }} /> Kế thừa từ{' '}
                                              {selectedRole.parentName}
                                            </Typography>
                                          )}
                                        </Box>
                                      ))}
                                    </Box>
                                  }
                                >
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                    }}
                                  >
                                    {isAllInherited ? (
                                      <LockIcon sx={{ fontSize: 18, color: '#92400e' }} />
                                    ) : (
                                      <Checkbox
                                        size="small"
                                        checked={isChecked}
                                        indeterminate={isSomeChecked}
                                        sx={{
                                          p: 0,
                                          color: cellStyle.text,
                                          '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                                            color: cellStyle.text,
                                          },
                                        }}
                                      />
                                    )}
                                  </Box>
                                </Tooltip>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 3 }}>
                {Object.entries(assignGroups).map(([groupName, groupPerms]) => (
                  <Box
                    key={groupName}
                    sx={{
                      mb: 3,
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 4,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={800} mb={2}>
                      {groupName}
                    </Typography>
                    <Grid container spacing={2}>
                      {groupPerms.map((perm) => {
                        const isInherited = inheritedPermissions.has(perm.code);
                        const isChecked = isInherited || selectedPermissions.has(perm.code);
                        const style = getActionStyle(perm.code);
                        return (
                          <Grid item xs={12} md={6} key={perm.code}>
                            <Box
                              onClick={() => !isInherited && togglePermission(perm.code)}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 1.5,
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: isChecked ? style.text : 'rgba(0,0,0,0.05)',
                                bgcolor: isChecked ? style.bg : 'white',
                                cursor: isInherited ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': !isInherited
                                  ? { borderColor: style.text, transform: 'translateY(-2px)' }
                                  : {},
                              }}
                            >
                              {isInherited ? (
                                <LockIcon sx={{ mr: 1.5, fontSize: 18, color: '#92400e' }} />
                              ) : (
                                <Checkbox
                                  checked={isChecked}
                                  size="small"
                                  sx={{
                                    p: 0,
                                    mr: 1.5,
                                    color: style.text,
                                    '&.Mui-checked': { color: style.text },
                                  }}
                                />
                              )}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  fontWeight={800}
                                  sx={{
                                    color: isChecked ? style.text : 'text.primary',
                                    fontSize: 12,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {perm.description || perm.code}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
}

export default PermissionAssignmentPanel;
