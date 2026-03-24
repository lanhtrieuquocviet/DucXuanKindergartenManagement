import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Avatar,
  IconButton,
  CircularProgress,
  Button,
  Chip,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  TextField,
  MenuItem,
  Menu,
  Select,
  FormControl,
  InputLabel,
  alpha,
  Skeleton,
  Zoom,
  Paper,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  CameraAlt as CameraIcon,
  Inventory2 as SampleIcon,
  CloudUpload as UploadIcon,
  CalendarMonth as CalIcon,
  ArrowForwardIos as ArrowIcon,
  Delete as DeleteIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Close as CloseIcon,
  Restaurant as RestaurantIcon,
  CheckCircleOutline as CheckCircleIcon,
  WarningAmber as WarningIcon,
  ZoomIn as ZoomInIcon,
  TodayOutlined as TodayIcon,
  WbSunny as MornIcon,
  LunchDining as LunchIcon,
  Nightlight as EveIcon,
  Cake as SnackIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Send as SendIcon,
  HourglassTop as HourglassIcon,
  LockOpen as LockOpenIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  getMealPhoto,
  upsertMealPhoto,
  upsertMealEntry,
  deleteMealEntry,
  deleteSampleEntry,
  uploadKitchenImage,
  getAttendanceSummary,
  requestEdit,
} from '../../service/mealManagement.api';

// ─────────────────────────────────────────────
// Meal type config
// ─────────────────────────────────────────────
const MEAL_TYPES = [
  { value: 'trua', label: 'Bữa chính trưa', color: '#10b981', icon: <LunchIcon sx={{ fontSize: 18 }} /> },
  { value: 'chieu', label: 'Bữa phụ chiều', color: '#6366f1', icon: <SnackIcon sx={{ fontSize: 18 }} /> },
  { value: 'khac', label: 'Khác', color: '#94a3b8', icon: <AddPhotoIcon sx={{ fontSize: 18 }} /> },
];

const getMealConfig = (mealType) => MEAL_TYPES.find((m) => m.value === mealType) || MEAL_TYPES[0];

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

