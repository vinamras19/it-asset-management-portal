import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { checkPermission } from "../middleware/permission.middleware.js";
import { getMyAuditLogs, getSecurityMetrics } from "../controllers/audit.controller.js";

const router = express.Router();
router.get("/my-logs", protectRoute, getMyAuditLogs);
router.get("/security-metrics", protectRoute, checkPermission('audit_logs', 'read'), getSecurityMetrics);

export default router;