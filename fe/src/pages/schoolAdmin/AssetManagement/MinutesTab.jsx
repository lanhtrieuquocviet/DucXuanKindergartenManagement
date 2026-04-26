import { Fragment, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  GetApp as FileDownloadIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { get, post, put, patch, del, ENDPOINTS } from '../../../service/api';
import { 
  STATUS_LABEL, 
  formatDate, 
  emptyMinutes, 
  emptyAssetRow,
  ConfirmDialog,
  AddCategoryDialog
} from './AssetUtils';

export function MinutesTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(true);
  const [minutesList, setMinutesList] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingMinutes, setEditingMinutes] = useState(null);
  const [form, setForm] = useState(emptyMinutes());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        get(ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES),
        get(ENDPOINTS.SCHOOL_ADMIN.ASSET_COMMITTEES),
      ]);
      setMinutesList(mRes?.data?.minutes || []);
      setCommittees(cRes?.data?.committees || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được dữ liệu.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleOpenView = m => {
    setEditingMinutes(m);
    setForm({
      className: m.className || '',
      location: m.location || 'Đức Xuân',
      inspectionDate: m.inspectionDate ? new Date(m.inspectionDate).toISOString().slice(0, 10) : '',
      inspectionTime: m.inspectionTime || '',
      endTime: m.endTime || '',
      reason: m.reason || '',
      inspectionMethod: m.inspectionMethod || '',
      committeeId: m.committeeId?._id || m.committeeId || '',
      assets: m.assets?.length ? m.assets.map(a => ({ ...a })) : [emptyAssetRow()],
      extraAssets: m.extraAssets?.length ? m.extraAssets.map(a => ({ ...a })) : [],
      conclusion: m.conclusion || '',
    });
    setOpenModal(true);
  };

  const handleAssetChange = (idx, field, value) =>
    setForm(prev => {
      const assets = [...prev.assets];
      assets[idx] = { ...assets[idx], [field]: field === 'quantity' ? Number(value) : value };
      return { ...prev, assets };
    });

  const handleAddRow = () => setForm(prev => ({ ...prev, assets: [...prev.assets, emptyAssetRow()] }));
  const handleRemoveRow = idx => setForm(prev => ({ ...prev, assets: prev.assets.filter((_, i) => i !== idx) }));
  const handleAddCategory = name => setForm(prev => ({ ...prev, assets: [...prev.assets, { ...emptyAssetRow(), category: name }] }));

  const handleSave = async () => {
    if (!form.inspectionDate) { toast.error('Vui lòng chọn ngày kiểm kê.'); return; }
    setSaving(true);
    try {
      if (editingMinutes?._id) {
        await put(ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES_DETAIL(editingMinutes._id), form);
        toast.success('Cập nhật biên bản thành công.');
      } else {
        await post(ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES, form);
        toast.success('Tạo biên bản thành công.');
      }
      setOpenModal(false); load();
    } catch (err) { toast.error(err?.message || 'Lưu thất bại.'); }
    finally { setSaving(false); }
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      await patch(ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES_APPROVE(editingMinutes._id), {});
      toast.success('Đã duyệt biên bản.');
      setOpenModal(false); load();
    } catch (err) { toast.error(err?.message || 'Duyệt thất bại.'); }
    finally { setSaving(false); }
  };

  const handleReject = async () => {
    setSaving(true);
    try {
      await patch(ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES_REJECT(editingMinutes._id), { rejectReason });
      toast.success('Đã từ chối biên bản.');
      setRejectDialog(false);
      setRejectReason('');
      setOpenModal(false);
      load();
    } catch (err) { toast.error(err?.message || 'Thất bại.'); }
    finally { setSaving(false); }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await del(ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES_DETAIL(deleteTarget));
      toast.success('Đã xóa biên bản.');
      setDeleteTarget(null); load();
    } catch (err) { toast.error(err?.message || 'Xóa thất bại.'); }
    finally { setDeleting(false); }
  };

  const downloadWord = async (m) => {
    try {
      const { getToken } = await import('../../../service/api');
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}${ENDPOINTS.SCHOOL_ADMIN.ASSET_MINUTES_EXPORT_WORD(m._id)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) { toast.error('Không xuất được file Word.'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bien_ban_kiem_ke_${m.minutesNumber || m._id}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Lỗi xuất Word.');
    }
  };

  const isApproved = editingMinutes?.status === 'approved';
  const isReadOnly = true; // BGH chỉ xem, không chỉnh sửa
  const parsedDate = form.inspectionDate ? new Date(form.inspectionDate) : null;
  const dayStr = parsedDate ? parsedDate.getDate() : '___';
  const monthStr = parsedDate ? parsedDate.getMonth() + 1 : '___';
  const yearStr = parsedDate ? parsedDate.getFullYear() : '______';
  const selectedCommittee = committees.find(c => c._id === form.committeeId) || null;

  const cellBorder = { border: '1px solid #555', padding: '4px 6px', fontSize: 13 };
  const headerCell = { ...cellBorder, fontWeight: 700, textAlign: 'center', background: '#f3f4f6' };

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} mb={2} gap={1}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Biên Bản Kiểm Kê Tài Sản</Typography>
          <Typography variant="body2" color="text.secondary">Giáo viên tạo biên bản — Ban Giám Hiệu xem và duyệt</Typography>
        </Box>
      </Stack>

      {/* List */}
      {loading ? (
        <Stack alignItems="center" py={4}><CircularProgress size={28} /></Stack>
      ) : minutesList.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={4}>Chưa có biên bản kiểm kê nào.</Typography>
      ) : isMobile ? (
        <Stack spacing={1.5}>
          {minutesList.map(m => {
            const s = STATUS_LABEL[m.status] || STATUS_LABEL.pending;
            return (
              <Paper key={m._id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography fontWeight={600}>{m.minutesNumber || '—'}</Typography>
                    <Typography variant="body2" color="text.secondary">{formatDate(m.createdAt)} · {[m.className, m.scope].filter(Boolean).join(' - ') || '—'}</Typography>
                    <Typography variant="body2">{m.createdBy?.fullName || '—'}</Typography>
                  </Box>
                  <Chip label={s.label} color={s.color} size="small" />
                </Stack>
                <Stack direction="row" spacing={1} mt={1.5}>
                  <Button size="small" variant="contained" color="info" sx={{ textTransform: 'none', flex: 1 }} onClick={() => handleOpenView(m)}>Xem</Button>
                  <Tooltip title="Tải về Word (.docx)">
                    <IconButton size="small" color="primary" onClick={() => downloadWord(m)}>
                      <FileDownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f3f4f6' }}>
                <TableCell>Số biên bản</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Lớp/Phạm vi</TableCell>
                <TableCell>Người tạo</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {minutesList.map(m => {
                const s = STATUS_LABEL[m.status] || STATUS_LABEL.pending;
                return (
                  <TableRow key={m._id} hover>
                    <TableCell>{m.minutesNumber || '—'}</TableCell>
                    <TableCell>{formatDate(m.createdAt)}</TableCell>
                    <TableCell>{[m.className, m.scope].filter(Boolean).join(' - ') || '—'}</TableCell>
                    <TableCell>{m.createdBy?.fullName || m.createdBy?.username || '—'}</TableCell>
                    <TableCell><Chip label={s.label} color={s.color} size="small" /></TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Button size="small" variant="contained" color="info" sx={{ textTransform: 'none' }} onClick={() => handleOpenView(m)}>Xem</Button>
                        <Tooltip title="Tải về Word (.docx)">
                          <IconButton size="small" color="primary" onClick={() => downloadWord(m)}>
                            <FileDownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* ── Official Document Modal ── */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { maxHeight: isMobile ? '100%' : '95vh' } }}>
        <DialogTitle sx={{ pb: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <span>{editingMinutes ? 'Biên bản kiểm kê' : 'Tạo biên bản kiểm kê'}</span>
            {editingMinutes && (
              <Chip label={STATUS_LABEL[editingMinutes.status]?.label || '—'} color={STATUS_LABEL[editingMinutes.status]?.color || 'default'} size="small" />
            )}
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }} dividers>
          {editingMinutes?.status === 'rejected' && editingMinutes?.rejectReason && (
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: '#fef2f2', borderColor: 'error.light' }}>
              <Typography variant="body2" fontWeight={600} color="error.dark" mb={0.5}>Lý do từ chối:</Typography>
              <Typography variant="body2" color="error.dark">{editingMinutes.rejectReason}</Typography>
            </Paper>
          )}
          {/* Phần thông tin — BGH chỉ xem */}
          <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 2, bgcolor: '#f9fafb' }}>
            <Typography variant="body2" fontWeight={600} mb={1.5} color="text.secondary">Thông tin biên bản</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} flexWrap="wrap">
              <TextField label="Lớp" size="small" value={form.className || '—'} disabled
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 150 } }}
                InputProps={{ sx: { fontWeight: form.className ? 600 : 400 } }} />
              <TextField label="Địa điểm" size="small" value={form.location} disabled
                sx={{ minWidth: { xs: '100%', sm: 130 } }} />
              <TextField label="Ngày kiểm kê" type="date" size="small" InputLabelProps={{ shrink: true }}
                value={form.inspectionDate} disabled sx={{ minWidth: { xs: '100%', sm: 155 } }} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} flexWrap="wrap">
              <TextField label="Giờ bắt đầu" size="small" value={form.inspectionTime} disabled
                sx={{ minWidth: { xs: '100%', sm: 155 } }} />
              <TextField label="Giờ kết thúc" size="small" value={form.endTime} disabled
                sx={{ minWidth: { xs: '100%', sm: 175 } }} />
              <TextField label="Ban kiểm kê" size="small" disabled
                value={committees.find(c => c._id === form.committeeId)?.name || '—'}
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 190 } }} />
            </Stack>
            <TextField label="II. Lí do kiểm kê" size="small" fullWidth multiline rows={2}
              value={form.reason} disabled sx={{ mb: 2 }} />
            <TextField label="IV. Hình thức kiểm kê" size="small" fullWidth multiline rows={2}
              value={form.inspectionMethod} disabled />
          </Paper>

          {/* Biên bản chính thức */}
          <Box sx={{ fontFamily: 'Times New Roman, serif', fontSize: { xs: 12, sm: 14 }, color: '#000', p: { xs: 0, sm: 1 } }}>
            {/* Header */}
            <Typography sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 }, textAlign: 'center', fontFamily: 'inherit' }}>
              CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </Typography>
            <Typography sx={{ fontSize: { xs: 11, sm: 13 }, textAlign: 'center', textDecoration: 'underline', fontFamily: 'inherit', mb: 0.5 }}>
              Độc lập - Tự do - Hạnh phúc
            </Typography>
            <Typography sx={{ textAlign: 'center', fontWeight: 700, fontSize: { xs: 13, sm: 15 }, textTransform: 'uppercase', mb: 0.5, fontFamily: 'inherit' }}>
              BIÊN BẢN KIỂM KÊ TÀI SẢN {[form.className, form.scope].filter(Boolean).map(s => s.toUpperCase()).join(' - ')}
            </Typography>
            <Typography sx={{ textAlign: 'center', fontStyle: 'italic', mb: 2, fontFamily: 'inherit', fontSize: { xs: 11, sm: 13 } }}>
              {form.location}, ngày {dayStr} tháng {monthStr} năm {yearStr}
            </Typography>

            {/* I */}
            <Typography sx={{ fontWeight: 700, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>I/ Thành phần Ban kiểm kê:</Typography>
            {selectedCommittee?.members?.length ? (
              selectedCommittee.members.map((m, i) => (
                <Typography key={i} sx={{ ml: 2, fontFamily: 'inherit', fontSize: 'inherit' }}>
                  {i + 1}. {m.fullName}{m.role !== 'Thành viên' ? ` - ${m.role}` : ''}
                </Typography>
              ))
            ) : (
              <Typography sx={{ ml: 2, fontStyle: 'italic', color: '#888', fontSize: 'inherit', fontFamily: 'inherit' }}>
                (Chọn Ban kiểm kê ở phần thông tin phía trên)
              </Typography>
            )}

            {/* II */}
            <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>II/ Lí do kiểm kê:</Typography>
            <Typography sx={{ ml: 2, fontFamily: 'inherit', fontSize: 'inherit' }}>- {form.reason || '...'}</Typography>

            {/* III */}
            <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>III/ Thời gian kiểm kê:</Typography>
            <Typography sx={{ ml: 2, fontFamily: 'inherit', fontSize: 'inherit' }}>
              - Vào hồi {form.inspectionTime || '___'} ngày {dayStr} tháng {monthStr} năm {yearStr}
            </Typography>

            {/* IV */}
            <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>IV/ Hình thức kiểm kê:</Typography>
            {(form.inspectionMethod || '').split('\n').map((line, i) => (
              <Typography key={i} sx={{ ml: 2, fontFamily: 'inherit', fontSize: 'inherit' }}>- {line}</Typography>
            ))}

            {/* V */}
            <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5, fontFamily: 'inherit', fontSize: 'inherit' }}>V/ Nội dung kiểm kê:</Typography>
            <Typography sx={{ fontWeight: 700, textAlign: 'center', mb: 1, fontFamily: 'inherit', fontSize: 'inherit' }}>
              KIỂM KÊ TÀI SẢN CÓ TRONG LỚP HỌC:
            </Typography>

            {/* Asset table */}
            <Box sx={{ overflowX: 'auto', mb: 1, WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr>
                    <th style={{ ...headerCell, width: 32 }}>TT</th>
                    <th style={headerCell}>TÊN THIẾT BỊ</th>
                    <th style={{ ...headerCell, width: 46 }}>ĐVT</th>
                    <th style={{ ...headerCell, width: 46 }}>SL</th>
                    <th style={{ ...headerCell, width: 110 }}>ĐỐI TƯỢNG SỬ DỤNG</th>
                    <th style={{ ...headerCell, width: 90 }}>GHI CHÚ</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const groups = [];
                    form.assets.forEach(row => {
                      const cat = row.category || '';
                      const last = groups[groups.length - 1];
                      if (last && last.category === cat) last.rows.push(row);
                      else groups.push({ category: cat, rows: [row] });
                    });
                    let counter = 0;
                    return groups.map((g, gi) => (
                      <Fragment key={gi}>
                        {g.category && (
                          <tr>
                            <td colSpan={6}
                              style={{ ...cellBorder, fontWeight: 700, textAlign: 'center', background: '#f0f0f0' }}>
                              {g.category}
                            </td>
                          </tr>
                        )}
                        {g.rows.map((row, ri) => {
                          counter++;
                          const n = counter;
                          return (
                            <tr key={`${gi}-${ri}`}>
                              <td style={{ ...cellBorder, textAlign: 'center' }}>{n}</td>
                              <td style={cellBorder}>{row.name}</td>
                              <td style={{ ...cellBorder, textAlign: 'center' }}>{row.unit}</td>
                              <td style={{ ...cellBorder, textAlign: 'center' }}>{row.quantity}</td>
                              <td style={{ ...cellBorder, textAlign: 'center' }}>{row.targetUser}</td>
                              <td style={cellBorder}>{row.notes}</td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    ));
                  })()}
                </tbody>
              </table>
            </Box>

            {/* Extra Assets (ngoài thông tư) */}
            {form.extraAssets?.length > 0 && (
              <>
                <Typography sx={{ fontWeight: 700, textAlign: 'center', mt: 2, mb: 1, fontFamily: 'inherit', fontSize: 'inherit' }}>
                  CÁC THIẾT BỊ TÀI SẢN KHÁC NGOÀI THÔNG TƯ
                </Typography>
                <Box sx={{ overflowX: 'auto', mb: 1, WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                    <thead>
                      <tr>
                        <th style={{ ...headerCell, width: 32 }}>TT</th>
                        <th style={{ ...headerCell, width: 80 }}>MÃ SỐ</th>
                        <th style={headerCell}>TÊN THIẾT BỊ</th>
                        <th style={{ ...headerCell, width: 46 }}>ĐVT</th>
                        <th style={{ ...headerCell, width: 46 }}>SL</th>
                        <th style={{ ...headerCell, width: 110 }}>ĐỐI TƯỢNG SỬ DỤNG</th>
                        <th style={{ ...headerCell, width: 90 }}>GHI CHÚ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const groups = [];
                        form.extraAssets.forEach(row => {
                          const cat = row.category || '';
                          const last = groups[groups.length - 1];
                          if (last && last.category === cat) last.rows.push(row);
                          else groups.push({ category: cat, rows: [row] });
                        });
                        let counter = 0;
                        return groups.map((g, gi) => (
                          <Fragment key={gi}>
                            {g.category && (
                              <tr>
                                <td colSpan={7}
                                  style={{ ...cellBorder, fontWeight: 700, textAlign: 'center', background: '#f0f0f0' }}>
                                  {g.category}
                                </td>
                              </tr>
                            )}
                            {g.rows.map((row, ri) => {
                              counter++;
                              const n = counter;
                              return (
                                <tr key={`${gi}-${ri}`}>
                                  <td style={{ ...cellBorder, textAlign: 'center' }}>{n}</td>
                                  <td style={cellBorder}>{row.assetCode}</td>
                                  <td style={cellBorder}>{row.name}</td>
                                  <td style={{ ...cellBorder, textAlign: 'center' }}>{row.unit}</td>
                                  <td style={{ ...cellBorder, textAlign: 'center' }}>{row.quantity}</td>
                                  <td style={{ ...cellBorder, textAlign: 'center' }}>{row.targetUser}</td>
                                  <td style={cellBorder}>{row.notes}</td>
                                </tr>
                              );
                            })}
                          </Fragment>
                        ));
                      })()}
                    </tbody>
                  </table>
                </Box>
              </>
            )}

            {/* Footer */}
            <Typography sx={{ fontFamily: 'inherit', fontSize: { xs: 11, sm: 13 }, mb: 2 }}>
              Kiểm kê kết thúc vào lúc {form.endTime || '___'} ngày {dayStr} tháng {monthStr} năm {yearStr}.
              {' '}Biên bản này được sao thành 2 bản, giáo viên chủ nhiệm lớp giữ một bản và Ban kiểm kê giữ một bản.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} textAlign="center">
              {[
                { title: 'XÁC NHẬN CỦA NHÀ TRƯỜNG', sub: 'Phó Hiệu Trưởng', name: selectedCommittee?.members?.find(m => m.role === 'Trưởng ban')?.fullName },
                { title: 'GIÁO VIÊN CHỦ NHIỆM', sub: '', name: '' },
                { title: 'NGƯỜI GHI BIÊN BẢN', sub: '', name: selectedCommittee?.members?.find(m => m.role === 'Phó ban')?.fullName },
              ].map((col, i) => (
                <Box key={i} sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontFamily: 'inherit', fontSize: { xs: 11, sm: 13 } }}>{col.title}</Typography>
                  {col.sub && <Typography sx={{ fontStyle: 'italic', fontFamily: 'inherit', fontSize: 12 }}>{col.sub}</Typography>}
                  <Typography sx={{ mt: { xs: 2, sm: 5 }, fontWeight: 700, fontFamily: 'inherit', fontSize: { xs: 11, sm: 13 } }}>
                    {col.name || '\u00A0'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 1.5, sm: 3 }, pb: 2, gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => setOpenModal(false)} disabled={saving}>Đóng</Button>
          {editingMinutes && (
            <Button variant="outlined" color="primary" startIcon={<FileDownloadIcon />} onClick={() => downloadWord(editingMinutes)} sx={{ textTransform: 'none' }}>
              Tải về Word
            </Button>
          )}
          {editingMinutes?.status === 'pending' && (
            <>
              <Button variant="contained" color="success" onClick={handleApprove} disabled={saving} sx={{ textTransform: 'none' }}>
                {saving ? '...' : 'Duyệt'}
              </Button>
              <Button variant="contained" color="error" onClick={() => { setRejectReason(''); setRejectDialog(true); }} disabled={saving} sx={{ textTransform: 'none' }}>
                Từ chối
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Lý do từ chối</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            size="small"
            label="Lý do từ chối *"
            placeholder="Nhập lý do từ chối biên bản này..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setRejectDialog(false)} disabled={saving}>Hủy</Button>
          <Button
            variant="contained"
            color="error"
            disabled={saving || !rejectReason.trim()}
            onClick={handleReject}
          >
            {saving ? 'Đang xử lý...' : 'Xác nhận từ chối'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Category Dialog */}
      <AddCategoryDialog open={categoryDialog} onClose={() => setCategoryDialog(false)} onConfirm={name => { handleAddCategory(name); setCategoryDialog(false); }} />

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa biên bản kiểm kê"
        message="Bạn có chắc chắn muốn xóa biên bản này không?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </Box>
  );
}
