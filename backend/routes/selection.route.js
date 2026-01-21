import express from "express";
import {
    addToSelection,
    getSelection,
    removeAllFromSelection,
    updateQuantity
} from "../controllers/selection.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validateAddToCart, validateUpdateQuantity } from "../middleware/validation.js";

const router = express.Router();

router.get("/", protectRoute, getSelection);
router.post("/", protectRoute, validateAddToCart, addToSelection);
router.delete("/", protectRoute, removeAllFromSelection);
router.put("/:id", protectRoute, validateUpdateQuantity, updateQuantity);

export default router;