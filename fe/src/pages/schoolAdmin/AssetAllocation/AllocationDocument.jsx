import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { formatDate } from './AllocationUtils';

function AllocationDocument({ allocation, onClose }) {
  if (!allocation) return null;
  const { documentCode, className, teacherName, teacherPosition, handoverByName, handoverByPosition, handoverDate, academicYear, assets, extraAssets, notes } = allocation;

  return (
    <Dialog open fullScreen>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Biên bản bàn giao tài sản — {documentCode}</Typography>
        <Button onClick={onClose} startIcon={<ArrowBackIcon />}>Đóng</Button>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ maxWidth: 860, mx: 'auto', p: { xs: 1, sm: 2 }, fontFamily: 'Times New Roman, serif', fontSize: 14 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 'bold' }}>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 'bold' }}>Độc lập - Tự do - Hạnh phúc</Typography>
            <Box sx={{ borderBottom: '2px solid black', width: 200, mx: 'auto', mb: 1 }} />
            <Typography sx={{ fontSize: 15, fontWeight: 'bold', mt: 2, textTransform: 'uppercase' }}>
              Biên bản bàn giao tài sản lớp mẫu giáo
            </Typography>
            {className && <Typography sx={{ fontWeight: 'bold', fontSize: 14 }}>{className}</Typography>}
            <Typography sx={{ fontStyle: 'italic' }}>Đức Xuân, ngày {formatDate(handoverDate)}</Typography>
          </Box>

          {/* Parties */}
          <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>I/ Thành phần:</Typography>
          <Typography>1. {handoverByName || '____________________'} — Chức vụ: {handoverByPosition}</Typography>
          <Typography>2. {teacherName || '____________________'} — Chức vụ: {teacherPosition}</Typography>

          <Typography sx={{ fontWeight: 'bold', mt: 1, mb: 0.5 }}>II/ Lý do bàn giao:</Typography>
          <Typography>Bàn giao tài sản có trong lớp học{academicYear ? ` năm học ${academicYear}` : ''}.</Typography>

          <Typography sx={{ fontWeight: 'bold', mt: 1, mb: 0.5 }}>III/ Nội dung bàn giao:</Typography>

          {/* Assets table */}
          <Table size="small" sx={{ mb: 2, border: '1px solid #000', '& td,& th': { border: '1px solid #000', py: 0.4, px: 0.8, fontSize: 13 } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.200' }}>
                <TableCell align="center">TT</TableCell>
                <TableCell align="center">Mã số</TableCell>
                <TableCell>Tên thiết bị</TableCell>
                <TableCell align="center">ĐVT</TableCell>
                <TableCell align="center">SL</TableCell>
                <TableCell align="center">Đối tượng SD</TableCell>
                <TableCell>Ghi chú</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                let tt = 0;
                let lastCat = null;
                return assets.map((a, i) => {
                  tt++;
                  const rows = [];
                  if (a.category && a.category !== lastCat) {
                    lastCat = a.category;
                    rows.push(
                      <TableRow key={`cat-${i}`} sx={{ bgcolor: 'grey.100' }}>
                        <TableCell colSpan={7} sx={{ fontWeight: 'bold', fontSize: 13 }}>
                          {a.category}
                        </TableCell>
                      </TableRow>
                    );
                  }
                  rows.push(
                    <TableRow key={i}>
                      <TableCell align="center">{tt}</TableCell>
                      <TableCell align="center">{a.assetCode}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell align="center">{a.unit}</TableCell>
                      <TableCell align="center">{a.quantity}</TableCell>
                      <TableCell align="center">{a.targetUser}</TableCell>
                      <TableCell>{a.notes}</TableCell>
                    </TableRow>
                  );
                  return rows;
                });
              })()}
            </TableBody>
          </Table>

          {/* Bảng thiết bị ngoài thông tư */}
          {extraAssets?.length > 0 && (
            <>
              <Typography sx={{ fontWeight: 'bold', mt: 2, mb: 0.5 }}>
                CÁC THIẾT BỊ TÀI SẢN KHÁC NGOÀI THÔNG TƯ
              </Typography>
              <Table size="small" sx={{ mb: 2, border: '1px solid #000', '& td,& th': { border: '1px solid #000', py: 0.4, px: 0.8, fontSize: 13 } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.200' }}>
                    <TableCell align="center">TT</TableCell>
                    <TableCell>Tên đồ dùng, đồ chơi thiết bị</TableCell>
                    <TableCell align="center">ĐV tính</TableCell>
                    <TableCell align="center">Số lượng</TableCell>
                    <TableCell align="center">Đối tượng sử dụng</TableCell>
                    <TableCell>Ghi chú</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {extraAssets.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell align="center">{i + 1}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell align="center">{a.unit}</TableCell>
                      <TableCell align="center">{a.quantity}</TableCell>
                      <TableCell align="center">{a.targetUser}</TableCell>
                      <TableCell>{a.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}

          {notes && (
            <Typography sx={{ fontStyle: 'italic', mb: 2 }}>Ghi chú: {notes}</Typography>
          )}

          {/* Signatures */}
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 4, textAlign: 'center' }}>
            <Box>
              <Typography sx={{ fontWeight: 'bold' }}>XÁC NHẬN NHÀ TRƯỜNG</Typography>
              <Typography sx={{ fontStyle: 'italic', fontSize: 12 }}>(Hiệu trưởng)</Typography>
              <Typography sx={{ mt: 4 }}>{handoverByName}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 'bold' }}>NGƯỜI BÀN GIAO</Typography>
              <Typography sx={{ fontStyle: 'italic', fontSize: 12 }}>&nbsp;</Typography>
              <Typography sx={{ mt: 4 }}>&nbsp;</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 'bold' }}>NGƯỜI NHẬN BÀN GIAO</Typography>
              <Typography sx={{ fontStyle: 'italic', fontSize: 12 }}>(Giáo viên)</Typography>
              <Typography sx={{ mt: 4 }}>{teacherName}</Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default AllocationDocument;
