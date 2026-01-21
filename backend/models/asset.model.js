import mongoose from "mongoose";
import crypto from "crypto";

const assetSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, min: 0, required: true },
        image: { type: String, required: true },
        category: { type: String, required: true },
        isFeatured: { type: Boolean, default: false },

        assetTag: {
            type: String,
            unique: true,
            default: () => `AST-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
        },

        serialNumber: { type: String, unique: true, sparse: true },
        status: {
            type: String,
            enum: ["Available", "Assigned", "Maintenance", "Retired", "Lost"],
            default: "Available"
        },
        condition: {
            type: String,
            enum: ["New", "Excellent", "Good", "Fair", "Damaged"],
            default: "New"
        },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        purchaseDate: { type: Date, default: Date.now },
        usefulLife: { type: Number, default: 4 }, // Years
        co2Footprint: { type: Number, default: 0 },

        history: [{
            action: String,
            date: { type: Date, default: Date.now },
            user: String,
            details: String
        }]
    },
    { timestamps: true }
);

const Asset = mongoose.model("Asset", assetSchema);

export default Asset;