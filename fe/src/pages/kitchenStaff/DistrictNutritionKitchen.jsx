import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  listDistrictNutritionPlans,
  downloadDistrictRegulationFile,
  getAcademicYears,
} from "../../service/menu.api";
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import { FileDownload as FileDownloadIcon } from "@mui/icons-material";

function formatDMY(iso) {
  if (!iso || typeof iso !== "string") return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export default function DistrictNutritionKitchen() {
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState(0);
  const [activePlans, setActivePlans] = useState([]);
  const [upcomingPlans, setUpcomingPlans] = useState([]);
  const [historyPlans, setHistoryPlans] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [viewPlan, setViewPlan] = useState(null);

  const loadDistrict = useCallback(async (yearId) => {
    try {
      const res = await listDistrictNutritionPlans(yearId && yearId !== "all" ? { academicYearId: yearId } : {});
      const data = res?.data;
      setActivePlans(Array.isArray(data?.active) ? data.active : []);
      setUpcomingPlans(Array.isArray(data?.upcoming) ? data.upcoming : []);
      setHistoryPlans(Array.isArray(data?.history) ? data.history : []);
    } catch {
      toast.error("Không thể tải kế hoạch dinh dưỡng theo sở");
    }
  }, []);

  const loadAll = useCallback(async (yearId) => {
    setLoading(true);
    try {
      await loadDistrict(yearId);
    } finally {
      setLoading(false);
    }
  }, [loadDistrict]);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const yearsRes = await getAcademicYears();
        const years = yearsRes?.data || [];
        setAcademicYears(years);
        const active = years.find(y => y.status === 'active');
        if (active) {
          setSelectedYearId(active._id);
          loadAll(active._id);
        } else {
          setSelectedYearId("all");
          loadAll("all");
        }
      } catch {
        setSelectedYearId("all");
        loadAll("all");
      }
    };
    fetchInitial();
  }, [loadAll]);

  const handleYearChange = (e) => {
    const yId = e.target.value;
    setSelectedYearId(yId);
    loadAll(yId);
  };

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "nutrition_plan_updated_at") {
        loadAll(selectedYearId);
      }
    };
    const onPlanUpdated = () => loadAll(selectedYearId);
    window.addEventListener("storage", onStorage);
    window.addEventListener("nutrition_plan_updated", onPlanUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("nutrition_plan_updated", onPlanUpdated);
    };
  }, [loadAll]);

  const active = activePlans[0] || null;

  const filteredHistory = historyPlans;

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} mb={2}>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Năm học</InputLabel>
          <Select
            label="Năm học"
            value={selectedYearId}
            onChange={handleYearChange}
          >
            <MenuItem value="all">Tất cả năm học</MenuItem>
            {academicYears.map((y) => (
              <MenuItem key={y._id} value={y._id}>
                {y.yearName} {y.status === 'active' ? "(Hiện tại)" : ""}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
      </Stack>

      <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
        <Tab label={`Đang áp dụng (${activePlans.length})`} sx={{ textTransform: "none", fontWeight: 600 }} />
        <Tab label={`Kế hoạch sắp tới (${upcomingPlans.length})`} sx={{ textTransform: "none", fontWeight: 600 }} />
        <Tab label={`Lịch sử (${historyPlans.length})`} sx={{ textTransform: "none", fontWeight: 600 }} />
      </Tabs>

      {loading ? (
        <Stack alignItems="center" py={6}>
          <CircularProgress size={32} />
        </Stack>
      ) : mainTab === 0 ? (
        <Box>
          {!active ? (
            <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: "1px dashed", borderColor: "divider", textAlign: "center" }}>
              <Typography color="text.secondary">Chưa có kế hoạch đang áp dụng từ phía ban giám hiệu.</Typography>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Ngày bắt đầu áp dụng: <strong>{formatDMY(active.startDate)}</strong>
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                {active.regulationFile?.originalName && (
                  <Button
                    size="small"
                    startIcon={<FileDownloadIcon />}
                    onClick={() =>
                      downloadDistrictRegulationFile(active._id).catch((err) =>
                        toast.error(err.message || "Tải file thất bại")
                      )
                    }
                    sx={{ textTransform: "none" }}
                  >
                    Tải file quy định: {active.regulationFile.originalName}
                  </Button>
                )}
              </Stack>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                Bảng chỉ tiêu theo kế hoạch
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "grey.50" }}>
                      <TableCell>Chỉ tiêu</TableCell>
                      <TableCell align="right">Min</TableCell>
                      <TableCell align="right">Max</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(Array.isArray(active.items) ? active.items : []).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="right">{row.min}</TableCell>
                        <TableCell align="right">{row.max}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      ) : mainTab === 1 ? (
        <Box>
          {upcomingPlans.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              Chưa có kế hoạch sắp tới.
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#dbeafe" }}>
                    <TableCell>Ngày bắt đầu</TableCell>
                    <TableCell>File quy định</TableCell>
                    <TableCell align="center">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {upcomingPlans.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell>{formatDMY(p.startDate)}</TableCell>
                      <TableCell>{p.regulationFile?.originalName || "—"}</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          color="info"
                          onClick={() => setViewPlan(p)}
                          sx={{ textTransform: "none" }}
                        >
                          Xem chỉ tiêu
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      ) : (
        <Box>
          <Box mb={2} />

          {filteredHistory.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              Chưa có kế hoạch nào trong lịch sử.
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#dbeafe" }}>
                    <TableCell>Ngày bắt đầu</TableCell>
                    <TableCell>Ngày kết thúc</TableCell>
                    <TableCell>File quy định</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHistory.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell>{formatDMY(p.startDate)}</TableCell>
                      <TableCell>{formatDMY(p.endDate)}</TableCell>
                      <TableCell>{p.regulationFile?.originalName || "—"}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button
                            size="small"
                            variant="outlined"
                            color="info"
                            onClick={() => setViewPlan(p)}
                            sx={{ textTransform: "none" }}
                          >
                            Xem chỉ tiêu
                          </Button>
                          {p.regulationFile?.storedName && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() =>
                                downloadDistrictRegulationFile(p._id).catch((err) =>
                                  toast.error(err.message || "Tải file thất bại")
                                )
                              }
                            >
                              <FileDownloadIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      <Dialog open={!!viewPlan} onClose={() => setViewPlan(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Chỉ tiêu kế hoạch đã kết thúc</DialogTitle>
        <DialogContent dividers>
          {viewPlan && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formatDMY(viewPlan.startDate)} — {formatDMY(viewPlan.endDate)}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Chỉ tiêu</TableCell>
                    <TableCell align="right">Min</TableCell>
                    <TableCell align="right">Max</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(Array.isArray(viewPlan.items) ? viewPlan.items : []).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell align="right">{row.min}</TableCell>
                      <TableCell align="right">{row.max}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewPlan(null)} sx={{ textTransform: "none" }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
