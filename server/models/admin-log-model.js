const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true, collection: "adminlogs" }
);

module.exports = mongoose.models.AdminLog || mongoose.model("AdminLog", adminLogSchema);
