import { Router } from "express";
import { bootstrapUser, getCurrentUser, updateProfile, resetPassword, logoutUser } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";
import multer from "multer";
import path from "path";
import { env } from "../config/env";

const router = Router();

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, path.resolve(process.cwd(), env.uploadsDir));
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || ".jpg";
        cb(null, `profile-${Date.now()}${ext}`);
    }
});

const upload = multer({ storage });

router.post("/bootstrap", authMiddleware, bootstrapUser);
router.get("/me", authMiddleware, getCurrentUser);
router.post("/update", authMiddleware, upload.single("profileImage"), updateProfile);
router.post("/reset-password", resetPassword);
router.post("/logout", authMiddleware, logoutUser);

export default router;