// ─────────────────────────────────────────────
// ActionCard — lớn, nổi bật
// ─────────────────────────────────────────────
function ActionCard({ icon, title, subtitle, color, gradient, onClick, badge, disabled }) {
  return (
    <Card
      elevation={0}
      sx={{
        flex: 1,
        minWidth: { xs: '100%', sm: 0 },
        border: '1.5px solid',
        borderColor: disabled ? alpha('#94a3b8', 0.2) : alpha(color, 0.15),
        borderRadius: 4,
        overflow: 'hidden',
        transition: 'all 0.22s ease',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...(!disabled && {
          '&:hover': {
            boxShadow: `0 12px 32px ${alpha(color, 0.25)}`,
            transform: 'translateY(-3px)',
            borderColor: alpha(color, 0.45),
          },
        }),
      }}
    >
      <CardActionArea onClick={disabled ? undefined : onClick} disabled={disabled} sx={{ p: 0 }}>
        <CardContent sx={{ p: 3, pb: '24px !important' }}>
          {/* Icon row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                background: disabled ? '#e2e8f0' : gradient,
                boxShadow: disabled ? 'none' : `0 6px 18px ${alpha(color, 0.4)}`,
                fontSize: 28,
              }}
            >
              {icon}
            </Avatar>
            {badge !== null && badge !== undefined && (
              <Box
                sx={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: 2,
                  bgcolor: alpha(color, 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 1,
                }}
              >
                <Typography sx={{ fontSize: 15, fontWeight: 800, color, lineHeight: 1 }}>
                  {badge}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Text */}
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ mb: 0.5, color: 'text.primary', lineHeight: 1.3, fontSize: 15 }}
          >
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12.5, lineHeight: 1.5 }}>
            {subtitle}
          </Typography>

          {/* CTA link */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
            {disabled ? (
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>
                Chỉ xem (ngày đã qua)
              </Typography>
            ) : (
              <>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color }}>
                  Nhấn để thao tác
                </Typography>
                <ArrowIcon sx={{ fontSize: 10, color }} />
              </>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// ─────────────────────────────────────────────
// ImageGrid
// ─────────────────────────────────────────────
function ImageGrid({ images, onDelete, onPreview, isUploading }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 2,
      }}
    >
      {images.map((url, idx) => (
        <Box
          key={url + idx}
          sx={{
            position: 'relative',
            aspectRatio: '1',
            borderRadius: 2.5,
            overflow: 'hidden',
            border: '2px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
            '&:hover .img-actions': { opacity: 1 },
            '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' },
            transition: 'all 0.18s',
          }}
        >
          <Box
            component="img"
            src={url}
            alt={`Ảnh ${idx + 1}`}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <Box
            className="img-actions"
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              opacity: 0,
              transition: 'opacity 0.18s',
            }}
          >
            <Tooltip title="Xem lớn">
              <IconButton
                size="small"
                onClick={() => onPreview(url)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.92)',
                  '&:hover': { bgcolor: 'white', transform: 'scale(1.08)' },
                  transition: 'all 0.15s',
                }}
              >
                <ZoomInIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Xóa ảnh">
              <IconButton
                size="small"
                onClick={() => onDelete(idx)}
                sx={{
                  bgcolor: 'rgba(220,38,38,0.9)',
                  color: 'white',
                  '&:hover': { bgcolor: '#dc2626', transform: 'scale(1.08)' },
                  transition: 'all 0.15s',
                }}
              >
                <DeleteIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
          {/* Index badge */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 6,
              left: 6,
              bgcolor: 'rgba(0,0,0,0.55)',
              color: 'white',
              fontSize: 10,
              fontWeight: 700,
              px: 0.75,
              py: 0.25,
              borderRadius: 1,
              lineHeight: 1.5,
            }}
          >
            #{idx + 1}
          </Box>
        </Box>
      ))}
      {isUploading && (
        <Box
          sx={{
            aspectRatio: '1',
            borderRadius: 2.5,
            border: '2.5px dashed',
            borderColor: 'primary.main',
            bgcolor: alpha('#4f46e5', 0.04),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <CircularProgress size={30} thickness={4} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
            Đang upload...
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────
// EmptyImageState
// ─────────────────────────────────────────────
function EmptyImageState({ label, color, onUpload }) {
  return (
    <Box
      onClick={onUpload}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 7,
        gap: 2,
        borderRadius: 3,
        border: '2.5px dashed',
        borderColor: alpha(color, 0.3),
        bgcolor: alpha(color, 0.025),
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: color,
          bgcolor: alpha(color, 0.07),
          transform: 'scale(1.005)',
        },
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          bgcolor: alpha(color, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${alpha(color, 0.2)}`,
        }}
      >
        <AddPhotoIcon sx={{ fontSize: 32, color }} />
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body1" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
          Chưa có {label} cho ngày này
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ fontSize: 12.5 }}>
          Nhấn vào đây hoặc dùng nút bên dưới để upload
        </Typography>
      </Box>
      <Button
        variant="contained"
        startIcon={<UploadIcon />}
        onClick={(e) => { e.stopPropagation(); onUpload(); }}
        sx={{
          px: 3.5,
          py: 1.1,
          borderRadius: 2.5,
          fontSize: 14,
          fontWeight: 700,
          bgcolor: color,
          '&:hover': { bgcolor: color, filter: 'brightness(0.9)' },
          boxShadow: `0 6px 18px ${alpha(color, 0.4)}`,
          textTransform: 'none',
        }}
      >
        Upload ảnh
      </Button>
    </Box>
  );
}

// ─────────────────────────────────────────────
// ImageSection — bọc trong Card riêng
// ─────────────────────────────────────────────
function ImageSection({ title, date, images, color, gradient, onDelete, onPreview, onUpload, isUploading, inputRef }) {
  const hasImages = images.length > 0;

  return (
    <Card
      elevation={0}
      sx={{
        border: '1.5px solid',
        borderColor: hasImages ? alpha(color, 0.2) : 'divider',
        borderRadius: 4,
        overflow: 'visible',
        transition: 'border-color 0.2s',
      }}
    >
      <CardContent sx={{ p: 3, pb: '24px !important' }}>
        {/* Section header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2.5,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 5,
                height: 28,
                borderRadius: 4,
                background: gradient,
                flexShrink: 0,
              }}
            />
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, fontSize: 16 }}>
              {title}
            </Typography>
            <Chip
              label={formatDisplayDate(date)}
              size="small"
              sx={{
                height: 24,
                fontSize: 11.5,
                bgcolor: alpha(color, 0.1),
                color,
                fontWeight: 700,
                border: 'none',
              }}
            />
            {hasImages && (
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#16a34a !important' }} />}
                label={`${images.length} ảnh đã upload`}
                size="small"
                sx={{
                  height: 24,
                  fontSize: 11.5,
                  bgcolor: alpha('#16a34a', 0.08),
                  color: '#16a34a',
                  border: '1px solid',
                  borderColor: alpha('#16a34a', 0.25),
                }}
              />
            )}
          </Box>
          {hasImages && (
            <Button
              variant="outlined"
              startIcon={<AddPhotoIcon />}
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              sx={{
                borderRadius: 2.5,
                fontSize: 13,
                fontWeight: 600,
                borderColor: color,
                color,
                px: 2,
                py: 0.75,
                textTransform: 'none',
                '&:hover': { borderColor: color, bgcolor: alpha(color, 0.07) },
              }}
            >
              Thêm ảnh
            </Button>
          )}
        </Box>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          style={{ display: 'none' }}
          onChange={onUpload}
        />

        {/* Content */}
        {hasImages ? (
          <ImageGrid
            images={images}
            onDelete={onDelete}
            onPreview={onPreview}
            isUploading={isUploading}
          />
        ) : (
          <EmptyImageState
            label={title.toLowerCase()}
            color={color}
            onUpload={() => inputRef.current?.click()}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// UploadMealDialog — form upload ảnh theo bữa
// ─────────────────────────────────────────────
const DESC_MAX = 200;

// editData: { mealType, description, images: string[] } | null
function UploadMealDialog({ open, onClose, date, onSuccess, editData }) {
  const isEdit = Boolean(editData?.images?.length);

  // previewItems: { kind: 'existing', url } | { kind: 'new', file, url }
  const [mealType, setMealType] = useState('trua');
  const [description, setDescription] = useState('');
  const [previewItems, setPreviewItems] = useState([]);
  const [descError, setDescError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const MIN_PHOTOS = 3;
  const MAX_PHOTOS = 5;

  // Sync state when editData changes (dialog opens in edit mode)
  useEffect(() => {
    if (open) {
      if (editData) {
        const knownTypes = MEAL_TYPES.map((m) => m.value);
        setMealType(knownTypes.includes(editData.mealType) ? editData.mealType : 'trua');
        setDescription(editData.description || '');
        setPreviewItems((editData.images || []).map((url) => ({ kind: 'existing', url })));
      } else {
        setMealType('trua');
        setDescription('');
        setPreviewItems([]);
      }
      setDescError('');
      setUploading(false);
    }
  }, [open, editData]);

  const handleClose = () => {
    if (uploading) return;
    // revoke blob URLs for new files
    previewItems.forEach((p) => { if (p.kind === 'new') URL.revokeObjectURL(p.url); });
    onClose();
  };

  const validateDesc = (val) => {
    if (val.length > DESC_MAX) return `Ghi chú tối đa ${DESC_MAX} ký tự`;
    return '';
  };

  const handleDescChange = (e) => {
    const val = e.target.value;
    setDescription(val);
    setDescError(validateDesc(val));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';
    const remaining = MAX_PHOTOS - previewItems.length;
    if (remaining <= 0) { toast.warning(`Tối đa ${MAX_PHOTOS} ảnh`); return; }
    const toAdd = files.slice(0, remaining).map((file) => ({ kind: 'new', file, url: URL.createObjectURL(file) }));
    setPreviewItems((prev) => [...prev, ...toAdd]);
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
      await upsertMealEntry({ date, mealType, description: description.trim(), images });
      toast.success(isEdit ? 'Cập nhật bữa ăn thành công!' : 'Upload ảnh bữa ăn thành công!');
      previewItems.forEach((p) => { if (p.kind === 'new') URL.revokeObjectURL(p.url); });
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Thao tác thất bại');
    } finally {
      setUploading(false);
    }
  };

  const cfg = getMealConfig(mealType);
  const canSubmit = previewItems.length >= MIN_PHOTOS && !uploading && !descError;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Zoom}
      PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', boxShadow: '0 28px 56px rgba(0,0,0,0.18)' } }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3, py: 2.5,
          background: `linear-gradient(135deg, ${cfg.color} 0%, ${alpha(cfg.color, 0.75)} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.25)', width: 40, height: 40 }}>
            <CameraIcon sx={{ fontSize: 22, color: 'white' }} />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} color="white" sx={{ lineHeight: 1.2, fontSize: 16 }}>
              {isEdit ? 'Chỉnh sửa ảnh món ăn' : 'Upload ảnh món ăn'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 11.5 }}>
              Ngày {formatDisplayDate(date)}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={uploading}
          sx={{ color: 'rgba(255,255,255,0.85)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.15)' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Thông tin ngày - view only */}
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
              THÔNG TIN NGÀY (CHỈ XEM)
            </Typography>
            <Typography variant="body1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {formatDisplayDate(date)}
            </Typography>
          </Box>
        </Box>

        {/* Chọn bữa — chỉ hiện khi không có mealType được truyền vào */}
        {!editData && (
          <FormControl fullWidth size="small">
            <InputLabel sx={{ fontWeight: 600 }}>Chọn bữa *</InputLabel>
            <Select
              value={mealType}
              label="Chọn bữa *"
              onChange={(e) => setMealType(e.target.value)}
              sx={{ borderRadius: 2.5, fontWeight: 600 }}
            >
              {MEAL_TYPES.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: m.color, display: 'flex' }}>{m.icon}</Box>
                    <Typography fontWeight={600}>{m.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Ghi chú + validation */}
        <TextField
          label="Ghi chú (không bắt buộc)"
          value={description}
          onChange={handleDescChange}
          error={Boolean(descError)}
          helperText={
            <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{descError || ' '}</span>
              <span style={{ color: description.length > DESC_MAX ? '#dc2626' : description.length > DESC_MAX * 0.85 ? '#d97706' : '#9ca3af' }}>
                {description.length}/{DESC_MAX}
              </span>
            </Box>
          }
          multiline
          rows={2}
          fullWidth
          size="small"
          placeholder="VD: Cơm gà xào sả ớt, canh rau muống..."
          inputProps={{ maxLength: DESC_MAX + 10 }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
        />

        {/* Upload ảnh */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
            <Typography variant="body2" fontWeight={700} color="text.primary">
              Upload ảnh *
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

          {/* Drop zone */}
          {previewItems.length < MAX_PHOTOS && (
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2.5px dashed',
                borderColor: alpha(cfg.color, 0.4),
                borderRadius: 3,
                py: 3,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                cursor: 'pointer', transition: 'all 0.2s',
                bgcolor: alpha(cfg.color, 0.03),
                '&:hover': { borderColor: cfg.color, bgcolor: alpha(cfg.color, 0.07) },
                mb: previewItems.length > 0 ? 2 : 0,
              }}
            >
              <AddPhotoIcon sx={{ fontSize: 32, color: cfg.color }} />
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                Nhấn để chụp ảnh
              </Typography>
              <Typography variant="caption" color="text.disabled">
                Tối thiểu {MIN_PHOTOS} ảnh, tối đa {MAX_PHOTOS} ảnh · JPG, PNG, WebP
              </Typography>
            </Box>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            capture="environment"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {/* Thumbnails */}
          {previewItems.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
              {previewItems.map((p, idx) => (
                <Box
                  key={p.url}
                  sx={{
                    position: 'relative', aspectRatio: '1',
                    borderRadius: 2, overflow: 'hidden',
                    border: '2px solid',
                    borderColor: p.kind === 'existing' ? alpha(cfg.color, 0.4) : 'divider',
                    '&:hover .rm-btn': { opacity: 1 },
                  }}
                >
                  <Box
                    component="img"
                    src={p.url}
                    alt={`ảnh ${idx + 1}`}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <IconButton
                    className="rm-btn"
                    size="small"
                    onClick={() => handleRemove(idx)}
                    sx={{
                      position: 'absolute', top: 2, right: 2,
                      bgcolor: 'rgba(220,38,38,0.85)', color: 'white',
                      opacity: 0, transition: 'opacity 0.15s',
                      p: 0.25,
                      '&:hover': { bgcolor: '#dc2626' },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                  {/* Badge: existing vs new */}
                  <Box
                    sx={{
                      position: 'absolute', bottom: 3, left: 3,
                      bgcolor: p.kind === 'existing' ? alpha(cfg.color, 0.85) : 'rgba(0,0,0,0.55)',
                      color: 'white',
                      fontSize: 9, fontWeight: 700, px: 0.6, py: 0.2, borderRadius: 0.75, lineHeight: 1.5,
                    }}
                  >
                    {p.kind === 'existing' ? 'cũ' : `#${idx + 1}`}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Validation hint */}
          {previewItems.length > 0 && previewItems.length < MIN_PHOTOS && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.25 }}>
              <WarningIcon sx={{ fontSize: 15, color: '#d97706' }} />
              <Typography variant="caption" sx={{ color: '#d97706', fontSize: 12 }}>
                Cần thêm {MIN_PHOTOS - previewItems.length} ảnh nữa để upload
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
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
            borderRadius: 2.5, fontWeight: 700, px: 3, textTransform: 'none',
            bgcolor: cfg.color,
            '&:hover': { bgcolor: cfg.color, filter: 'brightness(0.9)' },
            '&:disabled': { opacity: 0.6 },
          }}
        >
          {uploading ? (isEdit ? 'Đang lưu...' : 'Đang upload...') : (isEdit ? `Lưu thay đổi (${previewItems.length} ảnh)` : `Upload (${previewItems.length}/${MIN_PHOTOS} ảnh)`)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// MealEntryCard — card hiển thị ảnh của 1 bữa
// ─────────────────────────────────────────────
function MealEntryCard({ entry, onPreview, onEdit, isToday, editRequest, onRequestEdit }) {
  const cfg = getMealConfig(entry.mealType);
  const isApproved = editRequest?.status === 'approved';
  const isPending = editRequest?.status === 'pending';

  return (
    <Card
      elevation={0}
      sx={{
        border: '1.5px solid', borderColor: alpha(cfg.color, 0.2),
        borderRadius: 3.5, overflow: 'hidden',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: `0 6px 20px ${alpha(cfg.color, 0.18)}` },
      }}
    >
      <Box
        sx={{
          px: 2, py: 1.25,
          background: `linear-gradient(135deg, ${alpha(cfg.color, 0.12)} 0%, ${alpha(cfg.color, 0.04)} 100%)`,
          display: 'flex', alignItems: 'center', gap: 1.25, borderBottom: '1px solid', borderColor: alpha(cfg.color, 0.15),
        }}
      >
        <Box sx={{ color: cfg.color, display: 'flex' }}>{cfg.icon}</Box>
        <Typography variant="subtitle2" fontWeight={800} sx={{ color: cfg.color, flex: 1 }}>
          {cfg.label}
        </Typography>
        <Chip
          icon={<CheckCircleIcon sx={{ fontSize: '13px !important', color: '#16a34a !important' }} />}
          label={`${entry.images.length} ảnh`}
          size="small"
          sx={{ height: 22, fontSize: 11, bgcolor: alpha('#16a34a', 0.1), color: '#16a34a', border: 'none' }}
        />
        {/* Action buttons */}
        {isToday && (
          isApproved ? (
            <Tooltip title="Đã được phép chỉnh sửa" arrow>
              <IconButton
                size="small"
                onClick={() => onEdit(entry)}
                sx={{ p: 0.5, color: '#10b981', '&:hover': { bgcolor: alpha('#10b981', 0.12) } }}
              >
                <LockOpenIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          ) : isPending ? (
            <Tooltip title="Đang chờ duyệt" arrow>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, px: 0.75, py: 0.3, bgcolor: alpha('#f59e0b', 0.12), borderRadius: 1 }}>
                <HourglassIcon sx={{ fontSize: 12, color: '#d97706' }} />
                <Typography sx={{ fontSize: 10.5, color: '#d97706', fontWeight: 700 }}>Chờ duyệt</Typography>
              </Box>
            </Tooltip>
          ) : (
            <Tooltip title="Gửi yêu cầu chỉnh sửa lên ban giám hiệu" arrow>
              <IconButton
                size="small"
                onClick={() => onRequestEdit('meal', entry.mealType)}
                sx={{ p: 0.5, color: cfg.color, '&:hover': { bgcolor: alpha(cfg.color, 0.12) } }}
              >
                <SendIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          )
        )}
      </Box>

      {entry.description && (
        <Box sx={{ px: 2, pt: 1.25, pb: 0.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12.5, lineHeight: 1.5, fontStyle: 'italic' }}>
            {entry.description}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          p: 1.5,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
          gap: 1,
        }}
      >
        {entry.images.map((url, idx) => (
          <Box
            key={url + idx}
            onClick={() => onPreview(url)}
            sx={{
              aspectRatio: '1', borderRadius: 1.5, overflow: 'hidden',
              border: '2px solid', borderColor: 'divider',
              cursor: 'pointer', transition: 'all 0.18s',
              '&:hover': { borderColor: cfg.color, transform: 'scale(1.04)', boxShadow: `0 4px 12px ${alpha(cfg.color, 0.3)}` },
            }}
          >
            <Box
              component="img"
              src={url}
              alt={`${cfg.label} ảnh ${idx + 1}`}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </Box>
        ))}
      </Box>

      {/* Footer: thời gian + người upload */}
      <Box
        sx={{
          px: 2, py: 1.25,
          borderTop: '1px solid', borderColor: 'divider',
          display: 'flex', alignItems: 'center', gap: 2,
          bgcolor: 'grey.50', flexWrap: 'wrap',
        }}
      >
        {entry.uploadedAt && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <TimeIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11.5, fontWeight: 500 }}>
              {new Date(entry.uploadedAt).toLocaleString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </Typography>
          </Box>
        )}
        {entry.uploadedBy?.fullName && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <PersonIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11.5, fontWeight: 600 }}>
              {entry.uploadedBy.fullName}
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Countdown — đếm ngược đến khi tự động duyệt (24h)
// ─────────────────────────────────────────────
function Countdown({ uploadedAt }) {
  const calcRemaining = () => {
    const deadline = new Date(uploadedAt).getTime() + 24 * 60 * 60 * 1000;
    return Math.max(0, Math.floor((deadline - Date.now()) / 1000));
  };
  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    const r = calcRemaining();
    setRemaining(r);
    if (r <= 0) return;
    const timer = setInterval(() => {
      const next = calcRemaining();
      setRemaining(next);
      if (next <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [uploadedAt]);

  if (remaining <= 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
        <CheckCircleIcon sx={{ fontSize: 13, color: '#10b981' }} />
        <Typography variant="caption" sx={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>
          Tự động duyệt đã kích hoạt
        </Typography>
      </Box>
    );
  }

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const fmt = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
      <HourglassIcon sx={{ fontSize: 13, color: '#d97706' }} />
      <Typography
        variant="caption"
        sx={{ fontSize: 11, color: '#d97706', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
      >
        Tự động duyệt sau {fmt}
      </Typography>
    </Box>
  );
}

// ─────────────────────────────────────────────
// SampleEntryCard — card hiển thị mẫu thực phẩm của 1 bữa
// ─────────────────────────────────────────────
const SAMPLE_MEAL_TYPES = [
  { value: 'trua', label: 'Bữa chính trưa', color: '#10b981', icon: <LunchIcon sx={{ fontSize: 18 }} /> },
  { value: 'chieu', label: 'Bữa phụ chiều', color: '#6366f1', icon: <SnackIcon sx={{ fontSize: 18 }} /> },
  { value: 'khac', label: 'Khác', color: '#94a3b8', icon: <AddPhotoIcon sx={{ fontSize: 18 }} /> },
];
const getSampleMealCfg = (mealType) => SAMPLE_MEAL_TYPES.find((m) => m.value === mealType) || SAMPLE_MEAL_TYPES[0];

function SampleEntryCard({ entry, onPreview, selectedDate, isToday, editRequest, onRequestEdit }) {
  const navigate = useNavigate();
  const cfg = getSampleMealCfg(entry.mealType);
  const isApproved = editRequest?.status === 'approved';
  const isPending = editRequest?.status === 'pending';

  return (
    <Card
      elevation={0}
      sx={{
        border: '1.5px solid', borderColor: alpha(cfg.color, 0.2),
        borderRadius: 3.5, overflow: 'hidden',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: `0 6px 20px ${alpha(cfg.color, 0.18)}` },
      }}
    >
      {/* Card header */}
      <Box
        sx={{
          px: 2, py: 1.25,
          background: `linear-gradient(135deg, ${alpha(cfg.color, 0.12)} 0%, ${alpha(cfg.color, 0.04)} 100%)`,
          display: 'flex', alignItems: 'center', gap: 1.25,
          borderBottom: '1px solid', borderColor: alpha(cfg.color, 0.15),
        }}
      >
        {/* Status badge */}
        {entry.status === 'khong_co_van_de' ? (
          <Chip
            label="Không có vấn đề"
            size="small"
            sx={{
              height: 22, fontSize: 11, fontWeight: 700,
              bgcolor: alpha('#10b981', 0.15),
              color: '#059669',
              border: '1px solid',
              borderColor: alpha('#10b981', 0.3),
            }}
          />
        ) : entry.status === 'khong_dat' ? (
          <Chip
            label="Không đạt"
            size="small"
            sx={{
              height: 22, fontSize: 11, fontWeight: 700,
              bgcolor: alpha('#ef4444', 0.15),
              color: '#dc2626',
              border: '1px solid',
              borderColor: alpha('#ef4444', 0.3),
            }}
          />
        ) : (
          <Chip
            label="Chờ kiểm tra"
            size="small"
            sx={{
              height: 22, fontSize: 11, fontWeight: 700,
              bgcolor: alpha('#f59e0b', 0.15),
              color: '#d97706',
              border: '1px solid',
              borderColor: alpha('#f59e0b', 0.3),
            }}
          />
        )}
        <Typography variant="subtitle2" fontWeight={800} sx={{ color: cfg.color, flex: 1 }}>
          Mẫu thực phẩm
        </Typography>
        <Chip
          label={`${entry.images.length} ảnh`}
          size="small"
          sx={{ height: 22, fontSize: 11, bgcolor: alpha(cfg.color, 0.1), color: cfg.color, border: 'none' }}
        />
        {/* Edit action */}
        {isToday && (
          isApproved ? (
            <Tooltip title="Đã được phép chỉnh sửa" arrow>
              <IconButton
                size="small"
                onClick={() => navigate('/kitchen/sample-food', {
                  state: { editData: { date: selectedDate, mealType: entry.mealType, description: entry.description, images: entry.images } }
                })}
                sx={{ p: 0.5, color: '#10b981', '&:hover': { bgcolor: alpha('#10b981', 0.12) } }}
              >
                <LockOpenIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          ) : isPending ? (
            <Tooltip title="Đang chờ duyệt" arrow>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, px: 0.75, py: 0.3, bgcolor: alpha('#f59e0b', 0.12), borderRadius: 1 }}>
                <HourglassIcon sx={{ fontSize: 12, color: '#d97706' }} />
                <Typography sx={{ fontSize: 10.5, color: '#d97706', fontWeight: 700 }}>Chờ duyệt</Typography>
              </Box>
            </Tooltip>
          ) : (
            <Tooltip title="Gửi yêu cầu chỉnh sửa lên ban giám hiệu" arrow>
              <IconButton
                size="small"
                onClick={() => onRequestEdit('sample', entry.mealType)}
                sx={{ p: 0.5, color: cfg.color, '&:hover': { bgcolor: alpha(cfg.color, 0.12) } }}
              >
                <SendIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          )
        )}
      </Box>

      {/* Image grid */}
      <Box
        sx={{
          p: 1.5,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
          gap: 1,
          minHeight: 120,
          bgcolor: 'grey.50',
        }}
      >
        {entry.images.length > 0 ? (
          entry.images.map((url, idx) => (
            <Box
              key={url + idx}
              onClick={() => onPreview(url)}
              sx={{
                aspectRatio: '1', borderRadius: 1.5, overflow: 'hidden',
                border: '2px solid', borderColor: 'divider',
                cursor: 'pointer', transition: 'all 0.18s',
                '&:hover': { borderColor: cfg.color, transform: 'scale(1.04)', boxShadow: `0 4px 12px ${alpha(cfg.color, 0.3)}` },
              }}
            >
              <Box component="img" src={url} alt={`mẫu ${idx + 1}`} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </Box>
          ))
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3, color: 'text.disabled' }}>
            <Typography variant="caption">Chưa có ảnh</Typography>
          </Box>
        )}
      </Box>

      {/* Description */}
      {entry.description && (
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12.5, lineHeight: 1.5, fontStyle: 'italic' }}>
            {entry.description}
          </Typography>
        </Box>
      )}

      {/* Footer */}
      <Box sx={{ px: 2, py: 1.25, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'grey.50', flexWrap: 'wrap' }}>
        {entry.uploadedAt && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <TimeIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11.5, fontWeight: 500 }}>
              Upload lúc{' '}
              {new Date(entry.uploadedAt).toLocaleString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </Typography>
          </Box>
        )}
        {entry.uploadedBy?.fullName && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <PersonIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11.5, fontWeight: 600 }}>
              {entry.uploadedBy.fullName}
            </Typography>
          </Box>
        )}
        {entry.status === 'cho_kiem_tra' && entry.uploadedAt && (
          <Countdown uploadedAt={entry.uploadedAt} />
        )}
      </Box>
    </Card>
  );
}

