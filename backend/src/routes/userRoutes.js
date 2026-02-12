import express from "express";
import { profile } from "../controllers/userController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { logRequest } from "../middleware/logRequest.js";

const router = express.Router();

router.get("/profile", verifyJWT, logRequest, profile);

export default router;
