import { Router } from "express";
import multer from "multer";
import path from "path";
import {
  createIncidentFromML,
  getNearbyIncidents,
  acceptIncident,
  declineIncident,
  completeIncident,
  getMyIncidents
} from "../controllers/incidentsController";
import { authMiddleware } from "../middleware/authMiddleware";
import { env } from "../config/env";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(process.cwd(), env.uploadsDir));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `incident-after-${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

router.post("/ml", createIncidentFromML);
router.get("/nearby", authMiddleware, getNearbyIncidents);
router.post("/:id/accept", authMiddleware, acceptIncident);
router.post("/:id/decline", authMiddleware, declineIncident);
router.post("/:id/complete", authMiddleware, upload.single("imageAfter"), completeIncident);
router.get("/my", authMiddleware, getMyIncidents);

export default router;


