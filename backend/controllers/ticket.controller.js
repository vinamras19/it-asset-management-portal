import Ticket from "../models/ticket.model.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import cloudinary from "../lib/cloudinary.js";

export const getAllTickets = asyncHandler(async (req, res) => {
    // Admin sees all, Employees see their own
    const query = req.user.role === "admin" ? {} : { user: req.user._id };

    const tickets = await Ticket.find(query)
        .populate("user", "name email")
        .populate("asset", "name assetTag")
        .sort({ createdAt: -1 });

    res.json(tickets);
});

export const getTicketById = asyncHandler(async (req, res) => {
    const ticket = await Ticket.findById(req.params.id)
        .populate("user", "name email")
        .populate("asset", "name serialNumber")
        .populate("comments.user", "name role");

    if (!ticket) {
        res.status(404);
        throw new Error("Ticket not found");
    }

    // Access Control
    if (req.user.role !== "admin" && ticket.user._id.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Not authorized");
    }

    res.json(ticket);
});

export const getTicketStats = asyncHandler(async (req, res) => {
    const stats = await Ticket.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    res.json(stats);
});

export const getUserTicketStats = asyncHandler(async (req, res) => {
    const stats = await Ticket.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    res.json(stats);
});

export const createTicket = async (req, res) => {
    try {
        const { title, description, category, priority, assetId, image } = req.body;

        // Validation: Logic for General Inquiry vs Hardware Issues
        if (category !== "General Inquiry" && !assetId) {
            return res.status(400).json({ message: "Asset is required for this ticket category" });
        }

        let attachments = [];
        if (image) {
            try {
                const result = await cloudinary.uploader.upload(image, { folder: "tickets" });
                attachments.push({ url: result.secure_url, filename: "upload.jpg" });
            } catch (imgError) {
                console.error("Image upload failed, proceeding without image:", imgError);
            }
        }

        const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;

        const ticket = await Ticket.create({
            ticketNumber,
            user: req.user._id,
            asset: assetId || undefined, // handles the optional model field
            title,
            description,
            category,
            priority: priority || "Medium",
            attachments
        });

        res.status(201).json(ticket);

    } catch (error) {
        console.error("Create Ticket Error:", error);
        res.status(500).json({ message: "Failed to create ticket", error: error.message });
    }
};

export const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        ticket.comments.push({
            user: req.user._id,
            text
        });


        if (req.user.role === "admin" && ticket.status === "Open") {
            ticket.status = "In Progress";
        }

        if (req.user.role === "employee" && ticket.status === "Waiting on User") {
            ticket.status = "In Progress";
        }

        await ticket.save();


        const updatedTicket = await Ticket.findById(req.params.id).populate("comments.user", "name role");
        res.json(updatedTicket.comments.pop());

    } catch (error) {
        res.status(500).json({ message: "Failed to add comment" });
    }
};

export const updateTicketStatus = async (req, res) => {
    try {
        const { status, resolution } = req.body;

        const updateData = { status };
        if (resolution) updateData.resolution = resolution;
        if (status === "Resolved" || status === "Closed") updateData.resolvedAt = Date.now();

        const ticket = await Ticket.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        res.json(ticket);

    } catch (error) {
        res.status(500).json({ message: "Update failed" });
    }
};

export const deleteTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findByIdAndDelete(req.params.id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });
        res.json({ message: "Ticket deleted" });
    } catch (error) {
        res.status(500).json({ message: "Delete failed" });
    }
};