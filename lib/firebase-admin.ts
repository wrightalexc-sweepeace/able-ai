import admin, { ServiceAccount } from "firebase-admin";
import { getApps, getApp } from "firebase-admin/app";

const serviceAccountKeyString = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY_JSON;

let app;

if (!getApps().length) {
  if (!serviceAccountKeyString) {
    throw new Error(
      "FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY_JSON environment variable is not set for Firebase Admin SDK."
    );
  }
  try {
    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKeyString);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // If your Firestore is in a different project or you need to specify it for the adapter:
      // databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com` // Only if needed
    });
  } catch (e: any) {
    console.error("Failed to initialize Firebase Admin SDK:", e.message);
    throw new Error("Firebase Admin SDK initialization failed.");
  }
} else {
  app = getApp(); // Get default app if already initialized
}

// Export the default 'admin' namespace which includes admin.auth(), admin.firestore(), etc.
export default admin;