import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { reportLimiter } from "../middleware/rateLimit.middleware.js";
import {
    generateAssetReport,
    generateTicketReport,
    generateAuditReport,
    generateUserAssetsReport,
} from "../controllers/report.controller.js";

const router = express.Router();
router.get("/assets", protectRoute, adminRoute, reportLimiter, generateAssetReport);
router.get("/tickets", protectRoute, adminRoute, reportLimiter, generateTicketReport);
router.get("/audit", protectRoute, adminRoute, reportLimiter, generateAuditReport);
router.get("/user-assets", protectRoute, adminRoute, reportLimiter, generateUserAssetsReport);

export default router;