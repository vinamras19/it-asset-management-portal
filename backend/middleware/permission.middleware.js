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

export const checkOwnership = (getResourceUserId) => {
    return async (req, res, next) => {
        try {
            if (req.user.role === 'admin') {
                return next();
            }
            const resourceUserId = await getResourceUserId(req);

            if (!resourceUserId) {
                return res.status(404).json({ message: 'Resource not found' });
            }
            if (resourceUserId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    message: 'Access denied: You can only access your own resources'
                });
            }

            next();
        } catch (error) {
            console.error('Ownership check error:', error.message);
            res.status(500).json({ message: 'Server error' });
        }
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