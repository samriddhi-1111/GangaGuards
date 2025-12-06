import { Response, Request } from "express";
import { User, UserRole } from "../models/User";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

const formatUserResponse = (user: any) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
  points: user.points,
  totalCleaned: user.totalCleaned,
  profileImageUrl: user.profileImageUrl
});

export const bootstrapUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.firebaseUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { role, name, username } = req.body;
    const firebaseUid =
      req.firebaseUser.uid || req.firebaseUser.user_id || req.firebaseUser.sub;
    const email = req.firebaseUser.email;

    if (!firebaseUid) {
      return res.status(400).json({ message: "Firebase UID missing on token" });
    }

    if (!email) {
      return res.status(400).json({ message: "Email is required on Firebase user" });
    }

    const preferredName =
      name || req.firebaseUser.name || email?.split("@")[0] || "Ganga Guardian";
    const normalizedRole: UserRole = role || "NORMAL_USER";
    const preferredUsername =
      typeof username === "string" && username.trim().length > 0
        ? username.trim().toLowerCase()
        : email?.split("@")[0];

    // Enforce username uniqueness if provided
    if (preferredUsername) {
      const existingUsernameUser = await User.findOne({
        username: preferredUsername
      });
      if (existingUsernameUser && existingUsernameUser.firebaseUid !== firebaseUid) {
        return res.status(409).json({ message: "Username already taken. Please choose another." });
      }
    }

    // Check for email conflict (e.g. user deleted in Firebase but not in Mongo)
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser && existingEmailUser.firebaseUid !== firebaseUid) {
      return res.status(409).json({ message: "This email is already registered with a different account. Please contact support or try a different email." });
    }

    let user = await User.findOne({ firebaseUid });

    if (!user) {
      user = await User.create({
        firebaseUid,
        email,
        name: preferredName,
        username: preferredUsername,
        role: normalizedRole,
        lastLogin: new Date()
      });
    } else {
      const updates: any = {};
      updates.lastLogin = new Date(); // Always update login time

      if (name && name !== user.name) {
        updates.name = name;
      }
      if (role && role !== user.role) {
        updates.role = role;
      }
      if (
        preferredUsername &&
        preferredUsername !== user.username
      ) {
        updates.username = preferredUsername;
      }
      if (Object.keys(updates).length > 0) {
        user = await User.findByIdAndUpdate(user._id, { $set: updates }, { new: true });
      }
    }

    return res.json(formatUserResponse(user));
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Failed to bootstrap user" });
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(404).json({ message: "User profile not found. Please complete setup." });
  }

  return res.json(formatUserResponse(req.user));
};

import { saveLocalFile } from "../services/storageService";

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name } = req.body;
    const file = (req as any).file as Express.Multer.File | undefined;
    const userId = req.user._id;

    const updates: any = {};
    if (name) updates.name = name;

    if (file) {
      const stored = await saveLocalFile(file.path);
      updates.profileImageUrl = stored.url;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(formatUserResponse(updatedUser));
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Failed to update profile" });
  }
};

import { firebaseAuth } from "../config/firebaseAdmin";

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { username, email, newPassword } = req.body;

    if (!username || !email || !newPassword) {
      return res.status(400).json({ message: "Username, email, and new password are required" });
    }

    // Verify user identity strictly
    const user = await User.findOne({
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase()
    });

    if (!user) {
      return res.status(404).json({ message: "No user found with matching username and email." });
    }

    if (!user.firebaseUid) {
      return res.status(500).json({ message: "User record corrupted (missing UID)." });
    }

    // Admin reset
    await firebaseAuth().updateUser(user.firebaseUid, {
      password: newPassword
    });

    return res.json({ message: "Password updated successfully. Please login with your new password." });
  } catch (err: any) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ message: err.message || "Failed to reset password" });
  }
};

export const logoutUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(200).send(); // Already effectively logged out from server POV
    }

    await User.findByIdAndUpdate(req.user._id, {
      $set: { lastLogout: new Date() }
    });

    return res.status(200).json({ message: "Logout recorded" });

  } catch (err) {
    console.error("Logout Error:", err);
    return res.status(500).json({ message: "Logout failed" });
  }
};
