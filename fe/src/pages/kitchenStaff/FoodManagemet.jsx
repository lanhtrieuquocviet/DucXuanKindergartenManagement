import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import {
  getFoods,
  createFood,
  updateFood,
  deleteFood,
} from "../../service/menu.api";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
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
  alpha,
  Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  LocalFireDepartment as CalorieIcon,
  Egg as ProteinIcon,
  Opacity as FatIcon,
  Grain as CarbIcon,
  Restaurant as FoodIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";

const emptyFood = {
  name: "",
  calories: "",
  protein: "",
  fat: "",
  carb: "",
};

const NUTRITION_CONFIG = [
  {
    key: "calories",
    label: "Calories",
    unit: "kcal",
    color: "#f97316",
    icon: <CalorieIcon sx={{ fontSize: 16 }} />,
  },
  {
    key: "protein",
    label: "Protein",
    unit: "g",
    color: "#6366f1",
    icon: <ProteinIcon sx={{ fontSize: 16 }} />,
  },
  {
    key: "fat",
    label: "Fat",
    unit: "g",
    color: "#eab308",
    icon: <FatIcon sx={{ fontSize: 16 }} />,
  },
  {
    key: "carb",
    label: "Carb",
    unit: "g",
    color: "#22c55e",
    icon: <CarbIcon sx={{ fontSize: 16 }} />,
  },
];

function StatCard({ icon, label, value, color }) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        flex: 1,
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: alpha(color, 0.12),
              flexShrink: 0,
            }}
          >
            <Box sx={{ color, display: "flex" }}>{icon}</Box>
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function NutritionBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <Box sx={{ width: "100%", minWidth: 60 }}>
      <Typography variant="caption" fontWeight={600}>
        {value}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 5,
          borderRadius: 4,
          bgcolor: alpha(color, 0.12),
          "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 4 },
        }}
      />
    </Box>
  );
}

function FormField({ config, value, error, onChange }) {
  const isName = config.key === "name";
  return (
    <TextField
      fullWidth
      size="small"
      name={config.key}
      label={config.label}
      type={isName ? "text" : "number"}
      inputProps={isName ? { maxLength: 20 } : { min: 0 }}
      value={value}
      onChange={onChange}
      error={Boolean(error)}
      helperText={error || " "}
      InputProps={
        !isName
          ? {
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="caption" color="text.disabled">
                    {config.unit}
                  </Typography>
                </InputAdornment>
              ),
            }
          : undefined
      }
    />
  );
}

