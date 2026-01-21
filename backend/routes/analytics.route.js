import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
    getAnalyticsData,
    getAssetStatsByCategory,
    getCacheStatus,
    invalidateAnalyticsCache
} from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/", getAnalyticsData);
router.get("/category/:category", protectRoute, adminRoute, getAssetStatsByCategory);
router.get("/cache-status", protectRoute, adminRoute, getCacheStatus);
router.post("/cache-invalidate", protectRoute, adminRoute, async (req, res) => {
    await invalidateAnalyticsCache();
    res.json({ message: "Cache invalidated successfully" });
});

export default router;