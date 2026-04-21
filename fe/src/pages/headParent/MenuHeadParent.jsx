import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMenus, headParentReviewMenu } from '../../service/menu.api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import {
  Box, Typography, Paper, Chip, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Skeleton, Tabs, Tab,
  Avatar, Tooltip, Stack, Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  MenuBook as MenuBookIcon,
  CalendarMonth as CalendarIcon,
  HourglassEmpty as PendingIcon,
  History as HistoryIcon,
  RateReview as ReviewIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const STATUS_CONFIG = {
  pending_headparent: { label: 'Chờ xem xét',     color: 'warning'   },
  pending:            { label: 'Chờ BGH duyệt',    color: 'info'      },
  approved:           { label: 'Đã duyệt',          color: 'success'   },
  active:             { label: 'Đang áp dụng',      color: 'primary'   },
  completed:          { label: 'Đã kết thúc',       color: 'secondary' },
  rejected:           { label: 'Bị từ chối',        color: 'error'     },
};

const TABS = [
  { value: 'all',                label: 'Tất cả'          },
  { value: 'pending_headparent', label: 'Chờ xem xét'     },
  { value: 'pending',            label: 'Chờ BGH duyệt'   },
  { value: 'approved',           label: 'Đã duyệt'        },
  { value: 'active',             label: 'Đang áp dụng'    },
  { value: 'completed',          label: 'Lịch sử'         },
];

const MONTH_NAMES = [
  '', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

function isHistoryStatus(m) {
  return m.status === 'completed' || m.status === 'rejected';
}

function CardSkeleton() {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>
      <Skeleton width={200} height={28} />
      <Skeleton width={160} height={20} sx={{ mt: 0.5 }} />
      <Skeleton width={80} height={24} sx={{ mt: 1 }} />
    </Paper>
  );
}

