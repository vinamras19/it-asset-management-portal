import Request from "../models/request.model.js";
import Asset from "../models/asset.model.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const getMyRequests = asyncHandler(async (req, res) => {
    const requests = await Request.find({ user: req.user._id })
        .populate("assets.asset", "name category price")
        .sort({ createdAt: -1 });
    res.json(requests);
});

export const getRequestById = asyncHandler(async (req, res) => {
    const request = await Request.findById(req.params.id)
        .populate("user", "name email department")
        .populate("assets.asset", "name price image");

    if (!request) {
        res.status(404);
        throw new Error("Request not found");
    }

    // Security: Users can only see their own requests (unless Admin)
    if (request.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        res.status(403);
        throw new Error("Not authorized to view this request");
    }

    res.json(request);
});

export const getAllRequests = asyncHandler(async (req, res) => {
    const requests = await Request.find({})
        .populate("user", "name email")
        .sort({ createdAt: -1 });
    res.json(requests);
});

export const getRequestStats = asyncHandler(async (req, res) => {
    const stats = await Request.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 }, totalValue: { $sum: "$totalAmount" } } }
    ]);
    res.json(stats);
});

export const createRequest = async (req, res) => {
    try {
        const { assets, justification, priority, deliveryLocation } = req.body;

        if (!assets || assets.length === 0) {
            return res.status(400).json({ message: "No assets selected" });
        }

        // 1. Calculate Total & Validate Assets
        let totalAmount = 0;
        const requestAssets = [];

        for (const item of assets) {
            const asset = await Asset.findById(item.assetId);
            if (!asset) {
                return res.status(404).json({ message: `Asset not found: ${item.assetId}` });
            }

            // Business Logic: Prevent requesting retired assets
            if (asset.status === 'retired') {
                return res.status(400).json({ message: `Cannot request retired asset: ${asset.name}` });
            }

            requestAssets.push({
                asset: asset._id,
                quantity: item.quantity || 1,
                priceAtRequest: asset.purchasePrice
            });
            totalAmount += asset.purchasePrice * (item.quantity || 1);
        }

        // 2. Create Request
        const newRequest = await Request.create({
            user: req.user._id,
            assets: requestAssets,
            totalAmount,
            justification,
            priority: priority || "Normal",
            deliveryLocation
        });

        res.status(201).json(newRequest);

    } catch (error) {
        console.error("Procurement Request Failed:", error);
        res.status(500).json({ message: "Failed to submit request", error: error.message });
    }
};

export const updateRequestStatus = async (req, res) => {
    try {
        const { status, reason, adminNotes } = req.body;
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        const oldStatus = request.status;
        request.status = status;
        request.adminNotes = adminNotes || request.adminNotes;

        if (status === "Approved") {
            request.approvedBy = req.user._id;
            request.approvedAt = Date.now();
        } else if (status === "Rejected") {
            request.rejectionReason = reason;
        } else if (status === "Fulfilled" && oldStatus !== "Fulfilled") {
            request.fulfilledBy = req.user._id;
            request.fulfilledAt = Date.now();

            // Business Logic: Assign assets to user
            for (const item of request.assets) {
                await Asset.findByIdAndUpdate(item.asset, {
                    status: "assigned", // Lowercase Enum Fix
                    assignedTo: request.user,
                    location: request.deliveryLocation?.desk || "User Desk"
                });
            }
        }

        await request.save();
        res.json(request);

    } catch (error) {
        console.error("Status Update Failed:", error);
        res.status(500).json({ message: "Update failed", error: error.message });
    }
};

export const cancelRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) return res.status(404).json({ message: "Not found" });

        // Authorization Check
        if (request.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (request.status !== "Pending") {
            return res.status(400).json({ message: "Cannot cancel processed request" });
        }

        request.status = "Cancelled";
        await request.save();

        res.json({ message: "Request cancelled" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};