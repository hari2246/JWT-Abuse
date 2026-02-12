import mongoose from "mongoose";

const requestLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    tokenHash: { type: String }, // store hashed token (not full token)

    ipAddress: { type: String },
    userAgent: { type: String },

    endpoint: { type: String }, // /api/user/profile etc.
    method: { type: String }, // GET/POST

    statusCode: { type: Number },
    responseTimeMs: { type: Number }
  },
  { timestamps: true },
  

);

export default mongoose.model("RequestLog", requestLogSchema);
