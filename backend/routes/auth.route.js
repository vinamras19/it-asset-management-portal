import express from "express";

import {
    signup,
    login,
    logout,
    refreshToken,
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    getAllUsers,
    getUsersByRole,
    forgotPassword,
    resetPassword
} from "../controllers/auth.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";
import { checkPermission } from "../middleware/permission.middleware.js";
import { authLimiter } from "../config/security.js";

import {
    validateSignup,
    validateLogin,
    validateUpdateEmail,
    validateUpdatePassword
} from "../middleware/validation.js";

const router = express.Router();

// Public Routes
router.post("/signup", validateSignup, signup);
router.post("/login", authLimiter, validateLogin, login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected Routes
router.get("/profile", protectRoute, getProfile);
router.put("/profile", protectRoute, validateUpdateEmail, updateProfile);
router.put("/change-password", protectRoute, validateUpdatePassword, changePassword);
router.delete("/delete-account", protectRoute, deleteAccount);

// User directory (auditors and admins hold users:read)
router.get("/users", protectRoute, checkPermission('users', 'read'), getAllUsers);
router.get("/users/role/:role", protectRoute, checkPermission('users', 'read'), getUsersByRole);

export default router;