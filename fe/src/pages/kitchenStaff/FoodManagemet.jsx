import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import {
  getFoods,
  getIngredients,
  createFood,
  createIngredient,
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
  useTheme,
  useMediaQuery,
  Autocomplete,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
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
  ingredients: [],
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
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, gap: { xs: 0.5, sm: 1.5 } }}>
          <Avatar sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, bgcolor: alpha(color, 0.12), flexShrink: 0 }}>
            <Box sx={{ color, display: "flex", fontSize: { xs: 14, sm: 16 } }}>{icon}</Box>
          </Avatar>
          <Box>
            <Typography fontWeight={700} lineHeight={1.2} sx={{ fontSize: { xs: 16, sm: 20 } }}>{value}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: 10, sm: 12 } }}>{label}</Typography>
          </Box>
        </Box>
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

function FoodCard({ food, maxValues, onView, onEdit, onDelete }) {
  const nutrients = [
    { key: "calories", label: "Cal", unit: "kcal", color: "#f97316" },
    { key: "protein", label: "Pro", unit: "g", color: "#6366f1" },
    { key: "fat", label: "Fat", unit: "g", color: "#eab308" },
    { key: "carb", label: "Carb", unit: "g", color: "#22c55e" },
  ];
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: alpha("#4f46e5", 0.1), fontSize: 15 }}>🍽️</Avatar>
            <Typography variant="body2" fontWeight={700}>{food.name}</Typography>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={() => onView(food)}
              sx={{ color: "#0ea5e9", bgcolor: alpha("#0ea5e9", 0.07), borderRadius: 1.5, "&:hover": { bgcolor: alpha("#0ea5e9", 0.14) } }}>
              <ViewIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton size="small" onClick={() => onEdit(food)}
              sx={{ color: "#4f46e5", bgcolor: alpha("#4f46e5", 0.07), borderRadius: 1.5, "&:hover": { bgcolor: alpha("#4f46e5", 0.14) } }}>
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(food)}
              sx={{ color: "error.main", bgcolor: alpha("#ef4444", 0.07), borderRadius: 1.5, "&:hover": { bgcolor: alpha("#ef4444", 0.14) } }}>
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>
        </Stack>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>
          {nutrients.map((n) => (
            <Box key={n.key} sx={{ textAlign: "center", bgcolor: alpha(n.color, 0.06), borderRadius: 1.5, py: 0.75, px: 0.5 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: n.color, lineHeight: 1.2 }}>{food[n.key]}</Typography>
              <Typography sx={{ fontSize: 9.5, color: "text.disabled", lineHeight: 1.3 }}>{n.label}<br/>{n.unit}</Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

function FoodManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [detailFood, setDetailFood] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [editingFood, setEditingFood] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(emptyFood);
  const [newIngredient, setNewIngredient] = useState({ name: "", quantity: "", calories: "", protein: "", fat: "", carb: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchFoods();
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const res = await getIngredients();
      setAvailableIngredients(res.data || []);
    } catch (error) {
      console.error('Lấy nguyên liệu thất bại', error);
      toast.error('Không thể tải nguyên liệu sẵn có');
    }
  };

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

  const totalCalories = foods.length > 0 ? foods.reduce((s, f) => s + (Number(f.calories) || 0), 0) : 0;
  const avgCalories = foods.length > 0 ? Math.round(totalCalories / foods.length) : 0;

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
      ingredients: Array.isArray(food.ingredients) ? food.ingredients : [],
    });
    setErrors({});
    setShowModal(true);
  };

  const handleOpenDetail = (food) => {
    setDetailFood(food);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setDetailFood(null);
    setShowDetailModal(false);
  };

  const addIngredientFromLibrary = (ingredient) => {
    if (!ingredient) return;

    setNewIngredient({
      name: ingredient.name || '',
      quantity: '100',
      calories: String(ingredient.calories || 0),
      protein: String(ingredient.protein || 0),
      fat: String(ingredient.fat || 0),
      carb: String(ingredient.carb || 0),
    });
  };

  const handleNewIngredientChange = (field, value) => {
    setNewIngredient((prev) => ({ ...prev, [field]: value }));
  };

  const handleAppendNewIngredient = async () => {
    if (!newIngredient.name.trim()) return;

    const normalizedName = newIngredient.name.trim();
    const alreadyExists = form.ingredients.some((it) => it.name.toLowerCase() === normalizedName.toLowerCase());
    if (alreadyExists) {
      toast.error(`Nguyên liệu "${normalizedName}" đã có trong danh sách`);
      return;
    }

    const updatedIngredients = [
      ...form.ingredients,
      {
        name: normalizedName,
        quantity: newIngredient.quantity.trim() || '100',
        calories: newIngredient.calories.trim() || '0',
        protein: newIngredient.protein.trim() || '0',
        fat: newIngredient.fat.trim() || '0',
        carb: newIngredient.carb.trim() || '0',
      },
    ];

    setForm((prev) => ({
      ...prev,
      ingredients: updatedIngredients,
      ...computeNutritionFromIngredients(updatedIngredients),
    }));

    setNewIngredient({ name: "", quantity: "", calories: "", protein: "", fat: "", carb: "" });

    try {
      await createIngredient({
        name: normalizedName,
        unit: '100g',
        calories: Number(newIngredient.calories) || 0,
        protein: Number(newIngredient.protein) || 0,
        fat: Number(newIngredient.fat) || 0,
        carb: Number(newIngredient.carb) || 0,
      });
      fetchIngredients();
    } catch (err) {
      if (err?.data?.message?.includes('đã tồn tại') || err?.message?.includes('duplicate')) {
        // đã có thì bỏ qua
      } else {
        console.error('Tạo nguyên liệu DB lỗi:', err);
        toast.error('Không thể lưu nguyên liệu vào database');
      }
    }
  };

  const computeNutritionFromIngredients = (ingredients) => {
    const totals = ingredients.reduce(
      (acc, item) => {
        const c = Number(item.calories) || 0;
        const p = Number(item.protein) || 0;
        const f = Number(item.fat) || 0;
        const cb = Number(item.carb) || 0;
        return {
          calories: acc.calories + c,
          protein: acc.protein + p,
          fat: acc.fat + f,
          carb: acc.carb + cb,
        };
      },
      { calories: 0, protein: 0, fat: 0, carb: 0 }
    );
    return {
      calories: String(totals.calories),
      protein: String(totals.protein),
      fat: String(totals.fat),
      carb: String(totals.carb),
    };
  };

  const handleAddIngredient = () => {
    handleAppendNewIngredient();
  };

  const handleRemoveIngredient = (index) => {
    setForm((prev) => {
      const updatedIngredients = prev.ingredients.filter((_, i) => i !== index);
      return {
        ...prev,
        ingredients: updatedIngredients,
        ...computeNutritionFromIngredients(updatedIngredients),
      };
    });
  };

  const handleIngredientChange = (index, field, value) => {
    setForm((prev) => {
      const updatedIngredients = prev.ingredients.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      return {
        ...prev,
        ingredients: updatedIngredients,
        ...computeNutritionFromIngredients(updatedIngredients),
      };
    });
  };

  const validateField = (name, value) => {
    let error = "";
    if (name === "name") {
      if (!String(value).trim()) error = "Tên món không được để trống";
      else if (String(value).length > 20) error = "Tên món tối đa 20 ký tự";
    }
    if (["calories", "protein", "fat", "carb"].includes(name)) {
      if (value === "") error = "Không được để trống";
      else if (Number(value) < 0) error = "Phải là số không âm";
      else if (Number.isNaN(Number(value))) error = "Phải là số hợp lệ";
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

    // KIỂM TRA TRÙNG LẶP TÊN MÓN
    const isDuplicate = foods.some((f) => {
      // Nếu đang edit, bỏ qua chính nó khi kiểm tra trùng tên
      if (editingFood && f._id === editingFood._id) return false;
      return f.name.trim().toLowerCase() === form.name.trim().toLowerCase();
    });

    if (isDuplicate) {
      toast.error(`Món ăn "${form.name}" đã có trong danh sách!`);
      setErrors((prev) => ({ ...prev, name: " Món ăn đã tồn tại" }));
      return;
    }

    try {
      setSaving(true);
      const data = {
        ...form,
        calories: Number(form.calories),
        protein: Number(form.protein),
        fat: Number(form.fat),
        carb: Number(form.carb),
        ingredients: (form.ingredients || []).map((item) => ({
          name: item.name,
          quantity: item.quantity,
          calories: Number(item.calories) || 0,
          protein: Number(item.protein) || 0,
          fat: Number(item.fat) || 0,
          carb: Number(item.carb) || 0,
        })),
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
    Object.values(form).every((v) => String(v).trim() !== "");

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
          fullWidth={isMobile}
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
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(3, 1fr)" }, gap: { xs: 1.5, sm: 2 }, mb: 3 }}>
        <StatCard icon={<FoodIcon />} label="Tổng số món" value={foods.length} color="#4f46e5" />
        <StatCard icon={<CalorieIcon />} label="Tổng calories" value={`${totalCalories}`} color="#f97316" />
        <StatCard icon={<SearchIcon />} label="Kết quả" value={filtered.length} color="#22c55e" />
      </Box>

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

        {/* Mobile: card list | Desktop: table */}
        {isMobile ? (
          <Box sx={{ px: 1.5, pb: 1.5 }}>
            {loading ? (
              <Stack spacing={1.5}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={96} sx={{ borderRadius: 2.5 }} />
                ))}
              </Stack>
            ) : filtered.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: "grey.100", mx: "auto", mb: 1.5 }}>
                  <FoodIcon sx={{ fontSize: 28, color: "grey.400" }} />
                </Avatar>
                <Typography color="text.secondary" fontWeight={600} variant="body2">
                  {search ? "Không tìm thấy món ăn phù hợp" : "Chưa có món ăn nào"}
                </Typography>
                {!search && (
                  <Button size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ mt: 1, textTransform: "none" }}>
                    Thêm món đầu tiên
                  </Button>
                )}
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {filtered.map((food) => (
                  <FoodCard key={food._id} food={food} maxValues={maxValues} onView={handleOpenDetail} onEdit={handleOpenEdit} onDelete={setDeleteTarget} />
                ))}
              </Stack>
            )}
          </Box>
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 1.5 }}>Tên món</TableCell>
                    {NUTRITION_CONFIG.map((n) => (
                      <TableCell key={n.key} align="center" sx={{ fontWeight: 700, fontSize: 13, py: 1.5 }}>
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                          <Box sx={{ color: n.color, display: "flex" }}>{n.icon}</Box>
                          <span>{n.label}</span>
                        </Stack>
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: 13, py: 1.5, width: 120 }}>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <TableCell key={j}><Skeleton variant="text" height={32} /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Stack alignItems="center" spacing={1}>
                          <Avatar sx={{ width: 56, height: 56, bgcolor: "grey.100" }}>
                            <FoodIcon sx={{ fontSize: 28, color: "grey.400" }} />
                          </Avatar>
                          <Typography color="text.secondary" fontWeight={600}>
                            {search ? "Không tìm thấy món ăn phù hợp" : "Chưa có món ăn nào"}
                          </Typography>
                          {!search && (
                            <Button size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ textTransform: "none" }}>
                              Thêm món đầu tiên
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((food) => (
                      <TableRow key={food._id} hover sx={{ "&:hover": { bgcolor: "rgba(99,102,241,0.03)" }, transition: "background 0.15s" }}>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: alpha("#4f46e5", 0.1), fontSize: 15 }}>🍽️</Avatar>
                            <Typography variant="body2" fontWeight={600}>{food.name}</Typography>
                          </Stack>
                        </TableCell>
                        {NUTRITION_CONFIG.map((n) => (
                          <TableCell key={n.key} align="center">
                            <Stack alignItems="center" spacing={0.25} sx={{ px: 1 }}>
                              <NutritionBar value={food[n.key]} max={maxValues[n.key]} color={n.color} />
                              <Typography variant="caption" color="text.secondary">{n.unit}</Typography>
                            </Stack>
                          </TableCell>
                        ))}
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Chi tiết" arrow>
                              <IconButton size="small" onClick={() => handleOpenDetail(food)}
                                sx={{ color: "#0ea5e9", bgcolor: alpha("#0ea5e9", 0.07), "&:hover": { bgcolor: alpha("#0ea5e9", 0.14) }, borderRadius: 1.5 }}>
                                <ViewIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Chỉnh sửa" arrow>
                              <IconButton size="small" onClick={() => handleOpenEdit(food)}
                                sx={{ color: "#4f46e5", bgcolor: alpha("#4f46e5", 0.07), "&:hover": { bgcolor: alpha("#4f46e5", 0.14) }, borderRadius: 1.5 }}>
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa" arrow>
                              <IconButton size="small" onClick={() => setDeleteTarget(food)}
                                sx={{ color: "error.main", bgcolor: alpha("#ef4444", 0.07), "&:hover": { bgcolor: alpha("#ef4444", 0.14) }, borderRadius: 1.5 }}>
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
          </>
        )}

        {!loading && filtered.length > 0 && (
          <Box sx={{ px: 2, py: 1.25, borderTop: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
            <Typography variant="caption" color="text.secondary">
              Hiển thị <strong>{filtered.length}/{foods.length}</strong> món ăn
              {search && (
                <Chip label={`Lọc: "${search}"`} size="small" onDelete={() => setSearch("")} sx={{ ml: 1, height: 20, fontSize: 11 }} />
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
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ mb: 1, fontWeight: 700 }}>Chọn nguyên liệu có sẵn</Typography>
              <Autocomplete
                options={availableIngredients}
                getOptionLabel={(option) => `${option.name} (${option.calories} kcal / ${option.unit || '100g'})`}
                onChange={(_, value) => addIngredientFromLibrary(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Chọn nguyên liệu phổ biến"
                    placeholder="Chọn nguyên liệu phổ biến..."
                    sx={{ mb: 1 }}
                  />
                )}
              />

              <Typography sx={{ mt: 1, fontWeight: 700 }}>Hoặc nhập thủ công</Typography>
              <Grid container spacing={1} alignItems="center" sx={{ mt: 1, mb: 1 }}>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Tên nguyên liệu"
                    value={newIngredient.name}
                    onChange={(e) => handleNewIngredientChange('name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Khối lượng"
                    value={newIngredient.quantity}
                    onChange={(e) => handleNewIngredientChange('quantity', e.target.value)}
                    placeholder="g"
                  />
                </Grid>
                <Grid item xs={1.5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Calories"
                    type="number"
                    value={newIngredient.calories}
                    onChange={(e) => handleNewIngredientChange('calories', e.target.value)}
                  />
                </Grid>
                <Grid item xs={1.5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Protein"
                    type="number"
                    value={newIngredient.protein}
                    onChange={(e) => handleNewIngredientChange('protein', e.target.value)}
                  />
                </Grid>
                <Grid item xs={1.5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Fat"
                    type="number"
                    value={newIngredient.fat}
                    onChange={(e) => handleNewIngredientChange('fat', e.target.value)}
                  />
                </Grid>
                <Grid item xs={1.5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Carb"
                    type="number"
                    value={newIngredient.carb}
                    onChange={(e) => handleNewIngredientChange('carb', e.target.value)}
                  />
                </Grid>
                <Grid item xs={1}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleAppendNewIngredient}
                    sx={{ textTransform: 'none', px: 1 }}
                  >
                    Thêm Nguyên Liệu
                  </Button>
                </Grid>
              </Grid>

              <Typography sx={{ fontWeight: 700, mb: 1 }}>
                Danh sách nguyên liệu ({form.ingredients?.length || 0})
              </Typography>

              <TableContainer sx={{ maxHeight: 220, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Nguyên liệu</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>KL</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Cal</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>P/F/C</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Xóa</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(form.ingredients || []).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="center">{item.quantity || '-'}</TableCell>
                        <TableCell align="center">{item.calories || 0}</TableCell>
                        <TableCell align="center">{`${item.protein || 0}/${item.fat || 0}/${item.carb || 0}`}</TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleRemoveIngredient(idx)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(form.ingredients || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                          Chưa có nguyên liệu nào
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Grid container spacing={1} sx={{ mt: 1 }}>
                {NUTRITION_CONFIG.map((n) => {
                  const value = Number(form[n.key]) || 0;
                  return (
                    <Grid item xs={3} key={n.key}>
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent sx={{ py: 1, px: 1.25, textAlign: 'center' }}>
                          <Typography variant="caption" sx={{ color: n.color, fontWeight: 700 }}>{n.label}</Typography>
                          <Typography variant="h6" sx={{ color: n.color, fontWeight: 800 }}>{n.key === 'calories' ? `${value}` : `${value}g`}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
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

      {/* Detail Dialog */}
      <Dialog
        open={showDetailModal}
        onClose={handleCloseDetail}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}><FoodIcon sx={{ fontSize: 20 }} /></Avatar>
          {detailFood ? `Chi tiết món ăn: ${detailFood.name}` : 'Chi tiết món ăn'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 2, px: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, minmax(0, 1fr))' }, gap: 1, mb: 2 }}>
            {NUTRITION_CONFIG.map((n) => (
              <Card key={n.key} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: alpha(n.color, 0.06) }}>
                <CardContent sx={{ p: 1.25, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: n.color }}>{n.label}</Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 800 }}>{detailFood ? detailFood[n.key] : 0}</Typography>
                  <Typography variant="caption" color="text.secondary">{n.unit}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Typography sx={{ fontWeight: 700, mb: 1 }}>Nguyên liệu</Typography>
          <TableContainer component={Box} sx={{ maxHeight: 260, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, p: 1 }}>Nguyên liệu</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, p: 1 }}>Khối lượng</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, p: 1 }}>Calories</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, p: 1 }}>Protein</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, p: 1 }}>Fat</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, p: 1 }}>Carb</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detailFood && detailFood.ingredients && detailFood.ingredients.length > 0 ? (
                  detailFood.ingredients.map((item, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ p: 1 }}>{item.name}</TableCell>
                      <TableCell align="center" sx={{ p: 1 }}>{item.quantity}</TableCell>
                      <TableCell align="center" sx={{ p: 1 }}>{item.calories}</TableCell>
                      <TableCell align="center" sx={{ p: 1 }}>{item.protein}</TableCell>
                      <TableCell align="center" sx={{ p: 1 }}>{item.fat}</TableCell>
                      <TableCell align="center" sx={{ p: 1 }}>{item.carb}</TableCell>
                    </TableRow>
                  ))
                ) : detailFood ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ p: 2, color: 'text.secondary' }}>
                      Chưa có nguyên liệu chi tiết.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDetail} sx={{ textTransform: 'none', fontWeight: 700 }}>Đóng</Button>
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