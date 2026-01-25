import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
    {
        requestNumber: {
            type: String,
            unique: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        assets: [
            {
                asset: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Asset",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                    default: 1,
                },
                priceAtRequest: {
                    type: Number,
                    required: true,
                    min: 0,
                },
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected", "Fulfilled", "Cancelled"],
            default: "Pending",
        },
        justification: {
            type: String,
            default: "",
            maxlength: 1000,
        },
        priority: {
            type: String,
            enum: ["Low", "Normal", "High", "Urgent"],
            default: "Normal",
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        approvedAt: {
            type: Date,
            default: null,
        },
        rejectionReason: {
            type: String,
            default: "",
        },
        fulfilledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        fulfilledAt: {
            type: Date,
            default: null,
        },
        deliveryLocation: {
            building: { type: String, default: "" },
            floor: { type: String, default: "" },
            desk: { type: String, default: "" },
            notes: { type: String, default: "" },
        },
        adminNotes: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);
requestSchema.pre("save", function (next) {
    if (!this.requestNumber) {
        const year = new Date().getFullYear();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.requestNumber = `REQ-${year}-${Date.now().toString().slice(-4)}${random}`;
    }
    next();
});

requestSchema.index({ user: 1, status: 1 });
requestSchema.index({ createdAt: -1 });

const Request = mongoose.model("Request", requestSchema);

export default Request;