import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  Tooltip,
  IconButton,
  alpha,
} from '@mui/material';
import {
  CalendarMonth as CalIcon,
  CameraAlt as CameraIcon,
  Inventory2 as SampleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  ZoomIn as ZoomInIcon,
  Close as CloseIcon,
  Restaurant as RestaurantIcon,
  HourglassTop as HourglassIcon,
  LockOpen as LockOpenIcon,
  Block as BlockIcon,
  OpenInFull as OpenInFullIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, ENDPOINTS } from '../../service/api';
import {
  getMealPhoto,
  getAttendanceSummary,
  reviewSampleEntry,
  approveEditRequest,
} from '../../service/mealManagement.api';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const MEAL_LABELS = {
  sang: 'Bữa sáng',
  trua: 'Bữa trưa',
  chieu: 'Bữa chiều',
  xe: 'Bữa xế',
};

const MEAL_ORDER = ['sang', 'trua', 'chieu', 'xe'];

const STATUS_CONFIG = {
  cho_kiem_tra: {
    label: 'Chờ kiểm tra',
    color: '#f59e0b',
    bgcolor: '#fef3c7',
    icon: <HourglassIcon sx={{ fontSize: 13 }} />,
  },
  khong_co_van_de: {
    label: 'Không có vấn đề',
    color: '#10b981',
    bgcolor: '#d1fae5',
    icon: <CheckCircleIcon sx={{ fontSize: 13 }} />,
  },
  khong_dat: {
    label: 'Có vấn đề',
    color: '#ef4444',
    bgcolor: '#fee2e2',
    icon: <WarningIcon sx={{ fontSize: 13 }} />,
  },
};

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

