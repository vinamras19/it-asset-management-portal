import Asset from "../models/asset.model.js";
import { cacheGet, cacheInvalidate, cacheInvalidatePattern, CacheKeys } from "../lib/cache.js";
import cloudinary from "../lib/cloudinary.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createAuditLog } from "./audit.controller.js";

export const getAllAssets = asyncHandler(async (req, res) => {
    const assets = await cacheGet(CacheKeys.ASSET_LIST, () =>
        Asset.find({}).populate('assignedTo', 'name email department')
    );
    res.json(assets);
});

export const getAssetById = asyncHandler(async (req, res) => {
    const asset = await Asset.findById(req.params.id).populate('assignedTo', 'name email department');
    if (!asset) {
        res.status(404);
        throw new Error("Asset not found");
    }
    res.json(asset);
});

export const createAsset = asyncHandler(async (req, res) => {
    const { name, description, purchasePrice, image, category, serialNumber, status, purchaseDate, location } = req.body;

    let cloudinaryResponse = null;
    if (image) {
        cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "assets" });
    }

    const asset = await Asset.create({
        name,
        description,
        purchasePrice: purchasePrice || 0,
        category,
        serialNumber,
        status: status || 'available',
        purchaseDate,
        location: location || 'Warehouse',
        image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
        history: [{
            action: 'CREATE',
            user: req.user?.name || 'System',
            details: `Asset created with status '${status || 'available'}'`
        }]
    });

    await createAuditLog({
        userId: req.user._id,
        action: 'CREATE',
        resource: 'Asset',
        resourceId: asset._id.toString(),
        ipAddress: req.ip
    });

    await cacheInvalidate(CacheKeys.ASSET_LIST);
    await cacheInvalidatePattern('analytics:*');
    res.status(201).json(asset);
});

// status transitions
const STATUS_TRANSITIONS = {
    available: ['assigned', 'maintenance', 'retired'],
    assigned: ['available', 'maintenance'],
    maintenance: ['available', 'retired'],
    retired: [],
};

export const updateAsset = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const asset = await Asset.findById(id);

    if (!asset) {
        res.status(404);
        throw new Error("Asset not found");
    }

    if (req.body.status && req.body.status !== asset.status) {
        const allowed = STATUS_TRANSITIONS[asset.status] || [];
        if (!allowed.includes(req.body.status)) {
            res.status(400);
            throw new Error(`Cannot transition from '${asset.status}' to '${req.body.status}'`);
        }
    }

    const before = { status: asset.status, location: asset.location, assignedTo: asset.assignedTo };

    // Identity is immutable and history is server-managed, so strip both before applying
    const updates = { ...req.body };
    delete updates._id;
    delete updates.history;
    Object.assign(asset, updates);

    asset.history.push({
        action: 'UPDATE',
        user: req.user?.name || 'System',
        details: req.body.status ? `Status changed to '${req.body.status}'` : 'Asset details updated'
    });

    const updatedAsset = await asset.save();
    await updatedAsset.populate({ path: 'assignedTo', select: 'name email' });

    await createAuditLog({
        userId: req.user._id,
        action: 'UPDATE',
        resource: 'Asset',
        resourceId: updatedAsset._id.toString(),
        ipAddress: req.ip,
        changes: {
            before,
            after: { status: updatedAsset.status, location: updatedAsset.location, assignedTo: updatedAsset.assignedTo }
        }
    });

    await cacheInvalidate(CacheKeys.ASSET_LIST);
    await cacheInvalidatePattern('analytics:*');
    res.json(updatedAsset);
});

