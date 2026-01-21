import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'"],
            frameSrc: ["'self'"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
});

const createLimitHandler = (message, retryAfterSeconds) => (req, res) => {
    res.status(429).json({
        success: false,
        message,
        retryAfter: retryAfterSeconds,
        tip: "Please wait before making more requests",
    });
};

export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createLimitHandler("Too many requests. Please slow down.", 900),
    skip: (req) => {
        return req.path === '/health' || req.path === '/api/health';
    },
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many authentication attempts.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: createLimitHandler("Too many login attempts. Please wait 15 minutes.", 900),
});

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts for this account.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: createLimitHandler("Account temporarily locked due to too many failed attempts. Try again in 15 minutes.", 900),
});

export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Too many password reset requests.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createLimitHandler("Too many password reset attempts. Please try again in 1 hour.", 3600),
});

export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many admin requests.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createLimitHandler("Admin rate limit exceeded. Please wait.", 900),
});

export const reportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Too many report requests.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createLimitHandler("Report generation limit reached. Max 10 reports per hour.", 3600),
});

export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: 'Too many file uploads.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createLimitHandler("Upload limit reached. Max 20 uploads per hour.", 3600),
});

export const ticketLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Too many tickets created.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createLimitHandler("Ticket creation limit reached. Max 10 tickets per hour.", 3600),
});

export const searchLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: 'Too many search requests.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createLimitHandler("Search rate limit exceeded.", 900),
});