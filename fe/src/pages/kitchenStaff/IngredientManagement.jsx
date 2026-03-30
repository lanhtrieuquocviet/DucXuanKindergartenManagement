import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "../../service/menu.api";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Restaurant as IngredientIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";

const emptyIngredient = {
  name: "",
};

function IngredientCard({ ingredient, onEdit, onDelete }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: alpha("#4f46e5", 0.1), fontSize: 15 }}>🥕</Avatar>
            <Typography variant="body2" fontWeight={700}>{ingredient.name}</Typography>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Chỉnh sửa" arrow>
              <IconButton size="small" onClick={() => onEdit(ingredient)}
                sx={{ color: "#4f46e5", bgcolor: alpha("#4f46e5", 0.07), borderRadius: 1.5, "&:hover": { bgcolor: alpha("#4f46e5", 0.14) } }}>
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Xóa" arrow>
              <IconButton size="small" onClick={() => onDelete(ingredient)}
                sx={{ color: "error.main", bgcolor: alpha("#ef4444", 0.07), borderRadius: 1.5, "&:hover": { bgcolor: alpha("#ef4444", 0.14) } }}>
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function IngredientManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyIngredient);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const res = await getIngredients();
      setIngredients(res.data || []);
    } catch (error) {
      console.error("Lấy nguyên liệu thất bại", error);
      toast.error("Không thể tải danh sách nguyên liệu");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return ingredients;
    const q = search.toLowerCase();
    return ingredients.filter((i) => i.name.toLowerCase().includes(q));
  }, [ingredients, search]);

  const handleOpenCreate = () => {
    setEditingIngredient(null);
    setForm(emptyIngredient);
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (ingredient) => {
    setEditingIngredient(ingredient);
    setForm({ name: ingredient.name });
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setForm(emptyIngredient);
    setErrors({});
    setEditingIngredient(null);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    if (!form.name || !form.name.trim()) {
      newErrors.name = "Tên nguyên liệu không được để trống";
      isValid = false;
    } else if (form.name.length > 30) {
      newErrors.name = "Tên nguyên liệu tối đa 30 ký tự";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      
      if (editingIngredient) {
        // Nếu tên không thay đổi, chỉ show success mà không gọi API
        if (form.name.trim() === editingIngredient.name.trim()) {
          toast.success("Cập nhật nguyên liệu thành công");
          handleCloseModal();
          return;
        }

        // Kiểm tra trùng lặp với các nguyên liệu khác
        const isDuplicate = ingredients.some(
          (i) => i._id !== editingIngredient._id && i.name.trim().toLowerCase() === form.name.trim().toLowerCase()
        );

        if (isDuplicate) {
          toast.error(`Nguyên liệu "${form.name}" đã tồn tại!`);
          setErrors((prev) => ({ ...prev, name: "Nguyên liệu đã tồn tại" }));
          setSaving(false);
          return;
        }

        await updateIngredient(editingIngredient._id, { name: form.name.trim() });
        toast.success("Cập nhật nguyên liệu thành công");
      } else {
        // Kiểm tra trùng lặp (tạo mới)
        const isDuplicate = ingredients.some(
          (i) => i.name.trim().toLowerCase() === form.name.trim().toLowerCase()
        );

        if (isDuplicate) {
          toast.error(`Nguyên liệu "${form.name}" đã tồn tại!`);
          setErrors((prev) => ({ ...prev, name: "Nguyên liệu đã tồn tại" }));
          setSaving(false);
          return;
        }

        await createIngredient({ name: form.name.trim() });
        toast.success("Thêm nguyên liệu thành công");
      }
      handleCloseModal();
      fetchIngredients();
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
      await deleteIngredient(deleteTarget._id);
      toast.success("Xóa thành công");
      setDeleteTarget(null);
      fetchIngredients();
    } catch (error) {
      toast.error(error.response?.data?.message || "Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

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
            Quản lý nguyên liệu
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            Quản lý danh sách nguyên liệu sử dụng trong bếp
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
          Thêm nguyên liệu
        </Button>
      </Stack>

      {/* Stats */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(2, 1fr)" }, gap: { xs: 1.5, sm: 2 }, mb: 3 }}>
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, bgcolor: alpha("#4f46e5", 0.12), flexShrink: 0 }}>
                <IngredientIcon sx={{ color: "#4f46e5" }} />
              </Avatar>
              <Box>
                <Typography fontWeight={700} sx={{ fontSize: { xs: 16, sm: 20 } }}>{ingredients.length}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: 10, sm: 12 } }}>Tổng nguyên liệu</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, bgcolor: alpha("#22c55e", 0.12), flexShrink: 0 }}>
                <SearchIcon sx={{ color: "#22c55e" }} />
              </Avatar>
              <Box>
                <Typography fontWeight={700} sx={{ fontSize: { xs: 16, sm: 20 } }}>{filtered.length}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: 10, sm: 12 } }}>Kết quả</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Search & List */}
      <Card
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, mb: 2.5 }}
      >
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm kiếm nguyên liệu..."
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
                  <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 2.5 }} />
                ))}
              </Stack>
            ) : filtered.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: "grey.100", mx: "auto", mb: 1.5 }}>
                  <IngredientIcon sx={{ fontSize: 28, color: "grey.400" }} />
                </Avatar>
                <Typography color="text.secondary" fontWeight={600} variant="body2">
                  {search ? "Không tìm thấy nguyên liệu phù hợp" : "Chưa có nguyên liệu nào"}
                </Typography>
                {!search && (
                  <Button size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ mt: 1, textTransform: "none" }}>
                    Thêm nguyên liệu đầu tiên
                  </Button>
                )}
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {filtered.map((ingredient) => (
                  <IngredientCard key={ingredient._id} ingredient={ingredient} onEdit={handleOpenEdit} onDelete={setDeleteTarget} />
                ))}
              </Stack>
            )}
          </Box>
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 400 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 1.5 }}>Tên nguyên liệu</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: 13, py: 1.5, width: 100 }}>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 2 }).map((__, j) => (
                          <TableCell key={j}><Skeleton variant="text" height={32} /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ py: 6 }}>
                        <Stack alignItems="center" spacing={1}>
                          <Avatar sx={{ width: 56, height: 56, bgcolor: "grey.100" }}>
                            <IngredientIcon sx={{ fontSize: 28, color: "grey.400" }} />
                          </Avatar>
                          <Typography color="text.secondary" fontWeight={600}>
                            {search ? "Không tìm thấy nguyên liệu phù hợp" : "Chưa có nguyên liệu nào"}
                          </Typography>
                          {!search && (
                            <Button size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ textTransform: "none" }}>
                              Thêm nguyên liệu đầu tiên
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((ingredient) => (
                      <TableRow key={ingredient._id} hover sx={{ "&:hover": { bgcolor: "rgba(99,102,241,0.03)" }, transition: "background 0.15s" }}>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: alpha("#4f46e5", 0.1), fontSize: 15 }}>🥕</Avatar>
                            <Typography variant="body2" fontWeight={600}>{ingredient.name}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Chỉnh sửa" arrow>
                              <IconButton size="small" onClick={() => handleOpenEdit(ingredient)}
                                sx={{ color: "#4f46e5", bgcolor: alpha("#4f46e5", 0.07), "&:hover": { bgcolor: alpha("#4f46e5", 0.14) }, borderRadius: 1.5 }}>
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa" arrow>
                              <IconButton size="small" onClick={() => setDeleteTarget(ingredient)}
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
              Hiển thị <strong>{filtered.length}/{ingredients.length}</strong> nguyên liệu
              {search && (
                <Chip label={`Lọc: "${search}"`} size="small" onDelete={() => setSearch("")} sx={{ ml: 1, height: 20, fontSize: 11 }} />
              )}
            </Typography>
          </Box>
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog
        open={showModal}
        onClose={handleCloseModal}
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
            {editingIngredient ? <EditIcon sx={{ fontSize: 18 }} /> : <AddIcon sx={{ fontSize: 18 }} />}
          </Avatar>
          {editingIngredient ? "Chỉnh sửa nguyên liệu" : "Thêm nguyên liệu mới"}
        </DialogTitle>

        <DialogContent sx={{ px: 3, pt: 1.5, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            name="name"
            label="Tên nguyên liệu"
            value={form.name}
            onChange={handleChange}
            error={Boolean(errors.name)}
            helperText={errors.name || " "}
            inputProps={{ maxLength: 30 }}
            sx={{ mt: 1 }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button onClick={handleCloseModal} sx={{ textTransform: "none" }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            sx={{
              borderRadius: 2,
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              textTransform: "none",
            }}
          >
            {saving ? "Đang lưu..." : editingIngredient ? "Cập nhật" : "Thêm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16 }}>
          Xác nhận xóa
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography>
            Bạn có chắc chắn muốn xóa nguyên liệu <strong>"{deleteTarget?.name}"</strong>?
          </Typography>
          <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: "none" }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            sx={{ textTransform: "none" }}
          >
            {deleting ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default IngredientManagement;