export const deleteAsset = asyncHandler(async (req, res) => {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
        res.status(404);
        throw new Error("Asset not found");
    }

    if (asset.image) {
        const publicId = asset.image.split("/").pop().split(".")[0];
        try {
            await cloudinary.uploader.destroy(`assets/${publicId}`);
        } catch (error) {
            console.error("Error deleting image from cloudinary", error);
        }
    }

    await Asset.findByIdAndDelete(req.params.id);

    await createAuditLog({
        userId: req.user._id,
        action: 'DELETE',
        resource: 'Asset',
        resourceId: req.params.id,
        ipAddress: req.ip
    });

    await cacheInvalidate(CacheKeys.ASSET_LIST);
    await cacheInvalidatePattern('analytics:*');
    res.json({ message: "Asset deleted successfully" });
});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const searchAssets = asyncHandler(async (req, res) => {
    const { query } = req.query;
    if (!query) return res.json([]);

    const safe = escapeRegex(query);
    const assets = await Asset.find({
        $or: [
            { name: { $regex: safe, $options: "i" } },
            { description: { $regex: safe, $options: "i" } },
            { serialNumber: { $regex: safe, $options: "i" } },
            { assetTag: { $regex: safe, $options: "i" } }
        ]
    });
    res.json(assets);
});

export const getAssetsByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;
    const assets = await Asset.find({ category });
    res.json(assets);
});

export const getAssetByTag = asyncHandler(async (req, res) => {
    const { tag } = req.params;
    const asset = await Asset.findOne({ assetTag: tag });

    if (!asset) {
        res.status(404);
        throw new Error("Asset not found");
    }
    res.json(asset);
});

export const getFeaturedAssets = asyncHandler(async (req, res) => {
    const assets = await Asset.aggregate([
        { $match: { status: 'available' } },
        { $sample: { size: 4 } }
    ]);
    res.json(assets);
});

export const getRecommendedAssets = asyncHandler(async (req, res) => {
    const assets = await Asset.aggregate([{ $sample: { size: 3 } }]);
    res.json(assets);
});

export const toggleFeaturedAsset = asyncHandler(async (req, res) => {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
        res.status(404);
        throw new Error("Asset not found");
    }

    asset.isFeatured = !asset.isFeatured;
    await asset.save();

    await cacheInvalidate(CacheKeys.ASSET_LIST);

    res.json(asset);
});

export const bulkUpdateStatus = asyncHandler(async (req, res) => {
    const { assetIds, status } = req.body;
    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0 || !status) {
        res.status(400);
        throw new Error("Missing required fields");
    }

    const target = status.toLowerCase();
    const assets = await Asset.find({ _id: { $in: assetIds } });

    const updated = [];
    const skipped = [];

    for (const asset of assets) {
        if (asset.status === target) {
            updated.push(asset._id);
            continue;
        }

        const allowed = STATUS_TRANSITIONS[asset.status] || [];
        if (!allowed.includes(target)) {
            skipped.push({ id: asset._id, reason: `Cannot transition from '${asset.status}' to '${target}'` });
            continue;
        }

        asset.status = target;
        asset.history.push({
            action: 'UPDATE',
            user: req.user?.name || 'System',
            details: `Bulk status change to '${target}'`
        });
        await asset.save();
        updated.push(asset._id);
    }

    if (updated.length > 0) {
        await createAuditLog({
            userId: req.user._id,
            action: 'UPDATE',
            resource: 'Asset',
            ipAddress: req.ip,
            metadata: { bulk: true, status: target, updated: updated.length, skipped: skipped.length }
        });
        await cacheInvalidate(CacheKeys.ASSET_LIST);
        await cacheInvalidatePattern('analytics:*');
    }

    res.json({
        message: `Bulk update complete: ${updated.length} updated, ${skipped.length} skipped`,
        updated,
        skipped
    });
});

export const getAssetStats = asyncHandler(async (req, res) => {
    const stats = await Asset.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
                value: { $sum: "$purchasePrice" }
            }
        }
    ]);
    res.json(stats);
});

export const getAssignedAssets = asyncHandler(async (req, res) => {
    const assets = await Asset.find({ assignedTo: req.params.userId });
    res.json(assets);
});

export const exportAssets = asyncHandler(async (req, res) => {
    const assets = await Asset.find({}).lean();

    // CSV generation
    const fields = ['assetTag', 'name', 'category', 'status', 'serialNumber', 'purchasePrice'];
    const csv = [
        fields.join(','),
        ...assets.map(a => fields.map(f => `"${a[f] || ''}"`).join(','))
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('assets.csv');
    res.send(csv);
});