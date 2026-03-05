// Modal chi tiết điểm danh: hỗ trợ 3 chế độ view / checkin / checkout
import { signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../../config/firebase';
import { post, postFormData, ENDPOINTS } from '../../../service/api';
import {
  formatPhoneForFirebase,
  sanitizeSingleLineText,
  sanitizeMultiLineText,
  MAX_NOTE_LEN,
  MAX_BELONGINGS_NOTE_LEN,
  MAX_PERSON_NAME_LEN,
  MAX_PERSON_PHONE_LEN,
} from './attendanceUtils';
import {
  Dialog, DialogContent, DialogActions,
  Box, Grid, Typography, Button, TextField, Select,
  FormControl, InputLabel, MenuItem, Alert, IconButton,
  Chip, FormControlLabel, Checkbox, Paper,
  RadioGroup, Radio, Stack, Avatar, Divider,
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
  Timer as TimerIcon,
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

// ── OTP Section ──
function OtpSection({ radioName, detailForm, setDetailForm, student, onSendOtp, otpTimeLeft, otpExpired, onResetOtp }) {
  const countdownStr = `${Math.floor(otpTimeLeft / 60)}:${String(otpTimeLeft % 60).padStart(2, '0')}`;
  const otpSelected = detailForm.sendOtpSchoolAccount || detailForm.sendOtpViaSms;

  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 2 }}>
        <Chip
          icon={<PhoneIcon sx={{ fontSize: '14px !important' }} />}
          label="Xác thực OTP"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: 11 }}
        />
      </Divider>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>
          Chọn phương thức gửi OTP
        </Typography>
        <FormControl component="fieldset" size="small">
          <RadioGroup
            row
            name={radioName}
            value={
              detailForm.sendOtpSchoolAccount ? 'school'
              : detailForm.sendOtpViaSms ? 'sms'
              : ''
            }
            onChange={(e) => {
              const val = e.target.value;
              setDetailForm((prev) => ({
                ...prev,
                sendOtpSchoolAccount: val === 'school',
                sendOtpViaSms: val === 'sms',
              }));
            }}
          >
            <FormControlLabel value="school" control={<Radio size="small" />} label={<Typography variant="body2">Tài khoản trường</Typography>} />
            <FormControlLabel value="sms" control={<Radio size="small" />} label={<Typography variant="body2">Gửi qua SMS</Typography>} />
          </RadioGroup>
        </FormControl>

        {otpSelected && (
          <Box sx={{ mt: 1.5 }}>
            {detailForm.sendOtpViaSms && (
              <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                <InputLabel>Phụ huynh nhận SMS</InputLabel>
                <Select
                  value={detailForm.selectedParentForOtp || ''}
                  label="Phụ huynh nhận SMS"
                  onChange={(e) => setDetailForm((prev) => ({ ...prev, selectedParentForOtp: e.target.value }))}
                >
                  <MenuItem value="" disabled>-- Chọn --</MenuItem>
                  {student?.parentId?.phone && (
                    <MenuItem value={student.parentId.phone}>
                      {student.parentId.fullName || 'Phụ huynh'} – {student.parentId.phone}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            )}

            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={detailForm.otpSent && !otpExpired ? <TimerIcon /> : <SendIcon />}
              onClick={onSendOtp}
              disabled={detailForm.otpSent && !otpExpired}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, mb: 1.5, boxShadow: 'none' }}
            >
              {detailForm.otpSent && !otpExpired ? `OTP đã gửi – còn ${countdownStr}` : 'Gửi mã OTP'}
            </Button>

            {detailForm.otpSent && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2, borderRadius: 2,
                  bgcolor: otpExpired ? '#fff5f5' : '#eff6ff',
                  borderColor: otpExpired ? '#fca5a5' : '#93c5fd',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
                  <Typography variant="caption" fontWeight={700}>Nhập mã xác thực</Typography>
                  <Chip
                    label={otpExpired ? '⏰ Hết hạn' : `⏱ ${countdownStr}`}
                    size="small"
                    color={otpExpired ? 'error' : 'primary'}
                    sx={{ fontWeight: 700, height: 20, fontSize: 11 }}
                  />
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Nhập 6 chữ số..."
                  value={detailForm.otpCode || ''}
                  disabled={otpExpired}
                  slotProps={{
                    htmlInput: { maxLength: 6, style: { fontSize: 20, letterSpacing: 8, textAlign: 'center', fontWeight: 700 } },
                  }}
                  onChange={(e) => setDetailForm((prev) => ({ ...prev, otpCode: e.target.value.slice(0, 6) }))}
                />
                {otpExpired && (
                  <Box sx={{ mt: 1.5 }}>
                    {student?.parentId?.phone && (
                      <Typography variant="caption" color="error.main" sx={{ display: 'block', mb: 1 }}>
                        📱 {student.parentId.fullName || 'Phụ huynh'}: {student.parentId.phone}
                      </Typography>
                    )}
                    <Button
                      fullWidth size="small" variant="contained" color="error"
                      onClick={onResetOtp}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
                    >
                      Gửi lại mã OTP
                    </Button>
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

// ── FileUpload helper ──
function FileUploadField({ label, currentValue, onUpload, required }) {
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
            {currentValue ? 'Đã chọn ảnh' : 'Nhấn để chọn ảnh'}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
            JPEG, PNG, WebP
          </Typography>
        </Box>
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onUpload} />
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
  detailForm,
  setDetailForm,
  submitError,
  setSubmitError,
  studentsError,
  approvedPickupPersons,
  confirmationResult,
  setConfirmationResult,
  recaptchaVerifierRef,
  otpTimeLeft,
  setOtpTimeLeft,
  otpExpired,
  setOtpExpired,
  attendanceByStudent,
  onClose,
  onSave,
  onSendToParent,
  onResetOtp,
}) {
  const isCheckoutMode = mode === 'checkout';
  const isReceiverOther = detailForm.receiverType === 'Khác';

  const canSaveCheckout =
    isCheckoutMode &&
    !!detailForm.receiverType &&
    !!detailForm.checkoutImageName &&
    (!isReceiverOther || (
      !!detailForm.receiverName?.trim() &&
      !!detailForm.receiverPhone?.trim() &&
      !!detailForm.receiverOtherImageName
    ));

  const canSubmitCheckin = mode === 'checkin' ? !!detailForm.checkinImageName : true;

  const uploadAttendanceImage = async (file, fieldName) => {
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.type)) {
      throw new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP).');
    }
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_AVATAR, formData);
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

  const handleSendOtp = async () => {
    setSubmitError(null);
    try {
      if (detailForm.sendOtpSchoolAccount && !detailForm.sendOtpViaSms) {
        await post(ENDPOINTS.OTP.SEND, { studentId, method: 'school' });
        setDetailForm((prev) => ({ ...prev, otpSent: true, otpCode: '' }));
        setOtpTimeLeft(60);
        setOtpExpired(false);
      } else {
        const phone = detailForm.sendOtpViaSms
          ? detailForm.selectedParentForOtp
          : student?.parentId?.phone;
        if (!phone) { setSubmitError('Vui lòng chọn phụ huynh nhận SMS.'); return; }
        const phoneE164 = formatPhoneForFirebase(phone);
        const result = await signInWithPhoneNumber(auth, phoneE164, recaptchaVerifierRef.current);
        setConfirmationResult(result);
        setDetailForm((prev) => ({ ...prev, otpSent: true, otpCode: '' }));
        setOtpTimeLeft(60);
        setOtpExpired(false);
      }
    } catch (err) {
      setSubmitError(err.message || 'Lỗi khi gửi OTP');
    }
  };

  const MODE_CONFIG = {
    view:     { title: 'Chi tiết điểm danh',  gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed)', icon: <ViewIcon sx={{ color:'white',fontSize:22 }} /> },
    checkin:  { title: 'Check-in học sinh',    gradient: 'linear-gradient(135deg,#059669,#10b981)', icon: <CheckInIcon sx={{ color:'white',fontSize:22 }} /> },
    checkout: { title: 'Check-out học sinh',   gradient: 'linear-gradient(135deg,#0369a1,#0ea5e9)', icon: <CheckOutIcon sx={{ color:'white',fontSize:22 }} /> },
  };
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.view;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth={mode === 'view' ? 'md' : 'sm'}
      fullWidth
      scroll="paper"
      slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden', maxHeight: '90vh' } } }}
    >
      {/* Colored header */}
      <Box
        sx={{
          background: cfg.gradient,
          px: 2.5, pt: 2.5, pb: 2,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* BG circle decoration */}
        <Box sx={{ position:'absolute', right:-20, top:-20, width:90, height:90, borderRadius:'50%', bgcolor:'rgba(255,255,255,0.08)' }} />
        <Box sx={{ display:'flex', alignItems:'center', gap:1.5, position:'relative', zIndex:1 }}>
          <Avatar sx={{ width:42, height:42, bgcolor:'rgba(255,255,255,0.2)' }}>
            {cfg.icon}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="white">
              {cfg.title}
            </Typography>
            <Box sx={{ display:'flex', gap:1, mt:0.25 }}>
              {student?.fullName && (
                <Chip
                  icon={<PersonIcon sx={{ fontSize:'12px !important', color:'rgba(255,255,255,0.8) !important' }} />}
                  label={student.fullName}
                  size="small"
                  sx={{ height:20, fontSize:11, bgcolor:'rgba(255,255,255,0.18)', color:'white', fontWeight:600 }}
                />
              )}
              <Chip
                icon={<TimeIcon sx={{ fontSize:'12px !important', color:'rgba(255,255,255,0.8) !important' }} />}
                label={selectedDate}
                size="small"
                sx={{ height:20, fontSize:11, bgcolor:'rgba(255,255,255,0.18)', color:'white' }}
              />
            </Box>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color:'rgba(255,255,255,0.8)', mt:-0.5, position:'relative', zIndex:1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <Box component="form" onSubmit={onSave} sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
        <DialogContent sx={{ pt: 2.5, overflowY: 'auto' }}>
          {(submitError || studentsError) && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {submitError || studentsError}
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

              {/* Check-in section */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2, bgcolor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:2 }}>
                  <Avatar sx={{ width:28, height:28, bgcolor:'#dcfce7' }}>
                    <CheckInIcon sx={{ fontSize:16, color:'#15803d' }} />
                  </Avatar>
                  <Typography variant="body2" fontWeight={700} color="#15803d">Thông tin Check-in</Typography>
                  {detailForm.timeIn && (
                    <Chip label={detailForm.timeIn} size="small" icon={<TimeIcon sx={{ fontSize:'12px !important' }} />}
                      sx={{ height:20, fontSize:11, fontWeight:700, ml:'auto', bgcolor:'#dcfce7', color:'#15803d' }} />
                  )}
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth size="small" type="time" label="Giờ đến"
                      value={detailForm.timeIn} disabled
                      helperText="Tự động lưu, không chỉnh sửa"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">Người đưa</Typography>
                      <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, bgcolor: 'background.paper', mt: 0.5, minHeight: 38 }}>
                        {detailForm.delivererOtherInfo ? (
                          <Typography variant="body2">
                            {detailForm.delivererOtherInfo}
                            {detailForm.delivererType && (
                              <Chip label={detailForm.delivererType} size="small" sx={{ ml: 1, height: 18, fontSize: 11 }} />
                            )}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.disabled" fontStyle="italic">Chưa ghi nhận</Typography>
                        )}
                      </Box>
                      {detailForm.delivererOtherImageName && renderImagePreview(detailForm.delivererOtherImageName, 'Ảnh người đưa')}
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FileUploadField
                      label="Ảnh check-in"
                      fieldName="checkinImageName"
                      currentValue={detailForm.checkinImageName}
                      onUpload={handleFileUpload('checkinImageName', 'Không tải lên được ảnh check-in.')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth size="small" label="Đồ mang theo"
                      placeholder="Bình nước, balo..."
                      value={detailForm.belongingsNote}
                      slotProps={{ htmlInput: { maxLength: MAX_BELONGINGS_NOTE_LEN } }}
                      onChange={(e) => setDetailForm((prev) => ({
                        ...prev, belongingsNote: sanitizeSingleLineText(e.target.value, MAX_BELONGINGS_NOTE_LEN),
                      }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth size="small" multiline rows={2} label="Ghi chú"
                      placeholder="Trẻ hơi mệt..."
                      value={detailForm.note}
                      slotProps={{ htmlInput: { maxLength: MAX_NOTE_LEN } }}
                      onChange={(e) => setDetailForm((prev) => ({
                        ...prev, note: sanitizeMultiLineText(e.target.value, MAX_NOTE_LEN),
                      }))}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Check-out section */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff', borderColor: '#bfdbfe' }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:2 }}>
                  <Avatar sx={{ width:28, height:28, bgcolor:'#dbeafe' }}>
                    <CheckOutIcon sx={{ fontSize:16, color:'#1d4ed8' }} />
                  </Avatar>
                  <Typography variant="body2" fontWeight={700} color="#1d4ed8">Thông tin Check-out</Typography>
                  {detailForm.timeOut && (
                    <Chip label={detailForm.timeOut} size="small" icon={<TimeIcon sx={{ fontSize:'12px !important' }} />}
                      sx={{ height:20, fontSize:11, fontWeight:700, ml:'auto', bgcolor:'#dbeafe', color:'#1d4ed8' }} />
                  )}
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth size="small" type="time" label="Giờ về"
                      value={detailForm.timeOut} disabled
                      helperText="Tự động lưu, không chỉnh sửa"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">Người đón</Typography>
                      <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, bgcolor: 'background.paper', mt: 0.5, minHeight: 38 }}>
                        {detailForm.receiverOtherInfo ? (
                          <Typography variant="body2">
                            {detailForm.receiverOtherInfo}
                            {detailForm.receiverType && (
                              <Chip label={detailForm.receiverType} size="small" sx={{ ml: 1, height: 18, fontSize: 11 }} />
                            )}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.disabled" fontStyle="italic">Chưa ghi nhận</Typography>
                        )}
                      </Box>
                      {detailForm.receiverOtherImageName && renderImagePreview(detailForm.receiverOtherImageName, 'Ảnh người đón')}
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FileUploadField
                      label="Ảnh check-out"
                      fieldName="checkoutImageName"
                      currentValue={detailForm.checkoutImageName}
                      onUpload={handleFileUpload('checkoutImageName', 'Không tải lên được ảnh check-out.')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth size="small" multiline rows={2} label="Ghi chú check-out"
                      placeholder="Ví dụ: Bé về sớm..."
                      value={detailForm.checkoutNote || ''}
                      slotProps={{ htmlInput: { maxLength: MAX_NOTE_LEN } }}
                      onChange={(e) => setDetailForm((prev) => ({
                        ...prev, checkoutNote: sanitizeMultiLineText(e.target.value, MAX_NOTE_LEN),
                      }))}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}

          {/* ── CHECKOUT MODE ── */}
          {mode === 'checkout' && (
            <Stack spacing={2}>
              <TextField
                fullWidth size="small" type="time" label="Giờ về"
                value={detailForm.timeOut} disabled
                helperText="Tự động lấy theo thời điểm check-out"
              />

              <FileUploadField
                label="Ảnh đón trẻ"
                fieldName="checkoutImageName"
                currentValue={detailForm.checkoutImageName}
                onUpload={handleFileUpload('checkoutImageName', 'Không tải lên được ảnh check-out.')}
                required
              />

              <FormControl fullWidth size="small">
                <InputLabel>Người đón *</InputLabel>
                <Select
                  value={detailForm.receiverPickupPersonId}
                  label="Người đón *"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'KHAC') {
                      setDetailForm((prev) => ({
                        ...prev, receiverPickupPersonId: 'KHAC', receiverType: 'Khác',
                        receiverOtherInfo: '', receiverName: '', receiverPhone: '', receiverOtherImageName: '',
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
                  <MenuItem value="KHAC">Khác</MenuItem>
                </Select>
              </FormControl>

              {detailForm.receiverType === 'Khác' && (
                <>
                  <TextField
                    fullWidth size="small" label="Tên người đón *"
                    placeholder="VD: Nguyễn Văn B"
                    value={detailForm.receiverName}
                    slotProps={{ htmlInput: { maxLength: MAX_PERSON_NAME_LEN } }}
                    onChange={(e) => setDetailForm((prev) => ({
                      ...prev, receiverName: sanitizeSingleLineText(e.target.value, MAX_PERSON_NAME_LEN),
                    }))}
                  />
                  <TextField
                    fullWidth size="small" label="Số điện thoại người đón *"
                    placeholder="VD: 0912345678"
                    value={detailForm.receiverPhone}
                    slotProps={{ htmlInput: { maxLength: MAX_PERSON_PHONE_LEN } }}
                    onChange={(e) => setDetailForm((prev) => ({
                      ...prev, receiverPhone: e.target.value.replace(/[^0-9+\-\s()]/g, '').slice(0, MAX_PERSON_PHONE_LEN),
                    }))}
                  />
                  <FileUploadField
                    label="Ảnh người đón"
                    fieldName="receiverOtherImageName"
                    currentValue={detailForm.receiverOtherImageName}
                    onUpload={handleFileUpload('receiverOtherImageName', 'Không tải lên được ảnh người đón.')}
                    required
                  />
                </>
              )}

              <OtpSection
                radioName="otpMethodCheckout"

                detailForm={detailForm}
                setDetailForm={setDetailForm}
                student={student}
                onSendOtp={handleSendOtp}
                otpTimeLeft={otpTimeLeft}
                otpExpired={otpExpired}
                onResetOtp={onResetOtp}
              />

              <TextField
                fullWidth size="small" multiline rows={3} label="Ghi chú"
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
              <TextField
                fullWidth size="small" type="time" label="Giờ đến"
                value={detailForm.timeIn} disabled
                helperText="Tự động lấy theo thời điểm check-in"
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FileUploadField
                    label="Ảnh điểm danh"
                    fieldName="checkinImageName"
                    currentValue={detailForm.checkinImageName}
                    onUpload={handleFileUpload('checkinImageName', 'Không tải lên được ảnh check-in.')}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Người đưa *</InputLabel>
                    <Select
                      value={detailForm.delivererPickupPersonId}
                      label="Người đưa *"
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
                      <MenuItem value="KHAC">Khác</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {detailForm.delivererType === 'Khác' && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth size="small" label="Tên người đưa"
                      placeholder="VD: Nguyễn Văn A"
                      value={detailForm.delivererName}
                      slotProps={{ htmlInput: { maxLength: MAX_PERSON_NAME_LEN } }}
                      onChange={(e) => setDetailForm((prev) => ({
                        ...prev, delivererName: sanitizeSingleLineText(e.target.value, MAX_PERSON_NAME_LEN),
                      }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth size="small" label="Số điện thoại người đưa"
                      placeholder="VD: 0912345678"
                      value={detailForm.delivererPhone}
                      slotProps={{ htmlInput: { maxLength: MAX_PERSON_PHONE_LEN } }}
                      onChange={(e) => setDetailForm((prev) => ({
                        ...prev, delivererPhone: e.target.value.replace(/[^0-9+\-\s()]/g, '').slice(0, MAX_PERSON_PHONE_LEN),
                      }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FileUploadField
                      label="Ảnh người đưa"
                      fieldName="delivererOtherImageName"
                      currentValue={detailForm.delivererOtherImageName}
                      onUpload={handleFileUpload('delivererOtherImageName', 'Không tải lên được ảnh người đưa.')}
                    />
                  </Grid>
                </Grid>
              )}

              <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
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
                  label={<Typography variant="body2">Có đồ mang theo</Typography>}
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
              </Box>

              <OtpSection
                radioName="otpMethodCheckin"

                detailForm={detailForm}
                setDetailForm={setDetailForm}
                student={student}
                onSendOtp={handleSendOtp}
                otpTimeLeft={otpTimeLeft}
                otpExpired={otpExpired}
                onResetOtp={onResetOtp}
              />

              <TextField
                fullWidth size="small" multiline rows={3} label="Ghi chú"
                placeholder="Ví dụ: Bé đến muộn 10 phút..."
                value={detailForm.note}
                slotProps={{ htmlInput: { maxLength: MAX_NOTE_LEN } }}
                onChange={(e) => setDetailForm((prev) => ({
                  ...prev, note: sanitizeMultiLineText(e.target.value, MAX_NOTE_LEN),
                }))}
              />
            </Stack>
          )}
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Hủy
          </Button>
          {mode === 'checkout' ? (
            <Button
              type="submit"
              variant="contained"
              color="info"
              disabled={!canSaveCheckout}
              startIcon={<SaveIcon />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Lưu check-out
            </Button>
          ) : mode === 'checkin' ? (
            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={!canSubmitCheckin}
              title={!canSubmitCheckin ? 'Vui lòng chọn ảnh check-in' : ''}
              startIcon={<SaveIcon />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Lưu check-in
            </Button>
          ) : (
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Lưu chỉnh sửa
            </Button>
          )}
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default AttendanceDetailModal;
