import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

import {
    createRequest,
    getMyRequests,
    getAllRequests,
    getRequestById,
    updateRequestStatus,
    cancelRequest,
    getRequestStats
} from "../controllers/request.controller.js";

import { validateCreateRequest } from "../middleware/validation.js";

const router = express.Router();

// Employee Routes
router.post("/", protectRoute, validateCreateRequest, createRequest);
router.get("/", protectRoute, getMyRequests);
router.get("/my", protectRoute, getMyRequests);
router.patch("/:id/cancel", protectRoute, cancelRequest);
router.get("/:id", protectRoute, getRequestById);

// Admin Routes
router.get("/admin/all", protectRoute, adminRoute, getAllRequests);
router.get("/admin/stats", protectRoute, adminRoute, getRequestStats);
router.patch("/:id/status", protectRoute, adminRoute, updateRequestStatus);

export default router;