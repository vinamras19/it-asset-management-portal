import AuditLog from "../models/auditLog.model.js";
export const createAuditLog = async ({
    userId,
    action,
    resource = 'User',
    resourceId = null,
    changes = null,
    ipAddress = 'unknown',
    userAgent = null,
    status = 'SUCCESS',
    errorMessage = null,
    metadata = null
}) => {
    try {
        const log = new AuditLog({
            userId,
            action,
            resource,
            resourceId,
            changes,
            ipAddress,
            userAgent,
            status,
            errorMessage,
            metadata
        });
        await log.save();
        return log;
    } catch (error) {
        console.error('Error creating audit log:', error);
        return null;
    }
};

export const getMyAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(logs);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({
            message: "Failed to fetch audit logs",
            error: error.message
        });
    }
};

export const getSecurityMetrics = async (req, res) => {
    try {
        const User = (await import("../models/user.model.js")).default;
        const totalUsers = await User.countDocuments();
        const failedLogins24h = await AuditLog.countDocuments({
            action: 'LOGIN_FAILED',
            createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
        });
        const lockedAccounts = await User.countDocuments({
            accountLockedUntil: { $gt: new Date() }
        });
        const successfulLoginsToday = await AuditLog.countDocuments({
            action: 'LOGIN_SUCCESS',
            createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
        });
        const signupsToday = await AuditLog.countDocuments({
            action: 'SIGNUP',
            createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
        });
        const recentEvents = await AuditLog.find({
            action: { $in: ['LOGIN_FAILED', 'ACCOUNT_LOCKED', 'PASSWORD_CHANGE', 'EMAIL_CHANGE'] }
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('action userId ipAddress createdAt status');

        res.json({
            totalUsers,
            failedLogins24h,
            lockedAccounts,
            successfulLoginsToday,
            signupsToday,
            recentEvents
        });
    } catch (error) {
        console.error('Error fetching security metrics:', error);
        res.status(500).json({
            message: "Failed to fetch security metrics",
            error: error.message
        });
    }
};