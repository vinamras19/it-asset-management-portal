import Asset from "../models/asset.model.js";
import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const getAllAssets = asyncHandler(async (req, res) => {
    const cachedAssets = await redis.get("assets:list");
    if (cachedAssets) {
        return res.json(JSON.parse(cachedAssets));
    }

    const assets = await Asset.find({}).populate('assignedTo', 'name email department');
    await redis.set("assets:list", JSON.stringify(assets), "EX", 300);
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
    const { name, model, description, purchasePrice, image, category, serialNumber, status, purchaseDate, location } = req.body;

    let cloudinaryResponse = null;
    if (image) {
        cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "assets" });
    }

    const asset = await Asset.create({
        name,
        model,
        description,
        purchasePrice: purchasePrice || 0,
        category,
        serialNumber,
        status: status || 'available',
        purchaseDate,
        location: location || 'Warehouse',
        image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
    });

    await redis.del("assets:list");
    res.status(201).json(asset);
});

export const updateAsset = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedAsset = await Asset.findByIdAndUpdate(id, req.body, { new: true }).populate('assignedTo', 'name email');

    if (!updatedAsset) {
        res.status(404);
        throw new Error("Asset not found");
    }

    await redis.del("assets:list");
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
            console.log("Error deleting image from cloudinary", error);
        }
    }

    await Asset.findByIdAndDelete(req.params.id);
    await redis.del("assets:list");
    res.json({ message: "Asset deleted successfully" });
});

export const searchAssets = asyncHandler(async (req, res) => {
    const { query } = req.query;
    if (!query) return res.json([]);

    const assets = await Asset.find({
        $or: [
            { name: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
            { serialNumber: { $regex: query, $options: "i" } },
            { assetTag: { $regex: query, $options: "i" } }
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

    await redis.del("assets:list");

    res.json(asset);
});

export const bulkUpdateStatus = asyncHandler(async (req, res) => {
    const { assetIds, status } = req.body;
    if (!assetIds || !status) {
        res.status(400);
        throw new Error("Missing required fields");
    }

    await Asset.updateMany(
        { _id: { $in: assetIds } },
        { $set: { status: status.toLowerCase() } }
    );

    await redis.del("assets:list");
    res.json({ message: "Bulk update successful" });
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