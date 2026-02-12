import express from "express";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { logRequest } from "../middleware/logRequest.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { getLogs, getAlerts, revokeToken } from "../controllers/adminController.js";
import { getAlertStats, getRequestStats } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/logs", verifyJWT, logRequest, isAdmin, getLogs);
router.get("/alerts", verifyJWT, logRequest, isAdmin, getAlerts);
router.post("/revoke", verifyJWT, logRequest, isAdmin, revokeToken);
router.get("/stats/alerts", verifyJWT, isAdmin, getAlertStats);
router.get("/stats/requests", verifyJWT, isAdmin, getRequestStats);


export default router;
