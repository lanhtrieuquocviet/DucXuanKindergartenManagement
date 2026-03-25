import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Send as SendIcon,
  AutoFixHigh as AutoFixIcon,
  AddCircle as AddIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import {
  aiAnalyzeMenu,
  aiImproveDish,
  aiSuggestNewDishes,
  aiChatAboutMenu,
  aiCreateDishFromSuggestion,
  aiHealthCheck,
} from "../../service/menu.api";
import { useSnackbar } from "notistack";

const AIMenuAssistant = ({ dailyMenuId, currentMenu, onDishCreated }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // chat, analyze, suggest, improve
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [improvements, setImprovements] = useState(null);
  const [selectedDishForImprovement, setSelectedDishForImprovement] = useState(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const messagesEndRef = useRef(null);
  const { enqueueSnackbar } = useSnackbar();

  // Check AI availability
  useEffect(() => {
    const checkAI = async () => {
      try {
        const res = await aiHealthCheck();
        setAiEnabled(res.data?.aiEnabled);
      } catch (error) {
        setAiEnabled(false);
      }
    };
    checkAI();
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const res = await aiChatAboutMenu(inputValue, dailyMenuId);
      const assistantMessage = {
        role: "assistant",
        content: res.data?.response || "Không thể lấy phản hồi",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMsg = {
        role: "assistant",
        content: `❌ Lỗi: ${error.response?.data?.message || error.message}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
      enqueueSnackbar("Lỗi khi gọi AI", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeMenu = async () => {
    setLoading(true);
    try {
      const res = await aiAnalyzeMenu(dailyMenuId);
      setAnalysis(res.data?.data);
      setActiveTab("analyze");
      enqueueSnackbar("✅ Phân tích thực đơn thành công", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("❌ Lỗi phân tích thực đơn", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestDishes = async () => {
    setLoading(true);
    try {
      const res = await aiSuggestNewDishes();
      setSuggestions(res.data?.data?.newDishes);
      setActiveTab("suggest");
      enqueueSnackbar("✅ Đề xuất món ăn thành công", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("❌ Lỗi đề xuất món ăn", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleImproveDish = async (foodId) => {
    if (!foodId) {
      enqueueSnackbar("Vui lòng chọn một món ăn để cải thiện", { variant: "warning" });
      return;
    }
    setLoading(true);
    try {
      const res = await aiImproveDish(foodId);
      setImprovements({
        dishName: res.data?.dishName,
        data: res.data?.data,
      });
      setActiveTab("improve");
      enqueueSnackbar("✅ Đề xuất cải thiện thành công", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("❌ Lỗi đề xuất cải thiện", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDish = async () => {
    if (!selectedSuggestion) return;

    setLoading(true);
    try {
      const payload = {
        name: selectedSuggestion.name,
        description: selectedSuggestion.description,
        ingredients: selectedSuggestion.ingredients,
        nutrition: selectedSuggestion.nutrition,
        cookingTip: selectedSuggestion.cookingTip,
      };
      await aiCreateDishFromSuggestion(payload);
      enqueueSnackbar("✅ Tạo món ăn thành công", { variant: "success" });
      setOpenCreateDialog(false);
      setSelectedSuggestion(null);
      onDishCreated?.();
    } catch (error) {
      enqueueSnackbar("❌ Lỗi tạo món ăn", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!aiEnabled) {
    return (
      <Alert severity="warning">
        ⚠️ AI Menu Assistant chưa được cấu hình. Vui lòng kiểm tra GEMINI_API_KEY.
      </Alert>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2 }}>
      {/* Tab Navigation */}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button
          variant={activeTab === "chat" ? "contained" : "outlined"}
          onClick={() => setActiveTab("chat")}
          size="small"
        >
          💬 Chat
        </Button>
        <Button
          variant={activeTab === "analyze" ? "contained" : "outlined"}
          onClick={handleAnalyzeMenu}
          size="small"
          disabled={loading}
        >
          📊 Phân Tích
        </Button>
        <Button
          variant={activeTab === "suggest" ? "contained" : "outlined"}
          onClick={handleSuggestDishes}
          size="small"
          disabled={loading}
        >
          ✨ Gợi Ý Món
        </Button>
        <Button
          variant={activeTab === "improve" ? "contained" : "outlined"}
          onClick={() => setActiveTab("improve")}
          size="small"
        >
          🔧 Cải Thiện
        </Button>
      </Box>

      {/* Chat Tab */}
      {activeTab === "chat" && (
        <Card sx={{ display: "flex", flexDirection: "column", height: "500px" }}>
          <CardContent
            sx={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {messages.length === 0 && (
              <Typography color="textSecondary" textAlign="center" sx={{ mt: 2 }}>
                👋 Xin chào! Tôi là AI hỗ trợ lên thực đơn. <br />
                Hỏi tôi gì cũng được: cân bằng dinh dưỡng, gợi ý món ăn, ...
              </Typography>
            )}
            {messages.map((msg, idx) => (
              <Paper
                key={idx}
                sx={{
                  p: 2,
                  bgcolor: msg.role === "user" ? "#e3f2fd" : "#f5f5f5",
                  ml: msg.role === "user" ? 2 : 0,
                  mr: msg.role === "assistant" ? 2 : 0,
                }}
              >
                <Typography variant="body2">
                  <strong>{msg.role === "user" ? "Bạn:" : "AI:"}</strong> {msg.content}
                </Typography>
              </Paper>
            ))}
            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <CircularProgress size={24} />
              </Box>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          <Box sx={{ display: "flex", gap: 1, p: 2, borderTop: "1px solid #eee" }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Nhập câu hỏi..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={loading}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleSendMessage}
              disabled={loading || !inputValue.trim()}
            >
              <SendIcon />
            </Button>
          </Box>
        </Card>
      )}

      {/* Analyze Tab */}
      {activeTab === "analyze" && analysis && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Phân Tích Thực Đơn
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" gutterBottom>
              <strong>Nhận xét:</strong> {analysis.analysis}
            </Typography>
            <Chip
              icon={analysis.isBalanced ? <CheckIcon /> : <AutoFixIcon />}
              label={analysis.isBalanced ? "Cân bằng dinh dưỡng ✅" : "Cần cải thiện 🔧"}
              color={analysis.isBalanced ? "success" : "warning"}
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" gutterBottom>
              <strong>Lời khuyên:</strong> {analysis.overallRecommendation}
            </Typography>

            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  💡 Đề Xuất Cải Thiện:
                </Typography>
                <List>
                  {analysis.suggestions.map((sugg, idx) => (
                    <ListItem key={idx}>
                      <ListItemText
                        primary={sugg.dishName}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" display="block">
                              🎯 {sugg.reason}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              📊 {sugg.nutrition.calories} kcal | Protein: {sugg.nutrition.protein}g |
                              Fat: {sugg.nutrition.fat}g | Carb: {sugg.nutrition.carb}g
                            </Typography>
                            <Typography variant="caption" display="block">
                              🍽️ {sugg.portion}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suggest New Dishes Tab */}
      {activeTab === "suggest" && suggestions && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ✨ Gợi Ý Món Ăn Mới
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              {suggestions.map((dish, idx) => (
                <Grid item xs={12} sm={6} key={idx}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {dish.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {dish.description}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      <strong>Dinh dưỡng:</strong> {dish.nutrition.calories} kcal
                    </Typography>
                    <Typography variant="caption" display="block">
                      Protein: {dish.nutrition.protein}g | Fat: {dish.nutrition.fat}g | Carb:{" "}
                      {dish.nutrition.carb}g
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      💡 {dish.cookingTip}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      sx={{ mt: 1 }}
                      onClick={() => {
                        setSelectedSuggestion(dish);
                        setOpenCreateDialog(true);
                      }}
                    >
                      Tạo Món
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Improve Dish Tab */}
      {activeTab === "improve" && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔧 Cải Thiện Món Ăn
            </Typography>
            <Divider sx={{ my: 2 }} />

            {improvements ? (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Cải Thiện: {improvements.dishName}
                </Typography>
                <List>
                  {improvements.data.improvements?.map((imp, idx) => (
                    <ListItem key={idx}>
                      <ListItemText
                        primary={imp.suggestion}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" display="block">
                              Lý do: {imp.reason}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              Dinh dưỡng dự kiến: {imp.expectedNutrition.calories} kcal |
                              Protein: {imp.expectedNutrition.protein}g
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                <Typography variant="body2" sx={{ mt: 2 }}>
                  <strong>Đề xuất chung:</strong> {improvements.data.recommendation}
                </Typography>
              </>
            ) : (
              <Typography color="textSecondary">
                Chọn một món ăn từ thực đơn để xem gợi ý cải thiện
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Dish Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tạo Món Ăn Mới</DialogTitle>
        <DialogContent>
          {selectedSuggestion && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
              <Typography variant="body2">
                <strong>Tên:</strong> {selectedSuggestion.name}
              </Typography>
              <Typography variant="body2">
                <strong>Mô tả:</strong> {selectedSuggestion.description}
              </Typography>
              <Typography variant="body2">
                <strong>Dinh dưỡng:</strong> {selectedSuggestion.nutrition.calories} kcal,
                Protein: {selectedSuggestion.nutrition.protein}g
              </Typography>
              <Typography variant="body2">
                <strong>Nguyên liệu:</strong>
              </Typography>
              <List dense>
                {selectedSuggestion.ingredients?.map((ing, idx) => (
                  <ListItem key={idx}>
                    <ListItemText
                      primary={ing.name}
                      secondary={ing.quantity}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleCreateDish}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            Tạo Món
          </Button>
        </DialogActions>
      </Dialog>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default AIMenuAssistant;
