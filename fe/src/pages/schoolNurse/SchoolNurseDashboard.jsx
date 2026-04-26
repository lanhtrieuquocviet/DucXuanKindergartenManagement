import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import RoleLayout from "../../layouts/RoleLayout";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Button,
} from "@mui/material";
import {
  LocalHospital as HealthIcon,
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingIcon,
} from "@mui/icons-material";
import { getHealthStatistics } from "../../service/health.api";

function SchoolNurseDashboard() {
  const { user, isInitializing, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate user role
  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes("SchoolNurse") && !userRoles.includes("SchoolAdmin")) {
      navigate("/", { replace: true });
    }
  }, [navigate, user, isInitializing]);

  // Fetch statistics
  useEffect(() => {
    if (user?.roles?.length > 0) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getHealthStatistics();
      setStats(response.data?.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  };


  if (isInitializing) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  const userName = user?.fullName || user?.username || "Điều dưỡng";

  return (
    <Box sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Statistics Cards */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2} sx={{ bgColor: "#f0f9ff" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <HealthIcon sx={{ fontSize: 28, color: "#3b82f6", mr: 1 }} />
                      <Typography variant="caption" color="textSecondary">
                        Tổng Khám
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700}>
                      {stats?.totalRecords || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2} sx={{ bgColor: "#f0fdf4" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <HealthyIcon sx={{ fontSize: 28, color: "#10b981", mr: 1 }} />
                      <Typography variant="caption" color="textSecondary">
                        Khỏe Mạnh
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700} sx={{ color: "#10b981" }}>
                      {stats?.statistics?.healthy || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2} sx={{ bgColor: "#fffbeb" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <TrendingIcon sx={{ fontSize: 28, color: "#f59e0b", mr: 1 }} />
                      <Typography variant="caption" color="textSecondary">
                        Cần Theo Dõi
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700} sx={{ color: "#f59e0b" }}>
                      {stats?.statistics?.monitor || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2} sx={{ bgColor: "#fef2f2" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <WarningIcon sx={{ fontSize: 28, color: "#ef4444", mr: 1 }} />
                      <Typography variant="caption" color="textSecondary">
                        Đáng Lo Ngại
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700} sx={{ color: "#ef4444" }}>
                      {stats?.statistics?.concerning || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Quick Actions */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  🚀 Tác Vụ Nhanh
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate("/school-nurse/health-create")}
                  >
                    ➕ Thêm Khám Mới
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/school-nurse/health-list")}
                  >
                    👁️ Xem Tất Cả Khám
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/school-nurse/follow-up")}
                  >
                    📞 Cần Theo Dõi
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card elevation={2} sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  📊 Hướng Dẫn Sử Dụng
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2" component="li">
                    Sử dụng <strong>Tạo Khám Mới</strong> để ghi nhận thông tin khám sức khỏe của học sinh
                  </Typography>
                  <Typography variant="body2" component="li">
                    Xem <strong>Danh Sách Khám</strong> để quản lý toàn bộ bản khám
                  </Typography>
                  <Typography variant="body2" component="li">
                    Kiểm tra <strong>Cần Theo Dõi</strong> để xem học sinh cần khám lại
                  </Typography>
                  <Typography variant="body2" component="li">
                    Tạo <strong>Báo Cáo</strong> để xuất dữ liệu khám sức khỏe định kỳ
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </>
        )}
      </Box>
  );
}

export default SchoolNurseDashboard;
