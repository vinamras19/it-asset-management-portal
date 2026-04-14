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

import { protectRoute } from "../middleware/auth.middleware.js";
import { checkPermission } from "../middleware/permission.middleware.js";
import { validateAsset, validateAssetId } from "../middleware/validation.js";
import { fileUploadLimiter } from "../config/security.js";

const router = express.Router();

router.get("/", getAllAssets);
router.get("/featured", getFeaturedAssets);
router.get("/recommendations", getRecommendedAssets);
router.get("/category/:category", getAssetsByCategory);
router.get("/search", searchAssets);
router.get("/stats", protectRoute, getAssetStats);
router.get("/tag/:tag", getAssetByTag);
router.get("/:id", validateAssetId, getAssetById);

router.get("/assigned/:userId", protectRoute, getAssignedAssets);

router.get("/export/csv", protectRoute, checkPermission('assets', 'read'), exportAssets);
router.post("/", protectRoute, checkPermission('assets', 'create'), fileUploadLimiter, validateAsset, createAsset);
router.put("/:id", protectRoute, checkPermission('assets', 'update'), validateAssetId, validateAsset, updateAsset);
router.patch("/:id", protectRoute, checkPermission('assets', 'update'), validateAssetId, toggleFeaturedAsset);
router.delete("/:id", protectRoute, checkPermission('assets', 'delete'), validateAssetId, deleteAsset);
router.post("/bulk/status", protectRoute, checkPermission('assets', 'update'), bulkUpdateStatus);

export default router;



