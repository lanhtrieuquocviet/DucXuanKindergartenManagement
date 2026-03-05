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
  Pagination,
  Divider,
} from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { get, ENDPOINTS } from "../../service/api";

const SLUG_TO_CATEGORY = {
  "financial-disclosure": "Công khai thu chi tài chính",
  "education-quality": "Điều kiện đảm bảo chất lượng hoạt động giáo dục",
  "education-plan-result": "Kế hoạch và kết quả hoạt động giáo dục",
  "annual-report": "Báo cáo thường niên",
};

const CATEGORY_COLOR = {
  "Thông tin chung về cơ sở giáo dục": "#7c3aed",
  "Công khai thu chi tài chính": "#2563eb",
  "Điều kiện đảm bảo chất lượng hoạt động giáo dục": "#ea580c",
  "Kế hoạch và kết quả hoạt động giáo dục": "#16a34a",
  "Báo cáo thường niên": "#1e3a8a",
};

const stripHtml = (html) => (html || "").replace(/<[^>]*>/g, "");

const ITEMS_PER_PAGE = 8;

export default function PublicInformationDetail() {
  const { slug, year } = useParams();
  const navigate = useNavigate();

  const category = SLUG_TO_CATEGORY[slug];
  const categoryColor = CATEGORY_COLOR[category] || "#4b5563";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadItems = async (pg) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("page", pg);
      params.append("limit", ITEMS_PER_PAGE);
      if (category) params.append("category", category);
      if (year) params.append("year", year);
      const resp = await get(`${ENDPOINTS.PUBLIC_INFO.LIST}?${params.toString()}`);
      if (resp.status === "success") {
        setItems(resp.data.items);
        setTotalPages(resp.data.pagination.totalPages || 1);
        setTotal(resp.data.pagination.total || 0);
      }
    } catch (err) {
      setError(err.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadItems(1);
  }, [slug, year]); // eslint-disable-line

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
    loadItems(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "";

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
        <Typography color="text.primary" fontSize="0.8rem" fontWeight={600}>
          {category || "Thông tin công khai"}
        </Typography>
      </Breadcrumbs>

      {/* Tiêu đề trang */}
      <Box sx={{ mb: 3 }}>
        <Chip
          label={category || "Thông tin công khai"}
          size="small"
          sx={{
            bgcolor: categoryColor,
            color: "#fff",
            fontWeight: 600,
            mb: 1.5,
            fontSize: "0.75rem",
          }}
        />
        <Typography variant="h5" fontWeight={700} color="text.primary">
          {category || "Thông tin công khai"}
          {year && (
            <Typography component="span" variant="h5" fontWeight={400} color="text.secondary">
              {" "}— Năm {year}
            </Typography>
          )}
        </Typography>
        {!loading && (
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {total} kết quả
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Trạng thái */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress color="success" />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* Danh sách bài */}
      {!loading && !error && items.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <Typography>Chưa có thông tin nào trong mục này.</Typography>
        </Box>
      )}

      {!loading && items.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {items.map((item, idx) => (
            <Box
              key={item._id}
              onClick={() => navigate(`/public-info/${item._id}`)}
              sx={{
                display: "flex",
                gap: 2,
                p: 2.5,
                cursor: "pointer",
                borderBottom: "1px solid",
                borderColor: "divider",
                bgcolor: idx % 2 === 0 ? "#fff" : "#f9fafb",
                "&:hover": { bgcolor: "#f0fdf4" },
                transition: "background 0.15s",
                alignItems: "flex-start",
              }}
            >
              {/* Icon / attachment indicator */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  bgcolor: categoryColor + "18",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  mt: 0.5,
                }}
              >
                {item.attachmentType === "pdf" ? (
                  <PictureAsPdfIcon sx={{ color: "#dc2626", fontSize: 22 }} />
                ) : (
                  <ArticleIcon sx={{ color: categoryColor, fontSize: 22 }} />
                )}
              </Box>

              {/* Nội dung */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  color="text.primary"
                  sx={{
                    "&:hover": { color: "success.main" },
                    lineHeight: 1.4,
                    mb: 0.5,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {item.title}
                </Typography>
                {item.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      mb: 1,
                      fontSize: "0.8rem",
                    }}
                  >
                    {stripHtml(item.description)}
                  </Typography>
                )}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.disabled", fontSize: "0.75rem" }}>
                    <AccessTimeIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption">{formatDate(item.createdAt)}</Typography>
                  </Box>
                  {item.attachmentUrl && (
                    <Chip
                      label={item.attachmentType === "pdf" ? "PDF" : "Word"}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.7rem",
                        bgcolor: item.attachmentType === "pdf" ? "#fee2e2" : "#dbeafe",
                        color: item.attachmentType === "pdf" ? "#dc2626" : "#2563eb",
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="success"
            shape="rounded"
          />
        </Box>
      )}
    </Container>
  );
}
