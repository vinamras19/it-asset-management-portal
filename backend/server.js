import { apiLimiter } from "./config/security.js";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import morgan from "morgan";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.route.js";
import assetRoutes from "./routes/asset.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import requestRoutes from "./routes/request.route.js";
import auditRoutes from "./routes/audit.route.js";
import ticketRoutes from "./routes/ticket.route.js";
import licenseRoutes from "./routes/license.route.js";
import reportRoutes from "./routes/report.route.js";
import twoFactorRoutes from "./routes/twoFactor.route.js";

import { connectDB } from "./lib/db.js";
import { securityHeaders } from "./config/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(securityHeaders);
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/licenses", licenseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/2fa", twoFactorRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../frontend/dist", "index.html"));
    });
}

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`Error: ${err.message}`);

    if (err.status === 429) {
        return res.status(429).json({
            message: "Too many requests. Please try again later.",
            retryAfter: err.retryAfter,
        });
    }

    if (err.name === "ValidationError") {
        return res.status(400).json({
            message: "Validation failed",
            errors: Object.values(err.errors).map(e => e.message),
        });
    }

    if (["JsonWebTokenError", "TokenExpiredError"].includes(err.name)) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }

    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
    });
});

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    connectDB();
});