// ─────────────────────────────────────────────
// AttendanceSummaryDialog
// ─────────────────────────────────────────────
function AttendanceSummaryDialog({ open, onClose, date, summary, loading }) {
  const statItems = [
    { label: 'Tổng số bé', value: summary?.total ?? '—', color: '#4f46e5', bg: alpha('#4f46e5', 0.08), icon: '👥' },
    { label: 'Có mặt', value: summary?.present ?? '—', color: '#16a34a', bg: alpha('#16a34a', 0.08), icon: '✅' },
    { label: 'Vắng mặt', value: summary?.absent ?? '—', color: '#dc2626', bg: alpha('#dc2626', 0.08), icon: '❌' },
    { label: 'Suất cơm cần chuẩn bị', value: summary?.mealCount ?? '—', color: '#d97706', bg: alpha('#d97706', 0.08), icon: '🍱' },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      TransitionComponent={Zoom}
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 28px 56px rgba(0,0,0,0.18)',
        },
      }}
    >
      {/* Gradient header */}
      <Box
        sx={{
          px: 3,
          py: 3,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute', right: -20, top: -20,
            width: 100, height: 100, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.07)',
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}>
            <PeopleIcon sx={{ fontSize: 24, color: 'white' }} />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} color="white" sx={{ lineHeight: 1.2, fontSize: 17 }}>
              Sĩ số & Suất cơm
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)', fontSize: 12 }}>
              Ngày {formatDisplayDate(date)}
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: 'rgba(255,255,255,0.8)',
            position: 'relative', zIndex: 1,
            '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.15)' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 2.5 }} />
            ))}
          </Box>
        ) : summary ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {statItems.map((item) => (
              <Box
                key={item.label}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2.5,
                  py: 2,
                  borderRadius: 2.5,
                  bgcolor: item.bg,
                  border: '1.5px solid',
                  borderColor: alpha(item.color, 0.2),
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Typography sx={{ fontSize: 20 }}>{item.icon}</Typography>
                  <Typography variant="body2" fontWeight={500} color="text.secondary">
                    {item.label}
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={900} sx={{ color: item.color, lineHeight: 1 }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ fontSize: 36, mb: 1 }}>📋</Typography>
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              Chưa có dữ liệu điểm danh
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              cho ngày {formatDisplayDate(date)}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2.5, fontWeight: 600, px: 3, textTransform: 'none' }}
        >
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// ImagePreviewDialog
// ─────────────────────────────────────────────
function ImagePreviewDialog({ open, url, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', bgcolor: '#0a0a0a' } }}
    >
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1,
            bgcolor: 'rgba(0,0,0,0.6)',
            color: 'white',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' },
          }}
        >
          <CloseIcon />
        </IconButton>
        <Box
          component="img"
          src={url}
          alt="Preview"
          sx={{ width: '100%', maxHeight: '82vh', objectFit: 'contain', display: 'block' }}
        />
      </Box>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Main: MealManagement
