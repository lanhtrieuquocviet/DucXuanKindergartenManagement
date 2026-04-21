const mongoose = require("mongoose");

const nutritionPlanItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    min: { type: Number, required: true, default: 0 },
    max: { type: Number, required: true, default: 0 },
    actual: { type: Number, default: 0 },
  },
  { _id: false }
);

const regulationFileSchema = new mongoose.Schema(
  {
    originalName: { type: String, default: "" },
    storedName: { type: String, default: "" },
  },
  { _id: false }
);

const districtNutritionPlanSchema = new mongoose.Schema(
  {
    items: { type: [nutritionPlanItemSchema], default: [] },
    /** YYYY-MM-DD theo ngày làm việc VN */
    startDate: { type: String, required: true, trim: true },
    /** HH:mm theo múi giờ VN; mốc tự động mặc định 00:30 */
    startTime: { type: String, default: "00:30", trim: true },
    /** Thời điểm áp dụng thực tế */
    startAt: { type: Date, default: null },
    /** Ghi nhận khi kết thúc kế hoạch hoặc dữ liệu cũ; kế hoạch đang áp dụng có thể null */
    endDate: { type: String, default: null, trim: true },
    regulationFile: { type: regulationFileSchema, default: null },
    status: {
      type: String,
      enum: ["scheduled", "active", "archived"],
      default: "active",
    },
    archivedAt: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYears",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "DistrictNutritionPlans",
  }
);

module.exports = mongoose.model("DistrictNutritionPlan", districtNutritionPlanSchema);
