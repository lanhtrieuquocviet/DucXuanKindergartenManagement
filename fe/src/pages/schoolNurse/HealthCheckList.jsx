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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { getHealthCheckRecords, deleteHealthCheck, updateHealthCheck } from "../../service/health.api";
import { toast } from "react-toastify";

function HealthCheckList() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await getHealthCheckRecords();
      setRecords(response.data?.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to fetch records";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn chắc chắn muốn xóa bản ghi này?")) {
      try {
        await deleteHealthCheck(id);
        setRecords(records.filter((r) => r._id !== id));
        toast.success("Xóa thành công");
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete");
      }
    }
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setEditData({ generalStatus: record.generalStatus, notes: record.notes });
    setOpenDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateHealthCheck(selectedRecord._id, editData);
      fetchRecords();
      setOpenDialog(false);
      toast.success("Cập nhật thành công");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "success";
      case "monitor":
        return "warning";
      case "concerning":
        return "error";
      default:
        return "default";
    }
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

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <h2>📋 Danh Sách Khám Sức Khỏe</h2>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => navigate("/school-nurse/health-create")}
        >
          Thêm Khám Mới
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f3f4f6" }}>
            <TableRow>
              <TableCell fontWeight="bold">Học Sinh</TableCell>
              <TableCell align="center">Ngày Khám</TableCell>
              <TableCell align="center">Cân Nặng (kg)</TableCell>
              <TableCell align="center">Chiều Cao (cm)</TableCell>
              <TableCell align="center">Nhiệt Độ (°C)</TableCell>
              <TableCell align="center">Trạng Thái</TableCell>
              <TableCell align="center">Thao Tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  Không có bản ghi khám sức khỏe
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record._id} hover>
                  <TableCell>{record.studentId?.name || "N/A"}</TableCell>
                  <TableCell align="center">
                    {new Date(record.checkDate).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell align="center">{record.weight || "-"}</TableCell>
                  <TableCell align="center">{record.height || "-"}</TableCell>
                  <TableCell align="center">{record.temperature || "-"}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={record.generalStatus}
                      color={getStatusColor(record.generalStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(record)}
                        variant="outlined"
                      >
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        color="error"
                        onClick={() => handleDelete(record._id)}
                        variant="outlined"
                      >
                        Xóa
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chỉnh Sửa Bản Ghi</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            select
            label="Trạng Thái"
            value={editData.generalStatus || ""}
            onChange={(e) => setEditData({ ...editData, generalStatus: e.target.value })}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="healthy">Khỏe Mạnh</option>
            <option value="monitor">Cần Theo Dõi</option>
            <option value="concerning">Đáng Lo Ngại</option>
          </TextField>
          <TextField
            fullWidth
            label="Ghi Chú"
            value={editData.notes || ""}
            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default HealthCheckList;
