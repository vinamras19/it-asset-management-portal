import express from "express";

import {
    getAllAssets,
    getFeaturedAssets,
    createAsset,
    deleteAsset,
    updateAsset,
    getRecommendedAssets,
    getAssetsByCategory,
    getAssetById,
    toggleFeaturedAsset,
    getAssetByTag,
    searchAssets,
    getAssetStats,
    exportAssets,
    bulkUpdateStatus,
    getAssignedAssets
} from "../controllers/asset.controller.js";

import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { validateAsset, validateAssetId } from "../middleware/validation.js";
import { fileUploadLimiter } from "../config/security.js";

const router = express.Router();

router.get("/", getAllAssets);
router.get("/featured", getFeaturedAssets);
router.get("/recommendations", getRecommendedAssets);
router.get("/category/:category", getAssetsByCategory);
router.get("/search", searchAssets);
router.get("/stats", getAssetStats);
router.get("/tag/:tag", getAssetByTag);
router.get("/:id", validateAssetId, getAssetById);

router.get("/assigned/:userId", protectRoute, getAssignedAssets);

router.get("/export/csv", protectRoute, adminRoute, exportAssets);
router.post("/", protectRoute, adminRoute, fileUploadLimiter, validateAsset, createAsset);
router.put("/:id", protectRoute, adminRoute, validateAssetId, validateAsset, updateAsset);
router.patch("/:id", protectRoute, adminRoute, validateAssetId, toggleFeaturedAsset);
router.delete("/:id", protectRoute, adminRoute, validateAssetId, deleteAsset);
router.post("/bulk/status", protectRoute, adminRoute, bulkUpdateStatus);

export default router;



