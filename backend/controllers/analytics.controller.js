import Asset from "../models/asset.model.js";
import { redis } from "../lib/redis.js";

export const getAnalyticsData = async (req, res) => {
    try {
        const totalAssets = await Asset.countDocuments();
        const availableAssets = await Asset.countDocuments({ status: "available" });
        const assignedAssets = await Asset.countDocuments({ status: "assigned" });

        const analyticsData = {
            totalAssets,
            availableAssets,
            assignedAssets,
            utilizationRate: totalAssets > 0 ? ((assignedAssets / totalAssets) * 100).toFixed(2) : 0,
        };

        res.json(analyticsData);
    } catch (error) {
        console.error("Error fetching analytics data:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAssetStatsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const cacheKey = `analytics:category:${category}`;
        const cachedData = await redis.get(cacheKey);

        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        // Database aggregation
        const stats = await Asset.aggregate([
            { $match: { category: category } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        await redis.set(cacheKey, JSON.stringify(stats), "EX", 3600);

        res.json(stats);
    } catch (error) {
        console.error("Error fetching category stats:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getCacheStatus = async (req, res) => {
    try {
        const keys = await redis.keys("*");
        const memory = await redis.info("memory");

        res.json({
            totalKeys: keys.length,
            memoryUsage: memory.split("\r\n").find(line => line.startsWith("used_memory_human")) || "Unknown"
        });
    } catch (error) {
        console.error("Error fetching cache status:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const invalidateAnalyticsCache = async () => {
    try {
        const keys = await redis.keys("analytics:*");
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`[Cache] Invalidated ${keys.length} analytics keys`);
        }
    } catch (error) {
        console.error("Cache invalidation error:", error.message);
    }
};