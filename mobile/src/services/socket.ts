import { io, Socket } from "socket.io-client";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Derive a sensible default API base URL that works on real devices with Expo
// (Same logic as api.ts to ensure consistency)
const resolveBaseURL = () => {
  const expoConfig: any = (Constants.expoConfig as any) || (Constants.manifest as any) || {};

  // 1) In Expo Go / dev, prefer inferring the host from the dev server
  const hostUri: string | undefined = expoConfig.hostUri || (Constants.manifest as any)?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:4000`;
  }

  // 2) If explicitly provided
  const explicit: string | undefined =
    expoConfig?.extra?.apiBaseUrl ||
    (Constants.manifest as any)?.extra?.apiBaseUrl;
  if (explicit) {
    return explicit;
  }

  // 3) Fallbacks
  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000";
  }
  return "http://localhost:4000";
};

const baseURL = resolveBaseURL();
console.log("Socket using Base URL:", baseURL);

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(baseURL, {
      transports: ["websocket"],
      autoConnect: true
    });
  }
  return socket;
};