const formatDateTime = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${hh}:${mm} ${dd}/${mo}/${yy}`;
};

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
        <CheckCircleIcon sx={{ fontSize: 12, color: '#10b981' }} />
        <Typography sx={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>
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
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
      <HourglassIcon sx={{ fontSize: 12, color: '#d97706' }} />
      <Typography sx={{ fontSize: 11, color: '#d97706', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        Tự động duyệt sau {fmt}
      </Typography>
    </Box>
  );
}

// ─────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.cho_kiem_tra;
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.25,
        py: 0.35,
        borderRadius: 10,
        bgcolor: cfg.bgcolor,
        color: cfg.color,
        fontWeight: 700,
        fontSize: 12,
      }}
    >
      {cfg.icon}
      {cfg.label}
    </Box>
  );
}

// ─────────────────────────────────────────────
// ImagePlaceholder
// ─────────────────────────────────────────────
function ImagePlaceholder() {
  return (
    <Box
      sx={{
        width: '100%',
        aspectRatio: '4/3',
        bgcolor: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        borderRadius: 2,
        color: '#94a3b8',
      }}
    >
      <CameraIcon sx={{ fontSize: 36 }} />
      <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>Mẫu thực phẩm</Typography>
    </Box>
  );
}

// ─────────────────────────────────────────────
// SampleDetailDialog — xem chi tiết tất cả ảnh + thông tin
// ─────────────────────────────────────────────
function SampleDetailDialog({ open, onClose, entry, date }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const images = entry?.images || [];
  const mealLabel = MEAL_LABELS[entry?.mealType] || entry?.mealType || '';

  // reset khi mở dialog mới
  useEffect(() => { if (open) setActiveIdx(0); }, [open]);

  if (!entry) return null;

  const goPrev = () => setActiveIdx((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setActiveIdx((i) => (i + 1) % images.length);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      {/* Header */}
      <Box sx={{
        px: 3, py: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid', borderColor: 'divider',
        bgcolor: '#f8fafc',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SampleIcon sx={{ fontSize: 20, color: '#6366f1' }} />
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
              Chi tiết mẫu thực phẩm — {mealLabel}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#64748b' }}>
              Ngày {formatDisplayDate(date)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatusBadge status={entry.status} />
          <Tooltip title="Đóng">
            <IconButton size="small" onClick={onClose} sx={{ color: '#64748b' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 420 }}>

          {/* Left: image viewer */}
          <Box sx={{ flex: '0 0 55%', bgcolor: '#0f172a', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {images.length > 0 ? (
              <>
                {/* Main image */}
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, minHeight: 280 }}>
                  <Box
                    component="img"
                    src={images[activeIdx]}
                    alt={`Ảnh ${activeIdx + 1}`}
                    sx={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 2, display: 'block' }}
                  />
                </Box>

                {/* Navigation */}
                {images.length > 1 && (
                  <>
                    <IconButton
                      onClick={goPrev}
                      sx={{
                        position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                        bgcolor: 'rgba(255,255,255,0.15)', color: 'white',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      }}
                    >
                      <ChevronLeftIcon />
                    </IconButton>
                    <IconButton
                      onClick={goNext}
                      sx={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        bgcolor: 'rgba(255,255,255,0.15)', color: 'white',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      }}
                    >
                      <ChevronRightIcon />
                    </IconButton>

                    {/* Counter */}
                    <Box sx={{
                      position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
                      bgcolor: 'rgba(0,0,0,0.55)', color: 'white',
                      px: 1.5, py: 0.25, borderRadius: 10, fontSize: 12, fontWeight: 700,
                    }}>
                      {activeIdx + 1} / {images.length}
                    </Box>
                  </>
                )}

                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <Box sx={{
                    display: 'flex', gap: 0.75, px: 2, pb: 1.5, pt: 0.5,
                    overflowX: 'auto',
                    '&::-webkit-scrollbar': { height: 4 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
                  }}>
                    {images.map((url, idx) => (
                      <Box
                        key={url + idx}
                        onClick={() => setActiveIdx(idx)}
                        component="img"
                        src={url}
                        alt={`thumb ${idx + 1}`}
                        sx={{
                          width: 52, height: 52, objectFit: 'cover',
                          borderRadius: 1.5, flexShrink: 0, cursor: 'pointer',
                          border: '2px solid',
                          borderColor: idx === activeIdx ? '#6366f1' : 'transparent',
                          opacity: idx === activeIdx ? 1 : 0.55,
                          transition: 'all 0.15s',
                          '&:hover': { opacity: 1 },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                <CameraIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography sx={{ fontSize: 13 }}>Chưa có ảnh</Typography>
              </Box>
            )}
          </Box>

          {/* Right: info panel */}
          <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>

            {/* Description */}
            {entry.description && (
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.5 }}>
                  Mô tả
                </Typography>
                <Typography sx={{ fontSize: 13.5, color: '#1e293b', lineHeight: 1.6 }}>
                  {entry.description}
                </Typography>
              </Box>
            )}

            {/* Upload info */}
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.75 }}>
                Thông tin tải lên
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {entry.uploadedAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon sx={{ fontSize: 15, color: '#94a3b8' }} />
                    <Typography sx={{ fontSize: 13, color: '#374151' }}>
                      {formatDateTime(entry.uploadedAt)}
                    </Typography>
                  </Box>
                )}
                {entry.uploadedBy?.fullName && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 15, color: '#94a3b8' }} />
                    <Typography sx={{ fontSize: 13, color: '#374151' }}>
                      {entry.uploadedBy.fullName}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Review info */}
            {entry.reviewedBy && (
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.75 }}>
                  Kết quả kiểm tra
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 15, color: '#94a3b8' }} />
                    <Typography sx={{ fontSize: 13, color: '#374151' }}>
                      Duyệt bởi: {entry.reviewedBy.fullName || 'Hiệu trưởng'}
                    </Typography>
                  </Box>
                  {entry.reviewedAt && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimeIcon sx={{ fontSize: 15, color: '#94a3b8' }} />
                      <Typography sx={{ fontSize: 13, color: '#374151' }}>
                        {formatDateTime(entry.reviewedAt)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {/* Review note */}
            {entry.reviewNote && (
              <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #fecaca' }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#dc2626', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Vấn đề phát hiện
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#dc2626', lineHeight: 1.6 }}>
                  {entry.reviewNote}
                </Typography>
              </Box>
            )}

            {/* Pending countdown */}
            {entry.status === 'cho_kiem_tra' && entry.uploadedAt && (
              <Box sx={{ p: 1.5, bgcolor: '#fefce8', borderRadius: 2, border: '1px solid #fef08a' }}>
                <Countdown uploadedAt={entry.uploadedAt} />
              </Box>
            )}

            {/* Image count */}
            <Box sx={{ mt: 'auto', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
                {images.length} ảnh đính kèm
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// SampleCard
// ─────────────────────────────────────────────
function SampleCard({ entry, date, onReview, isToday, editRequest, onApproveEdit, onRejectEdit }) {
  const [hovering, setHovering] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const isPending = entry.status === 'cho_kiem_tra';
  const mealLabel = MEAL_LABELS[entry.mealType] || entry.mealType;
  const firstImage = entry.images?.[0];

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1.5px solid',
        borderColor: isPending ? alpha('#f59e0b', 0.35) : 'divider',
        borderRadius: 3,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.18s',
        '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
      }}
    >
      {/* Status badge + meal label */}
      <Box sx={{ px: 2, pt: 1.5, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StatusBadge status={entry.status} />
        <Chip
          label={mealLabel}
          size="small"
          sx={{ fontSize: 11, height: 22, bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600 }}
        />
      </Box>

      {/* Image */}
      <Box
        sx={{ px: 2, position: 'relative', cursor: 'pointer' }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={() => setDetailOpen(true)}
      >
        {firstImage ? (
          <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
            <Box
              component="img"
              src={firstImage}
              alt="Mẫu thực phẩm"
              sx={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
            />
            {/* Hover overlay */}
            <Box sx={{
              position: 'absolute', inset: 0,
              bgcolor: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: hovering ? 1 : 0,
              transition: 'opacity 0.18s',
              gap: 0.75,
            }}>
              <OpenInFullIcon sx={{ color: 'white', fontSize: 20 }} />
              <Typography sx={{ color: 'white', fontSize: 12.5, fontWeight: 700 }}>Xem chi tiết</Typography>
            </Box>
            {entry.images.length > 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 6,
                  right: 6,
                  bgcolor: 'rgba(0,0,0,0.55)',
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 700,
                  px: 1,
                  py: 0.25,
                  borderRadius: 10,
                }}
              >
                +{entry.images.length - 1} ảnh
              </Box>
            )}
          </Box>
        ) : (
          <ImagePlaceholder />
        )}
      </Box>

      {/* Info */}
      <Box sx={{ px: 2, pt: 1.25, pb: isPending ? 1 : 1.75, flex: 1 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#374151', mb: 0.5 }}>
          {formatDisplayDate(date)}
        </Typography>
        {entry.description && (
          <Typography sx={{ fontSize: 12.5, color: '#10b981', mb: 0.5, lineHeight: 1.5 }}>
            Mẫu thực phẩm {mealLabel.toLowerCase()}: {entry.description}
          </Typography>
        )}
        {entry.uploadedAt && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <TimeIcon sx={{ fontSize: 12, color: '#94a3b8' }} />
            <Typography sx={{ fontSize: 11.5, color: '#64748b' }}>
              Upload lúc {formatDateTime(entry.uploadedAt)}
              {entry.uploadedBy?.fullName && ` bởi ${entry.uploadedBy.fullName}`}
            </Typography>
          </Box>
        )}
        {isPending && entry.uploadedAt && (
          <Countdown uploadedAt={entry.uploadedAt} />
        )}
        {entry.reviewedBy && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
            <PersonIcon sx={{ fontSize: 12, color: '#94a3b8' }} />
            <Typography sx={{ fontSize: 11.5, color: '#64748b' }}>
              Duyệt bởi: {entry.reviewedBy?.fullName || 'Hiệu trưởng'}
            </Typography>
          </Box>
        )}
        {entry.reviewNote && (
          <Box sx={{ mt: 0.75, p: 1, bgcolor: '#fef2f2', borderRadius: 1.5, border: '1px solid #fecaca' }}>
            <Typography sx={{ fontSize: 11.5, color: '#dc2626' }}>
              Vấn đề: {entry.reviewNote}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Edit request approval */}
      {editRequest?.status === 'pending' && (
        <Box sx={{ px: 2, pb: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {editRequest.reason && (
            <Typography sx={{ fontSize: 11.5, color: '#64748b', fontStyle: 'italic' }}>
              Lý do: {editRequest.reason}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Button
              fullWidth
              size="small"
              variant="contained"
              startIcon={<LockOpenIcon sx={{ fontSize: 14 }} />}
              onClick={() => onApproveEdit('sample', entry.mealType)}
              sx={{
                fontSize: 12,
                fontWeight: 700,
                py: 0.5,
                borderRadius: 2,
                bgcolor: '#f59e0b',
                '&:hover': { bgcolor: '#d97706' },
                textTransform: 'none',
              }}
            >
              Cho phép
            </Button>
            <Button
              fullWidth
              size="small"
              variant="contained"
              startIcon={<BlockIcon sx={{ fontSize: 14 }} />}
              onClick={() => onRejectEdit('sample', entry.mealType)}
              sx={{
                fontSize: 12,
                fontWeight: 700,
                py: 0.5,
                borderRadius: 2,
                bgcolor: '#ef4444',
                '&:hover': { bgcolor: '#dc2626' },
                textTransform: 'none',
              }}
            >
              Từ chối
            </Button>
          </Box>
        </Box>
      )}
      {editRequest?.status === 'approved' && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Chip
            icon={<LockOpenIcon sx={{ fontSize: '13px !important', color: '#10b981 !important' }} />}
            label="Đã cho phép chỉnh sửa"
            size="small"
            sx={{ height: 22, fontSize: 11, bgcolor: alpha('#10b981', 0.1), color: '#059669', border: '1px solid', borderColor: alpha('#10b981', 0.3) }}
          />
        </Box>
      )}
      {editRequest?.status === 'rejected' && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Chip
            icon={<BlockIcon sx={{ fontSize: '13px !important', color: '#ef4444 !important' }} />}
            label="Đã từ chối chỉnh sửa"
            size="small"
            sx={{ height: 22, fontSize: 11, bgcolor: alpha('#ef4444', 0.1), color: '#dc2626', border: '1px solid', borderColor: alpha('#ef4444', 0.3) }}
          />
        </Box>
      )}

      {/* View detail button */}
      <Box sx={{ px: 2, pb: 1 }}>
        <Button
          fullWidth
          size="small"
          variant="outlined"
          startIcon={<OpenInFullIcon sx={{ fontSize: 14 }} />}
          onClick={() => setDetailOpen(true)}
          sx={{
            fontSize: 12,
            fontWeight: 600,
            py: 0.5,
            borderRadius: 2,
            borderColor: '#e2e8f0',
            color: '#475569',
            textTransform: 'none',
            '&:hover': { borderColor: '#6366f1', color: '#6366f1', bgcolor: 'rgba(99,102,241,0.04)' },
          }}
        >
          Xem chi tiết ({entry.images?.length || 0} ảnh)
        </Button>
      </Box>

      {/* Action buttons (only for pending and today) */}
      {isPending && isToday && (
        <Box sx={{ px: 2, pb: 1.75, display: 'flex', gap: 1 }}>
          <Button
            fullWidth
            size="small"
            variant="contained"
            onClick={() => onReview(entry, 'khong_co_van_de')}
            sx={{
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669' },
              fontSize: 12.5,
              fontWeight: 700,
              py: 0.75,
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            Không có vấn đề
          </Button>
          <Button
            fullWidth
            size="small"
            variant="contained"
            onClick={() => onReview(entry, 'khong_dat')}
            sx={{
              bgcolor: '#ef4444',
              '&:hover': { bgcolor: '#dc2626' },
              fontSize: 12.5,
              fontWeight: 700,
              py: 0.75,
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            Có vấn đề
          </Button>
        </Box>
      )}

      {/* Detail dialog */}
      <SampleDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        entry={entry}
        date={date}
      />
    </Paper>
  );
}

// ─────────────────────────────────────────────
// MealPhotosTab
// ─────────────────────────────────────────────
function MealPhotosTab({ meals, onPreview, editRequests, onApproveEdit, onRejectEdit }) {
  if (!meals || meals.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
        <CameraIcon sx={{ fontSize: 48, mb: 1 }} />
        <Typography>Chưa có ảnh món ăn cho ngày này</Typography>
      </Box>
    );
  }

  const sorted = [...meals].sort(
    (a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType)
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {sorted.map((meal) => {
        const editReq = editRequests?.find((r) => r.requestType === 'meal' && r.mealType === meal.mealType);
        const isPendingEdit = editReq?.status === 'pending';
        const isApprovedEdit = editReq?.status === 'approved';
        return (
        <Box key={meal.mealType}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
            <RestaurantIcon sx={{ fontSize: 18, color: '#10b981' }} />
            <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#374151' }}>
              {MEAL_LABELS[meal.mealType] || meal.mealType}
            </Typography>
            {meal.description && (
              <Typography sx={{ fontSize: 13, color: '#64748b' }}>— {meal.description}</Typography>
            )}
            {isPendingEdit && (
              <Box sx={{ ml: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                {editReq.reason && (
                  <Typography sx={{ fontSize: 11.5, color: '#64748b', fontStyle: 'italic' }}>
                    Lý do: {editReq.reason}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<LockOpenIcon sx={{ fontSize: 14 }} />}
                    onClick={() => onApproveEdit('meal', meal.mealType)}
                    sx={{
                      fontSize: 11.5, fontWeight: 700, py: 0.4, px: 1.25,
                      bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' },
                      textTransform: 'none', borderRadius: 1.5,
                    }}
                  >
                    Cho phép chỉnh sửa
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<BlockIcon sx={{ fontSize: 14 }} />}
                    onClick={() => onRejectEdit('meal', meal.mealType)}
                    sx={{
                      fontSize: 11.5, fontWeight: 700, py: 0.4, px: 1.25,
                      bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' },
                      textTransform: 'none', borderRadius: 1.5,
                    }}
                  >
                    Từ chối
                  </Button>
                </Box>
              </Box>
            )}
            {isApprovedEdit && (
              <Chip
                icon={<LockOpenIcon sx={{ fontSize: '13px !important', color: '#10b981 !important' }} />}
                label="Đã cho phép chỉnh sửa"
                size="small"
                sx={{ ml: 'auto', height: 22, fontSize: 11, bgcolor: alpha('#10b981', 0.1), color: '#059669', border: '1px solid', borderColor: alpha('#10b981', 0.3) }}
              />
            )}
            {editReq?.status === 'rejected' && (
              <Chip
                icon={<BlockIcon sx={{ fontSize: '13px !important', color: '#ef4444 !important' }} />}
                label="Đã từ chối chỉnh sửa"
                size="small"
                sx={{ ml: 'auto', height: 22, fontSize: 11, bgcolor: alpha('#ef4444', 0.1), color: '#dc2626', border: '1px solid', borderColor: alpha('#ef4444', 0.3) }}
              />
            )}
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 1.5,
            }}
          >
            {meal.images?.map((url, idx) => (
              <Box
                key={url + idx}
                sx={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: 2.5,
                  overflow: 'hidden',
                  border: '1.5px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  '&:hover .zoom-btn': { opacity: 1 },
                  '&:hover': { borderColor: 'primary.main' },
                  transition: 'border-color 0.15s',
                }}
                onClick={() => onPreview(url)}
              >
                <Box
                  component="img"
                  src={url}
                  alt={`Ảnh ${idx + 1}`}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <Box
                  className="zoom-btn"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <ZoomInIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
              </Box>
            ))}
          </Box>
          {meal.uploadedAt && (
            <Typography sx={{ fontSize: 11.5, color: '#94a3b8', mt: 0.75 }}>
              Upload lúc {formatDateTime(meal.uploadedAt)}
              {meal.uploadedBy?.fullName && ` bởi ${meal.uploadedBy.fullName}`}
            </Typography>
          )}
        </Box>
        );
      })}
    </Box>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
function MealManagementSchoolAdmin() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [selectedDate, setSelectedDate] = useState(getLocalToday());
  const [mealData, setMealData] = useState(null);
  const [editRequests, setEditRequests] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Review popup state
  const [reviewDialog, setReviewDialog] = useState(null); // { entry, action }
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Image preview
  const [previewUrl, setPreviewUrl] = useState(null);

  const fetchData = useCallback(async (date) => {
    setLoading(true);
    try {
      const [mealRes, attendRes] = await Promise.all([
        getMealPhoto(date),
        getAttendanceSummary(date),
      ]);
      setMealData(mealRes.data);
      setEditRequests(mealRes.data?.editRequests || []);
      setAttendanceSummary(attendRes.data);
    } catch {
      toast.error('Không thể tải dữ liệu bữa ăn');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate, fetchData]);

  const isToday = selectedDate === getLocalToday();

  // ── Stats ──
  const meals = mealData?.meals || [];
  const sampleEntries = mealData?.sampleEntries || [];
  const totalMealImages = meals.reduce((acc, m) => acc + (m.images?.length || 0), 0);
  const pendingCount = sampleEntries.filter((s) => s.status === 'cho_kiem_tra').length;
  const okCount = sampleEntries.filter((s) => s.status === 'khong_co_van_de').length;
  const issueCount = sampleEntries.filter((s) => s.status === 'khong_dat').length;
  const mealCount = attendanceSummary?.mealCount ?? 0;

  // ── Review handler ──
  const handleReviewClick = (entry, action) => {
    if (action === 'khong_co_van_de') {
      // Direct confirm without popup
      handleConfirmReview(entry, 'khong_co_van_de', '');
    } else {
      setReviewDialog({ entry, action });
      setReviewNote('');
    }
  };

  const handleConfirmReview = async (entry, status, note) => {
    setReviewing(true);
    try {
      await reviewSampleEntry({
        date: selectedDate,
        mealType: entry.mealType,
        status,
        reviewNote: note,
      });
      toast.success(
        status === 'khong_co_van_de'
          ? 'Đã xác nhận không có vấn đề'
          : 'Đã báo cáo vấn đề'
      );
      setReviewDialog(null);
      setReviewNote('');
      fetchData(selectedDate);
    } catch {
      toast.error('Không thể cập nhật trạng thái');
    } finally {
      setReviewing(false);
    }
  };

  // ── Approve edit request ──
  const handleApproveEdit = async (requestType, mealType) => {
    try {
      await approveEditRequest({ date: selectedDate, requestType, mealType, action: 'approved' });
      toast.success('Đã cho phép chỉnh sửa');
      fetchData(selectedDate);
    } catch {
      toast.error('Không thể duyệt yêu cầu chỉnh sửa');
    }
  };

  // ── Reject edit request ──
  const handleRejectEdit = async (requestType, mealType) => {
    try {
      await approveEditRequest({ date: selectedDate, requestType, mealType, action: 'rejected' });
      toast.success('Đã từ chối yêu cầu chỉnh sửa');
      fetchData(selectedDate);
    } catch {
      toast.error('Không thể từ chối yêu cầu chỉnh sửa');
    }
  };

  // ── Menu ──
  const menuItems = [
    { key: 'overview', label: 'Tổng quan trường' },
    {
      key: 'academic-years',
      label: 'Quản lý năm học',
      children: [
        { key: 'academic-year-setup', label: 'Thiết lập năm học' },
        { key: 'academic-plan', label: 'Thiết lập kế hoạch' },
        { key: 'academic-students', label: 'Danh sách lớp học' },
        { key: 'academic-curriculum', label: 'Chương trình giáo dục' },
        { key: 'academic-schedule', label: 'Thời gian biểu' },
        { key: 'academic-report', label: 'Báo cáo & thống kê' },
      ],
    },
    { key: 'classes', label: 'Lớp học' },
    { key: 'menu', label: 'Quản lý thực đơn' },
    { key: 'meal-management', label: 'Quản lý bữa ăn', icon: <SampleIcon fontSize="small" /> },
    { key: 'teachers', label: 'Giáo viên' },
    { key: 'students', label: 'Học sinh & phụ huynh' },
    { key: 'assets', label: 'Quản lý tài sản' },
    { key: 'reports', label: 'Báo cáo của trường' },
    { key: 'contacts', label: 'Liên hệ' },
    { key: 'qa', label: 'Câu hỏi' },
    { key: 'blogs', label: 'Quản lý blog' },
    { key: 'documents', label: 'Quản lý tài liệu' },
    { key: 'public-info', label: 'Thông tin công khai' },
    { key: 'attendance', label: 'Quản lý điểm danh' },
  ];

  const handleMenuSelect = async (key) => {
    if (key === 'meal-management') return;
    if (key === 'overview') { navigate('/school-admin'); return; }
    if (key === 'academic-years' || key === 'academic-year-setup') { navigate('/school-admin/academic-years'); return; }
    if (key === 'academic-curriculum') { navigate('/school-admin/curriculum'); return; }
    if (key === 'academic-schedule') { navigate('/school-admin/timetable'); return; }
    if (key === 'academic-plan') { navigate('/school-admin/academic-plan'); return; }
    if (key === 'academic-report') {
      try {
        const resp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT);
        const yearId = resp?.status === 'success' ? resp?.data?._id : null;
        if (yearId) navigate(`/school-admin/academic-years/${yearId}/report`);
        else navigate('/school-admin/academic-years');
      } catch (_) {
        navigate('/school-admin/academic-years');
      }
      return;
    }
    if (key === 'classes') { navigate('/school-admin/classes'); return; }
    if (key === 'academic-students') { navigate('/school-admin/class-list'); return; }
    if (key === 'teachers') { navigate('/school-admin/teachers'); return; }
    if (key === 'students') { navigate('/school-admin/students'); return; }
    if (key === 'menu') { navigate('/school-admin/menus'); return; }
    if (key === 'contacts') { navigate('/school-admin/contacts'); return; }
    if (key === 'qa') { navigate('/school-admin/qa'); return; }
    if (key === 'blogs') { navigate('/school-admin/blogs'); return; }
    if (key === 'documents') { navigate('/school-admin/documents'); return; }
    if (key === 'public-info') { navigate('/school-admin/public-info'); return; }
    if (key === 'attendance') { navigate('/school-admin/attendance/overview'); return; }
  };

  const userName = user?.fullName || user?.username || 'School Admin';

  // ── Stats cards config ──
  const statCards = [
    {
      label: 'Số suất cơm trong ngày',
      value: mealCount,
      color: '#6366f1',
      icon: <RestaurantIcon sx={{ fontSize: 22, color: '#6366f1' }} />,
    },
    {
      label: 'Số ảnh món ăn',
      value: totalMealImages,
      color: '#0ea5e9',
      icon: <CameraIcon sx={{ fontSize: 22, color: '#0ea5e9' }} />,
    },
    {
      label: 'Mẫu chờ kiểm tra',
      value: pendingCount,
      color: '#f59e0b',
      icon: <HourglassIcon sx={{ fontSize: 22, color: '#f59e0b' }} />,
    },
    {
      label: 'Mẫu không có vấn đề',
      value: okCount,
      color: '#10b981',
      icon: <CheckCircleIcon sx={{ fontSize: 22, color: '#10b981' }} />,
    },
    {
      label: 'Mẫu có vấn đề',
      value: issueCount,
      color: '#ef4444',
      icon: <WarningIcon sx={{ fontSize: 22, color: '#ef4444' }} />,
    },
  ];

  return (
    <RoleLayout
      title="Quản lý bữa ăn"
      description="Kiểm tra ảnh bữa ăn và duyệt mẫu thực phẩm hàng ngày"
      menuItems={menuItems}
      activeKey="meal-management"
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {/* ── Date picker ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <CalIcon sx={{ color: '#6366f1', fontSize: 22 }} />
        <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#374151' }}>Chọn ngày:</Typography>
        <Box
          component="input"
          type="date"
          value={selectedDate}
          max={getLocalToday()}
          onChange={(e) => setSelectedDate(e.target.value)}
          sx={{
            border: '1.5px solid #e2e8f0',
            borderRadius: 2,
            px: 1.5,
            py: 0.75,
            fontSize: 14,
            fontFamily: 'inherit',
            color: '#374151',
            outline: 'none',
            cursor: 'pointer',
            '&:focus': { borderColor: '#6366f1' },
          }}
        />
        {loading && <CircularProgress size={18} sx={{ color: '#6366f1' }} />}
      </Box>

      {/* ── Stats ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {statCards.map((card) => (
          <Paper
            key={card.label}
            elevation={0}
            sx={{
              p: 2,
              border: '1.5px solid',
              borderColor: alpha(card.color, 0.2),
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {card.icon}
              <Typography
                sx={{ fontSize: 26, fontWeight: 800, color: card.color, lineHeight: 1 }}
              >
                {card.value}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 12, color: '#64748b', lineHeight: 1.4, mt: 0.5 }}>
              {card.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* ── Tabs ── */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 2,
            '& .MuiTab-root': { fontWeight: 600, fontSize: 13.5, textTransform: 'none', minHeight: 48 },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <CameraIcon sx={{ fontSize: 17 }} />
                Ảnh món ăn
                {totalMealImages > 0 && (
                  <Chip label={totalMealImages} size="small" sx={{ height: 18, fontSize: 10, ml: 0.25 }} />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <SampleIcon sx={{ fontSize: 17 }} />
                Mẫu thực phẩm
                {pendingCount > 0 && (
                  <Chip
                    label={pendingCount}
                    size="small"
                    color="warning"
                    sx={{ height: 18, fontSize: 10, ml: 0.25 }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>

        <Box sx={{ p: 2.5 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Ảnh món ăn tab */}
              {tabValue === 0 && (
                <MealPhotosTab
                  meals={meals}
                  onPreview={(url) => setPreviewUrl(url)}
                  editRequests={editRequests}
                  onApproveEdit={handleApproveEdit}
                  onRejectEdit={handleRejectEdit}
                />
              )}

              {/* Mẫu thực phẩm tab */}
              {tabValue === 1 && (
                <>
                  {sampleEntries.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                      <SampleIcon sx={{ fontSize: 48, mb: 1 }} />
                      <Typography>Chưa có mẫu thực phẩm cho ngày này</Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
                        gap: 2,
                      }}
                    >
                      {[...sampleEntries]
                        .sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType))
                        .map((entry) => (
                          <SampleCard
                            key={entry.mealType}
                            entry={entry}
                            date={selectedDate}
                            onReview={handleReviewClick}
                            isToday={isToday}
                            editRequest={editRequests.find((r) => r.requestType === 'sample' && r.mealType === entry.mealType)}
                            onApproveEdit={handleApproveEdit}
                            onRejectEdit={handleRejectEdit}
                          />
                        ))}
                    </Box>
                  )}
                </>
              )}
            </>
          )}
        </Box>
      </Paper>

      {/* ── Report Issue Dialog ── */}
      <Dialog
        open={Boolean(reviewDialog && reviewDialog.action === 'khong_dat')}
        onClose={() => !reviewing && setReviewDialog(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: 16 }}>
          Báo cáo vấn đề
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13.5, color: '#64748b', mb: 1.5 }}>
            Mô tả vấn đề phát hiện với mẫu thực phẩm
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            placeholder="Mô tả vấn đề..."
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setReviewDialog(null)}
            disabled={reviewing}
            sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={reviewing || !reviewNote.trim()}
            onClick={() => handleConfirmReview(reviewDialog.entry, 'khong_dat', reviewNote)}
            sx={{
              bgcolor: '#ef4444',
              '&:hover': { bgcolor: '#dc2626' },
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            {reviewing ? <CircularProgress size={16} sx={{ color: 'white' }} /> : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Image Preview Dialog ── */}
      <Dialog
        open={Boolean(previewUrl)}
        onClose={() => setPreviewUrl(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}
      >
        <Box sx={{ position: 'relative' }}>
          <Tooltip title="Đóng">
            <IconButton
              onClick={() => setPreviewUrl(null)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.55)',
                color: 'white',
                zIndex: 10,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
          <Box
            component="img"
            src={previewUrl}
            alt="Preview"
            sx={{ width: '100%', borderRadius: 2, display: 'block' }}
          />
        </Box>
      </Dialog>
    </RoleLayout>
  );
}

export default MealManagementSchoolAdmin;
