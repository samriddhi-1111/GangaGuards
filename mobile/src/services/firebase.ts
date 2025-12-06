import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

// Your Firebase web config adapted for React Native (analytics is web-only)
const firebaseConfig = {
  apiKey: "AIzaSyDUvjp_XZEAngshqNTXVRhxxQtbpAouTI4",
  authDomain: "project-ganga-bebb7.firebaseapp.com",
  projectId: "project-ganga-bebb7",
  storageBucket: "project-ganga-bebb7.firebasestorage.app",
  messagingSenderId: "198157623538",
  appId: "1:198157623538:web:b6496a4398e03339f2706b",
  measurementId: "G-Q7CY1FH13L"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth with React Native persistence using AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore DB (for incidents, users, rewards if we move them here)
const db = getFirestore(app);

export { app, auth, db };


