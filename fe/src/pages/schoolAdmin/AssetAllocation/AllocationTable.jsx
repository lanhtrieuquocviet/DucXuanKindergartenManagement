import React from 'react';
import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  IconButton,
  Typography,
} from '@mui/material';
import {
  InfoOutlined as InfoOutlinedIcon,
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  SwapHoriz as SwapHorizIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { STATUS_INFO, formatDate } from './AllocationUtils';

export function AllocationTable({
  loading,
  allocations,
  classes,
  filterStatus,
  setFilterStatus,
  filterClass,
  setFilterClass,
  setInfoAnchor,
  setViewTarget,
  downloadWord,
  setHistoryTarget,
  openEdit,
  openTransfer,
  setDeleteTarget,
}) {
  return (
    <Box>
      <Stack direction="row" gap={2} mb={2} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select value={filterStatus} label="Trạng thái" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="pending_confirmation">Chờ xác nhận</MenuItem>
            <MenuItem value="active">Đang sử dụng</MenuItem>
            <MenuItem value="transferred">Đã chuyển lớp</MenuItem>
            <MenuItem value="returned">Đã thu hồi</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Lọc theo lớp</InputLabel>
          <Select value={filterClass} label="Lọc theo lớp" onChange={(e) => setFilterClass(e.target.value)}>
            <MenuItem value="">Tất cả lớp</MenuItem>
            {classes.map((c) => <MenuItem key={c._id} value={c._id}>{c.className}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : allocations.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Chưa có biên bản bàn giao nào.</Typography>
        </Paper>
      ) : (
        <Paper sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 860 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                {['Mã biên bản','Lớp','Người bàn giao','Giáo viên nhận','Ngày bàn giao','Năm học','Số TS','Trạng thái','Thao tác'].map((h) => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const grouped = {};
                for (const alloc of allocations) {
                  const key = alloc.classId?.gradeId?._id ? String(alloc.classId.gradeId._id) : '__none__';
                  const gradeName = alloc.classId?.gradeId?.gradeName || 'Chưa phân khối';
                  if (!grouped[key]) grouped[key] = { gradeName, items: [] };
                  grouped[key].items.push(alloc);
                }
                const groups = Object.values(grouped).sort((a, b) => a.gradeName.localeCompare(b.gradeName, 'vi'));
                return groups.flatMap((group, gi) => [
                  <TableRow key={`gh-${gi}`}>
                    <TableCell colSpan={9} sx={{
                      py: 0.75, pl: 2.5, fontWeight: 700, fontSize: 13,
                      bgcolor: '#dbeafe', color: '#1d4ed8',
                      borderTop: gi > 0 ? '2px solid #93c5fd' : 'none',
                    }}>
                      {group.gradeName} — {group.items.length} biên bản
                    </TableCell>
                  </TableRow>,
                  ...group.items.map((alloc) => {
                    const si = STATUS_INFO[alloc.status] || STATUS_INFO.active;
                    return (
                      <TableRow key={alloc._id} hover>
                        <TableCell sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{alloc.documentCode}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {alloc.className || '—'}
                          {alloc.sourceRoomId && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Phòng: {alloc.sourceRoomId?.roomName || alloc.sourceRoomName || '—'}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{alloc.handoverByName || '—'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{alloc.teacherName || '—'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(alloc.handoverDate)}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{alloc.academicYear || '—'}</TableCell>
                        <TableCell align="center">{alloc.assets?.length || 0}</TableCell>
                        <TableCell>
                          <Chip label={si.label} color={si.color} size="small" />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" gap={0.5}>
                            <Tooltip title="Thông tin tạo & xác nhận">
                              <IconButton size="small" onClick={(e) => setInfoAnchor({ el: e.currentTarget, alloc })}>
                                <InfoOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xem biên bản">
                              <IconButton size="small" onClick={() => setViewTarget(alloc)}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Tải về Word (.docx)">
                              <IconButton size="small" color="primary" onClick={() => downloadWord(alloc)}>
                                <FileDownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Lịch sử chuyển giao">
                              <IconButton size="small" onClick={() => setHistoryTarget(alloc)}>
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {alloc.status !== 'returned' && (
                              <>
                                <Tooltip title="Chỉnh sửa">
                                  <IconButton size="small" onClick={() => openEdit(alloc)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Chuyển lớp">
                                  <IconButton size="small" color="warning" onClick={() => openTransfer(alloc)}>
                                    <SwapHorizIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            <Tooltip title="Xóa biên bản">
                              <IconButton size="small" color="error" onClick={() => setDeleteTarget(alloc)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ]);
              })()}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
