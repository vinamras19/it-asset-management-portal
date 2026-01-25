import { body, param, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

export const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = obj[key].trim();
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        }
    };

    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);

    next();
};

export const validateSignup = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }),
    body('email').trim().notEmpty().isEmail().normalizeEmail(),
    body('password').notEmpty().isLength({ min: 6 }),
    handleValidationErrors
];

export const validateLogin = [
    body('email').trim().notEmpty().isEmail().normalizeEmail(),
    body('password').notEmpty(),
    handleValidationErrors
];

export const validateUpdateEmail = [
    body('email').trim().notEmpty().isEmail().normalizeEmail(),
    handleValidationErrors
];

export const validateUpdatePassword = [
    body('currentPassword').notEmpty(),
    body('newPassword').notEmpty().isLength({ min: 6 }),
    handleValidationErrors
];

export const validateAsset = [
    body('name').trim().notEmpty().withMessage('Asset name is required'),
    body('serialNumber').trim().notEmpty().withMessage('Serial Number is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('purchasePrice').notEmpty().isFloat({ min: 0 }).withMessage('Valid purchase price is required'),
    body('purchaseDate').optional().isISO8601(),
    handleValidationErrors
];

export const validateAssetId = [
    param('id').notEmpty().isMongoId().withMessage('Invalid Asset ID'),
    handleValidationErrors
];

export const validateCreateRequest = [
    body('assets').isArray({ min: 1 }).withMessage('At least one asset is required'),
    body('assets.*.quantity').optional().isInt({ min: 1 }),
    body('justification').optional().trim().isLength({ max: 500 }),
    handleValidationErrors
];

export const validateTicket = [
    body('title').trim().notEmpty().isLength({ min: 5 }).withMessage('Title must be at least 5 chars'),
    body('description').trim().notEmpty().isLength({ min: 10 }).withMessage('Description must be at least 10 chars'),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('category').optional().isIn(['Hardware Issue', 'Software Issue', 'Damage Report', 'Request Return', 'Upgrade Request', 'General Inquiry', 'Other']),
    handleValidationErrors
];