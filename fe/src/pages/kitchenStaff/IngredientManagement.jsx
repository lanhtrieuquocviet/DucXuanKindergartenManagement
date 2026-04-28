import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  restoreIngredient,
} from "../../service/menu.api";
import { INGREDIENT_GROUPS } from "../../constants/ingredientCategories";
import {
  downloadIngredientTemplate,
  exportIngredientsExcel,
  parseIngredientExcel,
} from "../../utils/excelIngredients";
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  UploadFile as UploadFileIcon,
  Download as DownloadIcon,
  Restore as RestoreIcon,
} from "@mui/icons-material";

const normCat = (ing) => ing?.category || "luong_thuc";

const emptyForm = (category = "luong_thuc") => ({
  name: "",
  category,
  unit: "100g",
  calories: "",
  protein: "",
  fat: "",
  carb: "",
});

const NUTRITION_FIELDS = ["calories", "protein", "fat", "carb"];

const getNutritionError = (value) => {
  if (value === "" || value === undefined || value === null) return "";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "Số không hợp lệ";
  if (parsed < 0) return "Không được nhập số âm";
  return "";
};

const calculateCaloriesFromMacros = (protein, fat, carb) => {
  const p = Number(protein) || 0;
  const f = Number(fat) || 0;
  const c = Number(carb) || 0;
  return Math.round((p * 4 + f * 9 + c * 4) * 10) / 10;
};

