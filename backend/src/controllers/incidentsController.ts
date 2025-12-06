import { Request, Response } from "express";
import { Types } from "mongoose";
import { GarbageIncident } from "../models/GarbageIncident";
import { RewardTransaction } from "../models/RewardTransaction";
import { User } from "../models/User";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { saveBase64Image, saveLocalFile } from "../services/storageService";
import { convertIncidentUrls } from "../utils/urlUtils";
import fs from "fs";
import path from "path";
import { env } from "../config/env";

// Helper to check if a local upload file exists (only for local storage)
const imageExists = (url?: string): boolean => {
  if (!url || env.storageProvider !== "local") return true; // assume remote exists
  // url is like /uploads/filename.jpg
  const relative = url.replace(/^\/+/, "");
  const filePath = path.resolve(process.cwd(), relative);
  return fs.existsSync(filePath);
};

// ML endpoint: POST /api/incidents/ml
export const createIncidentFromML = async (req: Request, res: Response) => {
  try {
    const { image, lat, lng, locationText } = req.body;
    if (!image) {
      return res.status(400).json({ message: "image is required (base64 or URL)" });
    }

    let imageBeforeUrl: string;
    if (image.startsWith("http")) {
      imageBeforeUrl = image;
    } else {
      const stored = await saveBase64Image(image, "incident-before");
      imageBeforeUrl = stored.url;
    }

    const incidentData: any = {
      imageBeforeUrl,
      status: "PENDING",
      addressText: locationText
    };

    const latNum = lat != null ? Number(lat) : null;
    const lngNum = lng != null ? Number(lng) : null;
    const hasCoords = latNum != null && lngNum != null && !Number.isNaN(latNum) && !Number.isNaN(lngNum);

    if (hasCoords) {
      incidentData.location = {
        type: "Point",
        coordinates: [lngNum as number, latNum as number]
      };
    } else if (env.defaultLat != null && env.defaultLng != null) {
      // Fallback to default coordinates so the incident is visible in Nearby
      incidentData.location = {
        type: "Point",
        coordinates: [env.defaultLng, env.defaultLat]
      };
    }

    const incident = await GarbageIncident.create(incidentData);

    // Notify connected clients about new incident
    const io = (req.app as any).locals?.io;
    if (io) {
      io.emit("incident:new", convertIncidentUrls(incident.toObject(), req));
    }

    return res.status(201).json(convertIncidentUrls(incident.toObject(), req));
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Failed to create incident" });
  }
};

// GET /api/incidents/nearby
export const getNearbyIncidents = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radiusKm = "40" } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    const radiusMeters = Number(radiusKm) * 1000;

    const incidents = await GarbageIncident.find({
      status: "PENDING",
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: radiusMeters
        }
      }
    })
      .limit(50) // Increased limit to show more incidents
      .lean();

    // Drop incidents whose images no longer exist (e.g., deleted from uploads)
    const filtered = incidents.filter((incident) => imageExists(incident.imageBeforeUrl));

    // Convert all relative URLs to absolute URLs
    const incidentsWithAbsoluteUrls = filtered.map((incident) =>
      convertIncidentUrls(incident, req)
    );

    return res.json(incidentsWithAbsoluteUrls);
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to fetch nearby incidents" });
  }
};

// POST /api/incidents/:id/accept
export const acceptIncident = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { id } = req.params;
    const userId = new Types.ObjectId(req.user._id);

    const incident = await GarbageIncident.findOneAndUpdate(
      { _id: id, status: "PENDING" },
      { status: "CLAIMED", claimedBy: userId },
      { new: true }
    );

    if (!incident) {
      return res
        .status(400)
        .json({ message: "Incident not found or already claimed/cleaned" });
    }

    const io = (req.app as any).locals?.io;
    if (io) {
      io.emit("incident:updated", convertIncidentUrls(incident.toObject(), req));
    }

    return res.json(convertIncidentUrls(incident.toObject(), req));
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Failed to accept incident" });
  }
};

// POST /api/incidents/:id/complete
export const completeIncident = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { id } = req.params;
    const file = (req as any).file as Express.Multer.File | undefined;
    const { imageAfterUrl: bodyImageAfterUrl } = req.body;

    if (!file && !bodyImageAfterUrl) {
      return res
        .status(400)
        .json({ message: "imageAfter file (multipart) or imageAfterUrl is required" });
    }

    let imageAfterUrl: string;
    if (bodyImageAfterUrl) {
      imageAfterUrl = bodyImageAfterUrl;
    } else if (file) {
      const stored = await saveLocalFile(file.path);
      imageAfterUrl = stored.url;
    } else {
      return res
        .status(400)
        .json({ message: "imageAfter file (multipart) or imageAfterUrl is required" });
    }

    const userId = new Types.ObjectId(req.user._id);

    const incident = await GarbageIncident.findOneAndUpdate(
      { _id: id, claimedBy: userId, status: "CLAIMED" },
      { status: "CLEANED", cleanedBy: userId, imageAfterUrl },
      { new: true }
    );

    if (!incident) {
      return res.status(400).json({
        message: "Incident not found, not claimed by you, or already cleaned"
      });
    }

    const points = 10;

    await User.findByIdAndUpdate(userId, {
      $inc: { points, totalCleaned: 1 }
    });

    await RewardTransaction.create({
      userId,
      incidentId: incident._id,
      pointsEarned: points,
      type: "CLEANING"
    });

    const io = (req.app as any).locals?.io;
    if (io) {
      io.emit("incident:updated", convertIncidentUrls(incident.toObject(), req));
    }

    return res.json({
      incident: convertIncidentUrls(incident.toObject(), req),
      pointsEarned: points
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to complete incident" });
  }
};

// POST /api/incidents/:id/decline
export const declineIncident = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { id } = req.params;

    // Simply remove from nearby list - we don't need to store declined incidents
    // The incident remains PENDING and can be seen by other users
    return res.json({ message: "Incident declined", incidentId: id });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Failed to decline incident" });
  }
};

// GET /api/incidents/my
export const getMyIncidents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = new Types.ObjectId(req.user._id);
    const incidents = await GarbageIncident.find({ claimedBy: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Convert all relative URLs to absolute URLs
    const incidentsWithAbsoluteUrls = incidents.map((incident) =>
      convertIncidentUrls(incident, req)
    );

    return res.json(incidentsWithAbsoluteUrls);
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to fetch user incidents" });
  }
};