export default function MenuHeadParent() {
  const [menus, setMenus]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [tab, setTab]               = useState('all');
  const [reviewTarget, setReviewTarget] = useState(null);
  const [comment, setComment]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate      = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { key: 'menus', label: 'Thực đơn', icon: <MenuBookIcon /> },
  ];

  useEffect(() => { fetchMenus(); }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await getMenus({ limit: 500 });
      setMenus(Array.isArray(res?.data) ? res.data : []);
    } catch {
      toast.error('Không thể tải danh sách thực đơn');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => menus.filter((m) => {
    if (tab === 'all') return true;
    if (tab === 'completed') return isHistoryStatus(m);
    return m.status === tab;
  }), [menus, tab]);

  const handleOpenReview = (menu) => {
    setComment('');
    setReviewTarget(menu);
  };

  const handleSubmitReview = async () => {
    if (!reviewTarget) return;
    setSubmitting(true);
    try {
      await headParentReviewMenu(reviewTarget._id, { comment });
      toast.success(
        comment
          ? 'Đã gửi ý kiến và chuyển thực đơn lên ban giám hiệu'
          : 'Đã chuyển thực đơn lên ban giám hiệu để duyệt',
      );
      setReviewTarget(null);
      fetchMenus();
    } catch {
      toast.error('Thao tác thất bại, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = menus.filter((m) => m.status === 'pending_headparent').length;

  return (
    <RoleLayout
      menuItems={menuItems}
      activeKey="menus"
      onMenuSelect={(key) => key === 'menus' && navigate('/head-parent/menus')}
      user={user}
      onLogout={logout}
      title="Hội trưởng phụ huynh"
      userRole="Hội trưởng PH"
    >
      <Box>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Thực đơn nhà trường</Typography>
            <Typography variant="body2" color="text.secondary">
              Xem xét thực đơn do bếp gửi trước khi chuyển lên ban giám hiệu
            </Typography>
          </Box>
          {pendingCount > 0 && (
            <Chip
              label={`${pendingCount} thực đơn chờ xem xét`}
              color="warning"
              icon={<PendingIcon />}
              sx={{ fontWeight: 700 }}
            />
          )}
        </Stack>

        {/* Tabs */}
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', mb: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 1 }}
          >
            {TABS.map((t) => (
              <Tab
                key={t.value}
                value={t.value}
                label={
                  t.value === 'pending_headparent' && pendingCount > 0
                    ? `${t.label} (${pendingCount})`
                    : t.label
                }
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
            ))}
          </Tabs>
        </Paper>

        {/* List */}
        <Stack gap={2}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
            : filtered.length === 0
              ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 6, borderRadius: 2, border: '1px dashed #d1d5db',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  }}
                >
                  <Avatar sx={{ width: 64, height: 64, bgcolor: '#f3f4f6' }}>
                    {tab === 'pending_headparent'
                      ? <PendingIcon sx={{ fontSize: 36, color: '#f59e0b' }} />
                      : tab === 'completed'
                        ? <HistoryIcon sx={{ fontSize: 36, color: '#9ca3af' }} />
                        : <MenuBookIcon sx={{ fontSize: 36, color: '#9ca3af' }} />
                    }
                  </Avatar>
                  <Typography variant="h6" fontWeight={700}>Không có thực đơn nào</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tab === 'pending_headparent'
                      ? 'Hiện chưa có thực đơn nào chờ bạn xem xét.'
                      : 'Không có thực đơn trong mục này.'}
                  </Typography>
                </Paper>
              )
              : filtered.map((menu) => {
                const cfg = STATUS_CONFIG[menu.status] || { label: menu.status, color: 'default' };
                const hasComment = menu.headParentReview?.comment;
                return (
                  <Paper
                    key={menu._id}
                    elevation={0}
                    sx={{ p: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}
                  >
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={2}>
                      <Box flex={1}>
                        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                          <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="subtitle1" fontWeight={700}>
                            {MONTH_NAMES[menu.month]} năm {menu.year}
                          </Typography>
                          <Chip
                            size="small"
                            label={cfg.label}
                            color={cfg.color}
                            sx={{ fontWeight: 600 }}
                          />
                        </Stack>

                        <Stack direction="row" alignItems="center" gap={0.5} mt={0.5}>
                          <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Tạo bởi: {menu.createdBy?.fullName || '—'}
                          </Typography>
                        </Stack>

                        {/* HeadParent comment đã gửi */}
                        {hasComment && (
                          <Box mt={1} px={1.5} py={0.75} sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200', borderRadius: 1 }}>
                            <Typography variant="caption" color="info.dark" fontWeight={600}>
                              Ý kiến của bạn:
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mt={0.25}>
                              {menu.headParentReview.comment}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Actions */}
                      <Stack direction="row" gap={1} flexShrink={0}>
                        <Tooltip title="Xem chi tiết thực đơn">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => navigate(`/head-parent/menus/${menu._id}`)}
                            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                          >
                            Xem
                          </Button>
                        </Tooltip>

                        {menu.status === 'pending_headparent' && (
                          <Tooltip title="Xem xét và chuyển lên ban giám hiệu">
                            <Button
                              variant="contained"
                              size="small"
                              color="warning"
                              startIcon={<ReviewIcon />}
                              onClick={() => handleOpenReview(menu)}
                              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                            >
                              Xem xét
                            </Button>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })
          }
        </Stack>
      </Box>

      {/* Dialog xem xét thực đơn */}
      <Dialog open={!!reviewTarget} onClose={() => setReviewTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReviewIcon color="warning" />
          Xem xét thực đơn
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {reviewTarget && (
            <Box>
              <Typography variant="body1" mb={2}>
                Thực đơn{' '}
                <strong>
                  {MONTH_NAMES[reviewTarget.month]} năm {reviewTarget.year}
                </strong>
              </Typography>

              <Typography variant="body2" color="text.secondary" mb={2}>
                Bạn có thể chuyển thực đơn lên ban giám hiệu ngay (không ý kiến) hoặc
                ghi thêm nhận xét để ban giám hiệu tham khảo khi duyệt.
              </Typography>

              <TextField
                label="Ý kiến của hội trưởng phụ huynh (không bắt buộc)"
                placeholder="Ví dụ: Thực đơn phù hợp, đề nghị bổ sung thêm rau xanh…"
                multiline
                rows={4}
                fullWidth
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                inputProps={{ maxLength: 500 }}
                helperText={`${comment.length}/500 ký tự — để trống nếu không có ý kiến`}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setReviewTarget(null)}
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<CheckCircleIcon />}
            onClick={handleSubmitReview}
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {comment.trim()
              ? 'Gửi ý kiến và chuyển lên BGH'
              : 'Chuyển lên ban giám hiệu'}
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}
