/**
 * TODO: Migrate to centralized cache utilities
 *
 * Currently using redis.get/set directly in controllers.
 * This module provides consistent TTL, key naming, and error handling.
 * Will refactor asset/analytics caching to use these helpers.
 */

import { redis } from "./redis.js";

const DEFAULT_TTL = 300;

export const CacheKeys = {
    ANALYTICS_DASHBOARD: "analytics:dashboard",
    ANALYTICS_ASSET_STATS: "analytics:asset-stats",
    ANALYTICS_CATEGORY: (cat) => `analytics:category:${cat}`,
    ASSET_LIST: "assets:list",
    ASSET_FEATURED: "assets:featured",
    ASSET_DETAIL: (id) => `assets:detail:${id}`,
};

export const cacheGet = async (key, fetchFunction, ttl = DEFAULT_TTL) => {
    try {
        const cached = await redis.get(key);
        if (cached) return JSON.parse(cached);


        if (process.env.NODE_ENV === 'development') {
            console.log(`[Cache] MISS: ${key}`);
        }

        const freshData = await fetchFunction();

        if (freshData) {
            await redis.setex(key, ttl, JSON.stringify(freshData));
        }
        return freshData;
    } catch (error) {
        console.error(`[Cache] Error ${key}:`, error.message);
        return await fetchFunction();
    }
};

export const cacheSet = async (key, data, ttl = DEFAULT_TTL) => {
    try {
        await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
        console.error(`[Cache] Set Error ${key}:`, error.message);
    }
};

export const cacheInvalidate = async (key) => {
    try {
        await redis.del(key);
    } catch (error) {
        console.error(`[Cache] Invalidate Error ${key}:`, error.message);
    }
};

export const cacheInvalidatePattern = async (pattern) => {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`[Cache] Cleared ${keys.length} keys for: ${pattern}`);
        }
    } catch (error) {
        console.error(`[Cache] Pattern Error ${pattern}:`, error.message);
    }
};