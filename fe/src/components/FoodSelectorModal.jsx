import { useEffect, useState, useMemo } from "react";
import { getFoods } from "../service/menu.api";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Skeleton,
  Stack,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import {
  Search as SearchIcon,
  LocalFireDepartment as CalorieIcon,
  Restaurant as FoodIcon,
  Clear as ClearIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";

function FoodSelectorModal({ open, selectedFoods = [], onClose, onSave }) {
  const [allFoods, setAllFoods] = useState([]);
  const [checked, setChecked] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) fetchFoods();
  }, [open]);

  useEffect(() => {
    if (open) setChecked(selectedFoods.map((f) => f._id));
  }, [open, selectedFoods]);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const res = await getFoods();
      setAllFoods(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? allFoods.filter((f) => f.name.toLowerCase().includes(q))
      : allFoods;
  }, [allFoods, search]);

  const toggleFood = (id) => {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedList = allFoods.filter((f) => checked.includes(f._id));
  const totalCalories = selectedList.reduce((s, f) => s + (f.calories || 0), 0);
  const totalProtein = selectedList.reduce((s, f) => s + (f.protein || 0), 0);

  const handleSave = () => onSave(selectedList);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          height: "80vh",
          display: "flex",
          flexDirection: "column",
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
          flexShrink: 0,
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          }}
        >
          <FoodIcon sx={{ fontSize: 18 }} />
        </Avatar>
        Chọn món ăn
        {checked.length > 0 && (
          <Chip
            label={`${checked.length} món`}
            size="small"
            color="primary"
            sx={{ ml: "auto", fontWeight: 700 }}
          />
        )}
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1.5, flexShrink: 0 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Tìm kiếm món ăn..."
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
                <ClearIcon
                  sx={{ fontSize: 16, cursor: "pointer", color: "text.disabled" }}
                  onClick={() => setSearch("")}
                />
              </InputAdornment>
            ),
            sx: { borderRadius: 2 },
          }}
        />
      </Box>

      <DialogContent
        sx={{ px: 1.5, py: 0, flex: 1, overflow: "auto", minHeight: 0 }}
      >
        {loading ? (
          <Stack spacing={0.5} sx={{ px: 1.5 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={52} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Avatar sx={{ width: 52, height: 52, bgcolor: "grey.100", mx: "auto", mb: 1.5 }}>
              <FoodIcon sx={{ fontSize: 26, color: "grey.400" }} />
            </Avatar>
            <Typography color="text.secondary" fontWeight={600} fontSize={14}>
              Không tìm thấy món ăn
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {filtered.map((food) => {
              const isChecked = checked.includes(food._id);
              return (
                <ListItem key={food._id} disablePadding sx={{ px: 1.5, mb: 0.25 }}>
                  <ListItemButton
                    onClick={() => toggleFood(food._id)}
                    sx={{
                      borderRadius: 2,
                      py: 0.75,
                      bgcolor: isChecked ? alpha("#4f46e5", 0.07) : "transparent",
                      border: "1px solid",
                      borderColor: isChecked
                        ? alpha("#4f46e5", 0.25)
                        : "transparent",
                      "&:hover": {
                        bgcolor: isChecked
                          ? alpha("#4f46e5", 0.1)
                          : "grey.50",
                      },
                      transition: "all 0.12s",
                    }}
                  >
                    <Checkbox
                      checked={isChecked}
                      edge="start"
                      disableRipple
                      size="small"
                      sx={{
                        mr: 0.5,
                        color: "text.disabled",
                        "&.Mui-checked": { color: "primary.main" },
                      }}
                    />
                    <ListItemAvatar sx={{ minWidth: 38 }}>
                      <Avatar
                        sx={{
                          width: 30,
                          height: 30,
                          bgcolor: isChecked
                            ? alpha("#4f46e5", 0.12)
                            : "grey.100",
                          fontSize: 14,
                        }}
                      >
                        🍽️
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          fontWeight={isChecked ? 700 : 500}
                          color={isChecked ? "primary.main" : "text.primary"}
                        >
                          {food.name}
                        </Typography>
                      }
                      secondary={
                        <Stack direction="row" spacing={1.5} mt={0.25}>
                          <Typography
                            variant="caption"
                            sx={{ color: "#f97316", fontWeight: 600, fontSize: 11 }}
                          >
                            🔥 {food.calories} kcal
                          </Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
                            P: {food.protein}g · F: {food.fat}g · C: {food.carb}g
                          </Typography>
                        </Stack>
                      }
                    />
                    {isChecked && (
                      <CheckIcon sx={{ fontSize: 18, color: "primary.main", ml: 1 }} />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>

      {/* Footer summary */}
      {checked.length > 0 && (
        <>
          <Divider />
          <Box sx={{ px: 3, py: 1.25, bgcolor: alpha("#4f46e5", 0.04), flexShrink: 0 }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Đã chọn{" "}
                <Typography component="span" color="primary.main" fontWeight={800}>
                  {checked.length}
                </Typography>{" "}
                món:
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  icon={<CalorieIcon sx={{ fontSize: 13, color: "#f97316 !important" }} />}
                  label={`${totalCalories} kcal`}
                  size="small"
                  sx={{ fontSize: 11, fontWeight: 700, bgcolor: alpha("#f97316", 0.1) }}
                />
                <Chip
                  label={`Protein: ${totalProtein}g`}
                  size="small"
                  sx={{ fontSize: 11, fontWeight: 700, bgcolor: alpha("#6366f1", 0.1) }}
                />
              </Stack>
            </Stack>
          </Box>
        </>
      )}

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1, flexShrink: 0 }}>
        <Button
          onClick={onClose}
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
          onClick={handleSave}
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
          }}
        >
          Lưu {checked.length > 0 ? `(${checked.length} món)` : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FoodSelectorModal;
