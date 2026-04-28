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
  "văn bản pháp quy": "#0369a1",
  "văn bản từ phòng": "#b45309",
};

const CATEGORY_BACK_ROUTE = {
  "văn bản pháp quy": "/legal-documents",
  "văn bản từ phòng": "/department-documents",
};

const CATEGORY_LABEL = {
  "văn bản pháp quy": "Văn bản pháp quy",
  "văn bản từ phòng": "Văn bản từ Phòng",
};

function DocumentDetail() {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await get(ENDPOINTS.DOCUMENTS.DETAIL(documentId));
        setDoc(resp.data);
      } catch (err) {
        setError(err.message || "Không tìm thấy tài liệu");
      } finally {
        setLoading(false);
      }
    };
    if (documentId) load();
  }, [documentId]);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "-";

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress color="success" />
      </Container>
    );
  }

  if (error || !doc) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "Không tìm thấy tài liệu"}
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

  const catColor = CATEGORY_COLOR[doc.category] || "#4b5563";
  const backRoute = CATEGORY_BACK_ROUTE[doc.category] || -1;
  const catLabel = CATEGORY_LABEL[doc.category] || doc.category || "Văn bản";

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
          onClick={() => typeof backRoute === "string" ? navigate(backRoute) : navigate(-1)}
        >
          {catLabel}
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
          {doc.title}
        </Typography>
      </Breadcrumbs>

      {/* Category chip */}
      {doc.category && (
        <Chip
          label={catLabel}
          size="small"
          sx={{
            bgcolor: catColor,
            color: "#fff",
            fontWeight: 600,
            mb: 2,
            fontSize: "0.75rem",
          }}
        />
      )}

      {/* Tiêu đề */}
      <Typography
        variant="h5"
        fontWeight={700}
        color="text.primary"
        sx={{ mb: 2, lineHeight: 1.4 }}
      >
        {doc.title}
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
          <Typography variant="body2">{formatDate(doc.createdAt)}</Typography>
        </Box>
        {doc.author?.fullName && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <PersonIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2">{doc.author.fullName}</Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Nội dung rich text */}
      {doc.description && (
        <Box
          className="ql-editor"
          dangerouslySetInnerHTML={{ __html: doc.description }}
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
      {doc.attachmentUrl && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            {doc.attachmentType === "pdf" ? (
              <PictureAsPdfIcon sx={{ color: "#dc2626" }} />
            ) : (
              <ArticleIcon sx={{ color: "#2563eb" }} />
            )}
            Tệp {doc.attachmentType === "pdf" ? "PDF" : "Word"} đính kèm
          </Typography>

          {doc.attachmentType === "pdf" ? (
            <Box
              component="iframe"
              src={doc.attachmentUrl}
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
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(doc.attachmentUrl)}`}
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
            href={doc.attachmentUrl}
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
            Tải xuống {doc.attachmentType === "pdf" ? "PDF" : "Word"}
          </Button>
        </Box>
      )}

      {/* Nút quay lại */}
      <Divider sx={{ mb: 3 }} />
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => typeof backRoute === "string" ? navigate(backRoute) : navigate(-1)}
        variant="outlined"
        color="success"
        size="small"
      >
        Quay lại
      </Button>
    </Container>
  );
}

export default DocumentDetail;
