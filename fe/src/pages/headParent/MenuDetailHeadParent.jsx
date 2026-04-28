import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMenuDetail, headParentReviewMenu } from '../../service/menu.api';
import { MENU_REJECT_PRESETS, labelForRejectPreset } from '../../constants/menuRejectPresets';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

import {
  Box, Button, Card, CardContent, Chip, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography, alpha, Divider, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, FormGroup, FormControlLabel, Checkbox,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  MenuBook as MenuBookIcon,
  RateReview as ReviewIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const STATUS_CHIP = {
  draft:              { label: 'Nháp',                       color: 'default'   },
  pending_headparent: { label: 'Chờ hội trưởng PH xem xét', color: 'warning'   },
  pending:            { label: 'Chờ BGH duyệt',             color: 'info'      },
  approved:           { label: 'Đã duyệt',                   color: 'success'   },
  active:             { label: 'Đang áp dụng',               color: 'primary'   },
  completed:          { label: 'Đã kết thúc',                color: 'secondary' },
  rejected:           { label: 'Bị từ chối',                 color: 'error'     },
};

const HISTORY_LABELS = {
  submitted:            'Gửi duyệt (bếp gửi)',
  headparent_reviewed:  'Hội trưởng PH xem xét',
  headparent_rejected_approved: 'Hội trưởng PH từ chối (menu đã duyệt)',
  approved:             'Ban giám hiệu duyệt',
  rejected_pending:     'Ban giám hiệu từ chối',
  request_edit_active:  'Yêu cầu chỉnh sửa',
  applied:              'Áp dụng thực đơn',
  ended:                'Kết thúc áp dụng',
};

const MONTH_NAMES = [
  '', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
const dayMap = { mon: 'Thứ Hai', tue: 'Thứ Ba', wed: 'Thứ Tư', thu: 'Thứ Năm', fri: 'Thứ Sáu' };
const mealTypes = [
  { key: 'lunchFoods',     label: 'Bữa trưa'  },
  { key: 'afternoonFoods', label: 'Bữa chiều' },
];

function WeekTable({ title, weekData }) {
  return (
    <Box mb={4}>
      <Typography variant="subtitle1" fontWeight={700} mb={2}>{title}</Typography>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 560 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, width: 110, borderRight: '1px solid', borderColor: 'divider', py: 1.5 }}>
                  Bữa ăn
                </TableCell>
                {days.map((d) => (
                  <TableCell key={d} align="center" sx={{ fontWeight: 700, fontSize: 12, py: 1.5 }}>
                    {dayMap[d]}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {mealTypes.map((meal) => (
                <TableRow key={meal.key}>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12, bgcolor: 'grey.50', borderRight: '1px solid', borderColor: 'divider', py: 1.5 }}>
                    {meal.label}
                  </TableCell>
                  {days.map((d) => {
                    const foods = weekData?.[d]?.[meal.key] || [];
                    return (
                      <TableCell key={d} sx={{ verticalAlign: 'top', p: 1.25, minWidth: 110 }}>
                        {foods.length === 0
                          ? <Typography variant="caption" color="text.disabled">Không có món</Typography>
                          : foods.map((f) => (
                            <Box key={f._id} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: alpha('#4f46e5', 0.07), border: '1px solid', borderColor: alpha('#4f46e5', 0.15), borderRadius: 1.5, px: 1, py: 0.25, mb: 0.5, mr: 0.5 }}>
                              <Typography variant="caption" fontWeight={600} color="primary.main" sx={{ fontSize: 11 }}>{f.name}</Typography>
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>{f.calories} kcal</Typography>
                            </Box>
                          ))
                        }
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}

export default function MenuDetailHeadParent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [menu, setMenu]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState('forward');
  const [comment, setComment]     = useState('');
  const [rejectDetail, setRejectDetail] = useState('');
  const [rejectPresetSel, setRejectPresetSel] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const menuItems = [
    { key: 'menus', label: 'Thực đơn', icon: <MenuBookIcon /> },
  ];

  useEffect(() => {
    (async () => {
      try {
        const res = await getMenuDetail(id);
        setMenu(res?.data || res);
      } catch {
        toast.error('Không thể tải chi tiết thực đơn');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleReview = async () => {
    if (reviewMode === 'reject') {
      const presets = MENU_REJECT_PRESETS.filter((p) => rejectPresetSel[p.id]).map((p) => p.id);
      const detail = rejectDetail.trim();
      if (presets.length === 0 && detail.length < 5) {
        toast.error('Chọn ít nhất một lý do gợi ý hoặc nhập chi tiết tối thiểu 5 ký tự');
        return;
      }
      setSubmitting(true);
      try {
        await headParentReviewMenu(id, { presets, detail });
        toast.success('Đã từ chối thực đơn và gửi lại cho bếp chỉnh sửa');
        setReviewOpen(false);
        const res = await getMenuDetail(id);
        setMenu(res?.data || res);
      } catch {
        toast.error('Thao tác thất bại');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      await headParentReviewMenu(id, { comment });
      toast.success(comment ? 'Đã gửi ý kiến và chuyển lên BGH' : 'Đã chuyển lên ban giám hiệu');
      setReviewOpen(false);
      const res = await getMenuDetail(id);
      setMenu(res?.data || res);
    } catch {
      toast.error('Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const statusCfg = STATUS_CHIP[menu?.status] || { label: menu?.status, color: 'default' };
  const week1 = menu?.dailyMenus?.reduce((acc, dm) => { if (dm.week === 1) acc[dm.dayOfWeek] = dm; return acc; }, {});
  const week2 = menu?.dailyMenus?.reduce((acc, dm) => { if (dm.week === 2) acc[dm.dayOfWeek] = dm; return acc; }, {});

  return (
    <>
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/head-parent/menus')}
          sx={{ mb: 3, textTransform: 'none', fontWeight: 600 }}
        >
          Quay lại
        </Button>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : !menu ? (
          <Typography>Không tìm thấy thực đơn.</Typography>
        ) : (
          <>
            {/* Header */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      Thực đơn {MONTH_NAMES[menu.month]} năm {menu.year}
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={0.5} mt={0.5}>
                      <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Tạo bởi: {menu.createdBy?.fullName || '—'}
                      </Typography>
                    </Stack>
                  </Box>
                  <Stack direction="row" gap={1} alignItems="center">
                    <Chip label={statusCfg.label} color={statusCfg.color} sx={{ fontWeight: 700 }} />
                    {menu.status === 'pending_headparent' && (
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={<ReviewIcon />}
                        onClick={() => {
                          setComment('');
                          setRejectDetail('');
                          setRejectPresetSel({});
                          setReviewMode('forward');
                          setReviewOpen(true);
                        }}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Xem xét & Chuyển lên BGH
                      </Button>
                    )}
                    {menu.status === 'approved' && (
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => {
                          setComment('');
                          setRejectDetail('');
                          setRejectPresetSel({});
                          setReviewMode('reject');
                          setReviewOpen(true);
                        }}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Từ chối thực đơn
                      </Button>
                    )}
                  </Stack>
                </Stack>

                {/* HeadParent review comment */}
                {menu.headParentReview?.comment && (
                  <Box mt={2} px={2} py={1.5} sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200', borderRadius: 2 }}>
                    <Typography variant="caption" color="info.dark" fontWeight={700}>
                      Ý kiến hội trưởng phụ huynh:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      {menu.headParentReview.comment}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Menu tables */}
            <WeekTable title="Tuần lẻ" weekData={week1} />
            <WeekTable title="Tuần chẵn" weekData={week2} />

            {/* Status history */}
            {Array.isArray(menu.statusHistory) && menu.statusHistory.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Lịch sử thao tác</Typography>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                  {menu.statusHistory.map((h, i) => (
                    <Box key={i}>
                      {i > 0 && <Divider />}
                      <Box px={2.5} py={1.5}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="body2" fontWeight={600}>
                            {HISTORY_LABELS[h.type] || h.type}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {h.at ? new Date(h.at).toLocaleString('vi-VN') : ''}
                          </Typography>
                        </Stack>
                        {Array.isArray(h.presets) && h.presets.length > 0 && (
                          <Typography variant="caption" color="text.secondary" mt={0.25} display="block">
                            {(h.presets || []).map((pid) => `• ${labelForRejectPreset(pid)}`).join(' ')}
                          </Typography>
                        )}
                        {h.detail && (
                          <Typography variant="caption" color="text.secondary" mt={0.25} display="block">
                            {h.detail}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Card>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Dialog xem xét */}
      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReviewIcon color="warning" /> Xem xét thực đơn
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {reviewMode === 'reject'
              ? 'Nhập lý do từ chối để trả thực đơn đã duyệt về bếp chỉnh sửa và gửi duyệt lại.'
              : 'Bạn có thể chuyển thực đơn lên ban giám hiệu ngay (không ý kiến) hoặc ghi nhận xét để BGH tham khảo khi duyệt.'}
          </Typography>
          {reviewMode === 'reject' ? (
            <>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Gợi ý lý do (chọn một hoặc nhiều)
              </Typography>
              <FormGroup sx={{ mb: 2 }}>
                {MENU_REJECT_PRESETS.map((p) => (
                  <FormControlLabel
                    key={p.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={!!rejectPresetSel[p.id]}
                        onChange={() =>
                          setRejectPresetSel((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                        }
                      />
                    }
                    label={<Typography variant="body2">{p.label}</Typography>}
                  />
                ))}
              </FormGroup>
              <TextField
                label="Chi tiết lý do từ chối"
                placeholder="Mô tả cụ thể để bếp chỉnh sửa (bắt buộc nếu không chọn gợi ý nào, tối thiểu 5 ký tự)..."
                multiline
                rows={4}
                fullWidth
                value={rejectDetail}
                onChange={(e) => setRejectDetail(e.target.value)}
                inputProps={{ maxLength: 500 }}
                helperText={`${rejectDetail.length}/500 ký tự`}
              />
            </>
          ) : (
            <TextField
              label="Ý kiến của hội trưởng phụ huynh (không bắt buộc)"
              placeholder="Ví dụ: Thực đơn phù hợp, đề nghị bổ sung thêm rau xanh…"
              multiline
              rows={4}
              fullWidth
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              inputProps={{ maxLength: 500 }}
              helperText={`${comment.length}/500 ký tự`}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setReviewOpen(false)} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 600 }}>Hủy</Button>
          <Button
            variant="contained"
            color={reviewMode === 'reject' ? 'error' : 'warning'}
            startIcon={reviewMode === 'reject' ? <CancelIcon /> : <CheckCircleIcon />}
            onClick={handleReview} disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {reviewMode === 'reject'
              ? 'Xác nhận từ chối'
              : comment.trim()
                ? 'Gửi ý kiến và chuyển lên BGH'
                : 'Chuyển lên ban giám hiệu'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
