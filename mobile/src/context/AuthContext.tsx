import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import { auth } from "../services/firebase";
import { api } from "../services/api";

export type UserRole = "NORMAL_USER" | "SAFAI_KARMI" | "SANSTHA";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  points: number;
  totalCleaned: number;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signup: (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserPoints: (points: number) => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const formatName = (firebaseUser?: FirebaseUser | null, fallback?: string) => {
  if (fallback) return fallback;
  if (firebaseUser?.displayName) return firebaseUser.displayName;
  if (firebaseUser?.email) return firebaseUser.email.split("@")[0];
  return "Ganga Guardian";
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const attachToken = useCallback(async (firebaseUser: FirebaseUser) => {
    const token = await firebaseUser.getIdToken();
    api.setToken(token);
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const resp = await api.client.get("/auth/me");
      setProfile(resp.data);
      return resp.data as User;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setProfile(null);
        return null;
      }
      throw err;
    }
  }, []);

  const bootstrapProfile = useCallback(
    async (data: { name?: string; role?: UserRole; username?: string }) => {
      const resp = await api.client.post("/auth/bootstrap", data);
      setProfile(resp.data);
    },
    []
  );

  useEffect(() => {
    let mounted = true;
    let loadingState = true;

    // Safety timeout: ensure loading always resolves within 15 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted && loadingState) {
        console.warn("Auth initialization timeout - forcing loading to false");
        loadingState = false;
        setLoading(false);
      }
    }, 15000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          try {
            await attachToken(firebaseUser);
          } catch (err) {
            console.warn("Failed to attach token", err);
            // Continue anyway - user might still be able to use the app
          }

          try {
            await fetchProfile();
          } catch (err: any) {
            // Don't block the app from loading if profile fetch fails (e.g. network error)
            console.warn("Failed to fetch profile on auth state change", err);
            // If it's a network error or timeout, set profile to null so user can retry
            if (err?.code === 'ECONNABORTED' || err?.code === 'ERR_NETWORK' || err?.message?.includes('timeout')) {
              if (mounted) {
                setProfile(null);
              }
            }
          }
        } else {
          api.setToken(null);
          if (mounted) {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error("Auth state listener error", err);
        // Ensure we don't leave the app in a loading state
        if (mounted) {
          setProfile(null);
        }
      } finally {
        // Always allow the app to render, even if something failed
        if (mounted) {
          loadingState = false;
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, [attachToken, fetchProfile]);

  const signup = useCallback(async ({
    name,
    username,
    email,
    password,
    role
  }: {
    name: string;
    username: string;
    email: string;
    password: string;
    role: UserRole;
  }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await attachToken(credential.user);
    await bootstrapProfile({ name, role, username });
  }, [attachToken, bootstrapProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await attachToken(credential.user);
      const profileData = await fetchProfile();
      if (!profileData) {
        await bootstrapProfile({ name: formatName(credential.user) });
      }
    },
    [attachToken, fetchProfile, bootstrapProfile]
  );

  const logout = useCallback(async () => {
    try {
      await api.client.post("/auth/logout");
    } catch (e) {
      console.warn("Logout endpoint failed, logging out locally anyway", e);
    }
    await signOut(auth);
    api.setToken(null);
    setProfile(null);
  }, []);

  const updateUserPoints = useCallback((points: number) => {
    setProfile((prev) => {
      if (!prev) return null;
      return { ...prev, points: (prev.points || 0) + points, totalCleaned: (prev.totalCleaned || 0) + 1 };
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user: profile, loading, signup, login, logout, updateUserPoints, refreshUser: fetchProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};


