import RiskScore from "../models/RiskScore.js";

const RISK_POINTS = {
  TOKEN_REPLAY: 50,
  RATE_ABUSE: 20,
  PRIVILEGE_ABUSE: 30,
};

const calculateLevel = (score) => {
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
};

export const updateRiskScore = async (userId, alertType) => {
  const points = RISK_POINTS[alertType] || 10;

  let risk = await RiskScore.findOne({ userId });

  if (!risk) {
    risk = await RiskScore.create({ userId, score: points });
  } else {
    risk.score += points;
    risk.lastUpdated = new Date();
  }

  risk.level = calculateLevel(risk.score);

  await risk.save();
};