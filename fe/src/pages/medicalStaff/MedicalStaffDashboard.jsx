import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';
import {
  Box, Paper, Typography, Button, Stack, CircularProgress, Alert,
  Grid, Chip, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  MedicalServices as MedicalIcon,
  Warning as WarningIcon,
  HealthAndSafety as SafetyIcon,
  MonitorHeart as HealthIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';

const STATUS_CONFIG = {
  healthy:    { label: 'Bình thường', color: 'success' },
  monitor:    { label: 'Theo dõi',    color: 'warning' },
  concerning: { label: 'Đáng lo ngại', color: 'error'  },
};


function toDateStr(d) {
  return (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10);
}

export default function MedicalStaffDashboard() {
  const navigate = useNavigate();
  const { user, hasRole, hasPermission, logout, isInitializing } = useAuth();

  const [rows, setRows] = useState([]);
  const [academicYear, setAcademicYear] = useState('');
  const [incidentsToday, setIncidentsToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const allowed = hasRole('MedicalStaff') || hasRole('SchoolAdmin') || hasRole('SystemAdmin') || hasPermission('MANAGE_HEALTH');
    if (!allowed) { navigate('/', { replace: true }); return; }
    fetchData();
  }, [isInitializing, user]); // eslint-disable-line

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const today = toDateStr(new Date());
    try {
      const [healthRes, classRes, incRes] = await Promise.all([
        get(ENDPOINTS.STUDENTS.HEALTH_OVERVIEW),
        get(ENDPOINTS.STUDENTS.HEALTH_CLASSES),
        get(`${ENDPOINTS.STUDENTS.HEALTH_INCIDENTS}?date=${today}`),
      ]);
      setRows(healthRes.data || []);
      if (classRes.academicYear) setAcademicYear(classRes.academicYear);
      setIncidentsToday(incRes.data || []);
    } catch (err) {
      setError(err.message || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const healthStats = useMemo(() => {
    const withHealth = rows.filter(r => r.healthId);
    return {
      total:      rows.length,
      withHealth: withHealth.length,
      healthy:    rows.filter(r => r.generalStatus === 'healthy').length,
      monitor:    rows.filter(r => r.generalStatus === 'monitor').length,
      concerning: rows.filter(r => r.generalStatus === 'concerning').length,
    };
  }, [rows]);

  const incidentStats = useMemo(() => ({
    total:      incidentsToday.length,
    severe:     incidentsToday.filter(i => i.severity === 'severe').length,
    monitoring: incidentsToday.filter(i => i.status === 'monitoring').length,
  }), [incidentsToday]);

  const attentionRows = useMemo(() => (
    rows
      .filter(r => r.generalStatus === 'monitor' || r.generalStatus === 'concerning')
      .slice(0, 8)
  ), [rows]);


  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
        <Paper elevation={0} sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #6366f1 0%, #0891b2 100%)', borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <DashboardIcon sx={{ color: 'white', fontSize: 32 }} />
            <Box>
              <Typography variant="h6" fontWeight={700} color="white">Tổng quan sức khỏe</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                {academicYear ? `Năm học: ${academicYear}` : 'Theo dõi nhanh tình hình học sinh và sự cố trong ngày'}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, letterSpacing: 0.5 }}>
              Sức khỏe học sinh
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={3}>
              {[
                { label: 'Tổng học sinh', val: healthStats.total,      color: '#6366f1', bg: '#eef2ff' },
                { label: 'Có hồ sơ SK',  val: healthStats.withHealth, color: '#0891b2', bg: '#e0f2fe' },
                { label: 'Bình thường',  val: healthStats.healthy,    color: '#16a34a', bg: '#dcfce7' },
                { label: 'Theo dõi',     val: healthStats.monitor,    color: '#d97706', bg: '#fef3c7' },
                { label: 'Đáng lo ngại', val: healthStats.concerning, color: '#dc2626', bg: '#fee2e2' },
              ].map(s => (
                <Paper key={s.label} elevation={0} sx={{ flex: 1, px: 2, py: 1.5, borderRadius: 2, bgcolor: s.bg, border: `1px solid ${s.bg}` }}>
                  <Typography variant="h5" fontWeight={800} color={s.color}>{s.val}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                </Paper>
              ))}
            </Stack>

            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <WarningIcon sx={{ color: '#dc2626' }} />
                    <Typography variant="subtitle1" fontWeight={700}>Bất thường hôm nay</Typography>
                  </Stack>
                  <Stack direction="row" spacing={2} mb={2}>
                    <Box>
                      <Typography variant="h4" fontWeight={800} color="primary">{incidentStats.total}</Typography>
                      <Typography variant="caption" color="text.secondary">Tổng ghi nhận</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight={800} sx={{ color: '#d97706' }}>{incidentStats.monitoring}</Typography>
                      <Typography variant="caption" color="text.secondary">Đang theo dõi</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight={800} sx={{ color: '#dc2626' }}>{incidentStats.severe}</Typography>
                      <Typography variant="caption" color="text.secondary">Mức nặng</Typography>
                    </Box>
                  </Stack>
                  <Button
                    size="small" variant="outlined" endIcon={<ArrowIcon />}
                    onClick={() => navigate('/medical-staff/incidents')}
                    sx={{ borderColor: '#dc2626', color: '#dc2626', '&:hover': { borderColor: '#b91c1c', bgcolor: '#fef2f2' } }}
                  >
                    Mở ghi nhận bất thường
                  </Button>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <HealthIcon sx={{ color: '#0891b2' }} />
                    <Typography variant="subtitle1" fontWeight={700}>Thao tác nhanh</Typography>
                  </Stack>
                  <Stack spacing={1.5}>
                    <Button
                      fullWidth variant="contained"
                      startIcon={<MedicalIcon />}
                      onClick={() => navigate('/medical-staff/health')}
                      sx={{ bgcolor: '#0891b2', '&:hover': { bgcolor: '#0e7490' } }}
                    >
                      Quản lý & báo cáo sức khỏe
                    </Button>
                    <Button
                      fullWidth variant="outlined"
                      startIcon={<SafetyIcon />}
                      onClick={() => navigate('/medical-staff/health')}
                      sx={{ borderColor: '#0891b2', color: '#0891b2' }}
                    >
                      Danh sách học sinh / nhập Excel
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fafafa' }}>
                <Typography variant="subtitle2" fontWeight={700}>Học sinh cần chú ý (theo dõi / đáng lo)</Typography>
              </Box>
              {attentionRows.length === 0 ? (
                <Box sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary">Hiện không có học sinh ở trạng thái theo dõi hoặc đáng lo ngại.</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Học sinh</TableCell>
                        <TableCell>Lớp</TableCell>
                        <TableCell>Tình trạng</TableCell>
                        <TableCell align="right">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attentionRows.map((r) => (
                        <TableRow key={r._id} hover>
                          <TableCell>{r.fullName}</TableCell>
                          <TableCell>{r.className}</TableCell>
                          <TableCell>
                            <Chip size="small" label={STATUS_CONFIG[r.generalStatus]?.label || '—'} color={STATUS_CONFIG[r.generalStatus]?.color || 'default'} />
                          </TableCell>
                          <TableCell align="right">
                            <Button size="small" onClick={() => navigate(`/medical-staff/health/${r._id}/history`, { state: r })}>
                              Lịch sử
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </>
        )}
      </Box>
  );
}
