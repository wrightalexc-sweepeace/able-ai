"use client"; // Ensures this module runs only on the client-side

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAI, GoogleAIBackend } from "firebase/ai";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// It's STRONGLY recommended to load these from environment variables
// and ensure they are ONLY available on the client-side.
const firebaseConfig = {
  apiKey: "AIzaSyCuWx7Q7VzlY1gWRKB0NS2d_SbO3zwKZ-w",
  authDomain: "ablegigai.firebaseapp.com",
  projectId: "ablegigai",
  storageBucket: "ablegigai.firebasestorage.app",
  messagingSenderId: "16028623649",
  appId: "1:16028623649:web:5067cebb100cf7976f5460",
  measurementId: "G-B8FHZM279X"
};

// Initialize Firebase App
let firebaseApp: FirebaseApp;

// Check if Firebase has already been initialized
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp(); // If already initialized, use that app
}

// Initialize Firebase services
const authClient: Auth = getAuth(firebaseApp);
const db: Firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
// Initialize the Gemini Developer API backend service
const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

export const messaging = () => getMessaging(firebaseApp);

export { firebaseApp, authClient, storage, firebaseConfig, ai, db };


