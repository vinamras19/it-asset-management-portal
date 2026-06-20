import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

import {
    generateAssetReport,
    generateTicketReport,
    generateAuditReport,
} from "../controllers/report.controller.js";

const router = express.Router();
router.get("/assets", protectRoute, adminRoute, generateAssetReport);
router.get("/tickets", protectRoute, adminRoute, generateTicketReport);
router.get("/audit", protectRoute, adminRoute, generateAuditReport);

export default router;