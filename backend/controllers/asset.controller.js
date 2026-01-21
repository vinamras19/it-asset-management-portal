import Asset from "../models/asset.model.js";
import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import { cacheInvalidatePattern } from "../lib/cache.js";

export const getAllAssets = async (req, res) => {
    try {
        const assets = await Asset.find({}).populate('assignedTo', 'name email department');
        res.json({ products: assets || [] });
    } catch (error) {
        ("Error in getAllAssets", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getFeaturedAssets = async (req, res) => {
    try {
        let featuredAssets = await redis.get("featured_assets");
        if (featuredAssets) return res.json(JSON.parse(featuredAssets));

        const assets = await Asset.find({ isFeatured: true }).lean();
        if (!assets) return res.status(404).json({ message: "No featured assets" });

        await redis.set("featured_assets", JSON.stringify(assets));
        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const createAsset = async (req, res) => {
    try {
        const { name, description, price, image, category, serialNumber, status, condition, purchaseDate, usefulLife, co2Footprint } = req.body;

        let cloudinaryResponse = null;
        if (image && image.startsWith('data:')) {
            cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "assets" });
        }

        const asset = await Asset.create({
            name, description, price,
            image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : (image || ""),
            category, serialNumber, status, condition,
            purchaseDate, usefulLife, co2Footprint,
            history: [{
                action: "Created",
                user: req.user?.name || "Admin",
                details: "Asset initialized in system.",
                date: new Date()
            }]
        });
        await cacheInvalidatePattern("analytics:*");
        await cacheInvalidatePattern("assets:*");
        await redis.del("featured_assets");

        res.status(201).json(asset);
    } catch (error) {
        ("Error in createAsset", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateAsset = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (!asset) return res.status(404).json({ message: "Asset not found" });

        const statusChanged = req.body.status && req.body.status !== asset.status;
        const previousStatus = asset.status;
        const assignmentChanged = req.body.assignedTo !== undefined &&
            String(req.body.assignedTo || '') !== String(asset.assignedTo || '');
        const previousAssignee = asset.assignedTo;
        if (req.body.image && req.body.image.startsWith('data:') && req.body.image !== asset.image) {
            const cloudinaryResponse = await cloudinary.uploader.upload(req.body.image, { folder: "assets" });
            req.body.image = cloudinaryResponse.secure_url;
        }
        Object.assign(asset, req.body);
        if (statusChanged) {
            asset.history.push({
                action: "Status Change",
                user: req.user?.name || "Admin",
                details: `Status changed from ${previousStatus} to ${req.body.status}`,
                date: new Date()
            });
        }

        if (assignmentChanged) {
            asset.history.push({
                action: req.body.assignedTo ? "Assigned" : "Unassigned",
                user: req.user?.name || "Admin",
                details: req.body.assignedTo
                    ? `Asset assigned to user`
                    : `Asset unassigned from previous user`,
                date: new Date()
            });
        }

        if (!statusChanged && !assignmentChanged) {
            asset.history.push({
                action: "Updated",
                user: req.user?.name || "Admin",
                details: "Asset details updated.",
                date: new Date()
            });
        }

        await asset.save();
        await cacheInvalidatePattern("analytics:*");
        await cacheInvalidatePattern("assets:*");
        await redis.del("featured_assets");
        const updatedAsset = await Asset.findById(asset._id).populate('assignedTo', 'name email department');
        res.json(updatedAsset);
    } catch (error) {
        ("Error in updateAsset", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteAsset = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (!asset) return res.status(404).json({ message: "Asset not found" });

        if (asset.image && asset.image.includes('cloudinary')) {
            const publicId = asset.image.split("/").pop().split(".")[0];
            try { await cloudinary.uploader.destroy(`assets/${publicId}`); }
            catch (error) { ("Error deleting image", error); }
        }

        await Asset.findByIdAndDelete(req.params.id);
        await cacheInvalidatePattern("analytics:*");
        await cacheInvalidatePattern("assets:*");
        await redis.del("featured_assets");

        res.json({ message: "Asset deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getRecommendedAssets = async (req, res) => {
    try {
        const assets = await Asset.aggregate([
            { $match: { status: "Available" } },
            { $sample: { size: 4 } }
        ]);
        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAssetsByCategory = async (req, res) => {
    try {
        const assets = await Asset.find({ category: req.params.category });
        res.json({ products: assets });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAssetById = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id).populate('assignedTo', 'name email department');
        if (asset) res.json(asset);
        else res.status(404).json({ message: "Asset not found" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const getAssetByTag = async (req, res) => {
    try {
        const { tag } = req.params;
        const asset = await Asset.findOne({ assetTag: tag }).populate('assignedTo', 'name email department');

        if (asset) {
            res.json(asset);
        } else {
            res.status(404).json({ message: "Asset not found with this tag" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const searchAssets = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: "Search query required" });
        }

        const assets = await Asset.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { assetTag: { $regex: q, $options: 'i' } },
                { serialNumber: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } }
            ]
        }).populate('assignedTo', 'name email').limit(20);

        res.json({ products: assets });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const toggleFeaturedAsset = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (asset) {
            asset.isFeatured = !asset.isFeatured;
            await asset.save();
            await redis.del("featured_assets");
            res.json(asset);
        } else res.status(404).json({ message: "Asset not found" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const getAssetStats = async (req, res) => {
    try {
        const stats = await Asset.aggregate([
            {
                $facet: {
                    byStatus: [
                        { $group: { _id: "$status", count: { $sum: 1 } } }
                    ],
                    byCategory: [
                        { $group: { _id: "$category", count: { $sum: 1 } } }
                    ],
                    byCondition: [
                        { $group: { _id: "$condition", count: { $sum: 1 } } }
                    ],
                    totalValue: [
                        { $group: { _id: null, total: { $sum: "$price" } } }
                    ],
                    totalAssets: [
                        { $count: "count" }
                    ],
                    recentlyAdded: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 5 },
                        { $project: { name: 1, assetTag: 1, category: 1, createdAt: 1 } }
                    ]
                }
            }
        ]);

        res.json(stats[0]);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const exportAssets = async (req, res) => {
    try {
        const assets = await Asset.find({}).populate('assignedTo', 'name email').lean();

        const exportData = assets.map(asset => ({
            assetTag: asset.assetTag,
            name: asset.name,
            category: asset.category,
            serialNumber: asset.serialNumber || '',
            status: asset.status,
            condition: asset.condition,
            price: asset.price,
            purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
            assignedTo: asset.assignedTo?.name || '',
            assignedToEmail: asset.assignedTo?.email || '',
            co2Footprint: asset.co2Footprint || 0,
            usefulLife: asset.usefulLife || 0,
            createdAt: new Date(asset.createdAt).toISOString().split('T')[0]
        }));

        res.json(exportData);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const bulkUpdateStatus = async (req, res) => {
    try {
        const { assetIds, status } = req.body;

        if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
            return res.status(400).json({ message: "Asset IDs required" });
        }

        if (!status) {
            return res.status(400).json({ message: "Status required" });
        }

        const result = await Asset.updateMany(
            { _id: { $in: assetIds } },
            {
                $set: { status },
                $push: {
                    history: {
                        action: "Bulk Status Update",
                        user: req.user?.name || "Admin",
                        details: `Status changed to ${status}`,
                        date: new Date()
                    }
                }
            }
        );

        res.json({
            message: `Updated ${result.modifiedCount} assets`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const getAssignedAssets = async (req, res) => {
    try {
        const { userId } = req.params;
        const assets = await Asset.find({ assignedTo: userId })
            .select('name assetTag category image status condition')
            .sort({ name: 1 });

        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};