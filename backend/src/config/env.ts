import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/gangaguard",
  clientOrigin: process.env.CLIENT_ORIGIN || "*",
  storageProvider: (process.env.STORAGE_PROVIDER || "local") as "local" | "cloudinary",
  uploadsDir: process.env.UPLOADS_DIR || "uploads",
  cloudinaryUrl: process.env.CLOUDINARY_URL || "",
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./firebase-service-account.json",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "",
  baseUrl: process.env.BASE_URL || process.env.BACKEND_BASE_URL || `http://localhost:${process.env.PORT ? Number(process.env.PORT) : 4000}`,
  defaultLat: process.env.DEFAULT_LAT ? Number(process.env.DEFAULT_LAT) : 25.284342,
  defaultLng: process.env.DEFAULT_LNG ? Number(process.env.DEFAULT_LNG) : 82.790827
};


