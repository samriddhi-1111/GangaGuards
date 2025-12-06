import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Derive a sensible default API base URL that works on real devices with Expo
export const resolveBaseURL = () => {
  const expoConfig: any = (Constants.expoConfig as any) || (Constants.manifest as any) || {};

  // 1) In Expo Go / dev, prefer inferring the host from the dev server (works best on real devices)
  const hostUri: string | undefined = expoConfig.hostUri || (Constants.manifest as any)?.hostUri;
  if (hostUri) {
    // hostUri is typically like "192.168.1.42:19000" or "192.168.1.42:8081"
    const host = hostUri.split(":")[0];
    return `http://${host}:4000`;
  }

  // 2) If explicitly provided (e.g. for production builds), use that
  const explicit: string | undefined =
    expoConfig?.extra?.apiBaseUrl ||
    (Constants.manifest as any)?.extra?.apiBaseUrl;
  if (explicit) {
    return explicit;
  }

  // 3) Fallbacks for simulators / emulators
  if (Platform.OS === "android") {
    // Android emulator special alias to host machine
    return "http://10.0.2.2:4000";
  }

  // iOS simulator / web fallback
  return "http://localhost:4000";
};

const baseURL = resolveBaseURL();
console.log("Using API base URL:", baseURL);

class ApiService {
  client = axios.create({
    baseURL: `${baseURL}/api`,
    timeout: 10000 // 10 second timeout to prevent hanging requests
  });

  constructor() {
    // Add response interceptor to handle errors globally
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle timeout errors
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          error.message = 'Request timed out. Please check your connection and try again.';
        }
        // Handle network errors
        if (error.code === 'ERR_NETWORK' || !error.response) {
          error.message = 'Network error. Please check your connection and ensure the backend is running.';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common.Authorization;
    }
  }
}

export const api = new ApiService();


