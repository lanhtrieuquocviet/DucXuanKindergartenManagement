import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
  Stack,
  Chip,
} from "@mui/material";
import {
  LocalFireDepartment as CalorieIcon,
  LocalHospital as HealthIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { getHealthStatistics } from "../../service/health.api";
import { toast } from "react-toastify";

function HealthCheckDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await getHealthStatistics();
      setStats(response.data?.data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to fetch statistics";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const totalRecords = stats?.totalRecords || 0;
  const healthy = stats?.statistics?.healthy || 0;
  const monitor = stats?.statistics?.monitor || 0;
  const concerning = stats?.statistics?.concerning || 0;
  const followUpNeeded = stats?.followUpNeeded || [];

  const healthPercent = totalRecords > 0 ? (healthy / totalRecords) * 100 : 0;
  const monitorPercent = totalRecords > 0 ? (monitor / totalRecords) * 100 : 0;
  const concerningPercent = totalRecords > 0 ? (concerning / totalRecords) * 100 : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        🏥 Quản Lý Khám Sức Khỏe
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <HealthIcon sx={{ fontSize: 28, color: "#3b82f6", mr: 1 }} />
                <Typography variant="caption" color="textSecondary">
                  Tổng Khám
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700}>
                {totalRecords}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 28, color: "#10b981", mr: 1 }} />
                <Typography variant="caption" color="textSecondary">
                  Khỏe Mạnh
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: "#10b981" }}>
                {healthy}
              </Typography>
              <LinearProgress variant="determinate" value={healthPercent} sx={{ mt: 1 }} />
              <Typography variant="caption">{healthPercent.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <TrendingIcon sx={{ fontSize: 28, color: "#f59e0b", mr: 1 }} />
                <Typography variant="caption" color="textSecondary">
                  Cần Theo Dõi
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: "#f59e0b" }}>
                {monitor}
              </Typography>
              <LinearProgress variant="determinate" value={monitorPercent} sx={{ mt: 1 }} />
              <Typography variant="caption">{monitorPercent.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <WarningIcon sx={{ fontSize: 28, color: "#ef4444", mr: 1 }} />
                <Typography variant="caption" color="textSecondary">
                  Đáng Lo Ngại
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: "#ef4444" }}>
                {concerning}
              </Typography>
              <LinearProgress variant="determinate" value={concerningPercent} sx={{ mt: 1 }} />
              <Typography variant="caption">{concerningPercent.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Follow-up Needed */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} mb={2}>
            📋 Cần Theo Dõi Tiếp Theo
          </Typography>
          {followUpNeeded.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              Không có học sinh cần theo dõi tiếp theo
            </Typography>
          ) : (
            <Stack spacing={2}>
              {followUpNeeded.map((record) => (
                <Card
                  key={record._id}
                  sx={{
                    border: "1px solid #e5e7eb",
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {record.studentId?.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Theo dõi: {new Date(record.followUpDate).toLocaleDateString("vi-VN")}
                    </Typography>
                  </Box>
                  <Chip
                    label={record.generalStatus}
                    color={
                      record.generalStatus === "healthy"
                        ? "success"
                        : record.generalStatus === "monitor"
                          ? "warning"
                          : "error"
                    }
                    variant="outlined"
                    size="small"
                  />
                </Card>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button variant="contained" href="/school-nurse/health-list">
          👁️ Xem Tất Cả Khám
        </Button>
        <Button variant="contained" color="success" href="/school-nurse/health-create">
          ➕ Thêm Khám Mới
        </Button>
      </Box>
    </Box>
  );
}

export default HealthCheckDashboard;
