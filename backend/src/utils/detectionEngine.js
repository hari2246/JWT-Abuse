import Alert from "../models/Alert.js";
import RequestLog from "../models/RequestLog.js";
import RevokedToken from "../models/RevokedToken.js";
import { getUserBaseline } from "./userBehavior.js";
import { updateRiskScore } from "./riskEngine.js";

// helper to create alert (avoid duplicates)
const createAlert = async ({ userId, tokenHash, type, severity, reason }) => {
  const exists = await Alert.findOne({
    tokenHash,
    type,
    isResolved: false,
    createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) }, // last 2 mins
  });

  if (!exists) {
    const alert = await Alert.create({
      userId,
      tokenHash,
      type,
      severity,
      reason,
    });

    // 🔹 update user risk score
    await updateRiskScore(userId, type);
  }
};

// ✅ RULE 1: TOKEN REPLAY (same token used from different IP in short time)
export const detectTokenReplay = async ({ userId, tokenHash, ipAddress }) => {
  const recentLogs = await RequestLog.find({
    tokenHash,
    createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) }, // last 2 mins
  }).select("ipAddress");

  const uniqueIPs = new Set(recentLogs.map((l) => l.ipAddress));

  if (uniqueIPs.size >= 2 && uniqueIPs.has(ipAddress)) {
    await createAlert({
      userId,
      tokenHash,
      type: "TOKEN_REPLAY",
      severity: "HIGH",
      reason: "Same token used from multiple IPs within a short time (possible replay/hijack).",
    });

    // optional auto revoke for HIGH
    await RevokedToken.updateOne(
      { tokenHash },
      { $setOnInsert: { tokenHash, reason: "Auto-revoked due to token replay detection" } },
      { upsert: true }
    );

    await Alert.updateMany(
      { tokenHash, type: "TOKEN_REPLAY", actionTaken: "NONE" },
      { $set: { actionTaken: "REVOKED" } }
    );
  }
};

// ✅ RULE 2: USER-BASED RATE ABUSE (adaptive threshold)
export const detectRateAbuse = async ({ userId, tokenHash }) => {

  const windowSeconds = 10;

  // 🔹 Get user behaviour baseline
  const baseline = await getUserBaseline(userId);

  const count = await RequestLog.countDocuments({
    userId,
    createdAt: { $gte: new Date(Date.now() - windowSeconds * 1000) },
  });

  // 🔹 Adaptive threshold
  // minimum 20 requests, otherwise based on user behaviour
  const adaptiveThreshold = Math.max(20, baseline.avgRate * 5);

  if (count > adaptiveThreshold) {
    await createAlert({
      userId,
      tokenHash,
      type: "RATE_ABUSE",
      severity: "MEDIUM",
      reason: `User exceeded adaptive threshold (${Math.round(
        adaptiveThreshold
      )}) within ${windowSeconds}s (behaviour anomaly).`,
    });
  }
};

// ✅ RULE 3: PRIVILEGE ABUSE (non-admin hitting /admin routes)
export const detectPrivilegeAbuse = async ({ userId, tokenHash, endpoint, role }) => {
  if (endpoint.startsWith("/api/admin") && role !== "admin") {
    await createAlert({
      userId,
      tokenHash,
      type: "PRIVILEGE_ABUSE",
      severity: "HIGH",
      reason: "Non-admin user attempted to access admin routes.",
    });
  }
};
