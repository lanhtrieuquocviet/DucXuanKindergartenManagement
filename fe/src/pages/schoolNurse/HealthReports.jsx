import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Download as DownloadIcon, BarChart as ChartIcon } from "@mui/icons-material";
import { getHealthStatistics, getHealthCheckRecords, exportHealthRecords } from "../../service/health.api";
import { toast } from "react-toastify";

function HealthReports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, recsRes] = await Promise.all([
        getHealthStatistics(),
        getHealthCheckRecords({ limit: 100 }),
      ]);
      setStats(statsRes.data?.data);
      setRecords(recsRes.data?.data || []);
    } catch (err) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await exportHealthRecords({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      // Create CSV file
      const csv = response.data?.data;
      if (csv) {
        const link = document.createElement("a");
        link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
        link.download = `health-records-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        toast.success("Xuất dữ liệu thành công");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Export failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <h2 sx={{ mb: 3 }}>📊 Báo Cáo Sức Khỏe</h2>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: "#e3f2fd", border: "2px solid #2196f3" }}>
              <CardContent>
                <Box sx={{ textAlign: "center" }}>
                  <Box sx={{ fontSize: "2rem", fontWeight: "bold", color: "#2196f3" }}>
                    {stats.totalStudents || 0}
                  </Box>
                  <Box sx={{ color: "#666", fontSize: "0.9rem" }}>Tổng Học Sinh</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: "#e8f5e9", border: "2px solid #4caf50" }}>
              <CardContent>
                <Box sx={{ textAlign: "center" }}>
                  <Box sx={{ fontSize: "2rem", fontWeight: "bold", color: "#4caf50" }}>
                    {stats.healthyCount || 0}
                  </Box>
                  <Box sx={{ color: "#666", fontSize: "0.9rem" }}>Khỏe Mạnh</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: "#fff3e0", border: "2px solid #ff9800" }}>
              <CardContent>
                <Box sx={{ textAlign: "center" }}>
                  <Box sx={{ fontSize: "2rem", fontWeight: "bold", color: "#ff9800" }}>
                    {stats.monitorCount || 0}
                  </Box>
                  <Box sx={{ color: "#666", fontSize: "0.9rem" }}>Cần Theo Dõi</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: "#ffebee", border: "2px solid #f44336" }}>
              <CardContent>
                <Box sx={{ textAlign: "center" }}>
                  <Box sx={{ fontSize: "2rem", fontWeight: "bold", color: "#f44336" }}>
                    {stats.concerningCount || 0}
                  </Box>
                  <Box sx={{ color: "#666", fontSize: "0.9rem" }}>Đáng Lo Ngại</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Follow-up Table */}
      {stats?.followUpNeeded && stats.followUpNeeded.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardHeader 
            title="⚠️ Học Sinh Cần Tái Khám"
            titleTypographyProps={{ variant: "h6" }}
          />
          <Divider />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f3f4f6" }}>
                  <TableRow>
                    <TableCell>Học Sinh</TableCell>
                    <TableCell align="center">Trạng Thái Cuối</TableCell>
                    <TableCell align="center">Ngày Tái Khám</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.followUpNeeded.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>{item.studentId?.name || "N/A"}</TableCell>
                      <TableCell align="center">{item.generalStatus}</TableCell>
                      <TableCell align="center">
                        {new Date(item.followUpDate).toLocaleDateString("vi-VN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Export Section */}
      <Card>
        <CardHeader 
          title="📥 Xuất Dữ Liệu"
          titleTypographyProps={{ variant: "h6" }}
        />
        <Divider />
        <CardContent>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                type="date"
                label="Từ Ngày"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                type="date"
                label="Đến Ngày"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                disabled={loading}
              >
                Xuất CSV
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Records Table */}
      <Card sx={{ mt: 3 }}>
        <CardHeader 
          title="📋 Bản Ghi Gần Đây"
          titleTypographyProps={{ variant: "h6" }}
        />
        <Divider />
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ backgroundColor: "#f3f4f6" }}>
                <TableRow>
                  <TableCell>Học Sinh</TableCell>
                  <TableCell align="center">Ngày Khám</TableCell>
                  <TableCell align="center">Cân Nặng</TableCell>
                  <TableCell align="center">Chiều Cao</TableCell>
                  <TableCell align="center">Nhiệt Độ</TableCell>
                  <TableCell align="center">Trạng Thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.slice(0, 10).map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>{record.studentId?.name || "N/A"}</TableCell>
                    <TableCell align="center">
                      {new Date(record.checkDate).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell align="center">{record.weight || "-"}</TableCell>
                    <TableCell align="center">{record.height || "-"}</TableCell>
                    <TableCell align="center">{record.temperature || "-"}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>
                      {record.generalStatus}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

export default HealthReports;
