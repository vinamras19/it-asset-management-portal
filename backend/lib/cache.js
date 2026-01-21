import { redis } from "./redis.js";

const DEFAULT_TTL = 300;


export const cacheGet = async (key, callback, ttl = DEFAULT_TTL) => {
    try {
        const cached = await redis.get(key);

        if (cached) {
            return JSON.parse(cached);
        }

        (`Cache MISS: ${key} - fetching fresh data...`);
        const freshData = await callback();
        await redis.setex(key, ttl, JSON.stringify(freshData));

        return freshData;
    } catch (error) {
        console.error(`Cache error for ${key}:`, error.message);
        return await callback();
    }
};


export const cacheInvalidate = async (key) => {
    try {
        await redis.del(key);
        (`🗑️ Cache invalidated: ${key}`);
    } catch (error) {
        console.error(`Cache invalidate error for ${key}:`, error.message);
    }
};


export const cacheInvalidatePattern = async (pattern) => {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
            (`🗑️ Cache invalidated ${keys.length} keys matching: ${pattern}`);
        }
    } catch (error) {
        console.error(`Cache pattern invalidate error for ${pattern}:`, error.message);
    }
};


export const cacheSet = async (key, data, ttl = DEFAULT_TTL) => {
    try {
        await redis.setex(key, ttl, JSON.stringify(data));
        (`Cache SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
        console.error(`Cache set error for ${key}:`, error.message);
    }
};


export const cacheExists = async (key) => {
    try {
        return await redis.exists(key);
    } catch (error) {
        return false;
    }
};


export const cacheTTL = async (key) => {
    try {
        return await redis.ttl(key);
    } catch (error) {
        return -2;
    }
};

export const CacheKeys = {
    ANALYTICS_DASHBOARD: "analytics:dashboard",
    ANALYTICS_ASSET_STATS: "analytics:asset-stats",
    ANALYTICS_CATEGORY: (cat) => `analytics:category:${cat}`,
    ASSET_LIST: "assets:list",
    ASSET_FEATURED: "assets:featured",
    ASSET_DETAIL: (id) => `assets:detail:${id}`,
    ASSET_BY_CATEGORY: (cat) => `assets:category:${cat}`,
    TICKET_STATS: "tickets:stats",
    TICKET_LIST: "tickets:list",
    USER_LIST: "users:list",
    USER_BY_ROLE: (role) => `users:role:${role}`,
};

export default {
    cacheGet,
    cacheSet,
    cacheInvalidate,
    cacheInvalidatePattern,
    cacheExists,
    cacheTTL,
    CacheKeys,
};