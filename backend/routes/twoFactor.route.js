import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    generate2FASecret,
    verify2FASetup,
    verify2FALogin,
    disable2FA,
    regenerateBackupCodes,
    get2FAStatus,
} from "../controllers/twoFactor.controller.js";

const router = express.Router();
router.get("/status", protectRoute, get2FAStatus);
router.post("/generate", protectRoute, generate2FASecret);
router.post("/verify-setup", protectRoute, verify2FASetup);
router.post("/verify-login", verify2FALogin);
router.post("/disable", protectRoute, disable2FA);
router.post("/regenerate-backup", protectRoute, regenerateBackupCodes);

export default router;