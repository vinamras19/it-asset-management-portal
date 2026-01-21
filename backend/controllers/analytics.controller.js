import Product from "../models/asset.model.js";
import User from "../models/user.model.js";
import { cacheGet, cacheInvalidatePattern, CacheKeys } from "../lib/cache.js";

const ANALYTICS_CACHE_TTL = 300; // 5-min TTL to balance dashboard freshness with Redis costs

export const getAnalyticsData = async (req, res) => {
    try {
        const analyticsData = await cacheGet(
            CacheKeys.ANALYTICS_DASHBOARD,
            async () => {
                                const startTime = Date.now();
                const [
                    assets,
                    totalUsers,
                    statusCounts,
                    categoryCounts,
                    departmentSpend,
                    recentAssets
                ] = await Promise.all([
                    Product.find().lean(),
                    User.countDocuments(),
                    Product.aggregate([
                        { $group: { _id: "$status", count: { $sum: 1 } } }
                    ]),
                    Product.aggregate([
                        { $group: { _id: "$category", count: { $sum: 1 } } }
                    ]),
                    Product.aggregate([
                        { $match: { assignedTo: { $ne: null } } },
                        {
                            $lookup: {
                                from: "users",
                                localField: "assignedTo",
                                foreignField: "_id",
                                as: "assignee"
                            }
                        },
                        { $unwind: "$assignee" },
                        {
                            $group: {
                                _id: "$assignee.department",
                                totalValue: { $sum: "$price" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { totalValue: -1 } }
                    ]),
                    Product.countDocuments({
                        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                    })
                ]);
                const totalAssets = assets.length;
                const totalValue = assets.reduce((sum, item) => sum + (item.price || 0), 0);
                const maintenanceCount = assets.filter(p => p.status === "Maintenance").length;
                const availableCount = assets.filter(p => p.status === "Available").length;
                const assignedCount = assets.filter(p => p.status === "Assigned").length;
                const assetsWithDate = assets.filter(a => a.purchaseDate);
                const avgAge = assetsWithDate.length > 0
                    ? assetsWithDate.reduce((sum, a) => {
                        const ageInYears = (Date.now() - new Date(a.purchaseDate)) / (365 * 24 * 60 * 60 * 1000);
                        return sum + ageInYears;
                    }, 0) / assetsWithDate.length
                    : 0;

                const queryTime = Date.now() - startTime;

                return {
                    analyticsData: {
                        users: totalUsers,
                        assets: totalAssets,
                        totalValue,
                        maintenanceCount,
                        availableCount,
                        assignedCount,
                        recentAssets,
                        avgAssetAge: Math.round(avgAge * 10) / 10,
                    },
                    statusData: statusCounts.map(item => ({
                        name: item._id || "Unknown",
                        value: item.count
                    })),
                    categoryData: categoryCounts.map(item => ({
                        name: item._id || "Unknown",
                        value: item.count
                    })),
                    departmentData: departmentSpend.map(item => ({
                        name: item._id || "Unassigned",
                        value: item.totalValue,
                        count: item.count
                    })),
                    _meta: {
                        cachedAt: new Date().toISOString(),
                        queryTimeMs: queryTime
                    }
                };
            },
            ANALYTICS_CACHE_TTL
        );

        res.json(analyticsData);

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAssetStatsByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        const stats = await cacheGet(
            CacheKeys.ANALYTICS_CATEGORY(category),
            async () => {
                const assets = await Product.find({ category }).lean();

                return {
                    category,
                    total: assets.length,
                    available: assets.filter(a => a.status === "Available").length,
                    assigned: assets.filter(a => a.status === "Assigned").length,
                    maintenance: assets.filter(a => a.status === "Maintenance").length,
                    totalValue: assets.reduce((sum, a) => sum + (a.price || 0), 0),
                    avgValue: assets.length > 0
                        ? assets.reduce((sum, a) => sum + (a.price || 0), 0) / assets.length
                        : 0
                };
            },
            ANALYTICS_CACHE_TTL
        );

        res.json(stats);

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const invalidateAnalyticsCache = async () => {
    try {
        await cacheInvalidatePattern("analytics:*");
        await cacheInvalidatePattern("assets:*");
            } catch (error) {
        console.error("Failed to invalidate analytics cache:", error.message);
    }
};

export const getCacheStatus = async (req, res) => {
    try {
        const { redis } = await import("../lib/redis.js");
        const analyticsKeys = await redis.keys("analytics:*");
        const assetKeys = await redis.keys("assets:*");
        const routeKeys = await redis.keys("route:*");
        const dashboardTTL = await redis.ttl(CacheKeys.ANALYTICS_DASHBOARD);

        res.json({
            status: "ok",
            caches: {
                analytics: analyticsKeys.length,
                assets: assetKeys.length,
                routes: routeKeys.length,
            },
            dashboardCache: {
                exists: dashboardTTL > 0,
                ttlSeconds: dashboardTTL,
            },
            keys: {
                analytics: analyticsKeys,
                assets: assetKeys.slice(0, 10),
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Failed to get cache status", error: error.message });
    }
};