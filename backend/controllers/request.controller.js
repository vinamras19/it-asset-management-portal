import Request from "../models/request.model.js";
import Asset from "../models/asset.model.js";
import User from "../models/user.model.js";
import { createAuditLog } from "./audit.controller.js";
import { cacheInvalidatePattern } from "../lib/cache.js";
export const createRequest = async (req, res) => {
    try {
        const { assets, totalAmount, justification, priority, deliveryLocation } = req.body;

        if (!Array.isArray(assets) || assets.length === 0) {
            return res.status(400).json({ message: "No assets selected" });
        }
        const requestAssets = [];
        for (const item of assets) {
            const asset = await Asset.findById(item.asset || item._id || item.product);
            if (!asset) {
                return res.status(404).json({ message: `Asset not found: ${item.asset || item._id}` });
            }
            requestAssets.push({
                asset: asset._id,
                quantity: item.quantity || 1,
                priceAtRequest: asset.price || 0,
            });
        }
        const calculatedTotal = requestAssets.reduce(
            (sum, item) => sum + (item.priceAtRequest * item.quantity),
            0
        );

        const newRequest = new Request({
            user: req.user._id,
            assets: requestAssets,
            totalAmount: totalAmount || calculatedTotal,
            justification: justification || "",
            priority: priority || "Normal",
            deliveryLocation: deliveryLocation || {},
            status: "Pending",
        });

        await newRequest.save();
        await User.findByIdAndUpdate(req.user._id, { selectedItems: [] });
        try {
            await createAuditLog({
                userId: req.user._id,
                action: "REQUEST_CREATED",
                resource: "Request",
                resourceId: newRequest._id.toString(),
                details: `Request ${newRequest.requestNumber} created with ${requestAssets.length} items`,
                ipAddress: req.ip,
                status: "SUCCESS",
            });
        } catch (e) {  }
        await cacheInvalidatePattern("requests:*");

        res.status(201).json(newRequest);
    } catch (error) {
                res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const getMyRequests = async (req, res) => {
    try {
        const requests = await Request.find({ user: req.user._id })
            .populate("assets.asset", "name image category price")
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
                res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const getAllRequests = async (req, res) => {
    try {
        const { status, priority } = req.query;
        const query = {};

        if (status) query.status = status;
        if (priority) query.priority = priority;

        const requests = await Request.find(query)
            .populate("user", "name email department")
            .populate("assets.asset", "name image category price status")
            .populate("approvedBy", "name")
            .populate("fulfilledBy", "name")
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
                res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const getRequestById = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate("user", "name email department")
            .populate("assets.asset")
            .populate("approvedBy", "name")
            .populate("fulfilledBy", "name");

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        const isOwner = request.user._id.toString() === req.user._id.toString();
        const isAdmin = ["admin", "warehouse_manager"].includes(req.user.role);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const updateRequestStatus = async (req, res) => {
    try {
        const { status, rejectionReason, adminNotes } = req.body;
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        const oldStatus = request.status;
        request.status = status;
        if (status === "Approved" && oldStatus !== "Approved") {
            request.approvedBy = req.user._id;
            request.approvedAt = new Date();
        }
        if (status === "Rejected") {
            request.rejectionReason = rejectionReason || "";
        }
        if (status === "Fulfilled" && oldStatus !== "Fulfilled") {
            request.fulfilledBy = req.user._id;
            request.fulfilledAt = new Date();
            for (const item of request.assets) {
                await Asset.findByIdAndUpdate(item.asset, {
                    status: "Assigned",
                    assignedTo: request.user,
                    $push: {
                        history: {
                            action: "Assigned",
                            user: req.user.name || "Admin",
                            details: `Assigned via request ${request.requestNumber}`,
                            date: new Date(),
                        }
                    }
                });
            }
        }

        if (adminNotes) {
            request.adminNotes = adminNotes;
        }

        await request.save();
        try {
            await createAuditLog({
                userId: req.user._id,
                action: `REQUEST_${status.toUpperCase()}`,
                resource: "Request",
                resourceId: request._id.toString(),
                changes: { before: { status: oldStatus }, after: { status } },
                ipAddress: req.ip,
                status: "SUCCESS",
            });
        } catch (error) {
            console.error("Audit Log Error:", error.message);
        }
        await cacheInvalidatePattern("requests:*");
        await cacheInvalidatePattern("assets:*");
        await cacheInvalidatePattern("analytics:*");
        const updatedRequest = await Request.findById(request._id)
            .populate("user", "name email department")
            .populate("assets.asset", "name image category")
            .populate("approvedBy", "name")
            .populate("fulfilledBy", "name");

        res.json(updatedRequest);
    } catch (error) {
                res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const cancelRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        if (request.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }
        if (request.status !== "Pending") {
            return res.status(400).json({
                message: "Can only cancel pending requests"
            });
        }

        request.status = "Cancelled";
        await request.save();
        try {
            await createAuditLog({
                userId: req.user._id,
                action: "REQUEST_CANCELLED",
                resource: "Request",
                resourceId: request._id.toString(),
                ipAddress: req.ip,
                status: "SUCCESS",
            });
        } catch (error) {
            console.error("Audit Log Error:", error.message);
        }

        res.json({ message: "Request cancelled", request });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const getRequestStats = async (req, res) => {
    try {
        const stats = await Request.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalValue: { $sum: "$totalAmount" },
                }
            }
        ]);

        const pending = stats.find(s => s._id === "Pending") || { count: 0, totalValue: 0 };
        const approved = stats.find(s => s._id === "Approved") || { count: 0, totalValue: 0 };
        const fulfilled = stats.find(s => s._id === "Fulfilled") || { count: 0, totalValue: 0 };
        const rejected = stats.find(s => s._id === "Rejected") || { count: 0, totalValue: 0 };

        res.json({
            pending: pending.count,
            approved: approved.count,
            fulfilled: fulfilled.count,
            rejected: rejected.count,
            pendingValue: pending.totalValue,
            totalRequests: stats.reduce((sum, s) => sum + s.count, 0),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};