function FoodManagement() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(emptyFood);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const res = await getFoods();
      setFoods(res.data);
    } catch {
      toast.error("Không thể tải danh sách món");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return foods;
    const q = search.toLowerCase();
    return foods.filter((f) => f.name.toLowerCase().includes(q));
  }, [foods, search]);

  const maxValues = useMemo(
    () => ({
      calories: Math.max(...foods.map((f) => f.calories), 1),
      protein: Math.max(...foods.map((f) => f.protein), 1),
      fat: Math.max(...foods.map((f) => f.fat), 1),
      carb: Math.max(...foods.map((f) => f.carb), 1),
    }),
    [foods]
  );

  const avgCalories =
    foods.length > 0
      ? Math.round(foods.reduce((s, f) => s + f.calories, 0) / foods.length)
      : 0;

  const handleOpenCreate = () => {
    setEditingFood(null);
    setForm(emptyFood);
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (food) => {
    setEditingFood(food);
    setForm({
      name: food.name || "",
      calories: food.calories ?? "",
      protein: food.protein ?? "",
      fat: food.fat ?? "",
      carb: food.carb ?? "",
    });
    setErrors({});
    setShowModal(true);
  };

  const validateField = (name, value) => {
    let error = "";
    if (name === "name") {
      if (!String(value).trim()) error = "Tên món không được để trống";
      else if (String(value).length > 20) error = "Tên món tối đa 20 ký tự";
    }
    if (["calories", "protein", "fat", "carb"].includes(name)) {
      if (value === "") error = "Không được để trống";
      else if (!Number.isInteger(Number(value))) error = "Phải là số nguyên";
      else if (Number(value) < 0) error = "Phải là số không âm";
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const validateForm = () => {
    let isValid = true;
    Object.keys(form).forEach((key) => {
      if (!validateField(key, form[key])) isValid = false;
    });
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      const data = {
        ...form,
        calories: Number(form.calories),
        protein: Number(form.protein),
        fat: Number(form.fat),
        carb: Number(form.carb),
      };
      if (editingFood) {
        await updateFood(editingFood._id, data);
        toast.success("Cập nhật món ăn thành công");
      } else {
        await createFood(data);
        toast.success("Tạo món ăn thành công");
      }
      setShowModal(false);
      fetchFoods();
    } catch (error) {
      toast.error(error.response?.data?.message || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteFood(deleteTarget._id);
      toast.success("Xóa thành công");
      setDeleteTarget(null);
      fetchFoods();
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const isFormValid =
    Object.values(errors).every((e) => !e) &&
    Object.values(form).every((v) => String(v) !== "");

  return (
    <Box>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} lineHeight={1.3}>
            Quản lý món ăn
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            Quản lý danh sách món ăn và thông tin dinh dưỡng
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            borderRadius: 2.5,
            px: 2.5,
            py: 1,
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
            fontWeight: 700,
            textTransform: "none",
            "&:hover": {
              background: "linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)",
              boxShadow: "0 6px 20px rgba(99,102,241,0.45)",
            },
          }}
        >
          Thêm món ăn
        </Button>
      </Stack>

      {/* Stats */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
        <StatCard
          icon={<FoodIcon />}
          label="Tổng số món"
          value={foods.length}
          color="#4f46e5"
        />
        <StatCard
          icon={<CalorieIcon />}
          label="Calories trung bình"
          value={`${avgCalories} kcal`}
          color="#f97316"
        />
        <StatCard
          icon={<SearchIcon />}
          label="Kết quả tìm kiếm"
          value={filtered.length}
          color="#22c55e"
        />
      </Stack>

      {/* Search */}
      <Card
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, mb: 2.5 }}
      >
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm kiếm theo tên món..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                </InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}>
                    <ClearIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: 2 },
            }}
          />
        </Box>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 1.5 }}>
                  Tên món
                </TableCell>
                {NUTRITION_CONFIG.map((n) => (
                  <TableCell
                    key={n.key}
                    align="center"
                    sx={{ fontWeight: 700, fontSize: 13, py: 1.5 }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="center"
                      spacing={0.5}
                    >
                      <Box sx={{ color: n.color, display: "flex" }}>{n.icon}</Box>
                      <span>{n.label}</span>
                    </Stack>
                  </TableCell>
                ))}
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, fontSize: 13, py: 1.5, width: 120 }}
                >
                  Hành động
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" height={32} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Stack alignItems="center" spacing={1}>
                      <Avatar
                        sx={{ width: 56, height: 56, bgcolor: "grey.100" }}
                      >
                        <FoodIcon sx={{ fontSize: 28, color: "grey.400" }} />
                      </Avatar>
                      <Typography color="text.secondary" fontWeight={600}>
                        {search ? "Không tìm thấy món ăn phù hợp" : "Chưa có món ăn nào"}
                      </Typography>
                      {!search && (
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={handleOpenCreate}
                          sx={{ textTransform: "none" }}
                        >
                          Thêm món đầu tiên
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((food) => (
                  <TableRow
                    key={food._id}
                    hover
                    sx={{
                      "&:hover": { bgcolor: "rgba(99,102,241,0.03)" },
                      transition: "background 0.15s",
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            bgcolor: alpha("#4f46e5", 0.1),
                            fontSize: 15,
                          }}
                        >
                          🍽️
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>
                          {food.name}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {NUTRITION_CONFIG.map((n) => (
                      <TableCell key={n.key} align="center">
                        <Stack alignItems="center" spacing={0.25} sx={{ px: 1 }}>
                          <NutritionBar
                            value={food[n.key]}
                            max={maxValues[n.key]}
                            color={n.color}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {n.unit}
                          </Typography>
                        </Stack>
                      </TableCell>
                    ))}

                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="center"
                      >
                        <Tooltip title="Chỉnh sửa" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(food)}
                            sx={{
                              color: "#4f46e5",
                              bgcolor: alpha("#4f46e5", 0.07),
                              "&:hover": { bgcolor: alpha("#4f46e5", 0.14) },
                              borderRadius: 1.5,
                            }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa" arrow>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteTarget(food)}
                            sx={{
                              color: "error.main",
                              bgcolor: alpha("#ef4444", 0.07),
                              "&:hover": { bgcolor: alpha("#ef4444", 0.14) },
                              borderRadius: 1.5,
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && filtered.length > 0 && (
          <Box
            sx={{
              px: 2,
              py: 1.25,
              borderTop: "1px solid",
              borderColor: "divider",
              bgcolor: "grey.50",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Hiển thị{" "}
              <strong>
                {filtered.length}/{foods.length}
              </strong>{" "}
              món ăn
              {search && (
                <Chip
                  label={`Lọc: "${search}"`}
                  size="small"
                  onDelete={() => setSearch("")}
                  sx={{ ml: 1, height: 20, fontSize: 11 }}
                />
              )}
            </Typography>
          </Box>
        )}
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog
        open={showModal}
        onClose={() => !saving && setShowModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            pt: 2.5,
            px: 3,
            fontWeight: 800,
            fontSize: 17,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              fontSize: 18,
            }}
          >
            {editingFood ? <EditIcon sx={{ fontSize: 18 }} /> : <AddIcon sx={{ fontSize: 18 }} />}
          </Avatar>
          {editingFood ? "Chỉnh sửa món ăn" : "Thêm món ăn mới"}
        </DialogTitle>

        <DialogContent sx={{ px: 3, pt: 1.5, pb: 1 }}>
          <Stack spacing={0.5}>
            <FormField
              config={{ key: "name", label: "Tên món ăn", unit: "" }}
              value={form.name}
              error={errors.name}
              onChange={handleChange}
            />
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ mt: -0.5, mb: 0.5, display: "block" }}
            >
              Thông tin dinh dưỡng
            </Typography>
            <Grid container spacing={1.5}>
              {NUTRITION_CONFIG.map((n) => (
                <Grid item xs={6} key={n.key}>
                  <FormField
                    config={n}
                    value={form[n.key]}
                    error={errors[n.key]}
                    onChange={handleChange}
                  />
                </Grid>
              ))}
            </Grid>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setShowModal(false)}
            disabled={saving}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              color: "text.secondary",
              fontWeight: 600,
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isFormValid || saving}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: "none",
              fontWeight: 700,
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
              "&:hover": {
                background: "linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)",
              },
              "&.Mui-disabled": { opacity: 0.5 },
            }}
          >
            {saving ? "Đang lưu..." : editingFood ? "Cập nhật" : "Thêm mới"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pt: 2.5, px: 3 }}>
          Xác nhận xóa món ăn
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <DialogContentText>
            Bạn có chắc muốn xóa món{" "}
            <strong>"{deleteTarget?.name}"</strong>? Hành động này không thể
            hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: "none",
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(239,68,68,0.3)",
            }}
          >
            {deleting ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FoodManagement;
