import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { createAuditLog } from "./audit.controller.js";

export const generate2FASecret = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user.twoFactorEnabled) {
            return res.status(400).json({
                message: "2FA is already enabled. Disable it first to regenerate."
            });
        }
        const secret = speakeasy.generateSecret({
            name: `ITAssetPortal:${user.email}`,
            issuer: "IT Asset Portal",
            length: 20,
        });
        user.twoFactorSecret = secret.base32;
        await user.save();
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        res.json({
            message: "Scan QR code with your authenticator app",
            qrCode: qrCodeUrl,
            manualKey: secret.base32,
        });

    } catch (error) {
        console.error("Generate 2FA error:", error);
        res.status(500).json({ message: "Failed to generate 2FA secret" });
    }
};

export const verify2FASetup = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.twoFactorSecret) {
            return res.status(400).json({
                message: "Please generate 2FA secret first"
            });
        }

        if (user.twoFactorEnabled) {
            return res.status(400).json({
                message: "2FA is already enabled"
            });
        }
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: "base32",
            token: token,
            window: 1,
        });

        if (!verified) {
            return res.status(400).json({
                message: "Invalid verification code. Please try again."
            });
        }
        const backupCodes = await generateBackupCodes();
        user.twoFactorBackupCodes = await Promise.all(
            backupCodes.map(async (code) => ({
                code: await bcrypt.hash(code, 10),
                used: false,
            }))
        );
        user.twoFactorEnabled = true;
        await user.save();
        await createAuditLog({
            userId: user._id,
            action: "2FA_ENABLED",
            resource: "User",
            resourceId: user._id,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
        });

        res.json({
            message: "2FA enabled successfully!",
            backupCodes: backupCodes,
            warning: "Save these backup codes in a secure place. They won't be shown again!",
        });

    } catch (error) {
        console.error("Verify 2FA error:", error);
        res.status(500).json({ message: "Failed to verify 2FA" });
    }
};

export const verify2FALogin = async (req, res) => {
    try {
        const { userId, token } = req.body;

        const user = await User.findById(userId);
        if (!user || !user.twoFactorEnabled) {
            return res.status(400).json({ message: "Invalid request" });
        }
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: "base32",
            token: token,
            window: 1,
        });

        if (verified) {
            return res.json({
                verified: true,
                message: "2FA verification successful"
            });
        }
        const backupCodeUsed = await verifyBackupCode(user, token);
        if (backupCodeUsed) {
            return res.json({
                verified: true,
                message: "Backup code used successfully",
                warning: "You have used a backup code. Consider generating new ones.",
            });
        }

        res.status(400).json({
            verified: false,
            message: "Invalid verification code"
        });

    } catch (error) {
        console.error("Verify 2FA login error:", error);
        res.status(500).json({ message: "Verification failed" });
    }
};

export const disable2FA = async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.twoFactorEnabled) {
            return res.status(400).json({ message: "2FA is not enabled" });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect password" });
        }
        user.twoFactorEnabled = false;
        user.twoFactorSecret = null;
        user.twoFactorBackupCodes = [];
        await user.save();
        await createAuditLog({
            userId: user._id,
            action: "2FA_DISABLED",
            resource: "User",
            resourceId: user._id,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
        });

        res.json({ message: "2FA disabled successfully" });

    } catch (error) {
        console.error("Disable 2FA error:", error);
        res.status(500).json({ message: "Failed to disable 2FA" });
    }
};

export const regenerateBackupCodes = async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.twoFactorEnabled) {
            return res.status(400).json({ message: "2FA is not enabled" });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect password" });
        }
        const backupCodes = await generateBackupCodes();

        user.twoFactorBackupCodes = await Promise.all(
            backupCodes.map(async (code) => ({
                code: await bcrypt.hash(code, 10),
                used: false,
            }))
        );
        await user.save();
        await createAuditLog({
            userId: user._id,
            action: "2FA_BACKUP_REGENERATED",
            resource: "User",
            resourceId: user._id,
            ipAddress: req.ip,
        });

        res.json({
            message: "New backup codes generated",
            backupCodes: backupCodes,
            warning: "Save these codes securely. Old codes are now invalid.",
        });

    } catch (error) {
        console.error("Regenerate backup codes error:", error);
        res.status(500).json({ message: "Failed to regenerate backup codes" });
    }
};

export const get2FAStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        const unusedBackupCodes = user.twoFactorBackupCodes?.filter(c => !c.used).length || 0;

        res.json({
            enabled: user.twoFactorEnabled,
            backupCodesRemaining: unusedBackupCodes,
        });

    } catch (error) {
        res.status(500).json({ message: "Failed to get 2FA status" });
    }
};
async function generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
        const code = crypto.randomBytes(4).toString("hex").toUpperCase();
        codes.push(code);
    }
    return codes;
}
async function verifyBackupCode(user, code) {
    for (const backup of user.twoFactorBackupCodes) {
        if (backup.used) continue;

        const isMatch = await bcrypt.compare(code.toUpperCase(), backup.code);
        if (isMatch) {
            backup.used = true;
            await user.save();
            return true;
        }
    }
    return false;
}