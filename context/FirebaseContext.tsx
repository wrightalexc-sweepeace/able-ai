"use client";

import React, { createContext, useContext, ReactNode, useEffect } from "react";
import type { FirebaseStorage } from "firebase/storage";
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAI, GoogleAIBackend } from "firebase/ai";
import { getMessaging } from "firebase/messaging";

interface FirebaseContextType {
  authClient: Auth | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
  ai: any | null;
  messaging: any;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {

    const [authClient, setAuthClient] = React.useState<Auth | null>(null);
    const [messaging, setMessaging] = React.useState<any>(null);
    const [db, setDb] = React.useState<Firestore | null>(null);
    const [storage, setStorage] = React.useState<FirebaseStorage | null>(null);
    const [ai, setAi] = React.useState<any | null>(null);
    const [loading, setLoading] = React.useState(true);

useEffect(() => {
    const firebaseConfig = {
  apiKey: "AIzaSyBF7DIyylS8ByVbXxdmnmLkKpLyXSdEbQA",
  authDomain: "ableai-mvp.firebaseapp.com",
  projectId: "ableai-mvp",
  storageBucket: "ableai-mvp.firebasestorage.app",
  messagingSenderId: "697522507372",
  appId: "1:697522507372:web:7ce039897f0e597d4d9249"
};

// Agrega logs para saber si se inicia o reutiliza
let firebaseApp: FirebaseApp;

if (getApps().length === 0) {
  console.log("[Firebase] Inicializando nueva instancia...");
  firebaseApp = initializeApp(firebaseConfig);
} else {
  console.log("[Firebase] Reutilizando instancia existente.");
  firebaseApp = getApp();
}

setAuthClient(getAuth(firebaseApp));
setDb(getFirestore(firebaseApp));
setStorage(getStorage(firebaseApp));
setAi(getAI(firebaseApp, { backend: new GoogleAIBackend() }));

setMessaging(getMessaging(firebaseApp));

setLoading(false);

console.log("[Firebase] Servicios inicializados:", );


},[]);
  return (
    <FirebaseContext.Provider
      value={{
        authClient: authClient,
        db,
        storage,
        ai,
        messaging,
        loading
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error("useFirebase must be used within FirebaseProvider");
  return context;
};
