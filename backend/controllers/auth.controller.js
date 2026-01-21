import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";
import { createAuditLog } from "./audit.controller.js";
import speakeasy from "speakeasy";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
    });

    return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
};

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

export const signup = async (req, res) => {
    const { email, password, name, department } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({
            name,
            email,
            password,
            department: department || "General"
        });

        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);

        setCookies(res, accessToken, refreshToken);
        try {
            await createAuditLog({
                userId: user._id,
                action: 'SIGNUP',
                resource: 'User',
                resourceId: user._id.toString(),
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent'],
                status: 'SUCCESS'
            });
        } catch (e) {  }

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department
        });
    } catch (error) {
                res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password, twoFactorToken } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
            const remainingTime = Math.ceil((user.accountLockedUntil - new Date()) / 60000);
            return res.status(423).json({
                message: `Account locked. Try again in ${remainingTime} minutes.`
            });
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            if (user.failedLoginAttempts >= 5) {
                user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
                await user.save();

                try {
                    await createAuditLog({
                        userId: user._id,
                        action: 'ACCOUNT_LOCKED',
                        resource: 'User',
                        resourceId: user._id.toString(),
                        ipAddress: req.ip,
                        userAgent: req.headers['user-agent'],
                        status: 'SUCCESS',
                        metadata: { reason: 'Too many failed login attempts' }
                    });
                } catch (error) {
                    console.error("Audit Log Error:", error.message);
                }

                return res.status(423).json({
                    message: "Account locked due to too many failed attempts. Try again in 30 minutes."
                });
            }

            await user.save();

            try {
                await createAuditLog({
                    userId: user._id,
                    action: 'LOGIN_FAILED',
                    resource: 'User',
                    resourceId: user._id.toString(),
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                    status: 'FAILURE'
                });
            } catch (error) {
                console.error("Audit Log Error:", error.message);
            }

            return res.status(400).json({ message: "Invalid email or password" });
        }
        if (user.twoFactorEnabled) {
            if (!twoFactorToken) {
                return res.status(200).json({
                    requires2FA: true,
                    userId: user._id,
                    message: "Please enter your 2FA code"
                });
            }
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: "base32",
                token: twoFactorToken,
                window: 1,
            });

            if (!verified) {
                let backupUsed = false;
                for (const backup of user.twoFactorBackupCodes || []) {
                    if (backup.used) continue;
                    const isMatch = await bcrypt.default.compare(twoFactorToken.toUpperCase(), backup.code);
                    if (isMatch) {
                        backup.used = true;
                        backupUsed = true;
                        await user.save();
                        break;
                    }
                }

                if (!backupUsed) {
                    return res.status(400).json({ message: "Invalid 2FA code" });
                }
            }
        }
        user.lastLoginAt = new Date();
        user.lastLoginIp = req.ip || req.connection.remoteAddress;
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = null;
        await user.save();

        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);

        try {
            await createAuditLog({
                userId: user._id,
                action: 'LOGIN_SUCCESS',
                resource: 'User',
                resourceId: user._id.toString(),
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                status: 'SUCCESS',
                metadata: { twoFactorUsed: user.twoFactorEnabled }
            });
        } catch (error) {
            console.error("Audit Log Error:", error.message);
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            phone: user.phone,
            twoFactorEnabled: user.twoFactorEnabled
        });
    } catch (error) {
                res.status(500).json({ message: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refresh_token:${decoded.userId}`);

            try {
                await createAuditLog({
                    userId: decoded.userId,
                    action: 'LOGOUT',
                    resource: 'User',
                    resourceId: decoded.userId,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                    status: 'SUCCESS'
                });
            } catch (error) {
                console.error("Audit Log Error:", error.message);
            }
        }

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.json({ message: "Logged out successfully" });
    } catch (error) {
                res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token provided" });
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

        if (storedToken !== refreshToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
        });

        res.json({ message: "Token refreshed successfully" });
    } catch (error) {
                res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const updateProfile = async (req, res) => {
    try {
        const { email, phone, name } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
            if (emailExists) {
                return res.status(400).json({ message: "Email already in use" });
            }
            user.email = email;

            try {
                await createAuditLog({
                    userId: user._id,
                    action: 'EMAIL_CHANGE',
                    resource: 'User',
                    resourceId: user._id.toString(),
                    changes: { before: { email: req.user.email }, after: { email } },
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                    status: 'SUCCESS'
                });
            } catch (error) {
                console.error("Audit Log Error:", error.message);
            }
        }

        if (phone !== undefined) user.phone = phone;
        if (name) user.name = name;

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            phone: user.phone
        });
    } catch (error) {
                res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            try {
                await createAuditLog({
                    userId: user._id,
                    action: 'PASSWORD_CHANGE',
                    resource: 'User',
                    resourceId: user._id.toString(),
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                    status: 'FAILURE',
                    errorMessage: 'Invalid current password'
                });
            } catch (error) {
                console.error("Audit Log Error:", error.message);
            }

            return res.status(400).json({ message: "Current password is incorrect" });
        }
        user.password = newPassword;
        await user.save();

        try {
            await createAuditLog({
                userId: user._id,
                action: 'PASSWORD_CHANGE',
                resource: 'User',
                resourceId: user._id.toString(),
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                status: 'SUCCESS'
            });
        } catch (error) {
            console.error("Audit Log Error:", error.message);
        }

        res.json({ message: "Password changed successfully" });
    } catch (error) {
                res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const deleteAccount = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userId = req.user._id;

        await User.findByIdAndDelete(userId);

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        await redis.del(`refresh_token:${userId}`);

        res.json({ message: "Account deleted successfully" });
    } catch (error) {
                res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select('name email department role')
            .sort({ name: 1 });

        res.json(users);
    } catch (error) {
                res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;
        const query = role && role !== 'all' ? { role } : {};

        const users = await User.find(query)
            .select('name email department role')
            .sort({ name: 1 });

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.json({
                message: "If an account exists with this email, you will receive a password reset link."
            });
        }
        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        await createAuditLog({
            userId: user._id,
            action: 'PASSWORD_RESET_REQUESTED',
            resource: 'User',
            resourceId: user._id.toString(),
            ipAddress: req.ip,
            status: 'SUCCESS'
        });

        res.json({
            message: "If an account exists with this email, you will receive a password reset link.",
            ...(process.env.NODE_ENV === 'development' && { resetToken })
        });

    } catch (error) {
                res.status(500).json({ message: "Server error" });
    }
};
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired reset token"
            });
        }
        user.password = password;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = null;
        await user.save();

        await createAuditLog({
            userId: user._id,
            action: 'PASSWORD_RESET_COMPLETED',
            resource: 'User',
            resourceId: user._id.toString(),
            ipAddress: req.ip,
            status: 'SUCCESS'
        });

        res.json({ message: "Password reset successful. You can now login." });

    } catch (error) {
                res.status(500).json({ message: "Server error" });
    }
};