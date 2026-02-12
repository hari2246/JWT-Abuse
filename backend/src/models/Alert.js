import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    tokenHash: { type: String, required: true },

    type: {
      type: String,
      enum: ["TOKEN_REPLAY", "RATE_ABUSE", "PRIVILEGE_ABUSE", "DEVICE_CHANGE"],
      required: true,
    },

    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "LOW",
    },

    reason: { type: String, required: true },

    actionTaken: {
      type: String,
      enum: ["NONE", "REVOKED"],
      default: "NONE",
    },

    isResolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Alert", alertSchema);
