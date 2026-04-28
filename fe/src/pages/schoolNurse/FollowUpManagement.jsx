import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { getHealthCheckRecords, updateHealthCheck } from "../../service/health.api";
import { toast } from "react-toastify";

function FollowUpManagement() {
  const navigate = useNavigate();
  const [followUpRecords, setFollowUpRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [followUpDate, setFollowUpDate] = useState("");

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const response = await getHealthCheckRecords({ hasFollowUp: true });
      const records = response.data?.data || [];
      
      // Filter records with followUpDate
      const filtered = records.filter(
        (r) => r.followUpDate && new Date(r.followUpDate) > new Date()
      );
      
      // Sort by followUpDate
      filtered.sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));
      setFollowUpRecords(filtered);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to fetch follow-up records";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = (record) => {
    setSelectedRecord(record);
    setFollowUpDate(record.followUpDate?.split("T")[0] || "");
    setOpenDialog(true);
  };

  const handleSaveFollowUp = async () => {
    if (!followUpDate) {
      toast.error("Vui lòng nhập ngày tái khám");
      return;
    }

    try {
      await updateHealthCheck(selectedRecord._id, {
        followUpDate: followUpDate,
        generalStatus: selectedRecord.generalStatus,
      });
      toast.success("Cập nhật lịch tái khám thành công");
      setOpenDialog(false);
      fetchFollowUps();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update follow-up");
    }
  };

  const isOverdue = (date) => {
    return new Date(date) < new Date();
  };

  const daysUntilFollowUp = (date) => {
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <h2 sx={{ mb: 3 }}>📅 Quản Lý Lịch Tái Khám Sức Khỏe</h2>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f3f4f6" }}>
            <TableRow>
              <TableCell fontWeight="bold">Học Sinh</TableCell>
              <TableCell align="center">Lần Khám Cuối</TableCell>
              <TableCell align="center">Trạng Thái Cuối</TableCell>
              <TableCell align="center">Ngày Tái Khám</TableCell>
              <TableCell align="center">Thời Gian Còn Lại</TableCell>
              <TableCell align="center">Thao Tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {followUpRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  Không có lịch tái khám sắp tới
                </TableCell>
              </TableRow>
            ) : (
              followUpRecords.map((record) => {
                const overdue = isOverdue(record.followUpDate);
                const daysLeft = daysUntilFollowUp(record.followUpDate);
                return (
                  <TableRow key={record._id} sx={{ backgroundColor: overdue ? "#fff3cd" : "inherit" }}>
                    <TableCell>{record.studentId?.name || "N/A"}</TableCell>
                    <TableCell align="center">
                      {new Date(record.checkDate).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={record.generalStatus}
                        color={
                          record.generalStatus === "healthy"
                            ? "success"
                            : record.generalStatus === "monitor"
                            ? "warning"
                            : "error"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {new Date(record.followUpDate).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          overdue
                            ? `Quá hạn ${Math.abs(daysLeft)} ngày`
                            : daysLeft === 0
                            ? "Hôm nay"
                            : `Còn ${daysLeft} ngày`
                        }
                        color={overdue ? "error" : daysLeft <= 3 ? "warning" : "default"}
                        variant={overdue ? "filled" : "outlined"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          size="small"
                          onClick={() => handleReschedule(record)}
                          variant="outlined"
                        >
                          Lên Lịch
                        </Button>
                        <Button
                          size="small"
                          onClick={() => navigate(`/school-nurse/health-create?studentId=${record.studentId._id}`)}
                          variant="contained"
                          color="success"
                        >
                          Khám Lại
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Reschedule Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Lên Lại Lịch Tái Khám</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ mb: 2 }}>
            <strong>Học Sinh:</strong> {selectedRecord?.studentId?.name}
          </Box>
          <TextField
            fullWidth
            type="date"
            label="Ngày Tái Khám Mới"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: new Date().toISOString().split("T")[0] }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button onClick={handleSaveFollowUp} variant="contained" color="primary">
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FollowUpManagement;