export default function IngredientManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const fileImportRef = useRef(null);

  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [ingredientFilter, setIngredientFilter] = useState("active");
  const [groupFilter, setGroupFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(() => emptyForm());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const res = await getIngredients({ filter: ingredientFilter });
      setIngredients(Array.isArray(res?.data) ? res.data : []);
    } catch {
      toast.error("Không thể tải danh sách nguyên liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, [ingredientFilter]);

  const filteredList = useMemo(() => {
    let list = ingredients;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (groupFilter !== "all") {
      list = list.filter((i) => normCat(i) === groupFilter);
    }
    return list;
  }, [ingredients, search, groupFilter]);

  const rowsForGroup = useCallback(
    (gid) => filteredList.filter((i) => normCat(i) === gid),
    [filteredList]
  );

  const groupsToRender = useMemo(
    () => (groupFilter === "all" ? INGREDIENT_GROUPS : INGREDIENT_GROUPS.filter((g) => g.id === groupFilter)),
    [groupFilter]
  );

  const handleOpenCreate = (categoryId = "luong_thuc") => {
    setEditingIngredient(null);
    setForm(emptyForm(categoryId));
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (ingredient) => {
    const protein = ingredient.protein ?? "";
    const fat = ingredient.fat ?? "";
    const carb = ingredient.carb ?? "";
    setEditingIngredient(ingredient);
    setForm({
      name: ingredient.name,
      category: normCat(ingredient),
      unit: ingredient.unit || "100g",
      calories: String(calculateCaloriesFromMacros(protein, fat, carb)),
      protein,
      fat,
      carb,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setForm(emptyForm());
    setErrors({});
    setEditingIngredient(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name?.trim()) newErrors.name = "Tên nguyên liệu không được để trống";
    else if (form.name.trim().length > 100) newErrors.name = "Tối đa 100 ký tự";

    NUTRITION_FIELDS.forEach((field) => {
      const error = getNutritionError(form[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNutritionChange = (field) => (e) => {
    const value = e.target.value;
    setForm((p) => {
      const next = { ...p, [field]: value };
      if (["protein", "fat", "carb"].includes(field)) {
        next.calories = String(calculateCaloriesFromMacros(next.protein, next.fat, next.carb));
      }
      return next;
    });
    const error = getNutritionError(value);
    setErrors((prev) => {
      if (error) return { ...prev, [field]: error };
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    category: form.category,
    unit: (form.unit || "100g").trim(),
    calories: calculateCaloriesFromMacros(form.protein, form.fat, form.carb),
    protein: Number(form.protein) || 0,
    fat: Number(form.fat) || 0,
    carb: Number(form.carb) || 0,
  });

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const payload = buildPayload();

    try {
      setSaving(true);
      if (editingIngredient) {
        const unchanged =
          payload.name === editingIngredient.name.trim() &&
          payload.category === normCat(editingIngredient) &&
          payload.unit === (editingIngredient.unit || "100g") &&
          payload.calories === (Number(editingIngredient.calories) || 0) &&
          payload.protein === (Number(editingIngredient.protein) || 0) &&
          payload.fat === (Number(editingIngredient.fat) || 0) &&
          payload.carb === (Number(editingIngredient.carb) || 0);
        if (unchanged) {
          toast.success("Không có thay đổi");
          handleCloseModal();
          return;
        }

        const dup = ingredients.some(
          (i) =>
            i._id !== editingIngredient._id &&
            i.name.trim().toLowerCase() === payload.name.toLowerCase()
        );
        if (dup) {
          toast.error(`Nguyên liệu "${payload.name}" đã tồn tại`);
          setErrors((p) => ({ ...p, name: "Trùng tên" }));
          return;
        }

        await updateIngredient(editingIngredient._id, payload);
        toast.success("Cập nhật nguyên liệu thành công");
      } else {
        const dup = ingredients.some((i) => i.name.trim().toLowerCase() === payload.name.toLowerCase());
        if (dup) {
          toast.error(`Nguyên liệu "${payload.name}" đã tồn tại`);
          setErrors((p) => ({ ...p, name: "Trùng tên" }));
          return;
        }
        await createIngredient(payload);
        toast.success("Thêm nguyên liệu thành công");
      }
      handleCloseModal();
      fetchIngredients();
    } catch (error) {
      toast.error(error?.message || error?.data?.message || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteIngredient(deleteTarget._id);
      toast.success("Đã xóa");
      setDeleteTarget(null);
      fetchIngredients();
    } catch (error) {
      toast.error(error?.message || error?.data?.message || "Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (ingredient) => {
    try {
      await restoreIngredient(ingredient._id);
      toast.success(`Đã khôi phục nguyên liệu "${ingredient.name}"`);
      fetchIngredients();
    } catch (error) {
      toast.error(error?.message || error?.data?.message || "Khôi phục thất bại");
    }
  };

  const downloadTemplate = async () => {
    try {
      await downloadIngredientTemplate();
      toast.success("Đã tải file mẫu Excel (.xlsx)");
    } catch (err) {
      toast.error("Không tải được mẫu: " + (err?.message || ""));
    }
  };

  const exportExcel = async () => {
    try {
      await exportIngredientsExcel(ingredients);
      toast.success("Đã xuất Excel");
    } catch (err) {
      toast.error("Xuất Excel thất bại: " + (err?.message || ""));
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const buf = await file.arrayBuffer();
      const rows = await parseIngredientExcel(buf);
      if (!rows.length) {
        toast.error("Không đọc được dòng dữ liệu. Hãy dùng mẫu Excel của hệ thống.");
        return;
      }
      let ok = 0;
      let fail = 0;
      for (const row of rows) {
        const name = row.name?.trim();
        if (!name) continue;
        try {
          const exists = ingredients.some((x) => x.name.trim().toLowerCase() === name.toLowerCase());
          if (exists) {
            fail++;
            continue;
          }
          await createIngredient({
            name,
            category: row.category || "luong_thuc",
            unit: row.unit || "100g",
            calories: row.calories ?? 0,
            protein: row.protein ?? 0,
            fat: row.fat ?? 0,
            carb: row.carb ?? 0,
          });
          ok++;
        } catch {
          fail++;
        }
      }
      toast.info(`Import Excel: thành công ${ok}, bỏ qua/trùng/lỗi ${fail}`);
      fetchIngredients();
    } catch {
      toast.error("Không đọc được file Excel (.xlsx)");
    }
  };

  const hCell = {
    fontWeight: 700,
    backgroundColor: "#f0f4f8",
    fontSize: "0.8rem",
    whiteSpace: "nowrap",
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        mb={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} lineHeight={1.3}>
            Quản lý nguyên liệu
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            Phân nhóm theo dinh dưỡng — đồng bộ dùng cho thực đơn và kho
          </Typography>
        </Box>
        {ingredientFilter !== "deleted" && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenCreate("luong_thuc")}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            }}
          >
            Thêm nguyên liệu
          </Button>
        )}
      </Stack>

      <Card
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2, mb: 2 }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant={ingredientFilter === "active" ? "contained" : "outlined"}
              onClick={() => setIngredientFilter("active")}
              sx={{ textTransform: "none" }}
            >
              Đang dùng
            </Button>
            <Button
              size="small"
              color="warning"
              variant={ingredientFilter === "deleted" ? "contained" : "outlined"}
              onClick={() => setIngredientFilter("deleted")}
              sx={{ textTransform: "none" }}
            >
              Đã xóa
            </Button>
          </Stack>
          <TextField
            size="small"
            placeholder="Tìm kiếm theo tên nguyên liệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: { md: 220 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                </InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 220 } }}>
            <InputLabel>Nhóm nguyên liệu</InputLabel>
            <Select
              label="Nhóm nguyên liệu"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả nhóm</MenuItem>
              {INGREDIENT_GROUPS.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.order}. {g.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {ingredientFilter !== "deleted" && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  onClick={() => fileImportRef.current?.click()}
                  sx={{ textTransform: "none" }}
                >
                  Import Excel
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadTemplate}
                  sx={{ textTransform: "none" }}
                >
                  Tải mẫu
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<DownloadIcon />}
                  onClick={exportExcel}
                  sx={{ textTransform: "none" }}
                >
                  Xuất Excel
                </Button>
              </>
            )}
          </Stack>
        </Stack>
        <input
          ref={fileImportRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          hidden
          onChange={handleImportFile}
        />
      </Card>

      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: 1 }} />
          ))}
        </Stack>
      ) : (
        groupsToRender.map((group) => {
          const rows = rowsForGroup(group.id);
          return (
            <Box key={group.id} mb={3}>
              <Box
                sx={{
                  backgroundColor: "#e8f0fe",
                  borderLeft: "4px solid #1a56db",
                  px: 1.5,
                  py: 0.75,
                  borderRadius: "4px 4px 0 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Box>
                  <Typography fontWeight={700} fontSize="0.85rem" color="#1a56db" display="inline">
                    {group.order}. {group.title}
                  </Typography>
                  <Typography component="span" fontWeight={400} color="text.secondary" ml={1} fontSize="0.75rem">
                    ({rows.length} mục) — {group.hint}
                  </Typography>
                </Box>
                {ingredientFilter !== "deleted" && (
                  <Tooltip title="Thêm vào nhóm này">
                    <IconButton size="small" sx={{ color: "#1a56db" }} onClick={() => handleOpenCreate(group.id)}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <TableContainer
                sx={{
                  border: "1px solid #c7d7f8",
                  borderTop: "none",
                  borderRadius: "0 0 4px 4px",
                  maxHeight: isMobile ? 320 : 420,
                  overflow: "auto",
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={hCell}>Tên nguyên liệu</TableCell>
                      <TableCell sx={hCell} align="center">
                        ĐVT
                      </TableCell>
                      <TableCell sx={hCell} align="center">
                        Kcal
                      </TableCell>
                      <TableCell sx={hCell} align="center">
                        Đạm (g)
                      </TableCell>
                      <TableCell sx={hCell} align="center">
                        Béo (g)
                      </TableCell>
                      <TableCell sx={hCell} align="center">
                        Tinh bột (g)
                      </TableCell>
                      <TableCell sx={hCell} align="center">
                        {ingredientFilter === "deleted" ? "Khôi phục" : "Xóa"}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 2, color: "text.secondary", fontSize: "0.8rem" }}>
                          {ingredientFilter === "deleted"
                            ? "Không có nguyên liệu nào trong thùng rác"
                            : <>Chưa có dữ liệu — nhấn <strong>+</strong> để thêm</>}
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((ing) => (
                        <TableRow key={ing._id} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body2" fontWeight={600}>
                                {ing.name}
                              </Typography>
                              {ingredientFilter !== "deleted" && (
                                <Tooltip title="Sửa">
                                  <IconButton size="small" onClick={() => handleOpenEdit(ing)} sx={{ color: "#4f46e5" }}>
                                    <EditIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="center">{ing.unit || "100g"}</TableCell>
                          <TableCell align="center">{ing.calories ?? 0}</TableCell>
                          <TableCell align="center">{ing.protein ?? 0}</TableCell>
                          <TableCell align="center">{ing.fat ?? 0}</TableCell>
                          <TableCell align="center">{ing.carb ?? 0}</TableCell>
                          <TableCell align="center">
                            {ingredientFilter === "deleted" ? (
                              <IconButton size="small" color="success" onClick={() => handleRestore(ing)}>
                                <RestoreIcon fontSize="small" />
                              </IconButton>
                            ) : (
                              <IconButton size="small" color="error" onClick={() => setDeleteTarget(ing)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          );
        })
      )}

      {!loading && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          Hiển thị {filteredList.length}/{ingredients.length} nguyên liệu
          {search ? ` — lọc "${search}"` : ""}
        </Typography>
      )}

      <Dialog open={showModal} onClose={handleCloseModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingIngredient ? "Chỉnh sửa nguyên liệu" : "Thêm nguyên liệu"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Nhóm</InputLabel>
              <Select
                label="Nhóm"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              >
                {INGREDIENT_GROUPS.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.order}. {g.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label="Tên nguyên liệu"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              error={Boolean(errors.name)}
              helperText={errors.name || " "}
            />
            <TextField
              fullWidth
              size="small"
              label="Đơn vị tính (VD: 100g)"
              value={form.unit}
              onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                size="small"
                label="Kcal"
                type="number"
                value={form.calories}
                onChange={handleNutritionChange("calories")}
                error={Boolean(errors.calories)}
                helperText={"Tự tính theo Đạm*4 + Béo*9 + Tinh bột*4"}
                inputProps={{ min: 0 }}
                disabled
                fullWidth
              />
              <TextField
                size="small"
                label="Đạm (g)"
                type="number"
                value={form.protein}
                onChange={handleNutritionChange("protein")}
                error={Boolean(errors.protein)}
                helperText={errors.protein || " "}
                inputProps={{ min: 0 }}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                size="small"
                label="Béo (g)"
                type="number"
                value={form.fat}
                onChange={handleNutritionChange("fat")}
                error={Boolean(errors.fat)}
                helperText={errors.fat || " "}
                inputProps={{ min: 0 }}
                fullWidth
              />
              <TextField
                size="small"
                label="Tinh bột (g)"
                type="number"
                value={form.carb}
                onChange={handleNutritionChange("carb")}
                error={Boolean(errors.carb)}
                helperText={errors.carb || " "}
                inputProps={{ min: 0 }}
                fullWidth
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Giá trị dinh dưỡng theo đơn vị đã chọn (thường là trên 100g).
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseModal} sx={{ textTransform: "none" }}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving} sx={{ textTransform: "none" }}>
            {saving ? "Đang lưu…" : editingIngredient ? "Cập nhật" : "Thêm"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Xóa nguyên liệu <strong>{deleteTarget?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: "none" }}>
            Hủy
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting} sx={{ textTransform: "none" }}>
            {deleting ? "Đang xóa…" : "Xóa"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
