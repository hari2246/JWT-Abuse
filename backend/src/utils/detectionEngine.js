import Alert from "../models/Alert.js";
import RequestLog from "../models/RequestLog.js";
import RevokedToken from "../models/RevokedToken.js";

// helper to create alert (avoid duplicates)
const createAlert = async ({ userId, tokenHash, type, severity, reason }) => {
  const exists = await Alert.findOne({
    tokenHash,
    type,
    isResolved: false,
    createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) }, // last 2 mins
  });

  if (!exists) {
    await Alert.create({
      userId,
      tokenHash,
      type,
      severity,
      reason,
    });
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

// ✅ RULE 2: RATE ABUSE (too many requests in short time)
export const detectRateAbuse = async ({ userId, tokenHash }) => {
  const windowSeconds = 10;
  const maxRequests = 30;

  const count = await RequestLog.countDocuments({
    userId,
    createdAt: { $gte: new Date(Date.now() - windowSeconds * 1000) },
  });

  if (count > maxRequests) {
    await createAlert({
      userId,
      tokenHash,
      type: "RATE_ABUSE",
      severity: "MEDIUM",
      reason: `User exceeded ${maxRequests} requests in ${windowSeconds} seconds (possible automation).`,
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
