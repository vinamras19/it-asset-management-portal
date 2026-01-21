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

export const validateProduct = [
    body('name').trim().notEmpty().isLength({ min: 2, max: 100 }),
    body('description').trim().notEmpty().isLength({ min: 10 }),
    body('price').notEmpty().isFloat({ min: 0.01 }),
    body('category').trim().notEmpty(),
    handleValidationErrors
];

export const validateProductId = [
    param('id').notEmpty().isMongoId(),
    handleValidationErrors
];

export const validateAddToCart = [
    body('productId').notEmpty().isMongoId(),
    handleValidationErrors
];

export const validateUpdateQuantity = [
    param('id').notEmpty().isMongoId(),
    body('quantity').notEmpty().isInt({ min: 1, max: 100 }),
    handleValidationErrors
];

export const validateCreateOrder = [
    body('assets').isArray({ min: 1 }),
    handleValidationErrors
];

export const validateUpdateEmail = [
    body('email').trim().notEmpty().isEmail().normalizeEmail(),
    handleValidationErrors
];

export const validateUpdatePassword = [
    body('oldPassword').notEmpty(),
    body('newPassword').notEmpty().isLength({ min: 6 }),
    handleValidationErrors
];