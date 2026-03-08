import UserBehavior from "../models/UserBehavior.js";
import RequestLog from "../models/RequestLog.js";

export const getUserBaseline = async (userId) => {

  const baseline = await UserBehavior.findOne({ userId });

  if (!baseline) {
    return {
      avgRate: 10,
      commonEndpoints: [],
      knownIPs: [],
      loginHours: { start: 6, end: 23 }
    };
  }

  return baseline;
};

export const updateUserBaseline = async (userId) => {

  const logs = await RequestLog.find({ userId })
    .sort({ createdAt: -1 })
    .limit(200);

  if (!logs.length) return;

  // average request rate
  const timeWindow = 60 * 1000;
  const now = Date.now();

  const recent = logs.filter(
    l => now - l.createdAt < timeWindow
  );

  const avgRate = recent.length;

  // common endpoints
  const endpointCount = {};
  logs.forEach(l => {
    endpointCount[l.endpoint] = (endpointCount[l.endpoint] || 0) + 1;
  });

  const commonEndpoints = Object.keys(endpointCount)
    .sort((a,b)=>endpointCount[b]-endpointCount[a])
    .slice(0,5);

  // known IPs
  const knownIPs = [...new Set(logs.map(l => l.ipAddress))];

  // login hours
  const hours = logs.map(l => new Date(l.createdAt).getHours());
  const start = Math.min(...hours);
  const end = Math.max(...hours);

  await UserBehavior.findOneAndUpdate(
    { userId },
    {
      avgRate,
      commonEndpoints,
      knownIPs,
      loginHours:{ start,end },
      lastUpdated:new Date()
    },
    { upsert:true }
  );

};