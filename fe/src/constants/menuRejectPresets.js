/** Mã lý do từ chối (đồng bộ với backend menuController.rejectMenu) */
export const MENU_REJECT_PRESETS = [
  { id: "nutrition", label: "Chưa cân đối dinh dưỡng / chưa đạt chuẩn" },
  { id: "regulation", label: "Chưa đạt tiêu chí theo quy định sở" },
  { id: "duplicate", label: "Trùng lặp món ăn giữa các ngày" },
  { id: "variety", label: "Thiếu đa dạng món" },
  { id: "portion", label: "Khẩu phần / định lượng chưa phù hợp" },
  { id: "other", label: "Khác (mô tả ở phần chi tiết)" },
];

export function labelForRejectPreset(id) {
  return MENU_REJECT_PRESETS.find((p) => p.id === id)?.label || id;
}
