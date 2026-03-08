// import Alert from "../models/Alert.js";
// import RequestLog from "../models/RequestLog.js";
// import RevokedToken from "../models/RevokedToken.js";
// import { getUserBaseline } from "./userBehavior.js";
// import { updateRiskScore } from "./riskEngine.js";
// import { getKnownIPs } from "./userEnvironment.js";

// // helper to create alert (avoid duplicates)
// const createAlert = async ({ userId, tokenHash, type, severity, reason }) => {
//   const exists = await Alert.findOne({
//     tokenHash,
//     type,
//     isResolved: false,
//     createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) }, // last 2 mins
//   });

//   if (!exists) {
//     const alert = await Alert.create({
//       userId,
//       tokenHash,
//       type,
//       severity,
//       reason,
//     });

//     // 🔹 update user risk score
//     await updateRiskScore(userId, type);
//   }
// };

// // ✅ RULE 1: TOKEN REPLAY (same token used from different IP in short time)
// export const detectTokenReplay = async ({ userId, tokenHash, ipAddress }) => {
//   const recentLogs = await RequestLog.find({
//     tokenHash,
//     createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) }, // last 2 mins
//   }).select("ipAddress");

//   const knownIPs = await getKnownIPs(userId);

//   const isNewEnvironment = !knownIPs.has(ipAddress);

//   if (isNewEnvironment && recentLogs.length > 2) {
//     await createAlert({
//       userId,
//       tokenHash,
//       type: "TOKEN_REPLAY",
//       severity: "HIGH",
//       reason: "Same token used from multiple IPs within a short time (possible replay/hijack).",
//     });

//     // optional auto revoke for HIGH
//     await RevokedToken.updateOne(
//       { tokenHash },
//       { $setOnInsert: { tokenHash, reason: "Auto-revoked due to token replay detection" } },
//       { upsert: true }
//     );

//     await Alert.updateMany(
//       { tokenHash, type: "TOKEN_REPLAY", actionTaken: "NONE" },
//       { $set: { actionTaken: "REVOKED" } }
//     );
//   }
// };

// // ✅ RULE 2: USER-BASED RATE ABUSE (adaptive threshold)
// export const detectRateAbuse = async ({ userId, tokenHash }) => {

//   const windowSeconds = 10;

//   // 🔹 Get user behaviour baseline
//   const baseline = await getUserBaseline(userId);

//   const count = await RequestLog.countDocuments({
//     userId,
//     createdAt: { $gte: new Date(Date.now() - windowSeconds * 1000) },
//   });

//   // 🔹 Adaptive threshold
//   // minimum 20 requests, otherwise based on user behaviour
//   const adaptiveThreshold = Math.max(20, baseline.avgRate * 5);

//   if (count > adaptiveThreshold) {
//     await createAlert({
//       userId,
//       tokenHash,
//       type: "RATE_ABUSE",
//       severity: "MEDIUM",
//       reason: `User exceeded adaptive threshold (${Math.round(
//         adaptiveThreshold
//       )}) within ${windowSeconds}s (behaviour anomaly).`,
//     });
//   }
// };

// // ✅ RULE 3: PRIVILEGE ABUSE (non-admin hitting /admin routes)
// export const detectPrivilegeAbuse = async ({ userId, tokenHash, endpoint, role }) => {
//   if (endpoint.startsWith("/api/admin") && role !== "admin") {
//     await createAlert({
//       userId,
//       tokenHash,
//       type: "PRIVILEGE_ABUSE",
//       severity: "HIGH",
//       reason: "Non-admin user attempted to access admin routes.",
//     });
//   }
// };


// utils/detectionEngine.js

import Alert from "../models/Alert.js"
import RequestLog from "../models/RequestLog.js"
import RevokedToken from "../models/RevokedToken.js"
import { getUserBaseline } from "./userBehavior.js"
import { updateRiskScore } from "./riskEngine.js"
import { getKnownIPs } from "./userEnvironment.js"


// create alert helper
const createAlert = async ({ userId, tokenHash, type, severity, reason }) => {

  const exists = await Alert.findOne({
    tokenHash,
    type,
    isResolved:false,
    createdAt:{ $gte:new Date(Date.now()-120000) }
  })

  if(!exists){

    await Alert.create({
      userId,
      tokenHash,
      type,
      severity,
      reason
    })

    await updateRiskScore(userId,type)

  }
}



export const detectTokenReplay = async ({ userId, tokenHash, ipAddress }) => {

  const recentLogs = await RequestLog.find({
    tokenHash,
    createdAt:{ $gte:new Date(Date.now()-120000) }
  })

  const knownIPs = await getKnownIPs(userId)

  const isNewEnvironment = !knownIPs.has(ipAddress)

  if(isNewEnvironment && recentLogs.length > 2){

    await createAlert({
      userId,
      tokenHash,
      type:"TOKEN_REPLAY",
      severity:"HIGH",
      reason:"Token used from multiple IPs"
    })

    await RevokedToken.updateOne(
      { tokenHash },
      { $setOnInsert:{ tokenHash, reason:"Replay detected"} },
      { upsert:true }
    )

  }
}



