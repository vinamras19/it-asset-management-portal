import mongoose from "mongoose";

const licenseSchema = new mongoose.Schema(
    {
        softwareName: { type: String, required: true },
        provider: { type: String, required: true },

        licenseKey: { type: String, required: true, trim: true },

        type: {
            type: String,
            enum: ["Subscription", "Perpetual", "Open Source"],
            default: "Subscription"
        },

        seatsTotal: { type: Number, required: true, default: 1 },
        seatsUsed: { type: Number, required: true, default: 0 },
        costPerSeat: { type: Number, required: true, default: 0 },

        purchaseDate: { type: Date, default: Date.now },
        expiryDate: { type: Date, required: true },

        assignedToDept: {
            type: String,
            enum: ["Engineering", "Sales", "Marketing", "HR", "General"],
            default: "General"
        }
    },
    { timestamps: true }
);

const License = mongoose.model("License", licenseSchema);
export default License;