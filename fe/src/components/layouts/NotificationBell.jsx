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
} from '@mui/icons-material';
import { get, put, ENDPOINTS } from '../../service/api';
import { useAuth } from '../../context/AuthContext';

const POLL_INTERVAL = 30_000; // 30 giây

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

export default function NotificationBell() {
  const { hasRole, user } = useAuth();
  const isAdmin = hasRole('SchoolAdmin') || hasRole('SystemAdmin');

  const [anchor, setAnchor]           = useState(null);
  const [notifications, setNotifs]    = useState([]);
  const [unread, setUnread]           = useState(0);
  const [loading, setLoading]         = useState(false);
  const [markingAll, setMarkingAll]   = useState(false);
  const timerRef = useRef(null);

  const unreadCountUrl  = isAdmin ? ENDPOINTS.NOTIFICATIONS.ADMIN_UNREAD_COUNT  : ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT;
  const listUrl         = isAdmin ? ENDPOINTS.NOTIFICATIONS.ADMIN_LIST          : ENDPOINTS.NOTIFICATIONS.LIST;
  const markAllUrl      = isAdmin ? ENDPOINTS.NOTIFICATIONS.ADMIN_MARK_ALL_READ : ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ;

  // Poll unread count
  const fetchUnread = useCallback(async () => {
    try {
      const res = await get(unreadCountUrl);
      setUnread(res.count ?? 0);
    } catch (_) {}
  }, [unreadCountUrl]);

  useEffect(() => {
    fetchUnread();
    timerRef.current = setInterval(fetchUnread, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [fetchUnread]);

  // Fetch list when opening
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`${listUrl}?limit=20&page=1`);
      setNotifs(res.data || []);
      setUnread(res.unreadCount ?? 0);
    } catch (_) {
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  }, [listUrl]);

  const handleOpen = (e) => {
    setAnchor(e.currentTarget);
    fetchList();
  };

  const handleClose = () => setAnchor(null);

  // Mark single as read
  const handleMarkRead = async (id) => {
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, isReadByMe: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
    try { await put(ENDPOINTS.NOTIFICATIONS.MARK_READ(id), {}); } catch (_) {}
  };

  // Mark all as read
  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await put(markAllUrl, {});
      setNotifs(prev => prev.map(n => ({ ...n, isReadByMe: true })));
      setUnread(0);
    } catch (_) {}
    finally { setMarkingAll(false); }
  };

  const open = Boolean(anchor);

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
            display: { xs: 'none', md: 'flex' },
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
              mt: 1, width: 380, maxHeight: 520,
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
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
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

        {/* List */}
        <Box sx={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" py={5}>
              <CircularProgress size={28} sx={{ color: '#2563eb' }} />
            </Stack>
          ) : notifications.length === 0 ? (
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
                      : n.type === 'timetable_realtime' ? '#fefce8'
                      : n.type === 'timetable_daily'    ? '#f0fdf4'
                      : '#eff6ff',
                    cursor: n.isReadByMe ? 'default' : 'pointer',
                    '&:hover': { bgcolor: 'grey.50' },
                    transition: 'background 0.15s',
                    display: 'flex', gap: 1.5, alignItems: 'flex-start',
                  }}
                >
                  {/* Icon theo loại thông báo */}
                  <Box sx={{ pt: 0.5, flexShrink: 0 }}>
                    {n.type === 'timetable_realtime' ? (
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#fef9c3' }}>
                        <span style={{ fontSize: 16 }}>⏰</span>
                      </Avatar>
                    ) : n.type === 'timetable_daily' ? (
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#dcfce7' }}>
                        <span style={{ fontSize: 16 }}>📅</span>
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
                      <Typography
                        variant="body2"
                        fontWeight={n.isReadByMe ? 400 : 700}
                        sx={{ lineHeight: 1.4 }}
                      >
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
        </Box>
      </Popover>
    </>
  );
}
