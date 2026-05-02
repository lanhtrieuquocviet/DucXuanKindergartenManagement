import React from 'react';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  UploadFile as UploadFileIcon,
  Download as DownloadIcon,
  MeetingRoom as MeetingRoomIcon,
} from '@mui/icons-material';
import AssetRowEditor from './AssetRowEditor';
import { emptyAssetRow } from './AllocationUtils';

export function AllocationForm({
  open,
  onClose,
  isMobile,
  editTarget,
  availableClassOptions,
  form,
  setForm,
  allTeachers,
  openRoomPicker,
  downloadTemplate,
  wordInputRef,
  excelInputRef,
  handleWordImport,
  handleExcelImport,
  importing,
  onAssetsChange,
  onMoveAssetToExtra,
  onExtraAssetsChange,
  onMoveExtraToAsset,
  handleSave,
  saving,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={isMobile}>
      <DialogTitle>{editTarget ? 'Chỉnh sửa biên bản bàn giao' : 'Tạo biên bản bàn giao tài sản'}</DialogTitle>
      <DialogContent dividers>
        <Stack gap={2}>
          {/* Row 1: Lớp + Năm học */}
          <Stack direction="row" gap={2} flexWrap="wrap">
            <Autocomplete
              options={availableClassOptions}
              getOptionLabel={(o) => (typeof o === 'string' ? o : o.className)}
              value={availableClassOptions.find((c) => c._id === form.classId) || null}
              onChange={(_, v) => {
                const teacherNames = v?.teachers?.join(', ') || '';
                setForm({
                  ...form,
                  classId: v?._id || '',
                  className: v?.className || '',
                  teacherName: teacherNames,
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Lớp học"
                  size="small"
                  helperText={!editTarget ? 'Ẩn các lớp đã có biên bản đang hoạt động/chờ xác nhận' : ''}
                />
              )}
              sx={{ flex: 1, minWidth: 200 }}
              freeSolo={false}
            />
            <TextField
              label="Năm học"
              size="small"
              value={form.academicYear}
              InputProps={{ readOnly: true }}
              sx={{ width: 140 }}
            />
            <TextField
              label="Ngày bàn giao"
              type="date"
              size="small"
              value={form.handoverDate}
              onChange={(e) => setForm({ ...form, handoverDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 180 }}
            />
          </Stack>

          {/* Row 2: Người giao */}
          <Typography variant="subtitle2" color="text.secondary">Người bàn giao</Typography>
          <Stack direction="row" gap={2} flexWrap="wrap">
            <TextField
              label="Họ và tên người giao"
              size="small"
              value={form.handoverByName}
              onChange={(e) => setForm({ ...form, handoverByName: e.target.value })}
              sx={{ flex: 1, minWidth: 200 }}
              helperText="Tự động lấy từ tài khoản đang đăng nhập"
            />
            <TextField
              label="Chức vụ người giao"
              size="small"
              value={form.handoverByPosition}
              onChange={(e) => setForm({ ...form, handoverByPosition: e.target.value })}
              sx={{ flex: 1, minWidth: 160 }}
            />
          </Stack>

          {/* Row 3: Người nhận */}
          <Typography variant="subtitle2" color="text.secondary">Giáo viên nhận bàn giao</Typography>
          <Stack direction="row" gap={2} flexWrap="wrap">
            <Autocomplete
              options={allTeachers}
              value={form.teacherName}
              onChange={(_, v) => setForm({ ...form, teacherName: v || '' })}
              onInputChange={(_, v) => setForm({ ...form, teacherName: v })}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Họ và tên giáo viên"
                  size="small"
                  helperText="Tự động lấy từ lớp đã chọn, hoặc chọn từ danh sách"
                />
              )}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <TextField
              label="Chức vụ"
              size="small"
              value={form.teacherPosition}
              onChange={(e) => setForm({ ...form, teacherPosition: e.target.value })}
              sx={{ flex: 1, minWidth: 160 }}
            />
          </Stack>

          <Divider />

          {/* Assets theo thông tư */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Typography variant="subtitle2" fontWeight="bold">Danh sách tài sản bàn giao (theo thông tư)</Typography>
            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
              <Tooltip title="Tự động điền danh sách tài sản từ phòng học đã cài đặt">
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  startIcon={<MeetingRoomIcon />}
                  onClick={openRoomPicker}
                >
                  Nhập từ phòng
                </Button>
              </Tooltip>
              <Tooltip title="Tải file Excel mẫu đúng định dạng (2 sheet: Theo thông tư / Ngoài thông tư)">
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<DownloadIcon />}
                  onClick={downloadTemplate}
                >
                  Tải mẫu Excel
                </Button>
              </Tooltip>
              <input ref={wordInputRef} type="file" accept=".doc,.docx" style={{ display: 'none' }} onChange={handleWordImport} />
              <Tooltip title="Import từ file Word (.doc/.docx)">
                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  startIcon={importing ? <CircularProgress size={14} /> : <UploadFileIcon />}
                  onClick={() => wordInputRef.current?.click()}
                  disabled={importing}
                >
                  {importing ? 'Đang đọc...' : 'Word'}
                </Button>
              </Tooltip>
              <input ref={excelInputRef} type="file" accept=".xlsx" style={{ display: 'none' }} onChange={handleExcelImport} />
              <Tooltip title="Import từ file Excel (.xlsx) — dùng mẫu tải về">
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={importing ? <CircularProgress size={14} /> : <UploadFileIcon />}
                  onClick={() => excelInputRef.current?.click()}
                  disabled={importing}
                >
                  {importing ? 'Đang đọc...' : 'Excel'}
                </Button>
              </Tooltip>
            </Stack>
          </Stack>
          <AssetRowEditor
            rows={form.assets}
            onChange={onAssetsChange}
            onMoveToOther={onMoveAssetToExtra}
            moveLabel="Chuyển sang ngoài thông tư"
          />

          <Divider />

          {/* Thiết bị ngoài thông tư */}
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={1}>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                Các thiết bị tài sản khác ngoài thông tư
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tùy chọn — để trống nếu không có
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => setForm({ ...form, extraAssets: [...(form.extraAssets || []), emptyAssetRow()] })}
            >
              Thêm mục
            </Button>
          </Stack>
          {(form.extraAssets?.length > 0) && (
            <AssetRowEditor
              rows={form.extraAssets}
              onChange={onExtraAssetsChange}
              onMoveToOther={onMoveExtraToAsset}
              moveLabel="Chuyển sang theo thông tư"
            />
          )}

          <Divider />
          <TextField
            label="Ghi chú chung"
            multiline
            minRows={2}
            size="small"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Hủy</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} /> : (editTarget ? 'Cập nhật' : 'Tạo biên bản')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