// ─────────────────────────────────────────────
function MealManagement() {
  const navigate = useNavigate();
  const today = getLocalToday();

  const [selectedDate, setSelectedDate] = useState(today);
  const [meals, setMeals] = useState([]); // per-meal-type entries
  const [mealImages, setMealImages] = useState([]);
  const [sampleImages, setSampleImages] = useState([]);
  const [sampleEntries, setSampleEntries] = useState([]); // structured sample entries
  const [editRequests, setEditRequests] = useState([]); // edit requests for this date
  const [editReqDialog, setEditReqDialog] = useState(null); // { requestType, mealType }
  const [editReqReason, setEditReqReason] = useState('');
  const [sendingReq, setSendingReq] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [uploadingSample, setUploadingSample] = useState(false);
  const [mealPickerAnchor, setMealPickerAnchor] = useState(null);
  const [saving, setSaving] = useState(false);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null); // meal entry being edited

  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const [previewUrl, setPreviewUrl] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const sampleInputRef = useRef(null);

  // Load data
  const fetchMealPhoto = useCallback(async (date) => {
    try {
      setLoadingData(true);
      const res = await getMealPhoto(date);
      setMeals(res.data?.meals || []);
      setMealImages(res.data?.mealImages || []);
      setSampleImages(res.data?.sampleImages || []);
      setSampleEntries(res.data?.sampleEntries || []);
      setEditRequests(res.data?.editRequests || []);
    } catch {
      setMeals([]);
      setMealImages([]);
      setSampleImages([]);
      setSampleEntries([]);
      setEditRequests([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchMealPhoto(selectedDate);
  }, [selectedDate, fetchMealPhoto]);

  const saveImages = async (nextMeal, nextSample) => {
    await upsertMealPhoto({ date: selectedDate, mealImages: nextMeal, sampleImages: nextSample });
  };

  const handleRequestEdit = (requestType, mealType) => {
    setEditReqDialog({ requestType, mealType });
    setEditReqReason('');
  };

  const handleConfirmRequestEdit = async () => {
    if (!editReqReason.trim()) return;
    setSendingReq(true);
    try {
      await requestEdit({ date: selectedDate, ...editReqDialog, reason: editReqReason.trim() });
      toast.success('Đã gửi yêu cầu chỉnh sửa lên ban giám hiệu');
      setEditReqDialog(null);
      setEditReqReason('');
      fetchMealPhoto(selectedDate);
    } catch {
      toast.error('Không thể gửi yêu cầu chỉnh sửa');
    } finally {
      setSendingReq(false);
    }
  };

  const handleSampleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';
    try {
      setUploadingSample(true);
      const urls = await Promise.all(files.map((f) => uploadKitchenImage(f)));
      const next = [...sampleImages, ...urls];
      setSampleImages(next);
      setSaving(true);
      await saveImages(mealImages, next);
      toast.success(`Đã upload ${urls.length} ảnh mẫu thực phẩm thành công`);
    } catch (err) {
      toast.error(err.message || 'Upload ảnh thất bại');
    } finally {
      setUploadingSample(false);
      setSaving(false);
    }
  };

  const handleDeleteMealEntry = async (mealType) => {
    try {
      await deleteMealEntry({ date: selectedDate, mealType });
      setMeals((prev) => prev.filter((m) => m.mealType !== mealType));
      toast.success('Đã xóa bữa ăn');
    } catch {
      toast.error('Xóa thất bại, vui lòng thử lại');
    }
  };

  const handleDeleteSample = async (idx) => {
    const next = sampleImages.filter((_, i) => i !== idx);
    setSampleImages(next);
    try { await saveImages(mealImages, next); }
    catch { toast.error('Lưu thất bại, vui lòng thử lại'); }
  };

  const handleDeleteSampleEntry = async (mealType) => {
    try {
      await deleteSampleEntry({ date: selectedDate, mealType });
      setSampleEntries((prev) => prev.filter((s) => s.mealType !== mealType));
      toast.success('Đã xóa mẫu thực phẩm');
    } catch {
      toast.error('Xóa thất bại, vui lòng thử lại');
    }
  };

  const handleOpenAttendance = async () => {
    setAttendanceOpen(true);
    setAttendanceSummary(null);
    setLoadingAttendance(true);
    try {
      const res = await getAttendanceSummary(selectedDate);
      setAttendanceSummary(res.data);
    } catch {
      setAttendanceSummary(null);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const isToday = selectedDate === today;

  return (
    <Box>
      {/* ═══════════════════════════════════════
          HERO HEADER — gradient banner
      ═══════════════════════════════════════ */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #f97316 0%, #fb923c 40%, #fbbf24 100%)',
          position: 'relative',
        }}
      >
        {/* Decorative circles */}
        <Box sx={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ position: 'absolute', right: 80, bottom: -40, width: 110, height: 110, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'absolute', left: -20, bottom: -20, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            p: { xs: 3, md: 4 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {/* Left: title + subtitle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'rgba(255,255,255,0.22)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              }}
            >
              <RestaurantIcon sx={{ fontSize: 28, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  lineHeight: 1.2,
                  fontSize: { xs: 20, md: 24 },
                  fontWeight: 800,
                  color: 'white',
                  textShadow: '0 1px 4px rgba(0,0,0,0.25)',
                  WebkitFontSmoothing: 'antialiased',
                  letterSpacing: 0.2,
                }}
              >
                Quản lý bữa ăn
              </Typography>
              <Typography sx={{
                color: 'rgba(255,255,255,0.95)',
                fontSize: 13.5,
                mt: 0.25,
                fontWeight: 500,
                textShadow: '0 1px 3px rgba(0,0,0,0.2)',
                WebkitFontSmoothing: 'antialiased',
              }}>
                Upload ảnh, xem sĩ số và quản lý mẫu thực phẩm
              </Typography>
            </Box>
          </Box>

          {/* Right: Date selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Prev day */}
            <IconButton
              size="small"
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().slice(0, 10));
              }}
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, width: 34, height: 34 }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                bgcolor: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(255,255,255,0.3)',
                borderRadius: 3,
                px: 2.5,
                py: 1.5,
                cursor: 'pointer',
                minWidth: { xs: 160, sm: 210 },
              }}
            >
              <CalIcon sx={{ color: 'white', fontSize: 22 }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 700, mb: 0.1, textShadow: '0 1px 2px rgba(0,0,0,0.2)', WebkitFontSmoothing: 'antialiased' }}>
                  Ngày xem dữ liệu
                </Typography>
                <input
                  type="date"
                  value={selectedDate}
                  max={today}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 16,
                    fontWeight: 800,
                    color: 'white',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    colorScheme: 'dark',
                  }}
                />
              </Box>
              <Chip
                label="Hôm nay"
                size="small"
                sx={{
                  height: 22,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: isToday ? 'rgba(255,255,255,0.25)' : 'transparent',
                  color: isToday ? 'white' : 'transparent',
                  border: 'none',
                  pointerEvents: 'none',
                  visibility: isToday ? 'visible' : 'hidden',
                }}
              />
            </Box>

            {/* Next day */}
            <IconButton
              size="small"
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                const next = d.toISOString().slice(0, 10);
                if (next <= today) setSelectedDate(next);
              }}
              disabled={isToday}
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }, width: 34, height: 34 }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* ═══════════════════════════════════════
          DAY INFO STRIP — số ảnh đã upload
      ═══════════════════════════════════════ */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          border: '1.5px solid',
          borderColor: 'divider',
          borderRadius: 3,
          bgcolor: 'background.paper',
        }}
      >
        <CardContent sx={{ p: 2.5, pb: '20px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TodayIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Ngày {formatDisplayDate(selectedDate)}
              </Typography>
            </Box>
            <Box sx={{ width: '1px', height: 18, bgcolor: 'divider', display: { xs: 'none', sm: 'block' } }} />
            {loadingData ? (
              <>
                <Skeleton variant="rounded" width={130} height={26} sx={{ borderRadius: 6 }} />
                <Skeleton variant="rounded" width={130} height={26} sx={{ borderRadius: 6 }} />
              </>
            ) : (
              <>
                <Chip
                  icon={<CameraIcon sx={{ fontSize: '14px !important' }} />}
                  label={`${meals.length} bữa · ${meals.reduce((s, m) => s + m.images.length, 0)} ảnh món ăn`}
                  size="small"
                  sx={{
                    height: 28,
                    fontSize: 12,
                    fontWeight: 600,
                    bgcolor: meals.length > 0 ? alpha('#f97316', 0.1) : 'grey.100',
                    color: meals.length > 0 ? '#f97316' : 'text.secondary',
                    border: 'none',
                  }}
                />
                <Chip
                  icon={<SampleIcon sx={{ fontSize: '14px !important' }} />}
                  label={`${sampleEntries.length} mẫu thực phẩm`}
                  size="small"
                  sx={{
                    height: 28,
                    fontSize: 12,
                    fontWeight: 600,
                    bgcolor: sampleEntries.length > 0 ? alpha('#ef4444', 0.1) : 'grey.100',
                    color: sampleEntries.length > 0 ? '#ef4444' : 'text.secondary',
                    border: 'none',
                  }}
                />
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════
          3 ACTION CARDS
      ═══════════════════════════════════════ */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2.5,
          mb: 3.5,
        }}
      >
        <ActionCard
          icon={<PeopleIcon sx={{ fontSize: 26, color: 'white' }} />}
          title="Sĩ số & Suất cơm"
          subtitle="Xem điểm danh, tính suất ăn theo ngày"
          color="#4f46e5"
          gradient="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
          onClick={() => navigate('/kitchen/headcount')}
          badge={null}
        />
      </Box>

      {/* ═══════════════════════════════════════
          ẢNH THEO BỮA ĂN
      ═══════════════════════════════════════ */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Meals grouped by type */}
        <Card
          elevation={0}
          sx={{ border: '1.5px solid', borderColor: meals.length > 0 ? alpha('#f97316', 0.2) : 'divider', borderRadius: 4 }}
        >
          <CardContent sx={{ p: 3, pb: '24px !important' }}>
            {/* Section header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 5, height: 28, borderRadius: 4, background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)', flexShrink: 0 }} />
                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, fontSize: 16 }}>
                  Ảnh món ăn theo bữa
                </Typography>
                <Chip
                  label={formatDisplayDate(selectedDate)}
                  size="small"
                  sx={{ height: 24, fontSize: 11.5, bgcolor: alpha('#f97316', 0.1), color: '#f97316', fontWeight: 700, border: 'none' }}
                />
              </Box>
              {isToday && meals.length < MEAL_TYPES.length && (
                <Button
                  variant="contained"
                  startIcon={<AddPhotoIcon />}
                  onClick={(e) => setMealPickerAnchor(e.currentTarget)}
                  sx={{
                    borderRadius: 2.5, fontSize: 13, fontWeight: 700, px: 2.5, py: 0.9, textTransform: 'none',
                    bgcolor: '#f97316', '&:hover': { bgcolor: '#f97316', filter: 'brightness(0.9)' },
                    boxShadow: `0 4px 14px ${alpha('#f97316', 0.4)}`,
                  }}
                >
                  Upload ảnh
                </Button>
              )}
            </Box>

            {loadingData ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                {[1, 2].map((i) => <Skeleton key={i} variant="rounded" height={180} sx={{ borderRadius: 3 }} />)}
              </Box>
            ) : meals.length > 0 || isToday ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {meals.length > 0 && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                    {meals.map((entry) => (
                      <MealEntryCard
                        key={entry.mealType}
                        entry={entry}
                        onPreview={(url) => { setPreviewUrl(url); setPreviewOpen(true); }}
                        onEdit={(e) => { setEditingEntry(e); setUploadDialogOpen(true); }}
                        isToday={isToday}
                        editRequest={editRequests.find((r) => r.requestType === 'meal' && r.mealType === entry.mealType)}
                        onRequestEdit={handleRequestEdit}
                      />
                    ))}
                  </Box>
                )}
                {isToday && meals.length < MEAL_TYPES.length && (
                  <>
                    <Box
                      onClick={(e) => setMealPickerAnchor(e.currentTarget)}
                      sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
                        py: 3, borderRadius: 3, border: '2px dashed',
                        borderColor: alpha('#f97316', 0.35), bgcolor: alpha('#f97316', 0.025),
                        cursor: 'pointer', transition: 'all 0.2s',
                        '&:hover': { borderColor: '#f97316', bgcolor: alpha('#f97316', 0.07) },
                      }}
                    >
                      <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: alpha('#f97316', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AddPhotoIcon sx={{ fontSize: 20, color: '#f97316' }} />
                      </Box>
                      <Typography variant="body2" fontWeight={700} color="#f97316">
                        Thêm ảnh bữa ăn
                      </Typography>
                    </Box>
                    <Menu
                      anchorEl={mealPickerAnchor}
                      open={Boolean(mealPickerAnchor)}
                      onClose={() => setMealPickerAnchor(null)}
                      PaperProps={{ sx: { borderRadius: 2.5, minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}
                    >
                      {MEAL_TYPES.filter((cfg) => !meals.find((m) => m.mealType === cfg.value)).map((cfg) => (
                        <MenuItem
                          key={cfg.value}
                          onClick={() => { setMealPickerAnchor(null); setEditingEntry({ mealType: cfg.value, description: '', images: [] }); setUploadDialogOpen(true); }}
                          sx={{ gap: 1.5, py: 1.25 }}
                        >
                          <Box sx={{ color: cfg.color, display: 'flex' }}>{cfg.icon}</Box>
                          <Typography variant="body2" fontWeight={600}>{cfg.label}</Typography>
                        </MenuItem>
                      ))}
                    </Menu>
                  </>
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  py: 7, gap: 2, borderRadius: 3, border: '2.5px dashed',
                  borderColor: alpha('#f97316', 0.3), bgcolor: alpha('#f97316', 0.025),
                }}
              >
                <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: alpha('#f97316', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${alpha('#f97316', 0.2)}` }}>
                  <AddPhotoIcon sx={{ fontSize: 32, color: '#f97316' }} />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body1" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                    Chưa có ảnh món ăn cho ngày này
                  </Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ fontSize: 12.5 }}>
                    Không có dữ liệu cho ngày này
                  </Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Mẫu thực phẩm - có trạng thái Chờ kiểm tra */}
        <Card
          elevation={0}
          sx={{ border: '1.5px solid', borderColor: sampleEntries.length > 0 ? alpha('#ef4444', 0.2) : 'divider', borderRadius: 4 }}
        >
          <CardContent sx={{ p: 3, pb: '24px !important' }}>
            {/* Section header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 5, height: 28, borderRadius: 4, background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)', flexShrink: 0 }} />
                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, fontSize: 16 }}>
                  Mẫu thực phẩm
                </Typography>
                <Chip
                  label={formatDisplayDate(selectedDate)}
                  size="small"
                  sx={{ height: 24, fontSize: 11.5, bgcolor: alpha('#ef4444', 0.1), color: '#ef4444', fontWeight: 700, border: 'none' }}
                />
                {sampleEntries.length > 0 && (
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#16a34a !important' }} />}
                    label="Đã upload"
                    size="small"
                    sx={{ height: 24, fontSize: 11.5, bgcolor: alpha('#16a34a', 0.08), color: '#16a34a', border: '1px solid', borderColor: alpha('#16a34a', 0.25) }}
                  />
                )}
              </Box>
              {isToday && sampleEntries.length < 1 && (
                <Button
                  variant="contained"
                  startIcon={<AddPhotoIcon />}
                  onClick={() => navigate('/kitchen/sample-food')}
                  sx={{
                    borderRadius: 2.5, fontSize: 13, fontWeight: 700, px: 2.5, py: 0.9, textTransform: 'none',
                    bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' },
                    boxShadow: `0 4px 14px ${alpha('#ef4444', 0.4)}`,
                  }}
                >
                  Upload mẫu
                </Button>
              )}
            </Box>

            {loadingData ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rounded" height={200} sx={{ borderRadius: 3 }} />)}
              </Box>
            ) : sampleEntries.length > 0 || isToday ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sampleEntries.length > 0 && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                    {sampleEntries.map((entry) => (
                      <SampleEntryCard
                        key={entry.mealType}
                        entry={entry}
                        onPreview={(url) => { setPreviewUrl(url); setPreviewOpen(true); }}
                        selectedDate={selectedDate}
                        isToday={isToday}
                        editRequest={editRequests.find((r) => r.requestType === 'sample' && r.mealType === entry.mealType)}
                        onRequestEdit={handleRequestEdit}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  py: 7, gap: 2, borderRadius: 3, border: '2.5px dashed',
                  borderColor: alpha('#ef4444', 0.3), bgcolor: alpha('#ef4444', 0.025),
                }}
              >
                <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: alpha('#ef4444', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${alpha('#ef4444', 0.2)}` }}>
                  <AddPhotoIcon sx={{ fontSize: 32, color: '#ef4444' }} />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body1" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                    Chưa có mẫu thực phẩm cho ngày này
                  </Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ fontSize: 12.5 }}>
                    Không có dữ liệu cho ngày này
                  </Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* ── Upload / Edit Meal Dialog ── */}
      <UploadMealDialog
        open={uploadDialogOpen}
        onClose={() => { setUploadDialogOpen(false); setEditingEntry(null); }}
        date={selectedDate}
        editData={editingEntry}
        onSuccess={() => fetchMealPhoto(selectedDate)}
      />

      {/* ── Yêu cầu chỉnh sửa Dialog ── */}
      <Dialog
        open={Boolean(editReqDialog)}
        onClose={() => !sendingReq && setEditReqDialog(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SendIcon sx={{ fontSize: 18, color: '#6366f1' }} />
          Yêu cầu chỉnh sửa
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13.5, color: '#64748b', mb: 1.5 }}>
            Vui lòng nhập lý do cần chỉnh sửa để gửi lên ban giám hiệu duyệt.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            placeholder="Nhập lý do chỉnh sửa..."
            value={editReqReason}
            onChange={(e) => setEditReqReason(e.target.value)}
            size="small"
            autoFocus
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setEditReqDialog(null)}
            disabled={sendingReq}
            sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={sendingReq || !editReqReason.trim()}
            onClick={handleConfirmRequestEdit}
            startIcon={sendingReq ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <SendIcon sx={{ fontSize: 15 }} />}
            sx={{
              bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' },
              textTransform: 'none', fontWeight: 700, borderRadius: 2,
            }}
          >
            Gửi yêu cầu
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialogs ── */}
      <AttendanceSummaryDialog
        open={attendanceOpen}
        onClose={() => setAttendanceOpen(false)}
        date={selectedDate}
        summary={attendanceSummary}
        loading={loadingAttendance}
      />
      <ImagePreviewDialog
        open={previewOpen}
        url={previewUrl}
        onClose={() => setPreviewOpen(false)}
      />

      {/* Saving toast indicator */}
      {saving && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: 1400,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 2.5,
            py: 1.25,
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: '0 8px 28px rgba(0,0,0,0.16)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CircularProgress size={16} thickness={5} />
          <Typography variant="body2" color="text.secondary" fontWeight={700}>
            Đang lưu...
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default MealManagement;
