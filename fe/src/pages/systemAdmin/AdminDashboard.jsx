import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';
import HubIcon from '@mui/icons-material/Hub';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PieChartIcon from '@mui/icons-material/PieChart';
import SensorsIcon from '@mui/icons-material/Sensors';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Tooltip as ChartTooltip,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useSystemAdmin } from '../../context/SystemAdminContext';
import { useAppMenu } from '../../hooks/useAppMenu';

const PIE_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#84cc16'  // Lime
];

function SystemAdminDashboard() {
  const [data, setData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const { getDashboard, loading, error } = useSystemAdmin();

  // Live Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('SystemAdmin')) {
      navigate('/', { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        const response = await getDashboard();
        setData(response.data);
      } catch (err) {
        // Error handled in context
      }
    };

    fetchData();
  }, [navigate, user, getDashboard, isInitializing]);

  const userName = user?.fullName || user?.username || 'System Admin';

  const stats = data?.stats || {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalRoles: 0,
    totalPermissions: 0,
  };

  const statCards = [
    {
      label: 'Người dùng',
      value: stats.totalUsers,
      sub: `${stats.activeUsers} hoạt động, ${stats.inactiveUsers} tạm dừng`,
      icon: <PeopleIcon sx={{ fontSize: 24, color: 'white' }} />,
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      shadow: 'rgba(59, 130, 246, 0.4)', // Darker shadow
    },
    {
      label: 'Vai trò & Quyền',
      value: stats.totalRoles,
      sub: `${stats.totalPermissions} quyền hạn định nghĩa`,
      icon: <AdminPanelSettingsIcon sx={{ fontSize: 24, color: 'white' }} />,
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      shadow: 'rgba(139, 92, 246, 0.4)', // Darker shadow
    },
    {
      label: 'Quy trình BPM',
      value: stats.totalBPM,
      sub: 'Tiến trình đang vận hành',
      icon: <HubIcon sx={{ fontSize: 24, color: 'white' }} />,
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      shadow: 'rgba(236, 72, 153, 0.4)', // Darker shadow
    },
    {
      label: 'Nhật ký hôm nay',
      value: data?.recentLogs?.length || 0,
      sub: 'Ghi nhận trong hôm nay',
      icon: <HistoryIcon sx={{ fontSize: 24, color: 'white' }} />,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadow: 'rgba(16, 185, 129, 0.4)', // Darker shadow
    },
  ];

  const chartData = data?.activityTrend || [];

  const pieData = data?.roleCounts?.map(rc => ({
    name: rc.roleName,
    value: rc.count
  })) || [];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <Box sx={{
        width: '100%',
        px: { xs: 2, md: 4 },
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        minHeight: '100vh',
        bgcolor: '#f8fafc',
        backgroundImage: `
          radial-gradient(#e2e8f0 1.5px, transparent 1.5px),
          radial-gradient(#e2e8f0 1.5px, #f8fafc 1.5px)
        `,
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0, 20px 20px',
        overflow: 'hidden'
      }}>
        {/* Background Glows for Depth */}
        <Box sx={{ position: 'absolute', top: '5%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0) 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', top: '40%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, rgba(139,92,246,0) 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: '10%', left: '15%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, rgba(16,185,129,0) 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <Box sx={{ width: '100%', maxWidth: '1600px', position: 'relative', zIndex: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
              {error}
            </Alert>
          )}

          {/* 1. Live Banner - Premium Dashboard Feel */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 6,
              mb: 5,
              width: '100%',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              position: 'relative',
              p: { xs: 4, md: 6 },
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 30px 60px -12px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              alignItems: 'center',
              gap: 4
            }}
          >
            {/* Background Glows */}
            <Box sx={{ position: 'absolute', top: '-20%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0) 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

            <Box sx={{ flex: 1, position: 'relative', zIndex: 1, textAlign: { xs: 'center', lg: 'left' } }}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'center', lg: 'flex-start' }, alignItems: 'center', gap: 2, mb: 3 }}>
                <Chip
                  icon={(
                    <SensorsIcon sx={{
                      color: '#10b981 !important',
                      fontSize: '1.2rem',
                      animation: 'signal-pulse 1.5s infinite ease-in-out',
                      '@keyframes signal-pulse': {
                        '0%': { transform: 'scale(1)', opacity: 1 },
                        '50%': { transform: 'scale(1.3)', opacity: 0.5 },
                        '100%': { transform: 'scale(1)', opacity: 1 }
                      }
                    }} />
                  )}
                  label="Hệ thống: LIVE"
                  sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 800, borderRadius: 2, border: '1px solid rgba(16,185,129,0.2)' }}
                />
                <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: 3 }}>COMMAND CENTER</Typography>
              </Box>

              <Typography variant="h3" fontWeight={900} sx={{ color: 'white', mb: 2, letterSpacing: -1.5, fontSize: { xs: '2.2rem', md: '3.2rem' } }}>
                {getGreeting()}, <span style={{ color: '#818cf8' }}>{userName}</span>
              </Typography>

              <Typography variant="h6" sx={{ color: '#94a3b8', mb: 4, fontWeight: 400, opacity: 0.8, maxWidth: 700 }}>
                Giám sát toàn bộ tài nguyên hệ thống. Các chỉ số được cập nhật theo thời gian thực để đảm bảo hiệu năng tối ưu.
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: { xs: 'center', lg: 'flex-start' }, gap: 2 }}>
                <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => navigate('/system-admin/manage-accounts')} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, color: 'white', px: 4, py: 1.5, borderRadius: 3, fontWeight: 800, textTransform: 'none', boxShadow: '0 10px 20px rgba(59,130,246,0.3)' }}>Thêm người dùng</Button>
                <Button variant="outlined" startIcon={<VpnKeyIcon />} onClick={() => navigate('/system-admin/manage-permissions')} sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white', px: 4, py: 1.5, borderRadius: 3, fontWeight: 800, textTransform: 'none', backdropFilter: 'blur(5px)' }}>Phân quyền bảo mật</Button>
              </Box>
            </Box>

            {/* Live Metrics Column */}
            <Box sx={{
              width: { xs: '100%', lg: '350px' },
              bgcolor: 'rgba(0,0,0,0.2)',
              borderRadius: 5,
              p: 3,
              border: '1px solid rgba(255,255,255,0.05)',
              position: 'relative',
              zIndex: 1
            }}>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" sx={{ color: '#94a3b8', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon sx={{ fontSize: 18 }} /> GIỜ HỆ THỐNG
                </Typography>
                <Typography variant="h6" sx={{ color: '#818cf8', fontWeight: 900, fontFamily: 'monospace' }}>
                  {currentTime.toLocaleTimeString('vi-VN')}
                </Typography>
              </Box>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 3 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>CPU Load</Typography>
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 800 }}>{data?.systemMetrics?.cpuLoad || 0}%</Typography>
                </Box>
                <Box sx={{ height: 6, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <Box sx={{ width: `${data?.systemMetrics?.cpuLoad || 0}%`, height: '100%', bgcolor: '#3b82f6', transition: 'width 1s ease' }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>RAM Usage</Typography>
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 800 }}>
                    {data?.systemMetrics?.usedRam || 0}GB / {data?.systemMetrics?.totalRam || 0}GB
                  </Typography>
                </Box>
                <Box sx={{ height: 6, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <Box sx={{ width: `${data?.systemMetrics?.ramUsage || 0}%`, height: '100%', bgcolor: '#8b5cf6', transition: 'width 1s ease' }} />
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* 2. KPI Cards - Bold Shadows & Premium Feel */}
          <Box sx={{ width: '100%', mb: 6 }}>
            <Grid container spacing={5} justifyContent="center">
              {statCards.map((card) => (
                <Grid item xs={12} sm={6} md={3} key={card.label}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.8,
                      aspectRatio: '1 / 1',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                      borderRadius: 6,
                      bgcolor: '#ffffff',
                      border: '1px solid #f1f5f9',
                      position: 'relative',
                      // Increased shadow intensity and colors
                      boxShadow: `0 20px 40px -10px rgba(0,0,0,0.12), 0 15px 45px -12px ${card.shadow}`,
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      boxSizing: 'border-box',
                      '&:hover': {
                        transform: 'translateY(-15px)',
                        boxShadow: `0 35px 70px -15px ${card.shadow}`,
                      }
                    }}
                  >
                    <Box sx={{
                      mb: 1.8,
                      p: 2,
                      borderRadius: 3,
                      background: card.gradient,
                      display: 'flex',
                      boxShadow: `0 12px 24px -6px ${card.shadow}`,
                    }}>
                      {card.icon}
                    </Box>

                    <Box sx={{ width: '100%' }}>
                      <Typography variant="h2" fontWeight={900} sx={{ color: '#0f172a', letterSpacing: -2, mb: 0.8, fontSize: { xs: '2.8rem', md: '3.6rem' } }}>
                        {loading ? <Skeleton width={60} /> : card.value}
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 800, mb: 0.8, lineHeight: 1.2, fontSize: '1.2rem' }}>
                        {card.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, display: 'block', px: 1, lineHeight: 1.2, fontSize: '0.85rem' }}>
                        {card.sub}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* 3. Analytics Sections - Custom Media (9/3 on Large Screens, Stacked on others) */}
          <Grid container spacing={4} justifyContent="center" alignItems="stretch" sx={{ mb: 6 }}>
            {/* Left: Activity Trend (9/12) */}
            <Grid item xs={12} lg={9}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: '1px solid #e2e8f0', height: '100%', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#eff6ff', display: 'flex' }}><BarChartIcon sx={{ color: '#3b82f6', fontSize: 28 }} /></Box>
                    <Typography variant="h4" fontWeight={900} color="#0f172a">Xu hướng hoạt động</Typography>
                  </Box>
                  <Chip label="7 Ngày Gần Nhất" sx={{ fontWeight: 800, bgcolor: '#3b82f6', color: 'white', px: 2 }} />
                </Box>
                <Box sx={{ width: '100%', flex: 1, minHeight: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} />
                      <ChartTooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }} />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={6} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Right: Role Distribution (3/12) */}
            <Grid item xs={12} lg={3}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: '1px solid #e2e8f0', height: '100%', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f5f3ff', display: 'flex' }}><AdminPanelSettingsIcon sx={{ color: '#8b5cf6', fontSize: 28 }} /></Box>
                  <Typography variant="h4" fontWeight={900} color="#0f172a">Phân bổ vai trò</Typography>
                </Box>

                <Box sx={{ width: '100%', mb: 2, display: 'flex', justifyContent: 'center' }}>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={6}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                          itemStyle={{ fontWeight: 800 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', opacity: 0.5 }}>
                      <PieChartIcon sx={{ fontSize: 80, color: '#e2e8f0', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>Chưa có dữ liệu vai trò</Typography>
                    </Box>
                  )}
                </Box>

                {/* Vertical Detailed Description with Progress Bars and Scroll */}
                <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #f1f5f9' }}>
                  <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 900, mb: 2, display: 'block', letterSpacing: 1.5 }}>PHÂN BỔ CHI TIẾT</Typography>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    pr: 1,
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0', borderRadius: '4px' }
                  }}>
                    {pieData.length > 0 ? pieData.map((rc, idx) => (
                      <Box key={rc.name} sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                            <Typography variant="caption" fontWeight={800} color="#1e293b">{rc.name}</Typography>
                          </Box>
                          <Typography variant="caption" fontWeight={900} color={PIE_COLORS[idx % PIE_COLORS.length]}>{rc.value} ({stats.totalUsers > 0 ? Math.round((rc.value / stats.totalUsers) * 100) : 0}%)</Typography>
                        </Box>
                        <Box sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                          <Box
                            sx={{
                              width: `${stats.totalUsers > 0 ? (rc.value / stats.totalUsers) * 100 : 0}%`,
                              height: '100%',
                              bgcolor: PIE_COLORS[idx % PIE_COLORS.length],
                              borderRadius: 3,
                              transition: 'width 1s ease-in-out'
                            }}
                          />
                        </Box>
                      </Box>
                    )) : (
                      ['Admin', 'Staff', 'Teacher', 'Parent'].map((name, i) => (
                        <Box key={i} sx={{ mb: 2, opacity: 0.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption" fontWeight={800} color="#94a3b8">{name}</Typography>
                            <Typography variant="caption" fontWeight={900} color="#94a3b8">0</Typography>
                          </Box>
                          <Box sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9' }} />
                        </Box>
                      ))
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* 4. Activity Logs & Latest Members - Side by Side (8/4 SPLIT) */}
          <Grid container spacing={4} sx={{ mb: 6 }}>
            {/* Left: Detailed Logs (8/12) */}
            <Grid item xs={12} md={8}>
              <Paper elevation={0} sx={{ borderRadius: 5, border: '1px solid #e2e8f0', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#0f172a', display: 'flex' }}><HistoryIcon sx={{ color: '#fff', fontSize: 28 }} /></Box>
                    <Typography variant="h4" fontWeight={900} color="#0f172a">Nhật ký chi tiết</Typography>
                  </Box>
                  <Button variant="contained" onClick={() => navigate('/system-admin/system-logs')} sx={{ borderRadius: 3, fontWeight: 800, px: 3, py: 1, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' }, textTransform: 'none' }}>Tất cả</Button>
                </Box>
                <Box sx={{ p: 0, flex: 1, maxHeight: '600px', overflowY: 'auto' }}>
                  {data?.recentLogs?.length > 0 ? data.recentLogs.map((log, idx) => (
                    <Box key={log._id} sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 3, borderBottom: idx === data.recentLogs.length - 1 ? 'none' : '1px solid #f1f5f9', '&:hover': { bgcolor: '#f8fafc' }, transition: 'all 0.2s' }}>
                      <Avatar src={log.actorId?.avatar} sx={{ width: 55, height: 55, border: '4px solid #fff', boxShadow: '0 8px 15px rgba(0,0,0,0.1)' }}>{log.actorId?.username?.[0]?.toUpperCase()}</Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                          <Typography variant="body1" fontWeight={900} color="#0f172a">{log.actorId?.fullName || log.actorId?.username}</Typography>
                          <Chip label={log.action} size="small" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#0f172a', borderRadius: 2, fontSize: '0.7rem' }} />
                        </Box>
                        <Typography variant="body2" color="#64748b" sx={{ fontWeight: 400, lineHeight: 1.4 }}>{log.detail}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right', minWidth: 100 }}>
                        <Typography variant="body1" fontWeight={900} color="#3b82f6">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>{new Date(log.createdAt).toLocaleDateString('vi-VN')}</Typography>
                      </Box>
                    </Box>
                  )) : (
                    <Box sx={{ p: 10, textAlign: 'center', opacity: 0.5 }}>
                      <HistoryIcon sx={{ fontSize: 60, mb: 2, color: '#cbd5e1' }} />
                      <Typography variant="body2" fontWeight={600}>Chưa có hoạt động nào</Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Right: Latest Members (4/12) */}
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f0fdf4', display: 'flex' }}><PersonAddIcon sx={{ color: '#10b981', fontSize: 28 }} /></Box>
                    <Typography variant="h4" fontWeight={900} color="#0f172a">Thành viên mới</Typography>
                  </Box>
                  <Chip label={`${data?.latestUsers?.length || 0} mới`} size="small" sx={{ bgcolor: '#10b981', color: '#fff', fontWeight: 900 }} />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                  {data?.latestUsers?.length > 0 ? data.latestUsers.map((u) => (
                    <Box key={u._id} sx={{ p: 2.5, borderRadius: 4, bgcolor: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 3, transition: 'all 0.3s', '&:hover': { transform: 'translateX(5px)', bgcolor: '#fff', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' } }}>
                      <Avatar src={u.avatar} sx={{ width: 60, height: 60, border: '4px solid #fff', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" fontWeight={900} color="#0f172a" noWrap>{u.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 1 }}>{u.username}</Typography>
                        <Typography variant="caption" color="#94a3b8" fontWeight={700}>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</Typography>
                      </Box>
                      <Button variant="contained" size="small" onClick={() => navigate('/system-admin/manage-accounts')} sx={{ borderRadius: 2.5, textTransform: 'none', minWidth: 70, fontWeight: 800, bgcolor: '#0f172a', fontSize: '0.75rem' }}>Hồ sơ</Button>
                    </Box>
                  )) : (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: 0.3 }}>
                      <PeopleIcon sx={{ fontSize: 80, mb: 2 }} />
                      <Typography variant="body2" fontWeight={700}>Chưa có thành viên mới</Typography>
                    </Box>
                  )}
                </Box>

                <Button fullWidth variant="outlined" onClick={() => navigate('/system-admin/manage-accounts')} sx={{ mt: 4, borderRadius: 3, fontWeight: 800, color: '#0f172a', borderColor: '#e2e8f0', textTransform: 'none', py: 1.5, '&:hover': { bgcolor: '#f8fafc', borderColor: '#0f172a' } }}>Quản lý tất cả tài khoản</Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>

  );
}

export default SystemAdminDashboard;
