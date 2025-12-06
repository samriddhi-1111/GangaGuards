import { Request, Response, NextFunction } from "express";
import { User, IUser } from "../models/User";

export interface DecodedFirebaseIdToken {
  uid?: string;
  user_id?: string;
  sub?: string;
  email?: string;
  name?: string;
  [key: string]: any;
}

export interface AuthenticatedRequest extends Request {
  firebaseUser?: DecodedFirebaseIdToken;
  user?: IUser | null;
}

// NOTE: For local hackathon use we parse the Firebase ID token on the server
// without verifying the signature. This is NOT secure for production but
// avoids needing firebase-service-account.json configuration.
const decodeJwtWithoutVerify = (token: string): DecodedFirebaseIdToken => {
  const parts = token.split(".");
  if (parts.length < 2) {
    throw new Error("Malformed token");
  }
  const payload = Buffer.from(parts[1], "base64").toString("utf8");
  return JSON.parse(payload);
};

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = decodeJwtWithoutVerify(token);
    req.firebaseUser = decoded;

    const uid = decoded.uid || decoded.user_id || decoded.sub;
    if (uid) {
      const userDoc = await User.findOne({ firebaseUid: uid });
      req.user = userDoc;
    }

    next();
  } catch (error) {
    console.error("authMiddleware error", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


