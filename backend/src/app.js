import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

import { securityMonitor } from "./middleware/securityMonitor.js"

app.use(securityMonitor)

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
import adminRoutes from "./routes/adminRoutes.js";

app.use("/api/admin", adminRoutes);


app.get("/", (req, res) => {
  res.json({ message: "JWT Abuse Detection Backend Running ✅" });
});

export default app;
