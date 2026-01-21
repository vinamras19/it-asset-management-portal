import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const ticketSchema = new mongoose.Schema(
    {
        ticketNumber: {
            type: String,
            unique: true,
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        asset: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Asset",
            required: true,
        },
        title: {
            type: String,
            required: true,
            maxlength: 200,
        },
        description: {
            type: String,
            required: true,
            maxlength: 2000,
        },
        category: {
            type: String,
            enum: [
                "Hardware Issue",
                "Software Issue",
                "Damage Report",
                "Request Return",
                "Upgrade Request",
                "General Inquiry",
                "Other"
            ],
            default: "Hardware Issue",
        },
        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            default: "Medium",
        },
        status: {
            type: String,
            enum: ["Open", "In Progress", "Waiting on User", "Resolved", "Closed"],
            default: "Open",
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        adminNotes: {
            type: String,
            default: "",
            maxlength: 2000,
        },
        resolution: {
            type: String,
            default: "",
            maxlength: 2000,
        },
        comments: [commentSchema],
        resolvedAt: { type: Date },
        closedAt: { type: Date },
        attachments: [{
            url: String,
            filename: String,
            uploadedAt: { type: Date, default: Date.now },
        }],
    },
    { timestamps: true }
);
ticketSchema.index({ user: 1, status: 1 });
ticketSchema.index({ createdAt: -1 });

const Ticket = mongoose.model("Ticket", ticketSchema);
export default Ticket;