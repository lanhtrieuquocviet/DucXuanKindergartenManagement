// Modal chi tiết điểm danh: hỗ trợ 3 chế độ view / checkin / checkout
import { post, get, postFormData, ENDPOINTS } from '../../../service/api';
import CameraCapture from '../../../components/CameraCapture';
import {
  sanitizeMultiLineText,
  sanitizePersonName,
  MAX_NOTE_LEN,
  MAX_BELONGINGS_NOTE_LEN,
  MAX_PERSON_NAME_LEN,
  MAX_PERSON_PHONE_LEN,
  PHONE_REGEX,
} from './attendanceUtils';
import { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogContent, DialogActions, DialogTitle,
  Box, Grid, Typography, Button, TextField, Select,
  FormControl, InputLabel, MenuItem, Alert, IconButton,
  Chip, FormControlLabel, Checkbox, Paper,
  Stack, Avatar, Divider,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Login as CheckInIcon,
  Logout as CheckOutIcon,
  Visibility as ViewIcon,
  Save as SaveIcon,
  Send as SendIcon,
  PhoneAndroid as PhoneIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  SmartToy as SmartToyIcon,
  Backpack as BackpackIcon,
  CameraAlt as CameraAltIcon,
  WarningAmber as WarningAmberIcon,
  HourglassEmpty as HourglassIcon,
  ContactPhone as ContactPhoneIcon,
} from '@mui/icons-material';

// Helper hiển thị ảnh preview
const renderImagePreview = (imageValue, altText) => {
  if (!imageValue) return null;
  if (!/^https?:\/\//i.test(imageValue)) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        Đã chọn: {imageValue}
      </Typography>
    );
  }
  return (
    <Box component="a" href={imageValue} target="_blank" rel="noreferrer" sx={{ display: 'inline-block', mt: 1 }}>
      <Box
        component="img"
        src={imageValue}
        alt={altText}
        sx={{ width: 80, height: 80, borderRadius: 1.5, objectFit: 'cover', border: '1px solid', borderColor: 'divider' }}
      />
    </Box>
  );
};

// ── Parent Confirm Section ──
function ParentConfirmSection({ detailForm, setDetailForm, student, approvedPickupPersons = [], onSendToParent, confirmCountdown, sending }) {
  const teacherConfirmed = !!detailForm.teacherConfirmedCheckout;
  const sent = !!detailForm.parentConfirmSent;
  const confirmed = !!detailForm.parentConfirmed;
  const timedOut = sent && !confirmed && confirmCountdown <= 0;

  const handleToggleTeacherConfirm = () => {
    setDetailForm((prev) => ({
      ...prev,
      teacherConfirmedCheckout: !prev.teacherConfirmedCheckout,
      ...(prev.parentConfirmed ? {} : { parentConfirmSent: false }),
    }));
  };

  const countdownMin = Math.floor(confirmCountdown / 60);
  const countdownSec = String(confirmCountdown % 60).padStart(2, '0');

  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 2 }}>
        <Chip
          icon={<PhoneIcon sx={{ fontSize: '14px !important' }} />}
          label="Xác nhận phụ huynh"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: 11 }}
        />
      </Divider>

      {/* Toggle giáo viên tự xác nhận */}
      <Paper
        variant="outlined"
        onClick={handleToggleTeacherConfirm}
        sx={{
          p: 1.5, borderRadius: 2, mb: 1.5, cursor: 'pointer',
          borderColor: teacherConfirmed ? 'warning.main' : 'divider',
          bgcolor: teacherConfirmed ? '#fffbeb' : 'grey.50',
          transition: 'all 0.15s',
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              color="warning"
              checked={teacherConfirmed}
              onChange={() => {}}
              onClick={(e) => e.stopPropagation()}
            />
          }
          label={
            <Box>
              <Typography variant="body2" fontWeight={700} color={teacherConfirmed ? 'warning.dark' : 'text.secondary'}>
                Giáo viên xác nhận trực tiếp (bỏ qua xác nhận PH)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Phụ huynh đã thông báo trước hoặc giáo viên tin tưởng người đón
              </Typography>
            </Box>
          }
          sx={{ m: 0, alignItems: 'flex-start' }}
        />
      </Paper>

      {teacherConfirmed ? (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: 'warning.300', bgcolor: '#fffbeb' }}>
          <Typography variant="caption" color="warning.dark" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <WarningAmberIcon sx={{ fontSize: 14 }} />
            Giáo viên chịu trách nhiệm xác nhận danh tính người đón. Hành động này được ghi lại trong hệ thống.
          </Typography>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
          {/* Trạng thái đã xác nhận */}
          {confirmed ? (
            <Box sx={{ bgcolor: '#f0fdf4', borderRadius: 2, p: 1.5, border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 22 }} />
              <Box>
                <Typography variant="body2" fontWeight={700} color="success.main">Phụ huynh đã xác nhận</Typography>
                <Typography variant="caption" color="text.secondary">Có thể lưu điểm danh về ngay bây giờ</Typography>
              </Box>
            </Box>
          ) : sent && !timedOut ? (
            /* Đang chờ PH xác nhận */
            <Box>
              <Box sx={{ bgcolor: '#eff6ff', borderRadius: 2, p: 1.5, border: '1px solid #93c5fd', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <HourglassIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={700} color="primary.main">Đang chờ phụ huynh xác nhận...</Typography>
                  <Typography variant="caption" color="text.secondary">Thông tin đã được gửi tới phụ huynh</Typography>
                </Box>
                <Chip
                  label={`${countdownMin}:${countdownSec}`}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 700, fontSize: 12, height: 22 }}
                />
              </Box>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                startIcon={<SendIcon sx={{ fontSize: 14 }} />}
                onClick={onSendToParent}
                disabled={sending}
                sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}
              >
                Gửi lại
              </Button>
            </Box>
          ) : timedOut ? (
            /* Hết 2 phút, hiện thông tin liên hệ */
            <Box>
              <Box sx={{ bgcolor: '#fff7ed', borderRadius: 2, p: 1.5, border: '1px solid #fed7aa', mb: 1.5 }}>
                <Typography variant="caption" fontWeight={700} color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <ContactPhoneIcon sx={{ fontSize: 14 }} />Phụ huynh chưa xác nhận – Thông tin liên hệ
                </Typography>
                {student?.parentId && (
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    👨‍👩‍👧 {student.parentId.fullName || 'Phụ huynh'}: <strong>{student.parentId.phone || '—'}</strong>
                  </Typography>
                )}
                {approvedPickupPersons.length > 0 && (
                  <>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Người đưa đón đã đăng ký:</Typography>
                    {approvedPickupPersons.map((p) => (
                      <Typography key={p._id} variant="body2" sx={{ mb: 0.25 }}>
                        {p.fullName} ({p.relation}): <strong>{p.phone}</strong>
                      </Typography>
                    ))}
                  </>
                )}
              </Box>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                startIcon={<SendIcon sx={{ fontSize: 14 }} />}
                onClick={onSendToParent}
                disabled={sending}
                sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}
              >
                Gửi lại cho phụ huynh
              </Button>
            </Box>
          ) : (
            /* Chưa gửi */
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>
                Gửi thông tin người đón và ảnh cho phụ huynh xác nhận qua ứng dụng.
                Nếu sau 2 phút chưa xác nhận, bạn sẽ thấy thông tin liên hệ để gọi điện.
              </Typography>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
                onClick={onSendToParent}
                disabled={sending}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
              >
                {sending ? 'Đang gửi...' : 'Gửi thông tin cho phụ huynh'}
              </Button>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}

