import {
  AddCircle as AddIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  ContentPaste as PasteIcon,
  Search as SearchIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Collapse,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

function PermissionListPanel({
  listGroups,
  permSearch,
  setPermSearch,
  collapsedGroups,
  toggleGroupCollapse,
  handleOpenPermissionForm,
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
      <Box
        sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={800}
          mb={1.5}
          color="text.primary"
          sx={{ fontSize: 12 }}
        >
          DANH MỤC QUYỀN HẠN
        </Typography>
        <TextField
          size="small"
          fullWidth
          placeholder="Tìm kiếm..."
          value={permSearch}
          onChange={(e) => setPermSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'white',
              height: 36,
              fontSize: 13,
              '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
            },
          }}
        />
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
        {Object.entries(listGroups).length === 0 ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ height: '100%', opacity: 0.5 }}
          >
            <PasteIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body2">Không tìm thấy quyền</Typography>
          </Stack>
        ) : (
          <Stack spacing={2}>
            {Object.entries(listGroups).map(([groupName, groupPerms]) => (
              <Box
                key={groupName}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.light',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{ px: 2, py: 1.5, bgcolor: 'rgba(0,0,0,0.02)', cursor: 'pointer' }}
                  onClick={() => toggleGroupCollapse(`list_${groupName}`)}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="caption"
                      fontWeight={800}
                      color="primary.main"
                      sx={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.5px' }}
                    >
                      {groupName}
                    </Typography>
                  </Box>
                  {collapsedGroups[`list_${groupName}`] ? (
                    <ExpandMoreIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                  ) : (
                    <ExpandLessIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                  )}
                </Stack>
                <Collapse in={!collapsedGroups[`list_${groupName}`]}>
                  <Stack spacing={0} sx={{ p: 1 }}>
                    {groupPerms.map((perm) => {
                      const style = getActionStyle(perm.code);
                      return (
                        <Box
                          key={perm._id || perm.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 0.75,
                            borderRadius: 1.5,
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                          }}
                        >
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: 1,
                              mr: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: style.bg,
                              color: style.text,
                              flexShrink: 0,
                            }}
                          >
                            {style.icon}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              sx={{
                                fontSize: 11,
                                color: '#1e293b',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {perm.description || perm.code}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            sx={{
                              ml: 0.5,
                              color: 'text.disabled',
                              '&:hover': { color: 'primary.main' },
                            }}
                            onClick={() => handleOpenPermissionForm(perm)}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      );
                    })}
                  </Stack>
                </Collapse>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenPermissionForm()}
          sx={{
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 700,
            py: 1,
            boxShadow: 'none',
          }}
        >
          Thêm quyền mới
        </Button>
      </Box>
    </Paper>
  );
}

export default PermissionListPanel;
