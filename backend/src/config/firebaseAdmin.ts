import { readFileSync } from "fs";
import path from "path";
import admin from "firebase-admin";
import { env } from "./env";

let app: admin.app.App | null = null;

export const getFirebaseAdmin = () => {
  if (app) {
    return app;
  }

  if (!env.firebaseServiceAccountPath) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH is not set");
  }

  const serviceAccountPath = path.resolve(process.cwd(), env.firebaseServiceAccountPath);
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: env.firebaseProjectId || serviceAccount.project_id
  });

  return app;
};

export const firebaseAuth = () => getFirebaseAdmin().auth();


