import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        action: {
            type: String,
            required: true,
            enum: [
                'LOGIN_SUCCESS',
                'LOGIN_FAILED',
                'LOGOUT',
                'SIGNUP',
                'PASSWORD_CHANGE',
                'EMAIL_CHANGE',
                'ACCOUNT_LOCKED',
                'ACCOUNT_UNLOCKED',
                'MFA_ENABLED',
                'MFA_DISABLED',
                'MFA_VERIFIED',
                'MFA_FAILED',
                'CREATE',
                'READ',
                'UPDATE',
                'DELETE',
                'SUSPICIOUS_ACTIVITY',
                'RATE_LIMIT_EXCEEDED',
                'PERMISSION_DENIED',
            ],
        },

        resource: {
            type: String,
            required: true,
        },

        resourceId: {
            type: String,
        },

        changes: {
            before: mongoose.Schema.Types.Mixed,
            after: mongoose.Schema.Types.Mixed,
        },

        ipAddress: {
            type: String,
            required: true,
        },
        userAgent: {
            type: String,
        },

        status: {
            type: String,
            enum: ['SUCCESS', 'FAILURE', 'PENDING'],
            default: 'SUCCESS',
        },

        errorMessage: {
            type: String,
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,

        collection: 'auditlogs',
    }
);
auditLogSchema.pre([
    'updateOne',
    'updateMany',
    'findOneAndUpdate',
], function() {
    throw new Error('403: Audit logs cannot be modified to preserve system integrity.');
});
auditLogSchema.pre([
    'remove',
    'deleteOne',
    'deleteMany',
    'findOneAndDelete',
    'findOneAndRemove',
], function(next) {
    if (this._conditions && Object.keys(this._conditions).length > 0) {
        const error = new Error('403: Audit logs cannot be deleted to preserve system integrity.');
        error.name = 'ImmutableError';
        return next(error);
    }
    next();
});

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });
auditLogSchema.index({ ipAddress: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;