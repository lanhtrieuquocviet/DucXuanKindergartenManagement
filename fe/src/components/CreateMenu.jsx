import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMenu } from "../service/menu.api";
import { toast } from "react-toastify";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  InputLabel,
  FormControl,
  FormHelperText,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  CalendarMonth as CalendarIcon,
  Add as AddIcon,
} from "@mui/icons-material";

const MONTH_OPTIONS = [
  { value: 1, label: "Tháng 1 - Tháng Giêng" },
  { value: 2, label: "Tháng 2 - Tháng Hai" },
  { value: 3, label: "Tháng 3 - Tháng Ba" },
  { value: 4, label: "Tháng 4 - Tháng Tư" },
  { value: 5, label: "Tháng 5 - Tháng Năm" },
  { value: 6, label: "Tháng 6 - Tháng Sáu" },
  { value: 7, label: "Tháng 7 - Tháng Bảy" },
  { value: 8, label: "Tháng 8 - Tháng Tám" },
  { value: 9, label: "Tháng 9 - Tháng Chín" },
  { value: 10, label: "Tháng 10 - Tháng Mười" },
  { value: 11, label: "Tháng 11 - Tháng Mười Một" },
  { value: 12, label: "Tháng 12 - Tháng Chạp" },
];

/** So sánh (năm, tháng) với tháng hiện tại: true nếu (y,m) là quá khứ */
function isMonthYearInPast(y, m) {
  const now = new Date();
  const selected = y * 12 + m;
  const current = now.getFullYear() * 12 + (now.getMonth() + 1);
  return selected < current;
}

function CreateMenu() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [month, setMonth] = useState("");
  const [year, setYear] = useState(String(currentYear));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!month) newErrors.month = "Vui lòng chọn tháng";
    const y = year === "" ? NaN : Number(year);
    if (!year || String(year).trim() === "") newErrors.year = "Vui lòng nhập năm";
    else if (Number.isNaN(y)) newErrors.year = "Năm không hợp lệ";
    else if (y < currentYear)
      newErrors.year = `Năm phải lớn hơn hoặc bằng ${currentYear}`;
    else if (y > currentYear + 5)
      newErrors.year = `Năm không được vượt quá ${currentYear + 5}`;

    const m = month === "" ? NaN : Number(month);
    if (!newErrors.month && !newErrors.year && !Number.isNaN(y) && !Number.isNaN(m)) {
      if (isMonthYearInPast(y, m)) {
        newErrors.period =
          "Chỉ được tạo thực đơn cho tháng hiện tại hoặc trong tương lai, không được chọn tháng đã qua.";
      }
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.period) toast.error(newErrors.period);
      return;
    }
    try {
      setLoading(true);
      await createMenu({ month: Number(month), year: Number(year) });
      toast.success("Tạo thực đơn thành công");
      navigate("/kitchen/menus");
    } catch (error) {
      toast.error(
        error?.message || error?.response?.data?.message || "Tạo thực đơn thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={520} mx="auto">
      {/* Back */}
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate("/kitchen/menus")}
        size="small"
        sx={{
          mb: 2.5,
          textTransform: "none",
          color: "text.secondary",
          fontWeight: 600,
          borderRadius: 2,
          "&:hover": { bgcolor: "grey.100" },
        }}
      >
        Quay lại
      </Button>

      <Card
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Title */}
          <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
            <Avatar
              sx={{
                width: 44,
                height: 44,
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              }}
            >
              <CalendarIcon sx={{ fontSize: 22 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
                Tạo thực đơn tháng
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Lập kế hoạch thực đơn cho trường
              </Typography>
            </Box>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {/* Month */}
              <FormControl fullWidth size="small" error={Boolean(errors.month)}>
                <InputLabel>Tháng</InputLabel>
                <Select
                  value={month}
                  label="Tháng"
                  onChange={(e) => {
                    setMonth(e.target.value);
                    setErrors((p) => ({ ...p, month: "", period: "" }));
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  {MONTH_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.month && (
                  <FormHelperText>{errors.month}</FormHelperText>
                )}
              </FormControl>

              {/* Year */}
              <TextField
                fullWidth
                size="small"
                label="Năm"
                type="number"
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  setErrors((p) => ({ ...p, year: "", period: "" }));
                }}
                inputProps={{ min: currentYear, max: currentYear + 5 }}
                error={Boolean(errors.year || errors.period)}
                helperText={
                  errors.year ||
                  errors.period ||
                  `Năm học từ ${currentYear} đến ${currentYear + 5}`
                }
                InputProps={{ sx: { borderRadius: 2 } }}
              />

              {/* Preview */}
              {month &&
                year &&
                !errors.month &&
                !errors.year &&
                (() => {
                  const y = Number(year);
                  const mo = Number(month);
                  if (Number.isNaN(y) || Number.isNaN(mo)) return null;
                  const past = isMonthYearInPast(y, mo);
                  if (past) {
                    return (
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "#fef2f2",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "error.light",
                        }}
                      >
                        <Typography variant="body2" color="error.main" fontWeight={700}>
                          Tháng {month}/{year} đã qua — không thể tạo thực đơn cho kỳ này.
                        </Typography>
                      </Box>
                    );
                  }
                  return (
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "rgba(99,102,241,0.06)",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "rgba(99,102,241,0.2)",
                      }}
                    >
                      <Typography variant="body2" color="primary.main" fontWeight={700}>
                        Xem trước: Thực đơn Tháng {month}/{year}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Thực đơn sẽ được tạo ở trạng thái Nháp
                      </Typography>
                    </Box>
                  );
                })()}

              {/* Actions */}
              <Stack direction="row" justifyContent="flex-end" spacing={1.5} pt={0.5}>
                <Button
                  type="button"
                  onClick={() => navigate("/kitchen/menus")}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    color: "text.secondary",
                  }}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={<AddIcon />}
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
                  {loading ? "Đang tạo..." : "Tạo thực đơn"}
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CreateMenu;
