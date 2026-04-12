import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { sumIngredientLines } from "../utils/mealNutrition";

const hCell = {
  fontWeight: 700,
  fontSize: "0.75rem",
  backgroundColor: "#f0f4f8",
  whiteSpace: "nowrap",
};

export default function MealFoodFineTuneDialog({
  open,
  onClose,
  foodName = "",
  ingredientLines = [],
  onSave,
  saving = false,
}) {
  const [localLines, setLocalLines] = useState([]);

  useEffect(() => {
    if (!open) return;
    const raw = Array.isArray(ingredientLines) ? ingredientLines : [];
    setLocalLines(
      raw.map((l) => ({
        name: l.name ?? "",
        grams: l.grams ?? 100,
        caloriesPer100g: l.caloriesPer100g ?? 0,
        proteinPer100g: l.proteinPer100g ?? 0,
        fatPer100g: l.fatPer100g ?? 0,
        carbPer100g: l.carbPer100g ?? 0,
      }))
    );
  }, [open, ingredientLines]);

  const totals = useMemo(() => sumIngredientLines(localLines), [localLines]);

  const updateLine = (idx, patch) => {
    setLocalLines((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  const handleGrams = (idx, val) => {
    const n = Number(String(val).replace(",", "."));
    updateLine(idx, { grams: Number.isFinite(n) && n >= 0 ? n : 0 });
  };

  const handleSubmit = () => {
    onSave?.(localLines);
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>
        Chỉnh định lượng nguyên liệu — {foodName || "Món ăn"}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Khối lượng (g) thay đổi sẽ quy đổi lại Kcal / Đạm / Béo / Tinh bột theo chỉ số trên 100g đã lưu từ kho nguyên liệu.
        </Typography>

        {localLines.length === 0 ? (
          <Typography color="text.secondary" fontWeight={600}>
            Món này chưa có dòng nguyên liệu trong công thức món ăn. Hãy bổ sung nguyên liệu tại Quản lý món ăn.
          </Typography>
        ) : (
          <>
            <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={hCell}>Nguyên liệu</TableCell>
                    <TableCell sx={hCell} align="center">
                      Gram (g)
                    </TableCell>
                    <TableCell sx={hCell} align="center">
                      Kcal/100g
                    </TableCell>
                    <TableCell sx={hCell} align="center">
                      Đạm/100g
                    </TableCell>
                    <TableCell sx={hCell} align="center">
                      Béo/100g
                    </TableCell>
                    <TableCell sx={hCell} align="center">
                      TB/100g
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {localLines.map((line, idx) => (
                    <TableRow key={`${line.name}-${idx}`} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {line.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ width: 110 }}>
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0, step: 1 }}
                          value={line.grams}
                          onChange={(e) => handleGrams(idx, e.target.value)}
                          sx={{ width: 96 }}
                        />
                      </TableCell>
                      <TableCell align="center">{line.caloriesPer100g}</TableCell>
                      <TableCell align="center">{line.proteinPer100g}</TableCell>
                      <TableCell align="center">{line.fatPer100g}</TableCell>
                      <TableCell align="center">{line.carbPer100g}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight={700}>
                Ước tính món: {totals.calories.toFixed(1)} kcal
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Đạm {totals.protein.toFixed(1)}g • Béo {totals.fat.toFixed(1)}g • Tinh bột {totals.carb.toFixed(1)}g
              </Typography>
            </Stack>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: "none" }}>
          Đóng
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || localLines.length === 0} sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}>
          {saving ? "Đang lưu..." : "Lưu thực đơn ngày"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
