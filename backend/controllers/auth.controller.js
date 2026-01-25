import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user.model.js";
import { redis } from "../lib/redis.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createAuditLog } from "./audit.controller.js";

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
};

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15m
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    });
};

export const signup = asyncHandler(async (req, res) => {
    const { email, password, name, department } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error("User already exists");
    }

    const user = await User.create({
        name,
        email,
        password,
        department: department || 'General'
    });

    const { accessToken, refreshToken } = generateTokens(user._id);
    await redis.set(`refresh_token:${user._id}`, refreshToken, "EX", 7 * 24 * 60 * 60);

    setCookies(res, accessToken, refreshToken);

    await createAuditLog({
        userId: user._id,
        action: 'SIGNUP',
        resource: 'User',
        ipAddress: req.ip
    });

    res.status(201).json({
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        message: "Account created successfully"
    });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && user.isLocked()) {
        res.status(403);
        throw new Error(`Account locked. Try again after ${user.accountLockedUntil.toLocaleTimeString()}`);
    }

    if (user && (await user.comparePassword(password))) {

        if (user.failedLoginAttempts > 0) {
            user.failedLoginAttempts = 0;
            user.accountLockedUntil = null;
            await user.save();
        }

        if (user.twoFactorEnabled) {
            return res.json({
                requiresTwoFactor: true,
                userId: user._id,
                message: "2FA verification required"
            });
        }

        const { accessToken, refreshToken } = generateTokens(user._id);
        await redis.set(`refresh_token:${user._id}`, refreshToken, "EX", 7 * 24 * 60 * 60);
        setCookies(res, accessToken, refreshToken);

        user.lastLoginAt = new Date();
        user.lastLoginIp = req.ip;
        await user.save();

        await createAuditLog({
            userId: user._id,
            action: 'LOGIN_SUCCESS',
            resource: 'Auth',
            ipAddress: req.ip
        });

        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });

    } else {
        if (user) {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 5) {
                user.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
                await createAuditLog({
                    userId: user._id,
                    action: 'ACCOUNT_LOCKED',
                    resource: 'Auth',
                    ipAddress: req.ip,
                    status: 'FAILURE'
                });
            }
            await user.save();
        }

        await createAuditLog({
            userId: user ? user._id : null,
            action: 'LOGIN_FAILED',
            resource: 'Auth',
            ipAddress: req.ip,
            status: 'FAILURE'
        });

        res.status(401);
        throw new Error("Invalid email or password");
    }
});

export const logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        const decoded = jwt.decode(refreshToken);
        if (decoded?.userId) {
            await redis.del(`refresh_token:${decoded.userId}`);
            await createAuditLog({
                userId: decoded.userId,
                action: 'LOGOUT',
                resource: 'Auth',
                ipAddress: req.ip
            });
        }
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
});

export const refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        res.status(401);
        throw new Error("No refresh token provided");
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if (storedToken !== refreshToken) {
        res.status(401);
        throw new Error("Invalid refresh token");
    }

    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
    });

    res.json({ message: "Token refreshed" });
});

export const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    res.json(user);
});

export const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
        user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
    });
});

export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (user && (await user.comparePassword(currentPassword))) {
        user.password = newPassword;
        await user.save();

        await createAuditLog({
            userId: user._id,
            action: 'PASSWORD_CHANGE',
            resource: 'User',
            ipAddress: req.ip
        });

        res.json({ message: "Password updated successfully" });
    } else {
        res.status(401);
        throw new Error("Invalid current password");
    }
});

export const deleteAccount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        await user.deleteOne();
        await redis.del(`refresh_token:${user._id}`);
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.json({ message: "Account deleted successfully" });
    } else {
        res.status(404);
        throw new Error("User not found");
    }
});

export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select("-password");
    res.json(users);
});

export const getUsersByRole = asyncHandler(async (req, res) => {
    const users = await User.find({ role: req.params.role }).select("-password");
    res.json(users);
});

export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.json({ message: "If email exists, reset link sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save();

    if (process.env.NODE_ENV === 'development') {
        res.json({ message: "Reset link sent", resetToken });
    } else {
        res.json({ message: "If email exists, reset link sent." });
    }
});

export const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error("Invalid or expired reset token");
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;
    await user.save();

    await createAuditLog({
        userId: user._id,
        action: 'PASSWORD_RESET_COMPLETED',
        resource: 'User',
        ipAddress: req.ip
    });

    res.json({ message: "Password reset successful" });
});