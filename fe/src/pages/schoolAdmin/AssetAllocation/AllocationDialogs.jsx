import React from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Popover,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { formatDate } from './AllocationUtils';

export function InfoPopover({ anchor, onClose }) {
  if (!anchor) return null;
  const a = anchor.alloc;
  return (
    <Popover
      open={Boolean(anchor)}
      anchorEl={anchor?.el}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { sx: { p: 2, minWidth: 240 } } }}
    >
      <Stack spacing={1.5}>
        <Typography variant="subtitle2" fontWeight={700}>Thông tin biên bản</Typography>
        <Box>
          <Typography variant="caption" color="text.secondary">Người tạo</Typography>
          <Typography variant="body2">{a.createdBy?.fullName || a.createdBy?.username || '—'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Ngày tạo</Typography>
          <Typography variant="body2">{a.createdAt ? new Date(a.createdAt).toLocaleString('vi-VN') : '—'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Người xác nhận</Typography>
          <Typography variant="body2">
            {a.confirmedBy?.fullName || a.confirmedBy?.username || <span style={{ color: '#ed6c02' }}>Chưa xác nhận</span>}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Ngày xác nhận bàn giao</Typography>
          <Typography variant="body2">
            {a.confirmedAt
              ? new Date(a.confirmedAt).toLocaleString('vi-VN')
              : <span style={{ color: '#ed6c02' }}>Chưa xác nhận</span>}
          </Typography>
        </Box>
      </Stack>
    </Popover>
  );
}

export function RoomPickerDialog({ open, onClose, loadingRooms, roomList, assignedRoomIds, pickedRoom, setPickedRoom, handleImportFromRoom, loadingRoomAssets }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Nhập tài sản từ phòng học</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Chọn phòng để tự động điền danh sách tài sản vào biên bản.
        </Typography>
        {loadingRooms ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} /></Box>
        ) : (
          <Stack spacing={1}>
            {roomList.length === 0 && (
              <Typography variant="body2" color="text.secondary">Chưa có phòng nào. Vui lòng thêm phòng ở mục "Quản lý tài sản theo phòng học".</Typography>
            )}
            {roomList.map((room) => {
              const isAssigned = !!assignedRoomIds[String(room._id)];
              const assignedTo = assignedRoomIds[String(room._id)]?.className;
              return (
                <Box
                  key={room._id}
                  onClick={() => !isAssigned && setPickedRoom(room)}
                  sx={{
                    p: 1.5, border: '2px solid', borderRadius: 1,
                    cursor: isAssigned ? 'not-allowed' : 'pointer',
                    borderColor: isAssigned
                      ? 'warning.main'
                      : pickedRoom?._id === room._id ? 'primary.main' : 'divider',
                    bgcolor: isAssigned
                      ? 'warning.50'
                      : pickedRoom?._id === room._id ? 'primary.50' : 'transparent',
                    opacity: isAssigned ? 0.7 : 1,
                    '&:hover': !isAssigned ? { borderColor: 'primary.main', bgcolor: 'action.hover' } : {},
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{room.roomName}</Typography>
                      {room.zone && <Typography variant="caption" color="text.secondary">Khu {room.zone}</Typography>}
                    </Box>
                    <Stack alignItems="flex-end" spacing={0.25}>
                      {isAssigned ? (
                        <Chip
                          label={`Đã bàn giao: ${assignedTo}`}
                          color="warning"
                          size="small"
                          sx={{ fontSize: 10, height: 20 }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">{room.totalTypes || 0} loại tài sản</Typography>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button
          variant="contained"
          onClick={handleImportFromRoom}
          disabled={!pickedRoom || loadingRoomAssets}
        >
          {loadingRoomAssets ? <CircularProgress size={18} /> : 'Nhập tài sản'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function TransferDialog({ open, onClose, isMobile, transferTarget, transferClassOptions, transferForm, setTransferForm, handleTransfer, saving }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle>Chuyển giao tài sản sang lớp khác</DialogTitle>
      <DialogContent dividers>
        <Stack gap={2} pt={1}>
          <Typography variant="body2" color="text.secondary">
            Đang chuyển từ lớp: <strong>{transferTarget?.className || '—'}</strong> (GV: {transferTarget?.teacherName || '—'})
          </Typography>
          <Autocomplete
            options={transferClassOptions}
            getOptionLabel={(o) => (typeof o === 'string' ? o : o.className)}
            value={transferClassOptions.find((c) => c._id === transferForm.toClassId) || null}
            onChange={(_, v) => {
              const teacherNames = v?.teachers?.join(', ') || '';
              setTransferForm({
                ...transferForm,
                toClassId: v?._id || '',
                toClassName: v?.className || '',
                toTeacherName: teacherNames,
              });
            }}
            renderInput={(params) => <TextField {...params} label="Lớp nhận *" size="small" />}
            freeSolo={false}
          />
          <TextField
            label="Tên lớp nhận"
            size="small"
            value={transferForm.toClassName}
            InputProps={{ readOnly: true }}
            helperText="Tự động lấy từ lớp đã chọn"
          />
          <TextField
            label="Giáo viên nhận"
            size="small"
            value={transferForm.toTeacherName}
            onChange={(e) => setTransferForm({ ...transferForm, toTeacherName: e.target.value })}
          />
          <TextField
            label="Ngày chuyển"
            type="date"
            size="small"
            value={transferForm.transferDate}
            onChange={(e) => setTransferForm({ ...transferForm, transferDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Ghi chú"
            multiline
            minRows={2}
            size="small"
            value={transferForm.note}
            onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Hủy</Button>
        <Button variant="contained" color="warning" onClick={handleTransfer} disabled={saving}>
          {saving ? <CircularProgress size={18} /> : 'Xác nhận chuyển giao'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function HistoryDialog({ open, onClose, isMobile, historyTarget, transferHistoryRows }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle>Lịch sử chuyển giao — {historyTarget?.documentCode}</DialogTitle>
      <DialogContent dividers>
        {!transferHistoryRows?.length ? (
          <Typography color="text.secondary">Chưa có lịch sử chuyển giao.</Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 500 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>#</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Ngày chuyển</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Từ lớp</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Sang lớp</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>GV cũ</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>GV mới</TableCell>
                  <TableCell>Ghi chú</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transferHistoryRows.map((h, i) => (
                  <TableRow key={h._idx || i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(h.transferDate)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{h.fromClassName || '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{h.toClassName || '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{h.fromTeacherName || '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{h.toTeacherName || '—'}</TableCell>
                    <TableCell>{h.note || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}
