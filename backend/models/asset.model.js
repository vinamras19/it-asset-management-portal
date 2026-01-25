import mongoose from "mongoose";
import crypto from "crypto";

const assetSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: { type: String, default: "" },

        purchasePrice: { type: Number, min: 0, required: true },

        image: { type: String, default: "" },
        category: { type: String, required: true },

        assetTag: {
            type: String,
            unique: true,
            default: () => `AST-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
        },

        serialNumber: { type: String, unique: true, required: true },

        status: {
            type: String,
            enum: ["available", "assigned", "maintenance", "retired", "lost"],
            default: "available"
        },

        condition: {
            type: String,
            enum: ["New", "Excellent", "Good", "Fair", "Damaged"],
            default: "New"
        },

        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        purchaseDate: { type: Date, default: Date.now },
        usefulLife: { type: Number, default: 3 },

        location: { type: String, default: "Main Office" },

        isFeatured: { type: Boolean, default: false },

        history: [{
            action: String,
            date: { type: Date, default: Date.now },
            user: String,
            details: String
        }]
    },
    { timestamps: true }
);

assetSchema.index({ category: 1 });
assetSchema.index({ status: 1 });
assetSchema.index({ assignedTo: 1 });
assetSchema.index({ name: 'text', description: 'text', serialNumber: 'text' });
const Asset = mongoose.model("Asset", assetSchema);
export default Asset;