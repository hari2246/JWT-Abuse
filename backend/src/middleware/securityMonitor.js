import RequestLog from "../models/RequestLog.js";
import { processSecurityEvent } from "../utils/securityPipeline.js";

export const securityMonitor = async (req,res,next)=>{

  const context = {
    userId: req.user?.id,
    tokenHash: req.tokenHash,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    endpoint: req.originalUrl,
    role: req.user?.role
  };

  // store request log
  await RequestLog.create(context);

  // run security pipeline
  await processSecurityEvent(context);

  next();
};