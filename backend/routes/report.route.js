import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

import {
    generateAssetReport,
    generateTicketReport,
    generateAuditReport,
    generateUserAssetsReport,
} from "../controllers/report.controller.js";

const router = express.Router();
router.get("/assets", protectRoute, adminRoute, generateAssetReport);
router.get("/tickets", protectRoute, adminRoute, generateTicketReport);
router.get("/audit", protectRoute, adminRoute, generateAuditReport);
router.get("/user-assets", protectRoute, adminRoute, generateUserAssetsReport);

export default router;