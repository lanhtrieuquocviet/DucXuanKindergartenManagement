import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ArticleIcon from "@mui/icons-material/Article";
import DownloadIcon from "@mui/icons-material/Download";
import { get, ENDPOINTS } from "../../service/api";
import "quill/dist/quill.snow.css";

const CATEGORY_COLOR = {
  "Thông tin chung về cơ sở giáo dục": "#7c3aed",
  "Công khai thu chi tài chính": "#2563eb",
  "Điều kiện đảm bảo chất lượng hoạt động giáo dục": "#ea580c",
  "Kế hoạch và kết quả hoạt động giáo dục": "#16a34a",
  "Báo cáo thường niên": "#1e3a8a",
};

function PublicInfoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await get(ENDPOINTS.PUBLIC_INFO.DETAIL(id));
        setItem(resp.data);
      } catch (err) {
        setError(err.message || "Không tìm thấy thông tin");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "-";

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress color="success" />
      </Container>
    );
  }

  if (error || !item) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "Không tìm thấy thông tin"}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          variant="outlined"
          color="success"
          size="small"
        >
          Quay lại
        </Button>
      </Container>
    );
  }

  const catColor = CATEGORY_COLOR[item.category] || "#4b5563";

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3, fontSize: "0.8rem" }}>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          Trang chủ
        </Link>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: "pointer" }}
          onClick={() => navigate("/public-information")}
        >
          Thông tin công khai
        </Link>
        <Typography
          color="text.primary"
          fontSize="0.8rem"
          fontWeight={600}
          sx={{
            maxWidth: 300,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.title}
        </Typography>
      </Breadcrumbs>

      {/* Category chip */}
      <Chip
        label={item.category}
        size="small"
        sx={{
          bgcolor: catColor,
          color: "#fff",
          fontWeight: 600,
          mb: 2,
          fontSize: "0.75rem",
        }}
      />

      {/* Tiêu đề */}
      <Typography
        variant="h5"
        fontWeight={700}
        color="text.primary"
        sx={{ mb: 2, lineHeight: 1.4 }}
      >
        {item.title}
      </Typography>

      {/* Meta */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          color: "text.secondary",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <AccessTimeIcon sx={{ fontSize: 16 }} />
          <Typography variant="body2">{formatDate(item.createdAt)}</Typography>
        </Box>
        {item.author?.fullName && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <PersonIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2">{item.author.fullName}</Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Nội dung rich text */}
      {item.description && (
        <Box
          className="ql-editor"
          dangerouslySetInnerHTML={{ __html: item.description }}
          sx={{
            fontSize: { xs: "0.875rem", sm: "1rem" },
            lineHeight: 1.8,
            color: "text.primary",
            mb: 4,
            "& img": { maxWidth: "100%", height: "auto" },
            "& a": { color: "success.main" },
          }}
        />
      )}

      {/* Tệp đính kèm */}
      {item.attachmentUrl && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            {item.attachmentType === "pdf" ? (
              <PictureAsPdfIcon sx={{ color: "#dc2626" }} />
            ) : (
              <ArticleIcon sx={{ color: "#2563eb" }} />
            )}
            Tệp {item.attachmentType === "pdf" ? "PDF" : "Word"} đính kèm
          </Typography>

          {item.attachmentType === "pdf" ? (
            <Box
              component="iframe"
              src={item.attachmentUrl}
              title="PDF Viewer"
              sx={{
                width: "100%",
                height: { xs: 320, sm: 480, md: 600 },
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                display: "block",
              }}
            />
          ) : (
            <Box
              component="iframe"
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(item.attachmentUrl)}`}
              title="Word Viewer"
              sx={{
                width: "100%",
                height: { xs: 320, sm: 480, md: 600 },
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                display: "block",
              }}
            />
          )}

          <Button
            component="a"
            href={item.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<DownloadIcon />}
            variant="outlined"
            size="small"
            sx={{
              mt: 1.5,
              borderColor: "#2563eb",
              color: "#2563eb",
              "&:hover": { borderColor: "#1e40af", color: "#1e40af" },
            }}
          >
            Tải xuống {item.attachmentType === "pdf" ? "PDF" : "Word"}
          </Button>
        </Box>
      )}

      {/* Nút quay lại */}
      <Divider sx={{ mb: 3 }} />
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        variant="outlined"
        color="success"
        size="small"
      >
        Quay lại
      </Button>
    </Container>
  );
}

export default PublicInfoDetail;