// ── FileUpload helper ──
function FileUploadField({ label, currentValue, onUpload, required, readOnly }) {
  if (readOnly) {
    return (
      <Box>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
          {label}
        </Typography>
        {currentValue
          ? renderImagePreview(currentValue, label)
          : (
            <Typography variant="caption" color="text.disabled" fontStyle="italic">Chưa có ảnh</Typography>
          )
        }
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
        {label}{required && <Box component="span" sx={{ color: 'error.main' }}> *</Box>}
      </Typography>
      <Box
        component="label"
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          px: 2, py: 1.5, borderRadius: 2,
          border: '2px dashed',
          borderColor: currentValue ? 'success.300' : 'divider',
          bgcolor: currentValue ? '#f0fdf4' : 'grey.50',
          cursor: 'pointer',
          transition: 'all 0.15s',
          '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
        }}
      >
        <Avatar sx={{ width: 32, height: 32, bgcolor: currentValue ? 'success.100' : 'grey.200' }}>
          <UploadIcon sx={{ fontSize: 16, color: currentValue ? 'success.600' : 'text.disabled' }} />
        </Avatar>
        <Box>
          <Typography variant="caption" fontWeight={600} color={currentValue ? 'success.main' : 'text.secondary'}>
            {currentValue ? 'Đã chụp ảnh' : 'Nhấn để chụp ảnh'}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
            Chụp bằng camera
          </Typography>
        </Box>
        <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onUpload} />
      </Box>
      {currentValue && renderImagePreview(currentValue, label)}
    </Box>
  );
}

