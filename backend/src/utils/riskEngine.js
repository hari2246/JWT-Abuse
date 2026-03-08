import RiskScore from "../models/RiskScore.js";

const RISK_POINTS = {
  TOKEN_REPLAY: 50,
  RATE_ABUSE: 20,
  PRIVILEGE_ABUSE: 30,
  DEVICE_CHANGE: 15,
  CONCURRENT_SESSION: 40,
  API_SCAN: 15,
  REVOKED_TOKEN_USE: 60,
  AI_ANOMALY: 25,
  IMPOSSIBLE_TRAVEL: 45,
  INVALID_TOKEN_FLOOD: 35
};

const calculateLevel = (score) => {

  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";

};

export const updateRiskScore = async (userId, alertType) => {

  const points = RISK_POINTS[alertType] || 10;

  let risk = await RiskScore.findOne({ userId });

  if (!risk) {

    risk = await RiskScore.create({
      userId,
      score: points
    });

  } else {

    risk.score = Math.min(risk.score + points, 100); // cap at 100
    risk.lastUpdated = new Date();

  }

  risk.level = calculateLevel(risk.score);

  await risk.save();

};