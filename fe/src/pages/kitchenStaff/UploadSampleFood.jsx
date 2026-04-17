import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  IconButton,
  CircularProgress,
  Button,
  Chip,
  Tooltip,
  TextField,
  alpha,
  Paper,
  Divider,
} from '@mui/material';
import {
  Inventory2 as SampleIcon,
  CloudUpload as UploadIcon,
  CalendarMonth as CalIcon,
  Close as CloseIcon,
  WarningAmber as WarningIcon,
  TodayOutlined as TodayIcon,
  AccessTime as TimeIcon,
  ArrowBack as ArrowBackIcon,
  CameraAlt as CameraIcon,
  Cameraswitch as CameraswitchIcon,
  LunchDining as LunchIcon,
  Cake as SnackIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { uploadKitchenImage, upsertSampleEntry } from '../../service/mealManagement.api';

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const MEAL_OPTIONS = [
  {
    mealType: 'trua',
    label: 'Bữa trưa',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    icon: <LunchIcon />,
  },
  {
    mealType: 'chieu',
    label: 'Bữa chiều',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
    icon: <SnackIcon />,
  },
];

const MIN_PHOTOS = 1;
const MAX_PHOTOS = 10;
const DESC_MAX = 200;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getLocalToday = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const formatTime = (date) => {
  const h = String(date.getHours()).padStart(2, '0');
  const mn = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${mn}:${s}`;
};

const stampImage = (file, dateStr, mealLabel) =>
  new Promise((resolve) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(blobUrl);

      const now = new Date();
      const line1 = mealLabel;
      const line2 = `${formatDisplayDate(dateStr)} · ${formatTime(now)}`;

      const fontSize = Math.max(18, Math.round(img.width * 0.028));
      const pad = Math.round(fontSize * 0.55);
      const lineH = fontSize * 1.35;
      const blockH = lineH * 2 + pad * 2;

      const grad = ctx.createLinearGradient(0, img.height - blockH - pad, 0, img.height);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.72)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, img.height - blockH - pad, img.width, blockH + pad);

      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.97)';
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 4;
      ctx.fillText(line1, pad, img.height - pad - lineH);

      ctx.font = `${Math.round(fontSize * 0.85)}px Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255,220,100,0.95)';
      ctx.fillText(line2, pad, img.height - pad);
      ctx.shadowBlur = 0;

      canvas.toBlob(
        (blob) => {
          const stampedFile = new File([blob], file.name, { type: 'image/jpeg' });
          resolve({ file: stampedFile, url: URL.createObjectURL(stampedFile) });
        },
        'image/jpeg',
        0.92
      );
    };
    img.src = blobUrl;
  });

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
function UploadSampleFood() {
  const navigate = useNavigate();
  const location = useLocation();
  const today = getLocalToday();

  const editData = location.state?.editData || null;
  const isEdit = Boolean(editData);
  const existingEntries = location.state?.existingEntries || [];

  // mealType nào đã có entry (và không phải đang edit cái đó thì mới lock)
  const uploadedTypes = existingEntries
    .map((e) => e.mealType)
    .filter((t) => !isEdit || t !== editData?.mealType);

  // mặc định chọn bữa chưa upload, ưu tiên trưa
  const defaultMealType = (() => {
    if (editData?.mealType && MEAL_OPTIONS.some((o) => o.mealType === editData.mealType))
      return editData.mealType;
    const first = MEAL_OPTIONS.find((o) => !uploadedTypes.includes(o.mealType));
    return first ? first.mealType : 'trua';
  })();

  const [selectedDate, setSelectedDate] = useState(editData?.date || today);
  const [selectedMealType, setSelectedMealType] = useState(defaultMealType);
  const [description, setDescription] = useState(editData?.description || '');
  const [descError, setDescError] = useState('');
  const [previewItems, setPreviewItems] = useState(
    (editData?.images || []).map((url) => ({ kind: 'existing', url }))
  );
  const [uploading, setUploading] = useState(false);

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const mealCfg = MEAL_OPTIONS.find((o) => o.mealType === selectedMealType) || MEAL_OPTIONS[0];
  const stampLabel = `Mẫu thực phẩm - ${mealCfg.label}`;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(
    async (facing) => {
      setCameraError(null);
      setCameraReady(false);
      stopCamera();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: facing },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraReady(true);
      } catch (err) {
        let msg = 'Không thể bật camera';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
          msg = 'Trình duyệt chặn quyền camera — vào Settings > Privacy > Camera để cấp quyền';
        else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError')
          msg = 'Không tìm thấy camera trên thiết bị này';
        else if (err.name === 'NotReadableError' || err.name === 'TrackStartError')
          msg = 'Camera đang được dùng bởi ứng dụng khác';
        setCameraError(msg);
      }
    },
    [stopCamera]
  );

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(
    () => () => {
      previewItems.forEach((p) => {
        if (p.kind === 'new') URL.revokeObjectURL(p.url);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // khi đổi bữa thì reset ảnh + ghi chú (chỉ trong create mode)
  const handleMealTypeChange = (mealType) => {
    if (isEdit) return;
    stopCamera();
    setCameraOpen(false);
    setPreviewItems((prev) => {
      prev.forEach((p) => { if (p.kind === 'new') URL.revokeObjectURL(p.url); });
      return [];
    });
    setDescription('');
    setDescError('');
    setSelectedMealType(mealType);
  };

  const openCamera = () => {
    setCameraOpen(true);
    setCameraError(null);
    startCamera(facingMode);
  };

  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(async (blob) => {
      const rawFile = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const { file: stampedFile, url } = await stampImage(rawFile, selectedDate, stampLabel);
      setPreviewItems((prev) => {
        const next = [...prev, { kind: 'new', file: stampedFile, url }];
        if (next.length >= MAX_PHOTOS) {
          stopCamera();
          setCameraOpen(false);
        }
        return next;
      });
    }, 'image/jpeg', 0.92);
  };

  const validateDesc = (val) => (val.length > DESC_MAX ? `Ghi chú tối đa ${DESC_MAX} ký tự` : '');

  const handleDescChange = (e) => {
    const val = e.target.value;
    setDescription(val);
    setDescError(validateDesc(val));
  };

  const handleRemove = (idx) => {
    setPreviewItems((prev) => {
      const item = prev[idx];
      if (item.kind === 'new') URL.revokeObjectURL(item.url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async () => {
    const err = validateDesc(description);
    if (err) { setDescError(err); return; }
    if (previewItems.length < MIN_PHOTOS) {
      toast.warning(`Cần ít nhất ${MIN_PHOTOS} ảnh`);
      return;
    }
    try {
      setUploading(true);
      const images = await Promise.all(
        previewItems.map((p) =>
          p.kind === 'existing' ? Promise.resolve(p.url) : uploadKitchenImage(p.file)
        )
      );
      await upsertSampleEntry({
        date: selectedDate,
        mealType: selectedMealType,
        description: description.trim(),
        images,
      });
      toast.success(isEdit ? 'Cập nhật mẫu thực phẩm thành công!' : 'Upload mẫu thực phẩm thành công!');
      previewItems.forEach((p) => { if (p.kind === 'new') URL.revokeObjectURL(p.url); });
      navigate('/kitchen/meal-management');
    } catch (err) {
      toast.error(err.message || 'Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = previewItems.length >= MIN_PHOTOS && !uploading && !descError;
  const isToday = selectedDate === today;

  return (
    <Box>
      {/* ── Hero Header ── */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #ef4444 0%, #f87171 40%, #fb923c 100%)',
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ position: 'absolute', right: 80, bottom: -40, width: 110, height: 110, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />

        <Box
          sx={{
            position: 'relative', zIndex: 1,
            p: { xs: 3, md: 4 },
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => navigate('/kitchen/meal-management')}
              sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' }, mr: 0.5 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.22)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
              <SampleIcon sx={{ fontSize: 28, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography
                variant="h5"
                sx={{ lineHeight: 1.2, fontSize: { xs: 18, md: 22 }, fontWeight: 800, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.25)' }}
              >
                {isEdit ? 'Chỉnh sửa mẫu thực phẩm' : 'Chụp ảnh mẫu thực phẩm'}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, mt: 0.25, fontWeight: 500 }}>
                {isEdit ? 'Cập nhật ảnh mẫu thực phẩm cho bữa ăn' : 'Chọn bữa và chụp mẫu thực phẩm sử dụng trong bữa ăn'}
              </Typography>
            </Box>
          </Box>

          {/* Date selector */}
          <Box
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              bgcolor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 3,
              px: 2.5, py: 1.5,
            }}
          >
            <CalIcon sx={{ color: 'white', fontSize: 22 }} />
            <Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 700, mb: 0.1 }}>
                Ngày chụp
              </Typography>
              <input
                type="date"
                value={selectedDate}
                max={today}
                readOnly={isEdit}
                onChange={(e) => !isEdit && e.target.value && setSelectedDate(e.target.value)}
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 16, fontWeight: 800, color: 'white',
                  cursor: isEdit ? 'default' : 'pointer',
                  fontFamily: 'inherit', colorScheme: 'dark',
                }}
              />
            </Box>
            {isToday && (
              <Chip label="Hôm nay" size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: 'rgba(255,255,255,0.25)', color: 'white', border: 'none' }} />
            )}
          </Box>
        </Box>
      </Paper>

      {/* ── Form card ── */}
      <Card
        elevation={0}
        sx={{ border: '1.5px solid', borderColor: alpha(mealCfg.color, 0.2), borderRadius: 4, maxWidth: 680, mx: 'auto' }}
      >
        <CardContent sx={{ p: 3, pb: '24px !important' }}>
          {/* Section header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box sx={{ width: 5, height: 28, borderRadius: 4, background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)', flexShrink: 0 }} />
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, fontSize: 16 }}>
              Thông tin mẫu thực phẩm
            </Typography>
            <Chip
              label={formatDisplayDate(selectedDate)}
              size="small"
              sx={{ height: 24, fontSize: 11.5, bgcolor: alpha('#ef4444', 0.1), color: '#ef4444', fontWeight: 700, border: 'none' }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Date display */}
            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                px: 2, py: 1.5, borderRadius: 2.5,
                bgcolor: 'grey.50', border: '1.5px solid', borderColor: 'divider',
              }}
            >
              <TodayIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
              <Box>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11, fontWeight: 700, display: 'block' }}>
                  NGÀY (CHỈ XEM)
                </Typography>
                <Typography variant="body1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                  {formatDisplayDate(selectedDate)}
                </Typography>
              </Box>
            </Box>

            {/* Meal type selector */}
            <Box>
              <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mb: 1.25 }}>
                Chọn bữa *
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {MEAL_OPTIONS.map((opt) => {
                  const isActive = selectedMealType === opt.mealType;
                  const isUploaded = uploadedTypes.includes(opt.mealType);
                  const isDisabled = isEdit ? opt.mealType !== editData?.mealType : isUploaded;
                  return (
                    <Box
                      key={opt.mealType}
                      onClick={() => !isDisabled && handleMealTypeChange(opt.mealType)}
                      sx={{
                        flex: 1,
                        display: 'flex', alignItems: 'center', gap: 1.25,
                        px: 2, py: 1.5, borderRadius: 2.5,
                        border: '2px solid',
                        borderColor: isDisabled
                          ? 'divider'
                          : isActive ? opt.color : alpha(opt.color, 0.2),
                        bgcolor: isDisabled
                          ? 'grey.50'
                          : isActive ? alpha(opt.color, 0.08) : 'transparent',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        opacity: isDisabled ? 0.55 : 1,
                        transition: 'all 0.18s',
                        ...(!isDisabled && {
                          '&:hover': { borderColor: opt.color, bgcolor: alpha(opt.color, 0.06) },
                        }),
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32, height: 32,
                          background: isDisabled ? '#e2e8f0' : isActive ? opt.gradient : alpha(opt.color, 0.15),
                          boxShadow: isActive && !isDisabled ? `0 3px 10px ${alpha(opt.color, 0.4)}` : 'none',
                        }}
                      >
                        <Box sx={{ color: isDisabled ? '#94a3b8' : isActive ? 'white' : opt.color, display: 'flex', fontSize: 16 }}>
                          {opt.icon}
                        </Box>
                      </Avatar>
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={isActive ? 800 : 600}
                          sx={{ color: isDisabled ? 'text.disabled' : isActive ? opt.color : 'text.secondary', lineHeight: 1.2 }}
                        >
                          {opt.label}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: 10.5, color: isDisabled ? 'text.disabled' : opt.color }}>
                          {isDisabled && !isEdit ? 'Đã upload' : isActive ? 'Đang chọn' : ''}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Description */}
            <TextField
              label={`Ghi chú ${mealCfg.label} (không bắt buộc)`}
              value={description}
              onChange={handleDescChange}
              error={Boolean(descError)}
              helperText={
                <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{descError || ' '}</span>
                  <span
                    style={{
                      color:
                        description.length > DESC_MAX
                          ? '#dc2626'
                          : description.length > DESC_MAX * 0.85
                          ? '#d97706'
                          : '#9ca3af',
                    }}
                  >
                    {description.length}/{DESC_MAX}
                  </span>
                </Box>
              }
              multiline
              rows={2}
              fullWidth
              size="small"
              placeholder={`VD: Mẫu thực phẩm ${mealCfg.label.toLowerCase()}...`}
              inputProps={{ maxLength: DESC_MAX + 10 }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            />

            {/* Chụp ảnh mẫu */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
                <Typography variant="body2" fontWeight={700} color="text.primary">
                  Chụp ảnh mẫu *
                </Typography>
                <Chip
                  label={`${previewItems.length}/${MAX_PHOTOS} ảnh`}
                  size="small"
                  sx={{
                    height: 24, fontSize: 11.5, fontWeight: 700,
                    bgcolor: previewItems.length >= MIN_PHOTOS ? alpha('#16a34a', 0.1) : alpha('#f59e0b', 0.1),
                    color: previewItems.length >= MIN_PHOTOS ? '#16a34a' : '#d97706',
                  }}
                />
              </Box>

              {/* Camera UI */}
              {cameraOpen ? (
                <Box sx={{ mb: previewItems.length > 0 ? 2 : 0 }}>
                  {!cameraReady && !cameraError && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, bgcolor: 'grey.100', borderRadius: 2, gap: 1.5 }}>
                      <CircularProgress size={22} />
                      <Typography variant="caption" color="text.secondary">Đang bật camera...</Typography>
                    </Box>
                  )}
                  {cameraError && (
                    <Box sx={{ p: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="error.main" fontWeight={600} sx={{ display: 'block', mb: 1.5 }}>
                        {cameraError}
                      </Typography>
                      <Button size="small" variant="outlined" color="error" onClick={() => startCamera(facingMode)} sx={{ mr: 1 }}>
                        Thử lại
                      </Button>
                      <Button size="small" onClick={() => { setCameraOpen(false); stopCamera(); }}>Hủy</Button>
                    </Box>
                  )}
                  <Box sx={{ display: cameraReady ? 'block' : 'none', borderRadius: 2, overflow: 'hidden', border: '2px solid', borderColor: alpha(mealCfg.color, 0.4) }}>
                    <Box sx={{ position: 'relative' }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: '100%', display: 'block', maxHeight: 320, objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small"
                        onClick={flipCamera}
                        sx={{
                          position: 'absolute', top: 8, right: 8,
                          bgcolor: 'rgba(0,0,0,0.45)', color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
                        }}
                      >
                        <CameraswitchIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, p: 1.5, bgcolor: 'grey.50', justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        startIcon={<CameraIcon />}
                        onClick={captureFromCamera}
                        sx={{
                          textTransform: 'none', fontWeight: 700,
                          bgcolor: mealCfg.color,
                          '&:hover': { bgcolor: mealCfg.color, filter: 'brightness(0.9)' },
                        }}
                      >
                        Chụp ảnh ({previewItems.length + 1}/{MAX_PHOTOS})
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => { setCameraOpen(false); stopCamera(); }}
                        sx={{ textTransform: 'none' }}
                      >
                        Đóng camera
                      </Button>
                    </Box>
                  </Box>
                </Box>
              ) : (
                previewItems.length < MAX_PHOTOS && (
                  <Box
                    onClick={openCamera}
                    sx={{
                      border: '2.5px dashed', borderColor: alpha(mealCfg.color, 0.4),
                      borderRadius: 3, py: 3.5,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                      cursor: 'pointer', transition: 'all 0.2s',
                      bgcolor: alpha(mealCfg.color, 0.03),
                      '&:hover': { borderColor: mealCfg.color, bgcolor: alpha(mealCfg.color, 0.07) },
                      mb: previewItems.length > 0 ? 2 : 0,
                    }}
                  >
                    <CameraIcon sx={{ fontSize: 36, color: mealCfg.color }} />
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                      Nhấn để mở camera
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Tối thiểu {MIN_PHOTOS} ảnh, tối đa {MAX_PHOTOS} ảnh · Ảnh tự động đóng dấu ngày giờ
                    </Typography>
                  </Box>
                )
              )}

              {/* Thumbnails */}
              {previewItems.length > 0 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
                  {previewItems.map((p, idx) => (
                    <Box
                      key={p.url}
                      sx={{
                        position: 'relative', aspectRatio: '1',
                        borderRadius: 2.5, overflow: 'hidden',
                        border: '2px solid', borderColor: alpha(mealCfg.color, 0.4),
                        '&:hover .rm-btn': { opacity: 1 },
                      }}
                    >
                      <Box
                        component="img"
                        src={p.url}
                        alt={`mẫu ${idx + 1}`}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      <Tooltip title="Xóa ảnh">
                        <IconButton
                          className="rm-btn"
                          size="small"
                          onClick={() => handleRemove(idx)}
                          sx={{
                            position: 'absolute', top: 4, right: 4,
                            bgcolor: 'rgba(220,38,38,0.85)', color: 'white',
                            opacity: 0, transition: 'opacity 0.15s', p: 0.4,
                            '&:hover': { bgcolor: '#dc2626' },
                          }}
                        >
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                  {previewItems.length < MAX_PHOTOS && !cameraOpen && (
                    <Box
                      onClick={openCamera}
                      sx={{
                        aspectRatio: '1', borderRadius: 2.5,
                        border: '2.5px dashed', borderColor: alpha(mealCfg.color, 0.3),
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.75,
                        cursor: 'pointer', transition: 'all 0.2s',
                        bgcolor: alpha(mealCfg.color, 0.02),
                        '&:hover': { borderColor: mealCfg.color, bgcolor: alpha(mealCfg.color, 0.07) },
                      }}
                    >
                      <CameraIcon sx={{ fontSize: 24, color: mealCfg.color }} />
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, textAlign: 'center' }}>
                        Chụp thêm
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {previewItems.length === 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
                  <WarningIcon sx={{ fontSize: 14, color: '#d97706' }} />
                  <Typography variant="caption" sx={{ color: '#d97706', fontSize: 12 }}>
                    Cần ít nhất {MIN_PHOTOS} ảnh để lưu
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Status preview */}
            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                px: 2, py: 1.25, borderRadius: 2.5,
                bgcolor: alpha('#f59e0b', 0.08), border: '1.5px solid', borderColor: alpha('#f59e0b', 0.25),
              }}
            >
              <TimeIcon sx={{ fontSize: 16, color: '#d97706' }} />
              <Typography variant="body2" sx={{ color: '#d97706', fontWeight: 600, fontSize: 13 }}>
                Sau khi lưu, mẫu sẽ hiển thị với trạng thái <strong>Chờ kiểm tra</strong> trên trang Quản lý bữa ăn
              </Typography>
            </Box>
          </Box>
        </CardContent>

        <Divider />

        <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button
            onClick={() => navigate('/kitchen/meal-management')}
            disabled={uploading}
            variant="outlined"
            sx={{ borderRadius: 2.5, fontWeight: 600, px: 3, textTransform: 'none' }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            variant="contained"
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
            sx={{
              borderRadius: 2.5, fontWeight: 700, px: 3.5, textTransform: 'none',
              bgcolor: mealCfg.color,
              '&:hover': { bgcolor: mealCfg.color, filter: 'brightness(0.9)' },
              '&:disabled': { opacity: 0.6 },
              boxShadow: `0 4px 14px ${alpha(mealCfg.color, 0.4)}`,
            }}
          >
            {uploading
              ? isEdit ? 'Đang cập nhật...' : 'Đang lưu...'
              : isEdit
              ? `Cập nhật ${mealCfg.label}`
              : `Lưu mẫu ${mealCfg.label}`}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}

export default UploadSampleFood;
