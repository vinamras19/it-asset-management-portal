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
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
    validateSignup,
    validateLogin,
    validateUpdateEmail,
    validateUpdatePassword
} from "../middleware/validation.js";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// Public Routes
router.post("/signup", authLimiter, validateSignup, signup);
router.post("/login", authLimiter, validateLogin, login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password/:token", passwordResetLimiter, resetPassword);

// Protected Routes
router.get("/profile", protectRoute, getProfile);
router.put("/profile", protectRoute, validateUpdateEmail, updateProfile);
router.put("/change-password", protectRoute, validateUpdatePassword, changePassword);
router.delete("/delete-account", protectRoute, deleteAccount);

// Admin Routes
router.get("/users", protectRoute, adminRoute, getAllUsers);
router.get("/users/role/:role", protectRoute, adminRoute, getUsersByRole);

export default router;