const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

  status: {
  type: String,
  enum: [
    "draft",
    "pending",
    "approved",
    "active",
    "completed",
    "rejected"
  ],
  default: "draft"
  },

    rejectReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "Menus",
  }
);

module.exports = mongoose.model("Menus", menuSchema);
