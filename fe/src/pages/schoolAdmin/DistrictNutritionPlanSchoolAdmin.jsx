import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import {
  listDistrictNutritionPlans,
  createDistrictNutritionPlan,
  updateDistrictNutritionPlan,
  updateScheduledDistrictNutritionPlan,
  applyScheduledDistrictNutritionPlanNow,
  deleteScheduledDistrictNutritionPlan,
  downloadDistrictRegulationFile,
  getAcademicYears,
  getDistrictNutritionPlanDetail,
} from "../../service/menu.api";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  FileDownload as FileDownloadIcon,
  UploadFile as UploadFileIcon,
} from "@mui/icons-material";

const DEFAULT_ROWS = [
  { id: 1, name: "Calo trung bình/ngày (kcal)", min: 615, max: 726 },
  { id: 2, name: "Đạm (%)", min: 13, max: 20 },
  { id: 3, name: "Béo (%)", min: 25, max: 35 },
  { id: 4, name: "Tinh bột (%)", min: 52, max: 60 },
];

/** YYYY-MM-DD theo Asia/Ho_Chi_Minh (khớp logic backend) */
function todayVNString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDMY(iso) {
  if (!iso || typeof iso !== "string") return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function itemsToRows(items) {
  if (!Array.isArray(items) || !items.length) return DEFAULT_ROWS.map((r) => ({ ...r }));
  return items.map((item, idx) => ({
    id: idx + 1,
    name: item.name,
    min: Number(item.min) || 0,
    max: Number(item.max) || 0,
  }));
}

function rowsToPayload(rows) {
  return rows.map(({ name, min, max }) => ({
    name: String(name || "").trim(),
    min: Number(min),
    max: Number(max),
  }));
}

function isSameMetrics(aRows, bRows) {
  const a = rowsToPayload(aRows || []);
  const b = rowsToPayload(bRows || []);
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].name !== b[i].name || a[i].min !== b[i].min || a[i].max !== b[i].max) {
      return false;
    }
  }
  return true;
}

