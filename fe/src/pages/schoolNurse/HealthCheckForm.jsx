import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Stack,
  Card,
  CardContent,
  CardHeader,
  Divider,
} from "@mui/material";
import { ArrowBack as BackIcon } from "@mui/icons-material";
import { createHealthCheck, updateHealthCheck, getHealthCheckById } from "../../service/health.api";
import { toast } from "react-toastify";
import api from "../../service/api";

function HealthCheckForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(!!id);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    studentId: "",
    checkDate: new Date().toISOString().split("T")[0],
    height: "",
    weight: "",
    temperature: "",
    bloodPressure: "",
    heartRate: "",
    vision: "",
    teeth: "",
    skin: "",
    allergies: "",
    medications: "",
    chronicDiseases: "",
    notes: "",
    generalStatus: "healthy",
    recommendations: "",
    followUpDate: "",
  });

  useEffect(() => {
    fetchStudents();
    if (id) {
      fetchRecord();
    }
  }, [id]);

  const fetchStudents = async () => {
    try {
      const response = await api.get("/api/students");
      setStudents(response.data?.data || []);
    } catch (err) {
      toast.error("Failed to load students");
    }
  };

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const response = await getHealthCheckById(id);
      const record = response.data?.data;
      setFormData({
        studentId: record.studentId?._id || record.studentId,
        checkDate: record.checkDate?.split("T")[0] || "",
        height: record.height || "",
        weight: record.weight || "",
        temperature: record.temperature || "",
        bloodPressure: record.bloodPressure || "",
        heartRate: record.heartRate || "",
        vision: record.vision || "",
        teeth: record.teeth || "",
        skin: record.skin || "",
        allergies: Array.isArray(record.allergies) ? record.allergies.join(", ") : record.allergies || "",
        medications: Array.isArray(record.medications) ? record.medications.join(", ") : record.medications || "",
        chronicDiseases: record.chronicDiseases || "",
        notes: record.notes || "",
        generalStatus: record.generalStatus || "healthy",
        recommendations: record.recommendations || "",
        followUpDate: record.followUpDate?.split("T")[0] || "",
      });
    } catch (err) {
      toast.error("Failed to load record");
      navigate("/school-nurse/health-list");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId) {
      toast.error("Vui lòng chọn học sinh");
      return;
    }

    try {
      setLoading(true);
      const submitData = {
        ...formData,
        height: parseFloat(formData.height) || 0,
        weight: parseFloat(formData.weight) || 0,
        temperature: parseFloat(formData.temperature) || 0,
        heartRate: parseInt(formData.heartRate) || 0,
        allergies: formData.allergies ? formData.allergies.split(",").map((a) => a.trim()) : [],
        medications: formData.medications ? formData.medications.split(",").map((m) => m.trim()) : [],
      };

      if (id) {
        await updateHealthCheck(id, submitData);
        toast.success("Cập nhật khám sức khỏe thành công");
      } else {
        await createHealthCheck(submitData);
        toast.success("Thêm khám sức khỏe thành công");
      }
      navigate("/school-nurse/health-list");
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra");
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

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Button startIcon={<BackIcon />} onClick={() => navigate("/school-nurse/health-list")}>
          Quay Lại
        </Button>
        <h2>{id ? "Chỉnh Sửa Khám Sức Khỏe" : "Thêm Khám Sức Khỏe Mới"}</h2>
      </Stack>

      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3 }}>
          {/* Basic Info */}
          <Card sx={{ mb: 3 }}>
            <CardHeader title="📋 Thông Tin Cơ Bản" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Học Sinh"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                    SelectProps={{ native: true }}
                  >
                    <option value="">-- Chọn Học Sinh --</option>
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Ngày Khám"
                    name="checkDate"
                    value={formData.checkDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Vitals */}
          <Card sx={{ mb: 3 }}>
            <CardHeader title="💓 Các Chỉ Số Sức Khỏe" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Chiều Cao (cm)"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    inputProps={{ step: "0.1", min: "0" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cân Nặng (kg)"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    inputProps={{ step: "0.1", min: "0" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Nhiệt Độ (°C)"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    inputProps={{ step: "0.1", min: "0", max: "45" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Huyết Áp"
                    name="bloodPressure"
                    value={formData.bloodPressure}
                    onChange={handleChange}
                    placeholder="VD: 120/80"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Nhịp Tim (bpm)"
                    name="heartRate"
                    value={formData.heartRate}
                    onChange={handleChange}
                    inputProps={{ min: "0", max: "200" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Thị Lực"
                    name="vision"
                    value={formData.vision}
                    onChange={handleChange}
                    placeholder="VD: 20/20"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Health Details */}
          <Card sx={{ mb: 3 }}>
            <CardHeader title="🦷 Chi Tiết Sức Khỏe" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Răng"
                    name="teeth"
                    value={formData.teeth}
                    onChange={handleChange}
                    multiline
                    rows={2}
                    placeholder="VD: Sạch sẽ, không có sâu"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Da"
                    name="skin"
                    value={formData.skin}
                    onChange={handleChange}
                    multiline
                    rows={2}
                    placeholder="VD: Bình thường, không có vẩy"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Di Ứng (cách nhau bằng dấu phẩy)"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="VD: Trứng, sữa"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Thuốc Đang Dùng (cách nhau bằng dấu phẩy)"
                    name="medications"
                    value={formData.medications}
                    onChange={handleChange}
                    placeholder="VD: Paracetamol, Vitamin D"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bệnh Man Tính"
                    name="chronicDiseases"
                    value={formData.chronicDiseases}
                    onChange={handleChange}
                    multiline
                    rows={2}
                    placeholder="VD: Không có"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Assessment */}
          <Card sx={{ mb: 3 }}>
            <CardHeader title="📊 Đánh Giá" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Trạng Thái Chung"
                    name="generalStatus"
                    value={formData.generalStatus}
                    onChange={handleChange}
                    SelectProps={{ native: true }}
                  >
                    <option value="healthy">👍 Khỏe Mạnh</option>
                    <option value="monitor">⚠️ Cần Theo Dõi</option>
                    <option value="concerning">❌ Đáng Lo Ngại</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Ngày Tái Khám"
                    name="followUpDate"
                    value={formData.followUpDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Khuyến Nghị"
                    name="recommendations"
                    value={formData.recommendations}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    placeholder="VD: Nên uống thêm nước, tiếp tục theo dõi"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ghi Chú"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={() => navigate("/school-nurse/health-list")} variant="outlined">
              Hủy
            </Button>
            <Button type="submit" variant="contained" color="primary">
              {id ? "Cập Nhật" : "Thêm"}
            </Button>
          </Stack>
        </Paper>
      </form>
    </Box>
  );
}

export default HealthCheckForm;
