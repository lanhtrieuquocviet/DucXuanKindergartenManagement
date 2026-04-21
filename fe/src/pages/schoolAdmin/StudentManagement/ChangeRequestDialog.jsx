import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Badge,
  Stack,
  CircularProgress,
  Typography,
} from '@mui/material';
import { CheckCircle as ResolveIcon } from '@mui/icons-material';

const ChangeRequestDialog = ({
  student,
  requests,
  loading,
  onClose,
  onResolve,
  resolvingId,
}) => {
  if (!student) return null;

  return (
    <Dialog open={!!student} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Yêu cầu chỉnh sửa: <strong>{student.fullName}</strong>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" py={2}>
            <CircularProgress size={24} />
          </Stack>
        ) : requests.length === 0 ? (
          <Typography color="text.secondary">Không có yêu cầu chờ xử lý.</Typography>
        ) : (
          <List size="small" sx={{ py: 0 }}>
            {requests.map((req) => (
              <ListItem
                key={req._id}
                divider
                sx={{ px: 1 }}
                secondaryAction={
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={
                      resolvingId === req._id ? <CircularProgress size={14} color="inherit" /> : <ResolveIcon />
                    }
                    onClick={() => onResolve(req._id)}
                    disabled={!!resolvingId}
                  >
                    Xác nhận
                  </Button>
                }
              >
                <ListItemText
                  primary={<Typography variant="subtitle2">{req.reason || 'Cập nhật thông tin học sinh'}</Typography>}
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Gửi bởi: {req.teacherId?.fullName || 'Giáo viên'} - {new Date(req.createdAt).toLocaleString('vi-VN')}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} color="inherit">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeRequestDialog;
