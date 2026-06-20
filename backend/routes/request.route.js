import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { checkPermission, restrictTo } from "../middleware/permission.middleware.js";

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

// Management routes (read: admin/manager/auditor, status update: admin/manager)
router.get("/admin/all", protectRoute, restrictTo('admin', 'manager', 'auditor'), getAllRequests);
router.get("/admin/stats", protectRoute, restrictTo('admin', 'manager', 'auditor'), getRequestStats);
router.patch("/:id/status", protectRoute, checkPermission('requests', 'update'), updateRequestStatus);

export default router;