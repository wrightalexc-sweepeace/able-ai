'use client';

import { AuthProvider } from "@/context/AuthContext";
import { FirebaseProvider } from "@/context/FirebaseContext";
import RouteTracker from "@/app/components/route-tracker/RouteTracker";
import ToasterWrapper from "@/app/components/shared/ToasterWrapper";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProvider>
      <AuthProvider>
        <RouteTracker />
        <ToasterWrapper />
        {children}
      </AuthProvider>
    </FirebaseProvider>
  );
}
