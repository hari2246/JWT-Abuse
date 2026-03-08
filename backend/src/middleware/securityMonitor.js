import { runSecurityChecks } from "../utils/detectionEngine.js"
import RequestLog from "../models/RequestLog.js"

export const securityMonitor = async (req,res,next) => {

  const context = {
    userId: req.user?.id,
    tokenHash: req.tokenHash,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    endpoint: req.originalUrl,
    role: req.user?.role
  }

  await RequestLog.create(context)

  await runSecurityChecks(context)

  next()
}