import Ticket from "../models/ticket.model.js";
import Product from "../models/asset.model.js";
import { createAuditLog } from "./audit.controller.js";
export const createTicket = async (req, res) => {
    try {
        const { assetId, title, description, priority, category } = req.body;
        const asset = await Product.findById(assetId);
        if (!asset) {
            return res.status(404).json({ message: "Asset not found" });
        }
        const ticket = await Ticket.create({
            user: req.user._id,
            asset: assetId,
            title,
            description,
            priority: priority || "Medium",
            category: category || "Hardware Issue",
            ticketNumber: `TKT-${Date.now().toString(36).toUpperCase()}`,
        });
        if (category === "Hardware Issue" || category === "Damage Report") {
            await Product.findByIdAndUpdate(assetId, { status: "Maintenance" });
        }
        await createAuditLog({
            userId: req.user._id,
            action: "TICKET_CREATED",
            resource: "Ticket",
            resourceId: ticket._id,
            metadata: { title, priority, assetId },
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
        });
        const populated = await Ticket.findById(ticket._id)
            .populate("user", "name email")
            .populate("asset", "name assetTag image");

        res.status(201).json(populated);
    } catch (error) {
        console.error("Create ticket error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const getAllTickets = async (req, res) => {
    try {
        const { status, priority, category, search } = req.query;
        let query = {};
        if (req.user.role !== "admin" && req.user.role !== "warehouse_manager") {
            query.user = req.user._id;
        }
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (category) query.category = category;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { ticketNumber: { $regex: search, $options: "i" } },
            ];
        }

        const tickets = await Ticket.find(query)
            .populate("user", "name email department")
            .populate("asset", "name assetTag image category")
            .populate("assignedTo", "name email")
            .populate("comments.user", "name")
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        console.error("Get tickets error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate("user", "name email department")
            .populate("asset", "name assetTag image category serialNumber")
            .populate("assignedTo", "name email")
            .populate("comments.user", "name email");

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }
        if (req.user.role !== "admin" && req.user.role !== "warehouse_manager") {
            if (ticket.user._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Not authorized" });
            }
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const updateTicketStatus = async (req, res) => {
    try {
        const { status, adminNotes, assignedTo, resolution } = req.body;

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        const oldStatus = ticket.status;
        if (status) ticket.status = status;
        if (adminNotes !== undefined) ticket.adminNotes = adminNotes;
        if (assignedTo) ticket.assignedTo = assignedTo;
        if (resolution) ticket.resolution = resolution;
        if (status === "Resolved" && !ticket.resolvedAt) {
            ticket.resolvedAt = new Date();
        }
        if (status === "Closed" && !ticket.closedAt) {
            ticket.closedAt = new Date();
        }

        await ticket.save();
        if (status === "Resolved" || status === "Closed") {
            const asset = await Product.findById(ticket.asset);
            if (asset && asset.status === "Maintenance") {
                await Product.findByIdAndUpdate(ticket.asset, { status: "Available" });
            }
        }
        await createAuditLog({
            userId: req.user._id,
            action: "TICKET_UPDATED",
            resource: "Ticket",
            resourceId: ticket._id,
            changes: { from: oldStatus, to: status },
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
        });

        const populated = await Ticket.findById(ticket._id)
            .populate("user", "name email")
            .populate("asset", "name assetTag image")
            .populate("assignedTo", "name email");

        res.json(populated);
    } catch (error) {
        console.error("Update ticket error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const addComment = async (req, res) => {
    try {
        const { text } = req.body;

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }
        if (req.user.role !== "admin" && req.user.role !== "warehouse_manager") {
            if (ticket.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Not authorized" });
            }
        }

        ticket.comments.push({
            user: req.user._id,
            text,
            createdAt: new Date(),
        });

        await ticket.save();

        const populated = await Ticket.findById(ticket._id)
            .populate("comments.user", "name email");

        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const getTicketStats = async (req, res) => {
    try {
        const [statusStats, priorityStats, categoryStats, recentTickets] = await Promise.all([
            Ticket.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            Ticket.aggregate([
                { $group: { _id: "$priority", count: { $sum: 1 } } },
            ]),
            Ticket.aggregate([
                { $group: { _id: "$category", count: { $sum: 1 } } },
            ]),
            Ticket.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            }),
        ]);
        const resolvedTickets = await Ticket.find({
            status: { $in: ["Resolved", "Closed"] },
            resolvedAt: { $exists: true },
        });

        let avgResolutionTime = 0;
        if (resolvedTickets.length > 0) {
            const totalTime = resolvedTickets.reduce((sum, t) => {
                return sum + (new Date(t.resolvedAt) - new Date(t.createdAt));
            }, 0);
            avgResolutionTime = Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60));
        }

        res.json({
            byStatus: statusStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
            byPriority: priorityStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
            byCategory: categoryStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
            recentTickets,
            avgResolutionTime,
            total: await Ticket.countDocuments(),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const deleteTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findByIdAndDelete(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        await createAuditLog({
            userId: req.user._id,
            action: "TICKET_DELETED",
            resource: "Ticket",
            resourceId: req.params.id,
            ipAddress: req.ip,
        });

        res.json({ message: "Ticket deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const getUserTicketStats = async (req, res) => {
    try {
        const stats = await Ticket.aggregate([
            { $match: { user: req.user._id } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        res.json({
            total: stats.reduce((sum, s) => sum + s.count, 0),
            byStatus: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};