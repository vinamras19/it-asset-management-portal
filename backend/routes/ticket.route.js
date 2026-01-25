import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
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

router.get("/admin/stats", protectRoute, adminRoute, getTicketStats);
router.patch("/:id", protectRoute, adminRoute, updateTicketStatus);
router.delete("/:id", protectRoute, adminRoute, deleteTicket);

export default router;