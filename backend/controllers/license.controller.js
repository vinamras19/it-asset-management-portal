import License from "../models/license.model.js";

export const getAllLicenses = async (req, res) => {
    try {
        const licenses = await License.find().sort({ expiryDate: 1 });
        res.json(licenses);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const createLicense = async (req, res) => {
    try {
        const license = await License.create(req.body);
        res.status(201).json(license);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteLicense = async (req, res) => {
    try {
        await License.findByIdAndDelete(req.params.id);
        res.json({ message: "License removed" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};