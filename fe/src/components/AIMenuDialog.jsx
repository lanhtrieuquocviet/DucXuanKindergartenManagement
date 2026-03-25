import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Stack,
  Grid,
  TextField,
  alpha,
} from "@mui/material";
import {
  AutoAwesome as AIIcon,
  LocalFireDepartment as CalorieIcon,
  Egg as ProteinIcon,
  Opacity as FatIcon,
  Grain as CarbIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import {
  suggestNewDishes,
  improveDish,
  createDishFromSuggestion,
} from "../service/ai.api";

/**
 * AIMenuDialog - Detailed modal for AI menu suggestions
 */
function AIMenuDialog({ open, onClose, menu, isEditable }) {
  if (!menu) return null;

  const [activeTab, setActiveTab] = useState("suggest"); // suggest, improve
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentFoods, setCurrentFoods] = useState([]);
  const [error, setError] = useState(null);

  // Load suggestions
  const handleLoadSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await suggestNewDishes();
      setSuggestions(res.data?.data?.newDishes || []);
      setActiveTab("suggest");
      toast.success("Đã tải gợi ý món ăn");
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      setError(errorMsg);
      toast.error("Lỗi khi tải gợi ý: " + errorMsg);
      console.error("AI Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load current dishes to improve
  const handleLoadCurrentDishes = () => {
    const dishes = [];
    try {
      if (menu?.weeks?.odd) {
        Object.values(menu.weeks.odd).forEach((day) => {
          if (day) {
            dishes.push(...(day.lunchFoods || []), ...(day.afternoonFoods || []));
          }
        });
      }
      if (menu?.weeks?.even) {
        Object.values(menu.weeks.even).forEach((day) => {
          if (day) {
            dishes.push(...(day.lunchFoods || []), ...(day.afternoonFoods || []));
          }
        });
      }
    } catch (e) {
      console.error("Error loading current dishes:", e);
    }
    // Remove duplicates
    const unique = Array.from(new Map(dishes.map((d) => [d._id, d])).values());
    setCurrentFoods(unique);
    setActiveTab("improve");
  };

  // Improve a specific dish
  const handleImproveDish = async (foodId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await improveDish(foodId);
      setSelectedSuggestion({
        ...res.data?.data,
        foodName: res.data?.dishName,
        isImprovement: true,
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      setError(errorMsg);
      toast.error("Lỗi khi tải gợi ý cải thiện: " + errorMsg);
      console.error("AI Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create dish from suggestion
  const handleCreateDish = async () => {
    if (!selectedSuggestion) return;

    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: selectedSuggestion.name || selectedSuggestion.foodName,
        description: selectedSuggestion.description || "",
        ingredients: selectedSuggestion.ingredients || [],
        nutrition: selectedSuggestion.nutrition || selectedSuggestion.expectedNutrition || {},
        cookingTip: selectedSuggestion.cookingTip || "",
      };
      await createDishFromSuggestion(payload);
      toast.success("✅ Tạo món ăn thành công");
      setCreateDialogOpen(false);
      setSelectedSuggestion(null);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      setError(errorMsg);
      toast.error("Lỗi khi tạo món ăn: " + errorMsg);
      console.error("AI Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          fontWeight: 800,
        }}
      >
        <AIIcon />
        AI Thông Minh Hỗ Trợ Thực Đơn
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {!selectedSuggestion ? (
          <>
            {/* Tab Navigation */}
            <Box sx={{ display: "flex", gap: 1, mb: 3, borderBottom: "1px solid #eee", pb: 1.5 }}>
              <Button
                variant={activeTab === "suggest" ? "contained" : "outlined"}
                size="small"
                startIcon={<AddIcon />}
                onClick={() => {
                  setActiveTab("suggest");
                  if (!suggestions) handleLoadSuggestions();
                }}
                disabled={loading}
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                ✨ Gợi ý Món Mới
              </Button>
              <Button
                variant={activeTab === "improve" ? "contained" : "outlined"}
                size="small"
                startIcon={<EditIcon />}
                onClick={() => {
                  setActiveTab("improve");
                  if (currentFoods.length === 0) handleLoadCurrentDishes();
                }}
                disabled={loading || !isEditable}
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                📋 Chỉnh Sửa Thực Đơn
              </Button>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
                  ❌ Lỗi từ AI
                </Typography>
                <Typography variant="body2">{error}</Typography>
                <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                  💡 Gợi ý: Kiểm tra lại API key hoặc thử lại sau ít phút
                </Typography>
              </Alert>
            )}

            {/* Content based on tab */}
            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {activeTab === "suggest" && !loading && (
              <Box>
                {!suggestions ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Nhấp nút "Gợi ý Món Mới" ở trên để AI đề xuất các món ăn mới phù hợp
                  </Alert>
                ) : suggestions.length === 0 ? (
                  <Alert severity="warning">Không có gợi ý nào</Alert>
                ) : (
                  <Stack spacing={2}>
                    {suggestions.map((suggestion, index) => (
                      <Card
                        key={index}
                        sx={{
                          cursor: "pointer",
                          transition: "all 0.2s",
                          "&:hover": {
                            boxShadow: "0 4px 16px rgba(102, 126, 234, 0.2)",
                            transform: "translateY(-2px)",
                          },
                        }}
                        onClick={() => setSelectedSuggestion(suggestion)}
                      >
                        <CardContent sx={{ pb: 1.5 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {suggestion.name}
                            </Typography>
                            <Chip size="small" label="Xem chi tiết" color="primary" variant="outlined" />
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: 40 }}>
                            {suggestion.description}
                          </Typography>

                          {/* Nutrition Info */}
                          <Grid container spacing={1}>
                            <Grid item xs={3}>
                              <Box sx={{ textAlign: "center" }}>
                                <Typography variant="caption" sx={{ fontSize: 10, color: "text.secondary", display: "block" }}>
                                  Calories
                                </Typography>
                                <Typography variant="body2" fontWeight={700} sx={{ color: "#f97316" }}>
                                  {suggestion.nutrition?.calories || suggestion.calories || "—"}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: 9, color: "text.secondary" }}>
                                  kcal
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={3}>
                              <Box sx={{ textAlign: "center" }}>
                                <Typography variant="caption" sx={{ fontSize: 10, color: "text.secondary", display: "block" }}>
                                  Protein
                                </Typography>
                                <Typography variant="body2" fontWeight={700} sx={{ color: "#6366f1" }}>
                                  {suggestion.nutrition?.protein || suggestion.protein || "—"}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: 9, color: "text.secondary" }}>
                                  g
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={3}>
                              <Box sx={{ textAlign: "center" }}>
                                <Typography variant="caption" sx={{ fontSize: 10, color: "text.secondary", display: "block" }}>
                                  Chất béo
                                </Typography>
                                <Typography variant="body2" fontWeight={700} sx={{ color: "#eab308" }}>
                                  {suggestion.nutrition?.fat || suggestion.fat || "—"}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: 9, color: "text.secondary" }}>
                                  g
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={3}>
                              <Box sx={{ textAlign: "center" }}>
                                <Typography variant="caption" sx={{ fontSize: 10, color: "text.secondary", display: "block" }}>
                                  Tinh bột
                                </Typography>
                                <Typography variant="body2" fontWeight={700} sx={{ color: "#22c55e" }}>
                                  {suggestion.nutrition?.carb || suggestion.carb || "—"}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: 9, color: "text.secondary" }}>
                                  g
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            {activeTab === "improve" && !loading && (
              <Box>
                {currentFoods.length === 0 ? (
                  <Alert severity="info">Không có món ăn nào để cải thiện. Vui lòng thêm các món vào thực đơn trước.</Alert>
                ) : (
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Chọn một món để nhận gợi ý cải thiện:
                    </Typography>
                    {currentFoods.map((food) => (
                      <ListItemButton
                        key={food._id}
                        onClick={() => handleImproveDish(food._id)}
                        sx={{
                          border: "1px solid #eee",
                          borderRadius: 1.5,
                          mb: 0.5,
                          transition: "all 0.2s",
                          "&:hover": {
                            bgcolor: alpha("#667eea", 0.05),
                            borderColor: "#667eea",
                          },
                        }}
                      >
                        <ListItemText
                          primary={food.name}
                          secondary={`${food.calories} kcal • Protein: ${food.protein}g`}
                          primaryTypographyProps={{ fontWeight: 600 }}
                        />
                      </ListItemButton>
                    ))}
                  </Stack>
                )}
              </Box>
            )}
          </>
        ) : (
          /* Detailed View */
          <Box>
            <Button
              size="small"
              onClick={() => setSelectedSuggestion(null)}
              startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
              sx={{ mb: 2, textTransform: "none" }}
            >
              Quay lại
            </Button>

            <Box sx={{ bgcolor: alpha("#667eea", 0.05), p: 2, borderRadius: 2, mb: 2 }}>
              <Typography variant="h6" fontWeight={700} mb={0.5}>
                {selectedSuggestion.name || selectedSuggestion.foodName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedSuggestion.description}
              </Typography>
            </Box>

            {/* Nutrition Grid */}
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
              Thông tin dinh dưỡng
            </Typography>
            <Grid container spacing={1.5} mb={3}>
              <Grid item xs={6} sm={3}>
                <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                      Calories
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ color: "#f97316" }}>
                      {selectedSuggestion.nutrition?.calories ||
                        selectedSuggestion.calories ||
                        selectedSuggestion.expectedNutrition?.calories ||
                        "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      kcal
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                      Protein
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ color: "#6366f1" }}>
                      {selectedSuggestion.nutrition?.protein ||
                        selectedSuggestion.protein ||
                        selectedSuggestion.expectedNutrition?.protein ||
                        "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      g
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                      Chất béo
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ color: "#eab308" }}>
                      {selectedSuggestion.nutrition?.fat ||
                        selectedSuggestion.fat ||
                        selectedSuggestion.expectedNutrition?.fat ||
                        "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      g
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                      Tinh bột
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ color: "#22c55e" }}>
                      {selectedSuggestion.nutrition?.carb ||
                        selectedSuggestion.carb ||
                        selectedSuggestion.expectedNutrition?.carb ||
                        "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      g
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Ingredients */}
            {selectedSuggestion.ingredients && selectedSuggestion.ingredients.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                  Nguyên liệu ({selectedSuggestion.ingredients.length})
                </Typography>
                <Box sx={{ bgcolor: "grey.50", borderRadius: 2, p: 1.5, mb: 2, maxHeight: 200, overflowY: "auto" }}>
                  {selectedSuggestion.ingredients.map((ing, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        py: 0.75,
                        borderBottom: idx < selectedSuggestion.ingredients.length - 1 ? "1px solid #ddd" : "none",
                      }}
                    >
                      <Typography variant="caption" fontWeight={600}>
                        {ing.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ing.quantity} {ing.unit || ""}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}

            {/* Improvements/Reason */}
            {selectedSuggestion.improvements && selectedSuggestion.improvements.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>
                  Gợi ý cải thiện
                </Typography>
                {selectedSuggestion.improvements.map((imp, idx) => (
                  <Alert key={idx} severity="info" sx={{ mb: 1, fontSize: 12 }}>
                    <strong>{imp.suggestion}</strong> - {imp.reason}
                  </Alert>
                ))}
              </>
            )}

            {selectedSuggestion.reason && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Lý do đề xuất:</strong> {selectedSuggestion.reason}
              </Alert>
            )}

            {selectedSuggestion.cookingTip && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <strong>💡 Mẹo nấu:</strong> {selectedSuggestion.cookingTip}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Đóng
        </Button>
        {selectedSuggestion && !selectedSuggestion.isImprovement && (
          <Button
            variant="contained"
            color="success"
            onClick={() => setCreateDialogOpen(true)}
            disabled={loading}
            startIcon={<CheckIcon />}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
          >
            {loading ? "Đang tạo..." : "Tạo Món Này"}
          </Button>
        )}
      </DialogActions>

      {/* Confirmation Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận tạo món ăn</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Bạn có chắc muốn thêm "<strong>{selectedSuggestion?.name}</strong>" vào danh sách món ăn?
          </Typography>
          <Alert severity="info">Món ăn sẽ được lưu vào database và có thể sử dụng ngay trong thực đơn.</Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={loading}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleCreateDish}
            disabled={loading}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {loading ? "Đang tạo..." : "Xác nhận"}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

export default AIMenuDialog;
