import RequestLog from "../models/RequestLog.js";

export const getUserBaseline = async (userId) => {
  const lastLogs = await RequestLog.find({ userId })
    .sort({ createdAt: -1 })
    .limit(100);

  if (lastLogs.length === 0) {
    return { avgRate: 10 }; // default baseline
  }

  const timeWindow = 60; // seconds
  const avgRate = lastLogs.length / timeWindow;

  return {
    avgRate
  };
};