import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, IconButton, InputLabel,
  MenuItem, Paper, Select, Stack, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, Tabs, TextField, Typography, Collapse,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { useTeacher } from '../../context/TeacherContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { get, post, patch, postFormData, ENDPOINTS } from '../../service/api';

// ── Allocation status labels ───────────────────────────────────────────────
const ALLOCATION_STATUS = {
  pending_confirmation: { label: 'Chờ xác nhận', color: 'warning' },
  active:               { label: 'Đang sử dụng',  color: 'success' },
  transferred:          { label: 'Đã chuyển',      color: 'default' },
  returned:             { label: 'Đã thu hồi',     color: 'default' },
};

// ── Status labels ──────────────────────────────────────────────────────────
const INCIDENT_STATUS = {
  pending:    { label: 'Đã gửi',       color: 'warning' },
  processing: { label: 'Đang xử lý',   color: 'info' },
  fixed:      { label: 'Đã xử lý',     color: 'success' },
};

const TYPE_LABEL = {
  broken: 'Hỏng',
  lost:   'Mất',
};

const MAX_IMAGES = 5;

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

// ── Asset list grouped by category ────────────────────────────────────────
function AssetTable({ title, assets }) {
  const [open, setOpen]               = useState(true);
  const [page, setPage]               = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  if (!assets || assets.length === 0) return null;

  const pagedAssets = assets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const grouped = pagedAssets.reduce((acc, a) => {
    const cat = a.category || 'Khác';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  return (
    <Box mb={3}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        <IconButton size="small" onClick={() => setOpen(v => !v)}>
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Stack>
      <Collapse in={open}>
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell width={36} align="center">STT</TableCell>
                  <TableCell>Tên tài sản</TableCell>
                  <TableCell width={80} align="center">Đơn vị</TableCell>
                  <TableCell width={80} align="center">SL</TableCell>
                  <TableCell width={110} align="center">Đối tượng</TableCell>
                  <TableCell>Ghi chú</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(grouped).map(([cat, rows]) => (
                  <>
                    {cat !== 'Khác' && (
                      <TableRow key={`cat-${cat}`}>
                        <TableCell colSpan={6} sx={{ bgcolor: 'primary.50', fontWeight: 700, py: 0.5, fontSize: 12, color: 'primary.main' }}>
                          {cat}
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map((a, i) => (
                      <TableRow key={i} hover>
                        <TableCell align="center" sx={{ color: 'text.secondary' }}>{page * rowsPerPage + i + 1}</TableCell>
                        <TableCell>{a.name}</TableCell>
                        <TableCell align="center">{a.unit}</TableCell>
                        <TableCell align="center">{a.quantity}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={a.targetUser}
                            size="small"
                            variant="outlined"
                            color={a.targetUser === 'Giáo viên' ? 'secondary' : a.targetUser === 'Dùng chung' ? 'info' : 'default'}
                            sx={{ fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>{a.notes}</TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={assets.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage="Số hàng:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
            />
          </TableContainer>
        </Paper>
      </Collapse>
    </Box>
  );
}

// ── Incident Form Dialog ───────────────────────────────────────────────────
function IncidentFormDialog({ open, onClose, allocation, onSaved }) {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ assetName: '', assetCode: '', type: 'broken', description: '', images: [] });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const allAssets = [
    ...(allocation?.assets || []),
    ...(allocation?.extraAssets || []),
  ];

  const handleAssetSelect = (name) => {
    const found = allAssets.find(a => a.name === name);
    setForm(f => ({ ...f, assetName: name, assetCode: found?.assetCode || '' }));
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (form.images.length + files.length > MAX_IMAGES) {
      toast.warning(`Tối đa ${MAX_IMAGES} ảnh`); return;
    }
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('image', file);
        const res = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_PURCHASE_IMAGE, fd);
        urls.push(res.data?.url || res.url);
      }
      setForm(f => ({ ...f, images: [...f.images, ...urls] }));
    } catch {
      toast.error('Tải ảnh thất bại');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async () => {
    if (!form.assetName) { toast.warning('Vui lòng chọn tài sản'); return; }
    setSaving(true);
    try {
      await post(ENDPOINTS.TEACHER.ASSET_INCIDENTS, {
        classId:      allocation?.classId?._id || allocation?.classId,
        className:    allocation?.className,
        allocationId: allocation?._id,
        assetName:    form.assetName,
        assetCode:    form.assetCode,
        type:         form.type,
        description:  form.description,
        images:       form.images,
      });
      toast.success('Đã gửi báo cáo sự cố');
      setForm({ assetName: '', assetCode: '', type: 'broken', description: '', images: [] });
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Gửi thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Báo cáo sự cố tài sản</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={0.5}>
          <FormControl fullWidth size="small">
            <InputLabel>Tài sản *</InputLabel>
            <Select
              value={form.assetName}
              label="Tài sản *"
              onChange={(e) => handleAssetSelect(e.target.value)}
            >
              {allAssets.map((a, i) => (
                <MenuItem key={i} value={a.name}>{a.name}</MenuItem>
              ))}
              <MenuItem value="__other__">Khác (nhập tay)</MenuItem>
            </Select>
          </FormControl>
          {form.assetName === '__other__' && (
            <TextField
              size="small" fullWidth label="Tên tài sản"
              value={form.assetCode}
              onChange={(e) => setForm(f => ({ ...f, assetName: e.target.value, assetCode: '' }))}
            />
          )}
          <FormControl fullWidth size="small">
            <InputLabel>Loại sự cố *</InputLabel>
            <Select value={form.type} label="Loại sự cố *" onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}>
              <MenuItem value="broken">Hỏng</MenuItem>
              <MenuItem value="lost">Mất</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small" fullWidth multiline rows={3}
            label="Mô tả chi tiết"
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
          />
          {/* Image upload */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <Typography variant="body2" color="text.secondary">Ảnh đính kèm ({form.images.length}/{MAX_IMAGES})</Typography>
              <Button
                size="small" variant="outlined" startIcon={<AddPhotoAlternateIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || form.images.length >= MAX_IMAGES}
              >
                {uploading ? 'Đang tải...' : 'Thêm ảnh'}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleUpload} />
            </Stack>
            {form.images.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {form.images.map((url, i) => (
                  <Box key={i} sx={{ position: 'relative', width: 80, height: 80 }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
                    <IconButton
                      size="small"
                      onClick={() => removeImage(i)}
                      sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'white', boxShadow: 1, p: 0.25 }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || uploading}>
          {saving ? 'Đang gửi...' : 'Gửi báo cáo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function TeacherClassAssets() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const { isCommitteeMember } = useTeacher();

  const [tab, setTab]               = useState(0);
  const [loading, setLoading]       = useState(true);
  const [allocation, setAlloc]      = useState(null);
  const [incidents, setIncidents]   = useState([]);
  const [openForm, setOpenForm]     = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming]   = useState(false);

  // Incidents pagination
  const [incPage, setIncPage]               = useState(0);
  const [incRowsPerPage, setIncRowsPerPage] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, iRes] = await Promise.all([
        get(ENDPOINTS.TEACHER.MY_ASSET_ALLOCATION),
        get(ENDPOINTS.TEACHER.ASSET_INCIDENTS),
      ]);
      setAlloc(aRes.data?.allocation || null);
      setIncidents(iRes.data?.incidents || []);
    } catch (err) {
      toast.error(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    fetchData();
  }, [user, isInitializing, navigate]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await patch(ENDPOINTS.TEACHER.ASSET_ALLOCATION_CONFIRM(allocation._id), {});
      toast.success('Xác nhận bàn giao thành công!');
      setConfirmOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Xác nhận thất bại');
    } finally {
      setConfirming(false);
    }
  };

  const menuItems = [
    { key: 'classes',          label: 'Lớp phụ trách' },
    { key: 'students',         label: 'Danh sách học sinh' },
    { key: 'attendance',       label: 'Điểm danh' },
    { key: 'pickup-approval',  label: 'Đơn đưa đón' },
    { key: 'schedule',         label: 'Lịch dạy & hoạt động' },
    { key: 'messages',         label: 'Thông báo cho phụ huynh' },
    { key: 'purchase-request', label: 'Cơ sở vật chất' },
    { key: 'class-assets',     label: 'Tài sản lớp' },
    ...(isCommitteeMember ? [{ key: 'asset-inspection', label: 'Kiểm kê tài sản' }] : []),
  ];

  const handleMenuSelect = (key) => {
    if (key === 'classes')          { navigate('/teacher'); return; }
    if (key === 'attendance')       { navigate('/teacher/attendance'); return; }
    if (key === 'pickup-approval')  { navigate('/teacher/pickup-approval'); return; }
    if (key === 'purchase-request') { navigate('/teacher/purchase-request'); return; }
    if (key === 'class-assets')     { navigate('/teacher/class-assets'); return; }
    if (key === 'asset-inspection') { navigate('/teacher/asset-inspection'); return; }
  };

  const totalAssets = (allocation?.assets?.length || 0) + (allocation?.extraAssets?.length || 0);
  const pendingCount = incidents.filter(i => i.status === 'pending').length;

  return (
    <RoleLayout
      menuItems={menuItems}
      activeKey="class-assets"
      onMenuSelect={handleMenuSelect}
      onLogout={logout}
      userName={user?.fullName || user?.username}
    >
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Tài sản lớp</Typography>
            {allocation && (
              <Typography variant="body2" color="text.secondary">
                Lớp: {allocation.className} · Ngày bàn giao: {formatDate(allocation.handoverDate)} · {totalAssets} tài sản
              </Typography>
            )}
          </Box>
          {tab === 1 && allocation && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenForm(true)}>
              Báo cáo sự cố
            </Button>
          )}
        </Stack>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Danh sách tài sản" />
          <Tab label={`Sự cố${pendingCount ? ` (${pendingCount} chờ)` : ''}`} />
        </Tabs>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <>
            {/* ── Tab 0: Asset list ── */}
            {tab === 0 && (
              <Box>
                {!allocation ? (
                  <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                    Lớp của bạn chưa có biên bản bàn giao tài sản nào đang hoạt động.
                  </Paper>
                ) : (
                  <>
                    {/* Allocation info */}
                    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Mã biên bản</Typography>
                          <Typography variant="body2" fontWeight={600}>{allocation.documentCode || '—'}</Typography>
                        </Box>
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Lớp</Typography>
                          <Typography variant="body2" fontWeight={600}>{allocation.className}</Typography>
                        </Box>
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Giáo viên nhận</Typography>
                          <Typography variant="body2" fontWeight={600}>{allocation.teacherName || '—'}</Typography>
                        </Box>
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Ngày bàn giao</Typography>
                          <Typography variant="body2" fontWeight={600}>{formatDate(allocation.handoverDate)}</Typography>
                        </Box>
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Năm học</Typography>
                          <Typography variant="body2" fontWeight={600}>{allocation.academicYear || '—'}</Typography>
                        </Box>
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Trạng thái</Typography>
                          <Box>
                            <Chip
                              label={ALLOCATION_STATUS[allocation.status]?.label || allocation.status}
                              size="small"
                              color={ALLOCATION_STATUS[allocation.status]?.color || 'default'}
                            />
                          </Box>
                        </Box>
                      </Stack>
                    </Paper>

                    {allocation.status === 'pending_confirmation' && (
                      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'warning.50', borderColor: 'warning.main' }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2}>
                          <Box>
                            <Typography variant="body2" fontWeight={700} color="warning.dark">
                              Biên bản bàn giao đang chờ xác nhận
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Vui lòng kiểm tra danh sách tài sản bên dưới và xác nhận nhận bàn giao.
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => setConfirmOpen(true)}
                          >
                            Xác nhận nhận bàn giao
                          </Button>
                        </Stack>
                      </Paper>
                    )}

                    <AssetTable title="Tài sản theo Thông tư" assets={allocation.assets} />
                    <AssetTable title="Thiết bị khác ngoài Thông tư" assets={allocation.extraAssets} />
                  </>
                )}
              </Box>
            )}

            {/* ── Tab 1: Incidents ── */}
            {tab === 1 && (
              <Box>
                {incidents.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                    Chưa có sự cố nào được báo cáo.
                    {allocation && (
                      <Box mt={2}>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenForm(true)}>
                          Báo cáo sự cố đầu tiên
                        </Button>
                      </Box>
                    )}
                  </Paper>
                ) : (
                  <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.100' }}>
                            <TableCell>Tài sản</TableCell>
                            <TableCell width={90}>Loại</TableCell>
                            <TableCell>Mô tả</TableCell>
                            <TableCell width={90}>Ảnh</TableCell>
                            <TableCell width={110}>Trạng thái</TableCell>
                            <TableCell width={110}>Ngày gửi</TableCell>
                            <TableCell>Ghi chú BGH</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {incidents.slice(incPage * incRowsPerPage, incPage * incRowsPerPage + incRowsPerPage).map((inc) => {
                            const st = INCIDENT_STATUS[inc.status] || { label: inc.status, color: 'default' };
                            return (
                              <TableRow key={inc._id} hover>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={600}>{inc.assetName}</Typography>
                                  {inc.assetCode && <Typography variant="caption" color="text.secondary">{inc.assetCode}</Typography>}
                                </TableCell>
                                <TableCell>
                                  <Chip label={TYPE_LABEL[inc.type] || inc.type} size="small" color={inc.type === 'broken' ? 'warning' : 'error'} variant="outlined" />
                                </TableCell>
                                <TableCell sx={{ maxWidth: 200, fontSize: 12 }}>{inc.description || '—'}</TableCell>
                                <TableCell>
                                  {inc.images?.length > 0 ? (
                                    <Stack direction="row" spacing={0.5}>
                                      {inc.images.slice(0, 3).map((url, i) => (
                                        <Box
                                          key={i}
                                          component="a"
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <img src={url} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} />
                                        </Box>
                                      ))}
                                      {inc.images.length > 3 && (
                                        <Box sx={{ width: 36, height: 36, bgcolor: 'grey.200', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                                          +{inc.images.length - 3}
                                        </Box>
                                      )}
                                    </Stack>
                                  ) : '—'}
                                </TableCell>
                                <TableCell>
                                  <Chip label={st.label} size="small" color={st.color} />
                                </TableCell>
                                <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{formatDate(inc.createdAt)}</TableCell>
                                <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{inc.adminNotes || '—'}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      <TablePagination
                        component="div"
                        count={incidents.length}
                        page={incPage}
                        onPageChange={(_, newPage) => setIncPage(newPage)}
                        rowsPerPage={incRowsPerPage}
                        onRowsPerPageChange={e => { setIncRowsPerPage(parseInt(e.target.value, 10)); setIncPage(0); }}
                        rowsPerPageOptions={[5, 10, 25]}
                        labelRowsPerPage="Số hàng:"
                        labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
                      />
                    </TableContainer>
                  </Paper>
                )}
              </Box>
            )}
          </>
        )}
      </Box>

      {/* ── Confirm handover dialog ── */}
      <Dialog open={confirmOpen} onClose={() => !confirming && setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Xác nhận nhận bàn giao tài sản</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Bạn xác nhận đã kiểm tra và nhận đầy đủ tài sản theo biên bản{' '}
            <strong>{allocation?.documentCode}</strong> của lớp{' '}
            <strong>{allocation?.className}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Sau khi xác nhận, trạng thái sẽ chuyển sang "Đang sử dụng".
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={confirming}>Hủy</Button>
          <Button variant="contained" color="success" onClick={handleConfirm} disabled={confirming} startIcon={<CheckCircleIcon />}>
            {confirming ? 'Đang xác nhận...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Incident form dialog ── */}
      <IncidentFormDialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        allocation={allocation}
        onSaved={fetchData}
      />
    </RoleLayout>
  );
}
