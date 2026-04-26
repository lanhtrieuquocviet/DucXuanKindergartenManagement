import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ContentCopy,
  WhatsApp,
  Sms, // Thêm icon SMS
  CheckCircleOutline,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const SuccessAccountDialog = ({ open, onClose, data, roleName = 'Người dùng' }) => {
  if (!data) return null;

  const { username, generatedPassword, fullName, phone } = data;

  const message = `Chào ${roleName} ${fullName},\nTrường Mầm non Đức Xuân xin gửi thông tin tài khoản đăng nhập hệ thống:\n- Tài khoản: ${username}\n- Mật khẩu tạm: ${generatedPassword}\n(Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu).`;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success('Đã sao chép nội dung tin nhắn!');
  };

  const handleOpenZalo = () => {
    const zaloUrl = `https://zalo.me/${phone}`;
    window.open(zaloUrl, '_blank');
  };

  const handleSendSMS = () => {
    // encodeURIComponent để xử lý các ký tự xuống dòng và đặc biệt trong tin nhắn
    const smsUrl = `sms:${phone}?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
        <CheckCircleOutline sx={{ fontSize: 60, color: 'success.main', mb: 1 }} />
        <Typography variant="h6" fontWeight={700}>
          Tạo tài khoản thành công!
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Họ tên:</Typography>
              <Typography variant="body2" fontWeight={600}>{fullName}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Tên đăng nhập:</Typography>
              <Typography variant="body2" fontWeight={700} color="primary">{username}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Mật khẩu tạm:</Typography>
              <Typography variant="body2" fontWeight={700} color="error">{generatedPassword}</Typography>
            </Box>
          </Stack>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
          Hệ thống cũng đã gửi một email thông báo đến người dùng.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 3, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<ContentCopy />}
          onClick={handleCopy}
          sx={{ py: 1 }}
        >
          Sao chép nội dung
        </Button>
        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
          <Button
            fullWidth
            variant="outlined"
            color="info"
            startIcon={<WhatsApp />}
            onClick={handleOpenZalo}
            sx={{ py: 1 }}
          >
            Gửi Zalo
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            startIcon={<Sms />}
            onClick={handleSendSMS}
            sx={{ py: 1 }}
          >
            Gửi SMS
          </Button>
        </Stack>
        <Button fullWidth onClick={onClose} color="inherit" sx={{ mt: 1 }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SuccessAccountDialog;
