import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, message: "Too many requests, please try again later." }
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { status: 429, message: "Too many login attempts. Please try again later." }
});

export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { status: 429, message: "Too many password reset requests." }
});

export const ticketLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 100,
    message: { status: 429, message: "Ticket creation limit reached." }
});

export const reportLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: { status: 429, message: "Report generation limit reached." }
});