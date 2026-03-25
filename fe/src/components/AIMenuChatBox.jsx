import { useState, useRef, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Stack,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  alpha,
  Divider,
  Button,
} from "@mui/material";
import {
  Send as SendIcon,
  Close as CloseIcon,
  Lightbulb as TipIcon,
  AutoAwesome as AIIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { chatWithAI } from "../service/ai.api";

/**
 * AIMenuChatBox - Real-time chat component for menu suggestions
 * Allows users to ask questions and get AI suggestions for menu updates
 */
function AIMenuChatBox({ menu, isEditable, onClose }) {
  if (!menu?._id) return null;

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Xin chào! 👋 Tôi là trợ lý AI dinh dưỡng. Bạn có câu hỏi gì về thực đơn hôm nay?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sample suggestions for quick actions
  const quickSuggestions = [
    "Thực đơn hôm nay có cân bằng không?",
    "Gợi ý cải thiện bữa trưa",
    "Đủ protein không?",
    "Có gợi ý thay thế nào không?",
  ];

  // Handle sending message
  const handleSendMessage = async (text) => {
    if (!text.trim() && !inputValue.trim()) return;

    const messageText = text || inputValue;
    setInputValue("");
    setLoading(true);

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await chatWithAI(messageText, menu._id);

      // Add AI response
      const aiMessage = {
        id: messages.length + 2,
        role: "assistant",
        content: response.data?.data?.response || "Tôi không thể trả lời câu hỏi này.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      toast.error("Lỗi: " + errorMsg);

      const errorMessage = {
        id: messages.length + 2,
        role: "assistant",
        content: `❌ Lỗi: ${errorMsg}. Vui lòng thử lại sau.`,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage("");
    }
  };

  return (
    <Card
      elevation={4}
      sx={{
        position: "fixed",
        bottom: 32,
        right: 32,
        width: { xs: "calc(100% - 32px)", sm: 400 },
        height: { xs: "60vh", sm: 600 },
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)",
        zIndex: 1000,
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          borderBottom: "1px solid " + alpha("white", 0.2),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AIIcon sx={{ fontSize: 24 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              Trợ Lý Thực Đơn AI
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Gợi ý cập nhật thực đơn
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "white" }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          backgroundColor: alpha("#000", 0.3),
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: alpha("white", 0.1),
          },
          "&::-webkit-scrollbar-thumb": {
            background: alpha("white", 0.3),
            borderRadius: "3px",
          },
        }}
      >
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <Paper
              sx={{
                maxWidth: "85%",
                px: 1.5,
                py: 1,
                borderRadius: 2,
                backgroundColor:
                  msg.role === "user"
                    ? alpha("#fff", 0.15)
                    : msg.isError
                      ? alpha("#ef4444", 0.2)
                      : alpha("#4ade80", 0.1),
                borderLeft:
                  msg.role === "assistant"
                    ? `3px solid ${msg.isError ? "#ef4444" : "#4ade80"}`
                    : "none",
                color: "white",
                wordBreak: "break-word",
              }}
              elevation={0}
            >
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                {msg.content}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 0.5,
                  opacity: 0.6,
                  textAlign: msg.role === "user" ? "right" : "left",
                }}
              >
                {msg.timestamp.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            </Paper>
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
            <Paper
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: 2,
                backgroundColor: alpha("#4ade80", 0.1),
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
              elevation={0}
            >
              <CircularProgress size={16} sx={{ color: "#4ade80" }} />
              <Typography variant="caption" sx={{ color: "#4ade80" }}>
                AI đang suy nghĩ...
              </Typography>
            </Paper>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Quick Suggestions */}
      {messages.length === 1 && !loading && (
        <Box sx={{ p: 2, borderTop: "1px solid " + alpha("white", 0.2), backgroundColor: alpha("#000", 0.2) }}>
          <Typography variant="caption" fontWeight={700} sx={{ display: "block", mb: 1, opacity: 0.8 }}>
            ✨ Câu hỏi gợi ý:
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            {quickSuggestions.map((suggestion, idx) => (
              <Chip
                key={idx}
                icon={<TipIcon sx={{ fontSize: 14 }} />}
                label={suggestion}
                onClick={() => handleSendMessage(suggestion)}
                size="small"
                sx={{
                  backgroundColor: alpha("white", 0.15),
                  color: "white",
                  cursor: "pointer",
                  border: "1px solid " + alpha("white", 0.3),
                  "&:hover": {
                    backgroundColor: alpha("white", 0.25),
                  },
                  "& .MuiChip-icon": {
                    color: alpha("white", 0.8),
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Input Area */}
      <Box sx={{ p: 2, borderTop: "1px solid " + alpha("white", 0.2), backgroundColor: alpha("#000", 0.1) }}>
        <Stack direction="row" spacing={1}>
          <TextField
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Gõ câu hỏi..."
            disabled={loading}
            multiline
            maxRows={3}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                color: "white",
                backgroundColor: alpha("white", 0.1),
                borderRadius: 2,
                "& fieldset": {
                  borderColor: alpha("white", 0.3),
                },
                "&:hover fieldset": {
                  borderColor: alpha("white", 0.5),
                },
                "&.Mui-focused fieldset": {
                  borderColor: "white",
                },
              },
              "& .MuiOutlinedInput-input::placeholder": {
                opacity: 0.6,
                color: "white",
              },
            }}
          />
          <IconButton
            onClick={() => handleSendMessage("")}
            disabled={loading || !inputValue.trim()}
            sx={{
              backgroundColor: alpha("#fff", 0.15),
              color: "white",
              borderRadius: 2,
              "&:hover": {
                backgroundColor: alpha("#fff", 0.25),
              },
              "&:disabled": {
                backgroundColor: alpha("#fff", 0.05),
                color: alpha("white", 0.5),
              },
            }}
          >
            <SendIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>
      </Box>
    </Card>
  );
}

export default AIMenuChatBox;
