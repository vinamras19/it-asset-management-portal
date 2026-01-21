import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { createLicense, getAllLicenses, deleteLicense } from "../controllers/license.controller.js";

const router = express.Router();

router.get("/", protectRoute, getAllLicenses);
router.post("/", protectRoute, adminRoute, createLicense);
router.delete("/:id", protectRoute, adminRoute, deleteLicense);

export default router;