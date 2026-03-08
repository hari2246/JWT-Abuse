import RequestLog from "../models/RequestLog.js";

export const getKnownIPs = async (userId) => {
  const logs = await RequestLog.find({ userId })
    .select("ipAddress")
    .limit(50);

  return new Set(logs.map(l => l.ipAddress));
};

import geoip from "geoip-lite";

export const geoDistance = (ip1, ip2) => {

  const g1 = geoip.lookup(ip1);
  const g2 = geoip.lookup(ip2);

  if (!g1 || !g2) return 0;

  const latDiff = g1.ll[0] - g2.ll[0];
  const lonDiff = g1.ll[1] - g2.ll[1];

  return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111;
};