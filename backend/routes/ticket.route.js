import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { checkPermission, restrictTo } from "../middleware/permission.middleware.js";
import { validateTicket } from "../middleware/validation.js";

import {
    createTicket,
    getAllTickets,
    getTicketById,
    updateTicketStatus,
    addComment,
    getTicketStats,
    deleteTicket,
    getUserTicketStats,
} from "../controllers/ticket.controller.js";

const router = express.Router();

router.post("/", protectRoute, validateTicket, createTicket);
router.get("/", protectRoute, getAllTickets);
router.get("/my-stats", protectRoute, getUserTicketStats);
router.get("/:id", protectRoute, getTicketById);
router.post("/:id/comments", protectRoute, addComment);

router.get("/admin/stats", protectRoute, restrictTo('admin', 'manager'), getTicketStats);
router.patch("/:id", protectRoute, checkPermission('tickets', 'update'), updateTicketStatus);
router.delete("/:id", protectRoute, checkPermission('tickets', 'delete'), deleteTicket);

export default router;