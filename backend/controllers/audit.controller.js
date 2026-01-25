import AuditLog from "../models/auditLog.model.js";
import User from "../models/user.model.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const createAuditLog = async (logData) => {
    try {
        await AuditLog.create(logData);
    } catch (error) {

        console.error("[Audit Failure] Could not write log:", error.message);
    }
};

export const getMyAuditLogs = asyncHandler(async (req, res) => {
    const logs = await AuditLog.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);

    res.json(logs);
});

export const getSecurityMetrics = asyncHandler(async (req, res) => {
    // Parallel execution for performance
    const [
        totalUsers,
        failedLogins24h,
        lockedAccounts,
        successfulLoginsToday,
        signupsToday,
        recentEvents
    ] = await Promise.all([
        User.countDocuments(),
        AuditLog.countDocuments({
            action: 'LOGIN_FAILED',
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }),
        User.countDocuments({
            accountLockedUntil: { $gt: new Date() }
        }),
        AuditLog.countDocuments({
            action: 'LOGIN_SUCCESS',
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }),
        AuditLog.countDocuments({
            action: 'SIGNUP',
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }),
        AuditLog.find({
            action: { $in: ['LOGIN_FAILED', 'ACCOUNT_LOCKED', 'PASSWORD_CHANGE', 'EMAIL_CHANGE', 'SUSPICIOUS_ACTIVITY'] }
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .select('action userId ipAddress createdAt status')
    ]);

    res.json({
        totalUsers,
        failedLogins24h,
        lockedAccounts,
        successfulLoginsToday,
        signupsToday,
        recentEvents
    });
});