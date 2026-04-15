import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import RoleLayout from "../../layouts/RoleLayout";
import { useAuth } from "../../context/AuthContext";
import { createSchoolAdminMenuSelect } from "./schoolAdminMenuConfig";
import { useSchoolAdminMenu } from "./useSchoolAdminMenu";
import {
  listDistrictNutritionPlans,
  createDistrictNutritionPlan,
  updateDistrictNutritionPlan,
  endDistrictNutritionPlan,
  downloadDistrictRegulationFile,
} from "../../service/menu.api";
import ConfirmDialog from "../../components/ConfirmDialog";
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
  StopCircle as StopCircleIcon,
} from "@mui/icons-material";

const DEFAULT_ROWS = [
  { id: 1, name: "Calo trung bình/ngày", min: 615, max: 726 },
  { id: 2, name: "Đạm (g)", min: 13, max: 20 },
  { id: 3, name: "Béo (g)", min: 25, max: 35 },
  { id: 4, name: "Tinh bột (g)", min: 52, max: 60 },
];

const MSG_END_PLAN_INVALID = "Kết thúc kế hoạch không hợp lệ";

/** YYYY-MM-DD theo Asia/Ho_Chi_Minh (khớp logic backend) */
function todayVNString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isEndPlanDateInvalid(startDateStr) {
  const start = String(startDateStr || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return true;
  const endStr = todayVNString();
  return endStr <= start;
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

export default function DistrictNutritionPlanSchoolAdmin() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const menuItems = useSchoolAdminMenu();
  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);
  const userName = user?.fullName || user?.username || "School Admin";

  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState(0);
  const [activePlans, setActivePlans] = useState([]);
  const [historyPlans, setHistoryPlans] = useState([]);
  const [historyYear, setHistoryYear] = useState("all");

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
  const [confirmEndId, setConfirmEndId] = useState(null);
  const [viewPlan, setViewPlan] = useState(null);
  const [editNewRow, setEditNewRow] = useState({ name: "", min: "", max: "" });

  const createFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const active = activePlans[0] || null;

  const historyYears = Array.from(
    new Set(
      historyPlans.map((p) => (p.endDate || "").slice(0, 4)).filter(Boolean)
    )
  ).sort((a, b) => Number(b) - Number(a));

  const filteredHistory =
    historyYear === "all"
      ? historyPlans
      : historyPlans.filter((p) => (p.endDate || "").startsWith(String(historyYear)));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listDistrictNutritionPlans();
      const data = res?.data;
      setActivePlans(Array.isArray(data?.active) ? data.active : []);
      setHistoryPlans(Array.isArray(data?.history) ? data.history : []);
    } catch {
      toast.error("Không thể tải kế hoạch dinh dưỡng theo sở");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  const handleCreateRowChange = (id, field, value) => {
    setCreateRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
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
        if (row.id !== id) return row;
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
    if (!validateRows(createRows)) return;

    try {
      setCreateSaving(true);
      const fd = new FormData();
      fd.append("startDate", createStart);
      fd.append("items", JSON.stringify(rowsToPayload(createRows)));
      if (createFile) fd.append("regulationFile", createFile);
      await createDistrictNutritionPlan(fd);
      localStorage.setItem("nutrition_plan_updated_at", String(Date.now()));
      window.dispatchEvent(new Event("nutrition_plan_updated"));
      toast.success("Đã tạo kế hoạch mới");
      setCreateOpen(false);
      await load();
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
      toast.success("Đã cập nhật kế hoạch");
      setEditFile(null);
      await load();
    } catch (e) {
      toast.error(e?.message || e?.data?.message || "Cập nhật thất bại");
    } finally {
      setEditSaving(false);
    }
  };

  const handleRequestEndPlan = () => {
    if (!active) return;
    if (isEndPlanDateInvalid(active.startDate)) {
      toast.error(MSG_END_PLAN_INVALID);
      return;
    }
    setConfirmEndId(active._id);
  };

  const handleEndConfirm = async () => {
    if (!confirmEndId) return;
    const plan = activePlans.find((p) => String(p._id) === String(confirmEndId));
    if (!plan || isEndPlanDateInvalid(plan.startDate)) {
      toast.error(MSG_END_PLAN_INVALID);
      setConfirmEndId(null);
      return;
    }
    try {
      await endDistrictNutritionPlan(confirmEndId);
      localStorage.setItem("nutrition_plan_updated_at", String(Date.now()));
      window.dispatchEvent(new Event("nutrition_plan_updated"));
      toast.success("Đã kết thúc kế hoạch và lưu vào lịch sử");
      setConfirmEndId(null);
      await load();
      setMainTab(1);
    } catch (e) {
      const msg = e?.message || e?.data?.message || "Thao tác thất bại";
      toast.error(msg);
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

  const renderMetricsTable = (rows, newRow, setNewRow, onRowChange, onAdd) => (
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
            {rows.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    value={item.name}
                    onChange={(e) => onRowChange(item.id, "name", e.target.value)}
                  />
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ sm: "center" }}
        sx={{ mt: 1.5 }}
        flexWrap="wrap"
      >
        <TextField
          size="small"
          placeholder="Tên chỉ tiêu mới"
          value={newRow.name}
          onChange={(e) => setNewRow((p) => ({ ...p, name: e.target.value }))}
          sx={{ flex: { sm: 1 }, minWidth: 160 }}
        />
        <TextField
          size="small"
          type="number"
          placeholder="Min"
          value={newRow.min}
          onChange={(e) => setNewRow((p) => ({ ...p, min: e.target.value }))}
          sx={{ width: { xs: "100%", sm: 100 } }}
        />
        <TextField
          size="small"
          type="number"
          placeholder="Max"
          value={newRow.max}
          onChange={(e) => setNewRow((p) => ({ ...p, max: e.target.value }))}
          sx={{ width: { xs: "100%", sm: 100 } }}
        />
        <Button variant="outlined" size="small" onClick={onAdd} sx={{ textTransform: "none" }}>
          Thêm chỉ tiêu
        </Button>
      </Stack>
    </Box>
  );

  return (
    <RoleLayout
      title="Kế hoạch dinh dưỡng theo sở"
      description="Quy định chỉ tiêu dinh dưỡng và tài liệu sở"
      menuItems={menuItems}
      activeKey="district-nutrition-plan"
      onLogout={() => {
        logout();
        navigate("/login", { replace: true });
      }}
      onViewProfile={() => navigate("/profile")}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
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
            Thiết lập chỉ tiêu, ngày bắt đầu và một tệp quy định của sở. Khi bấm kết thúc kế hoạch, ngày kết
            thúc được ghi nhận và lưu ở lịch sử.
          </Typography>
        </Paper>
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
                Chưa có kế hoạch đang áp dụng. Tạo kế hoạch mới để bếp và hệ thống dùng chỉ tiêu theo sở.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ textTransform: "none" }}>
                Tạo kế hoạch mới
              </Button>
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
                addEditRow
              )}

              <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={2} mt={3}>
                <Button
                  color="warning"
                  variant="outlined"
                  startIcon={<StopCircleIcon />}
                  onClick={handleRequestEndPlan}
                  sx={{ textTransform: "none" }}
                >
                  Kết thúc kế hoạch
                </Button>
                <Button
                  variant="contained"
                  onClick={handleEditSave}
                  disabled={editSaving}
                  sx={{ textTransform: "none" }}
                >
                  {editSaving ? "Đang lưu…" : "Cập nhật"}
                </Button>
              </Stack>
            </Paper>
          )}
        </Box>
      ) : (
        <Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} mb={2}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Lọc theo năm</InputLabel>
              <Select
                label="Lọc theo năm"
                value={historyYear}
                onChange={(e) => setHistoryYear(e.target.value)}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {historyYears.map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

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
              addCreateRow
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

      <Dialog open={!!viewPlan} onClose={() => setViewPlan(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Chi tiết kế hoạch (lịch sử)</DialogTitle>
        <DialogContent dividers>
          {viewPlan && (
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

      <ConfirmDialog
        open={!!confirmEndId}
        title="Kết thúc kế hoạch?"
        message="Ngày kết thúc sẽ là hôm nay và kế hoạch được chuyển sang tab Lịch sử. Sau đó bạn có thể tạo kế hoạch mới."
        confirmText="Kết thúc"
        cancelText="Hủy"
        onConfirm={handleEndConfirm}
        onCancel={() => setConfirmEndId(null)}
      />
    </RoleLayout>
  );
}
