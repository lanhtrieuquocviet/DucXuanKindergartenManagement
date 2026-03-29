import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Badge,
  Tooltip,
  alpha,
  Stack,
} from "@mui/material";
import {
  AutoAwesome as AIIcon,
  Close as CloseIcon,
  Lightbulb as LightbulbIcon,
  ExpandMore as ExpandIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";
import AIMenuDialog from "./AIMenuDialog";
import AIMenuChatBox from "./AIMenuChatBox";

/**
 * AIMenuWidget - Floating widget in top-right corner
 * Shows "AI Thông Minh hỗ trợ lên thực đơn" with quick access to features
 */
function AIMenuWidget({ menu, isEditable }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (!menu) return null;

  if (collapsed) {
    return (
      <Tooltip title="Mở trợ lý AI">
        <IconButton
          onClick={() => setCollapsed(false)}
          sx={{
            position: "fixed",
            bottom: 32,
            right: 32,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
            "&:hover": {
              boxShadow: "0 6px 16px rgba(102, 126, 234, 0.6)",
              transform: "scale(1.05)",
            },
            zIndex: 999,
            transition: "all 0.2s",
          }}
        >
          <LightbulbIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <>
      <Card
        elevation={3}
        sx={{
          position: "fixed",
          bottom: 32,
          right: 32,
          width: 300,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(102, 126, 234, 0.25)",
          zIndex: 999,
          transition: "all 0.3s ease",
        }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <AIIcon sx={{ fontSize: 22 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 13 }}>
                  AI Thông Minh
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85, fontSize: 10 }}>
                  Gợi ý thực đơn
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Ẩn">
              <IconButton
                size="small"
                onClick={() => setCollapsed(true)}
                sx={{ color: "white", opacity: 0.7, "&:hover": { opacity: 1 }, p: 0.4 }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Action Buttons */}
          <Stack spacing={1}>
            {isEditable && (
              <Box
                onClick={() => setDialogOpen(true)}
                sx={{
                  bgcolor: alpha("#fff", 0.12),
                  border: "1px solid " + alpha("#fff", 0.25),
                  borderRadius: 1.5,
                  p: 1.2,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: alpha("#fff", 0.18),
                  },
                }}
              >
                <Typography variant="caption" fontWeight={700} sx={{ fontSize: 11, display: "block" }}>
                  📋 Chỉnh Sửa Thực Đơn
                </Typography>
              </Box>
            )}

            <Box
              onClick={() => setDialogOpen(true)}
              sx={{
                bgcolor: alpha("#fff", 0.12),
                border: "1px solid " + alpha("#fff", 0.25),
                borderRadius: 1.5,
                p: 1.2,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: alpha("#fff", 0.18),
                },
              }}
            >
              <Typography variant="caption" fontWeight={700} sx={{ fontSize: 11, display: "block" }}>
                ✨ Gợi Ý Món Mới
              </Typography>
            </Box>

            <Box
              onClick={() => setChatOpen(true)}
              sx={{
                bgcolor: alpha("#fff", 0.12),
                border: "1px solid " + alpha("#fff", 0.25),
                borderRadius: 1.5,
                p: 1.2,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: alpha("#fff", 0.18),
                },
              }}
            >
              <Typography variant="caption" fontWeight={700} sx={{ fontSize: 11, display: "block" }}>
                💬 Chat với AI
              </Typography>
            </Box>
          </Stack>

          {/* Status */}
          <Box sx={{ mt: 1.5, pt: 1, borderTop: "1px solid " + alpha("#fff", 0.15), textAlign: "center" }}>
            <Typography variant="caption" sx={{ fontSize: 9, opacity: 0.7 }}>
              {isEditable ? "✏️ Chế độ chỉnh sửa" : "👁️ Chế độ xem"}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* AI Menu Dialog */}
      <AIMenuDialog open={dialogOpen} onClose={() => setDialogOpen(false)} menu={menu} isEditable={isEditable} />

      {/* AI Menu Chat Box */}
      {chatOpen && <AIMenuChatBox menu={menu} isEditable={isEditable} onClose={() => setChatOpen(false)} />}
    </>
  );
}

export default AIMenuWidget;