function AttendanceDetailModal({
  isOpen,
  mode,
  student,
  studentId,
  selectedDate,
  todayISO,
  detailForm,
  setDetailForm,
  submitError,
  setSubmitError,
  studentsError,
  approvedPickupPersons,
  attendanceByStudent,
  onClose,
  onSave,
}) {
  const [confirmDialog, setConfirmDialog] = useState(null); // { field, label }
  const [sending, setSending] = useState(false);
  const [confirmCountdown, setConfirmCountdown] = useState(0);
  const pollRef = useRef(null);
  const countdownRef = useRef(null);

  const isMobileScreen = useMediaQuery('(max-width:599px)');
  const isPastDate = todayISO ? selectedDate < todayISO : false;
  const isCheckoutMode = mode === 'checkout';
  const isReceiverFromList = isCheckoutMode && !!detailForm.receiverPickupPersonId && detailForm.receiverPickupPersonId !== 'KHAC';

  const canSaveCheckout =
    isCheckoutMode &&
    !!detailForm.receiverType &&
    !!detailForm.checkoutImageName &&
    (isReceiverFromList
      ? !!detailForm.checkoutConfirmed
      : (
        !!detailForm.receiverName?.trim() &&
        !!detailForm.receiverPhone?.trim() &&
        PHONE_REGEX.test(detailForm.receiverPhone?.trim()) &&
        !!detailForm.receiverOtherImageName &&
        (!!detailForm.parentConfirmed || !!detailForm.teacherConfirmedCheckout)
      )
    );

  const canSubmitCheckin = mode === 'checkin'
    ? !!detailForm.checkinImageName && !!detailForm.checkinConfirmed
    : true;

  // Polling: khi đã gửi và chưa được PH xác nhận → kiểm tra mỗi 3s
  useEffect(() => {
    if (!detailForm.parentConfirmSent || detailForm.parentConfirmed || !studentId) return;
    const fetchStatus = async () => {
      try {
        const res = await get(ENDPOINTS.STUDENTS.ATTENDANCE_CHECKOUT_PENDING(studentId));
        if (res.data?.checkoutStatus === 'confirmed') {
          setDetailForm((prev) => ({ ...prev, parentConfirmed: true }));
        }
      } catch {}
    };
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 3000);
    return () => clearInterval(pollRef.current);
  }, [detailForm.parentConfirmSent, detailForm.parentConfirmed, studentId]);

  // Countdown 120s kể từ khi gửi
  useEffect(() => {
    if (!detailForm.parentConfirmSent || detailForm.parentConfirmed) {
      clearInterval(countdownRef.current);
      return;
    }
    setConfirmCountdown(120);
    countdownRef.current = setInterval(() => {
      setConfirmCountdown((prev) => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [detailForm.parentConfirmSent]);

  // Cleanup khi modal đóng
  useEffect(() => {
    if (!isOpen) {
      clearInterval(pollRef.current);
      clearInterval(countdownRef.current);
    }
  }, [isOpen]);

  const handleSendToParent = async () => {
    setSubmitError(null);
    if (!detailForm.receiverName?.trim()) { setSubmitError('Vui lòng nhập tên người đón trước khi gửi.'); return; }
    if (!detailForm.receiverPhone?.trim() || !PHONE_REGEX.test(detailForm.receiverPhone.trim())) { setSubmitError('Vui lòng nhập số điện thoại hợp lệ trước khi gửi.'); return; }
    if (!detailForm.receiverOtherImageName) { setSubmitError('Vui lòng chụp ảnh người đón trước khi gửi.'); return; }
    if (!detailForm.checkoutImageName) { setSubmitError('Vui lòng chụp ảnh đón trẻ trước khi gửi.'); return; }
    setSending(true);
    try {
      const receiverOtherInfoFinal = `${detailForm.receiverName?.trim() || ''} - ${detailForm.receiverPhone?.trim() || ''}`;
      await post(ENDPOINTS.STUDENTS.ATTENDANCE_CHECKOUT_REQUEST, {
        studentId,
        receiverType: detailForm.receiverType || 'Khác',
        receiverOtherInfo: receiverOtherInfoFinal,
        receiverOtherImageName: detailForm.receiverOtherImageName || '',
        checkoutImageName: detailForm.checkoutImageName || '',
      });
      setDetailForm((prev) => ({ ...prev, parentConfirmSent: true, parentConfirmed: false }));
    } catch (err) {
      setSubmitError(err.message || 'Lỗi khi gửi thông tin cho phụ huynh');
    } finally {
      setSending(false);
    }
  };

  const uploadAttendanceImage = async (file, fieldName) => {
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.type)) {
      throw new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP).');
    }
    const formData = new FormData();
    formData.append('image', file);
    const response = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_ATTENDANCE_FILE, formData);
    const url = response?.data?.url;
    if (!url) throw new Error('Không nhận được đường dẫn ảnh từ server.');
    setDetailForm((prev) => ({ ...prev, [fieldName]: url }));
  };

  const handleFileUpload = (fieldName, errorMsg) => async (e) => {
    try {
      setSubmitError(null);
      await uploadAttendanceImage(e.target.files?.[0], fieldName);
    } catch (err) {
      setSubmitError(err.message || errorMsg);
    } finally {
      e.target.value = '';
    }
  };

  // Handler dùng cho CameraCapture — nhận File trực tiếp (không qua event)
  const handleCameraCapture = (fieldName) => async (file) => {
    setSubmitError(null);
    await uploadAttendanceImage(file, fieldName);
  };

  const MODE_CONFIG = {
    view:     { title: 'Chi tiết điểm danh',  gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed)', icon: <ViewIcon sx={{ color:'white',fontSize:22 }} /> },
    checkin:  { title: 'Điểm danh',    gradient: 'linear-gradient(135deg,#059669,#10b981)', icon: <CheckInIcon sx={{ color:'white',fontSize:22 }} /> },
    checkout: { title: 'Điểm danh về',   gradient: 'linear-gradient(135deg,#0369a1,#0ea5e9)', icon: <CheckOutIcon sx={{ color:'white',fontSize:22 }} /> },
  };
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.view;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth={mode === 'view' ? 'md' : 'sm'}
      fullWidth
      fullScreen={isMobileScreen}
      scroll="paper"
      slotProps={{ paper: { sx: { borderRadius: isMobileScreen ? 0 : 3, overflow: 'hidden', maxHeight: isMobileScreen ? '100vh' : '90vh' } } }}
    >
      {/* Colored header */}
      <Box
        sx={{
          background: cfg.gradient,
          px: 2.5, pt: 2, pb: 2,
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}
      >
        <Avatar sx={{ width:36, height:36, bgcolor:'rgba(255,255,255,0.2)', flexShrink:0 }}>
          {cfg.icon}
        </Avatar>
        {student && (
          <Avatar
            src={student.avatar || undefined}
            sx={{
              width: 44, height: 44, flexShrink: 0,
              border: '2px solid rgba(255,255,255,0.55)',
              fontSize: 16, fontWeight: 700,
              bgcolor: 'rgba(255,255,255,0.25)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            }}
          >
            {student.fullName?.[0] || '?'}
          </Avatar>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} color="white" noWrap>
            {cfg.title}
          </Typography>
          <Box sx={{ display:'flex', flexWrap: 'nowrap', gap:0.75, mt:0.25, overflow: 'hidden' }}>
            {student?.fullName && (
              <Chip
                icon={<PersonIcon sx={{ fontSize:'12px !important', color:'rgba(255,255,255,0.8) !important' }} />}
                label={student.fullName}
                size="small"
                sx={{ height:20, fontSize:11, bgcolor:'rgba(255,255,255,0.18)', color:'white', fontWeight:600, maxWidth: 160, flexShrink: 1 }}
              />
            )}
            <Chip
              icon={<TimeIcon sx={{ fontSize:'12px !important', color:'rgba(255,255,255,0.8) !important' }} />}
              label={selectedDate}
              size="small"
              sx={{ height:20, fontSize:11, bgcolor:'rgba(255,255,255,0.18)', color:'white', flexShrink: 0 }}
            />
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color:'rgba(255,255,255,0.85)', flexShrink:0, bgcolor:'rgba(255,255,255,0.12)', '&:hover':{ bgcolor:'rgba(255,255,255,0.22)' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <Box component="form" onSubmit={onSave} sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
        <DialogContent sx={{ pt: 2.5, overflowY: 'auto' }}>
          {isPastDate && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              Ngày đã qua — không thể chỉnh sửa dữ liệu điểm danh.
            </Alert>
          )}

          {/* ── VIEW MODE ── */}
          {mode === 'view' && (
            <Box>
              {detailForm.status === 'absent' && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  <strong>Vắng mặt</strong> – Lý do: {attendanceByStudent?.[studentId]?.absentReason || 'Không rõ'}
                  {attendanceByStudent?.[studentId]?.note && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                      Ghi chú: {attendanceByStudent[studentId].note}
                    </Typography>
                  )}
                </Alert>
              )}

              {/* ── Check-in section ── */}
              <Paper variant="outlined" sx={{ borderRadius: 2.5, mb: 2, overflow: 'hidden', borderColor: '#86efac' }}>
                {/* Section header */}
                <Box sx={{ px: 2, py: 1.25, bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 26, height: 26, bgcolor: '#15803d' }}>
                    <CheckInIcon sx={{ fontSize: 14, color: 'white' }} />
                  </Avatar>
                  <Typography variant="body2" fontWeight={700} color="#15803d">Thông tin Điểm danh</Typography>
                  {detailForm.checkedInByAI && (
                    <Chip
                      icon={<SmartToyIcon sx={{ fontSize: '12px !important', color: 'white !important' }} />}
                      label="AI"
                      size="small"
                      sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: '#7c3aed', color: 'white', px: 0.5 }}
                    />
                  )}
                  {detailForm.timeIn ? (
                    <Chip
                      label={detailForm.timeIn}
                      size="small"
                      icon={<TimeIcon sx={{ fontSize: '12px !important' }} />}
                      sx={{ height: 22, fontSize: 12, fontWeight: 700, ml: 'auto', bgcolor: '#15803d', color: 'white',
                        '& .MuiChip-icon': { color: 'rgba(255,255,255,0.8)' } }}
                    />
                  ) : (
                    <Chip label="Chưa điểm danh" size="small" sx={{ height: 22, fontSize: 11, ml: 'auto', bgcolor: '#fef3c7', color: '#92400e' }} />
                  )}
                </Box>

                <Box sx={{ p: 2 }}>
                  {/* Images row */}
                  <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: 2, mb: 2 }}>
                    {/* Check-in image */}
                    <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                      {detailForm.checkinImageName && /^https?:\/\//i.test(detailForm.checkinImageName) ? (
                        <Box component="a" href={detailForm.checkinImageName} target="_blank" rel="noreferrer"
                          sx={{ display: 'block', borderRadius: 2, overflow: 'hidden', border: '2px solid #86efac',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)', transition: 'transform 0.15s', '&:hover': { transform: 'scale(1.03)' } }}>
                          <Box component="img" src={detailForm.checkinImageName} alt="Ảnh check-in"
                            sx={{ width: { xs: 82, sm: 110 }, height: { xs: 82, sm: 110 }, objectFit: 'cover', display: 'block' }} />
                        </Box>
                      ) : (
                        <Box sx={{ width: { xs: 82, sm: 110 }, height: { xs: 82, sm: 110 }, borderRadius: 2, border: '2px dashed #86efac',
                          bgcolor: '#f0fdf4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <CheckInIcon sx={{ fontSize: 28, color: '#bbf7d0' }} />
                          <Typography variant="caption" color="#86efac" fontWeight={600}>Chưa có ảnh</Typography>
                        </Box>
                      )}
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Ảnh điểm danh</Typography>
                    </Box>

                    {/* Deliverer image */}
                    <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                      {detailForm.delivererOtherImageName && /^https?:\/\//i.test(detailForm.delivererOtherImageName) ? (
                        <Box component="a" href={detailForm.delivererOtherImageName} target="_blank" rel="noreferrer"
                          sx={{ display: 'block', borderRadius: 2, overflow: 'hidden', border: '2px solid #d1d5db',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)', transition: 'transform 0.15s', '&:hover': { transform: 'scale(1.03)' } }}>
                          <Box component="img" src={detailForm.delivererOtherImageName} alt="Ảnh người đưa"
                            sx={{ width: { xs: 82, sm: 110 }, height: { xs: 82, sm: 110 }, objectFit: 'cover', display: 'block' }} />
                        </Box>
                      ) : (
                        <Box sx={{ width: { xs: 82, sm: 110 }, height: { xs: 82, sm: 110 }, borderRadius: 2, border: '2px dashed #d1d5db',
                          bgcolor: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 28, color: '#d1d5db' }} />
                          <Typography variant="caption" color="text.disabled" fontWeight={600}>Chưa có ảnh</Typography>
                        </Box>
                      )}
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Ảnh người đưa</Typography>
                    </Box>

                    {/* Info fields */}
                    <Box sx={{ flex: { xs: '0 0 100%', sm: 1 }, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                      <Box>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.4 }}>Giờ đến</Typography>
                        <Box sx={{ px: 1.5, py: 0.75, borderRadius: 1.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', minHeight: 34, display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight={700} color={detailForm.timeIn ? '#15803d' : 'text.disabled'} fontStyle={detailForm.timeIn ? 'normal' : 'italic'}>
                            {detailForm.timeIn || 'Chưa ghi nhận'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.4 }}>Người đưa</Typography>
                        <Box sx={{ px: 1.5, py: 0.75, borderRadius: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', minHeight: 34, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                          {detailForm.delivererOtherInfo ? (
                            <>
                              <Typography variant="body2">{detailForm.delivererOtherInfo}</Typography>
                              {detailForm.delivererType && (
                                <Chip label={detailForm.delivererType} size="small" sx={{ height: 18, fontSize: 10 }} />
                              )}
                            </>
                          ) : (
                            <Typography variant="body2" color="text.disabled" fontStyle="italic">Chưa ghi nhận</Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Đồ mang theo */}
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4 }}><BackpackIcon sx={{ fontSize: 14 }} />Đồ mang theo</Typography>
                    <Box sx={{ px: 1.5, py: 0.75, borderRadius: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', minHeight: 34, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" color={detailForm.belongingsNote ? 'text.primary' : 'text.disabled'} fontStyle={detailForm.belongingsNote ? 'normal' : 'italic'}>
                        {detailForm.belongingsNote || 'Không có đồ mang theo'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Note full width */}
                  <TextField
                    fullWidth size="small" multiline rows={2} label="Ghi chú"
                    placeholder="Trẻ hơi mệt..."
                    value={detailForm.note}
                    disabled={isPastDate}
                    slotProps={{ htmlInput: { maxLength: MAX_NOTE_LEN } }}
                    onChange={(e) => setDetailForm((prev) => ({
                      ...prev, note: sanitizeMultiLineText(e.target.value, MAX_NOTE_LEN),
                    }))}
                  />
                </Box>
              </Paper>

              {/* ── Check-out section ── */}
              <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden', borderColor: '#93c5fd' }}>
                {/* Section header */}
                <Box sx={{ px: 2, py: 1.25, bgcolor: '#dbeafe', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 26, height: 26, bgcolor: '#1d4ed8' }}>
                    <CheckOutIcon sx={{ fontSize: 14, color: 'white' }} />
                  </Avatar>
                  <Typography variant="body2" fontWeight={700} color="#1d4ed8">Thông tin Điểm danh về</Typography>
                  {detailForm.checkedOutByAI && (
                    <Chip
                      icon={<SmartToyIcon sx={{ fontSize: '12px !important', color: 'white !important' }} />}
                      label="AI"
                      size="small"
                      sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: '#7c3aed', color: 'white', px: 0.5 }}
                    />
                  )}
                  {detailForm.timeOut ? (
                    <Chip
                      label={detailForm.timeOut}
                      size="small"
                      icon={<TimeIcon sx={{ fontSize: '12px !important' }} />}
                      sx={{ height: 22, fontSize: 12, fontWeight: 700, ml: 'auto', bgcolor: '#1d4ed8', color: 'white',
                        '& .MuiChip-icon': { color: 'rgba(255,255,255,0.8)' } }}
                    />
                  ) : (
                    <Chip label="Chưa điểm danh về" size="small" sx={{ height: 22, fontSize: 11, ml: 'auto', bgcolor: '#fef3c7', color: '#92400e' }} />
                  )}
                </Box>

                <Box sx={{ p: 2 }}>
                  {/* Images row */}
                  <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: 2, mb: 2 }}>
                    {/* Check-out image */}
                    <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                      {detailForm.checkoutImageName && /^https?:\/\//i.test(detailForm.checkoutImageName) ? (
                        <Box component="a" href={detailForm.checkoutImageName} target="_blank" rel="noreferrer"
                          sx={{ display: 'block', borderRadius: 2, overflow: 'hidden', border: '2px solid #93c5fd',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)', transition: 'transform 0.15s', '&:hover': { transform: 'scale(1.03)' } }}>
                          <Box component="img" src={detailForm.checkoutImageName} alt="Ảnh check-out"
                            sx={{ width: { xs: 82, sm: 110 }, height: { xs: 82, sm: 110 }, objectFit: 'cover', display: 'block' }} />
                        </Box>
                      ) : (
                        <Box sx={{ width: { xs: 82, sm: 110 }, height: { xs: 82, sm: 110 }, borderRadius: 2, border: '2px dashed #93c5fd',
                          bgcolor: '#eff6ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <CheckOutIcon sx={{ fontSize: 28, color: '#bfdbfe' }} />
                          <Typography variant="caption" color="#93c5fd" fontWeight={600}>Chưa có ảnh</Typography>
                        </Box>
                      )}
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Ảnh điểm danh về</Typography>
                    </Box>

                    {/* Receiver image */}
                    <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                      {detailForm.receiverOtherImageName && /^https?:\/\//i.test(detailForm.receiverOtherImageName) ? (
                        <Box component="a" href={detailForm.receiverOtherImageName} target="_blank" rel="noreferrer"
                          sx={{ display: 'block', borderRadius: 2, overflow: 'hidden', border: '2px solid #d1d5db',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)', transition: 'transform 0.15s', '&:hover': { transform: 'scale(1.03)' } }}>
                          <Box component="img" src={detailForm.receiverOtherImageName} alt="Ảnh người đón"
                            sx={{ width: { xs: 82, sm: 110 }, height: { xs: 82, sm: 110 }, objectFit: 'cover', display: 'block' }} />
                        </Box>
                      ) : (
                        <Box sx={{ width: { xs: 82, sm: 110 }, height: { xs: 82, sm: 110 }, borderRadius: 2, border: '2px dashed #d1d5db',
                          bgcolor: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 28, color: '#d1d5db' }} />
                          <Typography variant="caption" color="text.disabled" fontWeight={600}>Chưa có ảnh</Typography>
                        </Box>
                      )}
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Ảnh người đón</Typography>
                    </Box>

                    {/* Info fields */}
                    <Box sx={{ flex: { xs: '0 0 100%', sm: 1 }, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                      <Box>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.4 }}>Giờ về</Typography>
                        <Box sx={{ px: 1.5, py: 0.75, borderRadius: 1.5, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', minHeight: 34, display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight={700} color={detailForm.timeOut ? '#1d4ed8' : 'text.disabled'} fontStyle={detailForm.timeOut ? 'normal' : 'italic'}>
                            {detailForm.timeOut || 'Chưa ghi nhận'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.4 }}>Người đón</Typography>
                        <Box sx={{ px: 1.5, py: 0.75, borderRadius: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', minHeight: 34, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                          {detailForm.receiverOtherInfo ? (
                            <>
                              <Typography variant="body2">{detailForm.receiverOtherInfo}</Typography>
                              {detailForm.receiverType && (
                                <Chip label={detailForm.receiverType} size="small" sx={{ height: 18, fontSize: 10 }} />
                              )}
                            </>
                          ) : (
                            <Typography variant="body2" color="text.disabled" fontStyle="italic">Chưa ghi nhận</Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Đồ mang về */}
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4 }}><BackpackIcon sx={{ fontSize: 14 }} />Đồ mang về</Typography>
                    <Box sx={{ px: 1.5, py: 0.75, borderRadius: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', minHeight: 34, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" color={detailForm.checkoutBelongingsNote ? 'text.primary' : 'text.disabled'} fontStyle={detailForm.checkoutBelongingsNote ? 'normal' : 'italic'}>
                        {detailForm.checkoutBelongingsNote || 'Không có đồ mang về'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Note full width */}
                  <TextField
                    fullWidth size="small" multiline rows={2} label="Ghi chú điểm danh về"
                    placeholder="Ví dụ: Bé về sớm..."
                    value={detailForm.checkoutNote || ''}
                    disabled={isPastDate}
                    slotProps={{ htmlInput: { maxLength: MAX_NOTE_LEN } }}
                    onChange={(e) => setDetailForm((prev) => ({
                      ...prev, checkoutNote: sanitizeMultiLineText(e.target.value, MAX_NOTE_LEN),
                    }))}
                  />
                </Box>
              </Paper>
            </Box>
          )}

          {/* ── CHECKOUT MODE ── */}
          {mode === 'checkout' && (
            <Stack spacing={2}>
              {/* Time display */}
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', borderColor: '#93c5fd' }}>
                <Box sx={{ px: 2, py: 1, bgcolor: '#dbeafe', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimeIcon sx={{ fontSize: 15, color: '#1d4ed8' }} />
                  <Typography variant="caption" fontWeight={700} color="#1d4ed8">Thời gian điểm danh về</Typography>
                </Box>
                <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="h5" fontWeight={800} color="#1d4ed8" sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: 1 }}>
                    {detailForm.timeOut || '--:--'}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">Tự động lấy theo thời điểm điểm danh về</Typography>
                </Box>
              </Paper>

              {/* Image upload */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: '#bfdbfe', bgcolor: '#f8faff' }}>
                <Typography variant="caption" fontWeight={700} color="#1d4ed8" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                  <CameraAltIcon sx={{ fontSize: 14 }} />Ảnh đón trẻ <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                </Typography>
                <CameraCapture
                  currentValue={detailForm.checkoutImageName}
                  onCapture={handleCameraCapture('checkoutImageName')}
                />
              </Paper>

              {/* Person selector */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'divider' }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                  <PersonIcon sx={{ fontSize: 14 }} />Người đón
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Chọn người đón *</InputLabel>
                  <Select
                    value={detailForm.receiverPickupPersonId}
                    label="Chọn người đón *"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'KHAC') {
                        setDetailForm((prev) => ({
                          ...prev, receiverPickupPersonId: 'KHAC', receiverType: 'Khác',
                          receiverOtherInfo: '', receiverName: '', receiverPhone: '', receiverOtherImageName: '',
                          teacherConfirmedCheckout: false,
                        }));
                      } else {
                        const p = approvedPickupPersons.find((x) => x._id === val);
                        setDetailForm((prev) => ({
                          ...prev, receiverPickupPersonId: val,
                          receiverType: p ? p.relation : '',
                          receiverOtherInfo: p ? `${p.fullName} - ${p.phone}` : '',
                          receiverName: '', receiverPhone: '',
                          receiverOtherImageName: p ? (p.imageUrl || '') : '',
                        }));
                      }
                    }}
                  >
                    <MenuItem value="" disabled>-- Chọn --</MenuItem>
                    {approvedPickupPersons.map((p) => (
                      <MenuItem key={p._id} value={p._id}>{p.fullName} ({p.relation})</MenuItem>
                    ))}
                    <MenuItem value="KHAC">Khác (người ngoài danh sách)</MenuItem>
                  </Select>
                </FormControl>

                {detailForm.receiverType === 'Khác' && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                    <Typography variant="caption" color="warning.main" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                      <WarningAmberIcon sx={{ fontSize: 14 }} />Vui lòng nhập đầy đủ thông tin người đón ngoài danh sách
                    </Typography>
                    <Stack spacing={1.5}>
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth size="small" label="Tên người đón *"
                            placeholder="VD: Nguyễn Văn B"
                            value={detailForm.receiverName}
                            slotProps={{ htmlInput: { maxLength: MAX_PERSON_NAME_LEN } }}
                            onChange={(e) => setDetailForm((prev) => ({
                              ...prev, receiverName: sanitizePersonName(e.target.value, MAX_PERSON_NAME_LEN),
                            }))}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth size="small" label="Số điện thoại *"
                            placeholder="VD: 0912345678"
                            value={detailForm.receiverPhone}
                            slotProps={{ htmlInput: { maxLength: MAX_PERSON_PHONE_LEN, inputMode: 'numeric' } }}
                            error={!!detailForm.receiverPhone && !PHONE_REGEX.test(detailForm.receiverPhone)}
                            helperText={
                              detailForm.receiverPhone && !PHONE_REGEX.test(detailForm.receiverPhone)
                                ? 'SĐT phải có 10–11 chữ số'
                                : undefined
                            }
                            onChange={(e) => setDetailForm((prev) => ({
                              ...prev, receiverPhone: e.target.value.replace(/\D/g, '').slice(0, MAX_PERSON_PHONE_LEN),
                            }))}
                          />
                        </Grid>
                      </Grid>
                      <CameraCapture
                        label="Ảnh người đón"
                        required
                        currentValue={detailForm.receiverOtherImageName}
                        onCapture={handleCameraCapture('receiverOtherImageName')}
                      />
                    </Stack>
                  </Box>
                )}
              </Paper>

              {isReceiverFromList && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5, borderRadius: 2,
                    borderColor: detailForm.checkoutConfirmed ? 'info.400' : 'divider',
                    bgcolor: detailForm.checkoutConfirmed ? '#eff6ff' : 'grey.50',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onClick={() => {
                    if (!detailForm.checkoutConfirmed)
                      setConfirmDialog({ field: 'checkoutConfirmed', label: 'Xác nhận đã giao trẻ an toàn cho người đón?' });
                    else
                      setDetailForm((prev) => ({ ...prev, checkoutConfirmed: false }));
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        color="info"
                        checked={!!detailForm.checkoutConfirmed}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                    label={
                      <Typography variant="body2" fontWeight={700} color={detailForm.checkoutConfirmed ? 'info.main' : 'text.secondary'}>
                        Xác nhận đã giao trẻ an toàn cho người đón
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </Paper>
              )}
              {detailForm.receiverPickupPersonId === 'KHAC' && (
                <ParentConfirmSection
                  detailForm={detailForm}
                  setDetailForm={setDetailForm}
                  student={student}
                  approvedPickupPersons={approvedPickupPersons}
                  onSendToParent={handleSendToParent}
                  confirmCountdown={confirmCountdown}
                  sending={sending}
                />
              )}

              {/* Đồ mang về */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'divider' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={detailForm.hasCheckoutBelongings}
                      onChange={(e) => setDetailForm((prev) => ({
                        ...prev, hasCheckoutBelongings: e.target.checked,
                        checkoutBelongingsNote: e.target.checked ? prev.checkoutBelongingsNote : '',
                      }))}
                    />
                  }
                  label={<Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><BackpackIcon sx={{ fontSize: 16 }} />Có đồ mang về</Typography>}
                />
                {detailForm.hasCheckoutBelongings && (
                  <TextField
                    fullWidth size="small" multiline rows={2} sx={{ mt: 1 }}
                    label="Ghi chú đồ mang về"
                    placeholder="Bình nước, balo, thú bông..."
                    value={detailForm.checkoutBelongingsNote}
                    slotProps={{ htmlInput: { maxLength: MAX_BELONGINGS_NOTE_LEN } }}
                    onChange={(e) => setDetailForm((prev) => ({
                      ...prev, checkoutBelongingsNote: sanitizeMultiLineText(e.target.value, MAX_BELONGINGS_NOTE_LEN),
                    }))}
                  />
                )}
              </Paper>

              <TextField
                fullWidth size="small" multiline rows={2} label="Ghi chú"
                placeholder="Ví dụ: Bé về sớm..."
                value={detailForm.checkoutNote || ''}
                slotProps={{ htmlInput: { maxLength: MAX_NOTE_LEN } }}
                onChange={(e) => setDetailForm((prev) => ({
                  ...prev, checkoutNote: sanitizeMultiLineText(e.target.value, MAX_NOTE_LEN),
                }))}
              />
            </Stack>
          )}

          {/* ── CHECKIN MODE ── */}
          {mode === 'checkin' && (
            <Stack spacing={2}>
              {/* Time display */}
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', borderColor: '#86efac' }}>
                <Box sx={{ px: 2, py: 1, bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimeIcon sx={{ fontSize: 15, color: '#15803d' }} />
                  <Typography variant="caption" fontWeight={700} color="#15803d">Thời gian điểm danh</Typography>
                </Box>
                <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="h5" fontWeight={800} color="#15803d" sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: 1 }}>
                    {detailForm.timeIn || '--:--'}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">Tự động lấy theo thời điểm điểm danh</Typography>
                </Box>
              </Paper>

              {/* Image + Person side by side */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%', borderColor: '#bbf7d0', bgcolor: '#f0fdf4' }}>
                    <Typography variant="caption" fontWeight={700} color="#15803d" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                      <CameraAltIcon sx={{ fontSize: 14 }} />Ảnh điểm danh <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                    </Typography>
                    <CameraCapture
                      currentValue={detailForm.checkinImageName}
                      onCapture={handleCameraCapture('checkinImageName')}
                    />
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%', borderColor: 'divider' }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                      <PersonIcon sx={{ fontSize: 14 }} />Người đưa
                    </Typography>
                    <FormControl fullWidth size="small">
                      <InputLabel>Chọn người đưa *</InputLabel>
                      <Select
                        value={detailForm.delivererPickupPersonId}
                        label="Chọn người đưa *"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'KHAC') {
                            setDetailForm((prev) => ({
                              ...prev, delivererPickupPersonId: 'KHAC', delivererType: 'Khác',
                              delivererOtherInfo: '', delivererName: '', delivererPhone: '', delivererOtherImageName: '',
                            }));
                          } else {
                            const p = approvedPickupPersons.find((x) => x._id === val);
                            setDetailForm((prev) => ({
                              ...prev, delivererPickupPersonId: val,
                              delivererType: p ? p.relation : '',
                              delivererOtherInfo: p ? `${p.fullName} - ${p.phone}` : '',
                              delivererName: '', delivererPhone: '',
                              delivererOtherImageName: p ? (p.imageUrl || '') : '',
                            }));
                          }
                        }}
                      >
                        <MenuItem value="" disabled>-- Chọn --</MenuItem>
                        {approvedPickupPersons.map((p) => (
                          <MenuItem key={p._id} value={p._id}>{p.fullName} ({p.relation} - {p.phone})</MenuItem>
                        ))}
                        <MenuItem value="KHAC">Khác (ngoài danh sách)</MenuItem>
                      </Select>
                    </FormControl>
                  </Paper>
                </Grid>
              </Grid>

              {/* Người đưa "Khác" extra fields */}
              {detailForm.delivererType === 'Khác' && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: '#fde68a', bgcolor: '#fffbeb' }}>
                  <Typography variant="caption" color="warning.main" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                    <WarningAmberIcon sx={{ fontSize: 14 }} />Vui lòng nhập đầy đủ thông tin người đưa ngoài danh sách
                  </Typography>
                  <Stack spacing={1.5}>
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth size="small" label="Tên người đưa"
                          placeholder="VD: Nguyễn Văn A"
                          value={detailForm.delivererName}
                          slotProps={{ htmlInput: { maxLength: MAX_PERSON_NAME_LEN } }}
                          onChange={(e) => setDetailForm((prev) => ({
                            ...prev, delivererName: sanitizePersonName(e.target.value, MAX_PERSON_NAME_LEN),
                          }))}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth size="small" label="Số điện thoại"
                          placeholder="VD: 0912345678"
                          value={detailForm.delivererPhone}
                          slotProps={{ htmlInput: { maxLength: MAX_PERSON_PHONE_LEN, inputMode: 'numeric' } }}
                          error={!!detailForm.delivererPhone && !PHONE_REGEX.test(detailForm.delivererPhone)}
                          helperText={
                            detailForm.delivererPhone && !PHONE_REGEX.test(detailForm.delivererPhone)
                              ? 'SĐT phải có 10–11 chữ số'
                              : undefined
                          }
                          onChange={(e) => setDetailForm((prev) => ({
                            ...prev, delivererPhone: e.target.value.replace(/\D/g, '').slice(0, MAX_PERSON_PHONE_LEN),
                          }))}
                        />
                      </Grid>
                    </Grid>
                    <CameraCapture
                      label="Ảnh người đưa"
                      currentValue={detailForm.delivererOtherImageName}
                      onCapture={handleCameraCapture('delivererOtherImageName')}
                    />
                  </Stack>
                </Paper>
              )}

              {/* Đồ mang theo */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'divider' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={detailForm.hasBelongings}
                      onChange={(e) => setDetailForm((prev) => ({
                        ...prev, hasBelongings: e.target.checked,
                        belongingsNote: e.target.checked ? prev.belongingsNote : '',
                      }))}
                    />
                  }
                  label={<Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><BackpackIcon sx={{ fontSize: 16 }} />Có đồ mang theo</Typography>}
                />
                {detailForm.hasBelongings && (
                  <TextField
                    fullWidth size="small" multiline rows={2} sx={{ mt: 1 }}
                    label="Ghi chú đồ mang theo"
                    placeholder="Bình nước, balo, thú bông..."
                    value={detailForm.belongingsNote}
                    slotProps={{ htmlInput: { maxLength: MAX_BELONGINGS_NOTE_LEN } }}
                    onChange={(e) => setDetailForm((prev) => ({
                      ...prev, belongingsNote: sanitizeMultiLineText(e.target.value, MAX_BELONGINGS_NOTE_LEN),
                    }))}
                  />
                )}
              </Paper>

              <TextField
                fullWidth size="small" multiline rows={2} label="Ghi chú"
                placeholder="Ví dụ: Bé đến muộn 10 phút..."
                value={detailForm.note}
                slotProps={{ htmlInput: { maxLength: MAX_NOTE_LEN } }}
                onChange={(e) => setDetailForm((prev) => ({
                  ...prev, note: sanitizeMultiLineText(e.target.value, MAX_NOTE_LEN),
                }))}
              />

              {/* Xác nhận điểm danh nhanh */}
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5, borderRadius: 2,
                  borderColor: detailForm.checkinConfirmed ? 'success.400' : 'divider',
                  bgcolor: detailForm.checkinConfirmed ? '#f0fdf4' : 'grey.50',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onClick={() => {
                  if (!detailForm.checkinConfirmed)
                    setConfirmDialog({ field: 'checkinConfirmed', label: 'Xác nhận đã đưa trẻ đến lớp an toàn?' });
                  else
                    setDetailForm((prev) => ({ ...prev, checkinConfirmed: false }));
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      color="success"
                      checked={!!detailForm.checkinConfirmed}
                      onChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                  label={
                    <Typography variant="body2" fontWeight={700} color={detailForm.checkinConfirmed ? 'success.main' : 'text.secondary'}>
                      Xác nhận đã đưa trẻ đến lớp an toàn
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </Paper>
            </Stack>
          )}
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pt: 1.5, pb: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1, flexWrap: 'wrap', flexDirection: 'column', alignItems: 'stretch' }}>
          {(submitError || studentsError) && (
            <Alert severity="error" sx={{ borderRadius: 2, width: '100%' }} onClose={() => setSubmitError(null)}>
              {submitError || studentsError}
            </Alert>
          )}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, flex: { xs: 1, sm: 'unset' } }}
            >
              {isPastDate ? 'Đóng' : 'Hủy'}
            </Button>
            {!isPastDate && (
              mode === 'checkout' ? (
                <Button
                  type="submit"
                  variant="contained"
                  color="info"
                  disabled={!canSaveCheckout}
                  startIcon={<SaveIcon />}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, flex: { xs: 2, sm: 'unset' } }}
                >
                  Xác nhận đón trẻ
                </Button>
              ) : mode === 'checkin' ? (
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  disabled={!canSubmitCheckin}
                  title={!canSubmitCheckin ? 'Vui lòng chọn ảnh điểm danh' : ''}
                  startIcon={<CheckCircleIcon />}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, flex: { xs: 2, sm: 'unset' }, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
                >
                  Xác nhận đưa trẻ
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, flex: { xs: 2, sm: 'unset' } }}
                >
                  Lưu chỉnh sửa
                </Button>
              )
            )}
          </Box>
        </DialogActions>
      </Box>

      {/* Confirm dialog cho xác nhận nhanh */}
      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Xác nhận</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog?.label}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setConfirmDialog(null)} sx={{ textTransform: 'none' }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              setDetailForm((prev) => ({ ...prev, [confirmDialog.field]: true }));
              setConfirmDialog(null);
            }}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

export default AttendanceDetailModal;
