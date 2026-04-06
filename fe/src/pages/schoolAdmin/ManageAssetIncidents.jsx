import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, IconButton, InputLabel,
  MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Typography,
} from '@mui/material';
import {
  Build as ProcessingIcon,
  CheckCircle as FixedIcon,
  Visibility as ViewIcon,
  Image as ImageIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { get, patch, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';

const STATUS_CONFIG = {
  pending:    { label: 'Chờ xử lý',    color: 'warning' },
  processing: { label: 'Đang xử lý',   color: 'info'    },
  fixed:      { label: 'Đã xử lý',     color: 'success' },
};

const TYPE_CONFIG = {
  broken: { label: 'Hỏng', color: '#ef4444', bg: '#fee2e2' },
  lost:   { label: 'Mất',  color: '#f59e0b', bg: '#fef3c7' },
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

// ── Row helper ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value, bold, mono }) {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={bold ? 700 : 400} fontFamily={mono ? 'monospace' : 'inherit'}>
        {value}
      </Typography>
    </Box>
  );
}

// ── Detail / Update Dialog ──────────────────────────────────────────────────────
function DetailDialog({ open, incident, onClose, onUpdated }) {
  const [status, setStatus]         = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (incident) {
      setStatus(incident.status);
      setAdminNotes(incident.adminNotes || '');
    }
  }, [incident]);

  if (!incident) return null;

  const typeConf   = TYPE_CONFIG[incident.type]   || { label: incident.type, color: '#666', bg: '#eee' };
  const statusConf = STATUS_CONFIG[incident.status] || { label: incident.status, color: 'default' };

  const handleSave = async () => {
    setSaving(true);
    try {
      await patch(ENDPOINTS.SCHOOL_ADMIN.ASSET_INCIDENT_UPDATE(incident._id), { status, adminNotes });
      toast.success('Đã cập nhật sự cố.');
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const dirty = status !== incident.status || adminNotes !== (incident.adminNotes || '');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Chi tiết sự cố tài sản
        <Chip
          label={statusConf.label}
          color={statusConf.color}
          size="small"
          sx={{ ml: 1.5, fontSize: 11, height: 22, verticalAlign: 'middle' }}
        />
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={1.5}>
          {/* Asset info */}
          <InfoRow label="Tên tài sản"   value={incident.assetName} bold />
          {incident.assetCode && <InfoRow label="Mã tài sản" value={incident.assetCode} mono />}
          <InfoRow
            label="Loại sự cố"
            value={
              <Chip
                label={typeConf.label}
                size="small"
                sx={{ fontSize: 11, height: 20, bgcolor: typeConf.bg, color: typeConf.color, fontWeight: 700 }}
              />
            }
          />
          <InfoRow label="Lớp"           value={incident.className || '—'} />
          <InfoRow label="Ngày báo cáo"  value={formatDate(incident.createdAt)} />
          <InfoRow
            label="Giáo viên báo"
            value={incident.createdBy?.fullName || incident.createdBy?.username || '—'}
          />

          {incident.description && (
            <>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Mô tả sự cố</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{incident.description}</Typography>
              </Box>
            </>
          )}

          {/* Images */}
          {incident.images?.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Ảnh đính kèm ({incident.images.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.75 }}>
                {incident.images.map((url, i) => (
                  <Box
                    key={i}
                    component="img"
                    src={url}
                    onClick={() => window.open(url, '_blank')}
                    sx={{
                      width: 80, height: 80, borderRadius: 1.5,
                      objectFit: 'cover', cursor: 'pointer',
                      border: '1px solid', borderColor: 'divider',
                      '&:hover': { opacity: 0.85 },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Divider />

          {/* Admin update section */}
          <Typography variant="subtitle2" fontWeight={700} color="primary">Cập nhật xử lý</Typography>
          <FormControl size="small" fullWidth>
            <InputLabel>Trạng thái</InputLabel>
            <Select label="Trạng thái" value={status} onChange={e => setStatus(e.target.value)}>
              <MenuItem value="pending">Chờ xử lý</MenuItem>
              <MenuItem value="processing">Đang xử lý</MenuItem>
              <MenuItem value="fixed">Đã xử lý</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth multiline rows={3}
            label="Ghi chú của quản trị viên"
            placeholder="Nhập ghi chú xử lý để giáo viên biết..."
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
          />

          {incident.resolvedAt && (
            <InfoRow label="Ngày xử lý xong" value={formatDate(incident.resolvedAt)} />
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving}>Đóng</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !dirty}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
        >
          Lưu thay đổi
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────────
export default function ManageAssetIncidents() {
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [loading, setLoading]           = useState(true);
  const [incidents, setIncidents]       = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType]     = useState('all');
  const [detailTarget, setDetailTarget] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.ASSET_INCIDENTS);
      setIncidents(res?.data?.incidents || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = incidents.filter(inc => {
    if (filterStatus !== 'all' && inc.status !== filterStatus) return false;
    if (filterType   !== 'all' && inc.type   !== filterType)   return false;
    return true;
  });

  const countByStatus = (s) => incidents.filter(i => i.status === s).length;

  const userName = user?.fullName || user?.username || 'SchoolAdmin';

  return (
    <RoleLayout
      title="Sự cố tài sản"
      description="Theo dõi và xử lý các sự cố tài sản được báo cáo từ giáo viên."
      menuItems={menuItems}
      activeKey="asset-incidents"
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={createSchoolAdminMenuSelect(navigate)}
    >
      {/* ── Summary cards ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Chờ xử lý',  status: 'pending',    color: '#f59e0b', bg: '#fef3c7' },
          { label: 'Đang xử lý', status: 'processing', color: '#3b82f6', bg: '#dbeafe' },
          { label: 'Đã xử lý',   status: 'fixed',      color: '#10b981', bg: '#d1fae5' },
          { label: 'Tất cả',     status: 'all',         color: '#6366f1', bg: '#ede9fe' },
        ].map(({ label, status, color, bg }) => (
          <Paper
            key={status}
            elevation={0}
            onClick={() => setFilterStatus(status)}
            sx={{
              px: 2.5, py: 1.75, borderRadius: 2.5, cursor: 'pointer',
              border: '2px solid',
              borderColor: filterStatus === status ? color : 'transparent',
              bgcolor: filterStatus === status ? bg : 'background.paper',
              boxShadow: filterStatus === status ? `0 0 0 1px ${color}40` : '0 1px 3px rgba(0,0,0,0.08)',
              transition: 'all 0.15s',
              '&:hover': { borderColor: color, bgcolor: bg },
              minWidth: 120,
            }}
          >
            <Typography variant="h5" fontWeight={800} sx={{ color, lineHeight: 1 }}>
              {status === 'all' ? incidents.length : countByStatus(status)}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
          </Paper>
        ))}
      </Box>

      {/* ── Table ── */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{
          px: 2.5, py: 1.75,
          borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5,
        }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Danh sách sự cố
            {filterStatus !== 'all' && (
              <Chip
                label={STATUS_CONFIG[filterStatus]?.label}
                color={STATUS_CONFIG[filterStatus]?.color}
                size="small"
                sx={{ ml: 1, fontSize: 11, height: 20 }}
              />
            )}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Loại sự cố</InputLabel>
              <Select
                label="Loại sự cố"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="broken">Hỏng</MenuItem>
                <MenuItem value="lost">Mất</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                label="Trạng thái"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                startAdornment={<FilterIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="pending">Chờ xử lý</MenuItem>
                <MenuItem value="processing">Đang xử lý</MenuItem>
                <MenuItem value="fixed">Đã xử lý</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 7 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 7, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">Không có sự cố nào.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Ngày báo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tài sản</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Loại</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Lớp</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Giáo viên</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Ảnh</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((inc) => {
                  const typeConf   = TYPE_CONFIG[inc.type]     || { label: inc.type,   color: '#666', bg: '#eee' };
                  const statusConf = STATUS_CONFIG[inc.status] || { label: inc.status, color: 'default' };
                  return (
                    <TableRow
                      key={inc._id}
                      hover
                      onClick={() => setDetailTarget(inc)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {formatDate(inc.createdAt)}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{inc.assetName}</Typography>
                        {inc.assetCode && (
                          <Typography variant="caption" color="text.secondary" fontFamily="monospace" noWrap sx={{ display: 'block' }}>
                            {inc.assetCode}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={typeConf.label}
                          size="small"
                          sx={{ fontSize: 11, height: 20, bgcolor: typeConf.bg, color: typeConf.color, fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {inc.className || '—'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#6366f120', color: '#6366f1' }}>
                            {(inc.createdBy?.fullName || inc.createdBy?.username || '?')[0].toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 130 }}>
                            {inc.createdBy?.fullName || inc.createdBy?.username || '—'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {inc.images?.length > 0
                          ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: 'primary.main' }}>
                              <ImageIcon sx={{ fontSize: 16 }} />
                              <Typography variant="caption" fontWeight={600}>{inc.images.length}</Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          )
                        }
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={statusConf.label}
                          color={statusConf.color}
                          size="small"
                          sx={{ fontSize: 11, height: 22 }}
                        />
                      </TableCell>
                      <TableCell align="center" onClick={e => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          color="primary"
                          title="Xem & cập nhật"
                          onClick={() => setDetailTarget(inc)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        {inc.status === 'pending' && (
                          <IconButton
                            size="small"
                            color="info"
                            title="Đánh dấu đang xử lý"
                            onClick={async () => {
                              try {
                                await patch(ENDPOINTS.SCHOOL_ADMIN.ASSET_INCIDENT_UPDATE(inc._id), { status: 'processing' });
                                toast.success('Đã chuyển sang Đang xử lý.');
                                load();
                              } catch (err) {
                                toast.error(err?.message || 'Thất bại.');
                              }
                            }}
                          >
                            <ProcessingIcon fontSize="small" />
                          </IconButton>
                        )}
                        {inc.status === 'processing' && (
                          <IconButton
                            size="small"
                            color="success"
                            title="Đánh dấu đã xử lý xong"
                            onClick={async () => {
                              try {
                                await patch(ENDPOINTS.SCHOOL_ADMIN.ASSET_INCIDENT_UPDATE(inc._id), { status: 'fixed' });
                                toast.success('Đã đánh dấu xử lý xong.');
                                load();
                              } catch (err) {
                                toast.error(err?.message || 'Thất bại.');
                              }
                            }}
                          >
                            <FixedIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* ── Detail / Update Dialog ── */}
      <DetailDialog
        open={!!detailTarget}
        incident={detailTarget}
        onClose={() => setDetailTarget(null)}
        onUpdated={load}
      />
    </RoleLayout>
  );
}