export const detectRateAbuse = async ({ userId, tokenHash }) => {

  const baseline = await getUserBaseline(userId)

  const count = await RequestLog.countDocuments({
    userId,
    createdAt:{ $gte:new Date(Date.now()-10000) }
  })

  const threshold = Math.max(20, baseline.avgRate*5)

  if(count > threshold){

    await createAlert({
      userId,
      tokenHash,
      type:"RATE_ABUSE",
      severity:"MEDIUM",
      reason:"User exceeded request threshold"
    })

  }

}



export const detectPrivilegeAbuse = async ({ userId, tokenHash, endpoint, role }) => {

  if(endpoint.startsWith("/api/admin") && role !== "admin"){

    await createAlert({
      userId,
      tokenHash,
      type:"PRIVILEGE_ABUSE",
      severity:"HIGH",
      reason:"Non-admin accessing admin route"
    })

  }

}



export const detectDeviceChange = async ({ userId, tokenHash, userAgent }) => {

  const known = await RequestLog.findOne({ userId, userAgent })

  if(!known){

    await createAlert({
      userId,
      tokenHash,
      type:"DEVICE_CHANGE",
      severity:"MEDIUM",
      reason:"Unknown device detected"
    })

  }

}



export const detectConcurrentSession = async ({ userId, tokenHash }) => {

  const logs = await RequestLog.find({
    tokenHash,
    createdAt:{ $gte:new Date(Date.now()-5000) }
  })

  const ips = new Set(logs.map(l=>l.ipAddress))

  if(ips.size > 1){

    await createAlert({
      userId,
      tokenHash,
      type:"CONCURRENT_SESSION",
      severity:"HIGH",
      reason:"Token used simultaneously from different IPs"
    })

  }

}



export const detectEndpointScanning = async ({ userId, tokenHash }) => {

  const endpoints = await RequestLog.distinct("endpoint",{
    userId,
    createdAt:{ $gte:new Date(Date.now()-60000) }
  })

  if(endpoints.length > 15){

    await createAlert({
      userId,
      tokenHash,
      type:"API_SCAN",
      severity:"MEDIUM",
      reason:"User accessing many endpoints"
    })

  }

}



export const detectRevokedTokenUsage = async ({ userId, tokenHash }) => {

  const revoked = await RevokedToken.findOne({ tokenHash })

  if(revoked){

    await createAlert({
      userId,
      tokenHash,
      type:"REVOKED_TOKEN_USE",
      severity:"CRITICAL",
      reason:"Revoked token reused"
    })

  }

}



export const detectAIAnomaly = async ({ userId, tokenHash }) => {

  const baseline = await getUserBaseline(userId)

  const count = await RequestLog.countDocuments({
    userId,
    createdAt:{ $gte:new Date(Date.now()-60000) }
  })

  if(count > baseline.avgRate * 6){

    await createAlert({
      userId,
      tokenHash,
      type:"AI_ANOMALY",
      severity:"HIGH",
      reason:"Abnormal behaviour detected"
    })

  }

}

export const detectInvalidTokenFlood = async ({ ipAddress }) => {

  const invalidAttempts = await RequestLog.countDocuments({
    ipAddress,
    tokenValid: false,
    createdAt: { $gte: new Date(Date.now() - 60000) }
  });

  if (invalidAttempts > 20) {

    await createAlert({
      type: "INVALID_TOKEN_FLOOD",
      severity: "HIGH",
      reason: "Multiple invalid token attempts from same IP"
    });

  }

};

export const detectAbnormalLoginTime = async ({ userId, tokenHash }) => {

  const hour = new Date().getHours();

  if (hour < 5 || hour > 23) {

    await createAlert({
      userId,
      tokenHash,
      type: "ABNORMAL_LOGIN_TIME",
      severity: "LOW",
      reason: "Login occurred during unusual hours"
    });

  }

};

export const detectTokenLifetimeAbuse = async ({ userId, tokenHash }) => {

  const log = await RequestLog.findOne({ tokenHash });

  if (!log) return;

  const tokenAge = Date.now() - log.createdAt;

  if (tokenAge > 86400000) { // 24 hours

    await createAlert({
      userId,
      tokenHash,
      type: "TOKEN_LIFETIME_ABUSE",
      severity: "MEDIUM",
      reason: "Token used after unusually long lifetime"
    });

  }

};

export const detectImpossibleTravel = async ({ userId, tokenHash, ipAddress }) => {

  const lastLog = await RequestLog.findOne({ userId })
    .sort({ createdAt: -1 });

  if (!lastLog) return;

  const distance = geoDistance(lastLog.ipAddress, ipAddress); 
  const timeDiff = Date.now() - lastLog.createdAt;

  if (distance > 2000 && timeDiff < 600000) { // 2000km within 10 min

    await createAlert({
      userId,
      tokenHash,
      type: "IMPOSSIBLE_TRAVEL",
      severity: "HIGH",
      reason: "Login from geographically impossible location"
    });

  }

};



export const runSecurityChecks = async (context) => {

  await detectTokenReplay(context)
  await detectRateAbuse(context)
  await detectPrivilegeAbuse(context)
  await detectDeviceChange(context)
  await detectConcurrentSession(context)
  await detectEndpointScanning(context)
  await detectRevokedTokenUsage(context)
  await detectAIAnomaly(context)

  await detectImpossibleTravel(context)
  await detectTokenLifetimeAbuse(context)
  await detectAbnormalLoginTime(context)
  await detectInvalidTokenFlood(context)

}