import RequestLog from "../models/RequestLog.js";

export const getKnownIPs = async (userId) => {
  const logs = await RequestLog.find({ userId })
    .select("ipAddress")
    .limit(50);

  return new Set(logs.map(l => l.ipAddress));
};