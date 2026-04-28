import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import {
  getFoods,
  getIngredients,
  createFood,
  createIngredient,
  updateFood,
  deleteFood,
  restoreFood,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { INGREDIENT_GROUPS, labelForIngredientCategory } from "../../constants/ingredientCategories";
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
  Restore as RestoreIcon,
} from "@mui/icons-material";

const emptyFood = {
  name: "",
  calories: "0",
  protein: "0",
  fat: "0",
  carb: "0",
  ingredients: [],
};

const NUTRITION_CONFIG = [
  {
    key: "calories",
    label: "Kcal",
    unit: "kcal",
    color: "#f97316",
    icon: <CalorieIcon sx={{ fontSize: 16 }} />,
  },
  {
    key: "protein",
    label: "Chất đạm",
    unit: "g",
    color: "#6366f1",
    icon: <ProteinIcon sx={{ fontSize: 16 }} />,
  },
  {
    key: "fat",
    label: "Chất béo",
    unit: "g",
    color: "#eab308",
    icon: <FatIcon sx={{ fontSize: 16 }} />,
  },
  {
    key: "carb",
    label: "Tinh bột",
    unit: "g",
    color: "#22c55e",
    icon: <CarbIcon sx={{ fontSize: 16 }} />,
  },
];

const isNegativeOrNaN = (value) => {
  if (value === "" || value === null || value === undefined) return false;
  const parsed = Number(value);
  return Number.isNaN(parsed) || parsed < 0;
};

const calculateCaloriesFromMacros = (protein, fat, carb) => {
  const p = Number(protein) || 0;
  const f = Number(fat) || 0;
  const c = Number(carb) || 0;
  return Math.round((p * 4 + f * 9 + c * 4) * 10) / 10;
};

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

