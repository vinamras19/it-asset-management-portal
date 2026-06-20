import { hasPermission } from '../config/permissions.js';

export const checkPermission = (resource, action) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userRole = req.user.role;
        if (!hasPermission(userRole, resource, action)) {
            return res.status(403).json({
                message: 'Access denied: Insufficient permissions',
            });
        }

        next();
    };
};

export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        next();
    };
};