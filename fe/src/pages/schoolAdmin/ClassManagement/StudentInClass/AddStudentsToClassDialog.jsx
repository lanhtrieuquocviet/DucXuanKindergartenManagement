import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  TextField,
  Alert,
  Stack,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  Tooltip,
  Checkbox,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  People as PeopleIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';
import { calcAge } from './helpers';

export default function AddStudentsToClassDialog({
  open,
  onClose,
  className,
  maxStudents,
  currentStudentCount,
  loadingAll,
  allStudents,
  addSearch,
  setAddSearch,
  addSelected,
  toggleAddStudent,
  addSubmitting,
  addError,
  setAddError,
  onSubmit,
  currentClassStudentIds,
}) {
  return (
    <Dialog
      open={open}
      onClose={() => !addSubmitting && onClose()}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, height: '80vh', display: 'flex', flexDirection: 'column' } }}
    >
      <DialogTitle sx={{ pb: 1, pr: 6 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Thêm học sinh vào lớp
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Chọn học sinh chưa có lớp để thêm vào <strong>{className}</strong>
          {maxStudents > 0 && ` (còn trống ${Math.max(0, maxStudents - currentStudentCount)} chỗ)`}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          disabled={addSubmitting}
          sx={{ position: 'absolute', top: 12, right: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Tìm kiếm tên học sinh..."
          value={addSearch}
          onChange={(e) => setAddSearch(e.target.value)}
          autoComplete="off"
        />
      </Box>

      {addError && (
        <Alert severity="error" sx={{ mx: 3, mb: 1 }} onClose={() => setAddError(null)}>
          {addError}
        </Alert>
      )}

      <DialogContent dividers sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
        {loadingAll ? (
          <Stack alignItems="center" py={5}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary" mt={1.5}>
              Đang tải danh sách...
            </Typography>
          </Stack>
        ) : (() => {
          const available = allStudents.filter((s) => !s.classId);
          const filtered = available.filter((s) =>
            s.fullName?.toLowerCase().includes(addSearch.toLowerCase())
          );
          if (filtered.length === 0) {
            return (
              <Stack alignItems="center" py={5}>
                <PeopleIcon sx={{ fontSize: 40, color: 'grey.300' }} />
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {addSearch ? 'Không tìm thấy học sinh' : 'Tất cả học sinh đã được xếp vào lớp'}
                </Typography>
              </Stack>
            );
          }
          return (
            <List disablePadding>
              {filtered.map((s, idx) => {
                const inThisClass = currentClassStudentIds.has(String(s._id));
                const isDisabled = inThisClass;
                const isSelected = addSelected.includes(s._id);
                const age = calcAge(s.dateOfBirth);

                return (
                  <ListItem
                    key={s._id}
                    divider={idx < filtered.length - 1}
                    disablePadding
                    sx={{
                      px: 2,
                      py: 0.75,
                      opacity: isDisabled ? 0.55 : 1,
                      bgcolor: isSelected ? '#f5f3ff' : 'transparent',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      '&:hover': !isDisabled ? { bgcolor: isSelected ? '#ede9fe' : 'grey.50' } : {},
                    }}
                    onClick={() => !isDisabled && toggleAddStudent(s._id)}
                  >
                    <ListItemAvatar sx={{ minWidth: 44 }}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: s.gender === 'female' ? '#fbcfe8' : '#bfdbfe',
                          color: s.gender === 'female' ? '#be185d' : '#1d4ed8',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                        }}
                      >
                        {s.fullName?.charAt(0)?.toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                          <Typography variant="body2" fontWeight={600}>
                            {s.fullName}
                          </Typography>
                          {age !== null && (
                            <Chip
                              label={`${age} tuổi`}
                              size="small"
                              sx={{ height: 18, fontSize: '0.62rem', bgcolor: 'grey.100', color: 'grey.600' }}
                            />
                          )}
                          {inThisClass && (
                            <Chip
                              label="Đã trong lớp"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.62rem',
                                bgcolor: '#f0fdf4',
                                color: '#15803d',
                                fontWeight: 600,
                              }}
                            />
                          )}
                          {s.needsSpecialAttention && (
                            <Tooltip title={s.specialNote || 'Cần chú ý đặc biệt'} arrow>
                              <Chip
                                icon={<WarningAmberIcon sx={{ fontSize: '0.65rem !important' }} />}
                                label="Chú ý"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.62rem',
                                  bgcolor: '#fef3c7',
                                  color: '#92400e',
                                  fontWeight: 600,
                                  cursor: 'help',
                                }}
                              />
                            </Tooltip>
                          )}
                        </Stack>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {s.gender === 'male' ? 'Nam' : s.gender === 'female' ? 'Nữ' : 'Khác'}
                          {s.dateOfBirth && ` · ${new Date(s.dateOfBirth).toLocaleDateString('vi-VN')}`}
                          {s.parentId?.fullName && ` · PH: ${s.parentId.fullName}`}
                        </Typography>
                      }
                    />
                    <Checkbox
                      edge="end"
                      checked={inThisClass || isSelected}
                      disabled={isDisabled}
                      size="small"
                      sx={{ color: '#7c3aed', '&.Mui-checked': { color: '#7c3aed' } }}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => !isDisabled && toggleAddStudent(s._id)}
                    />
                  </ListItem>
                );
              })}
            </List>
          );
        })()}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {addSelected.length > 0 ? `Đã chọn ${addSelected.length} học sinh` : 'Chưa chọn học sinh nào'}
        </Typography>
        <Button onClick={onClose} color="inherit" disabled={addSubmitting}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={addSelected.length === 0 || addSubmitting}
          sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, textTransform: 'none', fontWeight: 600 }}
        >
          {addSubmitting ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            `Thêm ${addSelected.length > 0 ? addSelected.length : ''} học sinh`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
