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
    /** Ghi nhận khi kết thúc kế hoạch hoặc dữ liệu cũ; kế hoạch đang áp dụng có thể null */
    endDate: { type: String, default: null, trim: true },
    regulationFile: { type: regulationFileSchema, default: null },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
    archivedAt: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "DistrictNutritionPlans",
  }
);

module.exports = mongoose.model("DistrictNutritionPlan", districtNutritionPlanSchema);
