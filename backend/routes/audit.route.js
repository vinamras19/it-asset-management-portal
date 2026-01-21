import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { getMyAuditLogs, getSecurityMetrics } from "../controllers/audit.controller.js";

const router = express.Router();
router.get("/my-logs", protectRoute, getMyAuditLogs);
router.get("/security-metrics", protectRoute, adminRoute, getSecurityMetrics);

export default router;