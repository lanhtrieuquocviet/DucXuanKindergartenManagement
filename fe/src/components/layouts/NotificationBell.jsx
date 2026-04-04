import { useState, useEffect, useRef, useCallback } from 'react';
import {
  IconButton, Badge, Popover, Box, Typography, Stack,
  Chip, Divider, Button, CircularProgress, Tooltip, Avatar,
} from '@mui/material';
import {
  Notifications as NotifIcon,
  NotificationsNone as NotifEmptyIcon,
  DoneAll as DoneAllIcon,
  Circle as DotIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { get, put, ENDPOINTS } from '../../service/api';
import { useAuth } from '../../context/AuthContext';

const POLL_INTERVAL = 30_000;

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7)   return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  return month >= 4 && month <= 9 ? 'summer' : 'winter';
}

function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getTimetableStatus(item, nowMinutes) {
  if (nowMinutes >= item.startMinutes && nowMinutes < item.endMinutes) return 'active';
  if (item.startMinutes > nowMinutes && item.startMinutes - nowMinutes <= 60) return 'soon';
  if (item.endMinutes <= nowMinutes) return 'done';
  return 'upcoming';
}

export default function NotificationBell() {
  const { hasRole } = useAuth();
  // Hiện lịch hôm nay cho admin/giáo viên (các role quản lý trường)
  const showTimetable = hasRole('SchoolAdmin') || hasRole('SystemAdmin') || hasRole('Teacher');

  const [anchor, setAnchor]            = useState(null);
  const [notifications, setNotifs]     = useState([]);
  const [timetableItems, setTimetable] = useState([]);
  const [unread, setUnread]            = useState(0);
  const [loading, setLoading]          = useState(false);
  const [markingAll, setMarkingAll]    = useState(false);
  const [nowMinutes, setNowMinutes]    = useState(getCurrentMinutes);
  const timerRef  = useRef(null);
  const clockRef  = useRef(null);

  // Poll unread count
  const fetchUnread = useCallback(async () => {
    try {
      const res = await get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      setUnread(res.count ?? 0);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchUnread();
    timerRef.current = setInterval(fetchUnread, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [fetchUnread]);

  // Cập nhật giờ hiện tại mỗi 30 giây
  useEffect(() => {
    clockRef.current = setInterval(() => setNowMinutes(getCurrentMinutes()), 30_000);
    return () => clearInterval(clockRef.current);
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const tasks = [get(`${ENDPOINTS.NOTIFICATIONS.LIST}?limit=20&page=1`)];
      if (showTimetable) tasks.push(get('/timetable'));

      const [notifRes, timetableRes] = await Promise.allSettled(tasks);

      if (notifRes.status === 'fulfilled') {
        setNotifs(notifRes.value.data || []);
        setUnread(notifRes.value.unreadCount ?? 0);
      } else {
        setNotifs([]);
      }

      if (timetableRes?.status === 'fulfilled' && timetableRes.value) {
        const season = getCurrentSeason();
        setTimetable(
          (timetableRes.value.data || []).filter(
            i => i.appliesToSeason === season || i.appliesToSeason === 'both'
          )
        );
      }
    } finally {
      setLoading(false);
    }
  }, [showTimetable]);

  const handleOpen = (e) => {
    setAnchor(e.currentTarget);
    setNowMinutes(getCurrentMinutes());
    fetchList();
  };

  const handleClose = () => setAnchor(null);

  const handleMarkRead = async (id) => {
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, isReadByMe: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
    try { await put(ENDPOINTS.NOTIFICATIONS.MARK_READ(id), {}); } catch (_) {}
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await put(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {});
      setNotifs(prev => prev.map(n => ({ ...n, isReadByMe: true })));
      setUnread(0);
    } catch (_) {}
    finally { setMarkingAll(false); }
  };

  const open = Boolean(anchor);

  const TimetableSection = () => {
    if (!showTimetable || timetableItems.length === 0) return null;
    return (
      <>
        <Box sx={{ px: 2.5, pt: 1.5, pb: 0.5 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <ScheduleIcon sx={{ fontSize: 13, color: '#0891b2' }} />
            <Typography variant="caption" fontWeight={700} color="#0891b2" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lịch hoạt động hôm nay
            </Typography>
          </Stack>
        </Box>
        {timetableItems.map((item, idx) => {
          const status   = getTimetableStatus(item, nowMinutes);
          const isActive = status === 'active';
          const isSoon   = status === 'soon';
          const isDone   = status === 'done';
          return (
            <Box key={item._id}>
              <Box sx={{
                px: 2.5, py: 1.25,
                bgcolor: isActive ? '#ecfdf5' : isSoon ? '#fffbeb' : 'transparent',
                display: 'flex', gap: 1.5, alignItems: 'center',
                opacity: isDone ? 0.5 : 1,
              }}>
                <Avatar sx={{ width: 28, height: 28, flexShrink: 0, bgcolor: isActive ? '#bbf7d0' : isSoon ? '#fde68a' : 'grey.100' }}>
                  <span style={{ fontSize: 13 }}>
                    {isActive ? '▶' : isSoon ? '⏳' : isDone ? '✓' : '○'}
                  </span>
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                    <Typography variant="caption" fontWeight={700} color="text.primary" noWrap>
                      {item.startLabel} – {item.endLabel}
                    </Typography>
                    {isActive && (
                      <Chip label="Đang diễn ra" size="small" sx={{ height: 16, fontSize: '0.65rem', bgcolor: '#16a34a', color: 'white', fontWeight: 700 }} />
                    )}
                    {isSoon && (
                      <Chip label="Sắp đến" size="small" sx={{ height: 16, fontSize: '0.65rem', bgcolor: '#d97706', color: 'white', fontWeight: 700 }} />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                    {item.content || '(không có nội dung)'}
                  </Typography>
                </Box>
              </Box>
              {idx < timetableItems.length - 1 && <Divider sx={{ ml: 2.5 }} />}
            </Box>
          );
        })}
        <Divider sx={{ mt: 1, borderStyle: 'dashed' }} />
        {notifications.length > 0 && (
          <Box sx={{ px: 2.5, pt: 1.25, pb: 0.5 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Thông báo
            </Typography>
          </Box>
        )}
      </>
    );
  };

  return (
    <>
      <Tooltip title="Thông báo" arrow>
        <IconButton
          size="small"
          onClick={handleOpen}
          sx={{
            width: 36, height: 36,
            border: '1px solid', borderColor: unread > 0 ? 'warning.light' : 'divider',
            bgcolor: unread > 0 ? '#fffbeb' : 'background.paper',
            color: unread > 0 ? '#d97706' : 'text.secondary',
            '&:hover': { bgcolor: unread > 0 ? '#fef3c7' : 'grey.50' },
            transition: 'all 0.15s',
          }}
        >
          <Badge
            badgeContent={unread > 9 ? '9+' : unread}
            color="error"
            sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 16, height: 16, px: 0.5 } }}
          >
            <NotifIcon sx={{ fontSize: 18 }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1, width: 380, maxHeight: 560,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
              border: '1px solid', borderColor: 'divider',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            },
          },
        }}
      >
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between"
          sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" fontWeight={700}>Thông báo</Typography>
            {unread > 0 && (
              <Chip label={unread} size="small" color="error" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
            )}
          </Stack>
          {unread > 0 && (
            <Button
              size="small"
              startIcon={markingAll ? <CircularProgress size={12} /> : <DoneAllIcon sx={{ fontSize: 14 }} />}
              onClick={handleMarkAll}
              disabled={markingAll}
              sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, py: 0.5 }}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </Stack>

        {/* Body */}
        <Box sx={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" py={5}>
              <CircularProgress size={28} sx={{ color: '#2563eb' }} />
            </Stack>
          ) : (
            <>
              <TimetableSection />

              {notifications.length === 0 && timetableItems.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" py={6} spacing={1}>
                  <NotifEmptyIcon sx={{ fontSize: 44, color: 'grey.300' }} />
                  <Typography variant="body2" color="text.secondary">Chưa có thông báo nào</Typography>
                </Stack>
              ) : (
                notifications.map((n, idx) => (
                  <Box key={n._id}>
                    <Box
                      onClick={() => !n.isReadByMe && handleMarkRead(n._id)}
                      sx={{
                        px: 2.5, py: 1.75,
                        bgcolor: n.isReadByMe ? 'transparent'
                          : n.type === 'timetable_realtime'  ? '#fefce8'
                          : n.type === 'timetable_daily'     ? '#f0fdf4'
                          : n.type === 'attendance_checkin'  ? '#eff6ff'
                          : n.type === 'attendance_checkout' ? '#fdf2f8'
                          : n.type === 'attendance_absent'   ? '#fef2f2'
                          : n.type === 'meal_issue'          ? '#fffbeb'
                          : '#eff6ff',
                        cursor: n.isReadByMe ? 'default' : 'pointer',
                        '&:hover': { bgcolor: 'grey.50' },
                        transition: 'background 0.15s',
                        display: 'flex', gap: 1.5, alignItems: 'flex-start',
                      }}
                    >
                      <Box sx={{ pt: 0.5, flexShrink: 0 }}>
                        {n.type === 'timetable_realtime' ? (
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#fef9c3' }}>
                            <span style={{ fontSize: 16 }}>⏰</span>
                          </Avatar>
                        ) : n.type === 'timetable_daily' ? (
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#dcfce7' }}>
                            <span style={{ fontSize: 16 }}>📅</span>
                          </Avatar>
                        ) : n.type === 'attendance_checkin' ? (
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#dbeafe' }}>
                            <span style={{ fontSize: 16 }}>🏫</span>
                          </Avatar>
                        ) : n.type === 'attendance_checkout' ? (
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#fce7f3' }}>
                            <span style={{ fontSize: 16 }}>🏠</span>
                          </Avatar>
                        ) : n.type === 'attendance_absent' ? (
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#fee2e2' }}>
                            <span style={{ fontSize: 16 }}>❌</span>
                          </Avatar>
                        ) : n.type === 'meal_issue' ? (
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#fef3c7' }}>
                            <span style={{ fontSize: 16 }}>🍽️</span>
                          </Avatar>
                        ) : n.isReadByMe ? (
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.100' }}>
                            <NotifEmptyIcon sx={{ fontSize: 16, color: 'grey.400' }} />
                          </Avatar>
                        ) : (
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#dbeafe' }}>
                            <NotifIcon sx={{ fontSize: 16, color: '#2563eb' }} />
                          </Avatar>
                        )}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                          <Typography variant="body2" fontWeight={n.isReadByMe ? 400 : 700} sx={{ lineHeight: 1.4 }}>
                            {n.title}
                          </Typography>
                          {!n.isReadByMe && (
                            <DotIcon sx={{ fontSize: 10, color: '#2563eb', flexShrink: 0, mt: 0.5 }} />
                          )}
                        </Stack>
                        {n.body && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.4 }}>
                            {n.body}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                          {timeAgo(n.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                    {idx < notifications.length - 1 && <Divider />}
                  </Box>
                ))
              )}
            </>
          )}
        </Box>
      </Popover>
    </>
  );
}