export default function DistrictNutritionPlanSchoolAdmin() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState(0);
  const [activePlans, setActivePlans] = useState([]);
  const [upcomingPlans, setUpcomingPlans] = useState([]);
  const [historyPlans, setHistoryPlans] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createStart, setCreateStart] = useState("");
  const [createFile, setCreateFile] = useState(null);
  const [createRows, setCreateRows] = useState(() => DEFAULT_ROWS.map((r) => ({ ...r })));
  const [createNewRow, setCreateNewRow] = useState({ name: "", min: "", max: "" });

  const [editRows, setEditRows] = useState([]);
  const [editStart, setEditStart] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [upcomingEditOpen, setUpcomingEditOpen] = useState(false);
  const [upcomingEditSaving, setUpcomingEditSaving] = useState(false);
  const [upcomingEditingId, setUpcomingEditingId] = useState(null);
  const [upcomingEditStart, setUpcomingEditStart] = useState("");
  const [upcomingEditFile, setUpcomingEditFile] = useState(null);
  const [upcomingEditRows, setUpcomingEditRows] = useState(() => DEFAULT_ROWS.map((r) => ({ ...r })));
  const [viewPlan, setViewPlan] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [editNewRow, setEditNewRow] = useState({ name: "", min: "", max: "" });

  const createFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const upcomingEditFileInputRef = useRef(null);

  const active = activePlans[0] || null;
  const originalEditRows = active ? itemsToRows(active.items) : [];
  const hasEditChanges = !!active && (
    editStart !== (active.startDate || "") ||
    !isSameMetrics(editRows, originalEditRows) ||
    !!editFile
  );

  const filteredHistory = historyPlans;

  const load = useCallback(async (yearId) => {
    try {
      setLoading(true);
      const res = await listDistrictNutritionPlans(yearId && yearId !== "all" ? { academicYearId: yearId } : {});
      const data = res?.data;
      setActivePlans(Array.isArray(data?.active) ? data.active : []);
      setUpcomingPlans(Array.isArray(data?.upcoming) ? data.upcoming : []);
      setHistoryPlans(Array.isArray(data?.history) ? data.history : []);
    } catch {
      toast.error("Không thể tải kế hoạch dinh dưỡng theo sở");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const yearsRes = await getAcademicYears();
        const years = yearsRes?.data || [];
        setAcademicYears(years);
        // Default to active year if exists, else "all"
        const active = years.find(y => y.status === 'active');
        if (active) {
          setSelectedYearId(active._id);
          load(active._id);
        } else {
          setSelectedYearId("all");
          load("all");
        }
      } catch {
        setSelectedYearId("all");
        load("all");
      }
    };
    fetchInitial();
  }, [load]);

  const handleYearChange = (e) => {
    const yId = e.target.value;
    setSelectedYearId(yId);
    load(yId);
  };

  useEffect(() => {
    if (active) {
      setEditRows(itemsToRows(active.items));
      setEditStart(active.startDate || "");
      setEditFile(null);
      setEditNewRow({ name: "", min: "", max: "" });
    }
  }, [active?._id, active?.startDate]);

  const openCreate = () => {
    setCreateRows(DEFAULT_ROWS.map((r) => ({ ...r, id: r.id })));
    setCreateNewRow({ name: "", min: "", max: "" });
    setCreateStart("");
    setCreateFile(null);
    if (createFileInputRef.current) createFileInputRef.current.value = "";
    setCreateOpen(true);
  };

  const openUpcomingEdit = (plan) => {
    if (!plan?._id) return;
    setUpcomingEditingId(plan._id);
    setUpcomingEditStart(plan.startDate || "");
    setUpcomingEditRows(itemsToRows(plan.items));
    setUpcomingEditFile(null);
    if (upcomingEditFileInputRef.current) upcomingEditFileInputRef.current.value = "";
    setUpcomingEditOpen(true);
  };

  const handleCreateRowChange = (id, field, value) => {
    setCreateRows((prev) =>
      prev.map((row) => {
        const rowIdx = prev.findIndex((r) => r.id === id);
        if (row.id !== id) return row;
        if (rowIdx >= 0 && rowIdx < 4 && field === "name") return row;
        if (field === "name") return { ...row, name: value };
        const n = Number(value);
        if (Number.isNaN(n)) return row;
        return { ...row, [field]: n };
      })
    );
  };

  const handleEditRowChange = (id, field, value) => {
    setEditRows((prev) =>
      prev.map((row) => {
        const rowIdx = prev.findIndex((r) => r.id === id);
        if (row.id !== id) return row;
        if (rowIdx >= 0 && rowIdx < 4 && field === "name") return row;
        if (field === "name") return { ...row, name: value };
        const n = Number(value);
        if (Number.isNaN(n)) return row;
        return { ...row, [field]: n };
      })
    );
  };

  const handleUpcomingEditRowChange = (id, field, value) => {
    setUpcomingEditRows((prev) =>
      prev.map((row) => {
        const rowIdx = prev.findIndex((r) => r.id === id);
        if (row.id !== id) return row;
        if (rowIdx >= 0 && rowIdx < 4 && field === "name") return row;
        if (field === "name") return { ...row, name: value };
        const n = Number(value);
        if (Number.isNaN(n)) return row;
        return { ...row, [field]: n };
      })
    );
  };

  const validateRows = (rows) => {
    for (const row of rows) {
      if (!String(row.name || "").trim()) {
        toast.error("Tên chỉ tiêu không được để trống");
        return false;
      }
      if (row.max <= row.min) {
        toast.error(`Mục "${row.name}": giá trị tối đa phải lớn hơn tối thiểu`);
        return false;
      }
    }
    return true;
  };

  const handleCreateSubmit = async () => {
    if (!createStart) {
      toast.error("Vui lòng chọn ngày bắt đầu áp dụng");
      return;
    }
    if (!createFile) {
      toast.error("Vui lòng tải lên tệp Word quy định sở");
      return;
    }
    if (!validateRows(createRows)) return;

    try {
      setCreateSaving(true);
      const fd = new FormData();
      fd.append("startDate", createStart);
      fd.append("items", JSON.stringify(rowsToPayload(createRows)));
      fd.append("regulationFile", createFile);
      await createDistrictNutritionPlan(fd);
      localStorage.setItem("nutrition_plan_updated_at", String(Date.now()));
      window.dispatchEvent(new Event("nutrition_plan_updated"));
      toast.success("Đã tạo kế hoạch mới");
      setCreateOpen(false);
      await load(selectedYearId);
      setMainTab(0);
    } catch (e) {
      toast.error(e?.message || e?.data?.message || "Tạo kế hoạch thất bại");
    } finally {
      setCreateSaving(false);
    }
  };

  const handleEditSave = async () => {
    if (!active) return;
    if (!editStart) {
      toast.error("Vui lòng chọn ngày bắt đầu áp dụng");
      return;
    }
    if (!validateRows(editRows)) return;

    try {
      setEditSaving(true);
      const fd = new FormData();
      fd.append("startDate", editStart);
      fd.append("items", JSON.stringify(rowsToPayload(editRows)));
      if (editFile) fd.append("regulationFile", editFile);
      await updateDistrictNutritionPlan(active._id, fd);
      localStorage.setItem("nutrition_plan_updated_at", String(Date.now()));
      window.dispatchEvent(new Event("nutrition_plan_updated"));
      toast.success("Đã cập nhật kế hoạch; phiên bản trước đã lưu vào lịch sử");
      setEditFile(null);
      await load(selectedYearId);
    } catch (e) {
      toast.error(e?.message || e?.data?.message || "Cập nhật thất bại");
    } finally {
      setEditSaving(false);
    }
  };

  const handleUpcomingEditSave = async () => {
    if (!upcomingEditingId) return;
    if (!upcomingEditStart) {
      toast.error("Vui lòng chọn ngày bắt đầu áp dụng");
      return;
    }
    if (!validateRows(upcomingEditRows)) return;
    try {
      setUpcomingEditSaving(true);
      const fd = new FormData();
      fd.append("startDate", upcomingEditStart);
      fd.append("items", JSON.stringify(rowsToPayload(upcomingEditRows)));
      if (upcomingEditFile) fd.append("regulationFile", upcomingEditFile);
      await updateScheduledDistrictNutritionPlan(upcomingEditingId, fd);
      toast.success("Đã cập nhật kế hoạch sắp tới");
      setUpcomingEditOpen(false);
      setUpcomingEditingId(null);
      setUpcomingEditFile(null);
      await load(selectedYearId);
    } catch (e) {
      toast.error(e?.message || e?.data?.message || "Cập nhật kế hoạch sắp tới thất bại");
    } finally {
      setUpcomingEditSaving(false);
    }
  };

  const handleApplyUpcomingNow = async (planId) => {
    if (!planId) return;
    try {
      await applyScheduledDistrictNutritionPlanNow(planId);
      toast.success("Đã áp dụng kế hoạch ngay");
      await load(selectedYearId);
      setMainTab(0);
    } catch (e) {
      toast.error(e?.message || e?.data?.message || "Áp dụng ngay thất bại");
    }
  };

  const handleDeleteUpcoming = async (planId) => {
    if (!planId) return;
    if (!window.confirm("Bạn có chắc muốn xóa kế hoạch sắp tới này?")) return;
    try {
      await deleteScheduledDistrictNutritionPlan(planId);
      toast.success("Đã xóa kế hoạch sắp tới");
      await load(selectedYearId);
    } catch (e) {
      toast.error(e?.message || e?.data?.message || "Xóa kế hoạch thất bại");
    }
  };

  const addCreateRow = () => {
    if (!createNewRow.name.trim()) {
      toast.error("Vui lòng nhập tên mục");
      return;
    }
    const min = Number(createNewRow.min);
    const max = Number(createNewRow.max);
    if (Number.isNaN(min) || Number.isNaN(max) || max <= min) {
      toast.error("Min/Max không hợp lệ");
      return;
    }
    setCreateRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: createNewRow.name.trim(),
        min,
        max,
      },
    ]);
    setCreateNewRow({ name: "", min: "", max: "" });
  };

  const addEditRow = () => {
    if (!editNewRow.name.trim()) {
      toast.error("Vui lòng nhập tên mục");
      return;
    }
    const min = Number(editNewRow.min);
    const max = Number(editNewRow.max);
    if (Number.isNaN(min) || Number.isNaN(max) || max <= min) {
      toast.error("Min/Max không hợp lệ");
      return;
    }
    setEditRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: editNewRow.name.trim(),
        min,
        max,
      },
    ]);
    setEditNewRow({ name: "", min: "", max: "" });
  };

  const openHistoryDetail = async (planId) => {
    if (!planId) return;
    try {
      setViewPlan(null);
      setViewLoading(true);
      const res = await getDistrictNutritionPlanDetail(planId);
      setViewPlan(res?.data || res?.data?.data || null);
    } catch (err) {
      setViewPlan(null);
      toast.error(err?.message || err?.data?.message || "Không thể tải chi tiết kế hoạch");
    } finally {
      setViewLoading(false);
    }
  };

  const renderMetricsTable = (rows, newRow, setNewRow, onRowChange, onAdd, lockNameFirstRows = 0) => (
    <Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Chỉ tiêu</TableCell>
              <TableCell width={120}>Min</TableCell>
              <TableCell width={120}>Max</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((item, idx) => {
              return (
              <TableRow key={item.id}>
                <TableCell>
                  <Typography sx={{ fontWeight: 700 }}>{item.name}</Typography>
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={item.min}
                    onChange={(e) => onRowChange(item.id, "min", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={item.max}
                    onChange={(e) => onRowChange(item.id, "max", e.target.value)}
                  />
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" mb={2}>
        <Paper
          elevation={0}
          sx={{
            background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
            borderRadius: 3,
            width: "100%",
            px: 4,
            py: 3,
            mb: 2,
          }}
        >
          <Typography variant="h5" fontWeight={700} color="white">
            Kế hoạch dinh dưỡng theo sở
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5 }}>
            Thiết lập chỉ tiêu, ngày bắt đầu và tệp quy định của sở. Mỗi lần tạo mới hoặc cập nhật kế hoạch đang áp dụng, phiên bản trước được lưu vào lịch sử (ngày kết thúc phiên bản đó là ngày cập nhật, theo múi giờ Việt Nam).
          </Typography>
        </Paper>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} mb={2}>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Năm học</InputLabel>
            <Select
              label="Năm học"
              value={selectedYearId}
              onChange={(e) => {
                setSelectedYearId(e.target.value);
                load(e.target.value);
              }}
            >
              <MenuItem value="all">Tất cả năm học</MenuItem>
              {academicYears.map((y) => (
                <MenuItem key={y._id} value={y._id}>
                  {y.yearName}
                </MenuItem>
              ))}
            </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
      </Stack>

      <Tabs
        value={mainTab}
        onChange={(_, v) => setMainTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab
          label={`Đang áp dụng (${activePlans.length})`}
          sx={{ textTransform: "none", fontWeight: 600 }}
        />
        <Tab
          label={`Kế hoạch sắp tới (${upcomingPlans.length})`}
          sx={{ textTransform: "none", fontWeight: 600 }}
        />
        <Tab label={`Lịch sử (${historyPlans.length})`} sx={{ textTransform: "none", fontWeight: 600 }} />
      </Tabs>

      {loading ? (
        <Stack alignItems="center" py={6}>
          <CircularProgress size={32} />
        </Stack>
      ) : mainTab === 0 ? (
        <Box>
          {!active ? (
            <Paper
              elevation={0}
              sx={{ p: 4, borderRadius: 2, border: "1px dashed", borderColor: "divider", textAlign: "center" }}
            >
              <Typography color="text.secondary" mb={2}>
                Chưa có kế hoạch đang áp dụng.
              </Typography>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
              <TextField
                label="Ngày bắt đầu áp dụng"
                type="date"
                size="small"
                fullWidth
                sx={{ mb: 2, maxWidth: { sm: 360 } }}
                InputLabelProps={{ shrink: true }}
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
              />

              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} mb={1}>
                <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} sx={{ textTransform: "none", alignSelf: "flex-start" }}>
                  {editFile ? "Thay tệp khác" : "Chọn tệp Word"}
                  <input
                    ref={editFileInputRef}
                    type="file"
                    hidden
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setEditFile(f);
                      e.target.value = "";
                    }}
                  />
                </Button>
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
                    Tải tệp đang lưu: {active.regulationFile.originalName}
                  </Button>
                )}
              </Stack>
              {editFile && (
                <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
                  Tệp mới (sẽ thay thế khi cập nhật): {editFile.name}
                </Typography>
              )}

              {renderMetricsTable(
                editRows,
                editNewRow,
                setEditNewRow,
                handleEditRowChange,
                addEditRow,
                4
              )}

              <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={2} mt={3}>
                <Button
                  variant="contained"
                  onClick={handleEditSave}
                  disabled={editSaving || !hasEditChanges}
                  sx={{ textTransform: "none" }}
                >
                  {editSaving ? "Đang lưu…" : "Cập nhật"}
                </Button>
              </Stack>
            </Paper>
          )}
        </Box>
      ) : mainTab === 1 ? (
        <Box>
          <Stack direction="row" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ textTransform: "none" }}>
              Tạo kế hoạch sắp tới
            </Button>
          </Stack>
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
                        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                          <Button size="small" variant="contained" onClick={() => handleApplyUpcomingNow(p._id)} sx={{ textTransform: "none" }}>
                            Áp dụng ngay
                          </Button>
                          <Button size="small" variant="outlined" color="info" onClick={() => openUpcomingEdit(p)} sx={{ textTransform: "none" }}>
                            Chỉnh sửa
                          </Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteUpcoming(p._id)} sx={{ textTransform: "none" }}>
                            Xóa
                          </Button>
                        </Stack>
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
                            onClick={() => openHistoryDetail(p._id)}
                            sx={{ textTransform: "none" }}
                          >
                            Xem
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

      <Dialog open={createOpen} onClose={() => !createSaving && setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>Tạo kế hoạch dinh dưỡng theo sở</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Ngày bắt đầu áp dụng"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={createStart}
              onChange={(e) => setCreateStart(e.target.value)}
            />
            <Typography variant="caption" color="text.secondary" display="block">
              Chỉ một tệp Word — chọn tệp khác sẽ thay thế tệp vừa chọn.
            </Typography>
            <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} sx={{ textTransform: "none", alignSelf: "flex-start" }}>
              {createFile ? "Thay tệp khác" : "Chọn tệp Word (quy định sở)"}
              <input
                ref={createFileInputRef}
                type="file"
                hidden
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setCreateFile(f);
                  e.target.value = "";
                }}
              />
            </Button>
            {createFile && (
              <Typography variant="body2" color="primary">
                Tệp đính kèm: {createFile.name}
              </Typography>
            )}
            {renderMetricsTable(
              createRows,
              createNewRow,
              setCreateNewRow,
              handleCreateRowChange,
              addCreateRow,
              4
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={createSaving}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleCreateSubmit} disabled={createSaving}>
            {createSaving ? "Đang tạo…" : "Tạo kế hoạch"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={upcomingEditOpen} onClose={() => !upcomingEditSaving && setUpcomingEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>Chỉnh sửa kế hoạch sắp tới</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Ngày bắt đầu áp dụng"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={upcomingEditStart}
              onChange={(e) => setUpcomingEditStart(e.target.value)}
            />
            <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} sx={{ textTransform: "none", alignSelf: "flex-start" }}>
              {upcomingEditFile ? "Thay tệp khác" : "Chọn tệp Word (quy định sở)"}
              <input
                ref={upcomingEditFileInputRef}
                type="file"
                hidden
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setUpcomingEditFile(f);
                  e.target.value = "";
                }}
              />
            </Button>
            {upcomingEditFile && (
              <Typography variant="body2" color="primary">
                Tệp đính kèm: {upcomingEditFile.name}
              </Typography>
            )}

            {renderMetricsTable(
              upcomingEditRows,
              editNewRow,
              setEditNewRow,
              handleUpcomingEditRowChange,
              addEditRow,
              4
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUpcomingEditOpen(false)} disabled={upcomingEditSaving}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleUpcomingEditSave} disabled={upcomingEditSaving}>
            {upcomingEditSaving ? "Đang cập nhật…" : "Cập nhật"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={viewLoading || !!viewPlan}
        onClose={() => {
          setViewLoading(false);
          setViewPlan(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight={700}>Chi tiết kế hoạch (lịch sử)</DialogTitle>
        <DialogContent dividers>
          {viewLoading ? (
            <Stack alignItems="center" py={2}>
              <CircularProgress size={24} />
            </Stack>
          ) : viewPlan && (
            <Stack spacing={1.5}>
              <Typography>
                <strong>Ngày áp dụng:</strong> {formatDMY(viewPlan.startDate)} — {formatDMY(viewPlan.endDate)}
              </Typography>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 1 }}>
                Chỉ tiêu
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
                  {(viewPlan.items || []).map((it, i) => (
                    <TableRow key={i}>
                      <TableCell>{it.name}</TableCell>
                      <TableCell align="right">{it.min}</TableCell>
                      <TableCell align="right">{it.max}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewPlan(null)}>Đóng</Button>
          {viewPlan?.regulationFile?.storedName && (
            <Button
              startIcon={<FileDownloadIcon />}
              variant="contained"
              onClick={() =>
                downloadDistrictRegulationFile(viewPlan._id).catch((err) =>
                  toast.error(err.message || "Tải file thất bại")
                )
              }
            >
              Tải file Word
            </Button>
          )}
        </DialogActions>
      </Dialog>

    </Box>
  );
}
