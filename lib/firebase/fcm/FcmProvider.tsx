'use client';
import { useEffect } from "react";
import useFCMToken from "./useFCMToken";
import { onMessage } from "firebase/messaging";
import { toast } from "sonner";
import { messaging } from "../clientApp";

const FcmProvider = ({ children }: { children: React.ReactNode }) => {
  const fcmToken = useFCMToken();
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const fcmmessaging = messaging();
      const unsubscribe = onMessage(fcmmessaging, (payload) => {
        toast.info(payload.notification?.title, {icon: payload.notification?.icon, description: payload.notification?.body});
      });
      return () => unsubscribe();
    }
  }, [fcmToken]);

  return <>{children}</>
};

export default FcmProvider;
