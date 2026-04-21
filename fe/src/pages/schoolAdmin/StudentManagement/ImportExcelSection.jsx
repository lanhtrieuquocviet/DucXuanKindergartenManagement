import { Paper, Stack, Box, Typography, Button, CircularProgress } from '@mui/material';
import { FileDownload as FileDownloadIcon, UploadFile as UploadFileIcon } from '@mui/icons-material';

const ImportExcelSection = ({
  importInputRef,
  onDownloadTemplate,
  onImportExcel,
  importing,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2.5,
        p: 2,
        borderRadius: 2,
        border: '1px dashed',
        borderColor: 'primary.light',
        bgcolor: '#f8fbff',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="primary.main">
            Import danh sách học sinh từ Excel
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Dùng file mẫu chuẩn để import nhanh và hạn chế lỗi dữ liệu.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={onDownloadTemplate}
          >
            Tải mẫu Excel
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={onImportExcel}
          />
          <Button
            variant="contained"
            color="secondary"
            startIcon={importing ? <CircularProgress color="inherit" size={16} /> : <UploadFileIcon />}
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? 'Đang import...' : 'Import Excel'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default ImportExcelSection;
