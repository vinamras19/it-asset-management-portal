import License from "../models/license.model.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const getAllLicenses = asyncHandler(async (req, res) => {
    const licenses = await License.find().sort({ expiryDate: 1 });
    res.json(licenses);
});

export const createLicense = asyncHandler(async (req, res) => {
    const license = await License.create(req.body);
    res.status(201).json(license);
});

export const deleteLicense = asyncHandler(async (req, res) => {
    const license = await License.findByIdAndDelete(req.params.id);

    if (!license) {
        res.status(404);
        throw new Error("License not found");
    }

    res.json({ message: "License removed" });
});