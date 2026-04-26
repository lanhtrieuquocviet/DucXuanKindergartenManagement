import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, InputLabel,
  MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Typography,
} from '@mui/material';
import {
  Build as ProcessingIcon,
  TaskAlt as FixedIcon,
  Schedule as PendingIcon,
  ImageSearch as ImageIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { get, patch, ENDPOINTS } from '../../service/api';

const STATUS_LABEL = {
  pending: { label: 'Chờ tiếp nhận', color: 'warning' },
  processing: { label: 'Đang xử lý', color: 'info' },
  fixed: { label: 'Đã khắc phục', color: 'success' },
};
const STATUS_FLOW = ['pending', 'processing', 'fixed'];

const TYPE_LABEL = {
  broken: 'Hư hỏng',
  lost: 'Thất lạc',
};

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN');
}

function getNextStatus(status) {
  const currentIdx = STATUS_FLOW.indexOf(status);
  if (currentIdx < 0 || currentIdx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[currentIdx + 1];
}

function Row({ label, value, mono, bold }) {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 170, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={bold ? 700 : 400} fontFamily={mono ? 'monospace' : 'inherit'}>
        {value}
      </Typography>
    </Box>
  );
}

function DetailDialog({ open, incident, onClose, onSaveStatus, saving }) {
  const [status, setStatus] = useState('pending');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (!incident) return;
    setStatus(incident.status || 'pending');
    setAdminNotes(incident.adminNotes || '');
  }, [incident]);

  if (!incident) return null;

  const st = STATUS_LABEL[incident.status] || { label: incident.status, color: 'default' };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Chi tiết sự cố cơ sở vật chất
        <Chip label={st.label} color={st.color} size="small" sx={{ ml: 1.5, fontSize: 11, height: 22 }} />
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Row label="Mã sự cố" value={incident._id || '—'} mono />
          <Row label="Thời gian báo cáo" value={formatDateTime(incident.createdAt)} />
          <Row label="Giáo viên báo cáo" value={incident.createdBy?.fullName || incident.createdBy?.username || '—'} />
          <Row label="Lớp" value={incident.className || '—'} />
          <Divider />
          <Row label="Tài sản gặp sự cố" value={incident.assetName || '—'} bold />
          <Row label="Mã tài sản" value={incident.assetCode || '—'} mono />
          <Row label="Loại sự cố" value={TYPE_LABEL[incident.type] || incident.type || '—'} />
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>Mô tả sự cố</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{incident.description || '—'}</Typography>
          </Box>

          {incident.images?.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Ảnh hiện trạng ({incident.images.length})
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
          <FormControl size="small" fullWidth>
            <InputLabel>Trạng thái xử lý</InputLabel>
            <Select label="Trạng thái xử lý" value={status} onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="pending">Chờ tiếp nhận</MenuItem>
              <MenuItem value="processing">Đang xử lý</MenuItem>
              <MenuItem value="fixed">Đã khắc phục</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth multiline rows={3}
            label="Ghi chú từ Ban Giám Hiệu"
            placeholder="Ví dụ: Đã phân công bộ phận kỹ thuật xử lý trong ngày..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />
          {incident.resolvedAt && (
            <Row label="Hoàn thành lúc" value={formatDateTime(incident.resolvedAt)} />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving}>Đóng</Button>
        <Button
          variant="contained"
          onClick={() => onSaveStatus(incident, status, adminNotes)}
          disabled={saving}
        >
          {saving ? 'Đang cập nhật...' : 'Cập nhật xử lý'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ManageAssetIncidents() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [detailTarget, setDetailTarget] = useState(null);
  const [actioning, setActioning] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.ASSET_INCIDENTS);
      setIncidents(res?.data?.incidents || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được dữ liệu sự cố.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStatus = async (incident, status, adminNotes) => {
    if (!incident?._id) return;
    setActioning(true);
    try {
      await patch(ENDPOINTS.SCHOOL_ADMIN.ASSET_INCIDENT_DETAIL(incident._id), { status, adminNotes });
      toast.success('Đã cập nhật trạng thái xử lý sự cố.');
      setDetailTarget(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Cập nhật trạng thái thất bại.');
    } finally {
      setActioning(false);
    }
  };

  const handleQuickStatusChange = async (incident) => {
    const nextStatus = getNextStatus(incident?.status);
    if (!incident?._id || !nextStatus) return;
    await handleSaveStatus(incident, nextStatus, incident.adminNotes || '');
  };

  const filtered = filterStatus === 'all'
    ? incidents
    : incidents.filter((r) => r.status === filterStatus);

  const countByStatus = (s) => incidents.filter((r) => r.status === s).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Chờ tiếp nhận', status: 'pending', color: '#f59e0b', bg: '#fef3c7', icon: <PendingIcon fontSize="small" /> },
          { label: 'Đang xử lý', status: 'processing', color: '#0284c7', bg: '#e0f2fe', icon: <ProcessingIcon fontSize="small" /> },
          { label: 'Đã khắc phục', status: 'fixed', color: '#10b981', bg: '#d1fae5', icon: <FixedIcon fontSize="small" /> },
          { label: 'Tất cả', status: 'all', color: '#6366f1', bg: '#ede9fe', icon: null },
        ].map(({ label, status, color, bg, icon }) => (
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
              minWidth: 130,
            }}
          >
            <Typography variant="h5" fontWeight={800} sx={{ color, lineHeight: 1 }}>
              {status === 'all' ? incidents.length : countByStatus(status)}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
              {icon}
              <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
            </Stack>
          </Paper>
        ))}
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{
          px: 2.5, py: 1.75,
          borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
        }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Danh sách sự cố
            {filterStatus !== 'all' && (
              <Chip
                label={STATUS_LABEL[filterStatus]?.label}
                color={STATUS_LABEL[filterStatus]?.color}
                size="small"
                sx={{ ml: 1, fontSize: 11, height: 20 }}
              />
            )}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Lọc trạng thái</InputLabel>
            <Select
              label="Lọc trạng thái"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              startAdornment={<FilterIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="pending">Chờ tiếp nhận</MenuItem>
              <MenuItem value="processing">Đang xử lý</MenuItem>
              <MenuItem value="fixed">Đã khắc phục</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 7 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 7, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">Không có báo cáo sự cố nào.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Thời gian báo cáo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Giáo viên</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Lớp</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tài sản</TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} align="center">Loại sự cố</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Ảnh</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((incident) => (
                  <TableRow
                    key={incident._id}
                    hover
                    onClick={() => setDetailTarget(incident)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                      {formatDateTime(incident.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#6366f120', color: '#6366f1' }}>
                          {(incident.createdBy?.fullName || incident.createdBy?.username || '?')[0].toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {incident.createdBy?.fullName || incident.createdBy?.username || '—'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                      {incident.className || '—'}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{incident.assetName || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                        {incident.assetCode ? `Mã: ${incident.assetCode}` : 'Không có mã tài sản'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                      {TYPE_LABEL[incident.type] || incident.type || '—'}
                    </TableCell>
                    <TableCell align="center">
                      {incident.images?.length > 0
                        ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: 'primary.main' }}>
                            <ImageIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption" fontWeight={600}>{incident.images.length}</Typography>
                          </Box>
                          )
                        : <Typography variant="caption" color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant={getNextStatus(incident.status) ? 'contained' : 'outlined'}
                        color={STATUS_LABEL[incident.status]?.color || 'inherit'}
                        disabled={actioning || !getNextStatus(incident.status)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickStatusChange(incident);
                        }}
                        sx={{ textTransform: 'none', borderRadius: 999, minWidth: 138 }}
                      >
                        {getNextStatus(incident.status)
                          ? `${STATUS_LABEL[incident.status]?.label || incident.status} -> ${STATUS_LABEL[getNextStatus(incident.status)]?.label}`
                          : (STATUS_LABEL[incident.status]?.label || incident.status)}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      <DetailDialog
        open={!!detailTarget}
        incident={detailTarget}
        onClose={() => setDetailTarget(null)}
        onSaveStatus={handleSaveStatus}
        saving={actioning}
      />
    </Box>
  );
}
