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
import { validateProduct, validateProductId } from "../middleware/validation.js";

const router = express.Router();

router.get("/", getAllAssets);
router.get("/featured", getFeaturedAssets);
router.get("/recommendations", getRecommendedAssets);
router.get("/category/:category", getAssetsByCategory);
router.get("/search", searchAssets);
router.get("/stats", getAssetStats);
router.get("/tag/:tag", getAssetByTag);
router.get("/:id", validateProductId, getAssetById);

router.get("/assigned/:userId", protectRoute, getAssignedAssets);

router.get("/export/csv", protectRoute, adminRoute, exportAssets);
router.post("/", protectRoute, adminRoute, validateProduct, createAsset);
router.put("/:id", protectRoute, adminRoute, validateProductId, validateProduct, updateAsset);
router.patch("/:id", protectRoute, adminRoute, validateProductId, toggleFeaturedAsset);
router.delete("/:id", protectRoute, adminRoute, validateProductId, deleteAsset);
router.post("/bulk/status", protectRoute, adminRoute, bulkUpdateStatus);

export default router;