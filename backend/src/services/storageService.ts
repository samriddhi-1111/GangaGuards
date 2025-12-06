import fs from "fs";
import path from "path";
import { env } from "../config/env";

// Simple abstraction to switch between local and (future) Cloudinary

export interface StoredImageInfo {
  url: string;
}

export const saveBase64Image = async (
  base64: string,
  filenamePrefix: string
): Promise<StoredImageInfo> => {
  if (env.storageProvider === "cloudinary") {
    // Placeholder: in real deployment, integrate Cloudinary SDK here.
    // For hackathon/demo, we just throw to indicate it needs configuration.
    throw new Error("Cloudinary storage not yet configured");
  }

  const buffer = Buffer.from(base64, "base64");
  const uploadsDir = path.resolve(process.cwd(), env.uploadsDir);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const filename = `${filenamePrefix}-${Date.now()}.jpg`;
  const filePath = path.join(uploadsDir, filename);
  await fs.promises.writeFile(filePath, buffer);

  // Expose via static /uploads path
  const url = `/uploads/${filename}`;
  return { url };
};

export const saveLocalFile = async (localPath: string): Promise<StoredImageInfo> => {
  if (env.storageProvider === "cloudinary") {
    // Placeholder for uploading local file to Cloudinary.
    throw new Error("Cloudinary storage not yet configured");
  }

  // localPath is already within uploads dir (multer config)
  const relative = localPath.replace(/^[\\/]*uploads[\\/]/, "");
  return { url: `/uploads/${relative}` };
};


