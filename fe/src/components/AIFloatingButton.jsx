import { useState } from "react";
import {
  Box,
  Fab,
  Tooltip,
  Zoom,
  Badge,
} from "@mui/material";
import {
  AutoAwesome as AIIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import AIMenuDialog from "./AIMenuDialog";

/**
 * AIFloatingButton - Simple floating AI button on bottom-right
 * Easy to see, easy to click
 */
function AIFloatingButton({ menu, isEditable }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!menu) return null;

  return (
    <>
      {/* Main AI Button */}
      <Zoom in={true} timeout={300}>
        <Fab
          onClick={() => setDialogOpen(true)}
          sx={{
            position: "fixed",
            bottom: { xs: 24, sm: 32 },
            right: { xs: 24, sm: 32 },
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            width: { xs: 60, sm: 72 },
            height: { xs: 60, sm: 72 },
            boxShadow: "0 4px 20px rgba(102, 126, 234, 0.4)",
            zIndex: 999,
            "&:hover": {
              boxShadow: "0 8px 30px rgba(102, 126, 234, 0.6)",
              transform: "scale(1.1)",
              background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
            },
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            variant="dot"
            sx={{
              "& .MuiBadge-badge": {
                background: "#4ade80",
                boxShadow: "0 0 0 2px white",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "@keyframes pulse": {
                  "0%, 100%": {
                    opacity: 1,
                  },
                  "50%": {
                    opacity: 0.7,
                  },
                },
              },
            }}
          >
            <AIIcon sx={{ fontSize: 32 }} />
          </Badge>
        </Fab>
      </Zoom>

      {/* Info Tooltip */}
      <Tooltip
        title="🤖 AI Thông Minh - Hỗ trợ lên thực đơn"
        placement="left"
        arrow
        sx={{
          position: "fixed",
          bottom: { xs: 100, sm: 120 },
          right: { xs: 24, sm: 32 },
          zIndex: 998,
        }}
      >
        <Box />
      </Tooltip>

      {/* AI Menu Dialog */}
      <AIMenuDialog open={dialogOpen} onClose={() => setDialogOpen(false)} menu={menu} isEditable={isEditable} />
    </>
  );
}

export default AIFloatingButton;