function FormField({ config, value, error, onChange, inputProps = {}, disabled = false }) {
  const isName = config.key === "name";
  return (
    <TextField
      fullWidth
      size="small"
      name={config.key}
      label={config.label}
      type={isName ? "text" : "number"}
      inputProps={{ ...(isName ? { maxLength: 20 } : { min: 0 }), ...inputProps }}
      value={value}
      onChange={onChange}
      error={Boolean(error)}
      helperText={error || " "}
      disabled={disabled}
      InputProps={
        !isName
          ? {
              readOnly: disabled,
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

function FoodCard({ food, maxValues, onView, onEdit, onDelete, onRestore, isTrashMode = false }) {
  const nutrients = [
    { key: "calories", label: "Kcal", unit: "kcal", color: "#f97316" },
    { key: "protein", label: "Chất đạm", unit: "g", color: "#6366f1" },
    { key: "fat", label: "Chất béo", unit: "g", color: "#eab308" },
    { key: "carb", label: "Tinh bột", unit: "g", color: "#22c55e" },
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
            {isTrashMode ? (
              <IconButton
                size="small"
                onClick={() => onRestore(food)}
                sx={{ color: "success.main", bgcolor: alpha("#16a34a", 0.07), borderRadius: 1.5, "&:hover": { bgcolor: alpha("#16a34a", 0.14) } }}
              >
                <RestoreIcon sx={{ fontSize: 16 }} />
              </IconButton>
            ) : (
              <>
                <IconButton size="small" onClick={() => onEdit(food)}
                  sx={{ color: "#4f46e5", bgcolor: alpha("#4f46e5", 0.07), borderRadius: 1.5, "&:hover": { bgcolor: alpha("#4f46e5", 0.14) } }}>
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(food)}
                  sx={{ color: "error.main", bgcolor: alpha("#ef4444", 0.07), borderRadius: 1.5, "&:hover": { bgcolor: alpha("#ef4444", 0.14) } }}>
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </>
            )}
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
  const [foodFilter, setFoodFilter] = useState("active");

  const [showModal, setShowModal] = useState(false);
  const [detailFood, setDetailFood] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [editingFood, setEditingFood] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(emptyFood);
  const [newIngredient, setNewIngredient] = useState({ name: "", quantity: "", unit: "g", calories: "", protein: "", fat: "", carb: "" });
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [showCustomRow, setShowCustomRow] = useState(false);
  const [customIngredient, setCustomIngredient] = useState({
    name: "",
    quantity: 100,
    unit: "g",
    calories: "",
    protein: "",
    fat: "",
    carb: "",
    category: "luong_thuc",
  });
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
      const res = await getFoods({ filter: foodFilter });
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

  useEffect(() => {
    fetchFoods();
  }, [foodFilter]);

  const maxValues = useMemo(
    () => ({
      calories: Math.max(...foods.map((f) => f.calories), 1),
      protein: Math.max(...foods.map((f) => f.protein), 1),
      fat: Math.max(...foods.map((f) => f.fat), 1),
      carb: Math.max(...foods.map((f) => f.carb), 1),
    }),
    [foods]
  );

  const handleOpenCreate = () => {
    setEditingFood(null);
    setForm(emptyFood);
    setErrors({});
    setShowCustomRow(false);
    setSelectedIngredient(null);
    setCustomIngredient({
      name: "",
      quantity: 100,
      unit: "g",
      calories: "",
      protein: "",
      fat: "",
      carb: "",
      category: "luong_thuc",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (food) => {
    setEditingFood(food);
    const ingredients = Array.isArray(food.ingredients) ? food.ingredients : [];
    const normalizedIngredients = ingredients.map((it) => {
      const parsedQty = parseQuantityFormat(it.quantity);
      const quantity = Number.isNaN(parsedQty.quantity) ? 100 : parsedQty.quantity;
      const unit = it.unit || parsedQty.unit || "g";
      return {
        ...it,
        quantity,
        unit,
        category: it.category || "luong_thuc",
      };
    });
    const nutrition = computeNutritionFromIngredients(normalizedIngredients);
    setForm({
      name: food.name || "",
      calories: nutrition.calories,
      protein: nutrition.protein,
      fat: nutrition.fat,
      carb: nutrition.carb,
      ingredients: normalizedIngredients,
    });
    setErrors({});
    setShowCustomRow(false);
    setSelectedIngredient(null);
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

  // Helper: Extract only the unit part (letters) from a string like "100g" or "g"
  const extractUnitOnly = (unitStr) => {
    if (!unitStr || unitStr === 'undefined') return 'g';
    const str = String(unitStr).trim();
    const match = str.match(/[a-zA-Z]+/);
    return (match && match[0]) || 'g';
  };

  // Helper: Parse combined quantity format (e.g., "100g" -> {quantity: 100, unit: "g"})
  const parseQuantityFormat = (combined) => {
    if (!combined) return { quantity: 100, unit: "g" };
    
    const combined_str = String(combined).trim();
    const match = combined_str.match(/^(-?[\d.]+)\s*([a-zA-Z]*)$/);
    
    if (match) {
      return {
        quantity: Number(match[1]),
        unit: match[2] || "g"
      };
    }
    return { quantity: Number.NaN, unit: "g" };
  };

  // Helper: Format quantity + unit together (e.g., {quantity: 100, unit: "g"} -> "100g")
  const formatQuantityDisplay = (quantity, unit) => {
    const q = quantity !== undefined && quantity !== null && quantity !== '' ? quantity : 100;
    const u = unit && unit !== 'undefined' ? unit : 'g';
    return `${q}${u}`;
  };

  const addIngredientFromLibrary = (ingredient) => {
    if (!ingredient) return;

    // Kiểm tra nguyên liệu đã có trong danh sách chưa
    const alreadyExists = form.ingredients.some((it) => it.name.toLowerCase() === ingredient.name.toLowerCase());
    if (alreadyExists) {
      toast.error(`Nguyên liệu "${ingredient.name}" đã có trong danh sách`);
      return;
    }

    // Tính Calories từ P/F/C (Protein*4 + Fat*9 + Carb*4)
    const p = Number(ingredient.protein) || 0;
    const f = Number(ingredient.fat) || 0;
    const c = Number(ingredient.carb) || 0;
    const calculatedCalories = Math.round((p * 4 + f * 9 + c * 4) * 10) / 10;

    // Thêm trực tiếp vào form.ingredients với mặc định 100g
    const finalUnit = extractUnitOnly(ingredient.unit) || 'g';
    const updatedIngredients = [
      ...form.ingredients,
      {
        name: ingredient.name || '',
        category: ingredient.category || "luong_thuc",
        quantity: 100,
        unit: finalUnit,
        calories: calculatedCalories,
        protein: p,
        fat: f,
        carb: c,
      },
    ];

    setForm((prev) => ({
      ...prev,
      ingredients: updatedIngredients,
      ...computeNutritionFromIngredients(updatedIngredients),
    }));

    // Reset selectedIngredient
    setSelectedIngredient(null);
  };




  const addCustomIngredient = async () => {
    const name = String(customIngredient.name || "").trim();
    if (!name) {
      toast.error("Vui lòng nhập tên nguyên liệu");
      return;
    }

    const alreadyExists = form.ingredients.some((it) => it.name.trim().toLowerCase() === name.toLowerCase());
    if (alreadyExists) {
      toast.error(`Nguyên liệu "${name}" đã có trong danh sách`);
      return;
    }

    const quantity = Number(customIngredient.quantity) || 100;
    const protein = Number(customIngredient.protein) || 0;
    const fat = Number(customIngredient.fat) || 0;
    const carb = Number(customIngredient.carb) || 0;
    const calories = calculateCaloriesFromMacros(protein, fat, carb);

    const category = customIngredient.category || "luong_thuc";

    if (isNegativeOrNaN(customIngredient.quantity) || quantity < 0) {
      toast.error("Số lượng nguyên liệu không được là số âm");
      return;
    }
    if (
      isNegativeOrNaN(customIngredient.calories) ||
      isNegativeOrNaN(customIngredient.protein) ||
      isNegativeOrNaN(customIngredient.fat) ||
      isNegativeOrNaN(customIngredient.carb)
    ) {
      toast.error("Chỉ số dinh dưỡng của nguyên liệu không được là số âm");
      return;
    }

    const newItem = {
      name,
      category,
      quantity,
      unit: String(customIngredient.unit || "g").trim() || "g",
      calories,
      protein,
      fat,
      carb,
    };

    const updatedIngredients = [...form.ingredients, newItem];
    setForm((prev) => ({ ...prev, ingredients: updatedIngredients, ...computeNutritionFromIngredients(updatedIngredients) }));

    setAvailableIngredients((prev) => {
      if (prev.some((it) => it.name.trim().toLowerCase() === name.toLowerCase())) return prev;
      return [...prev, { name, calories, protein, fat, carb, unit: newItem.unit, category }];
    });

    try {
      await createIngredient({ name, calories, protein, fat, carb, unit: newItem.unit, category });
      toast.success("Thêm nguyên liệu mới thành công và lưu vào danh sách chung");
    } catch (error) {
      toast.error("Không thể lưu nguyên liệu mới vào server, vẫn thêm vào món ăn tạm thời");
      console.error("createIngredient error", error);
    }

    setCustomIngredient((prev) => ({
      name: "",
      quantity: 100,
      unit: "g",
      calories: "",
      protein: "",
      fat: "",
      carb: "",
      category: prev.category || "luong_thuc",
    }));
  };

  const computeNutritionFromIngredients = (ingredients) => {
    const totals = ingredients.reduce(
      (acc, item) => {
        // Lấy giá trị dinh dưỡng gốc
        let c = Number(item.calories) || 0;
        let p = Number(item.protein) || 0;
        let f = Number(item.fat) || 0;
        let cb = Number(item.carb) || 0;

        // Nếu có số lượng, tính toán lại dựa trên tỷ lệ
        if (item.quantity !== undefined && item.quantity !== null && item.quantity !== "") {
          let quantity = Number(item.quantity);
          if (Number.isNaN(quantity) && typeof item.quantity === "string") {
            const parsed = parseQuantityFormat(item.quantity);
            quantity = parsed.quantity;
          }
          if (Number.isNaN(quantity) || quantity < 0) quantity = 100;
          // Giả sử unit mặc định là 100g, nên tính toán dựa trên tỷ lệ
          const ratio = quantity / 100;
          c = c * ratio;
          p = p * ratio;
          f = f * ratio;
          cb = cb * ratio;
        }

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
      calories: String(Math.round(totals.calories)),
      protein: String(Math.round(totals.protein * 10) / 10),
      fat: String(Math.round(totals.fat * 10) / 10),
      carb: String(Math.round(totals.carb * 10) / 10),
    };
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
      // Handle combined quantity+unit field
      if (field === 'quantityWithUnit') {
        const { quantity, unit } = parseQuantityFormat(value);
        if (Number.isNaN(Number(quantity)) || Number(quantity) < 0) {
          toast.error("Số lượng nguyên liệu không được là số âm");
          return prev;
        }
        const updatedIngredients = prev.ingredients.map((item, i) => {
          if (i !== index) return item;
          return { ...item, quantity, unit };
        });
        return {
          ...prev,
          ingredients: updatedIngredients,
          ...computeNutritionFromIngredients(updatedIngredients),
        };
      }

      // Convert numeric fields to number
      let finalValue = value;
      if (["calories", "protein", "fat", "carb"].includes(field)) {
        if (isNegativeOrNaN(value)) {
          toast.error("Không được nhập số âm");
          return prev;
        }
        finalValue = value === "" ? 0 : Number(value);
      }

      const updatedIngredients = prev.ingredients.map((item, i) => {
        if (i !== index) return item;

        const updated = { ...item, [field]: finalValue };
        
        // Auto-calculate calories from P/F/C if editing those fields
        if (['protein', 'fat', 'carb'].includes(field)) {
          const p = Number(updated.protein) || 0;
          const f = Number(updated.fat) || 0;
          const c = Number(updated.carb) || 0;
          updated.calories = Math.round((p * 4 + f * 9 + c * 4) * 10) / 10;
        }
        
        return updated;
      });

      return {
        ...prev,
        ingredients: updatedIngredients,
        ...computeNutritionFromIngredients(updatedIngredients),
      };
    });
  };

  const handleCustomMacroChange = (field, value) => {
    if (isNegativeOrNaN(value)) {
      toast.error("Không được nhập số âm");
      return;
    }

    setCustomIngredient((prev) => {
      if (isNegativeOrNaN(value) && value !== "") {
        toast.error("Giá trị dinh dưỡng không được là số âm");
        return prev;
      }
      const next = { ...prev, [field]: value };
      return {
        ...next,
        calories: String(calculateCaloriesFromMacros(next.protein, next.fat, next.carb)),
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
    if (["calories", "protein", "fat", "carb"].includes(name) && isNegativeOrNaN(value) && value !== "") {
      toast.error("Giá trị dinh dưỡng không được là số âm");
      return;
    }
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
      if (f.isDeleted) return false;
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
          category: item.category || "luong_thuc",
          quantity: item.quantity,
          unit: item.unit,
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

  const handleRestore = async (food) => {
    try {
      await restoreFood(food._id);
      toast.success(`Đã khôi phục món "${food.name}"`);
      fetchFoods();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Khôi phục thất bại");
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
        {foodFilter !== "deleted" && (
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
        )}
      </Stack>

      {/* Search */}
      <Card
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, mb: 2.5 }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mb={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
            <Chip
              label="Đang dùng"
              color={foodFilter === "active" ? "primary" : "default"}
              onClick={() => setFoodFilter("active")}
              variant={foodFilter === "active" ? "filled" : "outlined"}
            />
            <Chip
              label="Đã Xóa"
              color={foodFilter === "deleted" ? "warning" : "default"}
              onClick={() => setFoodFilter("deleted")}
              variant={foodFilter === "deleted" ? "filled" : "outlined"}
            />
          </Stack>
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
                {!search && foodFilter !== "deleted" && (
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreate}
                    sx={{ mt: 1, textTransform: "none" }}
                  >
                    Thêm món đầu tiên
                  </Button>
                )}
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {filtered.map((food) => (
                  <FoodCard
                    key={food._id}
                    food={food}
                    maxValues={maxValues}
                    onView={handleOpenDetail}
                    onEdit={handleOpenEdit}
                    onDelete={setDeleteTarget}
                    onRestore={handleRestore}
                    isTrashMode={foodFilter === "deleted"}
                  />
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
                          {!search && foodFilter !== "deleted" && (
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
                            {foodFilter === "deleted" ? (
                              <Tooltip title="Khôi phục" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleRestore(food)}
                                  sx={{ color: "success.main", bgcolor: alpha("#16a34a", 0.07), "&:hover": { bgcolor: alpha("#16a34a", 0.14) }, borderRadius: 1.5 }}
                                >
                                  <RestoreIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <>
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
                              </>
                            )}
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
        onClose={() => {
          if (saving) return;
          setShowModal(false);
          setShowCustomRow(false);
        }}
        maxWidth="lg"
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
              Thông tin dinh dưỡng (tự cập nhật theo nguyên liệu, không thể nhập tay)
            </Typography>
            <Grid container spacing={1.5}>
              {NUTRITION_CONFIG.map((n) => (
                <Grid item xs={6} key={n.key}>
                  <FormField
                    config={n}
                    value={form[n.key]}
                    error={errors[n.key]}
                    onChange={handleChange}
                    disabled
                  />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ mb: 1, fontWeight: 700 }}>Chọn nguyên liệu có sẵn</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Autocomplete
                  options={availableIngredients}
                  value={selectedIngredient}
                  getOptionLabel={(option) => `${option.name}`}
                  onChange={(_, value) => setSelectedIngredient(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Chọn nguyên liệu phổ biến"
                      placeholder="Chọn nguyên liệu phổ biến..."
                      sx={{ mb: 1 }}
                    />
                  )}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    if (selectedIngredient) {
                      addIngredientFromLibrary(selectedIngredient);
                      setSelectedIngredient(null);
                    }
                  }}
                  disabled={!selectedIngredient}
                  sx={{ mt: 0.5 }}
                >
                  Thêm
                </Button>
                <Button
                  variant={showCustomRow ? "contained" : "outlined"}
                  onClick={() =>
                    setShowCustomRow((prev) => {
                      const next = !prev;
                      if (next) {
                        setCustomIngredient((c) => ({ ...c, category: c.category || "luong_thuc" }));
                      }
                      return next;
                    })
                  }
                  sx={{ mt: 0.5 }}
                >
                  Khác
                </Button>
              </Box>
              {showCustomRow && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                  Chọn nhóm nguyên liệu trong bảng, điền thông tin rồi bấm Thêm mới để thêm vào món.
                </Typography>
              )}

              <Typography sx={{ fontWeight: 700, mb: 1, mt: 2 }}>
                Danh sách nguyên liệu ({form.ingredients?.length || 0})
              </Typography>

              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflowX: { xs: 'auto', sm: 'auto' } }}>
                <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 700, flex: 1.2 }}>Nguyên liệu</TableCell>
                      <TableCell sx={{ fontWeight: 700, minWidth: 128, maxWidth: 200 }}>Nhóm</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, flex: 1 }}>Số lượng</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, flex: 1 }}>Kcal</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, flex: 1, display: { xs: 'none', sm: 'table-cell' } }}>Chất đạm (g)</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, flex: 1, display: { xs: 'none', md: 'table-cell' } }}>Chất béo (g)</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, flex: 1, display: { xs: 'none', md: 'table-cell' } }}>Tinh bột (g)</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, flex: 0.8 }}>Hành động</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(form.ingredients || []).map((item, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: 600, flex: 1.2, wordBreak: 'break-word' }}>{item.name}</TableCell>
                        <TableCell sx={{ py: 0.5, verticalAlign: "middle", minWidth: 128, maxWidth: 220 }}>
                          <FormControl size="small" fullWidth>
                            <InputLabel id={`ing-cat-${idx}`}>Nhóm</InputLabel>
                            <Select
                              labelId={`ing-cat-${idx}`}
                              label="Nhóm"
                              value={item.category || "luong_thuc"}
                              onChange={(e) => handleIngredientChange(idx, "category", e.target.value)}
                            >
                              {INGREDIENT_GROUPS.map((g) => (
                                <MenuItem key={g.id} value={g.id}>
                                  {g.title}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell align="center" sx={{ flex: 1 }}>
                          <TextField
                            size="small"
                            defaultValue={formatQuantityDisplay(item.quantity || 100, item.unit || 'g')}
                            onChange={(e) => handleIngredientChange(idx, 'quantityWithUnit', e.target.value)}
                            placeholder="100g"
                            inputProps={{ style: { textAlign: 'center', fontSize: '0.875rem' } }}
                            sx={{ width: '100%' }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ flex: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={item.calories ?? 0}
                            disabled={true}
                            inputProps={{ style: { textAlign: 'center', fontSize: '0.875rem' } }}
                            sx={{ width: '100%' }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ flex: 1, display: { xs: 'none', sm: 'table-cell' } }}>
                          <TextField
                            size="small"
                            type="number"
                            value={item.protein ?? 0}
                            onChange={(e) => handleIngredientChange(idx, 'protein', e.target.value)}
                            inputProps={{ min: 0, style: { textAlign: 'center', fontSize: '0.875rem' } }}
                            sx={{ width: '100%' }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ flex: 1, display: { xs: 'none', md: 'table-cell' } }}>
                          <TextField
                            size="small"
                            type="number"
                            value={item.fat ?? 0}
                            onChange={(e) => handleIngredientChange(idx, 'fat', e.target.value)}
                            inputProps={{ min: 0, style: { textAlign: 'center', fontSize: '0.875rem' } }}
                            sx={{ width: '100%' }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ flex: 1, display: { xs: 'none', md: 'table-cell' } }}>
                          <TextField
                            size="small"
                            type="number"
                            value={item.carb ?? 0}
                            onChange={(e) => handleIngredientChange(idx, 'carb', e.target.value)}
                            inputProps={{ min: 0, style: { textAlign: 'center', fontSize: '0.875rem' } }}
                            sx={{ width: '100%' }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ flex: 0.8 }}>
                          <IconButton size="small" onClick={() => handleRemoveIngredient(idx)}
                            sx={{ color: 'error.main' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {showCustomRow && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, flex: 1.2, wordBreak: 'break-word' }}>
                          <TextField
                            size="small"
                            value={customIngredient.name}
                            onChange={(e) => setCustomIngredient((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Tên nguyên liệu"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell sx={{ py: 0.5, verticalAlign: "middle", minWidth: 128, maxWidth: 220 }}>
                          <FormControl size="small" fullWidth>
                            <InputLabel id="custom-ing-cat">Nhóm</InputLabel>
                            <Select
                              labelId="custom-ing-cat"
                              label="Nhóm"
                              value={customIngredient.category || "luong_thuc"}
                              onChange={(e) =>
                                setCustomIngredient((prev) => ({ ...prev, category: e.target.value }))
                              }
                            >
                              {INGREDIENT_GROUPS.map((g) => (
                                <MenuItem key={g.id} value={g.id}>
                                  {g.title}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell align="center" sx={{ flex: 1 }}>
                          <TextField
                            size="small"
                            value={customIngredient.quantity}
                            onChange={(e) => setCustomIngredient((prev) => ({ ...prev, quantity: e.target.value }))}
                            placeholder="100"
                            inputProps={{ min: 0, style: { textAlign: 'center', fontSize: '0.875rem' } }}
                            sx={{ width: '100%' }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ flex: 1 }}>
                          <TextField
                            size="small"
                            value={customIngredient.calories}
                            placeholder="Kcal"
                            type="number"
                            disabled
                            inputProps={{ min: 0, style: { textAlign: 'center', fontSize: '0.875rem' } }}
                            sx={{ width: '100%' }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ flex: 1, display: { xs: 'none', sm: 'table-cell' } }}>
                          <TextField
                            size="small"
                            value={customIngredient.protein}
                            onChange={(e) => handleCustomMacroChange("protein", e.target.value)}
                            placeholder="Chất đạm"
                            type="number"
                            inputProps={{ min: 0, style: { textAlign: 'center', fontSize: '0.875rem' } }}
                            sx={{ width: '100%' }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ flex: 1, display: { xs: 'none', md: 'table-cell' } }}>
                          <TextField
                            size="small"
                            value={customIngredient.fat}
                            onChange={(e) => handleCustomMacroChange("fat", e.target.value)}
                            placeholder="Chất béo"
                            type="number"
                            inputProps={{ min: 0, style: { textAlign: 'center', fontSize: '0.875rem' } }}
                            sx={{ width: '100%' }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ flex: 1, display: { xs: 'none', md: 'table-cell' } }}>
                          <TextField
                            size="small"
                            value={customIngredient.carb}
                            onChange={(e) => handleCustomMacroChange("carb", e.target.value)}
                            placeholder="Tinh bột"
                            type="number"
                            inputProps={{ min: 0, style: { textAlign: 'center', fontSize: '0.875rem' } }}
                            sx={{ width: '100%' }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ flex: 0.8 }}>
                          <Button size="small" variant="contained" onClick={addCustomIngredient}>
                            Thêm mới
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                    {(form.ingredients || []).length === 0 && !showCustomRow && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
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
            onClick={() => {
              setShowModal(false);
              setShowCustomRow(false);
            }}
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
            {saving ? "Đang lưu..." : editingFood ? "Chỉnh sửa" : "Thêm món ăn"}
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
                  <TableCell sx={{ fontWeight: 700, p: 1 }}>Nhóm</TableCell>
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
                      <TableCell sx={{ p: 1, fontSize: 13 }}>
                        {labelForIngredientCategory(item.category || "luong_thuc")}
                      </TableCell>
                      <TableCell align="center" sx={{ p: 1 }}>{item.quantity}</TableCell>
                      <TableCell align="center" sx={{ p: 1 }}>{item.calories}</TableCell>
                      <TableCell align="center" sx={{ p: 1 }}>{item.protein}</TableCell>
                      <TableCell align="center" sx={{ p: 1 }}>{item.fat}</TableCell>
                      <TableCell align="center" sx={{ p: 1 }}>{item.carb}</TableCell>
                    </TableRow>
                  ))
                ) : detailFood ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ p: 2, color: 'text.secondary' }}>
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